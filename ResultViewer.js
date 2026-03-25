import React, { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";

function ResultViewer({ result, file, subject, level }) {

  const utteranceRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const resultRef = useRef(null);
  const [formattedResult, setFormattedResult] = useState("");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [qaLoading, setQaLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) {
      alert("Please type a question.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject", subject);
    formData.append("level", level);
    formData.append("question", question);

    setQaLoading(true);
    setMessages(prev => [...prev, { type: 'user', text: question }]);
    setQuestion("");

    try {
      const response = await fetch("http://localhost:8000/generate-qa/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("QA generation failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullText += data.response;
            }
          } catch (e) {
            // ignore invalid JSON
          }
        }
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1].type === 'ai') {
            newMessages[newMessages.length - 1].text = fullText;
          } else {
            newMessages.push({ type: 'ai', text: fullText });
          }
          return newMessages;
        });
      }
    } catch (error) {
      alert("Question answering failed. Please try again.");
      console.error(error);
      setMessages(prev => [...prev, { type: 'ai', text: "Sorry, I couldn't answer that question." }]);
    }

    setQaLoading(false);
  };

  /* =========================
     FORMAT TEXT INTO PARAGRAPHS
  ========================= */

  useEffect(() => {
    // Format the result to display as proper paragraphs
    if (result) {
      const formatted = formatText(result);
      setFormattedResult(formatted);
    }
  }, [result]);

  const formatText = (text) => {
    // Split by multiple line breaks to identify sections
    const sections = text.split(/\n{2,}/);
    
    return sections
      .map((section) => {
        // Clean up individual lines within sections
        const lines = section
          .split("\n")
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join(" ");
        
        return lines;
      })
      .filter(section => section.length > 0)
      .join("\n\n");
  };

  /* =========================
     AUTO-SCROLL TO BOTTOM
  ========================= */

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [formattedResult]);

  /* =========================
     RESET SPEECH WHEN RESULT CHANGES
  ========================= */

  useEffect(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [result]);

  /* =========================
     PLAY VOICE
  ========================= */

  const speakLecture = () => {

    if (!formattedResult) return;

    // stop any previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(formattedResult);

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // wait for voices to load properly
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();

      if (voices.length > 0) {
        utterance.voice =
          voices.find(v => v.lang.includes("en")) || voices[0];

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(loadVoices, 200);
      }
    };

    loadVoices();
  };

  const pauseLecture = () => {
    window.speechSynthesis.pause();
  };

  const resumeLecture = () => {
    window.speechSynthesis.resume();
  };

  const stopLecture = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  /* =========================
     DOWNLOAD PDF
  ========================= */

  const downloadPDF = () => {

    const doc = new jsPDF();

    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(16);
    doc.text("AI Generated Lecture", margin, 15);

    doc.setFontSize(12);

    const lines = doc.splitTextToSize(
      formattedResult,
      pageWidth - margin * 2
    );

    let y = 25;

    lines.forEach(line => {
      if (y > pageHeight - 10) {
        doc.addPage();
        y = 20;
      }

      doc.text(line, margin, y);
      y += 7;
    });

    doc.save("AI_Lecture.pdf");
  };

  return (
    <div>
      <h2>📘 Generated Lecture</h2>

      <div className="result-controls">
        {!speaking ? (
          <button onClick={speakLecture}>▶ Play Voice</button>
        ) : (
          <>
            <button onClick={pauseLecture}>⏸ Pause</button>
            <button onClick={resumeLecture}>⏯ Resume</button>
            <button onClick={stopLecture}>⏹ Stop</button>
          </>
        )}
        <button onClick={downloadPDF}>📄 Download PDF</button>
      </div>

      {speaking && <div style={{ marginBottom: "15px", fontSize: "14px" }}>
        <span className="speaking-indicator"></span>
        AI is speaking...
      </div>}

      <div className="result" ref={resultRef}>{formattedResult}</div>

      <h3>💬 Ask Questions</h3>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.type}`}>
              <strong>{msg.type === 'user' ? 'You:' : 'AI:'}</strong> {msg.text}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask me a question about the lecture..."
            disabled={qaLoading}
          />
          <button
            onClick={askQuestion}
            disabled={qaLoading || !question.trim()}
          >
            {qaLoading ? "🔎 Thinking..." : "🗨️ Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultViewer;
