import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiClock } from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi";
import { AiOutlineLineChart } from "react-icons/ai";
import { questionApi } from "../api";
import type { AnswerEvaluation } from "../types";
// import Book from "../assets/mdi-light_book.svg";
// import Chart from "../assets/mynaui_chart-line.svg";

type PaperQuestion = {
  q: string;
  answer?: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  parts?: string[];
};

type RecommendedResource = {
  title: string;
  type: string;
  url: string;
  description: string;
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
  recommendedResources?: {
    topic: string;
    resources: RecommendedResource[];
  };
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
  
  // Store evaluations for non-MCQ questions
  const [evaluations, setEvaluations] = useState<Record<number, AnswerEvaluation>>({});
  const [evaluatingQuestions, setEvaluatingQuestions] = useState<Set<number>>(new Set());
  const [hasInitializedEvaluation, setHasInitializedEvaluation] = useState(false);

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

  // Evaluate non-MCQ answers when page loads
  useEffect(() => {
    if (!data || hasInitializedEvaluation) return;
    
    const evaluateNonMCQAnswers = async () => {
      const questionType = data.type?.toLowerCase();
      
      // Only evaluate if not MCQ
      if (questionType !== "mcq" && data.questions && (data.textAnswers || data.structuredAnswers)) {
        setHasInitializedEvaluation(true);
        
        for (let i = 0; i < data.totalQuestions; i++) {
          const question = data.questions?.[i];
          let userAnswer = "";
          let hasUserAnswer = false;
          
          // Get user answer based on type
          if (questionType === "short_answers" || questionType === "essay") {
            userAnswer = data.textAnswers?.[i] || "";
            hasUserAnswer = userAnswer.trim().length > 0;
          } else if (questionType === "structured") {
            const parts = data.structuredAnswers?.[i];
            if (parts && Object.values(parts).some(p => (p as string).trim())) {
              hasUserAnswer = true;
            }
          }
          
          // Only evaluate if user provided an answer
          if (hasUserAnswer) {
            setEvaluatingQuestions(prev => new Set([...prev, i]));
            
            try {
              let evaluation;
              
              if (questionType === "structured") {
                // Evaluate structured answer with parts
                const parts = data.structuredAnswers?.[i] || {};
                const modelAnswers = question?.answer?.split(/\n(?=\*\*Delivery|<br>|##|---)/i) || [];
                
                // Try to extract parts from model answer (assumes format with numbered parts or bullet points)
                const extractPartFromAnswer = (answer: string, partLabel: string): string => {
                  const regex = new RegExp(`\\*?\\*?${partLabel}[:.]*\\*?\\*?.*?(?=\\n\\*|$)`, 'is');
                  const match = answer.match(regex);
                  return match ? match[0] : answer;
                };
                
                evaluation = await questionApi.evaluateStructuredAnswer(
                  question?.q || "",
                  parts["0"] || parts["a"] || "",
                  extractPartFromAnswer(question?.answer || "", "(a|Part A)"),
                  parts["1"] || parts["b"] || "",
                  extractPartFromAnswer(question?.answer || "", "(b|Part B)"),
                  parts["2"] || parts["c"] || "",
                  extractPartFromAnswer(question?.answer || "", "(c|Part C)"),
                  data.recommendedResources?.topic || "General"
                );
              } else {
                // Evaluate regular short answer or essay
                evaluation = await questionApi.evaluateAnswer(
                  question?.q || "",
                  userAnswer,
                  question?.answer || question?.correct_answer || "",
                  questionType === "short_answers" ? "short_answer" : questionType,
                  data.recommendedResources?.topic || "General"
                );
              }
              
              setEvaluations(prev => ({
                ...prev,
                [i]: evaluation
              }));
            } catch (error) {
              console.error(`Error evaluating question ${i}:`, error);
              setEvaluations(prev => ({
                ...prev,
                [i]: {
                  score: 0,
                  feedback: "Error evaluating answer",
                  strengths: [],
                  areas_for_improvement: [],
                  key_points_missed: [],
                  suggested_improvements: "",
                  comparison_with_model_answer: "",
                  overall_assessment: "Could not evaluate at this time",
                  error: "Evaluation failed"
                }
              }));
            } finally {
              setEvaluatingQuestions(prev => {
                const newSet = new Set(prev);
                newSet.delete(i);
                return newSet;
              });
            }
          }
        }
      }
    };
    
    evaluateNonMCQAnswers();
  }, [data, hasInitializedEvaluation]);

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

  // Get explanation for any question
  const getExplanation = (qIndex: number): string | null => {
    if (questions && questions[qIndex]?.explanation) {
      return questions[qIndex].explanation || null;
    }
    return null;
  };

  // Get answer for any question type
  const getAnswer = (qIndex: number): string | null => {
    if (questions && questions[qIndex]) {
      const question = questions[qIndex];
      // Return the answer field if available, otherwise the correct_answer for MCQ
      return question.answer || question.correct_answer || null;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white px-8 sm:px-10 md:px-12 lg:px-16  xl:mr-16 py-10">
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

      {/* Answer Key & Explanations */}
      <h2 className="mt-8 text-[32px] font-bold text-[#055160]">
        Answer Key & Explanations
      </h2>

      <div className="mt-4 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 place-items-center justify-items-start bg-[#D1E7DD] px-5 py-3 h-19 text-[20px] font-semibold text-[#055160]">
          <div className="col-span-3">Question</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-7">Answer & Explanation</div>
        </div>

        {/* Rows */}
        <div className="results-scroll max-h-[600px] overflow-y-auto mt-4">
          {Array.from({ length: totalQuestions }).map((_, i) => {
            const correct = isQuestionCorrect(i);
            const explanation = getExplanation(i);
            const answer = getAnswer(i);
            const question = questions?.[i];
            const userAnswerIndex = mcqAnswers?.[i];
            const userAnswer = question?.options?.[userAnswerIndex];
            
            return (
              <div
                key={i}
                className="grid grid-cols-12 place-items-start justify-items-start px-5 py-4 gap-4 text-sm border-b border-[#CCCCCC] items-start"
              >
                <div className="col-span-3">
                  <div className="text-[#1D1D1D] font-medium text-[15px]">
                    Question {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{question?.q}</div>
                  {!correct && userAnswer && (
                    <div className="text-xs text-red-600 mt-1">
                      Your: {userAnswer}
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  {correct ? (
                    <span className="inline-flex px-3 py-1 items-center justify-center whitespace-nowrap rounded-lg text-[13px] font-medium bg-[#00C0134D] text-[#24922F]">
                      ✓ Correct
                    </span>
                  ) : (
                    <span className="inline-flex px-3 py-1 whitespace-nowrap rounded-lg text-[13px] font-medium bg-[#F1AEB5] text-[#DC3545]">
                      ✗ Incorrect
                    </span>
                  )}
                </div>

                <div className="col-span-7">
                  {/* Show evaluation for non-MCQ questions */}
                  {type?.toLowerCase() !== "mcq" && evaluations[i] && (
                    <div className="space-y-2">
                      {/* Structured Question Evaluation */}
                      {type?.toLowerCase() === "structured" && (evaluations[i] as any).part_a && (
                        <>
                          {/* Overall Score */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[12px] font-bold text-white px-3 py-1 rounded-lg" 
                              style={{
                                backgroundColor: (evaluations[i] as any).overall_score >= 70 ? '#44A673' : 
                                               (evaluations[i] as any).overall_score >= 50 ? '#FF9800' : '#DC3545'
                              }}>
                              Overall Score: {(evaluations[i] as any).overall_score}/100
                            </span>
                          </div>

                          {/* Part (a) Evaluation */}
                          <div className="p-2 bg-blue-50 rounded border border-blue-200">
                            <p className="text-[12px] font-bold text-blue-900">Part (a) - Score: {(evaluations[i] as any).part_a.score}/100</p>
                            <p className="text-[12px] text-blue-800 mt-1">{(evaluations[i] as any).part_a.feedback}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded mt-1 inline-block ${
                              (evaluations[i] as any).part_a.status === 'excellent' ? 'bg-green-200 text-green-800' :
                              (evaluations[i] as any).part_a.status === 'good' ? 'bg-blue-200 text-blue-800' :
                              (evaluations[i] as any).part_a.status === 'satisfactory' ? 'bg-amber-200 text-amber-800' :
                              'bg-red-200 text-red-800'
                            }`}>
                              {(evaluations[i] as any).part_a.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>

                          {/* Part (b) Evaluation */}
                          <div className="p-2 bg-green-50 rounded border border-green-200">
                            <p className="text-[12px] font-bold text-green-900">Part (b) - Score: {(evaluations[i] as any).part_b.score}/100</p>
                            <p className="text-[12px] text-green-800 mt-1">{(evaluations[i] as any).part_b.feedback}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded mt-1 inline-block ${
                              (evaluations[i] as any).part_b.status === 'excellent' ? 'bg-green-200 text-green-800' :
                              (evaluations[i] as any).part_b.status === 'good' ? 'bg-blue-200 text-blue-800' :
                              (evaluations[i] as any).part_b.status === 'satisfactory' ? 'bg-amber-200 text-amber-800' :
                              'bg-red-200 text-red-800'
                            }`}>
                              {(evaluations[i] as any).part_b.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>

                          {/* Part (c) Evaluation */}
                          <div className="p-2 bg-amber-50 rounded border border-amber-200">
                            <p className="text-[12px] font-bold text-amber-900">Part (c) - Score: {(evaluations[i] as any).part_c.score}/100</p>
                            <p className="text-[12px] text-amber-800 mt-1">{(evaluations[i] as any).part_c.feedback}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded mt-1 inline-block ${
                              (evaluations[i] as any).part_c.status === 'excellent' ? 'bg-green-200 text-green-800' :
                              (evaluations[i] as any).part_c.status === 'good' ? 'bg-blue-200 text-blue-800' :
                              (evaluations[i] as any).part_c.status === 'satisfactory' ? 'bg-amber-200 text-amber-800' :
                              'bg-red-200 text-red-800'
                            }`}>
                              {(evaluations[i] as any).part_c.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>

                          {/* Overall Feedback */}
                          <div className="p-2 bg-purple-50 rounded border border-purple-200">
                            <p className="text-[12px] font-semibold text-purple-900 mb-1">Overall Feedback:</p>
                            <p className="text-[12px] text-purple-800">{(evaluations[i] as any).overall_feedback}</p>
                          </div>

                          {/* Strengths */}
                          {(evaluations[i] as any).strengths && (evaluations[i] as any).strengths.length > 0 && (
                            <div className="p-2 bg-green-50 rounded border border-green-200">
                              <p className="text-[12px] font-semibold text-green-900 mb-1">Strengths:</p>
                              <ul className="text-[12px] text-green-800 space-y-1">
                                {(evaluations[i] as any).strengths.map((strength: string, idx: number) => (
                                  <li key={idx} className="flex gap-1">
                                    <span>✓</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Areas for Improvement */}
                          {(evaluations[i] as any).areas_for_improvement && (evaluations[i] as any).areas_for_improvement.length > 0 && (
                            <div className="p-2 bg-amber-50 rounded border border-amber-200">
                              <p className="text-[12px] font-semibold text-amber-900 mb-1">Areas to Improve:</p>
                              <ul className="text-[12px] text-amber-800 space-y-1">
                                {(evaluations[i] as any).areas_for_improvement.map((improvement: string, idx: number) => (
                                  <li key={idx} className="flex gap-1">
                                    <span>•</span>
                                    <span>{improvement}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}

                      {/* Non-Structured Answer Evaluation */}
                      {type?.toLowerCase() !== "structured" && (evaluations[i] as any).score !== undefined && (
                        <>
                          {/* Score Badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[12px] font-bold text-white px-3 py-1 rounded-lg" 
                              style={{
                                backgroundColor: (evaluations[i] as any).score >= 70 ? '#44A673' : 
                                               (evaluations[i] as any).score >= 50 ? '#FF9800' : '#DC3545'
                              }}>
                              Score: {(evaluations[i] as any).score}/100
                            </span>
                            {(evaluations[i] as any).score >= 70 && <span className="text-lg">✓ Good</span>}
                            {(evaluations[i] as any).score >= 50 && (evaluations[i] as any).score < 70 && <span className="text-lg">◐ Fair</span>}
                            {(evaluations[i] as any).score < 50 && <span className="text-lg">✗ Needs Work</span>}
                          </div>

                          {/* Feedback */}
                          <div className="p-2 bg-blue-50 rounded border border-blue-200">
                            <p className="text-[12px] font-semibold text-blue-900 mb-1">Feedback:</p>
                            <p className="text-[12px] text-blue-800">{(evaluations[i] as any).feedback}</p>
                          </div>

                          {/* Strengths */}
                          {(evaluations[i] as any).strengths && (evaluations[i] as any).strengths.length > 0 && (
                            <div className="p-2 bg-green-50 rounded border border-green-200">
                              <p className="text-[12px] font-semibold text-green-900 mb-1">Strengths:</p>
                              <ul className="text-[12px] text-green-800 space-y-1">
                                {(evaluations[i] as any).strengths.map((strength: string, idx: number) => (
                                  <li key={idx} className="flex gap-1">
                                    <span>✓</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Areas for Improvement */}
                          {(evaluations[i] as any).areas_for_improvement && (evaluations[i] as any).areas_for_improvement.length > 0 && (
                            <div className="p-2 bg-amber-50 rounded border border-amber-200">
                              <p className="text-[12px] font-semibold text-amber-900 mb-1">Areas to Improve:</p>
                              <ul className="text-[12px] text-amber-800 space-y-1">
                                {(evaluations[i] as any).areas_for_improvement.map((improvement: string, idx: number) => (
                                  <li key={idx} className="flex gap-1">
                                    <span>•</span>
                                    <span>{improvement}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Key Points Missed */}
                          {(evaluations[i] as any).key_points_missed && (evaluations[i] as any).key_points_missed.length > 0 && (
                            <div className="p-2 bg-red-50 rounded border border-red-200">
                              <p className="text-[12px] font-semibold text-red-900 mb-1">Key Points Missed:</p>
                              <ul className="text-[12px] text-red-800 space-y-1">
                                {(evaluations[i] as any).key_points_missed.map((point: string, idx: number) => (
                                  <li key={idx} className="flex gap-1">
                                    <span>→</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Suggestions */}
                          {(evaluations[i] as any).suggested_improvements && (
                            <div className="p-2 bg-purple-50 rounded border border-purple-200">
                              <p className="text-[12px] font-semibold text-purple-900 mb-1">Suggestions:</p>
                              <p className="text-[12px] text-purple-800">{(evaluations[i] as any).suggested_improvements}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* MCQ answer display */}
                  {type?.toLowerCase() === "mcq" && (
                    <>
                      {answer && (
                        <div className="mb-2 p-2 bg-[#F2F8F5] rounded border border-[#44A673]/20">
                          <p className="text-[12px] font-semibold text-[#055160] mb-1">Answer:</p>
                          <p className="text-[13px] text-gray-700 whitespace-pre-wrap line-clamp-3">{answer}</p>
                        </div>
                      )}
                      {explanation && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-[12px] font-semibold text-blue-900 mb-1">Why:</p>
                          <p className="text-[13px] text-blue-800 line-clamp-3">{explanation}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Loading state for evaluations */}
                  {type?.toLowerCase() !== "mcq" && evaluatingQuestions.has(i) && (
                    <div className="p-2 bg-gray-50 rounded border border-gray-200">
                      <p className="text-[12px] text-gray-600">Evaluating answer...</p>
                      <div className="w-full h-1 bg-gray-200 rounded mt-1 overflow-hidden">
                        <div className="h-full bg-[#44A673] animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Fallback for non-MCQ with no evaluation yet */}
                  {type?.toLowerCase() !== "mcq" && !evaluations[i] && !evaluatingQuestions.has(i) && answer && (
                    <div className="mb-2 p-2 bg-[#F2F8F5] rounded border border-[#44A673]/20">
                      <p className="text-[12px] font-semibold text-[#055160] mb-1">Model Answer:</p>
                      <p className="text-[13px] text-gray-700 whitespace-pre-wrap line-clamp-3">{answer}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 text-xs text-gray-500 border-t border-gray-100">
          Total: {totalQuestions} | Answered: {answeredCount} | Correct: {correctCount}
        </div>
      </div>

      {/* Recommended Resources */}
      {data?.recommendedResources && data.recommendedResources.resources && data.recommendedResources.resources.length > 0 && (
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-[32px] font-bold text-[#055160] mb-2">Recommended Learning Resources</h2>
            <p className="text-[#4B5563] text-[16px]">
              Enhance your understanding of <span className="font-semibold">{data.recommendedResources.topic}</span> with these curated materials:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recommendedResources.resources.map((resource, idx) => (
              <a
                key={idx}
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="p-4 border border-gray-200 rounded-xl hover:shadow-md hover:border-[#44A673] transition-all duration-300 group bg-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-block px-2.5 py-1 bg-[#44A673]/10 text-[#44A673] text-xs font-semibold rounded-md">
                    {resource.type}
                  </span>
                  <span className="text-[#44A673] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
                <h3 className="font-semibold text-[#1D1D1D] text-[14px] mb-1 group-hover:text-[#44A673] transition-colors line-clamp-2">
                  {resource.title}
                </h3>
                <p className="text-[#4B5563] text-[13px] line-clamp-2">{resource.description}</p>
              </a>
            ))}
          </div>
        </div>
      )}
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
