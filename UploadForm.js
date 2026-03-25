import React, { useState, useRef } from "react";

function UploadForm({ setResult, setFile, setSubject, setLevel, setShowResultPage }) {
  const [localFile, setLocalFile] = useState(null);
  const [localSubject, setLocalSubject] = useState("AIML");
  const [localLevel, setLocalLevel] = useState("UG");
  const [type, setType] = useState("lecture");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && (selectedFile.name.endsWith(".pdf") || selectedFile.name.endsWith(".pptx"))) {
      setLocalFile(selectedFile);
      setFile(selectedFile);
    } else {
      alert("Please select a PDF or PPTX file");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const uploadFile = async () => {
    if (!localFile) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", localFile);
    formData.append("subject", localSubject);
    formData.append("level", localLevel);
    formData.append("type", type);

    setLoading(true);
    setResult("Loading lecture... Please wait..."); // show immediate state
    setShowResultPage(true); // switch to result page immediately

    try {
      const response = await fetch(
        "http://localhost:8000/generate-lecture/",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        // Update result in real-time
        setResult(fullText);
      }
      // After full lecture text is generated, open the result page
      setShowResultPage(true);
    } catch (error) {
      alert("Generation failed. Please try again.");
      console.error(error);
      setResult("");
    }

    setLoading(false);
  };

  return (
    <div className="upload-container">
      <h2>📂 Upload Study Material</h2>

      <div className="form-center">
        <div className="file-input-wrapper">
          <label
            className={`file-input-label ${dragOver ? "drag-over" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            📄 Drag & drop your PDF or PPTX here
            <br />
            or click to browse
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx"
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
          {localFile && <div className="file-name">✓ {localFile.name}</div>}
        </div>

        <div className="form-group">
          <label>Content Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={loading}
          >
            <option value="lecture">📚 Generate Lecture</option>
            <option value="summary">📝 Generate Summary</option>
            <option value="quiz">❓ Generate Quiz Questions</option>
          </select>
        </div>

        <div className="form-group">
          <label>Subject</label>
          <select
            value={localSubject}
            onChange={(e) => { setLocalSubject(e.target.value); setSubject(e.target.value); }}
            disabled={loading}
          >
            <option value="AIML">AIML</option>
            <option value="NLP">NLP</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
            <option value="Database Systems">Database Systems</option>
          </select>
        </div>

        <div className="form-group">
          <label>Level</label>
          <select
            value={localLevel}
            onChange={(e) => { setLocalLevel(e.target.value); setLevel(e.target.value); }}
            disabled={loading}
          >
            <option value="UG">Undergraduate (UG)</option>
            <option value="PG">Postgraduate (PG)</option>
          </select>
        </div>

        <button onClick={uploadFile} disabled={loading || !localFile}>
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              🧠 Generating...
            </>
          ) : (
            `✨ Generate ${type.charAt(0).toUpperCase() + type.slice(1)}`
          )}
        </button>
      </div>
    </div>
  );
}

export default UploadForm;
