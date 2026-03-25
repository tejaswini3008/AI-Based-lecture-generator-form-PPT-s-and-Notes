import React, { useState } from "react";
import UploadForm from "./components/UploadForm";
import ResultViewer from "./components/ResultViewer";
import "./App.css";

function App() {
  const [result, setResult] = useState("");
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState("AIML");
  const [level, setLevel] = useState("UG");
  const [darkMode, setDarkMode] = useState(false);
  const [showResultPage, setShowResultPage] = useState(false);

  return (
    <div className={darkMode ? "app dark" : "app light"}>

      {/* NAVBAR */}
      <div className="navbar">
        <h2>🤖 AI Lecture Studio</h2>

        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "☀" : "🌙"}
        </button>
      </div>

      {/* HERO */}
      <div className="hero">
        <h1>Generate Smart Lectures Instantly</h1>
        <p>
          Upload PPT or Notes → AI creates lecture,
          summaries, quizzes & voice explanation.
        </p>
      </div>

      {!showResultPage ? (
        <div className="glass-card">
          <UploadForm
            setResult={setResult}
            setFile={setFile}
            setSubject={setSubject}
            setLevel={setLevel}
            setShowResultPage={setShowResultPage}
          />
        </div>
      ) : (
        <div className="glass-card">
          <button className="back-button" onClick={() => setShowResultPage(false)}>
            ← Back to Upload
          </button>
          <ResultViewer
            result={result}
            file={file}
            subject={subject}
            level={level}
          />
        </div>
      )}
    </div>
  );
}

export default App;
