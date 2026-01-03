import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FillIcon from "../assets/streamline-ultimate_paper-write-bold.svg";
import Button from "../components/Button";
import CustomSelect from "../components/CustomDropDown";
import { questionApi } from "../api";
import type { Subject } from "../types";

type SubjectInfo = { id: string; name: string; code: string };

type GeneratedPaper = {
  title: string;
  meta: { topic: string; difficulty: string; type: string; count: number };
  questions: { 
    q: string; 
    parts?: string[]; 
    options?: string[];
    correct_answer?: string;
    explanation?: string;
  }[];
};

const subjects: SubjectInfo[] = [
  { id: "dl", name: "Deep Learning", code: "SE4050" },
  { id: "da", name: "Data Analytics", code: "SE4040" },
  { id: "ime", name: "Innovation & Entrepreneurship", code: "SE4030" },
];

const topicsBySubject: Record<string, string[]> = {
  dl: ["Neural Networks", "CNN", "RNN/LSTM", "Transformers", "Regularization"],
  da: ["Data Cleaning", "EDA", "Regression", "Classification", "Visualization"],
  ime: ["Ideation", "Business Models", "Market Research", "MVP", "Pitching"],
};

export default function ModelPaperSetupPage() {
  const { slug } = useParams(); // dl/da/ime
  const navigate = useNavigate();

  const subject = useMemo(
    () => subjects.find((s) => s.id === slug) || subjects[0],
    [slug]
  );

  const topicOptions = topicsBySubject[subject.id] || ["General"];
  const [topic, setTopic] = useState(topicOptions[0]);
  const [difficulty, setDifficulty] = useState("Easy");
  const [type, setType] = useState("Short Answers");
  const [count, setCount] = useState(10);

  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const options = topicsBySubject[subject.id] || ["General"];
    setTopic(options[0]);
    setPaper(null);
    setError(null);
  }, [subject.id]);

  const onGenerate = async () => {
    setLoading(true);
    setError(null);
    setPaper(null);

    try {
      const generated = await questionApi.generateCustomPaper(
        subject.id as Subject,
        {
          topic,
          difficulty,
          questionType: type,
          count,
        }
      );

      setPaper(generated);

      localStorage.setItem(
        "MODEL_PAPER_ACTIVE",
        JSON.stringify({
          paper: generated,
          subject,
          startDateTime: new Date().toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          durationMinutes: 120,
          progress: 0,
        })
      );
    } catch (err: any) {
      setError(
        err.response?.data?.detail || err.message || "Failed to generate paper"
      );
    } finally {
      setLoading(false);
    }
  };

  const openPaper = () => {
    if (!paper) return;

    navigate(`/model-paper/${subject.id}/paper`, {
      state: {
        paper,
        subject,
        startDateTime: "Jan 2, 2026 - 10:30AM",
        durationMinutes: 120,
        progress: 50,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="mb-6 mt-6 pt-6 ml-4.5">
        <h1 className="text-[32px] font-semibold text-[#055160]">
          Model Paper Generator
        </h1>
        <p className="text-[#000000] text-[16px] font-normal">
          Customize your model paper by selecting topics, difficulty levels and
          question types.
        </p>
      </div>

      <div className="mx-18">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm pl-8.5 pr-14 pb-11 pt-8.5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left: Controls */}
            <div>
              <h2 className="text-[18px] font-medium text-[#055160] mb-4">
                Select Topics for{" "}
                <span className="text-gray-900">{subject.name}</span>
              </h2>

              <CustomSelect
                label="Topic"
                value={topic}
                onChange={setTopic}
                options={topicOptions.map((t) => ({ label: t, value: t }))}
                className="mb-4"
              />

              <CustomSelect
                label="Difficulty Level"
                value={difficulty}
                onChange={setDifficulty}
                options={[
                  { label: "Easy", value: "Easy" },
                  { label: "Medium", value: "Medium" },
                  { label: "Hard", value: "Hard" },
                ]}
                className="mb-4"
              />

              <CustomSelect
                label="Question Types"
                value={type}
                onChange={setType}
                options={[
                  { label: "Short Answers", value: "Short Answers" },
                  { label: "MCQ", value: "MCQ" },
                  { label: "Structured", value: "Structured" },
                  { label: "Essay", value: "Essay" },
                ]}
                className="mb-4"
              />

              <label className="block text-xs text-gray-500 mb-1">
                Number of Questions
              </label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-6 bg-white
                  focus:outline-none focus:ring-0 focus:border-[#055160]"
                value={count}
                min={1}
                max={50}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </div>

            {/* Right: Preview (CLICKABLE) */}
            <div
              onClick={openPaper}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openPaper()}
              title={paper ? "Open Paper" : "Generate a paper first"}
              className={`bg-[#D1E7DDF2] rounded-2xl px-11 pt-9 pb-11.5 flex flex-col w-full
                ${paper ? "cursor-pointer hover:opacity-95" : "cursor-not-allowed"}`}
            >
              <h3 className="font-medium text-[#055160] mb-9.5">
                Paper Preview
              </h3>

              {!paper ? (
                <div className="flex-1 min-h-72 border-2 border-dashed border-[#4B5563] bg-[#F2F8F5BF] rounded-xl flex flex-col items-center justify-center text-center p-3">
                  <img
                    src={FillIcon}
                    alt="Document icon"
                    className="w-6 h-6 mb-3"
                  />
                  <p className="font-bold text-[16px] text-[#525252]">
                    Your generated paper will appear here.
                  </p>
                  <p className="text-sm font-normal text-[#404040] mt-1">
                    Click ‘Generate Paper’ to
                  </p>
                  <p className="text-sm font-normal text-[#404040]">
                    create your customized model paper.
                  </p>
                </div>
              ) : (
                <div className="flex-1 bg-white rounded-xl p-4 overflow-auto">
                  <p className="font-bold text-gray-900">{paper.title}</p>

                  <p className="text-xs text-gray-500 mt-1">
                    Topic: {paper.meta.topic} • Difficulty: {paper.meta.difficulty}
                    • Type: {paper.meta.type} • Qs: {paper.meta.count}
                  </p>

                  <div className="mt-4 space-y-2">
                    {paper.questions.slice(0, 8).map((q, idx) => (
                      <p key={idx} className="text-sm text-gray-800">
                        {idx + 1}. {q.q}
                      </p>
                    ))}

                    {paper.questions.length > 8 && (
                      <p className="text-xs text-gray-500 mt-2">
                        + {paper.questions.length - 8} more...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mt-4">
              <span className="text-red-600">⚠</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end mt-6">
            <Button
              onClick={onGenerate}
              loading={loading}
              disabled={loading}
              style={{ background: "linear-gradient(90deg, #055160 100%)" }}
            >
              {loading ? "Generating..." : "Generate Paper"}
            </Button>

            <Button variant="outline" onClick={() => navigate("/model-paper")}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
