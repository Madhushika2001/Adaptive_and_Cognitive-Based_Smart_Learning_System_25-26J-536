import { useState, useEffect, useRef } from 'react';
import { generateMcq } from '../../api/adaptiveApi';
import VoiceRecorder from './VoiceRecorder';
import { BrainCircuit, CheckCircle, XCircle, Volume2, Clock } from 'lucide-react';

interface Selection {
    module: string;
    lecture: string;
    topic: string;
}

interface QuizResult {
    score: number;
    timeTaken: number;
    quizResults: any[];
}

interface MCQOption {
    [key: string]: string;
}

interface MCQ {
    question: string;
    options: MCQOption;
    correct_answer: string;
}

interface VoiceResultPayload {
    transcription?: string;
    is_correct?: boolean;
    error?: boolean;
    message?: string;
}

interface QuizViewProps {
    selection: Selection;
    onComplete: (result: QuizResult) => void;
}

const QuizView = ({ selection, onComplete }: QuizViewProps) => {
    const [mcqs, setMcqs] = useState<MCQ[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [voiceFeedback, setVoiceFeedback] = useState<{ text: string; correct: boolean } | null>(null);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [quizRecords, setQuizRecords] = useState<any[]>([]);
    const hasFetched = useRef(false);

    // Timer
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (startTime && mcqs.length > 0 && currentIndex < mcqs.length) {
            interval = setInterval(() => {
                setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [startTime, mcqs.length, currentIndex]);

    useEffect(() => {
        if (hasFetched.current) return;
        const fetchQuiz = async () => {
            hasFetched.current = true;
            setIsLoading(true);
            try {
                const data = await generateMcq(selection.module, selection.lecture, selection.topic);
                if (data.mcqs && data.mcqs.length > 0) {
                    setMcqs(data.mcqs);
                    setStartTime(Date.now());
                } else {
                    setError('No questions generated. Please try another topic.');
                }
            } catch (err) {
                setError('Failed to generate quiz. Is the backend running?');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuiz();
    }, [selection]);

    const playAudio = () => {
        const currentQuestion = mcqs[currentIndex];
        if (currentQuestion?.question) {
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(currentQuestion.question);
            window.speechSynthesis.speak(msg);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xl border border-slate-100 min-h-[400px]">
                <BrainCircuit className="w-16 h-16 text-blue-500 animate-pulse mb-4" />
                <h3 className="text-xl font-bold text-slate-700">AI is crafting your quiz...</h3>
                <p className="text-slate-500 mt-2 text-sm text-center">
                    Reading lecture content and <br /> generating personalized questions.
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200">
                {error}
            </div>
        );
    }

    if (mcqs.length === 0) return null;

    const question = mcqs[currentIndex];
    if (!question || !question.options) return <div>Malformed Question Error</div>;

    const handleAnswerSubmit = (givenAnswerKey: string) => {
        setSelectedAnswer(givenAnswerKey);
        const isCorrect = givenAnswerKey === question.correct_answer;
        if (isCorrect) setScore((s) => s + 1);

        const newRecord = {
            question: question.question,
            user_answer: question.options[givenAnswerKey] || "No Answer",
            correct_answer: question.options[question.correct_answer] || question.correct_answer,
            is_correct: isCorrect
        };
        const updatedRecords = [...quizRecords, newRecord];
        setQuizRecords(updatedRecords);

        setTimeout(() => {
            if (currentIndex + 1 < mcqs.length) {
                setCurrentIndex(currentIndex + 1);
                setSelectedAnswer(null);
                setVoiceFeedback(null);
            } else {
                const timeTaken = Math.round((Date.now() - (startTime ?? Date.now())) / 1000);
                onComplete({ score: score + (isCorrect ? 1 : 0), timeTaken, quizResults: updatedRecords });
            }
        }, 1500);
    };

    const handleVoiceResult = (result: VoiceResultPayload) => {
        // 1. Handle actual errors (network, backend crash, etc)
        if (result.error) {
            setVoiceFeedback({ text: 'Audio processing failed. Please try again or click an answer.', correct: false });
            return;
        }

        // 2. Handle empty results (silent recording)
        if (!result.transcription || result.transcription.trim() === "") {
            setVoiceFeedback({ text: "I didn't catch that. Please speak more clearly!", correct: false });
            const msg = new SpeechSynthesisUtterance("I didn't catch that. Please try again.");
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(msg);
            return; // EXIT EARLY - DON'T CONTINUE
        }

        const isCorrect = !!result.is_correct;

        // 3. If correct, proceed as normal
        if (isCorrect) {
            setVoiceFeedback({ text: `You said: "${result.transcription}"`, correct: true });
            const msg = new SpeechSynthesisUtterance('Answer is correct');
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(msg);
            handleAnswerSubmit(question.correct_answer);
            return;
        }

        // 4. If not correct, try to see if they said another valid option
        let spokenOptionKey: string | null = null;
        const tClean = result.transcription.toLowerCase().replace(/[^\w\s]/gi, '');
        const words = tClean.split(/\s+/);

        for (const [k, v] of Object.entries(question.options)) {
            const kLower = k.toLowerCase();
            const vClean = v.toLowerCase().replace(/[^\w\s]/gi, '');
            // Check for key (A, B, C), for "option A", or for the full option text
            if (words.includes(kLower) || tClean.includes(`option ${kLower}`) || (vClean && tClean.includes(vClean))) {
                spokenOptionKey = k;
                break;
            }
        }

        // 5. If they said another option (wrong one), submit that
        if (spokenOptionKey) {
            setVoiceFeedback({ text: `You said: "${result.transcription}"`, correct: false });
            const msg = new SpeechSynthesisUtterance('Answer is wrong');
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(msg);
            handleAnswerSubmit(spokenOptionKey);
        } else {
            // 6. If they said SOMETHING but it doesn't match ANY option, tell them to try again
            setVoiceFeedback({ text: `I heard: "${result.transcription}", but it doesn't match any option.`, correct: false });
            const msg = new SpeechSynthesisUtterance("I couldn't match your answer to an option. Please try again.");
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(msg);
            // DON'T SUBMIT - STAY ON QUESTION
        }
    };

    const expectedAnswerText = question?.options ? question.options[question.correct_answer] : '';

    return (
        <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 w-full max-w-2xl relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/50">
                        Question {currentIndex + 1} of {mcqs.length}
                    </span>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-100/80 backdrop-blur-sm text-slate-600 px-4 py-1.5 rounded-xl text-sm font-bold border border-slate-200/50 shadow-sm">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span className="tabular-nums">
                                {Math.floor(timeElapsed / 60).toString().padStart(2, '0')}:
                                {(timeElapsed % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                        <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-1.5 rounded-xl text-sm font-bold shadow-sm border border-blue-200/50">
                            Score: {score}
                        </span>
                    </div>
                </div>

                <div className="flex items-start justify-between gap-6 mb-10">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 leading-tight tracking-tight">{question.question}</h2>
                    <button
                        onClick={playAudio}
                        className="p-3 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-600 rounded-2xl hover:shadow-md transition-all shrink-0 border border-indigo-100 group"
                        title="Read Question Aloud"
                    >
                        <Volume2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                </div>

                <div className="space-y-4">
                    {Object.entries(question.options).map(([key, value]) => {
                        let bgClass = 'bg-white hover:bg-blue-50/50 border-slate-200 text-slate-700 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5';
                        let icon = null;
                        let letterBoxClass = 'bg-slate-100 border-slate-200 text-slate-500';

                        if (selectedAnswer) {
                            if (key === question.correct_answer) {
                                bgClass = 'bg-emerald-50/80 border-emerald-400 text-emerald-900 shadow-[0_4px_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400 scale-[1.02] z-10';
                                icon = <CheckCircle className="text-emerald-500 w-6 h-6 ml-auto drop-shadow-sm" />;
                                letterBoxClass = 'bg-emerald-500 border-emerald-600 text-white shadow-inner';
                            } else if (key === selectedAnswer) {
                                bgClass = 'bg-red-50/80 border-red-300 text-red-900 shadow-sm';
                                icon = <XCircle className="text-red-400 w-6 h-6 ml-auto" />;
                                letterBoxClass = 'bg-red-400 border-red-500 text-white shadow-inner';
                            } else {
                                bgClass = 'bg-white border-slate-100 text-slate-400 opacity-60 scale-95';
                            }
                        }

                        return (
                            <button
                                key={key}
                                disabled={selectedAnswer !== null}
                                onClick={() => handleAnswerSubmit(key)}
                                className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 flex items-center font-medium ${bgClass} relative overflow-hidden`}
                            >
                                <span className={`inline-flex w-10 h-10 items-center justify-center rounded-xl shadow-sm border mr-5 font-bold text-lg transition-colors ${letterBoxClass}`}>
                                    {key}
                                </span>
                                <span className="text-lg">{value}</span>
                                {icon}
                            </button>
                        );
                    })}
                </div>

                {voiceFeedback && (
                    <div className={`mt-6 p-5 rounded-2xl text-sm text-center font-semibold shadow-inner border animate-in fade-in slide-in-from-bottom-2 ${voiceFeedback.correct
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        <div className="text-base mb-1">{voiceFeedback.text}</div>
                        <div className="opacity-80 text-xs uppercase tracking-wider">
                            {voiceFeedback.correct ? '✅ AI verified your answer' : '❌ Answer not recognized correctly'}
                        </div>
                    </div>
                )}

                {!selectedAnswer && (
                    <div className="mt-10 pt-8 border-t border-slate-200/60 relative">
                        <div className="absolute -top-3 inset-x-0 flex justify-center">
                            <span className="bg-white/80 backdrop-blur-md px-4 text-xs font-bold text-slate-400 uppercase tracking-widest border border-slate-200/60 rounded-full">
                                Or answer with voice
                            </span>
                        </div>
                        <VoiceRecorder
                            expectedAnswer={expectedAnswerText}
                            correctOptionKey={question.correct_answer}
                            onResult={handleVoiceResult}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizView;
