# Legal Doc Analyzer

Legal Doc Analyzer is a full-stack web application that lets users upload PDF-based legal documents and receive an AI-generated risk review of potentially problematic clauses. The project combines a React frontend with a FastAPI backend, PDF text extraction using PyMuPDF, Gemini-powered clause analysis, and PostgreSQL storage for saved analysis results.

## Features

- Upload legal documents in PDF format through a simple web interface
- Extract text from uploaded PDFs using PyMuPDF
- Analyze clauses with Google Gemini and return structured risk insights
- Classify findings by `high`, `medium`, or `low` risk
- Store completed analyses in a PostgreSQL database using SQLAlchemy
- Handle invalid uploads and malformed AI responses with backend validation
- Display clear frontend error messages for unsupported files and API failures

## Tech Stack

- Frontend: React, Tailwind CSS, Create React App
- Backend: FastAPI, Python
- AI: Google Gemini via `google-genai`
- PDF Parsing: PyMuPDF (`fitz`)
- Database: PostgreSQL with SQLAlchemy
- Environment Management: `python-dotenv`

## Project Structure

```text
Legal DOC Analyzer/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── test_gemini.py
│   └── test_pdf.py
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── index.css
│       └── index.js
└── README.md
```

## How It Works

1. The user uploads a PDF from the React frontend.
2. The frontend sends the file to the FastAPI `/analyze` endpoint.
3. The backend extracts text from the PDF using PyMuPDF.
4. The extracted text is passed to Gemini with a prompt asking for structured JSON output.
5. The backend validates the AI response, stores the analysis in PostgreSQL, and returns the results.
6. The frontend renders each flagged clause with a color-coded risk level and explanation.

## Backend Setup

### 1. Create and activate a virtual environment

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Add environment variables

Create a `.env` file inside `backend/` with:

```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_postgresql_connection_string
```

Example `DATABASE_URL`:

```env
postgresql://username:password@localhost:5432/legal_doc_analyzer
```

### 4. Start the backend server

```powershell
uvicorn main:app --reload
```

The API will run at `http://127.0.0.1:8000`.

## Frontend Setup

### 1. Install dependencies

```powershell
cd frontend
npm install
```

### 2. Start the frontend

```powershell
npm start
```

The app will run at `http://localhost:3000`.

## API Endpoint

### `POST /analyze`

Uploads a PDF document and returns a JSON array of risky clauses.

Example response:

```json
[
  {
    "clause": "The landlord may terminate this agreement without notice.",
    "risk_level": "high",
    "explanation": "This clause gives one party broad termination power without protection for the other party."
  }
]
```

## Validation and Error Handling

- Rejects non-PDF uploads
- Returns an error when text cannot be extracted from scanned or image-only PDFs
- Handles invalid or non-array AI responses
- Prevents frontend rendering failures when the API returns an error response
- Rolls back database writes if persistence fails

## Deployment Notes

- Frontend is configured to call a deployed backend endpoint from `frontend/src/App.js`
- CORS currently allows `http://localhost:3000` and the deployed Vercel frontend
- Backend is suitable for deployment on platforms such as Render
- Frontend is suitable for deployment on platforms such as Vercel

## Future Improvements

- Add OCR support for scanned PDFs
- Move API base URL to environment variables in the frontend
- Add authentication and user history
- Add unit tests and integration tests
- Support DOCX and image uploads
- Add clause summaries and downloadable reports

## Resume-Friendly Project Summary

Built a full-stack AI legal document analysis platform that extracts text from PDFs, evaluates risky clauses with Gemini, and returns structured risk insights through a React and FastAPI application backed by PostgreSQL.
