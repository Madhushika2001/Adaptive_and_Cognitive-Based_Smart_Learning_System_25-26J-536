import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import InfoPill from "../components/InfoPill";
import { questionApi } from "../api";

type Subject = { id: string; name: string; code: string };

type PaperQuestion = {
  q: string;
  parts?: string[]; // only for Structured
  options?: string[]; // for MCQ
  correct_answer?: string;
  explanation?: string;
};

type Paper = {
  title: string;
  meta: { topic: string; difficulty: string; type: string; count: number };
  questions: PaperQuestion[];
};

type ExamState = {
  paper: Paper;
  subject?: Subject;
  startDateTime?: string;
  durationMinutes?: number;
};

function formatHHMMSS(totalSeconds: number) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function ModelPaperExamPage() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const { state } = useLocation() as { state?: ExamState };

  // -------------------------------------------------------
  // Load data from router state OR fallback to localStorage
  // -------------------------------------------------------
  const data: ExamState | null = useMemo(() => {
    if (state?.paper) {
      localStorage.setItem("MODEL_PAPER_ACTIVE", JSON.stringify(state));
      return state;
    }

    const raw = localStorage.getItem("MODEL_PAPER_ACTIVE");
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as ExamState;
      return parsed?.paper ? parsed : null;
    } catch {
      return null;
    }
  }, [state]);

  if (!data?.paper) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-6">
        <p className="text-gray-700">No paper data found.</p>
        <button
          className="mt-4 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  const { paper, subject, startDateTime, durationMinutes = 120 } = data;

  // ---------------------------
  // Pagination (5 per page)
  // ---------------------------
  const QUESTIONS_PER_PAGE = 5;
  const totalQuestions = paper.questions.length;
  const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);

  const [page, setPage] = useState(1); // 1-based
  const startIdx = (page - 1) * QUESTIONS_PER_PAGE;
  const endIdx = Math.min(startIdx + QUESTIONS_PER_PAGE, totalQuestions);
  const pageQuestions = paper.questions.slice(startIdx, endIdx);

  // ---------------------------
  // Answer State (per type)
  // ---------------------------
  // MCQ: selected option index per question index
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});

  // Short / Essay: text per question index
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});

  // Structured: {questionIndex: {partIndex: text}}
  const [structuredAnswers, setStructuredAnswers] = useState<
    Record<number, Record<number, string>>
  >({});

  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);

  // ---------------------------
  // Timer
  // ---------------------------
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ---------------------------
  // Answered count for progress
  // ---------------------------
  const answeredCount = useMemo(() => {
    const type = paper.meta.type.toLowerCase();

    if (type === "mcq") return Object.keys(mcqAnswers).length;

    if (type === "short answers" || type === "short_answers" || type === "essay") {
      return Object.values(textAnswers).filter((v) => v.trim().length > 0).length;
    }

    if (type === "structured") {
      return Object.values(structuredAnswers).filter((partsObj) => {
        const vals = Object.values(partsObj || {});
        // count answered if at least one part filled
        return vals.some((v) => v.trim().length > 0);
      }).length;
    }

    return 0;
  }, [paper.meta.type, mcqAnswers, textAnswers, structuredAnswers]);

  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // ---------------------------
  // Navigation
  // ---------------------------
  const isLastPage = page === totalPages;

  const onContinue = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  const onPrevious = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const onSubmit = async () => {
    const elapsedSeconds = durationMinutes * 60 - remainingSeconds;

    console.log("📤 Preparing to submit paper...");
    console.log("   Paper title:", paper.title);
    console.log("   Total questions:", totalQuestions);
    console.log("   Paper questions array:", paper.questions?.length);
    
    // Prepare questions with user answers for validation
    const questionsWithAnswers = paper.questions.map((q, idx) => {
      let userAnswer = "";
      const qType = paper.meta.type.toLowerCase();
      
      if (qType === "mcq") {
        // For MCQ, store the selected option index
        if (mcqAnswers[idx] !== undefined) {
          userAnswer = q.options ? q.options[mcqAnswers[idx]] : "";
        }
      } else if (qType === "short answers" || qType === "short_answers" || qType === "essay") {
        userAnswer = textAnswers[idx] || "";
      } else if (qType === "structured") {
        // For structured, combine parts
        const parts = structuredAnswers[idx] || {};
        userAnswer = Object.values(parts).join(" | ");
      }
      
      return {
        ...q,
        user_answer: userAnswer,
        type: qType
      };
    });
    
    // Validate submission
    setIsValidating(true);
    try {
      console.log("🔍 Validating submission...");
      const validation = await questionApi.validateSubmission(
        questionsWithAnswers,
        paper.meta.type,
        questionsWithAnswers[0]?.topic || "General"
      );
      
      console.log("✅ Validation result:", validation);
      setValidationResult(validation);
      setShowValidationDialog(true);
      
      // If there are only warnings (not errors), allow auto-proceed after 3 seconds
      // Otherwise, user must click "Proceed Anyway"
      if (validation.can_proceed && validation.errors.length === 0) {
        setTimeout(() => {
          proceedToResults(elapsedSeconds);
        }, 1500);
      }
    } catch (error) {
      console.error("❌ Validation error:", error);
      // If validation fails, still allow submission
      proceedToResults(elapsedSeconds);
    } finally {
      setIsValidating(false);
    }
  };

  const proceedToResults = (elapsedSeconds: number) => {
    console.log("📤 Submitting paper...");
    console.log("   Paper title:", paper.title);
    console.log("   Total questions:", totalQuestions);
    
    // Validate that questions have answers
    if (paper.questions) {
      const missingAnswers = paper.questions.filter((q, idx) => !q.answer && !q.correct_answer);
      if (missingAnswers.length > 0) {
        console.warn(`⚠️ Warning: ${missingAnswers.length} questions missing answer field!`);
      } else {
        console.log("✅ All questions have answers or correct_answer field");
      }
    }

    const payload = {
      slug,
      type: paper.meta.type,
      totalQuestions,
      answeredCount,
      elapsedSeconds,
      mcqAnswers,
      textAnswers,
      structuredAnswers,
      // keep paper info for results page
      paperTitle: subject?.name ? `${subject.name} - ${subject.code}` : paper.title,
      // pass questions with correct answers for grading
      questions: paper.questions,
    };

    console.log("📊 Payload being saved:", {
      type: payload.type,
      totalQuestions: payload.totalQuestions,
      questionsCount: payload.questions?.length,
      hasAnswers: payload.questions?.map(q => !!q.answer || !!q.correct_answer),
    });

    // store results for refresh-safe
    const jsonString = JSON.stringify(payload);
    console.log(`📝 Serialized payload size: ${jsonString.length} bytes`);
    localStorage.setItem("MODEL_PAPER_RESULTS", jsonString);
    console.log("✅ Data saved to localStorage");

    // navigate to results (NO layout route)
    console.log("🔄 Navigating to results page...");
    setShowValidationDialog(false);
    navigate(`/model-paper/${slug}/results`, { state: payload });
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-8 sm:px-16 md:px-20 lg:px-40 py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-[20px] font-semibold text-[#087990] mb-8 hover:text-gray-900  flex items-center gap-2"
      >
        ← Back
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left Title */}
          <div className="">
            <p className="text-[24px] font-bold text-[#087990]">
              {subject?.name ?? paper.title} {subject?.code ? `- ${subject.code}` : ""}
            </p>


          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-3">
            <InfoPill
              title="Date & Time"
              value={startDateTime ?? "Nov 12, 2025 - 11:40AM"}
              tint="bg-[#EEF6FF] text-[#0D6EFD]"
                iconName="calendar"
            />
            <InfoPill
              title="Time Remaining"
              value={formatHHMMSS(remainingSeconds)}
              tint="bg-[#ECFDF3] text-[#24922F]"
                iconName="hourglass"
            />
            <InfoPill
              title="Duration"
              value={`${durationMinutes / 60} hr`}
              tint="bg-[#FFF7ED] text-[#CA8349]"
                iconName="clock"
            />
          </div>
          
        </div>

        {/* Instructions */}
{/* Description + Instruction (like screenshot) */}
<div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-14">
  {/* Description */}
  <div>
    <h2 className="text-[24px] font-semibold text-[#1D1D1D]">Description</h2>

    <p className="mt-2 text-[14px] leading-6 text-[#000000]">
      This question paper evaluates students’ understanding of cloud networking
      fundamentals including SDN, NFV, virtual networks, subnetting, access control
      mechanisms, gateway services, peering, hybrid connectivity, private access to
      cloud services, and flow logs.
    </p>

    <p className="mt-4 text-[14px] text-[#3B3B3B]">
      Topic: <span className="font-semibold">{paper.meta.topic}</span>{" "}
      <span className="mx-2 text-[#9CA3AF]">•</span>
      Difficulty: <span className="font-semibold">{paper.meta.difficulty}</span>{" "}
      <span className="mx-2 text-[#9CA3AF]">•</span>
      Type: <span className="font-semibold">{paper.meta.type}</span>
    </p>
  </div>

  {/* Instruction */}
  <div>
    <h2 className="text-[20px] font-semibold text-[#1D1D1D]">Instruction</h2>

    <ul className="mt-3 list-disc pl-5 space-y-2 text-[14px] text-[#1F2937]">
      <li>All questions are compulsory.</li>
      <li>Calculators are not permitted.</li>
      <li>Ensure you have a stable internet connection.</li>
      <li>Don’t switch tabs or windows during the exam.</li>
    </ul>
  </div>
</div>



      </div>
        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span />
            <span>{progressPercent}% Completed</span>
          </div>
          <div className="h-2 w-full bg-[#D1E7DD] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00C013]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Page {page} / {totalPages} • Showing questions {startIdx + 1}–{endIdx} of{" "}
            {totalQuestions}
          </div>
        </div>
      {/* Questions Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
        <div className="space-y-5">
          {pageQuestions.map((item, localIdx) => {
            const globalIndex = startIdx + localIdx;
            const qType = paper.meta.type.toLowerCase();

            return (
              <div key={globalIndex} className="border border-gray-100 rounded-xl p-5">
                <p className="text-sm font-semibold text-gray-900">
                  {String(globalIndex + 1).padStart(2, "0")}. {item.q}
                </p>

                {/* MCQ */}
                {qType === "mcq" && (
                  <MCQBlock
                    globalIndex={globalIndex}
                    options={item.options || []}
                    selected={mcqAnswers[globalIndex]}
                    onSelect={(qIndex, optIndex) =>
                      setMcqAnswers((prev) => ({ ...prev, [qIndex]: optIndex }))
                    }
                  />
                )}

                {/* Short Answers */}
                {(qType === "short answers" || qType === "short_answers") && (
                  <ShortAnswerBlock
                    value={textAnswers[globalIndex] ?? ""}
                    onChange={(v) =>
                      setTextAnswers((prev) => ({ ...prev, [globalIndex]: v }))
                    }
                  />
                )}

                {/* Essay */}
                {qType === "essay" && (
                  <EssayBlock
                    value={textAnswers[globalIndex] ?? ""}
                    onChange={(v) =>
                      setTextAnswers((prev) => ({ ...prev, [globalIndex]: v }))
                    }
                  />
                )}

                {/* Structured */}
                {qType === "structured" && (
                  <StructuredBlock
                    parts={
                      item.parts ?? [
                        "(a) Explain the concept.",
                        "(b) Give an example.",
                        "(c) Mention one limitation.",
                      ]
                    }
                    values={structuredAnswers[globalIndex] ?? {}}
                    onChangePart={(partIndex, v) =>
                      setStructuredAnswers((prev) => ({
                        ...prev,
                        [globalIndex]: { ...(prev[globalIndex] ?? {}), [partIndex]: v },
                      }))
                    }
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Buttons */}
        <div className="flex justify-end mt-6 gap-3">
          <button
            className="px-5 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            onClick={onPrevious}
            disabled={page === 1}
          >
            ← Previous
          </button>

          {!isLastPage ? (
            <button
              className="px-6 py-2 rounded-xl bg-[#0B7285] text-white hover:opacity-95 flex items-center gap-2"
              onClick={onContinue}
            >
              Continue →
            </button>
          ) : (
            <button
              className="px-6 py-2 rounded-xl bg-[#0B7285] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={onSubmit}
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validating...
                </>
              ) : (
                "Submit"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Validation Dialog */}
      {showValidationDialog && validationResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0B7285] to-[#055160] text-white p-6 sticky top-0">
              <h2 className="text-[24px] font-bold">
                {validationResult.is_valid ? "✅ All Good!" : "⚠️ Validation Results"}
              </h2>
              <p className="text-[14px] mt-2 opacity-90">{validationResult.summary}</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Errors */}
              {validationResult.errors && validationResult.errors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[16px] font-semibold text-red-700">❌ Errors ({validationResult.errors.length})</h3>
                  {validationResult.errors.map((error: any, idx: number) => (
                    <div key={idx} className="p-3 bg-red-50 rounded border border-red-300">
                      <p className="text-[12px] font-bold text-red-900">Q{error.question_index + 1}: {error.error_type}</p>
                      <p className="text-[13px] text-red-800 mt-1">{error.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings && validationResult.warnings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[16px] font-semibold text-amber-700">⚠️ Warnings ({validationResult.warnings.length})</h3>
                  {validationResult.warnings.map((warning: any, idx: number) => (
                    <div key={idx} className="p-3 bg-amber-50 rounded border border-amber-300">
                      <p className="text-[12px] font-bold text-amber-900">Q{warning.question_index + 1}: {warning.error_type}</p>
                      <p className="text-[13px] text-amber-800 mt-1">{warning.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Success Message */}
              {validationResult.is_valid && (
                <div className="p-4 bg-green-50 rounded border border-green-300">
                  <p className="text-[14px] text-green-800">
                    All your answers have been validated successfully. You can now proceed to view your results.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 flex gap-3 justify-end sticky bottom-0 bg-gray-50">
              <button
                onClick={() => setShowValidationDialog(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              >
                Go Back
              </button>
              {/* Show "Proceed Anyway" only if there are warnings but no errors */}
              {!validationResult.is_valid && validationResult.errors.length === 0 && (
                <button
                  onClick={() => proceedToResults(durationMinutes * 60 - remainingSeconds)}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                >
                  Proceed Anyway
                </button>
              )}
              {validationResult.can_proceed && (
                <button
                  onClick={() => proceedToResults(durationMinutes * 60 - remainingSeconds)}
                  className="px-4 py-2 rounded-lg bg-[#0B7285] text-white hover:bg-[#055160]"
                >
                  Continue to Results
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- UI Blocks -------------------- */

function MCQBlock({
  globalIndex,
  options,
  selected,
  onSelect,
}: {
  globalIndex: number;
  options: string[];
  selected: number | undefined;
  onSelect: (qIndex: number, optIndex: number) => void;
}) {
  // Fallback options if none provided
  const displayOptions = options.length > 0 
    ? options 
    : ["Option A", "Option B", "Option C", "Option D"];

  return (
    <div className="mt-4 space-y-3">
      {displayOptions.map((opt, optIdx) => {
        const checked = selected === optIdx;

        return (
          <button
            key={optIdx}
            type="button"
            onClick={() => onSelect(globalIndex, optIdx)}
            className={`w-full text-left flex items-start gap-3 rounded-xl border px-4 py-3 transition
              ${
                checked
                  ? "border-[#0B7285] bg-[#E6F4F1]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
          >
            <span
              className={`mt-1 h-4 w-4 rounded-full border flex items-center justify-center flex-shrink-0
                ${checked ? "border-[#0B7285]" : "border-gray-300"}`}
            >
              {checked ? <span className="h-2 w-2 rounded-full bg-[#0B7285]" /> : null}
            </span>

            <span className="text-sm text-gray-700 leading-6">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function ShortAnswerBlock({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      className="mt-4 w-full rounded-xl border border-gray-200 p-4 text-sm text-gray-700 outline-none focus:border-[#0B7285]"
      rows={3}
      placeholder="Type your answer here..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function EssayBlock({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      className="mt-4 w-full rounded-xl border border-gray-200 p-4 text-sm text-gray-700 outline-none focus:border-[#0B7285]"
      rows={8}
      placeholder="Write your essay answer here..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function StructuredBlock({
  parts,
  values,
  onChangePart,
}: {
  parts: string[];
  values: Record<number, string>;
  onChangePart: (partIndex: number, v: string) => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      {parts.map((p, idx) => (
        <div key={idx}>
          <p className="text-sm font-medium text-gray-800">{p}</p>
          <textarea
            className="mt-2 w-full rounded-xl border border-gray-200 p-4 text-sm text-gray-700 outline-none focus:border-[#0B7285]"
            rows={3}
            placeholder="Type your answer..."
            value={values[idx] ?? ""}
            onChange={(e) => onChangePart(idx, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
