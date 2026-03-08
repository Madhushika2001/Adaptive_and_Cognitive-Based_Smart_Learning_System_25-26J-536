import React, { useMemo, useState, useEffect } from "react";
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
type StatusType = true | false | "pending";

export default function ModelPaperResultsPage() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const { state } = useLocation() as { state?: ResultsState };
  
  // Store evaluations for non-MCQ questions
  const [evaluations, setEvaluations] = useState<Record<number, AnswerEvaluation>>({});
  const [evaluatingQuestions, setEvaluatingQuestions] = useState<Set<number>>(new Set());
  const [hasInitializedEvaluation, setHasInitializedEvaluation] = useState(false);

  const data: ResultsState | null = useMemo(() => {
    if (state?.totalQuestions) {
      console.log("✅ Using state from router navigation:", state);
      console.log("   Total questions:", state.totalQuestions);
      console.log("   Questions array:", state.questions?.length || 0);
      if (state.questions?.[0]) {
        console.log("   First question answer:", state.questions[0].answer?.substring(0, 100) || "MISSING");
      }
      return state;
    }

    const raw = localStorage.getItem("MODEL_PAPER_RESULTS");
    if (!raw) {
      console.log("❌ No data in localStorage or router state");
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as ResultsState;
      console.log("✅ Using data from localStorage:", parsed);
      console.log("   Total questions:", parsed.totalQuestions);
      console.log("   Questions array:", parsed.questions?.length || 0);
      if (parsed.questions?.[0]) {
        console.log("   First question answer:", parsed.questions[0].answer?.substring(0, 100) || "MISSING");
      }
      return parsed?.totalQuestions ? parsed : null;
    } catch (e) {
      console.error("❌ Error parsing localStorage:", e);
      return null;
    }
  }, [state]);

  // Evaluate non-MCQ answers when page loads
  useEffect(() => {
    if (!data || hasInitializedEvaluation) return;
    
    const evaluateNonMCQAnswers = async () => {
      const questionType = data.type?.toLowerCase();
      
      console.log("🔍 Starting evaluation process...");
      console.log("   Question Type:", questionType);
      console.log("   Has questions:", !!data.questions);
      console.log("   Total Questions:", data.totalQuestions);
      console.log("   textAnswers keys:", Object.keys(data.textAnswers || {}));
      console.log("   structuredAnswers keys:", Object.keys(data.structuredAnswers || {}));
      
      // Data validation
      if (data.questions) {
        console.log("📋 Questions detail:");
        data.questions.forEach((q, idx) => {
          const hasAnswer = !!q.answer;
          const hasCorrectAnswer = !!q.correct_answer;
          const answerLength = (q.answer || q.correct_answer || "").length;
          console.log(`   Q${idx + 1}: answer=${hasAnswer}, correct_answer=${hasCorrectAnswer}, length=${answerLength}`);
        });
      }
      
      // Check evaluation criteria
      const isMCQ = questionType === "mcq";
      const hasQuestions = !!data.questions;
      const hasTextAnswers = !!data.textAnswers && Object.keys(data.textAnswers).length > 0;
      const hasStructuredAnswers = !!data.structuredAnswers && Object.keys(data.structuredAnswers).length > 0;
      
      console.log("📊 Evaluation criteria check:");
      console.log(`   NOT MCQ: ${!isMCQ}`);
      console.log(`   Has questions: ${hasQuestions}`);
      console.log(`   Has textAnswers: ${hasTextAnswers}`);
      console.log(`   Has structuredAnswers: ${hasStructuredAnswers}`);
      
      // Only evaluate if not MCQ
      if (!isMCQ && data.questions && (data.textAnswers || data.structuredAnswers)) {
        console.log("✅ Evaluation criteria met. Starting evaluations...");
        setHasInitializedEvaluation(true);
        
        for (let i = 0; i < data.totalQuestions; i++) {
          const question = data.questions?.[i];
          let userAnswer = "";
          let hasUserAnswer = false;
          
          // Check for missing model answer
          const modelAnswer = question?.answer || question?.correct_answer;
          if (!modelAnswer) {
            console.warn(`⚠️ Q${i + 1}: Missing model answer! This question cannot be evaluated.`);
            continue; // Skip this question
          }
          
          // Get user answer based on type
          if (questionType === "short_answers" || questionType === "short answers" || questionType === "short answer" || questionType === "essay") {
            userAnswer = data.textAnswers?.[i] || "";
            hasUserAnswer = userAnswer.trim().length > 0;
          } else if (questionType === "structured") {
            const parts = data.structuredAnswers?.[i];
            if (parts && Object.values(parts).some((p) => String(p).trim())) {
              hasUserAnswer = true;
            }
          }
          
          console.log(`📝 Q${i + 1}: userAnswer=${hasUserAnswer} (length=${userAnswer.length}), modelAnswer=${!!modelAnswer}`);
          
          // Only evaluate if user provided an answer
          if (!hasUserAnswer) {
            console.log(`⏭️ Q${i + 1}: Skipping - no user answer provided`);
            continue;
          }
          
          setEvaluatingQuestions((prev) => new Set([...prev, i]));
          
          try {
            let evaluation: any;
            
            if (questionType === "structured") {
              // Evaluate structured answer with parts
              const parts = data.structuredAnswers?.[i] || {};
              
              // Try to extract parts from model answer (assumes format with numbered parts or bullet points)
              const extractPartFromAnswer = (answer: string, partLabel: string): string => {
                const regex = new RegExp(`\\*?\\*?${partLabel}[:.]*\\*?\\*?.*?(?=\\n\\*|$)`, "is");
                const match = answer.match(regex);
                return match ? match[0] : answer;
              };
              
              const fullModel = question?.answer || question?.correct_answer || "";
              const partAModel = extractPartFromAnswer(fullModel, "(a|Part A)");
              const partBModel = extractPartFromAnswer(fullModel, "(b|Part B)");
              const partCModel = extractPartFromAnswer(fullModel, "(c|Part C)");
              
              console.log(`📤 Sending structured evaluation for Q${i + 1}:`, {
                question: (question?.q || "").substring(0, 50) + "...",
                partAUser: String(parts["0"] || parts["a"] || "").substring(0, 30) + "...",
                partBUser: String(parts["1"] || parts["b"] || "").substring(0, 30) + "...",
                partCUser: String(parts["2"] || parts["c"] || "").substring(0, 30) + "...",
              });
              
              evaluation = await questionApi.evaluateStructuredAnswer(
                question?.q || "",
                parts["0"] || parts["a"] || "",
                partAModel,
                parts["1"] || parts["b"] || "",
                partBModel,
                parts["2"] || parts["c"] || "",
                partCModel,
                data.recommendedResources?.topic || "General"
              );
            } else {
              // Evaluate regular short answer or essay
              const modelAns = question?.answer || question?.correct_answer || "";
              console.log(`📤 Sending ${questionType} evaluation for Q${i + 1}:`, {
                question: (question?.q || "").substring(0, 50) + "...",
                userAnswerLength: userAnswer.length,
                modelAnswerLength: modelAns.length,
                modelAnswerPreview: modelAns.substring(0, 50) + "..."
              });
              
              evaluation = await questionApi.evaluateAnswer(
                question?.q || "",
                userAnswer,
                modelAns,
                questionType === "short_answers" ||
                  questionType === "short answers" ||
                  questionType === "short answer"
                  ? "short_answer"
                  : questionType,
                data.recommendedResources?.topic || "General"
              );
            }
            
            console.log(`✅ Q${i + 1} evaluation received:`, evaluation);
            
            setEvaluations((prev) => ({
              ...prev,
              [i]: evaluation
            }));
          } catch (error) {
            console.error(`❌ Error evaluating question ${i + 1}:`, error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            setEvaluations(prev => ({
              ...prev,
              [i]: {
                score: 0,
                feedback: `Error evaluating answer: ${errorMessage}`,
                strengths: [],
                areas_for_improvement: [],
                key_points_missed: [],
                suggested_improvements: "",
                comparison_with_model_answer: "",
                overall_assessment: "Could not evaluate at this time",
                error: "Evaluation failed"
              } as any,
            }));
          } finally {
            setEvaluatingQuestions(prev => {
              const newSet = new Set(prev);
              newSet.delete(i);
              return newSet;
            });
          }
        }
      } else {
        console.log("⏭️ Skipping evaluation - criteria not met:");
        if (isMCQ) {
          console.log("   ❌ Question type is MCQ (no LLM evaluation needed)");
        }
        if (!data.questions) {
          console.log("   ❌ No questions array found in data");
        }
        if (!data.textAnswers && !data.structuredAnswers) {
          console.log("   ❌ No user answers found");
        }
        setHasInitializedEvaluation(true);
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

  const { totalQuestions, answeredCount, elapsedSeconds, paperTitle, questions, mcqAnswers, type, recommendedResources, textAnswers, structuredAnswers } = data;

  const threshold = 50; //  change if you want (ex: 60)

  //  Decide Correct/Incorrect/Pending properly for non-MCQ
  const getQuestionStatus = (questionIndex: number): StatusType => {
    const questionType = type?.toLowerCase();
    
    // MCQ: compare selected option with correct answer
    if (questionType === "mcq" && questions && questions[questionIndex]) {
      const question = questions[questionIndex];
      const userAnswerIndex = mcqAnswers[questionIndex];
      
      if (userAnswerIndex === undefined || !question.options || !question.correct_answer) {
        return false; // Not answered or no correct answer available
      }
      
      const userAnswer = question.options[userAnswerIndex];
      // Compare by checking if user's selected option matches correct answer
      // Handle cases like "B. SE4050" matching "B. SE4050"
      return ( userAnswer === question.correct_answer ||
           (userAnswer?.startsWith(question.correct_answer?.charAt(0) + ".") &&
          question.correct_answer?.startsWith(userAnswer?.charAt(0) + "."))
      );
    }

    // Structured: use overall_score if available
    if (questionType === "structured") {
      const ev = evaluations[questionIndex] as any;
      if (!ev) return "pending";
      if (ev?.error) return false;
      return (ev.overall_score ?? 0) >= threshold;
    }

    // Short / Essay: use score if available
    if (
      questionType === "short answers" ||
      questionType === "short_answers" ||
      questionType === "short answer" ||
      questionType === "essay"
    ) {
      const ev = evaluations[questionIndex] as any;
      if (!ev) return "pending";
      if (ev?.error) return false;
      return (ev.score ?? 0) >= threshold;
    }

    return "pending";
  };

  // Score counts: count only TRUE as correct; pending treated as incorrect for score display
  const correctCount = Array.from({ length: totalQuestions }).filter((_, i) => getQuestionStatus(i) === true
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

  const getUserAnswerDisplay = (qIndex: number): string | null => {
    const questionType = type?.toLowerCase();
    const question = questions?.[qIndex];

    if (!question) return null;

    if (questionType === "mcq") {
      const selectedIndex = mcqAnswers?.[qIndex];
      if (
        selectedIndex === undefined ||
        !question.options ||
        !question.options[selectedIndex]
      ) {
        return null;
      }
      return question.options[selectedIndex];
    }

    if (
      questionType === "short answers" ||
      questionType === "short_answers" ||
      questionType === "short answer" ||
      questionType === "essay"
    ) {
      return textAnswers?.[qIndex] || null;
    }

    if (questionType === "structured") {
      const parts = structuredAnswers?.[qIndex];
      if (!parts) return null;

      const formatted = Object.entries(parts)
        .filter(([, value]) => String(value).trim())
        .map(([key, value], idx) => {
          const labels = ["(a)", "(b)", "(c)", "(d)", "(e)"];
          const label = labels[Number(key)] || `(${idx + 1})`;
          return `${label} ${value}`;
        })
        .join("\n");

      return formatted || null;
    }

    return null;
  };

  console.log("Results page recommendedResources:", recommendedResources);

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
            const status = getQuestionStatus(i);
            const explanation = getExplanation(i);
            const answer = getAnswer(i);
            const question = questions?.[i];
            const userAnswerIndex = mcqAnswers?.[i];
            const userAnswer = question?.options?.[userAnswerIndex];
            const userAnswerDisplay = getUserAnswerDisplay(i);
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
                  {userAnswerDisplay && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 w-full">
                      <p className="text-[12px] font-semibold text-gray-700 mb-1">
                        Your Answer:
                      </p>
                      <p className="text-[12px] text-gray-600 whitespace-pre-wrap">
                        {userAnswerDisplay}
                      </p>
                    </div>
                  )}
                  {type?.toLowerCase() === "mcq" && status === false && userAnswer && (
                    <div className="text-xs text-red-600 mt-1">
                      Your: {userAnswer}
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  {status === "pending" ? (
                    <span className="inline-flex px-3 py-1 items-center justify-center whitespace-nowrap rounded-lg text-[13px] font-medium bg-gray-200 text-gray-700">
                      ⏳ Pending
                    </span>
                  ) : status ? (
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
                      {/* Check for evaluation errors */}
                      {(evaluations[i] as any).error && (
                        <div className="p-3 bg-red-50 rounded border border-red-300">
                          <p className="text-[12px] font-semibold text-red-900 mb-1">⚠️ Evaluation Error</p>
                          <p className="text-[12px] text-red-800">{(evaluations[i] as any).feedback}</p>
                        </div>
                      )}
                      
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
                            <p className="text-[12px] font-bold text-blue-900">
                              Part (a) - Score: {(evaluations[i] as any).part_a.score}/100
                            </p>
                            <p className="text-[12px] text-blue-800 mt-1">
                              {(evaluations[i] as any).part_a.feedback}
                            </p>
                          </div>

                          {/* Part (b) Evaluation */}
                          <div className="p-2 bg-green-50 rounded border border-green-200">
                            <p className="text-[12px] font-bold text-green-900">
                              Part (b) - Score: {(evaluations[i] as any).part_b.score}/100
                            </p>
                            <p className="text-[12px] text-green-800 mt-1">
                              {(evaluations[i] as any).part_b.feedback}
                            </p>
                          </div>

                          {/* Part (c) Evaluation */}
                          <div className="p-2 bg-amber-50 rounded border border-amber-200">
                            <p className="text-[12px] font-bold text-amber-900">
                              Part (c) - Score: {(evaluations[i] as any).part_c.score}/100
                            </p>
                            <p className="text-[12px] text-amber-800 mt-1">
                              {(evaluations[i] as any).part_c.feedback}
                            </p>
                          </div>

                          {/* Overall Feedback */}
                          <div className="p-2 bg-purple-50 rounded border border-purple-200">
                            <p className="text-[12px] font-semibold text-purple-900 mb-1">Overall Feedback:</p>
                            <p className="text-[12px] text-purple-800">{(evaluations[i] as any).overall_feedback}</p>
                          </div>
                        </>
                      )}

                      {/* Short/Eassy Evaluation */}
                      {type?.toLowerCase() !== "structured" && (evaluations[i] as any).score !== undefined && !(evaluations[i] as any).error && (
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
                          <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{answer}</p>
                        </div>
                      )}
                      {explanation && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-[12px] font-semibold text-blue-900 mb-1">Why:</p>
                          <p className="text-[13px] text-blue-800">{explanation}</p>
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
                      <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{answer}</p>
                    </div>
                    )}

                  {!answer &&
                    type?.toLowerCase() !== "mcq" &&
                    !evaluations[i] &&
                    !evaluatingQuestions.has(i) && (
                      <div className="mb-2 p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-[12px] font-semibold text-red-800">
                          No model answer available for this question.
                        </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 text-xs text-gray-500 border-t border-gray-100">
          Total: {totalQuestions} | Answered: {answeredCount} | Correct: {correctCount} | Pending:{" "}
          {Array.from({ length: totalQuestions }).filter((_, i) => getQuestionStatus(i) === "pending").length}
        </div>
      </div>

      {/* Recommended Resources */}
      {recommendedResources?.resources?.length ? (
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-[32px] font-bold text-[#055160] mb-2">Recommended Learning Resources</h2>
            <p className="text-[#4B5563] text-[16px]">
              Enhance your understanding of <span className="font-semibold">{recommendedResources.topic || "this topic"}</span> with these curated materials:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedResources.resources.map((resource, idx) => (
              <a
                key={`${resource.url}-${idx}`}
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
      ) : null}

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => navigate("/model-paper")}
          className="px-5 py-2 rounded-xl cursor-pointer bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
        >
          Back to Model Papers
        </button>

        <button
          onClick={() => navigate(`/model-paper/${slug}/paper`)}
          className="px-5 py-2 rounded-xl cursor-pointer bg-[#0B7285] text-white hover:opacity-95"
        >
          Review Paper Again
        </button>
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
