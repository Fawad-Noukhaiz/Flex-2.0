from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import and_, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine, get_db
from .deps import get_current_user, require_admin
from .models import (
    AssessmentCategory,
    AssessmentScore,
    AssessmentTemplate,
    AttendanceRecord,
    AttendanceSession,
    Campus,
    CampusProgram,
    Course,
    CourseOffering,
    CoursePrerequisite,
    Enrollment,
    ExtraClassRequest,
    MaintenanceRequest,
    Program,
    Part,
    Role,
    StudentProfile,
    Term,
    TranscriptEntry,
    TranscriptTerm,
    User,
    WorkflowStatus,
)
from .schemas import (
    AssessmentScoreUpsert,
    AssessmentTemplateCreate,
    AttendanceRecordUpsert,
    AttendanceSessionCreate,
    EligibleCourseOut,
    EnrollmentCreate,
    ExtraClassRequestCreate,
    ExtraClassRequestUpdate,
    FinalizeIn,
    LoginIn,
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate,
    StudentProfileUpsert,
    TokenOut,
    UserCreate,
    UserOut,
    UserUpdate,
)
from .security import create_access_token, hash_password, verify_password
from .seed import seed_initial_data

app = FastAPI(title="Flex 2.0 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    user = db.scalar(select(User).where(User.roll_number == payload.roll_number))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid roll number or password")
    token = create_access_token(str(user.id), user.role.value, user.campus_id)
    return TokenOut(access_token=token)


@app.get("/users", response_model=list[UserOut])
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[User]:
    return list(db.scalars(select(User).where(User.campus_id == admin.campus_id)).all())


@app.post("/users", response_model=UserOut)
def create_user(payload: UserCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> User:
    try:
        role = Role(payload.role)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid role") from exc

    if role == Role.admin:
        raise HTTPException(status_code=400, detail="Admin accounts are fixed")
    if payload.campus_id != admin.campus_id:
        raise HTTPException(status_code=403, detail="Campus mismatch")
    user = User(**payload.model_dump(exclude={"password", "role"}), role=role, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Roll number, CNIC, or email already exists") from exc
    db.refresh(user)
    return user


@app.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == Role.admin:
        raise HTTPException(status_code=400, detail="Admin account cannot be edited here")
    if user.campus_id != admin.campus_id:
        raise HTTPException(status_code=403, detail="Campus mismatch")
    values = payload.model_dump(exclude_none=True)
    if values.get("role") == Role.admin.value:
        raise HTTPException(status_code=400, detail="Cannot promote to admin")
    if values.get("campus_id") is not None and values["campus_id"] != admin.campus_id:
        raise HTTPException(status_code=403, detail="Campus mismatch")
    for key, value in values.items():
        if key == "role":
            try:
                value = Role(value)
            except ValueError as exc:
                raise HTTPException(status_code=400, detail="Invalid role") from exc
        setattr(user, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Roll number, CNIC, or email already exists") from exc
    db.refresh(user)
    return user

@app.put("/students/{student_id}/profile")
def upsert_student_profile(
    student_id: int,
    payload: StudentProfileUpsert,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    student = db.get(User, student_id)
    if not student or student.role != Role.student:
        raise HTTPException(status_code=404, detail="Student not found")
    if student.campus_id != admin.campus_id:
        raise HTTPException(status_code=403, detail="Campus mismatch")

    allowed = db.scalar(
        select(CampusProgram).where(
            and_(CampusProgram.campus_id == student.campus_id, CampusProgram.program_id == payload.program_id)
        )
    )
    if not allowed:
        raise HTTPException(status_code=400, detail="Program not offered in this campus")

    profile = db.scalar(select(StudentProfile).where(StudentProfile.student_id == student_id))
    if not profile:
        profile = StudentProfile(student_id=student_id, **payload.model_dump())
        db.add(profile)
    else:
        for key, value in payload.model_dump().items():
            setattr(profile, key, value)
    db.commit()
    return {"status": "updated"}


@app.get("/students/{student_id}/eligible-courses", response_model=list[EligibleCourseOut])
def eligible_courses(student_id: int, term_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    if current.role not in (Role.admin, Role.student):
        raise HTTPException(status_code=403, detail="Not allowed")
    if current.role == Role.student and current.id != student_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    student = db.get(User, student_id)
    profile = db.scalar(select(StudentProfile).where(StudentProfile.student_id == student_id))
    if not student or not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if current.role == Role.admin and student.campus_id != current.campus_id:
        raise HTTPException(status_code=403, detail="Campus mismatch")

    passed = set(
        db.scalars(
            select(TranscriptEntry.course_id)
            .join(TranscriptTerm, TranscriptEntry.transcript_term_id == TranscriptTerm.id)
            .where(and_(TranscriptTerm.student_id == student_id, TranscriptEntry.grade.in_(["A+", "A", "A-", "B+", "B", "B-", "C+", "C"])))
        ).all()
    )

    enrolled = set(
        db.scalars(select(Enrollment.course_id).where(and_(Enrollment.term_id == term_id, Enrollment.student_id == student_id))).all()
    )

    campus_program = db.scalar(
        select(CampusProgram).where(
            and_(CampusProgram.campus_id == student.campus_id, CampusProgram.program_id == profile.program_id)
        )
    )
    if not campus_program:
        return []

    courses = db.scalars(
        select(Course).where(and_(Course.program_id == profile.program_id, Course.semester == profile.current_semester))
    ).all()

    results = []
    for course in courses:
        if course.id in enrolled:
            continue
        prereqs = db.scalars(select(CoursePrerequisite.prerequisite_course_id).where(CoursePrerequisite.course_id == course.id)).all()
        if any(prereq not in passed for prereq in prereqs):
            continue
        results.append(
            EligibleCourseOut(
                course_id=course.id,
                code=course.code,
                title=course.title,
                semester=course.semester,
                credits=course.credits,
                has_lab=course.has_lab,
            )
        )
    return results


@app.post("/enrollments")
def create_enrollment(payload: EnrollmentCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    student = db.get(User, payload.student_id)
    course = db.get(Course, payload.course_id)
    if not student or not course:
        raise HTTPException(status_code=404, detail="Student or course not found")
    if student.campus_id != admin.campus_id:
        raise HTTPException(status_code=403, detail="Campus mismatch")
    if payload.include_lab and not course.has_lab:
        raise HTTPException(status_code=400, detail="Lab not available for this course")

    profile = db.scalar(select(StudentProfile).where(StudentProfile.student_id == student.id))
    if not profile or profile.program_id != course.program_id or profile.current_semester != course.semester:
        raise HTTPException(status_code=400, detail="Course not valid for student's current semester/program")

    passed = set(
        db.scalars(
            select(TranscriptEntry.course_id)
            .join(TranscriptTerm, TranscriptEntry.transcript_term_id == TranscriptTerm.id)
            .where(
                and_(
                    TranscriptTerm.student_id == payload.student_id,
                    TranscriptEntry.grade.in_(["A+", "A", "A-", "B+", "B", "B-", "C+", "C"]),
                )
            )
        ).all()
    )
    prereqs = db.scalars(select(CoursePrerequisite.prerequisite_course_id).where(CoursePrerequisite.course_id == course.id)).all()
    if any(prereq not in passed for prereq in prereqs):
        raise HTTPException(status_code=400, detail="Prerequisites not satisfied")

    exists = db.scalar(
        select(Enrollment).where(
            and_(Enrollment.term_id == payload.term_id, Enrollment.student_id == payload.student_id, Enrollment.course_id == payload.course_id)
        )
    )
    if exists:
        raise HTTPException(status_code=400, detail="Already enrolled")

    enrollment = Enrollment(**payload.model_dump())
    db.add(enrollment)
    db.commit()
    return {"status": "enrolled"}
