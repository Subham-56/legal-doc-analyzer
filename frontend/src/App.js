import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

const API = "https://legal-doc-analyzer-backend-2wdq.onrender.com";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userName, setUserName] = useState(localStorage.getItem("name"));
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [page, setPage] = useState("home");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [warming, setWarming] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetch(API)
      .then(() => setWarming(false))
      .catch(() => setWarming(false));
  }, []);

  const handleAuth = async () => {
    setAuthLoading(true);
    setAuthError("");

    try {
      const body = authMode === "signup"
        ? { name: authName, email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword };

      const res = await fetch(`${API}/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.detail || "Something went wrong.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("name", data.name);
      setToken(data.token);
      setUserName(data.name);
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
    } catch (err) {
      setAuthError("Could not connect to server.");
    } finally {
      setAuthLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setToken(null);
    setUserName(null);
    setResults(null);
    setFile(null);
    setAuthEmail("");
    setAuthPassword("");
    setAuthName("");
    setPage("home");
  }

  const handleSwitchAuthMode = () => {
    setAuthMode(authMode === "login" ? "signup" : "login");
    setAuthError("");
    setAuthEmail("");
    setAuthPassword("");
    setAuthName("");
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResults(null);
    setError(null);
  }

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) { handleLogout(); return; }
        setError(data.detail || "Something went wrong.");
        return;
      }

      if (!Array.isArray(data)) {
        setError("Unexpected response from server.");
        return;
      }

      setResults(data);
    } catch (err) {
      setError("Something went wrong. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API}/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }

  const handleHistoryClick = () => {
    setPage("history");
    loadHistory();
  }

  const getRiskCounts = () => {
    if (!results) return { high: 0, medium: 0, low: 0 };
    return {
      high: results.filter(r => r.risk_level === 'high').length,
      medium: results.filter(r => r.risk_level === 'medium').length,
      low: results.filter(r => r.risk_level === 'low').length,
    };
  }

  const counts = getRiskCounts();

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("LegalScan AI — Risk Analysis Report", margin, 26);

    y = 55;

    // File info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Document: ${file ? file.name : "Unknown"}`, margin, y);
    y += 8;
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric"
    })}`, margin, y);
    y += 8;
    doc.text(`Analyzed by: ${userName}`, margin, y);
    y += 15;

    // Risk summary box
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, maxWidth, 28, 'F');
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.text(`High Risk: ${counts.high}`, margin + 8, y + 10);
    doc.setTextColor(161, 98, 7);
    doc.text(`Medium Risk: ${counts.medium}`, margin + 60, y + 10);
    doc.setTextColor(22, 101, 52);
    doc.text(`Low Risk: ${counts.low}`, margin + 130, y + 10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Clauses Flagged: ${results.length}`, margin + 8, y + 21);
    y += 40;

    // Clauses
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Detailed Clause Analysis", margin, y);
    y += 10;

    results.forEach((item, index) => {
      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Risk badge color
      if (item.risk_level === 'high') {
        doc.setFillColor(254, 226, 226);
        doc.setDrawColor(220, 38, 38);
      } else if (item.risk_level === 'medium') {
        doc.setFillColor(254, 249, 195);
        doc.setDrawColor(161, 98, 7);
      } else {
        doc.setFillColor(220, 252, 231);
        doc.setDrawColor(22, 101, 52);
      }

      // Clause number and risk level
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${index + 1}. ${item.risk_level.toUpperCase()} RISK`, margin, y);
      y += 6;

      // Clause text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const clauseLines = doc.splitTextToSize(item.clause, maxWidth);
      doc.text(clauseLines, margin, y);
      y += clauseLines.length * 5 + 3;

      // Explanation
      doc.setTextColor(80, 80, 80);
      const explanationLines = doc.splitTextToSize(`Explanation: ${item.explanation}`, maxWidth);
      doc.text(explanationLines, margin, y);
      y += explanationLines.length * 5 + 10;

      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y - 5, pageWidth - margin, y - 5);

      doc.setTextColor(0, 0, 0);
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by LegalScan AI — legal-doc-analyzer-dun.vercel.app", margin, 290);

    doc.save(`LegalScan-Report-${file ? file.name.replace('.pdf', '') : 'report'}.pdf`);
  }

  const handleDownloadFromHistory = (item) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const historyCounts = {
      high: item.result.filter(r => r.risk_level === 'high').length,
      medium: item.result.filter(r => r.risk_level === 'medium').length,
      low: item.result.filter(r => r.risk_level === 'low').length,
    };

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("LegalScan AI — Risk Analysis Report", margin, 26);

    y = 55;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Document: ${item.filename}`, margin, y);
    y += 8;
    doc.text(`Generated: ${new Date(item.created_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric"
    })}`, margin, y);
    y += 8;
    doc.text(`Analyzed by: ${userName}`, margin, y);
    y += 15;

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, maxWidth, 28, 'F');
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.text(`High Risk: ${historyCounts.high}`, margin + 8, y + 10);
    doc.setTextColor(161, 98, 7);
    doc.text(`Medium Risk: ${historyCounts.medium}`, margin + 60, y + 10);
    doc.setTextColor(22, 101, 52);
    doc.text(`Low Risk: ${historyCounts.low}`, margin + 130, y + 10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Clauses Flagged: ${item.result.length}`, margin + 8, y + 21);
    y += 40;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Detailed Clause Analysis", margin, y);
    y += 10;

    item.result.forEach((clause, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${index + 1}. ${clause.risk_level.toUpperCase()} RISK`, margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const clauseLines = doc.splitTextToSize(clause.clause, maxWidth);
      doc.text(clauseLines, margin, y);
      y += clauseLines.length * 5 + 3;

      doc.setTextColor(80, 80, 80);
      const explanationLines = doc.splitTextToSize(`Explanation: ${clause.explanation}`, maxWidth);
      doc.text(explanationLines, margin, y);
      y += explanationLines.length * 5 + 10;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y - 5, pageWidth - margin, y - 5);
      doc.setTextColor(0, 0, 0);
    });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by LegalScan AI — legal-doc-analyzer-dun.vercel.app", margin, 290);

    doc.save(`LegalScan-Report-${item.filename.replace('.pdf', '')}.pdf`);
  }

  // Auth Page
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-4xl">⚖️</span>
            <h1 className="text-2xl font-bold mt-2">LegalScan AI</h1>
            <p className="text-gray-400 text-sm mt-1">AI-powered legal document analysis</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-6">
              {authMode === "login" ? "Welcome back" : "Create account"}
            </h2>

            {authMode === "signup" && (
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder=""
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-1 block">Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder=""
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-1 block">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
              />
            </div>

            {authError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
                {authError}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all"
            >
              {authLoading ? "Please wait..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>

            <p className="text-center text-gray-400 text-sm mt-4">
              {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={handleSwitchAuthMode}
                className="text-blue-400 hover:text-blue-300"
              >
                {authMode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // History Page
  if (page === "history") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white">
        <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <span className="font-bold text-lg tracking-tight">LegalScan AI</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPage("home")}
              className="text-sm text-gray-400 hover:text-white transition-all"
            >
              Analyzer
            </button>
            <button
              onClick={handleHistoryClick}
              className="text-sm bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-lg"
            >
              History
            </button>
            <span className="text-sm text-gray-400">{userName}</span>
            <button
              onClick={handleLogout}
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 pt-12 pb-20">
          <h2 className="text-2xl font-bold mb-8">Analysis History</h2>

          {historyLoading && (
            <div className="text-gray-400 text-center py-12">Loading your history...</div>
          )}

          {!historyLoading && history.length === 0 && (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
              <div className="text-4xl mb-4">📂</div>
              <p className="text-gray-400">No analyses yet. Upload a document to get started.</p>
              <button
                onClick={() => setPage("home")}
                className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl text-sm"
              >
                Analyze a Document
              </button>
            </div>
          )}

          {history.map((item) => (
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-white">📄 {item.filename}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {new Date(item.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">
                      {item.risk_summary.high} High
                    </span>
                    <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
                      {item.risk_summary.medium} Medium
                    </span>
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                      {item.risk_summary.low} Low
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownloadFromHistory(item)}
                    className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
                  >
                    ⬇️ Download Report
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Home Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white">
      <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚖️</span>
          <span className="font-bold text-lg tracking-tight">LegalScan AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPage("home")}
            className="text-sm bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-lg"
          >
            Analyzer
          </button>
          <button
            onClick={handleHistoryClick}
            className="text-sm text-gray-400 hover:text-white transition-all"
          >
            History
          </button>
          <span className="text-sm text-gray-400">👤 {userName}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          AI-Powered Legal Analysis
        </div>
        <h1 className="text-5xl font-bold mb-4 leading-tight">
          Understand Your{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Legal Documents
          </span>{" "}
          Before You Sign
        </h1>
        <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
          Upload any legal PDF — contracts, NDAs, rent agreements — and our AI instantly identifies risky clauses with plain-English explanations.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-16">
          {[
            { icon: "📄", step: "1", title: "Upload PDF", desc: "Drop any legal document" },
            { icon: "🤖", step: "2", title: "AI Analyzes", desc: "Gemini reads every clause" },
            { icon: "⚠️", step: "3", title: "Review Risks", desc: "See what to watch out for" },
          ].map((item) => (
            <div key={item.step} className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="text-xs text-blue-400 font-semibold mb-1">STEP {item.step}</div>
              <div className="font-semibold mb-1">{item.title}</div>
              <div className="text-gray-400 text-sm">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-6">Analyze Your Document</h2>

          {warming && (
            <div className="mb-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm px-4 py-3 rounded-lg">
              ⏳ Warming up backend server, please wait a moment...
            </div>
          )}

          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-blue-400/50 hover:bg-white/5 transition-all">
            <span className="text-3xl mb-2">📁</span>
            <span className="text-gray-400 text-sm">
              {file ? file.name : "Click to upload PDF"}
            </span>
            <span className="text-gray-600 text-xs mt-1">PDF files only</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={handleAnalyze}
            disabled={!file || loading || warming}
            className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
          >
            {loading ? "Analyzing your document..." : "Analyze Document →"}
          </button>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>

      {results && (
        <div className="max-w-4xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{counts.high}</div>
              <div className="text-red-400 text-sm font-medium mt-1">High Risk</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">{counts.medium}</div>
              <div className="text-yellow-400 text-sm font-medium mt-1">Medium Risk</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{counts.low}</div>
              <div className="text-green-400 text-sm font-medium mt-1">Low Risk</div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Detailed Analysis</h3>
            <button
              onClick={handleDownloadReport}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              ⬇️ Download Report
            </button>
          </div>
          {results.map((item, index) => (
            <div
              key={index}
              className={`bg-white/5 border rounded-xl p-6 mb-4 backdrop-blur-sm ${item.risk_level === 'high' ? 'border-red-500/30' :
                item.risk_level === 'medium' ? 'border-yellow-500/30' :
                  'border-green-500/30'
                }`}
            >
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${item.risk_level === 'high' ? 'bg-red-500/20 text-red-400' :
                item.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                {item.risk_level} risk
              </span>
              <p className="text-white font-medium mt-3 leading-relaxed">{item.clause}</p>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{item.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;