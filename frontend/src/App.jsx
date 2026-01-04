import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

function App() {
  // ---------------- BASIC STATE ----------------
  const [modules, setModules] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [topics, setTopics] = useState([]);

  const [module, setModule] = useState("");
  const [lecture, setLecture] = useState("");
  const [topic, setTopic] = useState("");

  // ---------------- ASSESSMENT STATE ----------------
  const [confidence, setConfidence] = useState(1);
  const [level, setLevel] = useState(null);

  const [mcqs, setMcqs] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // ---------------- GENERATED CONTENT ----------------
  const [summary, setSummary] = useState("");
  const [flashcards, setFlashcards] = useState("");
  const [mindmap, setMindmap] = useState("");

  // ---------------- LOAD MODULES ----------------
  useEffect(() => {
    axios.get(`${API}/catalog/modules`).then(res => setModules(res.data));
  }, []);

  // ---------------- LOAD LECTURES ----------------
  useEffect(() => {
    if (!module) return;
    axios.get(`${API}/catalog/lectures/${module}`).then(res => {
      setLectures(res.data);
      setLecture("");
      setTopics([]);
    });
  }, [module]);

  // ---------------- LOAD TOPICS ----------------
  useEffect(() => {
    if (!module || !lecture) return;
    axios.get(`${API}/catalog/topics/${module}/${lecture}`).then(res => {
      setTopics(res.data);
      setTopic("");
    });
  }, [lecture]);

  // ---------------- LOAD MCQs ----------------
  const loadMcqs = async () => {
    const res = await axios.post(`${API}/generate/mcqs`, { topic });
    setMcqs(res.data.questions);
    setAnswers({});
    setSubmitted(false);
    setLevel(null);
    setSummary("");
    setFlashcards("");
    setMindmap("");
  };

  // ---------------- SUBMIT MCQs & DETECT LEVEL ----------------
  const submitAndCheckLevel = async () => {
  try {
    // 🚫 Prevent empty submission
    if (Object.keys(answers).length !== mcqs.length) {
      alert("Please answer all questions");
      return;
    }

    // 1️⃣ Submit MCQs
    const submitRes = await axios.post(
      `${API}/generate/submit-mcqs`,
      {
        topic,
        answers: Object.values(answers)
      }
    );

    // ✅ FORCE number conversion
    const mcqScore = Number(submitRes.data.mcq_score);

    if (isNaN(mcqScore)) {
      throw new Error("Invalid MCQ score");
    }

    // 2️⃣ Check level
    const levelRes = await axios.post(
      `${API}/generate/check-level`,
      {
        confidence: Number(confidence),
        mcq_score: mcqScore
      }
    );

    setLevel(levelRes.data.level);
    setSubmitted(true);

  } catch (err) {
    console.error(err);
    alert("Submission failed");
  }
};


  // ---------------- GENERATE SUMMARY + FLASHCARDS ----------------
  const generateCoreContent = async () => {
    const payload = { module, lecture, topic, level };

    const s = await axios.post(`${API}/generate/summary`, payload);
    const f = await axios.post(`${API}/generate/flashcards`, payload);

    setSummary(s.data.summary);
    setFlashcards(f.data.flashcards);
  };

  // ---------------- GENERATE MIND MAP ----------------
  const generateMindMap = async () => {
    const payload = { module, lecture, topic, level };
    const m = await axios.post(`${API}/generate/mindmap`, payload);
    setMindmap(m.data.mindmap);
  };

  // ---------------- UI ----------------
  return (
    <div style={{ padding: 40, background: "#111", color: "white", minHeight: "100vh" }}>
      <h1>Personalized Learning System</h1>

      <select value={module} onChange={e => setModule(e.target.value)}>
        <option value="">Select Module</option>
        {modules.map(m => <option key={m}>{m}</option>)}
      </select>

      <br /><br />

      <select value={lecture} onChange={e => setLecture(e.target.value)}>
        <option value="">Select Lecture</option>
        {lectures.map(l => <option key={l}>{l}</option>)}
      </select>

      <br /><br />

      <select value={topic} onChange={e => setTopic(e.target.value)}>
        <option value="">Select Topic</option>
        {topics.map(t => <option key={t}>{t}</option>)}
      </select>

      <br /><br />

      <label>Confidence (1–5): </label>
      <input
        type="number"
        min="1"
        max="5"
        value={confidence}
        onChange={e => setConfidence(e.target.value)}
      />

      <br /><br />

      <button onClick={loadMcqs} disabled={!topic}>
        Start Assessment
      </button>

      <hr />

      {mcqs.length > 0 && (
        <>
          <h2>MCQs</h2>

          {mcqs.map((q, i) => (
            <div key={i}>
              <p><b>{i + 1}. {q.question}</b></p>
              {q.options.map((opt, idx) => (
                <label key={idx} style={{ display: "block" }}>
                  <input
                    type="radio"
                    name={`q${i}`}
                    disabled={submitted}
                    checked={answers[i] === idx}
                    onChange={() => setAnswers(prev => ({ ...prev, [i]: idx }))}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ))}

          {!submitted && (
        <button
  onClick={submitAndCheckLevel}
  disabled={Object.keys(answers).length !== mcqs.length}
>
  Submit & Detect Level
</button>


          )}
        </>
      )}

      {level && (
        <>
          <h3>Detected Level: {level}</h3>
          <button onClick={generateCoreContent}>
            Generate Summary & Flashcards
          </button>
        </>
      )}

      {summary && (
        <>
          <h2>Summary</h2>
          <pre>{summary}</pre>
        </>
      )}

      {flashcards && (
        <>
          <h2>Flashcards</h2>
          <pre>{JSON.stringify(flashcards, null, 2)}</pre>
          <button onClick={generateMindMap}>
            Generate Mind Map
          </button>
        </>
      )}

      {mindmap && (
        <>
          <h2>Mind Map</h2>
          <pre>{JSON.stringify(mindmap, null, 2)}</pre>
        </>
      )}
    </div>
  );
}

export default App;
