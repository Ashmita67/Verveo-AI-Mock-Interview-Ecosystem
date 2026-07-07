# Verveo – AI-Powered Mock Interview Ecosystem

## Introduction

**Verveo** is an AI-powered mock interview platform designed to help students and job seekers prepare for technical, HR, and behavioral interviews through personalized interview experiences. Unlike traditional mock interview platforms, Verveo uses **Resume-Aware Retrieval-Augmented Generation (RAG)** to generate interview questions tailored to a candidate's resume, skills, projects, and experience.

The platform supports **text, audio, and video interviews**, provides **AI-driven answer evaluation**, **ATS resume analysis**, detailed interview reports, and performance analytics to help users continuously improve their interview skills.

---

# Quick Start

## 1. Clone Repository

```bash
git clone <repository-url>
cd Verveo
```

---

## 2. Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## 3. Backend Setup

```bash
cd backend

python3 -m venv venv

source venv/bin/activate

python3 -m pip install -r requirements.txt
```

---

## 4. Configure Environment Variables

Create and configure:

```
backend/.env
```

Important variables include:

* DATABASE_URL
* SECRET_KEY
* GOOGLE_CLIENT_ID
* GOOGLE_CLIENT_SECRET
* GEMINI_API_KEY
* SMTP_SERVER
* SMTP_PORT
* EMAIL_USER
* EMAIL_PASSWORD

---

## 5. Run Database Migrations

```bash
alembic upgrade head
```

---

## 6. Start Backend

```bash
uvicorn app.main:app --reload
```

Backend:

```
http://127.0.0.1:8000
```

Swagger Documentation:

```
http://127.0.0.1:8000/docs
```

---

# Key Features

### Authentication

* JWT Authentication
* Refresh Tokens
* Google OAuth Login
* Email OTP Verification
* Forgot Password & Reset Password

---

### Resume Intelligence

* PDF Resume Upload
* Resume Parsing using PyMuPDF
* ATS Resume Analysis
* Resume Section Extraction
* Resume-Based AI Context

---

### AI-Powered Interview Engine

* Personalized Interview Generation
* Resume-Aware Question Generation (RAG)
* Adaptive Question Difficulty
* Technical, HR, Behavioral & Mixed Interviews

---

### Multiple Interview Modes

* Text Interview
* Audio Interview
* Video Interview

---

### AI Evaluation

* Technical Accuracy
* Communication Skills
* Problem Solving
* Answer Completeness
* AI Feedback
* Ideal Answer Suggestions

---

### Reports & Analytics

* Interview Reports
* Performance Dashboard
* Skill Gap Analysis
* Interview History
* Score Trends
* ATS Score Tracking

---

# Architecture Overview

```
                    React Frontend
                          │
                          ▼
                    FastAPI Backend
                          │
      ┌───────────────────┼───────────────────┐
      ▼                   ▼                   ▼
 PostgreSQL          Gemini API          ChromaDB
      │                   │                   │
      └──────────── Resume RAG Pipeline ──────┘
                          │
                    Interview Engine
                          │
                  AI Evaluation Module
                          │
                    Reports & Analytics
```

---

# 🛠️ Tech Stack

### Frontend

* React 19
* Vite
* Tailwind CSS
* ShadCN UI
* React Router
* Axios
* React Hook Form
* Framer Motion
* Recharts

---

### Backend

* FastAPI
* SQLAlchemy
* Alembic
* PostgreSQL (Neon)
* Pydantic
* Uvicorn

---

### Authentication

* JWT
* Google OAuth
* Email OTP Verification
* Refresh Tokens

---

### Artificial Intelligence

* Google Gemini 2.5 Flash
* Gemini Embeddings
* Retrieval-Augmented Generation (RAG)

---

### Resume Processing

* PyMuPDF
* ATS Analysis Engine

---

### Vector Database

* ChromaDB

---

### Audio & Video

* Faster-Whisper
* FFmpeg
* OpenCV

---

### Deployment

* Vercel (Frontend)
* Render (Backend)
* Neon PostgreSQL
* ChromaDB

---

# Project Structure

```
VERVEO
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── ai/
│   │   ├── analytics/
│   │   ├── db/
│   │   ├── evaluation/
│   │   ├── interview/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── parsers/
│   │   ├── prompts/
│   │   ├── rag/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── uploads/
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
│
└── README.md
```

---

# How It Works

### Step 1

User registers using Email OTP Verification or Google OAuth.

↓

### Step 2

The user uploads a resume in PDF format.

↓

### Step 3

The resume is parsed using PyMuPDF.

↓

### Step 4

Semantic chunks are created and converted into embeddings using Gemini.

↓

### Step 5

Embeddings are stored in ChromaDB for semantic retrieval.

↓

### Step 6

The user selects:

* Interview Type
* Domain
* Difficulty
* Interview Mode (Text / Audio / Video)

↓

### Step 7

The RAG pipeline retrieves relevant resume context and Gemini generates personalized interview questions.

↓

### Step 8

The candidate answers through text, audio, or video.

↓

### Step 9

The AI evaluates each response, generates scores, identifies strengths and weaknesses, and stores the results.

↓

### Step 10

A comprehensive interview report and analytics dashboard are generated to help the user improve future interview performance.

---

# Troubleshooting

### Backend won't start

* Verify the virtual environment is activated.
* Install dependencies using `pip install -r requirements.txt`.
* Ensure all environment variables are configured correctly.

---

### Database Connection Issues

* Verify the Neon PostgreSQL connection string.
* Ensure `DATABASE_URL` includes `sslmode=require`.

---

### Google OAuth Errors

* Check `GOOGLE_CLIENT_ID`.
* Check `GOOGLE_CLIENT_SECRET`.
* Ensure the redirect URI matches the one configured in Google Cloud Console.

---

### Gemini API Errors

* Verify the Gemini API key is present in `.env`.
* Check API quota and network connectivity.

---

### File Upload Issues

* Ensure uploaded files are valid PDF documents.
* Verify the `uploads/` directory exists and has write permissions.

---

# Future Improvements

* Real-time AI interviewer with conversational voice interaction
* Facial expression and eye-contact analysis
* Emotion and confidence detection
* Multi-language interview support
* Company-specific interview preparation
* Coding interview environment with live code execution
* Personalized learning roadmap based on interview history
* AI-generated resume improvement suggestions
* Recruiter dashboard for candidate evaluation
* Team and campus placement management portal
* Cloud storage integration for resumes and reports
* Email interview summaries and progress reports
* Mobile application for Android and iOS
* Gamification with badges, streaks, and achievements
* AI-powered interview scheduling and calendar integration
* Support for multiple Large Language Models (LLMs)
* Containerized deployment with Docker and CI/CD pipelines
