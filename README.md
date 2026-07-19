# LegalScan AI — Legal Document Analyzer

🔗 **Live Demo:** https://legal-doc-analyzer-dun.vercel.app
📁 **GitHub:** https://github.com/Subham-56/legal-doc-analyzer

An AI-powered full-stack web application that analyzes legal PDF documents, identifies risky clauses, and generates downloadable risk reports — with user authentication and analysis history.

---

## Features

- **User Authentication** — Secure signup and login with bcrypt password hashing and JWT tokens
- **AI-Powered Analysis** — Upload any legal PDF and Google Gemini identifies risky clauses instantly
- **Risk Classification** — Every clause classified as High, Medium, or Low risk with plain-English explanations
- **Analysis History** — All analyses saved per user, accessible anytime from the History dashboard
- **PDF Report Export** — Download a professional risk report for any analysis
- **Input Validation** — Rejects non-PDFs, scanned documents, and handles API failures gracefully
- **Persistent Sessions** — Stay logged in across browser sessions via localStorage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, jsPDF |
| Backend | FastAPI, Python |
| Authentication | JWT (python-jose), bcrypt |
| AI | Google Gemini API |
| PDF Parsing | PyMuPDF |
| Database | PostgreSQL, SQLAlchemy |
| Deployment | Vercel (frontend), Render (backend + database) |

---

## How It Works

1. User signs up or logs in — JWT token issued and stored in localStorage
2. User uploads a legal PDF from the React frontend
3. Frontend sends the file to `POST /analyze` with JWT in the Authorization header
4. Backend validates the token, extracts text using PyMuPDF
5. Extracted text is sent to Gemini with a structured prompt
6. Gemini returns a JSON array of risky clauses with risk levels and explanations
7. Backend saves the analysis to PostgreSQL linked to the user
8. Frontend renders color-coded risk cards and risk summary
9. User can download a professional PDF report or view history of past analyses

---

## Project Structure

```text
legal-doc-analyzer/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       ├── index.css
│       └── index.js
└── README.md
```

---

## Local Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql://username:password@localhost:5432/legaldoc
SECRET_KEY=your_secret_key
```

Generate a secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Start the server:
```bash
uvicorn main:app --reload
```

API runs at `http://127.0.0.1:8000`
Interactive docs at `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`

Update the `API` constant in `frontend/src/App.js` to `http://localhost:8000` for local development.

---

## API Reference

### `POST /signup`
Creates a new user account.
```json
{ "name": "Subham", "email": "you@example.com", "password": "yourpassword" }
```

### `POST /login`
Authenticates a user and returns a JWT token.
```json
{ "email": "you@example.com", "password": "yourpassword" }
```

### `POST /analyze`
Requires Bearer token. Accepts a PDF file upload and returns a JSON array of risky clauses.

**Response:**
```json
[
  {
    "clause": "The landlord may terminate this agreement without notice.",
    "risk_level": "high",
    "explanation": "This gives one party broad termination power with no protection for the other."
  }
]
```

### `GET /history`
Requires Bearer token. Returns all analyses for the authenticated user with risk summaries and full results.

---

## Error Handling

- Rejects non-PDF uploads with a clear error message
- Returns 400 if text cannot be extracted from scanned PDFs
- Validates AI response is a proper JSON array before rendering
- Rolls back database session if persistence fails
- Frontend displays error messages for all failure cases
- Auto-logout on expired or invalid JWT token

---

## Deployment

- Frontend deployed on **Vercel** — auto-deploys on every GitHub push
- Backend deployed on **Render** — Python web service
- PostgreSQL hosted on **Render** free tier

---

## Future Improvements

- OCR support for scanned PDFs
- DOCX and image upload support
- Clause comparison between two documents
- Email notifications for high-risk documents
- Move API URL to environment variables in frontend

---

## Resume Summary

Built and deployed LegalScan AI — a full-stack AI legal document analysis platform with user authentication, per-user analysis history, and PDF report generation. Uses React, FastAPI, PostgreSQL, and Google Gemini API to extract and risk-rate clauses from legal PDFs with plain-English explanations.
