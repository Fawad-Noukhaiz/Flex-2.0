from datetime import date

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from .models import (
    Campus,
    CampusProgram,
    Course,
    CourseOffering,
    CoursePrerequisite,
    Enrollment,
    Part,
    Program,
    Role,
    StudentProfile,
    Term,
    TranscriptEntry,
    TranscriptTerm,
    User,
)
from .security import hash_password


PROGRAMS_BY_CAMPUS = {
    "Karachi": [
        "Bachelor of Science (Artificial Intelligence)",
        "Bachelor of Science (Business Analytics)",
        "Bachelor of Science (Computer Engineering)",
        "Bachelor of Science (Computer Science)",
        "Bachelor of Science (Cyber Security)",
        "Bachelor of Science (Data Science)",
        "Bachelor of Science (Electrical Engineering)",
        "Bachelor of Science (Financial Technology)",
        "Bachelor of Science (Software Engineering)",
    ],
    "Lahore": [
        "Bachelor of Business Administration",
        "Bachelor of Science (Accounting and Finance)",
        "Bachelor of Science (Artificial Intelligence)",
        "Bachelor of Science (Business Analytics)",
        "Bachelor of Science (Civil Engineering)",
        "Bachelor of Science (Computer Science)",
        "Bachelor of Science (Cyber Security)",
        "Bachelor of Science (Data Science)",
        "Bachelor of Science (Electrical Engineering)",
        "Bachelor of Science (Financial Technology)",
        "Bachelor of Science (Software Engineering)",
    ],
    "Islamabad": [
        "Bachelor of Business Administration",
        "Bachelor of Science (Accounting and Finance)",
        "Bachelor of Science (Artificial Intelligence)",
        "Bachelor of Science (Business Analytics)",
        "Bachelor of Science (Computer Engineering)",
        "Bachelor of Science (Computer Science)",
        "Bachelor of Science (Cyber Security)",
        "Bachelor of Science (Data Science)",
        "Bachelor of Science (Electrical Engineering)",
        "Bachelor of Science (Financial Technology)",
        "Bachelor of Science (Software Engineering)",
    ],
    "CFD": [
        "Bachelor of Business Administration",
        "Bachelor of Science (Artificial Intelligence)",
        "Bachelor of Science (Business Analytics)",
        "Bachelor of Science (Computer Engineering)",
        "Bachelor of Science (Computer Science)",
        "Bachelor of Science (Electrical Engineering)",
        "Bachelor of Science (Financial Technology)",
        "Bachelor of Science (Software Engineering)",
    ],
    "Multan": [
        "Bachelor of Science (Artificial Intelligence)",
        "Bachelor of Science (Computer Science)",
        "Bachelor of Science (Software Engineering)",
    ],
    "Peshawar": [
        "Bachelor of Science (Artificial Intelligence)",
        "Bachelor of Science (Computer Engineering)",
        "Bachelor of Science (Computer Science)",
        "Bachelor of Science (Electrical Engineering)",
        "Bachelor of Science (Software Engineering)",
    ],
}

PROGRAM_CODE_MAP = {
    "Bachelor of Business Administration": "BBA",
    "Bachelor of Science (Accounting and Finance)": "AF",
    "Bachelor of Science (Artificial Intelligence)": "AI",
    "Bachelor of Science (Business Analytics)": "BA",
    "Bachelor of Science (Civil Engineering)": "CE",
    "Bachelor of Science (Computer Engineering)": "CEN",
    "Bachelor of Science (Computer Science)": "CS",
    "Bachelor of Science (Cyber Security)": "CY",
    "Bachelor of Science (Data Science)": "DS",
    "Bachelor of Science (Electrical Engineering)": "EE",
    "Bachelor of Science (Financial Technology)": "FT",
    "Bachelor of Science (Software Engineering)": "SE",
}

SEMESTER_COURSE_TEMPLATES = [
    ["Functional English", "Applied Calculus", "Programming Fundamentals", "Digital Skills"],
    ["Communication Skills", "Discrete Structures", "Object Oriented Programming", "Islamic Studies"],
    ["Data Structures", "Computer Organization", "Probability and Statistics", "Domain Core I"],
    ["Database Systems", "Operating Systems", "Software Design", "Domain Core II"],
    ["Computer Networks", "Human Computer Interaction", "Domain Core III", "Domain Lab I"],
    ["Information Security", "Domain Elective I", "Domain Core IV", "Domain Lab II"],
    ["Final Year Project I", "Domain Elective II", "Professional Practice", "Domain Lab III"],
    ["Final Year Project II", "Domain Elective III", "Domain Seminar", "Domain Capstone"],
]


def _seed_terms(db: Session) -> dict[str, Term]:
    term_specs = [
        ("Fall 2022", date(2022, 8, 15), date(2022, 12, 30), False),
        ("Spring 2023", date(2023, 1, 16), date(2023, 5, 30), False),
        ("Fall 2023", date(2023, 8, 15), date(2023, 12, 30), False),
        ("Spring 2024", date(2024, 1, 16), date(2024, 5, 30), False),
        ("Fall 2024", date(2024, 8, 15), date(2024, 12, 30), False),
        ("Spring 2025", date(2025, 1, 16), date(2025, 5, 30), False),
        ("Fall 2025", date(2025, 8, 15), date(2025, 12, 30), False),
        ("Spring 2026", date(2026, 1, 16), date(2026, 5, 30), True),
    ]

    term_rows: dict[str, Term] = {}
    for name, start, end, is_open in term_specs:
        term = Term(
            name=name,
            start_date=start,
            end_date=end,
            registration_open=is_open,
            feedback_mid_open=is_open,
            feedback_end_open=False,
        )
        db.add(term)
        db.flush()
        term_rows[name] = term
    return term_rows


def _seed_courses(db: Session, program_rows: dict[str, Program]) -> dict[tuple[int, int], list[Course]]:
    by_program_semester: dict[tuple[int, int], list[Course]] = {}

    for program_name, program in program_rows.items():
        program_code = PROGRAM_CODE_MAP.get(program_name, "GEN")
        previous_anchor_course_id: int | None = None

        for semester_index, titles in enumerate(SEMESTER_COURSE_TEMPLATES, start=1):
            rows: list[Course] = []
            current_anchor_course_id: int | None = None

            for course_index, title in enumerate(titles, start=1):
                has_lab = "Lab" in title
                course = Course(
                    code=f"{program_code}-{semester_index}{course_index}",
                    title=f"{program_name} - {title}",
                    semester=semester_index,
                    credits=1 if has_lab else 3,
                    has_lab=has_lab,
                    program_id=program.id,
                )
                db.add(course)
                db.flush()
                rows.append(course)

                if course_index == 1:
                    current_anchor_course_id = course.id
                if course_index == 1 and previous_anchor_course_id is not None:
                    db.add(
                        CoursePrerequisite(
                            course_id=course.id,
                            prerequisite_course_id=previous_anchor_course_id,
                        )
                    )

            previous_anchor_course_id = current_anchor_course_id
            by_program_semester[(program.id, semester_index)] = rows

    return by_program_semester


def _seed_historical_transcript(
    db: Session,
    *,
    student_id: int,
    current_semester: int,
    program_id: int,
    term_rows: dict[str, Term],
    courses_by_program_semester: dict[tuple[int, int], list[Course]],
) -> None:
    grade_cycle = ["A", "A-", "B+", "B"]
    quality_points = {"A+": 4, "A": 4, "A-": 3.67, "B+": 3.33, "B": 3, "B-": 2.67, "C+": 2.33, "C": 2, "C-": 1.67, "D": 1, "F": 0}

    prior_term_names = ["Fall 2022", "Spring 2023", "Fall 2023", "Spring 2024", "Fall 2024", "Spring 2025", "Fall 2025"]
    cumulative_quality = 0.0
    cumulative_credits = 0

    for sem in range(1, min(current_semester, 8)):
        if sem - 1 >= len(prior_term_names):
            break

        term = term_rows[prior_term_names[sem - 1]]
        existing = db.scalar(
            select(TranscriptTerm).where(
                and_(TranscriptTerm.student_id == student_id, TranscriptTerm.term_id == term.id)
            )
        )
        if existing:
            continue

        semester_courses = courses_by_program_semester.get((program_id, sem), [])[:2]
        if not semester_courses:
            continue

        tt = TranscriptTerm(student_id=student_id, term_id=term.id, sgpa=0, cgpa=0)
        db.add(tt)
        db.flush()

        sem_quality = 0.0
        sem_credits = 0
        for idx, course in enumerate(semester_courses):
            grade = grade_cycle[(sem + idx) % len(grade_cycle)]
            db.add(
                TranscriptEntry(
                    transcript_term_id=tt.id,
                    course_id=course.id,
                    grade=grade,
                    credits=course.credits,
                )
            )
            sem_quality += quality_points[grade] * course.credits
            sem_credits += course.credits

        cumulative_quality += sem_quality
        cumulative_credits += sem_credits
        tt.sgpa = round(sem_quality / sem_credits, 2) if sem_credits else 0.0
        tt.cgpa = round(cumulative_quality / cumulative_credits, 2) if cumulative_credits else 0.0


def _create_user(
    db: Session,
    *,
    roll_number: str,
    role: Role,
    campus_id: int,
    full_name: str,
    gender: str,
    cnic: str,
    email: str,
    phone: str,
) -> User:
    user = User(
        roll_number=roll_number,
        password_hash=hash_password("pass123"),
        role=role,
        campus_id=campus_id,
        full_name=full_name,
        gender=gender,
        dob=date(1998, 1, 15) if role != Role.student else date(2004, 5, 20),
        cnic=cnic,
        nationality="Pakistani",
        email=email,
        phone_number=phone,
    )
    db.add(user)
    db.flush()
    return user


def seed_initial_data(db: Session) -> None:
    existing = db.scalar(select(User.id).limit(1))
    if existing:
        return

    campus_rows: dict[str, Campus] = {}
    for campus_name in PROGRAMS_BY_CAMPUS:
        campus = Campus(name=campus_name)
        db.add(campus)
        db.flush()
        campus_rows[campus_name] = campus

    program_rows: dict[str, Program] = {}
    all_programs = sorted({program for programs in PROGRAMS_BY_CAMPUS.values() for program in programs})
    for program_name in all_programs:
        program = Program(name=program_name, min_credit_hours=130)
        db.add(program)
        db.flush()
        program_rows[program_name] = program

    for campus_name, programs in PROGRAMS_BY_CAMPUS.items():
        for program_name in programs:
            db.add(CampusProgram(campus_id=campus_rows[campus_name].id, program_id=program_rows[program_name].id))

    admin_codes = {
        "Karachi": "ADM-KHI-01",
        "Lahore": "ADM-LHR-01",
        "Islamabad": "ADM-ISB-01",
        "CFD": "ADM-CFD-01",
        "Multan": "ADM-MUL-01",
        "Peshawar": "ADM-PSH-01",
    }

    cnic_counter = 1000000
    email_counter = 1
    for campus_name, campus in campus_rows.items():
        _create_user(
            db,
            roll_number=admin_codes[campus_name],
            role=Role.admin,
            campus_id=campus.id,
            full_name=f"Admin {campus_name}",
            gender="Male",
            cnic=f"35202-{cnic_counter:07d}-1",
            email=f"admin.{campus_name.lower()}@flex.edu.pk",
            phone=f"+92-300-{email_counter:07d}",
        )
        cnic_counter += 1
        email_counter += 1

        _create_user(
            db,
            roll_number=f"SEC-{campus_name[:3].upper()}-01",
            role=Role.secretariat,
            campus_id=campus.id,
            full_name=f"Secretariat {campus_name}",
            gender="Female",
            cnic=f"35202-{cnic_counter:07d}-2",
            email=f"secretariat.{campus_name.lower()}@flex.edu.pk",
            phone=f"+92-300-{email_counter:07d}",
        )
        cnic_counter += 1
        email_counter += 1

        for i in range(2):
            _create_user(
                db,
                roll_number=f"MNT-{campus_name[:3].upper()}-0{i+1}",
                role=Role.maintenance,
                campus_id=campus.id,
                full_name=f"Maintenance {campus_name} {i+1}",
                gender="Male",
                cnic=f"35202-{cnic_counter:07d}-3",
                email=f"maintenance{i+1}.{campus_name.lower()}@flex.edu.pk",
                phone=f"+92-300-{email_counter:07d}",
            )
            cnic_counter += 1
            email_counter += 1

        for i in range(4):
            _create_user(
                db,
                roll_number=f"TEA-{campus_name[:3].upper()}-{i+1:03d}",
                role=Role.teacher,
                campus_id=campus.id,
                full_name=f"Teacher {campus_name} {i+1}",
                gender="Male" if i % 2 == 0 else "Female",
                cnic=f"35202-{cnic_counter:07d}-4",
                email=f"teacher{i+1}.{campus_name.lower()}@flex.edu.pk",
                phone=f"+92-300-{email_counter:07d}",
            )
            cnic_counter += 1
            email_counter += 1

        campus_programs = PROGRAMS_BY_CAMPUS[campus_name]
        for i in range(12):
            student = _create_user(
                db,
                roll_number=f"STD-{campus_name[:3].upper()}-{i+1:03d}",
                role=Role.student,
                campus_id=campus.id,
                full_name=f"Student {campus_name} {i+1}",
                gender="Male" if i % 2 == 0 else "Female",
                cnic=f"35202-{cnic_counter:07d}-5",
                email=f"student{i+1}.{campus_name.lower()}@flex.edu.pk",
                phone=f"+92-300-{email_counter:07d}",
            )
            cnic_counter += 1
            email_counter += 1
            program_name = campus_programs[i % len(campus_programs)]
            db.add(
                StudentProfile(
                    student_id=student.id,
                    program_id=program_rows[program_name].id,
                    batch="Fall 2024",
                    current_semester=(i % 8) + 1,
                    section="A" if i % 3 == 0 else "B",
                    is_current=True,
                )
            )

    term_rows = _seed_terms(db)
    courses_by_program_semester = _seed_courses(db, program_rows)

    teachers_by_campus: dict[int, list[User]] = {}
    for campus in campus_rows.values():
        teachers_by_campus[campus.id] = list(
            db.scalars(
                select(User).where(and_(User.campus_id == campus.id, User.role == Role.teacher))
            ).all()
        )

    current_term = term_rows["Spring 2026"]
    offering_cache: set[tuple[int, int, int, str, Part]] = set()

    students = list(db.scalars(select(User).where(User.role == Role.student)).all())
    for student in students:
        profile = db.scalar(select(StudentProfile).where(StudentProfile.student_id == student.id))
        if not profile:
            continue

        _seed_historical_transcript(
            db,
            student_id=student.id,
            current_semester=profile.current_semester,
            program_id=profile.program_id,
            term_rows=term_rows,
            courses_by_program_semester=courses_by_program_semester,
        )

        semester_courses = courses_by_program_semester.get((profile.program_id, profile.current_semester), [])[:2]
        if not semester_courses:
            continue

        campus_teachers = teachers_by_campus.get(student.campus_id, [])
        if not campus_teachers:
            continue

        for offset, course in enumerate(semester_courses):
            theory_teacher = campus_teachers[offset % len(campus_teachers)]
            theory_key = (current_term.id, student.campus_id, course.id, profile.section, Part.theory)
            if theory_key not in offering_cache:
                db.add(
                    CourseOffering(
                        term_id=current_term.id,
                        campus_id=student.campus_id,
                        course_id=course.id,
                        section=profile.section,
                        part=Part.theory,
                        teacher_id=theory_teacher.id,
                    )
                )
                offering_cache.add(theory_key)

            if course.has_lab:
                lab_teacher = campus_teachers[(offset + 1) % len(campus_teachers)]
                lab_key = (current_term.id, student.campus_id, course.id, profile.section, Part.lab)
                if lab_key not in offering_cache:
                    db.add(
                        CourseOffering(
                            term_id=current_term.id,
                            campus_id=student.campus_id,
                            course_id=course.id,
                            section=profile.section,
                            part=Part.lab,
                            teacher_id=lab_teacher.id,
                        )
                    )
                    offering_cache.add(lab_key)

            already_enrolled = db.scalar(
                select(Enrollment).where(
                    and_(
                        Enrollment.term_id == current_term.id,
                        Enrollment.student_id == student.id,
                        Enrollment.course_id == course.id,
                    )
                )
            )
            if not already_enrolled:
                db.add(
                    Enrollment(
                        term_id=current_term.id,
                        student_id=student.id,
                        course_id=course.id,
                        section=profile.section,
                        include_lab=course.has_lab,
                    )
                )

    db.commit()