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

@app.post("/assessments")
def create_assessment(payload: AssessmentTemplateCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != Role.teacher:
        raise HTTPException(status_code=403, detail="Teacher only")
    offering = db.get(CourseOffering, payload.offering_id)
    if not offering or offering.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Offering not assigned to teacher")

    current_weight = db.scalar(
        select(func.coalesce(func.sum(AssessmentTemplate.weightage), 0.0)).where(AssessmentTemplate.offering_id == payload.offering_id)
    )
    if float(current_weight) + payload.weightage > 100.0:
        raise HTTPException(status_code=400, detail="Total weightage cannot exceed 100")

    try:
        category = AssessmentCategory(payload.category)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid assessment category") from exc

    template = AssessmentTemplate(
        offering_id=payload.offering_id,
        category=category,
        title=payload.title,
        weightage=payload.weightage,
        total_marks=payload.total_marks,
    )
    db.add(template)
    db.commit()
    return {"status": "created", "assessment_id": template.id}


@app.post("/assessment-scores")
def upsert_assessment_score(payload: AssessmentScoreUpsert, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != Role.teacher:
        raise HTTPException(status_code=403, detail="Teacher only")
    assessment = db.get(AssessmentTemplate, payload.assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    offering = db.get(CourseOffering, assessment.offering_id)
    if not offering or offering.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Offering not assigned to teacher")
    enrollment = db.scalar(
        select(Enrollment).where(
            and_(
                Enrollment.term_id == offering.term_id,
                Enrollment.student_id == payload.student_id,
                Enrollment.course_id == offering.course_id,
                Enrollment.section == offering.section,
            )
        )
    )
    if not enrollment:
        raise HTTPException(status_code=400, detail="Student not enrolled in this offering")
    if offering.part.value == "lab" and not enrollment.include_lab:
        raise HTTPException(status_code=400, detail="Student is not enrolled in lab component")
    if payload.obtained_marks > assessment.total_marks:
        raise HTTPException(status_code=400, detail="Obtained marks cannot exceed total marks")

    record = db.scalar(
        select(AssessmentScore).where(
            and_(AssessmentScore.assessment_id == payload.assessment_id, AssessmentScore.student_id == payload.student_id)
        )
    )
    if not record:
        db.add(AssessmentScore(**payload.model_dump()))
    else:
        record.obtained_marks = payload.obtained_marks
    db.commit()
    return {"status": "saved"}


@app.post("/attendance-sessions")
def create_attendance_session(payload: AttendanceSessionCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != Role.teacher:
        raise HTTPException(status_code=403, detail="Teacher only")
    offering = db.get(CourseOffering, payload.offering_id)
    if not offering or offering.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Offering not assigned to teacher")
    exists = db.scalar(
        select(AttendanceSession).where(
            and_(AttendanceSession.offering_id == payload.offering_id, AttendanceSession.class_date == payload.class_date)
        )
    )
    if exists:
        raise HTTPException(status_code=400, detail="Session already exists for this date")
    session = AttendanceSession(**payload.model_dump())
    db.add(session)
    db.commit()
    return {"status": "created", "session_id": session.id}


@app.post("/attendance-records")
def upsert_attendance(payload: AttendanceRecordUpsert, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != Role.teacher:
        raise HTTPException(status_code=403, detail="Teacher only")
    session = db.get(AttendanceSession, payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    offering = db.get(CourseOffering, session.offering_id)
    if not offering or offering.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    enrollment = db.scalar(
        select(Enrollment).where(
            and_(
                Enrollment.term_id == offering.term_id,
                Enrollment.student_id == payload.student_id,
                Enrollment.course_id == offering.course_id,
                Enrollment.section == offering.section,
            )
        )
    )
    if not enrollment:
        raise HTTPException(status_code=400, detail="Student not enrolled in this offering")
    if offering.part.value == "lab" and not enrollment.include_lab:
        raise HTTPException(status_code=400, detail="Student is not enrolled in lab component")
    row = db.scalar(
        select(AttendanceRecord).where(
            and_(AttendanceRecord.session_id == payload.session_id, AttendanceRecord.student_id == payload.student_id)
        )
    )
    if not row:
        db.add(AttendanceRecord(**payload.model_dump()))
    else:
        row.present = payload.present
    db.commit()
    return {"status": "saved"}


@app.post("/teacher/maintenance-requests")
def create_maintenance_request(
    payload: MaintenanceRequestCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != Role.teacher:
        raise HTTPException(status_code=403, detail="Teacher only")
    row = MaintenanceRequest(
        campus_id=user.campus_id,
        teacher_id=user.id,
        classroom=payload.classroom,
        problem=payload.problem,
        status=WorkflowStatus.pending,
    )
    db.add(row)
    db.commit()
    return {"status": "created", "request_id": row.id}


@app.get("/maintenance/requests")
def list_maintenance_requests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != Role.maintenance:
        raise HTTPException(status_code=403, detail="Maintenance role required")
    rows = db.scalars(
        select(MaintenanceRequest).where(MaintenanceRequest.campus_id == user.campus_id).order_by(MaintenanceRequest.created_at.desc())
    ).all()
    return [
        {
            "id": row.id,
            "campus_id": row.campus_id,
            "teacher_id": row.teacher_id,
            "classroom": row.classroom,
            "problem": row.problem,
            "status": row.status.value,
            "created_at": row.created_at,
            "resolved_by_id": row.resolved_by_id,
        }
        for row in rows
    ]


@app.put("/maintenance/requests/{request_id}")
def update_maintenance_request(
    request_id: int,
    payload: MaintenanceRequestUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != Role.maintenance:
        raise HTTPException(status_code=403, detail="Maintenance role required")
    req = db.get(MaintenanceRequest, request_id)
    if not req or req.campus_id != user.campus_id:
        raise HTTPException(status_code=404, detail="Request not found")
    try:
        req.status = WorkflowStatus(payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid status") from exc
    if req.status == WorkflowStatus.fixed:
        req.resolved_by_id = user.id
    db.commit()
    return {"status": "updated"}


@app.post("/teacher/extra-class-requests")
def create_extra_class_request(
    payload: ExtraClassRequestCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != Role.teacher:
        raise HTTPException(status_code=403, detail="Teacher only")
    course = db.get(Course, payload.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    row = ExtraClassRequest(
        campus_id=user.campus_id,
        teacher_id=user.id,
        course_id=payload.course_id,
        section=payload.section,
        reason=payload.reason,
        status=WorkflowStatus.pending,
    )
    db.add(row)
    db.commit()
    return {"status": "created", "request_id": row.id}


@app.get("/secretariat/extra-class-requests")
def list_extra_class_requests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != Role.secretariat:
        raise HTTPException(status_code=403, detail="Secretariat role required")
    rows = db.scalars(
        select(ExtraClassRequest).where(ExtraClassRequest.campus_id == user.campus_id).order_by(ExtraClassRequest.created_at.desc())
    ).all()
    return [
        {
            "id": row.id,
            "campus_id": row.campus_id,
            "teacher_id": row.teacher_id,
            "course_id": row.course_id,
            "section": row.section,
            "reason": row.reason,
            "status": row.status.value,
            "schedule_note": row.schedule_note,
            "created_at": row.created_at,
            "decided_by_id": row.decided_by_id,
        }
        for row in rows
    ]


@app.put("/secretariat/extra-class-requests/{request_id}")
def update_extra_class_request(
    request_id: int,
    payload: ExtraClassRequestUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != Role.secretariat:
        raise HTTPException(status_code=403, detail="Secretariat role required")
    req = db.get(ExtraClassRequest, request_id)
    if not req or req.campus_id != user.campus_id:
        raise HTTPException(status_code=404, detail="Request not found")
    try:
        req.status = WorkflowStatus(payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid status") from exc
    req.schedule_note = payload.schedule_note
    req.decided_by_id = user.id
    db.commit()
    return {"status": "updated"}


def _grade_from_percent(percent: float) -> str:
    if percent >= 86:
        return "A"
    if percent >= 82:
        return "A-"
    if percent >= 78:
        return "B+"
    if percent >= 74:
        return "B"
    if percent >= 70:
        return "B-"
    if percent >= 66:
        return "C+"
    if percent >= 62:
        return "C"
    if percent >= 58:
        return "C-"
    if percent >= 50:
        return "D"
    return "F"


@app.post("/automation/finalize")
def finalize_semester(payload: FinalizeIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    term = db.get(Term, payload.term_id)
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")

    campus_students = db.scalars(
        select(User).where(and_(User.role == Role.student, User.campus_id == admin.campus_id))
    ).all()

    grade_points = {"A+": 4, "A": 4, "A-": 3.67, "B+": 3.33, "B": 3, "B-": 2.67, "C+": 2.33, "C": 2, "C-": 1.67, "D": 1, "F": 0}

    finalized = 0
    for student in campus_students:
        enrollments = db.scalars(
            select(Enrollment).where(and_(Enrollment.term_id == term.id, Enrollment.student_id == student.id))
        ).all()
        if not enrollments:
            continue

        course_grade_rows = []
        can_finalize = True
        for enrollment in enrollments:
            offerings = db.scalars(
                select(CourseOffering).where(
                    and_(
                        CourseOffering.term_id == term.id,
                        CourseOffering.course_id == enrollment.course_id,
                        CourseOffering.section == enrollment.section,
                    )
                )
            ).all()

            relevant_offering_ids = [
                o.id
                for o in offerings
                if o.part == Part.theory or (enrollment.include_lab and o.part == Part.lab)
            ]
            if not relevant_offering_ids:
                can_finalize = False
                break

            assessments = db.scalars(
                select(AssessmentTemplate).where(AssessmentTemplate.offering_id.in_(relevant_offering_ids))
            ).all()
            final_assessments = [a for a in assessments if a.category == AssessmentCategory.final]
            if not final_assessments:
                can_finalize = False
                break

            score_map = {
                score.assessment_id: score.obtained_marks
                for score in db.scalars(
                    select(AssessmentScore).where(
                        and_(
                            AssessmentScore.student_id == student.id,
                            AssessmentScore.assessment_id.in_([a.id for a in assessments]),
                        )
                    )
                ).all()
            }

            if any(final.id not in score_map for final in final_assessments):
                can_finalize = False
                break

            total_weight = sum(a.weightage for a in assessments)
            if total_weight <= 0:
                can_finalize = False
                break
            obtained_weight = 0.0
            for a in assessments:
                score = score_map.get(a.id, 0.0)
                obtained_weight += (score / a.total_marks) * a.weightage if a.total_marks > 0 else 0
            percent = (obtained_weight / total_weight) * 100
            course = db.get(Course, enrollment.course_id)
            course_grade_rows.append((course, _grade_from_percent(percent)))

        if not can_finalize:
            continue

        existing_tt = db.scalar(
            select(TranscriptTerm).where(
                and_(TranscriptTerm.student_id == student.id, TranscriptTerm.term_id == term.id)
            )
        )
        if existing_tt:
            continue

        tt = TranscriptTerm(student_id=student.id, term_id=term.id, sgpa=0, cgpa=0)
        db.add(tt)
        db.flush()
        total_credits = 0
        total_points = 0.0
        for course, grade in course_grade_rows:
            db.add(TranscriptEntry(transcript_term_id=tt.id, course_id=course.id, grade=grade, credits=course.credits))
            total_credits += course.credits
            total_points += grade_points[grade] * course.credits

        sgpa = total_points / total_credits if total_credits else 0.0
        prior_entries = db.scalars(
            select(TranscriptEntry)
            .join(TranscriptTerm, TranscriptEntry.transcript_term_id == TranscriptTerm.id)
            .where(
                and_(
                    TranscriptTerm.student_id == student.id,
                    TranscriptTerm.id != tt.id,
                )
            )
        ).all()
        prior_quality_points = 0.0
        prior_credits = 0
        for entry in prior_entries:
            prior_quality_points += grade_points.get(entry.grade, 0) * entry.credits
            prior_credits += entry.credits
        cgpa = (prior_quality_points + total_points) / (prior_credits + total_credits) if (prior_credits + total_credits) else 0.0
        tt.sgpa = round(sgpa, 2)
        tt.cgpa = round(cgpa, 2)

        profile = db.scalar(select(StudentProfile).where(StudentProfile.student_id == student.id))
        if profile:
            profile.current_semester = min(8, profile.current_semester + 1)

        for enrollment in enrollments:
            db.delete(enrollment)
        finalized += 1

    db.commit()
    return {"status": "completed", "finalized_students": finalized}
