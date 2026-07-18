# AI Legal Document Analyzer

🔗 **Live Demo:** https://legal-doc-analyzer-dun.vercel.app  
📁 **GitHub:** https://github.com/Subham-56/legal-doc-analyzer

An AI-powered full-stack web application that analyzes legal PDF documents and identifies risky clauses with plain-English explanations and color-coded risk levels.

---

## Features

- Upload any legal PDF — contracts, NDAs, rent agreements, employment offers
- Extract and analyze text using Google Gemini AI
- Classify each clause as high, medium, or low risk
- Display color-coded results with plain-English explanations
- Validate uploads and handle API failures gracefully
- Store all analyses in PostgreSQL via SQLAlchemy

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS |
| Backend | FastAPI, Python |
| AI | Google Gemini API |
| PDF Parsing | PyMuPDF |
| Database | PostgreSQL, SQLAlchemy |
| Deployment | Vercel (frontend), Render (backend) |

---

## How It Works

1. User uploads a PDF from the React frontend
2. Frontend sends the file to `POST /analyze` on the FastAPI backend
3. Backend extracts text using PyMuPDF
4. Extracted text is sent to Gemini with a structured prompt
5. Gemini returns a JSON array of risky clauses with risk levels and explanations
6. Backend validates the response and saves it to PostgreSQL
7. Frontend renders each clause as a color-coded risk card

---

## Project Structure

```text
legal-doc-analyzer/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── test_gemini.py
│   └── test_pdf.py
├── frontend/
│   ├── public/
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

Update the API URL in `frontend/src/App.js` to point to `http://localhost:8000` for local development.

---

## API Reference

### `POST /analyze`

Accepts a PDF file upload and returns a JSON array of risky clauses.

**Request:** `multipart/form-data` with a `file` field containing a PDF

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

**Error responses:**
- `400` — Non-PDF file or unreadable document
- `500` — AI response failure or server error

---

## Error Handling

- Rejects non-PDF uploads with a clear error message
- Returns 400 if text cannot be extracted from scanned PDFs
- Validates that AI response is a proper JSON array before rendering
- Rolls back database session if persistence fails
- Frontend displays error messages for all failure cases

---

## Deployment

- Frontend deployed on **Vercel** — auto-deploys on every GitHub push
- Backend deployed on **Render** — free tier, spins down after inactivity
- PostgreSQL hosted on **Render** free tier

---

## Future Improvements

- OCR support for scanned PDFs
- User authentication and analysis history
- Downloadable PDF reports
- DOCX and image upload support
- Move API URL to environment variables in frontend
- Unit and integration tests

---

## Resume Summary

Built and deployed a full-stack AI legal document analysis platform using React, FastAPI, PostgreSQL, and Google Gemini API. The app extracts text from uploaded PDFs, evaluates clauses for legal risk, and returns structured plain-English explanations through a responsive web interface.