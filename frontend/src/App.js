import { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

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

  return (
    <div className="min-h-screen bg-gray-100">

      <nav className="bg-white shadow-sm px-8 py-4">
        <h1 className="text-xl font-bold text-gray-800">AI Legal Document Analyzer</h1>
      </nav>

      <div className="max-w-3xl mx-auto mt-12 px-4">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Analyze Your Legal Document</h2>
          <p className="text-gray-400 mb-6">Upload a PDF and AI will identify risky clauses</p>

          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="mb-4"
          />

          {file && (
            <p className="text-sm text-gray-500 mb-4">Selected: {file.name}</p>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze Document"}
          </button>

          {error && (
            <p className="text-red-500 mt-4">{error}</p>
          )}
        </div>

        {results && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Analysis Results</h3>
            {results.map((item, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow p-6 mb-4 border-l-4 ${
                  item.risk_level === 'high' ? 'border-red-500' :
                  item.risk_level === 'medium' ? 'border-yellow-500' :
                  'border-green-500'
                }`}
              >
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                  item.risk_level === 'high' ? 'bg-red-100 text-red-600' :
                  item.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-600' : 
                  'bg-green-100 text-green-600'
                }`}>
                  {item.risk_level} risk
                </span>
                <p className="text-gray-800 font-medium mt-3">{item.clause}</p>
                <p className="text-gray-500 text-sm mt-2">{item.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;