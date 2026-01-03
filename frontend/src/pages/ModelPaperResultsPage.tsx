import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiClock } from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi";
import { AiOutlineLineChart } from "react-icons/ai";
// import Book from "../assets/mdi-light_book.svg";
// import Chart from "../assets/mynaui_chart-line.svg";

type PaperQuestion = {
  q: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  parts?: string[];
};

type ResultsState = {
  slug: string | undefined;
  type: string;
  totalQuestions: number;
  answeredCount: number;
  elapsedSeconds: number;

  mcqAnswers: Record<number, number>;
  textAnswers: Record<number, string>;
  structuredAnswers: Record<number, Record<number, string>>;

  paperTitle: string;
  questions?: PaperQuestion[];
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}hr ${m}min`;
  return `${m}min`;
}

function progressLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 60) return "Normal";
  return "Low";
}

export default function ModelPaperResultsPage() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const { state } = useLocation() as { state?: ResultsState };

  const data: ResultsState | null = useMemo(() => {
    if (state?.totalQuestions) return state;

    const raw = localStorage.getItem("MODEL_PAPER_RESULTS");
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as ResultsState;
      return parsed?.totalQuestions ? parsed : null;
    } catch {
      return null;
    }
  }, [state]);

  if (!data) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-gray-700">No results found.</p>
        <button
          onClick={() => navigate("/model-paper")}
          className="mt-4 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
        >
          Go to Model Paper
        </button>
      </div>
    );
  }

  const { totalQuestions, answeredCount, elapsedSeconds, paperTitle, questions, mcqAnswers, type } = data;

  // Grade MCQ answers by comparing user selection with correct answer
  const isQuestionCorrect = (questionIndex: number): boolean => {
    const questionType = type?.toLowerCase();
    
    // For MCQ, compare user's selected option with correct answer
    if (questionType === "mcq" && questions && questions[questionIndex]) {
      const question = questions[questionIndex];
      const userAnswerIndex = mcqAnswers[questionIndex];
      
      if (userAnswerIndex === undefined || !question.options || !question.correct_answer) {
        return false; // Not answered or no correct answer available
      }
      
      const userAnswer = question.options[userAnswerIndex];
      // Compare by checking if user's selected option matches correct answer
      // Handle cases like "B. SE4050" matching "B. SE4050"
      return userAnswer === question.correct_answer || 
             userAnswer?.startsWith(question.correct_answer?.charAt(0) + ".") && 
             question.correct_answer?.startsWith(userAnswer?.charAt(0) + ".");
    }
    
    // For other types, consider answered as "pending review" (show as correct for now)
    return true;
  };

  const correctCount = Array.from({ length: totalQuestions }).filter((_, i) =>
    isQuestionCorrect(i)
  ).length;

  const score = Math.round((correctCount / totalQuestions) * 100);
  const label = progressLabel(score);

  // Get explanation for incorrect questions
  const getExplanation = (qIndex: number): string | null => {
    if (questions && questions[qIndex]?.explanation) {
      return questions[qIndex].explanation || null;
    }
    return null;
  };

  // resources for incorrect questions
  const resourceFor = (qIndex: number) =>
    `https://www.youtube.com/@StephaneMaarek`; // example like screenshot

  return (
    <div className="min-h-screen bg-white px-16  mr-16 py-10">
      <h1 className="text-[32px] font-bold text-[#055160]">Results</h1>
      <p className="text-sm text-gray-500 mt-1">{paperTitle}</p>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 gap-5">
        <ResultCard
          title="Time Duration"
          value={formatDuration(elapsedSeconds)}
          sub="Time Duration"
          iconName="time"
        />
        <ResultCard
          title="Completed Credits"
          value={`${score}/100`}
          sub="Completed Credits"
          iconName="credits"
        />
        <ResultCard
          title="Overall Progress"
          value={label}
          sub="Overall Progress"
          iconName="progress"
        />
      </div>

      {/* Table */}
      <h2 className="mt-8 text-[32px] font-bold text-[#055160]">
        Suggesting Resources
      </h2>

      <div className="mt-4 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 place-items-center justify-items-start bg-[#D1E7DD] px-5 py-3 h-19 text-[20px] font-semibold text-[#055160]">
          <div className="col-span-4">Question Number</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-5">Resources</div>
        </div>

        {/* Rows */}
        <div className="results-scroll max-h-[400px] overflow-y-auto mt-4">
          {Array.from({ length: totalQuestions }).map((_, i) => {
            const correct = isQuestionCorrect(i);
            const explanation = getExplanation(i);
            const question = questions?.[i];
            const userAnswerIndex = mcqAnswers?.[i];
            const userAnswer = question?.options?.[userAnswerIndex];
            
            return (
              <div
                key={i}
                className="grid grid-cols-12 place-items-center justify-items-start px-5 py-3 min-h-[68px] gap-4 text-sm border-b border-[#CCCCCC]"
              >
                <div className="col-span-4 text-[#1D1D1D] font-medium text-[16px]">
                  <div>Question {String(i + 1).padStart(2, "0")}</div>
                  {!correct && userAnswer && (
                    <div className="text-xs text-gray-500 mt-1">
                      Your answer: {userAnswer}
                    </div>
                  )}
                  {!correct && question?.correct_answer && (
                    <div className="text-xs text-green-600 mt-1">
                      Correct: {question.correct_answer}
                    </div>
                  )}
                </div>

                <div className="col-span-3">
                  {correct ? (
                    <span className="inline-flex px-3 py-1 items-center justify-center w-18 h-7 rounded-lg text-[14px] font-medium bg-[#00C0134D] text-[#24922F]">
                      Correct
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 w-18 h-7 rounded-lg text-[14px] font-medium bg-[#F1AEB5] text-[#DC3545]">
                      Incorrect
                    </span>
                  )}
                </div>

                <div className="col-span-5 text-[16px] text-[#1D1D1D]">
                  {correct ? (
                    <span className="text-gray-400">-</span>
                  ) : (
                    <div>
                      {explanation && (
                        <p className="text-[13px] text-gray-600 mb-1">{explanation}</p>
                      )}
                      <a
                        href={resourceFor(i)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0B7285] text-[13px] font-normal hover:underline break-all"
                      >
                        Learn more →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 text-xs text-gray-500 border-t border-gray-100">
          Answered: {answeredCount}/{totalQuestions} • Correct: {correctCount}/{totalQuestions}
        </div>
      </div>
    </div>
  );
}

type IconName = "time" | "credits" | "progress";

const iconMap: Record<IconName, React.ElementType> = {
  time: FiClock,
  credits: HiOutlineDocumentText,
  progress: AiOutlineLineChart,
};

function ResultCard({
  title,
  value,
  sub,
  iconName,
}: {
  title: string;
  value: string;
  sub: string;
  iconName: IconName;
}) {
  const Icon = iconMap[iconName];

  return (
    <div className="relative bg-white rounded-2xl w-62.5 h-28.5 border-l-5 border-[#0B7285] shadow-sm px-2 py-2 flex items-center gap-4">
      {/* Left teal bar */}

      {/* Icon */}
      <div className="ml-2 h-12 w-12 rounded-xl bg-white  flex items-center justify-center text-[#0B7285]">
        <Icon className="w-12 h-12" />
      </div>

      {/* Text */}
      <div>
        <p className="text-[20px] font-semibold text-[#055160] leading-tight">
          {value}
        </p>
        <p className="text-[18px] text-[#4B5563] mt-1">{sub}</p>
      </div>
    </div>
  );
}
