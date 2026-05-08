# Flex 2.0 — University Management System

## Project Report

**Course:** Database Systems  
**Instructor:** Talha Shahid  
**Semester:** 4th Semester  

### Team Members
- Umer — 24K-0514
- Bilal — 24K-0701
- Fawad — 24K-0750

## GitHub Repository

https://github.com/Fawad-Noukhaiz/Flex-2.0

---

# Introduction

Flex 2.0 is a full-stack University Management System developed as part of the Database Systems course at FAST National University. The system is designed to streamline and digitize the core administrative and academic operations of a university campus.

The project follows a modern software architecture utilizing:

- FastAPI for backend REST API
- PostgreSQL as relational database
- SQLAlchemy ORM
- Next.js frontend
- Docker containerization

---

# System Overview

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | FastAPI (Python 3.12) | REST API development |
| Database | PostgreSQL 16 | Relational data storage |
| ORM | SQLAlchemy | Database modeling & queries |
| Authentication | JWT + Passlib/bcrypt | Secure authentication |
| Frontend | Next.js 15 | User interface |
| Containerization | Docker Compose | Database environment |
| Validation | Pydantic | Request/response schemas |

---

# User Roles

| Role | Description |
|---|---|
| Admin | Manages users, campuses, programs and enrollments |
| Teacher | Handles attendance and assessments |
| Student | Views transcript, grades and attendance |
| Secretariat | Handles student workflows |
| Maintenance | Resolves maintenance requests |

---

# Database Design

The database schema follows normalization principles and uses foreign key constraints with cascade rules to maintain referential integrity.

## Main Tables

- campuses
- programs
- users
- student_profiles
- courses
- enrollments
- assessment_templates
- assessment_scores
- attendance_sessions
- attendance_records
- transcript_entries
- maintenance_requests
- extra_class_requests

---

# Key Design Decisions

- Cascade deletes prevent orphaned records
- Unique constraints prevent duplicate registrations
- Enum types enforce consistency
- CourseOffering acts as a junction entity
- Transcript data stored separately for historical integrity

---

# API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | User login |
| GET | `/users` | List users |
| POST | `/users` | Create user |
| POST | `/enrollments` | Enroll student |
| GET | `/attendance/sessions` | Attendance sessions |
| POST | `/attendance/sessions` | Create attendance |
| POST | `/maintenance/requests` | Submit maintenance request |
| POST | `/finalize` | Finalize grades |

---

# Team Contributions

## Umer
- Database configuration
- SQLAlchemy models
- Authentication routes
- User management endpoints

## Bilal
- JWT authentication
- Password hashing
- Role-based access control
- Database seeding

## Fawad
- Pydantic schemas
- Frontend development
- Attendance & assessment APIs
- Maintenance request routes

---

# Project Setup & Installation

## Prerequisites

- Python 3.12
- Node.js
- Docker Desktop
- Git

---

# Backend Setup

```bash
cd backend

py -3.12 -m venv .venv

.venv\Scripts\Activate.ps1

pip install --upgrade pip

pip install -r requirements.txt

docker compose up -d

uvicorn app.main:app --reload --port 8000
