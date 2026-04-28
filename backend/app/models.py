import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Role(str, enum.Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"
    secretariat = "secretariat"
    maintenance = "maintenance"


class Part(str, enum.Enum):
    theory = "theory"
    lab = "lab"


class AssessmentCategory(str, enum.Enum):
    assignment = "Assignment"
    quiz = "Quiz"
    midterm = "Midterm"
    final = "Final"
    project = "Project"


class WorkflowStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    denied = "denied"
    fixed = "fixed"


class Campus(Base):
    __tablename__ = "campuses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)


class Program(Base):
    __tablename__ = "programs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    min_credit_hours: Mapped[int] = mapped_column(Integer, default=130)


class CampusProgram(Base):
    __tablename__ = "campus_programs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campus_id: Mapped[int] = mapped_column(ForeignKey("campuses.id", ondelete="CASCADE"))
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id", ondelete="CASCADE"))

    __table_args__ = (UniqueConstraint("campus_id", "program_id", name="uq_campus_program"),)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    roll_number: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role))
    campus_id: Mapped[int] = mapped_column(ForeignKey("campuses.id"))

    full_name: Mapped[str] = mapped_column(String(120))
    gender: Mapped[str] = mapped_column(String(30))
    dob: Mapped[date] = mapped_column(Date)
    cnic: Mapped[str] = mapped_column(String(25), unique=True)
    nationality: Mapped[str] = mapped_column(String(60))
    email: Mapped[str] = mapped_column(String(180), unique=True)
    phone_number: Mapped[str] = mapped_column(String(40))

    campus: Mapped[Campus] = relationship()
    student_profile: Mapped["StudentProfile"] = relationship(back_populates="student", uselist=False)


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    batch: Mapped[str] = mapped_column(String(40))
    current_semester: Mapped[int] = mapped_column(Integer, default=1)
    section: Mapped[str] = mapped_column(String(10))
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)

    student: Mapped[User] = relationship(back_populates="student_profile")
    program: Mapped[Program] = relationship()


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    title: Mapped[str] = mapped_column(String(180))
    semester: Mapped[int] = mapped_column(Integer)
    credits: Mapped[int] = mapped_column(Integer)
    has_lab: Mapped[bool] = mapped_column(Boolean, default=False)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))


class CoursePrerequisite(Base):
    __tablename__ = "course_prerequisites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    prerequisite_course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    __table_args__ = (UniqueConstraint("course_id", "prerequisite_course_id", name="uq_course_prereq"),)


class Term(Base):
    __tablename__ = "terms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    registration_open: Mapped[bool] = mapped_column(Boolean, default=False)
    feedback_mid_open: Mapped[bool] = mapped_column(Boolean, default=False)
    feedback_end_open: Mapped[bool] = mapped_column(Boolean, default=False)


class CourseOffering(Base):
    __tablename__ = "course_offerings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    term_id: Mapped[int] = mapped_column(ForeignKey("terms.id", ondelete="CASCADE"))
    campus_id: Mapped[int] = mapped_column(ForeignKey("campuses.id"))
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    section: Mapped[str] = mapped_column(String(10))
    part: Mapped[Part] = mapped_column(Enum(Part))
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    __table_args__ = (
        UniqueConstraint("term_id", "campus_id", "course_id", "section", "part", name="uq_course_offering"),
    )


class Enrollment(Base):
    __tablename__ = "enrollments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    term_id: Mapped[int] = mapped_column(ForeignKey("terms.id", ondelete="CASCADE"))
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    section: Mapped[str] = mapped_column(String(10))
    include_lab: Mapped[bool] = mapped_column(Boolean, default=False)

    __table_args__ = (UniqueConstraint("term_id", "student_id", "course_id", name="uq_student_term_course"),)


class AssessmentTemplate(Base):
    __tablename__ = "assessment_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    offering_id: Mapped[int] = mapped_column(ForeignKey("course_offerings.id", ondelete="CASCADE"))
    category: Mapped[AssessmentCategory] = mapped_column(Enum(AssessmentCategory))
    title: Mapped[str] = mapped_column(String(120))
    weightage: Mapped[float] = mapped_column(Float)
    total_marks: Mapped[float] = mapped_column(Float)


class AssessmentScore(Base):
    __tablename__ = "assessment_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("assessment_templates.id", ondelete="CASCADE"))
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    obtained_marks: Mapped[float] = mapped_column(Float)

    __table_args__ = (UniqueConstraint("assessment_id", "student_id", name="uq_assessment_student"),)


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    offering_id: Mapped[int] = mapped_column(ForeignKey("course_offerings.id", ondelete="CASCADE"))
    class_date: Mapped[date] = mapped_column(Date)
    __table_args__ = (UniqueConstraint("offering_id", "class_date", name="uq_offering_date"),)


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("attendance_sessions.id", ondelete="CASCADE"))
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    present: Mapped[bool] = mapped_column(Boolean)
    __table_args__ = (UniqueConstraint("session_id", "student_id", name="uq_session_student"),)


class TranscriptTerm(Base):
    __tablename__ = "transcript_terms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    term_id: Mapped[int] = mapped_column(ForeignKey("terms.id", ondelete="CASCADE"))
    sgpa: Mapped[float] = mapped_column(Float)
    cgpa: Mapped[float] = mapped_column(Float)
    __table_args__ = (UniqueConstraint("student_id", "term_id", name="uq_student_transcript_term"),)


class TranscriptEntry(Base):
    __tablename__ = "transcript_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    transcript_term_id: Mapped[int] = mapped_column(ForeignKey("transcript_terms.id", ondelete="CASCADE"))
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    grade: Mapped[str] = mapped_column(String(5))
    credits: Mapped[int] = mapped_column(Integer)


class AutomationRun(Base):
    __tablename__ = "automation_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    term_id: Mapped[int] = mapped_column(ForeignKey("terms.id", ondelete="CASCADE"))
    campus_id: Mapped[int] = mapped_column(ForeignKey("campuses.id"))
    run_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    note: Mapped[str] = mapped_column(Text, default="")


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campus_id: Mapped[int] = mapped_column(ForeignKey("campuses.id"), index=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    classroom: Mapped[str] = mapped_column(String(50))
    problem: Mapped[str] = mapped_column(Text)
    status: Mapped[WorkflowStatus] = mapped_column(Enum(WorkflowStatus), default=WorkflowStatus.pending)
    resolved_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ExtraClassRequest(Base):
    __tablename__ = "extra_class_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campus_id: Mapped[int] = mapped_column(ForeignKey("campuses.id"), index=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    section: Mapped[str] = mapped_column(String(10))
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[WorkflowStatus] = mapped_column(Enum(WorkflowStatus), default=WorkflowStatus.pending)
    decided_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    schedule_note: Mapped[str | None] = mapped_column(String(160), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)