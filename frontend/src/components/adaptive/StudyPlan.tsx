import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, BookOpen, Brain, PenTool, LayoutGrid, CheckSquare, Square, Trophy, Sparkles } from 'lucide-react';

interface StudyTask {
    description: string;
    duration: string;
    type: 'read' | 'practice' | 'review' | 'quiz' | string;
}

interface StudyDay {
    day: number;
    title: string;
    tasks: StudyTask[];
}

interface StudyPlanProps {
    plan: StudyDay[];
    overview: string;
    theme: {
        bg: string;
        border: string;
        text: string;
        textMuted: string;
        primary: string;
        secondary: string;
        accent: string;
    };
    planId?: string; // used for identifying local completion state
}

const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
        case 'read': return <BookOpen className="w-4 h-4" />;
        case 'practice': return <PenTool className="w-4 h-4" />;
        case 'review': return <LayoutGrid className="w-4 h-4" />;
        case 'quiz': return <Brain className="w-4 h-4" />;
        default: return <CheckCircle2 className="w-4 h-4" />;
    }
};

export const StudyPlan = ({ plan, overview, theme, planId = 'unknown' }: StudyPlanProps) => {
    // Array of string keys representing completed tasks, e.g., "day1-task0", "day2-task1"
    const [completedTasks, setCompletedTasks] = useState<string[]>([]);

    useEffect(() => {
        // Load initial state
        const saved = localStorage.getItem(`study_plan_progress_${planId}`);
        if (saved) {
            try {
                setCompletedTasks(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved progress");
            }
        }
    }, [planId]);

    const toggleTask = (taskId: string) => {
        const newCompleted = completedTasks.includes(taskId)
            ? completedTasks.filter((id) => id !== taskId)
            : [...completedTasks, taskId];
        
        setCompletedTasks(newCompleted);
        localStorage.setItem(`study_plan_progress_${planId}`, JSON.stringify(newCompleted));
    };

    // Calculate total progress
    const totalTasks = plan.reduce((acc, day) => acc + day.tasks.length, 0);
    const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks.length / totalTasks) * 100);

    return (
        <div className={`p-6 md:p-8 rounded-3xl border shadow-sm bg-white ${theme.border}`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div>
                    <h3 className={`text-2xl font-bold tracking-tight mb-3 ${theme.text}`}>Your Personalized Study Plan</h3>
                    <p className={`text-base font-medium p-4 rounded-xl border bg-slate-50/50 backdrop-blur-sm ${theme.border} text-slate-700 max-w-2xl`}>
                        {overview}
                    </p>
                </div>
                
                {/* Progress Widget / Mastered Badge */}
                {progressPercentage === 100 && totalTasks > 0 ? (
                    <div className={`shrink-0 flex flex-col items-center justify-center p-6 rounded-2xl border bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-300 shadow-md min-w-[200px] relative overflow-hidden animate-in fade-in zoom-in-95 duration-500`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 blur-2xl rounded-full translate-x-10 -translate-y-10"></div>
                        <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 mb-3 shadow-[0_5px_15px_rgba(251,191,36,0.4)] transform hover:scale-110 transition-transform">
                            <Trophy className="w-8 h-8 text-white drop-shadow" />
                            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 animate-pulse" />
                            <Sparkles className="absolute -bottom-1 -left-2 w-4 h-4 text-amber-500 animate-pulse delay-300" />
                        </div>
                        <h4 className="text-xl font-black text-amber-600 tracking-tight text-center drop-shadow-sm mb-1">Module Mastered!</h4>
                        <p className="text-xs font-bold text-amber-700/70 uppercase tracking-widest text-center mt-1">100% Completed</p>
                    </div>
                ) : (
                    <div className={`shrink-0 flex flex-col items-center justify-center p-5 rounded-2xl border shadow-sm bg-slate-50 ${theme.border} min-w-[200px]`}>
                        <p className={`text-sm font-bold tracking-widest uppercase mb-3 text-slate-500`}>Progress</p>
                        <div className="relative w-20 h-20 flex items-center justify-center mb-3">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="40" cy="40" r="36" fill="transparent" stroke="#E2E8F0" strokeWidth="8" />
                                <circle 
                                    cx="40" 
                                    cy="40" 
                                    r="36" 
                                    fill="transparent" 
                                    stroke="currentColor" 
                                    strokeWidth="8" 
                                    strokeDasharray={226} 
                                    strokeDashoffset={226 - (226 * progressPercentage) / 100}
                                    className={`transition-all duration-1000 ease-out ${theme.accent}`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className={`absolute text-xl font-bold ${theme.text}`}>{progressPercentage}%</span>
                        </div>
                        <p className="text-sm font-medium text-slate-600">{completedTasks.length} of {totalTasks} tasks completed</p>
                    </div>
                )}
            </div>
            
            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200/60 pb-4 space-y-10">
                {plan.map((day, d_idx) => {
                    const allDayTasksCompleted = day.tasks.every((_, t_idx) => completedTasks.includes(`day${d_idx}-task${t_idx}`));

                    return (
                        <div key={d_idx} className="relative group">
                            {/* Timeline dot */}
                            <div className={`absolute -left-[35px] sm:-left-[43px] w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ${allDayTasksCompleted ? 'bg-emerald-500 border-emerald-100 scale-110' : theme.primary} group-hover:scale-110`}>
                                {allDayTasksCompleted ? <CheckCircle2 className="w-4 h-4" /> : day.day}
                            </div>
                            
                            <div className={`bg-white rounded-2xl p-5 border shadow-sm transition-shadow ${theme.border} ${allDayTasksCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'hover:shadow-md'}`}>
                                <h4 className={`text-lg font-bold mb-4 ${allDayTasksCompleted ? 'text-emerald-800' : theme.text}`}>Day {day.day}: {day.title}</h4>
                                <div className="space-y-3">
                                    {day.tasks.map((task, t_idx) => {
                                        const taskId = `day${d_idx}-task${t_idx}`;
                                        const isCompleted = completedTasks.includes(taskId);

                                        return (
                                            <div 
                                                key={t_idx} 
                                                onClick={() => toggleTask(taskId)}
                                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none
                                                    ${isCompleted 
                                                        ? 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100 scale-[0.99]' 
                                                        : `hover:-translate-y-[1px] hover:shadow-sm ${theme.secondary} ${theme.border}`
                                                    }`}
                                            >
                                                <div className="mt-0.5 shrink-0 transition-transform active:scale-90">
                                                    {isCompleted ? (
                                                        <CheckSquare className="w-6 h-6 text-emerald-500 fill-emerald-50" />
                                                    ) : (
                                                        <Square className={`w-6 h-6 ${theme.textMuted}`} />
                                                    )}
                                                </div>

                                                <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 bg-white shadow-sm transition-colors ${isCompleted ? 'text-slate-400' : theme.accent}`}>
                                                    {getIconForType(task.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-medium transition-all ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                                                        {task.description}
                                                    </p>
                                                </div>
                                                <div className={`flex items-center gap-1.5 shrink-0 px-2 py-1 bg-white rounded-md border shadow-sm text-xs font-bold transition-all ${isCompleted ? 'border-slate-200 text-slate-400' : `${theme.text} ${theme.border}`}`}>
                                                    <Clock className="w-3 h-3" />
                                                    <span>{task.duration}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
