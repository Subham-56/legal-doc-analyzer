import { useState, useEffect } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [warming, setWarming] = useState(true);

  useEffect(() => {
      fetch("https://legal-doc-analyzer-backend-2wdq.onrender.com")
        .then(() => setWarming(false))
        .catch(() => setWarming(false));
  }, []);

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
      const res = await fetch("https://legal-doc-analyzer-backend-2wdq.onrender.com/analyze", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
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

  const getRiskCounts = () => {
    if (!results) return { high: 0, medium: 0, low: 0 };
    return {
      high: results.filter(r => r.risk_level === 'high').length,
      medium: results.filter(r => r.risk_level === 'medium').length,
      low: results.filter(r => r.risk_level === 'low').length,
    };
  }

  const counts = getRiskCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white">

      {/* Navbar */}
      <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚖️</span>
          <span className="font-bold text-lg tracking-tight">LegalScan AI</span>
        </div>
        <span className="text-sm text-gray-400">Powered by Gemini AI</span>
      </nav>

      {/* Hero Section */}
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

        {/* How it works */}
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

        {warming && (
          <div className="mb-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm px-4 py-3 rounded-lg">
            ⏳ Warming up backend server, please wait a moment...
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-6">Analyze Your Document</h2>

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

      {/* Results Section */}
      {results && (
        <div className="max-w-4xl mx-auto px-4 pb-20">

          {/* Risk Summary */}
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

          {/* Clause Cards */}
          <h3 className="text-xl font-semibold mb-4">Detailed Analysis</h3>
          {results.map((item, index) => (
            <div
              key={index}
              className={`bg-white/5 border rounded-xl p-6 mb-4 backdrop-blur-sm ${
                item.risk_level === 'high' ? 'border-red-500/30' :
                item.risk_level === 'medium' ? 'border-yellow-500/30' :
                'border-green-500/30'
              }`}
            >
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                item.risk_level === 'high' ? 'bg-red-500/20 text-red-400' :
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