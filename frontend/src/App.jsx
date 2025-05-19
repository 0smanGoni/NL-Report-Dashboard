import { useState, useEffect } from "react";
import DBProfiles from "./components/DBProfiles";
import QueryBox from "./components/QueryBox";
import ResultCard from "./components/ResultCard";
import SavedReports from "./components/SavedReports";
import {
  analyzePrompt,
  saveReport,
  getSavedReports,
  deleteReport,
} from "./api/reportApi";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import "./App.css";

function App() {
  const [result, setResult] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const fetchSaved = async () => {
    const data = await getSavedReports();
    setSavedReports(data);
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const detectChartType = (prompt, columns) => {
    const lower = prompt.toLowerCase();
    const mentionsPie = lower.includes("pie");
    const mentionsLine = lower.includes("line");
    const mentionsBar = lower.includes("bar");
    const mentionsChart = lower.includes("chart") || lower.includes("graph");
    const mentionsTable = lower.includes("table");

    if (mentionsTable) return "table";
    if (mentionsPie && columns.length === 2) return "pie";
    if (mentionsLine && columns.length === 2) return "line";
    if (mentionsBar && columns.length === 2) return "bar";
    if (mentionsChart && columns.length === 2) return "bar";
    if (columns.length === 2) return "bar";
    if (columns.length === 1) return "table";

    return "table";
  };

  const handleAnalyze = async (prompt) => {
    try {
      setLoading(true);
      setResult(null);
      NProgress.start();

      const res = await analyzePrompt(prompt);
      res.original_prompt = prompt;
      res.chart_type = detectChartType(prompt, res.columns);
      setResult(res);
    } catch (err) {
      console.error("Analysis failed:", err);
      setResult({
        sql: "",
        data: [],
        columns: [],
        summary: "Couldn't retrieve data. Please try again or rephrase your request.",
        chart_type: "table",
        original_prompt: prompt,
      });
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  const handleSave = async (res) => {
    const payload = {
      title: res.original_prompt,
      original_prompt: res.original_prompt,
      sql_query: res.sql,
      json_result: res.data,
      summary: res.summary,
      chart_type: res.chart_type,
    };
    await saveReport(payload);
    fetchSaved();
    setResult(null);
  };

  const handleDelete = async (id) => {
    await deleteReport(id);
    fetchSaved();
  };

  return (
    <div className="container">
      {/* 🌗 Theme Toggle */}
      <div style={{ textAlign: "right", marginBottom: "1rem" }}>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-color)",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          {theme === "dark" ? "🌙 Dark" : "☀️ Light"} Mode
        </button>
      </div>

      {/* 🔽 Expandable Profile Manager */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => setShowProfiles(!showProfiles)}
          style={{
            cursor: "pointer",
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            padding: "8px 12px",
            fontSize: "1rem",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--text-color)",
            transition: "all 0.2s ease",
          }}
        >
          <span>{showProfiles ? "▼" : "▶"}</span>
          <span><strong>DB Profile Manager</strong></span>
        </button>

        {showProfiles && (
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              color: "var(--text-color)",
              border: "1px solid var(--card-border)",
              borderRadius: "6px",
              padding: "16px",
              marginTop: "8px",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
              transition: "background-color 0.3s ease, color 0.3s ease",
            }}
          >
            <DBProfiles />
          </div>
        )}
      </div>

      {/* Title */}
      <h1>📊 Natural Language Report Dashboard</h1>

      {/* Query box */}
      <QueryBox onAnalyze={handleAnalyze} loading={loading} />


      {/* Analyze Result */}
      {loading && <div style={{ marginBottom: "1rem" }}>&nbsp;</div>}
      {result && <ResultCard result={result} onSave={handleSave} />}

      {/* Saved Reports */}
      <SavedReports reports={savedReports} onDelete={handleDelete} />
    </div>
  );
}

export default App;
