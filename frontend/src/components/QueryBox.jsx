import { useState } from "react";

export default function QueryBox({ onAnalyze }) {
  const [prompt, setPrompt] = useState("");

  const handleAnalyze = () => {
    if (prompt.trim()) {
      onAnalyze(prompt.trim());
    }
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <textarea
        placeholder="Type your question (e.g., How many users joined last month?)"
        rows={3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button className="btn-analyze" onClick={handleAnalyze}>Analyze</button>
    </div>
  );
}
