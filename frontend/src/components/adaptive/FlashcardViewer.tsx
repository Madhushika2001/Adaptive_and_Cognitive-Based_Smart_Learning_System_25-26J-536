import { useState } from 'react';
import { ArrowLeft, ArrowRight, Brain, RotateCw } from 'lucide-react';

interface Flashcard {
    front: string;
    back: string;
}

interface FlashcardViewerProps {
    flashcards: Flashcard[];
    theme: {
        bg: string;
        border: string;
        text: string;
        textMuted: string;
        primary: string;
        secondary: string;
        accent: string;
        gradient: string;
        shadow: string;
    };
}

export const FlashcardViewer = ({ flashcards, theme }: FlashcardViewerProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (!flashcards || flashcards.length === 0) return null;

    const currentCard = flashcards[currentIndex];

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % flashcards.length);
        }, 150);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
        }, 150);
    };

    return (
        <div className={`flex flex-col h-full ${theme.bg}`}>
            <div className="flex items-center justify-between mb-6 pb-2">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl shrink-0 shadow-sm text-white ${theme.primary}`}>
                        <Brain className="w-6 h-6" />
                    </div>
                    <h3 className={`text-xl font-bold tracking-tight ${theme.text}`}>Study Flashcards</h3>
                </div>
                <div className={`text-sm font-bold px-3 py-1 bg-white rounded-full border shadow-sm ${theme.text} ${theme.border}`}>
                    {currentIndex + 1} / {flashcards.length}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative w-full mb-6 px-2 sm:px-6">
                <div 
                    className="adaptive-card-container relative w-full max-w-sm h-64 sm:h-72 cursor-pointer"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div className={`adaptive-card-inner w-full h-full ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                        {/* Front */}
                        <div className={`adaptive-card-front absolute w-full h-full border-2 rounded-3xl flex flex-col items-center justify-center p-6 text-center shadow-md bg-white ${theme.border} hover:shadow-lg transition-shadow`}>
                            <h4 className={`text-2xl font-black leading-tight ${theme.text}`}>{currentCard.front}</h4>
                            <div className={`absolute bottom-4 flex items-center gap-2 text-xs font-bold ${theme.textMuted}`}>
                                <RotateCw className="w-3 h-3" /> Click to flip
                            </div>
                        </div>
                        
                        {/* Back */}
                        <div className={`adaptive-card-back absolute w-full h-full border rounded-3xl flex flex-col items-center justify-center p-6 shadow-xl bg-gradient-to-br ${theme.gradient}`}>
                            <div className="w-full h-full overflow-y-auto custom-scrollbar flex items-center justify-center">
                                <p className="font-semibold whitespace-pre-wrap text-[15px] leading-relaxed text-white drop-shadow-sm text-center">
                                    {currentCard.back}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center items-center gap-4 mt-auto">
                <button 
                    onClick={handlePrev}
                    className={`p-3 rounded-full bg-white border shadow-sm hover:shadow-md transition-all active:scale-95 ${theme.border} hover:${theme.bg}`}
                    aria-label="Previous card"
                >
                    <ArrowLeft className={`w-5 h-5 ${theme.accent}`} />
                </button>
                <div className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>Focus Mode</div>
                <button 
                    onClick={handleNext}
                    className={`p-3 rounded-full bg-white border shadow-sm hover:shadow-md transition-all active:scale-95 ${theme.border} hover:${theme.bg}`}
                    aria-label="Next card"
                >
                    <ArrowRight className={`w-5 h-5 ${theme.accent}`} />
                </button>
            </div>
        </div>
    );
};
