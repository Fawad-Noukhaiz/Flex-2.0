# Flex 2.0 — University Management System
### Project Report

**FAST National University of Computer and Emerging Sciences**

---

| | |
|---|---|
| **Course:** | Database Systems |
| **Instructor:** | Talha Shahid |
| **Semester:** | 4th Semester |
| **Team Members:** | Umer — 24K-0514 |
| | Bilal — 24K-0701 |
| | Fawad — 24K-0750 |
| **GitHub:** | [github.com/Fawad-Noukhaiz/Flex-2.0](https://github.com/Fawad-Noukhaiz/Flex-2.0) |

---

## Introduction

Flex 2.0 is a full-stack University Management System developed as part of the Database Systems course at FAST National University. The system is designed to streamline and digitize the core administrative and academic operations of a university campus. It provides role-based access for administrators, teachers, students, secretariat staff, and maintenance personnel.

The project follows a modern software architecture utilizing FastAPI for the backend REST API, PostgreSQL as the relational database, SQLAlchemy as the ORM, and Next.js for the frontend interface. Docker is used to containerize the database service, ensuring a consistent and reproducible development environment.

The system was built collaboratively by a team of three members, each contributing to a distinct layer of the application. The project demonstrates practical application of database design, normalization, relational modeling, and RESTful API development.

---

## System Overview

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | FastAPI (Python 3.12) | REST API development |
| Database | PostgreSQL 16 | Relational data storage |
| ORM | SQLAlchemy | Database modeling & queries |
| Authentication | JWT + Passlib/bcrypt | Secure token-based auth |
| Frontend | Next.js 15 | User interface |
| Containerization | Docker Compose | Database environment |
| Data Validation | Pydantic | Request/response schemas |

### User Roles

The system supports five distinct user roles, each with specific permissions:

| Role | Description |
|---|---|
| Admin | Manages users, campuses, programs, courses, terms and enrollments |
| Teacher | Records attendance, manages assessments and submits extra class requests |
| Student | Views enrollments, attendance, grades and transcript |
| Secretariat | Handles student profiles and course registration workflows |
| Maintenance | Receives and resolves maintenance requests submitted by teachers |

---

## Database Design

The database is designed using SQLAlchemy ORM with PostgreSQL as the backend. The schema follows normalization principles and uses foreign key constraints with cascade rules to maintain referential integrity. The design covers all major university operations including user management, course offerings, enrollment, assessment, attendance and transcript generation.

### Entity Overview

| Table | Description |
|---|---|
| `campuses` | Stores university campus locations |
| `programs` | Academic degree programs (BSCS, BSEE etc.) |
| `campus_programs` | Many-to-many mapping of programs offered per campus |
| `users` | All system users with role-based access |
| `student_profiles` | Extended student info — batch, semester, section, program |
| `courses` | Course catalog with credits, semester level and lab flag |
| `course_prerequisites` | Prerequisite relationships between courses |
| `terms` | Academic terms with registration and feedback windows |
| `course_offerings` | Courses offered per term, section and campus with assigned teacher |
| `enrollments` | Student course registrations per term with lab option |
| `assessment_templates` | Assessment definitions — quiz, assignment, midterm, final |
| `assessment_scores` | Student marks recorded for each assessment |
| `attendance_sessions` | Individual class sessions for attendance tracking |
| `attendance_records` | Per-student attendance status for each session |
| `transcript_terms` | SGPA and CGPA recorded per student per term |
| `transcript_entries` | Individual course grades stored in student transcript |
| `maintenance_requests` | Classroom maintenance issues submitted by teachers |
| `extra_class_requests` | Teacher requests for scheduling additional classes |
| `automation_runs` | Logs of grade finalization runs per term |

### Key Design Decisions

Several important design decisions were made during the database modeling phase:

- **Cascade deletes** are applied on all child tables to prevent orphaned records when a parent entity is removed.
- **Unique constraints** are defined on composite keys such as `(term_id, student_id, course_id)` in enrollments to prevent duplicate registrations.
- **Enum types** are used for role, part, assessment category and workflow status fields to enforce data consistency at the database level.
- The **CourseOffering** table acts as a junction between terms, campuses, courses and teachers, enabling flexible scheduling.
- **Transcript data** is stored separately from live enrollment data to preserve historical records even after terms are closed.

---

## API Endpoints

The backend exposes a RESTful API built with FastAPI. All protected endpoints require a Bearer JWT token in the `Authorization` header. The API is organized by functional area and follows standard HTTP conventions for CRUD operations.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/login` | User login, returns JWT token | Public |
| GET | `/users` | List all users in campus | Admin |
| POST | `/users` | Create new user | Admin |
| PUT | `/users/{id}` | Update user details | Admin |
| GET/PUT | `/users/{id}/student-profile` | Manage student profile | Admin |
| GET | `/courses/eligible/{id}` | Get eligible courses for student | Admin |
| POST | `/enrollments` | Enroll student in a course | Admin |
| DELETE | `/enrollments/{id}` | Remove student enrollment | Admin |
| GET | `/attendance/sessions` | List attendance sessions | Teacher |
| POST | `/attendance/sessions` | Create new attendance session | Teacher |
| PUT | `/attendance/records` | Mark student attendance | Teacher |
| GET | `/assessments/templates` | Get assessment templates | Teacher |
| POST | `/assessments/templates` | Create assessment template | Teacher |
| PUT | `/assessments/scores` | Enter student scores | Teacher |
| GET | `/maintenance/requests` | List maintenance requests | Admin/Maint. |
| POST | `/maintenance/requests` | Submit maintenance request | Teacher |
| GET | `/extra-class/requests` | List extra class requests | Admin |
| POST | `/extra-class/requests` | Request an extra class | Teacher |
| POST | `/finalize` | Finalize grades for a term | Admin |

---

## Team Contributions

The project was developed collaboratively by three team members. Each member was responsible for a specific layer of the system architecture, ensuring clear separation of concerns.

### Umer

Umer was responsible for building the database foundation layer of the application. He designed and implemented the core database configuration including environment variable management and application settings. He set up the SQLAlchemy database engine, session factory and the dependency injection function used across all routes. He also designed the complete ORM model layer, defining all database tables including users, campuses, programs, courses, enrollments, assessments, attendance, transcripts and workflow entities. In addition, he contributed to the main API by implementing the authentication routes and user management endpoints.

### Bilal

Bilal was responsible for the authentication and data seeding layer of the application. He implemented the security module which handles password hashing using bcrypt and JWT token creation for session management. He also built the route protection dependency layer which verifies tokens and enforces role-based access control across all protected API endpoints. Furthermore, he developed the database seeding script that populates the system with initial data including campuses, programs, courses and admin users on first startup. He also contributed to the main API by implementing student profile and course-related endpoints.

### Fawad

Fawad was responsible for the data schema layer and the complete frontend of the application. He defined all Pydantic schemas used for validating incoming requests and structuring API responses, covering entities such as users, enrollments, assessments, attendance and maintenance requests. He also contributed to the main API by implementing the remaining endpoints including attendance, assessment, maintenance and extra class request routes. Additionally, he developed the entire Next.js frontend interface that communicates with the backend API, providing a responsive and role-aware user experience for all system users.

---

## Project Setup & Installation

### Prerequisites

The following tools must be installed before running the project:

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.12.x | Backend runtime |
| Node.js | Latest LTS | Frontend runtime |
| Docker Desktop | Latest | PostgreSQL container |
| Git | 2.54+ | Version control |

### Backend Setup (Terminal 1)

Run the following commands in the project root directory:

```bash
cd backend
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
docker compose up -d
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup (Terminal 2)

Open a second terminal and run:

```bash
cd next-frontend
npm install
npm run dev
```

Once both terminals are running, open [http://localhost:3000](http://localhost:3000) in a browser to access the application. The interactive API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## Conclusion

Flex 2.0 successfully demonstrates the application of database systems concepts in a real-world university management context. The project integrates a normalized relational database schema with a modern REST API, role-based access control, and a responsive frontend interface.

Key database concepts applied include entity-relationship modeling, normalization, foreign key constraints with cascade rules, unique constraints, indexing and complex multi-table queries using SQLAlchemy ORM. The use of Docker ensures the database environment is portable and reproducible across different development machines. The collaborative development approach, with each team member owning a specific architectural layer, ensured clean separation of concerns and allowed for focused development across the database foundation, authentication, API schema and frontend layers. The result is a production-ready university management system that covers the full lifecycle of academic operations.
