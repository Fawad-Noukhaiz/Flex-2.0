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

