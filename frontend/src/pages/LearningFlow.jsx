import { useEffect, useState } from "react";
import API from "../api/api";

export default function LearningFlow() {
  const [modules, setModules] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [topics, setTopics] = useState([]);

  const [module, setModule] = useState("");
  const [lecture, setLecture] = useState("");
  const [topic, setTopic] = useState("");

  const [correct, setCorrect] = useState(null);
  const [level, setLevel] = useState("");

  const [summary, setSummary] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [mindmap, setMindmap] = useState(null);

  /* ---------- LOAD MODULES ---------- */
  useEffect(() => {
    API.get("/modules").then(res => setModules(res.data));
  }, []);

  /* ---------- LOAD LECTURES ---------- */
  useEffect(() => {
    if (module) {
      API.get(`/lectures/${module}`).then(res => setLectures(res.data));
    }
  }, [module]);

  /* ---------- LOAD TOPICS ---------- */
  useEffect(() => {
    if (module && lecture) {
      API.get(`/topics/${module}/${lecture}`).then(res => setTopics(res.data));
    }
  }, [lecture]);

  /* ---------- LEVEL + GENERATION ---------- */
  const generateContent = async () => {
    const levelRes = await API.post("/check-level", {
      correct_answers: correct
    });

    const predictedLevel = levelRes.data.level;
    setLevel(predictedLevel);

    const payload = { topic, level: predictedLevel };

    const s = await API.post("/generate-summary", payload);
    const f = await API.post("/generate-flashcards", payload);
    const m = await API.post("/generate-mindmap", payload);

    setSummary(s.data.summary);
    setFlashcards(JSON.parse(f.data.flashcards));
    setMindmap(JSON.parse(m.data.mindmap));
  };

  return (
    <div>
      <h2>Personalized Learning</h2>

      {/* MODULE */}
      <select onChange={e => setModule(e.target.value)}>
        <option>Select Module</option>
        {modules.map(m => <option key={m}>{m}</option>)}
      </select>

      {/* LECTURE */}
      {module && (
        <select onChange={e => setLecture(e.target.value)}>
          <option>Select Lecture</option>
          {lectures.map(l => <option key={l}>{l}</option>)}
        </select>
      )}

      {/* TOPIC */}
      {lecture && (
        <select onChange={e => setTopic(e.target.value)}>
          <option>Select Topic</option>
          {topics.map(t => <option key={t}>{t}</option>)}
        </select>
      )}

      {/* CONFIDENCE */}
      {topic && (
        <>
          <p>How many questions did you answer correctly?</p>
          {[2, 4, 5].map(n => (
            <button key={n} onClick={() => setCorrect(n)}>
              {n}
            </button>
          ))}
        </>
      )}

      {/* GENERATE */}
      {correct !== null && (
        <button onClick={generateContent}>Generate Learning Content</button>
      )}

      {/* OUTPUT */}
      {summary && (
        <>
          <h3>Level: {level}</h3>
          <h3>Summary</h3>
          <p>{summary}</p>

          <h3>Flashcards</h3>
          {flashcards.map((f, i) => (
            <div key={i}>
              <b>{f.question}</b>
              <p>{f.answer}</p>
            </div>
          ))}

          <h3>Mind Map</h3>
          <pre>{JSON.stringify(mindmap, null, 2)}</pre>
        </>
      )}
    </div>
  );
}
