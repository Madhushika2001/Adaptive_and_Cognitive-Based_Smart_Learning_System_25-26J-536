import { useState } from 'react';
import TopicSelector from '../components/adaptive/TopicSelector';
import QuizView from '../components/adaptive/QuizView';
import ResultsDashboard from '../components/adaptive/ResultsDashboard';

type AppView = 'selector' | 'quiz' | 'results';

interface Selection {
    module: string;
    lecture: string;
    topic: string;
}

interface Stats {
    score: number;
    timeTaken: number;
    attempts: number;
    quizResults: any[];
}

export default function AdaptiveRevisionPage() {
    const [view, setView] = useState<AppView>('selector');
    const [selection, setSelection] = useState<Selection | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [attempts, setAttempts] = useState(1);

    const handleTopicSelected = (sel: Selection) => {
        setSelection(sel);
        setView('quiz');
    };

    const handleQuizComplete = (result: { score: number; timeTaken: number; quizResults: any[] }) => {
        setStats({ ...result, attempts });
        setView('results');
    };

    // "Choose Another Topic" — resets everything
    const handleRetry = () => {
        setAttempts(1);
        setView('selector');
    };

    // "Try Again" — same topic, new quiz attempt, increments attempt counter
    const handleTryAgain = () => {
        setAttempts((a) => a + 1);
        setView('quiz');
    };

    return (
        <div className="min-h-screen bg-[#F2F8F5] flex flex-col items-center justify-center p-2 sm:p-4 gap-4">
            <div className={`w-full transition-all duration-500 ${view === 'results' ? 'max-w-full xl:max-w-[1800px]' : 'max-w-5xl'}`}>
                {view === 'selector' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="text-center mb-6">
                            <h1 className="text-4xl font-bold text-[#087990] mb-3 drop-shadow-sm tracking-tight">
                                🧠 Adaptive Revision
                            </h1>
                            <p className="text-[#087990]/80 text-lg max-w-lg mx-auto leading-relaxed">
                                Select a topic and let AI assess and personalise your learning materials.
                            </p>
                        </div>
                        <TopicSelector onTopicSelected={handleTopicSelected} />
                    </div>
                )}

                {view === 'quiz' && selection && (
                    <div className="flex flex-col items-center">
                        <QuizView selection={selection} onComplete={handleQuizComplete} />
                    </div>
                )}

                {view === 'results' && stats && selection && (
                    <ResultsDashboard
                        stats={stats}
                        selection={selection}
                        onRetry={handleRetry}
                        onTryAgain={handleTryAgain}
                    />
                )}
            </div>
        </div>
    );
}
