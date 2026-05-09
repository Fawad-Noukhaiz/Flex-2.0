from datetime import date
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginIn(BaseModel):
    roll_number: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    roll_number: str
    role: str
    campus_id: int
    full_name: str
    gender: str
    dob: date
    cnic: str
    nationality: str
    email: EmailStr
    phone_number: str


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserUpdate(BaseModel):
    roll_number: str | None = None
    role: str | None = None
    campus_id: int | None = None
    full_name: str | None = None
    gender: str | None = None
    dob: date | None = None
    cnic: str | None = None
    nationality: str | None = None
    email: EmailStr | None = None
    phone_number: str | None = None


class UserOut(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class StudentProfileUpsert(BaseModel):
    program_id: int
    batch: str
    current_semester: int = Field(ge=1, le=8)
    section: str
    is_current: bool = True


class EligibleCourseOut(BaseModel):
    course_id: int
    code: str
    title: str
    semester: int
    credits: int
    has_lab: bool


class EnrollmentCreate(BaseModel):
    term_id: int
    student_id: int
    course_id: int
    section: str
    include_lab: bool = False


class AssessmentTemplateCreate(BaseModel):
    offering_id: int
    category: str
    title: str
    weightage: float = Field(gt=0, le=100)
    total_marks: float = Field(gt=0)


class AssessmentScoreUpsert(BaseModel):
    assessment_id: int
    student_id: int
    obtained_marks: float = Field(ge=0)


class AttendanceSessionCreate(BaseModel):
    offering_id: int
    class_date: date


class AttendanceRecordUpsert(BaseModel):
    session_id: int
    student_id: int
    present: bool


class FinalizeIn(BaseModel):
    term_id: int


class MaintenanceRequestCreate(BaseModel):
    classroom: str
    problem: str


class MaintenanceRequestUpdate(BaseModel):
    status: Literal["pending", "fixed"]


class ExtraClassRequestCreate(BaseModel):
    course_id: int
    section: str
    reason: str


class ExtraClassRequestUpdate(BaseModel):
    status: Literal["pending", "approved", "denied"]
    schedule_note: str | None = None


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class CourseOfferingCreate(BaseModel):
    term_id: int
    course_id: int
    section: str
    part: Literal["theory", "lab"]
    teacher_id: int


class TermWindowsUpdate(BaseModel):
    registration_open: bool | None = None
    start_date: date | None = None
    end_date: date | None = None
    feedback_mid_open: bool | None = None
    feedback_end_open: bool | None = None
    retake_open: bool | None = None


class TranscriptEntryUpsert(BaseModel):
    student_id: int
    term_name: str
    course_id: int
    grade: str
    credits: int = Field(gt=0)


class RequestDecisionUpdate(BaseModel):
    status: Literal["pending", "approved", "denied"]
    teacher_response: str | None = None


class MarksChangeRequestCreate(BaseModel):
    course_id: int
    part: Literal["theory", "lab"]
    component: str
    reason: str


class AttendanceChangeRequestCreate(BaseModel):
    course_id: int
    part: Literal["theory", "lab"]
    class_date: date
    reason: str


class CourseRequestCreate(BaseModel):
    course_id: int
    reason: str


class RetakeRequestCreate(CourseRequestCreate):
    evidence: str


class FeedbackSubmissionCreate(BaseModel):
    course_id: int
    phase: Literal["Mid", "End"]
    concept_delivery: int = Field(ge=1, le=5)
    teacher_engagement: int = Field(ge=1, le=5)
    open_text: str
