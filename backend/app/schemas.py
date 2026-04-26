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