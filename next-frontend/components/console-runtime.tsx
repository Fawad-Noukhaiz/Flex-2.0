"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Role = "student" | "teacher" | "admin" | "secretariat" | "maintenance";
type Decision = "pending" | "approved" | "denied";

type User = {
  id: string;
  rollNumber: string;
  password: string;
  role: Role;
  campus: Campus;
  profile: {
    fullName: string;
    gender: string;
    dob: string;
    cnic: string;
    nationality: string;
    email: string;
    number: string;
  };
};

type Campus = "Karachi" | "Lahore" | "Islamabad" | "CFD" | "Multan" | "Peshawar";

type StudentInfo = {
  rollNumber: string;
  degree: string;
  batch: string;
  currentSemester: number;
  section: string;
  campus: string;
  status: "Current" | "Not Current";
};

type Course = {
  id: string;
  code: string;
  title: string;
  programs: string[];
  campuses: Campus[];
  semester: number;
  credits: number;
  offered: boolean;
  prerequisiteIds: string[];
  hasLab: boolean;
  sections: string[];
  theoryTeacherId: string;
  labTeacherId?: string;
};

type TeachingAssignment = {
  id: string;
  courseId: string;
  section: string;
  teacherId: string;
  part: "theory" | "lab";
};

type Enrollment = {
  studentId: string;
  courseId: string;
  section: string;
  includeLab: boolean;
};

type MarksRecord = {
  studentId: string;
  courseId: string;
  theory: {
    assignments: number[];
    quizzes: number[];
    midterm: number;
    final: number;
  };
  lab?: {
    assignments: number[];
    quizzes: number[];
    final: number;
  };
};

type AttendanceEntry = { date: string; present: boolean };
type AttendanceRecord = {
  studentId: string;
  courseId: string;
  theory: AttendanceEntry[];
  lab: AttendanceEntry[];
};

type AssessmentTemplate = {
  id: string;
  courseId: string;
  section: string;
  part: "theory" | "lab";
  category: "Assignment" | "Quiz" | "Midterm" | "Final" | "Project";
  title: string;
  weightage: number;
  totalMarks: number;
  createdByTeacherId: string;
};

type AssessmentScore = {
  assessmentId: string;
  studentId: string;
  obtainedMarks: number;
};

type AttendanceSession = {
  id: string;
  courseId: string;
  section: string;
  part: "theory" | "lab";
  date: string;
  createdByTeacherId: string;
};

type SessionAttendance = {
  sessionId: string;
  studentId: string;
  present: boolean;
};

type MarksChangeRequest = {
  id: string;
  studentId: string;
  courseId: string;
  part: "theory" | "lab";
  component: string;
  reason: string;
  status: Decision;
  teacherResponse?: string;
  adminStatus: "none" | Decision;
};

type AttendanceChangeRequest = {
  id: string;
  studentId: string;
  courseId: string;
  part: "theory" | "lab";
  date: string;
  reason: string;
  status: Decision;
  teacherResponse?: string;
  adminStatus: "none" | Decision;
};

type TranscriptSemester = {
  term: string;
  courses: { courseId: string; grade: string; credits: number }[];
  sgpa: number;
  cgpa: number;
};

type FeeVoucher = {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: "Paid" | "Unpaid";
};

type GradeChangeRequest = {
  id: string;
  studentId: string;
  courseId: string;
  reason: string;
  status: Decision;
};

type WithdrawRequest = {
  id: string;
  studentId: string;
  courseId: string;
  reason: string;
  status: Decision;
};

type RetakeRequest = {
  id: string;
  studentId: string;
  courseId: string;
  reason: string;
  evidence: string;
  status: Decision;
};

type FeedbackSubmission = {
  id: string;
  studentId: string;
  courseId: string;
  phase: "Mid" | "End";
  conceptDelivery: number;
  teacherEngagement: number;
  openText: string;
};

type MaintenanceRequest = {
  id: string;
  teacherId: string;
  classroom: string;
  problem: string;
  status: "pending" | "fixed";
};

type ExtraClassRequest = {
  id: string;
  teacherId: string;
  courseId: string;
  section: string;
  reason: string;
  status: "pending" | "approved" | "scheduled" | "denied";
  scheduleNote?: string;
};

type AppState = {
  users: User[];
  studentInfo: Record<string, StudentInfo>;
  courses: Course[];
  teachingAssignments: TeachingAssignment[];
  enrollments: Enrollment[];
  marks: MarksRecord[];
  attendance: AttendanceRecord[];
  assessmentTemplates: AssessmentTemplate[];
  assessmentScores: AssessmentScore[];
  attendanceSessions: AttendanceSession[];
  sessionAttendance: SessionAttendance[];
  marksChangeRequests: MarksChangeRequest[];
  attendanceChangeRequests: AttendanceChangeRequest[];
  transcript: Record<string, TranscriptSemester[]>;
  fees: Record<string, FeeVoucher[]>;
  gradeChangeRequests: GradeChangeRequest[];
  withdrawRequests: WithdrawRequest[];
  retakeRequests: RetakeRequest[];
  feedbackSubmissions: FeedbackSubmission[];
  maintenanceRequests: MaintenanceRequest[];
  extraClassRequests: ExtraClassRequest[];
  windows: {
    registration: { isOpen: boolean; start: string; end: string };
    feedbackMid: boolean;
    feedbackEnd: boolean;
    retake: boolean;
  };
  automation: {
    autoFinalizeEnabled: boolean;
    processedStudentSemesters: string[];
  };
};

const ratingLabels = ["Extremely Disagree", "Disagree", "Unknown", "Agree", "Extremely Agree"];
const degreePrograms = [
  "Bachelor of Business Administration",
  "Bachelor of Science (Accounting and Finance)",
  "Bachelor of Science (Artificial Intelligence)",
  "Bachelor of Science (Business Analytics)",
  "Bachelor of Science (Civil Engineering)",
  "Bachelor of Science (Computer Engineering)",
  "Bachelor of Science (Computer Science)",
  "Bachelor of Science (Cyber Security)",
  "Bachelor of Science (Data Science)",
  "Bachelor of Science (Electrical Engineering)",
  "Bachelor of Science (Financial Technology)",
  "Bachelor of Science (Software Engineering)",
];
const campusPrograms: Record<Campus, string[]> = {
  Karachi: [
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
  Lahore: [
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
  Peshawar: [
    "Bachelor of Science (Artificial Intelligence)",
    "Bachelor of Science (Computer Engineering)",
    "Bachelor of Science (Computer Science)",
    "Bachelor of Science (Electrical Engineering)",
    "Bachelor of Science (Software Engineering)",
  ],
  Islamabad: [
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
  CFD: [
    "Bachelor of Business Administration",
    "Bachelor of Science (Artificial Intelligence)",
    "Bachelor of Science (Business Analytics)",
    "Bachelor of Science (Computer Engineering)",
    "Bachelor of Science (Computer Science)",
    "Bachelor of Science (Electrical Engineering)",
    "Bachelor of Science (Financial Technology)",
    "Bachelor of Science (Software Engineering)",
  ],
  Multan: [
    "Bachelor of Science (Artificial Intelligence)",
    "Bachelor of Science (Computer Science)",
    "Bachelor of Science (Software Engineering)",
  ],
};
const allCampuses: Campus[] = ["Karachi", "Lahore", "Islamabad", "CFD", "Multan", "Peshawar"];
const computingPrograms = [
  "Bachelor of Science (Artificial Intelligence)",
  "Bachelor of Science (Computer Engineering)",
  "Bachelor of Science (Computer Science)",
  "Bachelor of Science (Cyber Security)",
  "Bachelor of Science (Data Science)",
  "Bachelor of Science (Software Engineering)",
];
const gradePointMap: Record<string, number> = {
  "A+": 4,
  A: 4,
  "A-": 3.67,
  "B+": 3.33,
  B: 3,
  "B-": 2.67,
  "C+": 2.33,
  C: 2,
  "C-": 1.67,
  D: 1,
  F: 0,
};

const programCodeMap: Record<string, string> = {
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
};

const semesterCourseTemplates = [
  ["Functional English", "Applied Calculus", "Programming Fundamentals", "Ideology and Constitution", "Digital Skills"],
  ["Communication Skills", "Discrete Structures", "Object Oriented Programming", "Islamic Studies", "Professional Ethics"],
  ["Data Structures", "Computer Organization", "Probability and Statistics", "Technical Writing", "Domain Core I"],
  ["Database Systems", "Operating Systems", "Software Design", "Domain Core II", "Domain Lab I"],
  ["Computer Networks", "Human Computer Interaction", "Domain Core III", "Research Methods", "Domain Lab II"],
  ["Information Security", "Domain Elective I", "Domain Core IV", "Entrepreneurship", "Domain Lab III"],
  ["Final Year Project I", "Domain Elective II", "Professional Practice", "Domain Core V", "Domain Lab IV"],
  ["Final Year Project II", "Domain Elective III", "Internship", "Domain Seminar", "Domain Capstone"],
];

function buildProgramCourseCatalog(): Course[] {
  return degreePrograms.flatMap((program) => {
    const code = programCodeMap[program] ?? "GEN";
    const campuses = allCampuses.filter((campus) => campusPrograms[campus].includes(program));
    const courses: Course[] = [];
    semesterCourseTemplates.forEach((semesterCourses, semesterIndex) => {
      semesterCourses.forEach((title, courseIndex) => {
        const courseId = `${code.toLowerCase()}-s${semesterIndex + 1}-c${courseIndex + 1}`;
        const prerequisites: string[] =
          semesterIndex === 0 ? [] : [`${code.toLowerCase()}-s${semesterIndex}-c1`, `${code.toLowerCase()}-s${semesterIndex}-c2`];
        courses.push({
          id: courseId,
          code: `${code}-${semesterIndex + 1}${courseIndex + 1}`,
          title: `${program.replace("Bachelor of Science ", "").replace("Bachelor of ", "")} - ${title}`,
          programs: [program],
          campuses,
          semester: semesterIndex + 1,
          credits: courseIndex === 4 ? 1 : 3,
          offered: true,
          prerequisiteIds: prerequisites,
          hasLab: courseIndex === 4,
          sections: ["A", "B", "C"],
          theoryTeacherId: "u-teacher-1",
          ...(courseIndex === 4 ? { labTeacherId: "u-teacher-1" } : {}),
        });
      });
    });
    return courses;
  });
}

const programCourseCatalog = buildProgramCourseCatalog();

const initialState: AppState = {
  users: [
    {
      id: "u-student-1",
      rollNumber: "FA22-BSE-091",
      password: "student123",
      role: "student",
      campus: "Islamabad",
      profile: {
        fullName: "Areeba Khan",
        gender: "Female",
        dob: "2003-04-17",
        cnic: "35202-1234567-8",
        nationality: "Pakistani",
        email: "areeba@flex.edu.pk",
        number: "+92-300-1234567",
      },
    },
    {
      id: "u-teacher-1",
      rollNumber: "FAC-TEA-1001",
      password: "teacher123",
      role: "teacher",
      campus: "Karachi",
      profile: {
        fullName: "Dr. Hamza Siddiq",
        gender: "Male",
        dob: "1985-11-04",
        cnic: "35201-7654321-0",
        nationality: "Pakistani",
        email: "hamza.siddiq@flex.edu.pk",
        number: "+92-321-9988776",
      },
    },
    {
      id: "u-secretariat-1",
      rollNumber: "FAC-SEC-2001",
      password: "secretariat123",
      role: "secretariat",
      campus: "Lahore",
      profile: {
        fullName: "Sana Malik",
        gender: "Female",
        dob: "1991-02-13",
        cnic: "37405-2345678-3",
        nationality: "Pakistani",
        email: "secretariat@flex.edu.pk",
        number: "+92-311-6767676",
      },
    },
    {
      id: "u-maint-1",
      rollNumber: "FAC-MNT-3001",
      password: "maintenance123",
      role: "maintenance",
      campus: "CFD",
      profile: {
        fullName: "Imran Ali",
        gender: "Male",
        dob: "1988-06-21",
        cnic: "35202-9898989-1",
        nationality: "Pakistani",
        email: "maintenance@flex.edu.pk",
        number: "+92-345-1112233",
      },
    },
    {
      id: "u-admin-1",
      rollNumber: "ADM-ISB-01",
      password: "admin123",
      role: "admin",
      campus: "Islamabad",
      profile: {
        fullName: "Admin Islamabad",
        gender: "Male",
        dob: "1982-08-02",
        cnic: "35202-8888888-8",
        nationality: "Pakistani",
        email: "admin.isb@flex.edu.pk",
        number: "+92-300-0000001",
      },
    },
    {
      id: "u-admin-2",
      rollNumber: "ADM-LHR-01",
      password: "admin123",
      role: "admin",
      campus: "Lahore",
      profile: {
        fullName: "Admin Lahore",
        gender: "Female",
        dob: "1983-09-10",
        cnic: "35202-7777777-7",
        nationality: "Pakistani",
        email: "admin.lhr@flex.edu.pk",
        number: "+92-300-0000002",
      },
    },
    {
      id: "u-admin-3",
      rollNumber: "ADM-KHI-01",
      password: "admin123",
      role: "admin",
      campus: "Karachi",
      profile: {
        fullName: "Admin Karachi",
        gender: "Male",
        dob: "1981-12-22",
        cnic: "35202-6666666-6",
        nationality: "Pakistani",
        email: "admin.khi@flex.edu.pk",
        number: "+92-300-0000003",
      },
    },
    {
      id: "u-admin-4",
      rollNumber: "ADM-CFD-01",
      password: "admin123",
      role: "admin",
      campus: "CFD",
      profile: {
        fullName: "Admin CFD",
        gender: "Female",
        dob: "1986-05-11",
        cnic: "35202-5555555-5",
        nationality: "Pakistani",
        email: "admin.cfd@flex.edu.pk",
        number: "+92-300-0000004",
      },
    },
    {
      id: "u-admin-5",
      rollNumber: "ADM-MUL-01",
      password: "admin123",
      role: "admin",
      campus: "Multan",
      profile: {
        fullName: "Admin Multan",
        gender: "Male",
        dob: "1984-10-19",
        cnic: "35202-4444444-4",
        nationality: "Pakistani",
        email: "admin.mul@flex.edu.pk",
        number: "+92-300-0000005",
      },
    },
    {
      id: "u-admin-6",
      rollNumber: "ADM-PSH-01",
      password: "admin123",
      role: "admin",
      campus: "Peshawar",
      profile: {
        fullName: "Admin Peshawar",
        gender: "Female",
        dob: "1987-07-28",
        cnic: "35202-3333333-3",
        nationality: "Pakistani",
        email: "admin.psh@flex.edu.pk",
        number: "+92-300-0000006",
      },
    },
  ],
  studentInfo: {
    "u-student-1": {
      rollNumber: "FA22-BSE-091",
      degree: "Bachelor of Science (Software Engineering)",
      batch: "Fall 2022",
      currentSemester: 5,
      section: "B",
      campus: "Islamabad",
      status: "Current",
    },
  },
  courses: [
    ...programCourseCatalog,
    {
      id: "eng101",
      code: "ENG-101",
      title: "Functional English",
      programs: degreePrograms,
      campuses: allCampuses,
      semester: 1,
      credits: 3,
      offered: true,
      prerequisiteIds: [],
      hasLab: false,
      sections: ["A", "B", "C"],
      theoryTeacherId: "u-teacher-1",
    },
    {
      id: "mth101",
      code: "MTH-101",
      title: "Applied Calculus",
      programs: degreePrograms,
      campuses: allCampuses,
      semester: 1,
      credits: 3,
      offered: true,
      prerequisiteIds: [],
      hasLab: false,
      sections: ["A", "B", "C"],
      theoryTeacherId: "u-teacher-1",
    },
    {
      id: "cs201",
      code: "CS-201",
      title: "Data Structures",
      programs: computingPrograms,
      campuses: allCampuses,
      semester: 3,
      credits: 3,
      offered: true,
      prerequisiteIds: ["cs101"],
      hasLab: true,
      sections: ["B", "C"],
      theoryTeacherId: "u-teacher-1",
      labTeacherId: "u-teacher-1",
    },
    {
      id: "cs203",
      code: "CS-203",
      title: "Database Systems",
      programs: computingPrograms,
      campuses: allCampuses,
      semester: 4,
      credits: 3,
      offered: true,
      prerequisiteIds: ["cs101"],
      hasLab: true,
      sections: ["B"],
      theoryTeacherId: "u-teacher-1",
      labTeacherId: "u-teacher-1",
    },
    {
      id: "cs205",
      code: "CS-205",
      title: "Operating Systems",
      programs: computingPrograms,
      campuses: allCampuses,
      semester: 4,
      credits: 3,
      offered: true,
      prerequisiteIds: ["cs201"],
      hasLab: false,
      sections: ["B"],
      theoryTeacherId: "u-teacher-1",
    },
    {
      id: "cs101",
      code: "CS-101",
      title: "Introduction to Computing",
      programs: computingPrograms,
      campuses: allCampuses,
      semester: 1,
      credits: 3,
      offered: true,
      prerequisiteIds: [],
      hasLab: true,
      sections: ["A", "B"],
      theoryTeacherId: "u-teacher-1",
      labTeacherId: "u-teacher-1",
    },
    {
      id: "cs210",
      code: "CS-210",
      title: "Object Oriented Programming",
      programs: computingPrograms,
      campuses: allCampuses,
      semester: 2,
      credits: 3,
      offered: true,
      prerequisiteIds: ["cs101"],
      hasLab: true,
      sections: ["A", "B"],
      theoryTeacherId: "u-teacher-1",
      labTeacherId: "u-teacher-1",
    },
  ],
  teachingAssignments: [
    { id: "ta-1", courseId: "cs201", section: "B", teacherId: "u-teacher-1", part: "theory" },
    { id: "ta-2", courseId: "cs201", section: "B", teacherId: "u-teacher-1", part: "lab" },
    { id: "ta-3", courseId: "cs203", section: "B", teacherId: "u-teacher-1", part: "theory" },
    { id: "ta-4", courseId: "cs203", section: "B", teacherId: "u-teacher-1", part: "lab" },
    { id: "ta-5", courseId: "cs205", section: "B", teacherId: "u-teacher-1", part: "theory" },
  ],
  enrollments: [
    { studentId: "u-student-1", courseId: "cs201", section: "B", includeLab: true },
    { studentId: "u-student-1", courseId: "cs203", section: "B", includeLab: true },
    { studentId: "u-student-1", courseId: "cs205", section: "B", includeLab: false },
  ],
  marks: [
    {
      studentId: "u-student-1",
      courseId: "cs201",
      theory: { assignments: [8, 9, 7], quizzes: [8, 6], midterm: 23, final: 42 },
      lab: { assignments: [9, 8], quizzes: [10], final: 17 },
    },
    {
      studentId: "u-student-1",
      courseId: "cs203",
      theory: { assignments: [9, 8, 10], quizzes: [8, 9], midterm: 26, final: 40 },
      lab: { assignments: [10, 10], quizzes: [9], final: 18 },
    },
    {
      studentId: "u-student-1",
      courseId: "cs205",
      theory: { assignments: [7, 8, 7], quizzes: [8, 7], midterm: 20, final: 39 },
    },
  ],
  attendance: [
    {
      studentId: "u-student-1",
      courseId: "cs201",
      theory: [
        { date: "2026-01-12", present: true },
        { date: "2026-01-14", present: true },
        { date: "2026-01-19", present: false },
      ],
      lab: [
        { date: "2026-01-13", present: true },
        { date: "2026-01-20", present: true },
      ],
    },
    {
      studentId: "u-student-1",
      courseId: "cs203",
      theory: [
        { date: "2026-01-11", present: true },
        { date: "2026-01-18", present: true },
        { date: "2026-01-25", present: true },
      ],
      lab: [
        { date: "2026-01-16", present: true },
        { date: "2026-01-23", present: false },
      ],
    },
    {
      studentId: "u-student-1",
      courseId: "cs205",
      theory: [
        { date: "2026-01-10", present: true },
        { date: "2026-01-17", present: true },
      ],
      lab: [],
    },
  ],
  assessmentTemplates: [
    {
      id: "asmt-1",
      courseId: "cs201",
      section: "B",
      part: "theory",
      category: "Assignment",
      title: "Assignment 1",
      weightage: 10,
      totalMarks: 10,
      createdByTeacherId: "u-teacher-1",
    },
    {
      id: "asmt-2",
      courseId: "cs201",
      section: "B",
      part: "theory",
      category: "Quiz",
      title: "Quiz 1",
      weightage: 10,
      totalMarks: 10,
      createdByTeacherId: "u-teacher-1",
    },
    {
      id: "asmt-3",
      courseId: "cs201",
      section: "B",
      part: "theory",
      category: "Midterm",
      title: "Midterm",
      weightage: 30,
      totalMarks: 30,
      createdByTeacherId: "u-teacher-1",
    },
    {
      id: "asmt-4",
      courseId: "cs201",
      section: "B",
      part: "theory",
      category: "Final",
      title: "Final Exam",
      weightage: 50,
      totalMarks: 50,
      createdByTeacherId: "u-teacher-1",
    },
  ],
  assessmentScores: [
    { assessmentId: "asmt-1", studentId: "u-student-1", obtainedMarks: 8 },
    { assessmentId: "asmt-2", studentId: "u-student-1", obtainedMarks: 7 },
    { assessmentId: "asmt-3", studentId: "u-student-1", obtainedMarks: 23 },
    { assessmentId: "asmt-4", studentId: "u-student-1", obtainedMarks: 42 },
  ],
  attendanceSessions: [
    { id: "sess-1", courseId: "cs201", section: "B", part: "theory", date: "2026-01-12", createdByTeacherId: "u-teacher-1" },
    { id: "sess-2", courseId: "cs201", section: "B", part: "theory", date: "2026-01-14", createdByTeacherId: "u-teacher-1" },
    { id: "sess-3", courseId: "cs201", section: "B", part: "lab", date: "2026-01-13", createdByTeacherId: "u-teacher-1" },
  ],
  sessionAttendance: [
    { sessionId: "sess-1", studentId: "u-student-1", present: true },
    { sessionId: "sess-2", studentId: "u-student-1", present: true },
    { sessionId: "sess-3", studentId: "u-student-1", present: true },
  ],
  marksChangeRequests: [],
  attendanceChangeRequests: [],
  transcript: {
    "u-student-1": [
      {
        term: "Fall 2022",
        courses: [
          { courseId: "cs101", grade: "A", credits: 3 },
          { courseId: "math101", grade: "B+", credits: 3 },
        ],
        sgpa: 3.54,
        cgpa: 3.54,
      },
      {
        term: "Spring 2023",
        courses: [
          { courseId: "cs104", grade: "A-", credits: 3 },
          { courseId: "eng102", grade: "B", credits: 3 },
        ],
        sgpa: 3.38,
        cgpa: 3.46,
      },
    ],
  },
  fees: {
    "u-student-1": [
      { id: "fee-1", title: "Semester Fee Spring 2026", amount: 152000, dueDate: "2026-02-05", status: "Unpaid" },
      { id: "fee-2", title: "Transport Fee", amount: 12000, dueDate: "2026-02-05", status: "Paid" },
    ],
  },
  gradeChangeRequests: [],
  withdrawRequests: [],
  retakeRequests: [],
  feedbackSubmissions: [],
  maintenanceRequests: [],
  extraClassRequests: [],
  windows: {
    registration: { isOpen: true, start: "2026-04-01", end: "2026-06-30" },
    feedbackMid: true,
    feedbackEnd: false,
    retake: false,
  },
  automation: {
    autoFinalizeEnabled: true,
    processedStudentSemesters: [],
  },
};

const roleLabels: Record<Role, string> = {
  student: "Student",
  teacher: "Teacher",
  admin: "Admin",
  secretariat: "Secretariat",
  maintenance: "Maintenance",
};

function sectionTitle(title: string, subtitle: string) {
  return (
    <div className="space-y-2 border-b border-blue-100/80 pb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-500">Flex 2.0 Workspace</p>
      <h2 className="text-2xl font-semibold tracking-tight text-blue-950">{title}</h2>
      <p className="max-w-3xl text-sm text-blue-800/80">{subtitle}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(value);
}

function getCourseLabel(courses: Course[], courseId: string) {
  const course = courses.find((item) => item.id === courseId);
  return course ? `${course.code} - ${course.title}` : courseId;
}

function recalculateTranscript(semesters: TranscriptSemester[]) {
  let accumulatedCredits = 0;
  let accumulatedQualityPoints = 0;

  return semesters.map((semester) => {
    const semesterCredits = semester.courses.reduce((sum, course) => sum + course.credits, 0);
    const semesterQualityPoints = semester.courses.reduce(
      (sum, course) => sum + (gradePointMap[course.grade] ?? 0) * course.credits,
      0,
    );
    const sgpa = semesterCredits ? semesterQualityPoints / semesterCredits : 0;

    accumulatedCredits += semesterCredits;
    accumulatedQualityPoints += semesterQualityPoints;
    const cgpa = accumulatedCredits ? accumulatedQualityPoints / accumulatedCredits : 0;

    return {
      ...semester,
      sgpa: Number(sgpa.toFixed(2)),
      cgpa: Number(cgpa.toFixed(2)),
    };
  });
}

function getLetterGrade(score: number) {
  if (score >= 86) return "A";
  if (score >= 82) return "A-";
  if (score >= 78) return "B+";
  if (score >= 74) return "B";
  if (score >= 70) return "B-";
  if (score >= 66) return "C+";
  if (score >= 62) return "C";
  if (score >= 58) return "C-";
  if (score >= 50) return "D";
  return "F";
}

function getMean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getStdDev(values: number[]) {
  if (values.length <= 1) return 0;
  const mean = getMean(values);
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export default function App() {
  const [state, setState] = useState<AppState>(initialState);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loginInput, setLoginInput] = useState({ rollNumber: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState("");

  const [selectedStudentCourse, setSelectedStudentCourse] = useState("cs201");
  const [registrationLabSelection, setRegistrationLabSelection] = useState<Record<string, boolean>>({});
  const [marksRequestForm, setMarksRequestForm] = useState({ part: "theory", component: "Assignment 1", reason: "" });
  const [attendanceRequestForm, setAttendanceRequestForm] = useState({ part: "theory", date: "", reason: "" });
  const [gradeChangeForm, setGradeChangeForm] = useState({ courseId: "", reason: "" });
  const [withdrawForm, setWithdrawForm] = useState({ courseId: "", reason: "" });
  const [retakeForm, setRetakeForm] = useState({ courseId: "", reason: "", evidence: "" });
  const [feedbackForm, setFeedbackForm] = useState({ courseId: "", conceptDelivery: 3, teacherEngagement: 3, openText: "" });

  const [maintenanceForm, setMaintenanceForm] = useState({ classroom: "", problem: "" });
  const [extraClassForm, setExtraClassForm] = useState({ courseId: "", section: "", reason: "" });
  const [assessmentForm, setAssessmentForm] = useState({
    courseId: "",
    section: "",
    part: "theory" as "theory" | "lab",
    category: "Assignment" as "Assignment" | "Quiz" | "Midterm" | "Final" | "Project",
    title: "",
    weightage: 10,
    totalMarks: 10,
  });
  const [attendanceSessionForm, setAttendanceSessionForm] = useState({
    courseId: "",
    section: "",
    part: "theory" as "theory" | "lab",
    date: "",
  });
  const [teacherAssignmentForm, setTeacherAssignmentForm] = useState({
    teacherId: "",
    courseId: "",
    section: "",
    part: "theory" as "theory" | "lab",
  });
  const [studentAssignmentForm, setStudentAssignmentForm] = useState({
    studentId: "",
    courseId: "",
    section: "",
    includeLab: false,
  });
  const [transcriptForm, setTranscriptForm] = useState({
    studentId: "",
    term: "",
    courseId: "",
    grade: "A",
    credits: 3,
  });
  const [transcriptMessage, setTranscriptMessage] = useState("");
  const [integrityMessage, setIntegrityMessage] = useState("");
  const [selectedManagedUserId, setSelectedManagedUserId] = useState("");
  const [editUserForm, setEditUserForm] = useState({
    rollNumber: "",
    role: "student" as Role,
    campus: "Islamabad" as Campus,
    fullName: "",
    gender: "",
    dob: "",
    cnic: "",
    nationality: "Pakistani",
    email: "",
    number: "",
    degree: "",
    batch: "",
    currentSemester: 1,
    section: "A",
    status: "Current" as "Current" | "Not Current",
  });

  const [newUserForm, setNewUserForm] = useState({
    rollNumber: "",
    password: "",
    role: "student" as Role,
    campus: "Islamabad" as Campus,
    degree: campusPrograms.Islamabad[0],
    currentSemester: 1,
    fullName: "",
    gender: "",
    dob: "",
    cnic: "",
    nationality: "Pakistani",
    email: "",
    number: "",
  });

  useEffect(() => {
    document.title = "Flex 2.0 | University Management";
  }, []);

  const currentUser = useMemo(() => state.users.find((user) => user.id === activeUserId) ?? null, [state.users, activeUserId]);
  const studentInfo = currentUser ? state.studentInfo[currentUser.id] : undefined;
  const todayIso = new Date().toISOString().slice(0, 10);
  const currentAdminCampus = currentUser?.role === "admin" ? currentUser.campus : null;
  const currentCampusPrograms = currentAdminCampus ? campusPrograms[currentAdminCampus] : degreePrograms;

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") return;
    setNewUserForm((prev) => ({
      ...prev,
      campus: currentUser.campus,
      degree:
        prev.role === "student"
          ? campusPrograms[currentUser.campus].includes(prev.degree)
            ? prev.degree
            : campusPrograms[currentUser.campus][0]
          : prev.degree,
    }));
  }, [currentUser]);

  useEffect(() => {
    if (!selectedManagedUserId) return;
    const user = state.users.find((item) => item.id === selectedManagedUserId);
    if (!user) return;
    const studentRecord = state.studentInfo[user.id];
    setEditUserForm({
      rollNumber: user.rollNumber,
      role: user.role,
      campus: user.campus,
      fullName: user.profile.fullName,
      gender: user.profile.gender,
      dob: user.profile.dob,
      cnic: user.profile.cnic,
      nationality: user.profile.nationality,
      email: user.profile.email,
      number: user.profile.number,
      degree: studentRecord?.degree ?? campusPrograms[user.campus][0],
      batch: studentRecord?.batch ?? "Fall 2026",
      currentSemester: studentRecord?.currentSemester ?? 1,
      section: studentRecord?.section ?? "A",
      status: studentRecord?.status ?? "Current",
    });
  }, [selectedManagedUserId, state.users, state.studentInfo]);

  const roleTabs = useMemo(() => {
    if (!currentUser) return [];
    const common = [
      { key: "profile", label: "Profile" },
      { key: "password", label: "Change Password" },
    ];
    if (currentUser.role === "student") {
      return [
        ...common,
        { key: "university", label: "University Info" },
        { key: "marks", label: "Marks" },
        { key: "attendance", label: "Attendance" },
        { key: "registration", label: "Register Courses" },
        { key: "transcript", label: "Transcript" },
        { key: "fee", label: "Fee" },
        { key: "grade-change", label: "Grade Change Request" },
        { key: "withdraw", label: "Course Withdraw" },
        { key: "feedback", label: "Course Feedback" },
        { key: "retake", label: "Exam Retake" },
      ];
    }
    if (currentUser.role === "teacher") {
      return [
        ...common,
        { key: "teacher-marks", label: "Manage Marks" },
        { key: "teacher-attendance", label: "Manage Attendance" },
        { key: "teacher-requests", label: "Student Requests" },
        { key: "teacher-feedback", label: "Anonymous Feedback" },
        { key: "maintenance", label: "Maintenance Request" },
        { key: "extra-class", label: "Extra Class Request" },
      ];
    }
    if (currentUser.role === "maintenance") {
      return [...common, { key: "maintenance-board", label: "Fix Requests" }];
    }
    if (currentUser.role === "secretariat") {
      return [...common, { key: "extra-class-board", label: "Extra Class Desk" }];
    }
    return [
      ...common,
      { key: "user-management", label: "Manage Users" },
      { key: "course-allocation", label: "Teacher Allocations" },
      { key: "enrollment-management", label: "Student Enrollments" },
      { key: "transcript-management", label: "Transcript Control" },
      { key: "windows", label: "Academic Windows" },
      { key: "admin-grade-change", label: "Grade Changes" },
      { key: "admin-withdraw", label: "Withdraw Requests" },
      { key: "admin-retake", label: "Retake Requests" },
    ];
  }, [currentUser]);

  useEffect(() => {
    if (!roleTabs.length) return;
    if (!roleTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(roleTabs[0].key);
    }
  }, [roleTabs, activeTab]);

  const studentEnrollments = useMemo(() => {
    if (!currentUser || currentUser.role !== "student") return [];
    return state.enrollments.filter((item) => item.studentId === currentUser.id);
  }, [state.enrollments, currentUser]);

  const isRegistrationOpen =
    state.windows.registration.isOpen && todayIso >= state.windows.registration.start && todayIso <= state.windows.registration.end;

  const passedCourseIds = useMemo(() => {
    if (!currentUser) return [];
    const records = state.transcript[currentUser.id] ?? [];
    const passingGrades = new Set(["A+", "A", "A-", "B+", "B", "B-", "C+", "C"]);
    return records.flatMap((semester) => semester.courses.filter((course) => passingGrades.has(course.grade)).map((course) => course.courseId));
  }, [state.transcript, currentUser]);

  const eligibleCourses = useMemo(() => {
    if (!currentUser || currentUser.role !== "student") return [];
    const currentDegree = state.studentInfo[currentUser.id]?.degree;
    const currentSemester = state.studentInfo[currentUser.id]?.currentSemester;
    const alreadyEnrolled = new Set(studentEnrollments.map((item) => item.courseId));
    return state.courses.filter(
      (course) =>
        course.offered &&
        course.campuses.includes(currentUser.campus) &&
        (!!currentDegree ? course.programs.includes(currentDegree) : true) &&
        (!!currentSemester ? course.semester === currentSemester : true) &&
        !alreadyEnrolled.has(course.id) &&
        course.prerequisiteIds.every((pre) => passedCourseIds.includes(pre)),
    );
  }, [state.courses, studentEnrollments, passedCourseIds, currentUser, state.studentInfo]);


  const teachers = useMemo(
    () =>
      state.users.filter(
        (user) => user.role === "teacher" && (!currentAdminCampus || user.campus === currentAdminCampus),
      ),
    [state.users, currentAdminCampus],
  );
  const students = useMemo(
    () =>
      state.users.filter(
        (user) => user.role === "student" && (!currentAdminCampus || user.campus === currentAdminCampus),
      ),
    [state.users, currentAdminCampus],
  );

  const teacherCourseIds = useMemo(() => {
    if (!currentUser || currentUser.role !== "teacher") return new Set<string>();
    return new Set(
      state.teachingAssignments
        .filter((assignment) => assignment.teacherId === currentUser.id)
        .map((assignment) => assignment.courseId),
    );
  }, [state.teachingAssignments, currentUser]);

  const teacherAnonymousFeedback = useMemo(() => {
    if (!currentUser || currentUser.role !== "teacher") return [];
    return state.feedbackSubmissions.filter((submission) => teacherCourseIds.has(submission.courseId));
  }, [state.feedbackSubmissions, teacherCourseIds, currentUser]);

  const teacherManagedSlots = useMemo(() => {
    if (!currentUser || currentUser.role !== "teacher") return [];
    return state.teachingAssignments.filter((assignment) => assignment.teacherId === currentUser.id);
  }, [state.teachingAssignments, currentUser]);

  const studentSelectedEnrollment = useMemo(() => {
    if (!currentUser || currentUser.role !== "student") return undefined;
    return state.enrollments.find((item) => item.studentId === currentUser.id && item.courseId === selectedStudentCourse);
  }, [state.enrollments, currentUser, selectedStudentCourse]);

  const studentAssessmentRows = useMemo(() => {
    if (!currentUser || currentUser.role !== "student" || !studentSelectedEnrollment) return [];
    return state.assessmentTemplates
      .filter(
        (template) =>
          template.courseId === selectedStudentCourse &&
          template.section === studentSelectedEnrollment.section &&
          (template.part === "theory" || (studentSelectedEnrollment.includeLab && template.part === "lab")),
      )
      .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
  }, [state.assessmentTemplates, currentUser, studentSelectedEnrollment, selectedStudentCourse]);

  const studentCourseSessions = useMemo(() => {
    if (!currentUser || currentUser.role !== "student" || !studentSelectedEnrollment) return [];
    return state.attendanceSessions
      .filter(
        (session) =>
          session.courseId === selectedStudentCourse &&
          session.section === studentSelectedEnrollment.section &&
          (session.part === "theory" || (studentSelectedEnrollment.includeLab && session.part === "lab")),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [state.attendanceSessions, currentUser, studentSelectedEnrollment, selectedStudentCourse]);

  const teacherCanHandleRequest = (studentId: string, courseId: string, part: "theory" | "lab") => {
    if (!currentUser || currentUser.role !== "teacher") return false;
    const enrollment = state.enrollments.find((item) => item.studentId === studentId && item.courseId === courseId);
    if (!enrollment) return false;
    return state.teachingAssignments.some(
      (assignment) =>
        assignment.teacherId === currentUser.id &&
        assignment.courseId === courseId &&
        assignment.section === enrollment.section &&
        assignment.part === part,
    );
  };

  const login = () => {
    const user = state.users.find((item) => item.rollNumber === loginInput.rollNumber && item.password === loginInput.password);
    if (!user) {
      setLoginError("Invalid credentials. Use demo accounts listed below.");
      return;
    }
    setActiveUserId(user.id);
    setActiveTab("profile");
    setLoginError("");
    setLoginInput({ rollNumber: "", password: "" });
  };

  const logout = () => {
    setActiveUserId(null);
    setActiveTab("profile");
    setPasswordMessage("");
  };

  const updatePassword = () => {
    if (!currentUser) return;
    if (passwordForm.currentPassword !== currentUser.password) {
      setPasswordMessage("Current password is incorrect.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("New password and confirm password do not match.");
      return;
    }
    setState((prev) => ({
      ...prev,
      users: prev.users.map((user) =>
        user.id === currentUser.id
          ? {
              ...user,
              password: passwordForm.newPassword,
            }
          : user,
      ),
    }));
    setPasswordMessage("Password changed successfully.");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const submitMarksRequest = () => {
    if (!currentUser || !marksRequestForm.reason.trim() || !selectedStudentCourse) return;
    setState((prev) => ({
      ...prev,
      marksChangeRequests: [
        {
          id: `mcr-${Date.now()}`,
          studentId: currentUser.id,
          courseId: selectedStudentCourse,
          part: marksRequestForm.part as "theory" | "lab",
          component: marksRequestForm.component,
          reason: marksRequestForm.reason,
          status: "pending",
          adminStatus: "none",
        },
        ...prev.marksChangeRequests,
      ],
    }));
    setMarksRequestForm((prev) => ({ ...prev, reason: "" }));
  };

  const submitAttendanceRequest = () => {
    if (!currentUser || !attendanceRequestForm.reason.trim() || !attendanceRequestForm.date) return;
    setState((prev) => ({
      ...prev,
      attendanceChangeRequests: [
        {
          id: `acr-${Date.now()}`,
          studentId: currentUser.id,
          courseId: selectedStudentCourse,
          part: attendanceRequestForm.part as "theory" | "lab",
          date: attendanceRequestForm.date,
          reason: attendanceRequestForm.reason,
          status: "pending",
          adminStatus: "none",
        },
        ...prev.attendanceChangeRequests,
      ],
    }));
    setAttendanceRequestForm((prev) => ({ ...prev, reason: "" }));
  };

  const registerCourse = (courseId: string, includeLab: boolean) => {
    if (!currentUser || currentUser.role !== "student" || !isRegistrationOpen) return;
    if (studentEnrollments.length >= 6) return;
    const course = state.courses.find((item) => item.id === courseId);
    if (!course) return;
    if (includeLab && !course.hasLab) return;
    setState((prev) => ({
      ...prev,
      enrollments: [...prev.enrollments, { studentId: currentUser.id, courseId, section: studentInfo?.section ?? "A", includeLab }],
    }));
  };

  const submitGradeChange = () => {
    if (!currentUser || !gradeChangeForm.courseId || !gradeChangeForm.reason.trim()) return;
    setState((prev) => ({
      ...prev,
      gradeChangeRequests: [
        {
          id: `gcr-${Date.now()}`,
          studentId: currentUser.id,
          courseId: gradeChangeForm.courseId,
          reason: gradeChangeForm.reason,
          status: "pending",
        },
        ...prev.gradeChangeRequests,
      ],
    }));
    setGradeChangeForm({ courseId: "", reason: "" });
  };

  const submitWithdrawRequest = () => {
    if (!currentUser || !withdrawForm.courseId || !withdrawForm.reason.trim()) return;
    setState((prev) => ({
      ...prev,
      withdrawRequests: [
        { id: `wd-${Date.now()}`, studentId: currentUser.id, courseId: withdrawForm.courseId, reason: withdrawForm.reason, status: "pending" },
        ...prev.withdrawRequests,
      ],
    }));
    setWithdrawForm({ courseId: "", reason: "" });
  };

  const submitRetakeRequest = () => {
    if (!currentUser || !retakeForm.courseId || !retakeForm.reason.trim() || !retakeForm.evidence.trim()) return;
    const personalRequests = state.retakeRequests.filter((item) => item.studentId === currentUser.id);
    if (personalRequests.length >= 2) return;
    setState((prev) => ({
      ...prev,
      retakeRequests: [
        {
          id: `rt-${Date.now()}`,
          studentId: currentUser.id,
          courseId: retakeForm.courseId,
          reason: retakeForm.reason,
          evidence: retakeForm.evidence,
          status: "pending",
        },
        ...prev.retakeRequests,
      ],
    }));
    setRetakeForm({ courseId: "", reason: "", evidence: "" });
  };

  const submitFeedback = () => {
    if (!currentUser || !feedbackForm.courseId || !feedbackForm.openText.trim()) return;
    const phase: "Mid" | "End" = state.windows.feedbackMid ? "Mid" : "End";
    setState((prev) => ({
      ...prev,
      feedbackSubmissions: [
        {
          id: `fb-${Date.now()}`,
          studentId: currentUser.id,
          courseId: feedbackForm.courseId,
          phase,
          conceptDelivery: feedbackForm.conceptDelivery,
          teacherEngagement: feedbackForm.teacherEngagement,
          openText: feedbackForm.openText,
        },
        ...prev.feedbackSubmissions,
      ],
    }));
    setFeedbackForm({ courseId: "", conceptDelivery: 3, teacherEngagement: 3, openText: "" });
  };

  const createAssessmentTemplate = () => {
    if (!currentUser || currentUser.role !== "teacher") return;
    if (!assessmentForm.courseId || !assessmentForm.section || !assessmentForm.title.trim()) return;
    const canManage = teacherManagedSlots.some(
      (slot) =>
        slot.courseId === assessmentForm.courseId &&
        slot.section === assessmentForm.section &&
        slot.part === assessmentForm.part,
    );
    if (!canManage) return;

    setState((prev) => ({
      ...prev,
      assessmentTemplates: [
        {
          id: `asmt-${Date.now()}`,
          courseId: assessmentForm.courseId,
          section: assessmentForm.section,
          part: assessmentForm.part,
          category: assessmentForm.category,
          title: assessmentForm.title,
          weightage: Number(assessmentForm.weightage),
          totalMarks: Number(assessmentForm.totalMarks),
          createdByTeacherId: currentUser.id,
        },
        ...prev.assessmentTemplates,
      ],
    }));
    setAssessmentForm((prev) => ({ ...prev, title: "", weightage: 10, totalMarks: 10 }));
  };

  const updateAssessmentScore = (assessmentId: string, studentId: string, obtainedMarks: number) => {
    setState((prev) => {
      const existingIndex = prev.assessmentScores.findIndex(
        (score) => score.assessmentId === assessmentId && score.studentId === studentId,
      );
      if (existingIndex === -1) {
        return {
          ...prev,
          assessmentScores: [...prev.assessmentScores, { assessmentId, studentId, obtainedMarks }],
        };
      }
      return {
        ...prev,
        assessmentScores: prev.assessmentScores.map((score, index) =>
          index === existingIndex ? { ...score, obtainedMarks } : score,
        ),
      };
    });
  };

  const createAttendanceSession = () => {
    if (!currentUser || currentUser.role !== "teacher") return;
    if (!attendanceSessionForm.courseId || !attendanceSessionForm.section || !attendanceSessionForm.date) return;
    const canManage = teacherManagedSlots.some(
      (slot) =>
        slot.courseId === attendanceSessionForm.courseId &&
        slot.section === attendanceSessionForm.section &&
        slot.part === attendanceSessionForm.part,
    );
    if (!canManage) return;
    setState((prev) => ({
      ...prev,
      attendanceSessions: [
        {
          id: `sess-${Date.now()}`,
          courseId: attendanceSessionForm.courseId,
          section: attendanceSessionForm.section,
          part: attendanceSessionForm.part,
          date: attendanceSessionForm.date,
          createdByTeacherId: currentUser.id,
        },
        ...prev.attendanceSessions,
      ],
    }));
  };

  const markSessionAttendance = (sessionId: string, studentId: string, present: boolean) => {
    setState((prev) => {
      const existing = prev.sessionAttendance.find(
        (entry) => entry.sessionId === sessionId && entry.studentId === studentId,
      );
      if (!existing) {
        return {
          ...prev,
          sessionAttendance: [...prev.sessionAttendance, { sessionId, studentId, present }],
        };
      }
      return {
        ...prev,
        sessionAttendance: prev.sessionAttendance.map((entry) =>
          entry.sessionId === sessionId && entry.studentId === studentId ? { ...entry, present } : entry,
        ),
      };
    });
  };

  const updateMarksDecision = (id: string, status: Decision, teacherResponse: string) => {
    setState((prev) => ({
      ...prev,
      marksChangeRequests: prev.marksChangeRequests.map((item) => (item.id === id ? { ...item, status, teacherResponse } : item)),
    }));
  };

  const updateAttendanceDecision = (id: string, status: Decision, teacherResponse: string) => {
    setState((prev) => ({
      ...prev,
      attendanceChangeRequests: prev.attendanceChangeRequests.map((item) =>
        item.id === id ? { ...item, status, teacherResponse } : item,
      ),
    }));
  };

  const updateGradeChange = (id: string, status: Decision) => {
    setState((prev) => ({
      ...prev,
      gradeChangeRequests: prev.gradeChangeRequests.map((item) => (item.id === id ? { ...item, status } : item)),
    }));
  };

  const updateWithdraw = (id: string, status: Decision) => {
    setState((prev) => ({
      ...prev,
      withdrawRequests: prev.withdrawRequests.map((item) => (item.id === id ? { ...item, status } : item)),
    }));
  };

  const updateRetake = (id: string, status: Decision) => {
    setState((prev) => ({
      ...prev,
      retakeRequests: prev.retakeRequests.map((item) => (item.id === id ? { ...item, status } : item)),
    }));
  };

  const submitMaintenance = () => {
    if (!currentUser || !maintenanceForm.classroom.trim() || !maintenanceForm.problem.trim()) return;
    setState((prev) => ({
      ...prev,
      maintenanceRequests: [
        {
          id: `mnt-${Date.now()}`,
          teacherId: currentUser.id,
          classroom: maintenanceForm.classroom,
          problem: maintenanceForm.problem,
          status: "pending",
        },
        ...prev.maintenanceRequests,
      ],
    }));
    setMaintenanceForm({ classroom: "", problem: "" });
  };

  const markMaintenanceFixed = (id: string) => {
    setState((prev) => ({
      ...prev,
      maintenanceRequests: prev.maintenanceRequests.map((item) => (item.id === id ? { ...item, status: "fixed" } : item)),
    }));
  };

  const submitExtraClass = () => {
    if (!currentUser || !extraClassForm.courseId || !extraClassForm.section || !extraClassForm.reason.trim()) return;
    setState((prev) => ({
      ...prev,
      extraClassRequests: [
        {
          id: `exc-${Date.now()}`,
          teacherId: currentUser.id,
          courseId: extraClassForm.courseId,
          section: extraClassForm.section,
          reason: extraClassForm.reason,
          status: "pending",
        },
        ...prev.extraClassRequests,
      ],
    }));
    setExtraClassForm({ courseId: "", section: "", reason: "" });
  };

  const updateExtraClassStatus = (id: string, status: ExtraClassRequest["status"], scheduleNote = "") => {
    setState((prev) => ({
      ...prev,
      extraClassRequests: prev.extraClassRequests.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              scheduleNote: scheduleNote || item.scheduleNote,
            }
          : item,
      ),
    }));
  };

  const createUser = () => {
    if (!currentUser || currentUser.role !== "admin") return;
    const adminCampusPrograms = campusPrograms[currentUser.campus];
    if (
      !newUserForm.rollNumber ||
      !newUserForm.password ||
      !newUserForm.fullName ||
      !newUserForm.email ||
      newUserForm.campus !== currentUser.campus ||
      (newUserForm.role === "student" && !adminCampusPrograms.includes(newUserForm.degree)) ||
      state.users.some((item) => item.rollNumber === newUserForm.rollNumber)
    ) {
      return;
    }
    const id = `u-${newUserForm.role}-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      users: [
        ...prev.users,
        {
          id,
          rollNumber: newUserForm.rollNumber,
          password: newUserForm.password,
          role: newUserForm.role,
          campus: newUserForm.campus,
          profile: {
            fullName: newUserForm.fullName,
            gender: newUserForm.gender,
            dob: newUserForm.dob,
            cnic: newUserForm.cnic,
            nationality: newUserForm.nationality,
            email: newUserForm.email,
            number: newUserForm.number,
          },
        },
      ],
      studentInfo:
        newUserForm.role === "student"
          ? {
              ...prev.studentInfo,
              [id]: {
                rollNumber: newUserForm.rollNumber,
                degree: newUserForm.degree,
                batch: "Fall 2026",
                currentSemester: newUserForm.currentSemester,
                section: "A",
                campus: newUserForm.campus,
                status: "Current",
              },
            }
          : prev.studentInfo,
    }));
    setNewUserForm({
      rollNumber: "",
      password: "",
      role: "student",
      campus: currentUser.campus,
      degree: campusPrograms[currentUser.campus][0],
      currentSemester: 1,
      fullName: "",
      gender: "",
      dob: "",
      cnic: "",
      nationality: "Pakistani",
      email: "",
      number: "",
    });
  };

  const removeUser = (id: string) => {
    if (!currentUser || currentUser.role !== "admin") return;
    const user = state.users.find((item) => item.id === id);
    if (!user || user.role === "admin" || user.campus !== currentUser.campus) return;
    setState((prev) => ({ ...prev, users: prev.users.filter((item) => item.id !== id) }));
  };

  const updateManagedUser = () => {
    if (!selectedManagedUserId) return;
    setState((prev) => {
      const duplicateRoll = prev.users.some(
        (item) => item.id !== selectedManagedUserId && item.rollNumber === editUserForm.rollNumber,
      );
      if (duplicateRoll) return prev;

      const updatedUsers = prev.users.map((user) =>
        user.id === selectedManagedUserId
          ? {
              ...user,
              rollNumber: editUserForm.rollNumber,
              role: editUserForm.role,
              campus: editUserForm.campus,
              profile: {
                fullName: editUserForm.fullName,
                gender: editUserForm.gender,
                dob: editUserForm.dob,
                cnic: editUserForm.cnic,
                nationality: editUserForm.nationality,
                email: editUserForm.email,
                number: editUserForm.number,
              },
            }
          : user,
      );

      const updatedStudentInfo = { ...prev.studentInfo };
      if (editUserForm.role === "student") {
        updatedStudentInfo[selectedManagedUserId] = {
          rollNumber: editUserForm.rollNumber,
          degree: editUserForm.degree,
          batch: editUserForm.batch,
          currentSemester: editUserForm.currentSemester,
          section: editUserForm.section,
          campus: editUserForm.campus,
          status: editUserForm.status,
        };
      } else {
        delete updatedStudentInfo[selectedManagedUserId];
      }

      return {
        ...prev,
        users: updatedUsers,
        studentInfo: updatedStudentInfo,
      };
    });
  };

  const runIntegrityAudit = () => {
    let summary = "Data integrity check completed. No fixes required.";

    setState((prev) => {
      const studentIds = new Set(prev.users.filter((user) => user.role === "student").map((user) => user.id));
      const teacherIds = new Set(prev.users.filter((user) => user.role === "teacher").map((user) => user.id));
      const courseMap = new Map(prev.courses.map((course) => [course.id, course]));

      const studentInfoEntries = Object.entries(prev.studentInfo).filter(([studentId]) => studentIds.has(studentId));
      const cleanedStudentInfo: Record<string, StudentInfo> = Object.fromEntries(
        studentInfoEntries.map(([studentId, info]) => [
          studentId,
          { ...info, currentSemester: Math.min(8, Math.max(1, info.currentSemester || 1)) },
        ]),
      );

      const cleanedTranscript: Record<string, TranscriptSemester[]> = {};
      Object.entries(prev.transcript).forEach(([studentId, semesters]) => {
        if (studentIds.has(studentId)) {
          cleanedTranscript[studentId] = recalculateTranscript(semesters);
        }
      });

      const cleanedEnrollments = prev.enrollments.filter(
        (enrollment) => studentIds.has(enrollment.studentId) && courseMap.has(enrollment.courseId),
      );
      const enrollmentKeySet = new Set(cleanedEnrollments.map((item) => `${item.studentId}-${item.courseId}`));

      const cleanedTeachingAssignments = prev.teachingAssignments.filter((assignment) => {
        const course = courseMap.get(assignment.courseId);
        if (!course) return false;
        if (!teacherIds.has(assignment.teacherId)) return false;
        if (!course.sections.includes(assignment.section)) return false;
        if (assignment.part === "lab" && !course.hasLab) return false;
        return true;
      });

      const cleanedAssessmentTemplates = prev.assessmentTemplates.filter((template) => {
        const course = courseMap.get(template.courseId);
        if (!course) return false;
        if (!teacherIds.has(template.createdByTeacherId)) return false;
        if (!course.sections.includes(template.section)) return false;
        if (template.part === "lab" && !course.hasLab) return false;
        return true;
      });
      const templateMap = new Map(cleanedAssessmentTemplates.map((template) => [template.id, template]));

      const cleanedAssessmentScores = prev.assessmentScores.filter((score) => {
        const template = templateMap.get(score.assessmentId);
        if (!template) return false;
        if (!studentIds.has(score.studentId)) return false;
        return score.obtainedMarks >= 0 && score.obtainedMarks <= template.totalMarks;
      });

      const cleanedAttendanceSessions = prev.attendanceSessions.filter((session) => {
        const course = courseMap.get(session.courseId);
        if (!course) return false;
        if (!teacherIds.has(session.createdByTeacherId)) return false;
        if (!course.sections.includes(session.section)) return false;
        if (session.part === "lab" && !course.hasLab) return false;
        return true;
      });
      const sessionIdSet = new Set(cleanedAttendanceSessions.map((session) => session.id));

      const cleanedSessionAttendance = prev.sessionAttendance.filter(
        (entry) => sessionIdSet.has(entry.sessionId) && studentIds.has(entry.studentId),
      );

      const cleanedMarks = prev.marks.filter((record) => enrollmentKeySet.has(`${record.studentId}-${record.courseId}`));
      const cleanedAttendance = prev.attendance.filter((record) => enrollmentKeySet.has(`${record.studentId}-${record.courseId}`));

      const cleanedProcessedSemesters = prev.automation.processedStudentSemesters.filter((key) => {
        const [studentId, semLabel] = key.split("-sem-");
        const semNo = Number(semLabel);
        return studentIds.has(studentId) && Number.isFinite(semNo) && semNo >= 1 && semNo <= 8;
      });

      const removedCount =
        (Object.keys(prev.studentInfo).length - Object.keys(cleanedStudentInfo).length) +
        (Object.keys(prev.transcript).length - Object.keys(cleanedTranscript).length) +
        (prev.enrollments.length - cleanedEnrollments.length) +
        (prev.teachingAssignments.length - cleanedTeachingAssignments.length) +
        (prev.assessmentTemplates.length - cleanedAssessmentTemplates.length) +
        (prev.assessmentScores.length - cleanedAssessmentScores.length) +
        (prev.attendanceSessions.length - cleanedAttendanceSessions.length) +
        (prev.sessionAttendance.length - cleanedSessionAttendance.length) +
        (prev.marks.length - cleanedMarks.length) +
        (prev.attendance.length - cleanedAttendance.length) +
        (prev.automation.processedStudentSemesters.length - cleanedProcessedSemesters.length);

      summary =
        removedCount > 0
          ? `Integrity audit applied ${removedCount} cleanup fix(es).`
          : "Data integrity check completed. No fixes required.";

      return {
        ...prev,
        studentInfo: cleanedStudentInfo,
        transcript: cleanedTranscript,
        enrollments: cleanedEnrollments,
        teachingAssignments: cleanedTeachingAssignments,
        assessmentTemplates: cleanedAssessmentTemplates,
        assessmentScores: cleanedAssessmentScores,
        attendanceSessions: cleanedAttendanceSessions,
        sessionAttendance: cleanedSessionAttendance,
        marks: cleanedMarks,
        attendance: cleanedAttendance,
        automation: {
          ...prev.automation,
          processedStudentSemesters: cleanedProcessedSemesters,
        },
      };
    });

    setIntegrityMessage(summary);
  };

  const runAutoFinalization = () => {
    setState((prev) => {
      if (!prev.automation.autoFinalizeEnabled) return prev;

      const nextProcessed = [...prev.automation.processedStudentSemesters];
      const finalizedNow: string[] = [];
      const transcriptUpdates: Record<string, TranscriptSemester[]> = { ...prev.transcript };
      const removals = new Set<string>();

      const activeStudents = prev.users.filter((user) => user.role === "student" && prev.studentInfo[user.id]?.status === "Current");

      activeStudents.forEach((student) => {
        const info = prev.studentInfo[student.id];
        if (!info) return;
        const key = `${student.id}-sem-${info.currentSemester}`;
        if (nextProcessed.includes(key)) return;

        const semesterEnrollments = prev.enrollments.filter((enrollment) => {
          if (enrollment.studentId !== student.id) return false;
          const course = prev.courses.find((item) => item.id === enrollment.courseId);
          return course?.semester === info.currentSemester;
        });

        if (!semesterEnrollments.length) return;

        const allFinalsSubmitted = semesterEnrollments.every((enrollment) => {
          const finalTheoryTemplates = prev.assessmentTemplates.filter(
            (template) =>
              template.courseId === enrollment.courseId &&
              template.section === enrollment.section &&
              template.part === "theory" &&
              template.category === "Final",
          );
          if (!finalTheoryTemplates.length) return false;
          const theorySubmitted = finalTheoryTemplates.every((template) =>
            prev.assessmentScores.some(
              (score) => score.assessmentId === template.id && score.studentId === enrollment.studentId,
            ),
          );
          if (!theorySubmitted) return false;

          if (enrollment.includeLab) {
            const finalLabTemplates = prev.assessmentTemplates.filter(
              (template) =>
                template.courseId === enrollment.courseId &&
                template.section === enrollment.section &&
                template.part === "lab" &&
                template.category === "Final",
            );
            if (!finalLabTemplates.length) return false;
            return finalLabTemplates.every((template) =>
              prev.assessmentScores.some(
                (score) => score.assessmentId === template.id && score.studentId === enrollment.studentId,
              ),
            );
          }
          return true;
        });

        if (!allFinalsSubmitted) return;

        const termLabel = `Semester ${info.currentSemester} - Auto Finalized ${new Date().getFullYear()}`;
        const newCourses = semesterEnrollments.map((enrollment) => {
          const course = prev.courses.find((item) => item.id === enrollment.courseId);
          const templates = prev.assessmentTemplates.filter(
            (template) =>
              template.courseId === enrollment.courseId &&
              template.section === enrollment.section &&
              (template.part === "theory" || (enrollment.includeLab && template.part === "lab")),
          );
          const obtainedWeightage = templates.reduce((sum, template) => {
            const score = prev.assessmentScores.find(
              (entry) => entry.assessmentId === template.id && entry.studentId === enrollment.studentId,
            );
            if (!score || template.totalMarks <= 0) return sum;
            return sum + (score.obtainedMarks / template.totalMarks) * template.weightage;
          }, 0);
          const totalWeightage = templates.reduce((sum, template) => sum + template.weightage, 0);
          const normalized = totalWeightage > 0 ? (obtainedWeightage / totalWeightage) * 100 : 0;
          return {
            courseId: enrollment.courseId,
            grade: getLetterGrade(normalized),
            credits: course?.credits ?? 3,
          };
        });

        const existingSemesters = [...(transcriptUpdates[student.id] ?? [])];
        existingSemesters.push({ term: termLabel, courses: newCourses, sgpa: 0, cgpa: 0 });
        transcriptUpdates[student.id] = recalculateTranscript(existingSemesters);

        semesterEnrollments.forEach((enrollment) => removals.add(`${enrollment.studentId}-${enrollment.courseId}`));
        nextProcessed.push(key);
        finalizedNow.push(key);
      });

      if (!removals.size) return prev;

      const updatedStudentInfo = { ...prev.studentInfo };
      finalizedNow.forEach((key) => {
        const [studentId] = key.split("-sem-");
        if (updatedStudentInfo[studentId]) {
          updatedStudentInfo[studentId] = {
            ...updatedStudentInfo[studentId],
            currentSemester: Math.min(8, updatedStudentInfo[studentId].currentSemester + 1),
          };
        }
      });

      const remainingEnrollments = prev.enrollments.filter(
        (enrollment) => !removals.has(`${enrollment.studentId}-${enrollment.courseId}`),
      );

      const activePairs = new Set(remainingEnrollments.map((item) => `${item.courseId}-${item.section}`));
      const remainingAssignments = prev.teachingAssignments.filter((assignment) =>
        activePairs.has(`${assignment.courseId}-${assignment.section}`),
      );

      return {
        ...prev,
        transcript: transcriptUpdates,
        studentInfo: updatedStudentInfo,
        enrollments: remainingEnrollments,
        teachingAssignments: remainingAssignments,
        automation: {
          ...prev.automation,
          processedStudentSemesters: nextProcessed,
        },
      };
    });
  };

  useEffect(() => {
    if (!state.automation.autoFinalizeEnabled) return;
    runAutoFinalization();
  }, [state.assessmentScores, state.assessmentTemplates, state.enrollments, state.automation.autoFinalizeEnabled]);

  const updateRegistrationWindow = (field: "start" | "end", value: string) => {
    setState((prev) => ({
      ...prev,
      windows: { ...prev.windows, registration: { ...prev.windows.registration, [field]: value } },
    }));
  };

  const setRegistrationWindowState = (isOpen: boolean) => {
    setState((prev) => ({
      ...prev,
      windows: { ...prev.windows, registration: { ...prev.windows.registration, isOpen } },
    }));
  };


  const createTeachingAssignment = () => {
    if (!currentUser || currentUser.role !== "admin") return;
    if (!teacherAssignmentForm.teacherId || !teacherAssignmentForm.courseId || !teacherAssignmentForm.section) return;
    const course = state.courses.find((item) => item.id === teacherAssignmentForm.courseId);
    const teacher = state.users.find((item) => item.id === teacherAssignmentForm.teacherId);
    if (!course) return;
    if (!teacher || teacher.campus !== currentUser.campus) return;
    if (teacherAssignmentForm.part === "lab" && !course.hasLab) return;

    const exists = state.teachingAssignments.some(
      (assignment) =>
        assignment.courseId === teacherAssignmentForm.courseId &&
        assignment.section === teacherAssignmentForm.section &&
        assignment.teacherId === teacherAssignmentForm.teacherId &&
        assignment.part === teacherAssignmentForm.part,
    );
    if (exists) return;

    setState((prev) => ({
      ...prev,
      teachingAssignments: [
        {
          id: `ta-${Date.now()}`,
          courseId: teacherAssignmentForm.courseId,
          section: teacherAssignmentForm.section,
          teacherId: teacherAssignmentForm.teacherId,
          part: teacherAssignmentForm.part,
        },
        ...prev.teachingAssignments,
      ],
    }));
  };

  const removeTeachingAssignment = (id: string) => {
    setState((prev) => ({
      ...prev,
      teachingAssignments: prev.teachingAssignments.filter((item) => item.id !== id),
    }));
  };

  const assignStudentByAdmin = () => {
    if (!currentUser || currentUser.role !== "admin") return;
    if (!studentAssignmentForm.studentId || !studentAssignmentForm.courseId || !studentAssignmentForm.section) return;
    const course = state.courses.find((item) => item.id === studentAssignmentForm.courseId);
    const student = state.users.find((item) => item.id === studentAssignmentForm.studentId);
    if (!course) return;
    if (!student || student.campus !== currentUser.campus) return;
    if (studentAssignmentForm.includeLab && !course.hasLab) return;

    const alreadyEnrolled = state.enrollments.some(
      (item) => item.studentId === studentAssignmentForm.studentId && item.courseId === studentAssignmentForm.courseId,
    );
    if (alreadyEnrolled) return;

    setState((prev) => ({
      ...prev,
      enrollments: [
        ...prev.enrollments,
        {
          studentId: studentAssignmentForm.studentId,
          courseId: studentAssignmentForm.courseId,
          section: studentAssignmentForm.section,
          includeLab: studentAssignmentForm.includeLab,
        },
      ],
      marks: prev.marks.some(
        (entry) => entry.studentId === studentAssignmentForm.studentId && entry.courseId === studentAssignmentForm.courseId,
      )
        ? prev.marks
        : [
            ...prev.marks,
            {
              studentId: studentAssignmentForm.studentId,
              courseId: studentAssignmentForm.courseId,
              theory: { assignments: [], quizzes: [], midterm: 0, final: 0 },
              ...(studentAssignmentForm.includeLab ? { lab: { assignments: [], quizzes: [], final: 0 } } : {}),
            },
          ],
      attendance: prev.attendance.some(
        (entry) => entry.studentId === studentAssignmentForm.studentId && entry.courseId === studentAssignmentForm.courseId,
      )
        ? prev.attendance
        : [
            ...prev.attendance,
            {
              studentId: studentAssignmentForm.studentId,
              courseId: studentAssignmentForm.courseId,
              theory: [],
              lab: [],
            },
          ],
    }));
  };

  const updateTranscriptByAdmin = () => {
    if (!currentUser || currentUser.role !== "admin") return;
    if (!transcriptForm.studentId || !transcriptForm.term.trim() || !transcriptForm.courseId || !transcriptForm.grade) {
      setTranscriptMessage("Please complete student, term, course, and grade.");
      return;
    }
    const student = state.users.find((item) => item.id === transcriptForm.studentId);
    if (!student || student.campus !== currentUser.campus) {
      setTranscriptMessage("You can only update transcript records for your campus students.");
      return;
    }
    const credits = Number(transcriptForm.credits);
    if (!Number.isFinite(credits) || credits <= 0) {
      setTranscriptMessage("Credits must be greater than zero.");
      return;
    }

    setState((prev) => {
      const existing = [...(prev.transcript[transcriptForm.studentId] ?? [])];
      const termIndex = existing.findIndex((semester) => semester.term === transcriptForm.term);

      if (termIndex === -1) {
        existing.push({
          term: transcriptForm.term,
          courses: [{ courseId: transcriptForm.courseId, grade: transcriptForm.grade, credits }],
          sgpa: 0,
          cgpa: 0,
        });
      } else {
        const semester = existing[termIndex];
        const courseIndex = semester.courses.findIndex((course) => course.courseId === transcriptForm.courseId);
        if (courseIndex === -1) {
          semester.courses.push({ courseId: transcriptForm.courseId, grade: transcriptForm.grade, credits });
        } else {
          semester.courses[courseIndex] = { courseId: transcriptForm.courseId, grade: transcriptForm.grade, credits };
        }
      }

      return {
        ...prev,
        transcript: {
          ...prev.transcript,
          [transcriptForm.studentId]: recalculateTranscript(existing),
        },
      };
    });

    setTranscriptMessage("Transcript updated successfully.");
  };

  if (!currentUser) {
    return (
      <main className="auth-aura relative min-h-screen overflow-hidden text-white">
        <div className="aura-grid pointer-events-none absolute inset-0" />
        <motion.div
          className="pointer-events-none absolute -left-20 top-8 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl"
          animate={{ x: [0, 36, 0], y: [0, 18, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl"
          animate={{ x: [0, -24, 0], y: [0, 28, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.section
          className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-14 lg:px-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.95fr] lg:items-end">
            <div className="space-y-9">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/90">Next Generation Campus Operating System</p>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">Flex 2.0</h1>
              <p className="max-w-3xl text-lg leading-relaxed text-sky-100/95">
                A unified academic command layer for admissions, teaching, evaluation, student lifecycle, and campus operations. Built to replace fragmented university workflows with one high-trust system.
              </p>
              <p className="text-sm text-sky-100/80">Sign in with your institutional roll number and password.</p>
            </div>
            <div className="halo-shell p-6">
              <div className="space-y-4">
                <label className="block text-sm">
                  Roll Number
                  <input
                    className="mt-1 w-full rounded-xl border border-blue-200/30 bg-white/95 px-3 py-2.5 text-blue-950 outline-none focus:ring-2 focus:ring-blue-300"
                    value={loginInput.rollNumber}
                    onChange={(event) => setLoginInput((prev) => ({ ...prev, rollNumber: event.target.value }))}
                  />
                </label>
                <label className="block text-sm">
                  Password
                  <input
                    type="password"
                    className="mt-1 w-full rounded-xl border border-blue-200/30 bg-white/95 px-3 py-2.5 text-blue-950 outline-none focus:ring-2 focus:ring-blue-300"
                    value={loginInput.password}
                    onChange={(event) => setLoginInput((prev) => ({ ...prev, password: event.target.value }))}
                  />
                </label>
                {loginError ? <p className="text-sm text-rose-200">{loginError}</p> : null}
                <button
                  onClick={login}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-200 to-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-900 transition hover:from-cyan-100 hover:to-white"
                >
                  Enter Flex 2.0
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="app-canvas workspace min-h-screen text-blue-950">
      <header className="soft-divider border-b bg-white/70 px-4 py-4 backdrop-blur-xl lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Flex 2.0</p>
            <h1 className="text-xl font-semibold tracking-tight">University Operating System</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{currentUser.profile.fullName}</p>
              <p className="text-xs text-blue-700">{roleLabels[currentUser.role]} | {currentUser.campus}</p>
            </div>
            <button onClick={logout} className="rounded-xl border border-blue-200/80 bg-white/80 px-3 py-1.5 text-sm hover:bg-blue-100">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="glass-shell space-y-1 rounded-2xl p-3">
          {roleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`nav-button ${
                activeTab === tab.key ? "nav-button-active" : ""
              }`}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        <section className="glass-shell rounded-2xl p-5 lg:p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {activeTab === "profile" && (
                <div className="space-y-5">
                  {sectionTitle("Profile", "Core account profile with university identity details")}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border-b border-blue-100 pb-2">
                      <p className="text-xs uppercase tracking-wide text-blue-700">Roll Number</p>
                      <p className="font-medium">{currentUser.rollNumber}</p>
                    </div>
                    <div className="border-b border-blue-100 pb-2">
                      <p className="text-xs uppercase tracking-wide text-blue-700">Campus</p>
                      <p className="font-medium">{currentUser.campus}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(currentUser.profile).map(([key, value]) => (
                      <div key={key} className="border-b border-blue-100 pb-2">
                        <p className="text-xs uppercase tracking-wide text-blue-700">{key.replace(/([A-Z])/g, " $1")}</p>
                        <p className="font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "password" && (
                <div className="space-y-5">
                  {sectionTitle("Change Password", "Update credentials for your own account only")}
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="text-sm">
                      Current Password
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </label>
                    <label className="text-sm">
                      New Password
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </label>
                    <label className="text-sm">
                      Confirm Password
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </label>
                  </div>
                  <button onClick={updatePassword} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    Save Password
                  </button>
                  {passwordMessage ? <p className="text-sm text-blue-700">{passwordMessage}</p> : null}
                </div>
              )}

              {currentUser.role === "student" && activeTab === "university" && studentInfo && (
                <div className="space-y-5">
                  {sectionTitle("University Information", "Academic profile details specific to student identity")}
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(studentInfo).map(([key, value]) => (
                      <div key={key} className="border-b border-blue-100 pb-2">
                        <p className="text-xs uppercase tracking-wide text-blue-700">{key.replace(/([A-Z])/g, " $1")}</p>
                        <p className="font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentUser.role === "student" && (activeTab === "marks" || activeTab === "attendance") && (
                <div className="space-y-5">
                  {sectionTitle(
                    activeTab === "marks" ? "Marks" : "Attendance",
                    "Theory and Lab are separated to reflect different instructors and evaluation streams",
                  )}
                  <div className="flex flex-wrap gap-2">
                    {studentEnrollments.map((enrollment) => {
                      const course = state.courses.find((item) => item.id === enrollment.courseId);
                      if (!course) return null;
                      return (
                        <button
                          key={enrollment.courseId}
                          onClick={() => setSelectedStudentCourse(enrollment.courseId)}
                          className={`rounded-lg border px-3 py-1.5 text-sm ${
                            selectedStudentCourse === enrollment.courseId
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-blue-200 text-blue-900 hover:bg-blue-100"
                          }`}
                        >
                          {course.code}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-sm font-medium text-blue-900">{getCourseLabel(state.courses, selectedStudentCourse)}</p>

                  {activeTab === "marks" ? (
                    <div className="space-y-5">
                      {studentAssessmentRows.length ? (
                        studentAssessmentRows.map((template) => {
                          const classStudentIds = state.enrollments
                            .filter((item) => item.courseId === template.courseId && item.section === template.section)
                            .map((item) => item.studentId);
                          const classScores = classStudentIds
                            .map(
                              (studentId) =>
                                state.assessmentScores.find(
                                  (score) => score.assessmentId === template.id && score.studentId === studentId,
                                )?.obtainedMarks ?? 0,
                            )
                            .filter((value) => Number.isFinite(value));
                          const myScore =
                            state.assessmentScores.find(
                              (score) => score.assessmentId === template.id && score.studentId === currentUser.id,
                            )?.obtainedMarks ?? 0;
                          return (
                            <div key={template.id} className="space-y-2 border border-blue-100 p-4">
                              <p className="font-medium">
                                {template.part.toUpperCase()} | {template.category} | {template.title}
                              </p>
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="bg-blue-600 text-white">
                                      <th className="px-3 py-2 text-left">Weightage</th>
                                      <th className="px-3 py-2 text-left">Obtained</th>
                                      <th className="px-3 py-2 text-left">Total</th>
                                      <th className="px-3 py-2 text-left">Average</th>
                                      <th className="px-3 py-2 text-left">Std Dev</th>
                                      <th className="px-3 py-2 text-left">Min</th>
                                      <th className="px-3 py-2 text-left">Max</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="px-3 py-2">{template.weightage}</td>
                                      <td className="px-3 py-2">{myScore.toFixed(2)}</td>
                                      <td className="px-3 py-2">{template.totalMarks}</td>
                                      <td className="px-3 py-2">{getMean(classScores).toFixed(2)}</td>
                                      <td className="px-3 py-2">{getStdDev(classScores).toFixed(2)}</td>
                                      <td className="px-3 py-2">{(classScores.length ? Math.min(...classScores) : 0).toFixed(2)}</td>
                                      <td className="px-3 py-2">{(classScores.length ? Math.max(...classScores) : 0).toFixed(2)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-blue-700">No assessments published for this course yet.</p>
                      )}
                      <div className="space-y-3 border-t border-blue-100 pt-4">
                        <p className="text-sm font-medium">Request marks change (teacher reviews first)</p>
                        <div className="grid gap-3 md:grid-cols-3">
                          <label className="text-sm">
                            Part
                            <select
                              value={marksRequestForm.part}
                              onChange={(event) => setMarksRequestForm((prev) => ({ ...prev, part: event.target.value }))}
                              className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2"
                            >
                              <option value="theory">Theory</option>
                              <option value="lab">Lab</option>
                            </select>
                          </label>
                          <label className="text-sm">
                            Component
                            <input
                              value={marksRequestForm.component}
                              onChange={(event) => setMarksRequestForm((prev) => ({ ...prev, component: event.target.value }))}
                              className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2"
                            />
                          </label>
                          <label className="text-sm">
                            Reasoning
                            <input
                              value={marksRequestForm.reason}
                              onChange={(event) => setMarksRequestForm((prev) => ({ ...prev, reason: event.target.value }))}
                              className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2"
                            />
                          </label>
                        </div>
                        <button onClick={submitMarksRequest} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
                          Submit Marks Change Request
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === "attendance" ? (
                    <div className="space-y-5">
                      <div className="space-y-2 border border-blue-100 p-4">
                        <p className="font-medium">Attendance Sessions</p>
                        {studentCourseSessions.length ? (
                          studentCourseSessions.map((session) => {
                            const present =
                              state.sessionAttendance.find(
                                (entry) => entry.sessionId === session.id && entry.studentId === currentUser.id,
                              )?.present ?? false;
                            return (
                              <p key={session.id} className="text-sm">
                                {session.date} | {session.part.toUpperCase()} | {present ? "Present" : "Absent"}
                              </p>
                            );
                          })
                        ) : (
                          <p className="text-sm text-blue-700">No attendance sessions published yet.</p>
                        )}
                      </div>
                      <div className="space-y-3 border-t border-blue-100 pt-4">
                        <p className="text-sm font-medium">Request attendance change</p>
                        <div className="grid gap-3 md:grid-cols-3">
                          <label className="text-sm">
                            Part
                            <select
                              value={attendanceRequestForm.part}
                              onChange={(event) => setAttendanceRequestForm((prev) => ({ ...prev, part: event.target.value }))}
                              className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2"
                            >
                              <option value="theory">Theory</option>
                              <option value="lab">Lab</option>
                            </select>
                          </label>
                          <label className="text-sm">
                            Date
                            <input
                              type="date"
                              value={attendanceRequestForm.date}
                              onChange={(event) => setAttendanceRequestForm((prev) => ({ ...prev, date: event.target.value }))}
                              className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2"
                            />
                          </label>
                          <label className="text-sm">
                            Reasoning
                            <input
                              value={attendanceRequestForm.reason}
                              onChange={(event) => setAttendanceRequestForm((prev) => ({ ...prev, reason: event.target.value }))}
                              className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2"
                            />
                          </label>
                        </div>
                        <button onClick={submitAttendanceRequest} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
                          Submit Attendance Change Request
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="border-t border-blue-100 pt-4 text-sm">
                    <p className="font-medium">Your request history</p>
                    {state.marksChangeRequests
                      .filter((item) => item.studentId === currentUser.id)
                      .slice(0, 3)
                      .map((item) => (
                        <p key={item.id}>
                          Marks {getCourseLabel(state.courses, item.courseId)} ({item.component}) - Teacher: {item.status}, Admin: {item.adminStatus}
                        </p>
                      ))}
                    {state.attendanceChangeRequests
                      .filter((item) => item.studentId === currentUser.id)
                      .slice(0, 3)
                      .map((item) => (
                        <p key={item.id}>
                          Attendance {getCourseLabel(state.courses, item.courseId)} ({item.date}) - Teacher: {item.status}, Admin: {item.adminStatus}
                        </p>
                      ))}
                  </div>
                </div>
              )}

              {currentUser.role === "student" && activeTab === "registration" && (
                <div className="space-y-5">
                  {sectionTitle("Register Courses", "Registration opens and closes under Admin-controlled semester windows")}
                  <p className="text-sm text-blue-700">
                    Window: {state.windows.registration.start} to {state.windows.registration.end} | {isRegistrationOpen ? "Open" : "Closed"}
                  </p>
                  <p className="text-sm text-blue-700">Registered this semester: {studentEnrollments.length}/6 courses</p>
                  <div className="space-y-3">
                    {eligibleCourses.length ? (
                      eligibleCourses.map((course) => {
                        const includeLab = registrationLabSelection[course.id] ?? false;
                        return (
                          <div key={course.id} className="grid gap-3 border border-blue-100 p-4 md:grid-cols-[1fr_auto_auto]">
                            <div>
                              <p className="font-medium">{course.code} - {course.title}</p>
                              <p className="text-sm text-blue-700">Prerequisites satisfied</p>
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={includeLab}
                                disabled={!course.hasLab}
                                onChange={(event) =>
                                  setRegistrationLabSelection((prev) => ({ ...prev, [course.id]: event.target.checked }))
                                }
                              />
                              Include Lab
                            </label>
                            <button
                              disabled={!isRegistrationOpen || studentEnrollments.length >= 6}
                              onClick={() => {
                                registerCourse(course.id, includeLab);
                                setRegistrationLabSelection((prev) => ({ ...prev, [course.id]: false }));
                              }}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                            >
                              Register
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-blue-700">No eligible course currently available.</p>
                    )}
                  </div>
                </div>
              )}

              {currentUser.role === "student" && activeTab === "transcript" && (
                <div className="space-y-5">
                  {sectionTitle("Transcript", "Semester-wise grades with SGPA and running CGPA")}
                  {(state.transcript[currentUser.id] ?? []).map((semester) => (
                    <div key={semester.term} className="space-y-2 border border-blue-100 p-4">
                      <p className="font-semibold">{semester.term}</p>
                      {semester.courses.map((course) => (
                        <p key={`${semester.term}-${course.courseId}`} className="text-sm">
                          {course.courseId.toUpperCase()} - Grade {course.grade} ({course.credits} CH)
                        </p>
                      ))}
                      <p className="text-sm">SGPA: {semester.sgpa.toFixed(2)} | CGPA: {semester.cgpa.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}

              {currentUser.role === "student" && activeTab === "fee" && (
                <div className="space-y-5">
                  {sectionTitle("Fee", "All fee details and generated vouchers")}
                  {(state.fees[currentUser.id] ?? []).map((voucher) => (
                    <div key={voucher.id} className="grid gap-2 border border-blue-100 p-4 md:grid-cols-4">
                      <p className="font-medium">{voucher.title}</p>
                      <p className="text-sm">{formatCurrency(voucher.amount)}</p>
                      <p className="text-sm">Due: {voucher.dueDate}</p>
                      <p className="text-sm">Status: {voucher.status}</p>
                    </div>
                  ))}
                </div>
              )}

              {currentUser.role === "student" && activeTab === "grade-change" && (
                <div className="space-y-5">
                  {sectionTitle("Grade Change Request", "End-of-semester complaint to Admin if awarded grade is disputed")}
                  <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                    <select
                      value={gradeChangeForm.courseId}
                      onChange={(event) => setGradeChangeForm((prev) => ({ ...prev, courseId: event.target.value }))}
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    >
                      <option value="">Select Course</option>
                      {studentEnrollments.map((item) => (
                        <option key={item.courseId} value={item.courseId}>
                          {getCourseLabel(state.courses, item.courseId)}
                        </option>
                      ))}
                    </select>
                    <input
                      value={gradeChangeForm.reason}
                      onChange={(event) => setGradeChangeForm((prev) => ({ ...prev, reason: event.target.value }))}
                      placeholder="Explain why your final grade should be revised"
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    />
                    <button onClick={submitGradeChange} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
                      Submit
                    </button>
                  </div>
                  {state.gradeChangeRequests
                    .filter((item) => item.studentId === currentUser.id)
                    .map((item) => (
                      <p key={item.id} className="text-sm">
                        {getCourseLabel(state.courses, item.courseId)} - {item.status}
                      </p>
                    ))}
                </div>
              )}

              {currentUser.role === "student" && activeTab === "withdraw" && (
                <div className="space-y-5">
                  {sectionTitle("Course Withdraw", "Submit withdrawal requests for current courses, subject to Admin approval")}
                  <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                    <select
                      value={withdrawForm.courseId}
                      onChange={(event) => setWithdrawForm((prev) => ({ ...prev, courseId: event.target.value }))}
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    >
                      <option value="">Select Course</option>
                      {studentEnrollments.map((item) => (
                        <option key={item.courseId} value={item.courseId}>
                          {getCourseLabel(state.courses, item.courseId)}
                        </option>
                      ))}
                    </select>
                    <input
                      value={withdrawForm.reason}
                      onChange={(event) => setWithdrawForm((prev) => ({ ...prev, reason: event.target.value }))}
                      className="rounded-lg border border-blue-200 px-3 py-2"
                      placeholder="Reason for withdrawal"
                    />
                    <button onClick={submitWithdrawRequest} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
                      Submit
                    </button>
                  </div>
                  {state.withdrawRequests
                    .filter((item) => item.studentId === currentUser.id)
                    .map((item) => (
                      <p key={item.id} className="text-sm">
                        {getCourseLabel(state.courses, item.courseId)} - {item.status}
                      </p>
                    ))}
                </div>
              )}

              {currentUser.role === "student" && activeTab === "feedback" && (
                <div className="space-y-5">
                  {sectionTitle("Course Feedback", "Opens twice per semester with fixed ratings and open-ended teacher feedback")}
                  <p className="text-sm text-blue-700">
                    Window status: {state.windows.feedbackMid ? "Mid-Semester Open" : state.windows.feedbackEnd ? "End-Semester Open" : "Closed"}
                  </p>
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr]">
                    <select
                      value={feedbackForm.courseId}
                      onChange={(event) => setFeedbackForm((prev) => ({ ...prev, courseId: event.target.value }))}
                      className="rounded-lg border border-blue-200 px-3 py-2"
                      disabled={!state.windows.feedbackMid && !state.windows.feedbackEnd}
                    >
                      <option value="">Select Course</option>
                      {studentEnrollments.map((item) => (
                        <option key={item.courseId} value={item.courseId}>
                          {getCourseLabel(state.courses, item.courseId)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={feedbackForm.conceptDelivery}
                      onChange={(event) => setFeedbackForm((prev) => ({ ...prev, conceptDelivery: Number(event.target.value) }))}
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    >
                      {ratingLabels.map((label, index) => (
                        <option key={label} value={index + 1}>
                          Concept clarity: {label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={feedbackForm.teacherEngagement}
                      onChange={(event) => setFeedbackForm((prev) => ({ ...prev, teacherEngagement: Number(event.target.value) }))}
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    >
                      {ratingLabels.map((label, index) => (
                        <option key={label} value={index + 1}>
                          Teacher engagement: {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={feedbackForm.openText}
                    onChange={(event) => setFeedbackForm((prev) => ({ ...prev, openText: event.target.value }))}
                    disabled={!state.windows.feedbackMid && !state.windows.feedbackEnd}
                    className="h-24 w-full rounded-lg border border-blue-200 px-3 py-2"
                    placeholder="Open feedback about course and teacher"
                  />
                  <button
                    onClick={submitFeedback}
                    disabled={!state.windows.feedbackMid && !state.windows.feedbackEnd}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:bg-blue-300"
                  >
                    Submit Feedback
                  </button>
                </div>
              )}

              {currentUser.role === "student" && activeTab === "retake" && (
                <div className="space-y-5">
                  {sectionTitle("Exam Retake", "Theory-only missed exam retake requests, limited to two per student")}
                  <p className="text-sm text-blue-700">Window status: {state.windows.retake ? "Open" : "Closed"}</p>
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <select
                      value={retakeForm.courseId}
                      onChange={(event) => setRetakeForm((prev) => ({ ...prev, courseId: event.target.value }))}
                      disabled={!state.windows.retake}
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    >
                      <option value="">Select Theory Course</option>
                      {studentEnrollments.map((item) => {
                        const course = state.courses.find((courseEntry) => courseEntry.id === item.courseId);
                        if (!course) return null;
                        return (
                          <option key={item.courseId} value={item.courseId}>
                            {course.code} - {course.title}
                          </option>
                        );
                      })}
                    </select>
                    <input
                      value={retakeForm.reason}
                      onChange={(event) => setRetakeForm((prev) => ({ ...prev, reason: event.target.value }))}
                      disabled={!state.windows.retake}
                      className="rounded-lg border border-blue-200 px-3 py-2"
                      placeholder="Reason"
                    />
                    <input
                      value={retakeForm.evidence}
                      onChange={(event) => setRetakeForm((prev) => ({ ...prev, evidence: event.target.value }))}
                      disabled={!state.windows.retake}
                      className="rounded-lg border border-blue-200 px-3 py-2"
                      placeholder="Document reference"
                    />
                    <button
                      onClick={submitRetakeRequest}
                      disabled={!state.windows.retake}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:bg-blue-300"
                    >
                      Request
                    </button>
                  </div>
                  <p className="text-sm text-blue-700">Used attempts: {state.retakeRequests.filter((item) => item.studentId === currentUser.id).length}/2</p>
                </div>
              )}

              {currentUser.role === "teacher" && activeTab === "teacher-marks" && (
                <div className="space-y-5">
                  {sectionTitle("Manage Marks", "Create assessments dynamically and enter marks in table form")}
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] border border-blue-100 p-4">
                    <select
                      value={assessmentForm.courseId}
                      onChange={(event) => setAssessmentForm((prev) => ({ ...prev, courseId: event.target.value, section: "" }))}
                    >
                      <option value="">Course</option>
                      {teacherManagedSlots.map((slot) => (
                        <option key={`${slot.id}-course`} value={slot.courseId}>
                          {getCourseLabel(state.courses, slot.courseId)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={assessmentForm.section}
                      onChange={(event) => setAssessmentForm((prev) => ({ ...prev, section: event.target.value }))}
                    >
                      <option value="">Section</option>
                      {[...new Set(teacherManagedSlots.filter((s) => s.courseId === assessmentForm.courseId).map((s) => s.section))].map(
                        (section) => (
                          <option key={section} value={section}>
                            {section}
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      value={assessmentForm.part}
                      onChange={(event) => setAssessmentForm((prev) => ({ ...prev, part: event.target.value as "theory" | "lab" }))}
                    >
                      <option value="theory">Theory</option>
                      <option value="lab">Lab</option>
                    </select>
                    <select
                      value={assessmentForm.category}
                      onChange={(event) =>
                        setAssessmentForm((prev) => ({
                          ...prev,
                          category: event.target.value as "Assignment" | "Quiz" | "Midterm" | "Final" | "Project",
                        }))
                      }
                    >
                      {(["Assignment", "Quiz", "Midterm", "Final", "Project"] as const).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <input
                      value={assessmentForm.title}
                      onChange={(event) => setAssessmentForm((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="Title"
                    />
                    <input
                      type="number"
                      value={assessmentForm.weightage}
                      onChange={(event) => setAssessmentForm((prev) => ({ ...prev, weightage: Number(event.target.value) }))}
                      placeholder="Weightage"
                    />
                    <button onClick={createAssessmentTemplate} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
                      Add Assessment
                    </button>
                  </div>
                  {state.assessmentTemplates
                    .filter((template) => template.createdByTeacherId === currentUser.id)
                    .map((template) => {
                      const enrolledStudents = state.enrollments.filter(
                        (enrollment) => enrollment.courseId === template.courseId && enrollment.section === template.section,
                      );
                      const classScores = enrolledStudents.map(
                        (enrollment) =>
                          state.assessmentScores.find(
                            (score) => score.assessmentId === template.id && score.studentId === enrollment.studentId,
                          )?.obtainedMarks ?? 0,
                      );
                      return (
                        <div key={template.id} className="space-y-3 border border-blue-100 p-4">
                          <p className="font-medium">
                            {getCourseLabel(state.courses, template.courseId)} | Section {template.section} | {template.part.toUpperCase()} | {template.category}
                            : {template.title}
                          </p>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="bg-blue-600 text-white">
                                  <th className="px-3 py-2 text-left">Student</th>
                                  <th className="px-3 py-2 text-left">Weightage</th>
                                  <th className="px-3 py-2 text-left">Obtained</th>
                                  <th className="px-3 py-2 text-left">Total</th>
                                  <th className="px-3 py-2 text-left">Average</th>
                                  <th className="px-3 py-2 text-left">Std Dev</th>
                                  <th className="px-3 py-2 text-left">Min</th>
                                  <th className="px-3 py-2 text-left">Max</th>
                                </tr>
                              </thead>
                              <tbody>
                                {enrolledStudents.map((enrollment) => {
                                  const student = state.users.find((user) => user.id === enrollment.studentId);
                                  const obtained =
                                    state.assessmentScores.find(
                                      (score) => score.assessmentId === template.id && score.studentId === enrollment.studentId,
                                    )?.obtainedMarks ?? 0;
                                  return (
                                    <tr key={`${template.id}-${enrollment.studentId}`}>
                                      <td className="px-3 py-2">{student?.profile.fullName}</td>
                                      <td className="px-3 py-2">{template.weightage}</td>
                                      <td className="px-3 py-2">
                                        <input
                                          type="number"
                                          value={obtained}
                                          onChange={(event) =>
                                            updateAssessmentScore(template.id, enrollment.studentId, Number(event.target.value))
                                          }
                                          className="w-24"
                                        />
                                      </td>
                                      <td className="px-3 py-2">{template.totalMarks}</td>
                                      <td className="px-3 py-2">{getMean(classScores).toFixed(2)}</td>
                                      <td className="px-3 py-2">{getStdDev(classScores).toFixed(2)}</td>
                                      <td className="px-3 py-2">{(classScores.length ? Math.min(...classScores) : 0).toFixed(2)}</td>
                                      <td className="px-3 py-2">{(classScores.length ? Math.max(...classScores) : 0).toFixed(2)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {currentUser.role === "teacher" && activeTab === "teacher-attendance" && (
                <div className="space-y-5">
                  {sectionTitle("Manage Attendance", "Create class days and mark attendance of students by section")}
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto] border border-blue-100 p-4">
                    <select
                      value={attendanceSessionForm.courseId}
                      onChange={(event) => setAttendanceSessionForm((prev) => ({ ...prev, courseId: event.target.value, section: "" }))}
                    >
                      <option value="">Course</option>
                      {teacherManagedSlots.map((slot) => (
                        <option key={`${slot.id}-session`} value={slot.courseId}>
                          {getCourseLabel(state.courses, slot.courseId)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={attendanceSessionForm.section}
                      onChange={(event) => setAttendanceSessionForm((prev) => ({ ...prev, section: event.target.value }))}
                    >
                      <option value="">Section</option>
                      {[...new Set(teacherManagedSlots.filter((s) => s.courseId === attendanceSessionForm.courseId).map((s) => s.section))].map(
                        (section) => (
                          <option key={section} value={section}>
                            {section}
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      value={attendanceSessionForm.part}
                      onChange={(event) => setAttendanceSessionForm((prev) => ({ ...prev, part: event.target.value as "theory" | "lab" }))}
                    >
                      <option value="theory">Theory</option>
                      <option value="lab">Lab</option>
                    </select>
                    <input
                      type="date"
                      value={attendanceSessionForm.date}
                      onChange={(event) => setAttendanceSessionForm((prev) => ({ ...prev, date: event.target.value }))}
                    />
                    <button onClick={createAttendanceSession} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
                      Add Day
                    </button>
                  </div>
                  {state.attendanceSessions
                    .filter((session) => session.createdByTeacherId === currentUser.id)
                    .map((session) => {
                      const enrolledStudents = state.enrollments.filter(
                        (enrollment) => enrollment.courseId === session.courseId && enrollment.section === session.section,
                      );
                      return (
                        <div key={session.id} className="space-y-2 border border-blue-100 p-4">
                          <p className="font-medium">
                            {getCourseLabel(state.courses, session.courseId)} | Section {session.section} | {session.part.toUpperCase()} | {session.date}
                          </p>
                          {enrolledStudents.map((enrollment) => {
                            const student = state.users.find((user) => user.id === enrollment.studentId);
                            const present =
                              state.sessionAttendance.find(
                                (entry) => entry.sessionId === session.id && entry.studentId === enrollment.studentId,
                              )?.present ?? false;
                            return (
                              <label key={`${session.id}-${enrollment.studentId}`} className="flex items-center gap-2 text-sm">
                                <span>{student?.profile.fullName}</span>
                                <input
                                  type="checkbox"
                                  checked={present}
                                  onChange={(event) => markSessionAttendance(session.id, enrollment.studentId, event.target.checked)}
                                />
                                <span>{present ? "Present" : "Absent"}</span>
                              </label>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              )}

              {currentUser.role === "teacher" && activeTab === "teacher-requests" && (
                <div className="space-y-6">
                  {sectionTitle("Student Change Requests", "Approve or deny marks and attendance change requests")}
                  <div className="space-y-3">
                    <p className="font-medium">Marks Change Requests</p>
                    {state.marksChangeRequests.filter((request) => teacherCanHandleRequest(request.studentId, request.courseId, request.part)).length ? (
                      state.marksChangeRequests
                        .filter((request) => teacherCanHandleRequest(request.studentId, request.courseId, request.part))
                        .map((request) => (
                        <div key={request.id} className="space-y-2 border border-blue-100 p-4">
                          <p className="text-sm">
                            {getCourseLabel(state.courses, request.courseId)} | {request.part.toUpperCase()} | {request.component}
                          </p>
                          <p className="text-sm text-blue-700">Reason: {request.reason}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateMarksDecision(request.id, "approved", "Approved after rechecking script")}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateMarksDecision(request.id, "denied", "No discrepancy found")}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white"
                            >
                              Deny
                            </button>
                            <span className="text-xs text-blue-700">Status: {request.status}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-blue-700">No marks requests yet.</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="font-medium">Attendance Change Requests</p>
                    {state.attendanceChangeRequests.filter((request) => teacherCanHandleRequest(request.studentId, request.courseId, request.part)).length ? (
                      state.attendanceChangeRequests
                        .filter((request) => teacherCanHandleRequest(request.studentId, request.courseId, request.part))
                        .map((request) => (
                        <div key={request.id} className="space-y-2 border border-blue-100 p-4">
                          <p className="text-sm">
                            {getCourseLabel(state.courses, request.courseId)} | {request.part.toUpperCase()} | {request.date}
                          </p>
                          <p className="text-sm text-blue-700">Reason: {request.reason}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateAttendanceDecision(request.id, "approved", "Attendance corrected")}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateAttendanceDecision(request.id, "denied", "No supporting evidence")}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white"
                            >
                              Deny
                            </button>
                            <span className="text-xs text-blue-700">Status: {request.status}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-blue-700">No attendance requests yet.</p>
                    )}
                  </div>
                </div>
              )}

              {currentUser.role === "teacher" && activeTab === "teacher-feedback" && (
                <div className="space-y-5">
                  {sectionTitle("Anonymous Feedback", "Feedback submitted by students is visible without student identity")}
                  {teacherAnonymousFeedback.length ? (
                    teacherAnonymousFeedback.map((entry) => (
                      <div key={entry.id} className="space-y-1 border border-blue-100 p-4">
                        <p className="text-sm font-medium">{getCourseLabel(state.courses, entry.courseId)} | {entry.phase} Phase</p>
                        <p className="text-sm text-blue-700">Concept delivery: {ratingLabels[entry.conceptDelivery - 1]}</p>
                        <p className="text-sm text-blue-700">Teacher engagement: {ratingLabels[entry.teacherEngagement - 1]}</p>
                        <p className="text-sm">Comment: {entry.openText}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-blue-700">No feedback submitted for your assigned courses yet.</p>
                  )}
                </div>
              )}

              {currentUser.role === "teacher" && activeTab === "maintenance" && (
                <div className="space-y-5">
                  {sectionTitle("Maintenance Request", "Report classroom issues for maintenance staff")}
                  <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                    <input
                      value={maintenanceForm.classroom}
                      onChange={(event) => setMaintenanceForm((prev) => ({ ...prev, classroom: event.target.value }))}
                      placeholder="Classroom (e.g., C-12)"
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    />
                    <input
                      value={maintenanceForm.problem}
                      onChange={(event) => setMaintenanceForm((prev) => ({ ...prev, problem: event.target.value }))}
                      placeholder="Issue description"
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    />
                    <button onClick={submitMaintenance} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
                      Send
                    </button>
                  </div>
                  {state.maintenanceRequests
                    .filter((item) => item.teacherId === currentUser.id)
                    .map((item) => (
                      <p key={item.id} className="text-sm">
                        {item.classroom} - {item.problem} ({item.status})
                      </p>
                    ))}
                </div>
              )}

              {currentUser.role === "teacher" && activeTab === "extra-class" && (
                <div className="space-y-5">
                  {sectionTitle("Extra Class Request", "Request additional class slots to be approved or scheduled by secretariat")}
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">
                    <select
                      value={extraClassForm.courseId}
                      onChange={(event) => setExtraClassForm((prev) => ({ ...prev, courseId: event.target.value }))}
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    >
                      <option value="">Course</option>
                      {state.courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code}
                        </option>
                      ))}
                    </select>
                    <input
                      value={extraClassForm.section}
                      onChange={(event) => setExtraClassForm((prev) => ({ ...prev, section: event.target.value }))}
                      placeholder="Section"
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    />
                    <input
                      value={extraClassForm.reason}
                      onChange={(event) => setExtraClassForm((prev) => ({ ...prev, reason: event.target.value }))}
                      placeholder="Reason"
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    />
                    <button onClick={submitExtraClass} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
                      Request
                    </button>
                  </div>
                  {state.extraClassRequests
                    .filter((item) => item.teacherId === currentUser.id)
                    .map((item) => (
                      <p key={item.id} className="text-sm">
                        {getCourseLabel(state.courses, item.courseId)} ({item.section}) - {item.status}
                        {item.scheduleNote ? ` - ${item.scheduleNote}` : ""}
                      </p>
                    ))}
                </div>
              )}

              {currentUser.role === "maintenance" && activeTab === "maintenance-board" && (
                <div className="space-y-5">
                  {sectionTitle("Maintenance Board", "Receive teacher notifications, resolve classroom issues, and mark fixed")}
                  {state.maintenanceRequests.length ? (
                    state.maintenanceRequests.map((item) => {
                      const teacher = state.users.find((user) => user.id === item.teacherId);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex flex-wrap items-center justify-between gap-3 border border-blue-100 p-4"
                        >
                          <div>
                            <p className="font-medium">{item.classroom}</p>
                            <p className="text-sm text-blue-700">{item.problem}</p>
                            <p className="text-xs text-blue-600">Requested by {teacher?.profile.fullName}</p>
                          </div>
                          <button
                            disabled={item.status === "fixed"}
                            onClick={() => markMaintenanceFixed(item.id)}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:bg-blue-300"
                          >
                            {item.status === "fixed" ? "Fixed" : "Mark Fixed"}
                          </button>
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-blue-700">No notifications yet.</p>
                  )}
                </div>
              )}

              {currentUser.role === "secretariat" && activeTab === "extra-class-board" && (
                <div className="space-y-5">
                  {sectionTitle("Extra Class Desk", "Review teacher requests and approve, schedule, or deny")}
                  {state.extraClassRequests.length ? (
                    state.extraClassRequests.map((item) => {
                      const teacher = state.users.find((user) => user.id === item.teacherId);
                      return (
                        <div key={item.id} className="space-y-2 border border-blue-100 p-4">
                          <p className="font-medium">
                            {getCourseLabel(state.courses, item.courseId)} - Section {item.section}
                          </p>
                          <p className="text-sm text-blue-700">Teacher: {teacher?.profile.fullName}</p>
                          <p className="text-sm text-blue-700">Reason: {item.reason}</p>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => updateExtraClassStatus(item.id, "approved")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white">
                              Approve
                            </button>
                            <button
                              onClick={() => updateExtraClassStatus(item.id, "scheduled", "Tue 2:00 PM | Room B-14")}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white"
                            >
                              Schedule
                            </button>
                            <button onClick={() => updateExtraClassStatus(item.id, "denied")} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white">
                              Deny
                            </button>
                            <span className="text-xs text-blue-700">Status: {item.status}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-blue-700">No extra class requests available.</p>
                  )}
                </div>
              )}

              {currentUser.role === "admin" && activeTab === "user-management" && (
                <div className="space-y-6">
                  {sectionTitle(
                    "Manage Users",
                    `Campus-locked administration for ${currentUser.campus}. Six fixed admins (one per campus) cannot be removed.`,
                  )}
                  <p className="text-sm text-blue-700">
                    Programs in {currentUser.campus}: {currentCampusPrograms.length} / {degreePrograms.length} university programs.
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      value={newUserForm.rollNumber}
                      onChange={(event) => setNewUserForm((prev) => ({ ...prev, rollNumber: event.target.value }))}
                      placeholder="Roll Number"
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    />
                    <input
                      value={newUserForm.password}
                      onChange={(event) => setNewUserForm((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="Password"
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    />
                    <select
                      value={newUserForm.role}
                      onChange={(event) =>
                        setNewUserForm((prev) => ({
                          ...prev,
                          role: event.target.value as Role,
                          degree: campusPrograms[prev.campus][0],
                          currentSemester: 1,
                        }))
                      }
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="secretariat">Secretariat</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                    <div className="rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-sm">
                      Campus: {newUserForm.campus}
                    </div>
                    {newUserForm.role === "student" ? (
                      <>
                        <select
                          value={newUserForm.degree}
                          onChange={(event) => setNewUserForm((prev) => ({ ...prev, degree: event.target.value }))}
                          className="rounded-lg border border-blue-200 px-3 py-2"
                        >
                          {currentCampusPrograms.map((program) => (
                            <option key={program} value={program}>
                              {program}
                            </option>
                          ))}
                        </select>
                        <select
                          value={newUserForm.currentSemester}
                          onChange={(event) => setNewUserForm((prev) => ({ ...prev, currentSemester: Number(event.target.value) }))}
                          className="rounded-lg border border-blue-200 px-3 py-2"
                        >
                          {Array.from({ length: 8 }, (_, i) => i + 1).map((semester) => (
                            <option key={semester} value={semester}>
                              Semester {semester}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <div className="rounded-lg border border-blue-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">Degree not required</div>
                    )}
                    <input
                      value={newUserForm.fullName}
                      onChange={(event) => setNewUserForm((prev) => ({ ...prev, fullName: event.target.value }))}
                      placeholder="Full Name"
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    />
                    <input
                      value={newUserForm.email}
                      onChange={(event) => setNewUserForm((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="Email"
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    />
                    <input
                      value={newUserForm.number}
                      onChange={(event) => setNewUserForm((prev) => ({ ...prev, number: event.target.value }))}
                      placeholder="Phone Number"
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    />
                    <input
                      value={newUserForm.gender}
                      onChange={(event) => setNewUserForm((prev) => ({ ...prev, gender: event.target.value }))}
                      placeholder="Gender"
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    />
                    <input
                      type="date"
                      value={newUserForm.dob}
                      onChange={(event) => setNewUserForm((prev) => ({ ...prev, dob: event.target.value }))}
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    />
                    <input
                      value={newUserForm.cnic}
                      onChange={(event) => setNewUserForm((prev) => ({ ...prev, cnic: event.target.value }))}
                      placeholder="CNIC"
                      className="rounded-lg border border-blue-200 px-3 py-2"
                    />
                  </div>
                  <button onClick={createUser} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
                    Add User
                  </button>
                  <div className="space-y-3 border border-blue-100 p-4">
                    <p className="font-medium">Update Existing User</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      <select
                        value={selectedManagedUserId}
                        onChange={(event) => setSelectedManagedUserId(event.target.value)}
                      >
                        <option value="">Select User</option>
                        {state.users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.rollNumber} - {user.profile.fullName}
                          </option>
                        ))}
                      </select>
                      <input
                        value={editUserForm.rollNumber}
                        onChange={(event) => setEditUserForm((prev) => ({ ...prev, rollNumber: event.target.value }))}
                        placeholder="Roll Number"
                        disabled={!selectedManagedUserId}
                      />
                      <select
                        value={editUserForm.role}
                        onChange={(event) => setEditUserForm((prev) => ({ ...prev, role: event.target.value as Role }))}
                        disabled={!selectedManagedUserId}
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="secretariat">Secretariat</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="admin">Admin</option>
                      </select>
                      <select
                        value={editUserForm.campus}
                        onChange={(event) => setEditUserForm((prev) => ({ ...prev, campus: event.target.value as Campus }))}
                        disabled={!selectedManagedUserId}
                      >
                        {(["Karachi", "Lahore", "Islamabad", "CFD", "Multan", "Peshawar"] as Campus[]).map((campus) => (
                          <option key={campus} value={campus}>
                            {campus}
                          </option>
                        ))}
                      </select>
                      <input
                        value={editUserForm.fullName}
                        onChange={(event) => setEditUserForm((prev) => ({ ...prev, fullName: event.target.value }))}
                        placeholder="Full Name"
                        disabled={!selectedManagedUserId}
                      />
                      <input
                        value={editUserForm.email}
                        onChange={(event) => setEditUserForm((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="Email"
                        disabled={!selectedManagedUserId}
                      />
                      <input
                        value={editUserForm.number}
                        onChange={(event) => setEditUserForm((prev) => ({ ...prev, number: event.target.value }))}
                        placeholder="Phone"
                        disabled={!selectedManagedUserId}
                      />
                      <input
                        value={editUserForm.gender}
                        onChange={(event) => setEditUserForm((prev) => ({ ...prev, gender: event.target.value }))}
                        placeholder="Gender"
                        disabled={!selectedManagedUserId}
                      />
                      <input
                        type="date"
                        value={editUserForm.dob}
                        onChange={(event) => setEditUserForm((prev) => ({ ...prev, dob: event.target.value }))}
                        disabled={!selectedManagedUserId}
                      />
                      <input
                        value={editUserForm.cnic}
                        onChange={(event) => setEditUserForm((prev) => ({ ...prev, cnic: event.target.value }))}
                        placeholder="CNIC"
                        disabled={!selectedManagedUserId}
                      />
                      {editUserForm.role === "student" ? (
                        <>
                          <select
                            value={editUserForm.degree}
                            onChange={(event) => setEditUserForm((prev) => ({ ...prev, degree: event.target.value }))}
                            disabled={!selectedManagedUserId}
                          >
                            {(campusPrograms[editUserForm.campus] ?? []).map((program) => (
                              <option key={program} value={program}>
                                {program}
                              </option>
                            ))}
                          </select>
                          <input
                            value={editUserForm.batch}
                            onChange={(event) => setEditUserForm((prev) => ({ ...prev, batch: event.target.value }))}
                            placeholder="Batch"
                            disabled={!selectedManagedUserId}
                          />
                          <select
                            value={editUserForm.currentSemester}
                            onChange={(event) => setEditUserForm((prev) => ({ ...prev, currentSemester: Number(event.target.value) }))}
                            disabled={!selectedManagedUserId}
                          >
                            {Array.from({ length: 8 }, (_, i) => i + 1).map((semester) => (
                              <option key={semester} value={semester}>
                                Semester {semester}
                              </option>
                            ))}
                          </select>
                          <input
                            value={editUserForm.section}
                            onChange={(event) => setEditUserForm((prev) => ({ ...prev, section: event.target.value }))}
                            placeholder="Section"
                            disabled={!selectedManagedUserId}
                          />
                          <select
                            value={editUserForm.status}
                            onChange={(event) =>
                              setEditUserForm((prev) => ({ ...prev, status: event.target.value as "Current" | "Not Current" }))
                            }
                            disabled={!selectedManagedUserId}
                          >
                            <option value="Current">Current</option>
                            <option value="Not Current">Not Current</option>
                          </select>
                        </>
                      ) : null}
                    </div>
                    <button
                      onClick={updateManagedUser}
                      disabled={!selectedManagedUserId}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:bg-blue-300"
                    >
                      Save User Updates
                    </button>
                  </div>
                  <div className="space-y-2">
                    {state.users
                      .filter((user) => user.role === "admin" || user.campus === currentUser.campus)
                      .map((user) => (
                      <div key={user.id} className="flex items-center justify-between border border-blue-100 px-3 py-2 text-sm">
                        <p>
                          {user.rollNumber} ({roleLabels[user.role]}) - {user.campus}
                        </p>
                        <button
                          disabled={user.role === "admin"}
                          onClick={() => removeUser(user.id)}
                          className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentUser.role === "admin" && activeTab === "course-allocation" && (
                <div className="space-y-6">
                  {sectionTitle("Teacher Allocations", "Assign teachers by course, section, and delivery part (theory or lab)")}
                  <div className="grid gap-3 md:grid-cols-5">
                    <select
                      value={teacherAssignmentForm.teacherId}
                      onChange={(event) => setTeacherAssignmentForm((prev) => ({ ...prev, teacherId: event.target.value }))}
                    >
                      <option value="">Teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.rollNumber} - {teacher.profile.fullName}
                        </option>
                      ))}
                    </select>
                    <select
                      value={teacherAssignmentForm.courseId}
                      onChange={(event) =>
                        setTeacherAssignmentForm((prev) => ({
                          ...prev,
                          courseId: event.target.value,
                          section: "",
                        }))
                      }
                    >
                      <option value="">Course</option>
                      {state.courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code}
                        </option>
                      ))}
                    </select>
                    <select
                      value={teacherAssignmentForm.section}
                      onChange={(event) => setTeacherAssignmentForm((prev) => ({ ...prev, section: event.target.value }))}
                    >
                      <option value="">Section</option>
                      {(state.courses.find((item) => item.id === teacherAssignmentForm.courseId)?.sections ?? []).map((section) => (
                        <option key={section} value={section}>
                          {section}
                        </option>
                      ))}
                    </select>
                    <select
                      value={teacherAssignmentForm.part}
                      onChange={(event) =>
                        setTeacherAssignmentForm((prev) => ({ ...prev, part: event.target.value as "theory" | "lab" }))
                      }
                    >
                      <option value="theory">Theory</option>
                      <option value="lab">Lab</option>
                    </select>
                    <button onClick={createTeachingAssignment} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
                      Assign
                    </button>
                  </div>
                  <div className="space-y-2">
                    {state.teachingAssignments
                      .filter((assignment) => {
                        const teacher = state.users.find((item) => item.id === assignment.teacherId);
                        return teacher?.campus === currentUser.campus;
                      })
                      .map((assignment) => {
                      const teacher = state.users.find((item) => item.id === assignment.teacherId);
                      return (
                        <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 border border-blue-100 p-3 text-sm">
                          <p>
                            {getCourseLabel(state.courses, assignment.courseId)} | Section {assignment.section} | {assignment.part.toUpperCase()} | {teacher?.profile.fullName}
                          </p>
                          <button
                            onClick={() => removeTeachingAssignment(assignment.id)}
                            className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentUser.role === "admin" && activeTab === "enrollment-management" && (
                <div className="space-y-6">
                  {sectionTitle("Student Enrollments", "Admin can directly assign students to courses and sections")}
                  <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_1fr_auto_auto]">
                    <select
                      value={studentAssignmentForm.studentId}
                      onChange={(event) => setStudentAssignmentForm((prev) => ({ ...prev, studentId: event.target.value }))}
                    >
                      <option value="">Student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.rollNumber} - {student.profile.fullName}
                        </option>
                      ))}
                    </select>
                    <select
                      value={studentAssignmentForm.courseId}
                      onChange={(event) =>
                        setStudentAssignmentForm((prev) => ({ ...prev, courseId: event.target.value, section: "", includeLab: false }))
                      }
                    >
                      <option value="">Course</option>
                      {state.courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code}
                        </option>
                      ))}
                    </select>
                    <select
                      value={studentAssignmentForm.section}
                      onChange={(event) => setStudentAssignmentForm((prev) => ({ ...prev, section: event.target.value }))}
                    >
                      <option value="">Section</option>
                      {(state.courses.find((item) => item.id === studentAssignmentForm.courseId)?.sections ?? []).map((section) => (
                        <option key={section} value={section}>
                          {section}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 px-2 text-sm">
                      <input
                        type="checkbox"
                        checked={studentAssignmentForm.includeLab}
                        onChange={(event) => setStudentAssignmentForm((prev) => ({ ...prev, includeLab: event.target.checked }))}
                        disabled={!state.courses.find((item) => item.id === studentAssignmentForm.courseId)?.hasLab}
                      />
                      Include Lab
                    </label>
                    <button onClick={assignStudentByAdmin} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
                      Assign
                    </button>
                  </div>
                  <div className="space-y-2">
                    {state.enrollments
                      .filter((enrollment) => {
                        const student = state.users.find((item) => item.id === enrollment.studentId);
                        return student?.campus === currentUser.campus;
                      })
                      .map((enrollment, index) => {
                      const student = state.users.find((item) => item.id === enrollment.studentId);
                      return (
                        <p key={`${enrollment.studentId}-${enrollment.courseId}-${index}`} className="border border-blue-100 px-3 py-2 text-sm">
                          {student?.profile.fullName} ({student?.rollNumber}) | {getCourseLabel(state.courses, enrollment.courseId)} | Section {enrollment.section}
                          {enrollment.includeLab ? " | Theory + Lab" : " | Theory"}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentUser.role === "admin" && activeTab === "transcript-management" && (
                <div className="space-y-6">
                  {sectionTitle("Transcript Control", "Update or insert semester outcomes for any student")}
                  <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_0.8fr_0.7fr_auto]">
                    <select
                      value={transcriptForm.studentId}
                      onChange={(event) => setTranscriptForm((prev) => ({ ...prev, studentId: event.target.value }))}
                    >
                      <option value="">Student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.rollNumber} - {student.profile.fullName}
                        </option>
                      ))}
                    </select>
                    <input
                      value={transcriptForm.term}
                      onChange={(event) => setTranscriptForm((prev) => ({ ...prev, term: event.target.value }))}
                      placeholder="Term (e.g., Spring 2026)"
                    />
                    <select
                      value={transcriptForm.courseId}
                      onChange={(event) => setTranscriptForm((prev) => ({ ...prev, courseId: event.target.value }))}
                    >
                      <option value="">Course</option>
                      {state.courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code}
                        </option>
                      ))}
                    </select>
                    <select
                      value={transcriptForm.grade}
                      onChange={(event) => setTranscriptForm((prev) => ({ ...prev, grade: event.target.value }))}
                    >
                      {Object.keys(gradePointMap).map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={transcriptForm.credits}
                      onChange={(event) => setTranscriptForm((prev) => ({ ...prev, credits: Number(event.target.value) }))}
                    />
                    <button onClick={updateTranscriptByAdmin} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
                      Save
                    </button>
                  </div>
                  {transcriptMessage ? <p className="text-sm text-blue-700">{transcriptMessage}</p> : null}
                  {transcriptForm.studentId ? (
                    <div className="space-y-2">
                      {(state.transcript[transcriptForm.studentId] ?? []).map((semester) => (
                        <div key={semester.term} className="space-y-1 border border-blue-100 p-3 text-sm">
                          <p className="font-medium">{semester.term}</p>
                          {semester.courses.map((course) => (
                            <p key={`${semester.term}-${course.courseId}`}>
                              {getCourseLabel(state.courses, course.courseId)} - {course.grade} ({course.credits} CH)
                            </p>
                          ))}
                          <p>
                            SGPA {semester.sgpa.toFixed(2)} | CGPA {semester.cgpa.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {currentUser.role === "admin" && activeTab === "windows" && (
                <div className="space-y-6">
                  {sectionTitle("Academic Windows", "Admin controls registration, course feedback windows, and exam retake windows")}
                  <div className="space-y-3 border border-blue-100 p-4">
                    <p className="font-medium">Course Registration Window</p>
                    <p className="text-sm text-blue-700">
                      Manual switch: {state.windows.registration.isOpen ? "Open" : "Closed"} | Effective status: {isRegistrationOpen ? "Open" : "Closed"}
                    </p>
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                      <input
                        type="date"
                        value={state.windows.registration.start}
                        onChange={(event) => updateRegistrationWindow("start", event.target.value)}
                        className="rounded-lg border border-blue-200 px-3 py-2"
                      />
                      <input
                        type="date"
                        value={state.windows.registration.end}
                        onChange={(event) => updateRegistrationWindow("end", event.target.value)}
                        className="rounded-lg border border-blue-200 px-3 py-2"
                      />
                      <button
                        onClick={() => setRegistrationWindowState(true)}
                        className="cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => setRegistrationWindowState(false)}
                        className="cursor-pointer rounded-lg border border-blue-300 px-3 py-2 text-sm hover:bg-blue-100"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 border border-blue-100 p-4">
                    <p className="font-medium">Feedback and Retake Windows</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <button
                        onClick={() => setState((prev) => ({ ...prev, windows: { ...prev.windows, feedbackMid: !prev.windows.feedbackMid } }))}
                        className="rounded-lg border border-blue-300 px-3 py-2"
                      >
                        Mid Feedback: {state.windows.feedbackMid ? "Open" : "Closed"}
                      </button>
                      <button
                        onClick={() => setState((prev) => ({ ...prev, windows: { ...prev.windows, feedbackEnd: !prev.windows.feedbackEnd } }))}
                        className="rounded-lg border border-blue-300 px-3 py-2"
                      >
                        End Feedback: {state.windows.feedbackEnd ? "Open" : "Closed"}
                      </button>
                      <button
                        onClick={() => setState((prev) => ({ ...prev, windows: { ...prev.windows, retake: !prev.windows.retake } }))}
                        className="rounded-lg border border-blue-300 px-3 py-2"
                      >
                        Retake: {state.windows.retake ? "Open" : "Closed"}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 border border-blue-100 p-4">
                    <p className="font-medium">Automated Semester Finalization</p>
                    <p className="text-sm text-blue-700">
                      When all final components are submitted for a student's current-semester courses, the system auto-updates transcript, advances semester, and closes those enrollments.
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <button
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            automation: { ...prev.automation, autoFinalizeEnabled: !prev.automation.autoFinalizeEnabled },
                          }))
                        }
                        className="rounded-lg border border-blue-300 px-3 py-2"
                      >
                        Auto Finalization: {state.automation.autoFinalizeEnabled ? "Enabled" : "Disabled"}
                      </button>
                      <button onClick={runAutoFinalization} className="rounded-lg bg-blue-600 px-3 py-2 text-white">
                        Run Finalization Now
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 border border-blue-100 p-4">
                    <p className="font-medium">Submission Integrity Check</p>
                    <p className="text-sm text-blue-700">
                      Validates cross-references across users, student records, enrollments, assessments, sessions, and transcript artifacts.
                    </p>
                    <button onClick={runIntegrityAudit} className="rounded-lg border border-blue-300 px-3 py-2 text-sm">
                      Run Integrity Audit
                    </button>
                    {integrityMessage ? <p className="text-sm text-emerald-700">{integrityMessage}</p> : null}
                  </div>
                </div>
              )}

              {currentUser.role === "admin" && activeTab === "admin-grade-change" && (
                <div className="space-y-5">
                  {sectionTitle("Grade Change Requests", "Admin review for final-grade disputes")}
                  {state.gradeChangeRequests.length ? (
                    state.gradeChangeRequests.map((request) => {
                      const student = state.users.find((user) => user.id === request.studentId);
                      return (
                        <div key={request.id} className="space-y-2 border border-blue-100 p-4">
                          <p className="font-medium">
                            {student?.profile.fullName} - {getCourseLabel(state.courses, request.courseId)}
                          </p>
                          <p className="text-sm text-blue-700">{request.reason}</p>
                          <div className="flex gap-2">
                            <button onClick={() => updateGradeChange(request.id, "approved")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white">
                              Approve
                            </button>
                            <button onClick={() => updateGradeChange(request.id, "denied")} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white">
                              Deny
                            </button>
                            <span className="text-xs text-blue-700">Status: {request.status}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-blue-700">No grade change requests submitted yet.</p>
                  )}
                </div>
              )}

              {currentUser.role === "admin" && activeTab === "admin-withdraw" && (
                <div className="space-y-5">
                  {sectionTitle("Withdraw Requests", "Admin approves or denies course withdrawal requests")}
                  {state.withdrawRequests.length ? (
                    state.withdrawRequests.map((request) => {
                      const student = state.users.find((user) => user.id === request.studentId);
                      return (
                        <div key={request.id} className="space-y-2 border border-blue-100 p-4">
                          <p className="font-medium">
                            {student?.profile.fullName} - {getCourseLabel(state.courses, request.courseId)}
                          </p>
                          <p className="text-sm text-blue-700">{request.reason}</p>
                          <div className="flex gap-2">
                            <button onClick={() => updateWithdraw(request.id, "approved")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white">
                              Approve
                            </button>
                            <button onClick={() => updateWithdraw(request.id, "denied")} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white">
                              Deny
                            </button>
                            <span className="text-xs text-blue-700">Status: {request.status}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-blue-700">No withdrawal requests yet.</p>
                  )}
                </div>
              )}

              {currentUser.role === "admin" && activeTab === "admin-retake" && (
                <div className="space-y-5">
                  {sectionTitle("Exam Retake Requests", "Admin-controlled approval and scheduling for missed theory exams")}
                  {state.retakeRequests.length ? (
                    state.retakeRequests.map((request) => {
                      const student = state.users.find((user) => user.id === request.studentId);
                      return (
                        <div key={request.id} className="space-y-2 border border-blue-100 p-4">
                          <p className="font-medium">
                            {student?.profile.fullName} - {getCourseLabel(state.courses, request.courseId)}
                          </p>
                          <p className="text-sm text-blue-700">Reason: {request.reason}</p>
                          <p className="text-xs text-blue-600">Document: {request.evidence}</p>
                          <div className="flex gap-2">
                            <button onClick={() => updateRetake(request.id, "approved")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white">
                              Approve
                            </button>
                            <button onClick={() => updateRetake(request.id, "denied")} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white">
                              Deny
                            </button>
                            <span className="text-xs text-blue-700">Status: {request.status}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-blue-700">No retake requests yet.</p>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
