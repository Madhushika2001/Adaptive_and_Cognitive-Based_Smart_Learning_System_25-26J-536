import { useState, useEffect } from 'react';
import { predictLevel, generateSummary, generateMindmap, generateFlashcards, generateFeedback } from '../../api/adaptiveApi';
import { ReactFlow, Controls, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Brain, Star, FileText, Share2, RefreshCw } from 'lucide-react';
import * as dagre from 'dagre';

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

interface LevelData {
    predicted_level: string;
    confidence: number;
}

interface Flashcard {
    front: string;
    back: string;
}

interface MindmapElements {
    nodes: object[];
    edges: object[];
}

interface ResultsDashboardProps {
    stats: Stats;
    selection: Selection;
    onRetry: () => void;
    onTryAgain: () => void;
}

const THEMES = {
    Beginner: {
        bg: 'bg-emerald-50/70',
        sectionBg: 'bg-white',
        border: 'border-emerald-200',
        borderFaint: 'border-emerald-100/50',
        text: 'text-emerald-900',
        textMuted: 'text-emerald-700/70',
        primary: 'bg-emerald-600',
        secondary: 'bg-emerald-100',
        accent: 'text-emerald-600',
        gradient: 'from-emerald-500 to-emerald-700',
        shadow: 'shadow-emerald-200/50',
        glow: 'bg-emerald-400/20',
        prose: 'prose-emerald prose-headings:text-emerald-900 prose-b:text-emerald-800 prose-b:border-emerald-100 prose-ul:bg-emerald-50/40 prose-ul:border-emerald-100/50 prose-li:marker:text-emerald-600',
        nodeBg: 'linear-gradient(to bottom right, #ECFDF5, #D1FAE5)',
        nodeBorder: '#10B981',
        nodeText: '#064E3B',
        hex: '#10B981'
    },
    Intermediate: {
        bg: 'bg-sky-50/70',
        sectionBg: 'bg-white',
        border: 'border-sky-200',
        borderFaint: 'border-sky-100/50',
        text: 'text-sky-900',
        textMuted: 'text-sky-700/70',
        primary: 'bg-sky-600',
        secondary: 'bg-sky-100',
        accent: 'text-sky-600',
        gradient: 'from-sky-500 to-sky-700',
        shadow: 'shadow-sky-200/50',
        glow: 'bg-sky-400/20',
        prose: 'prose-sky prose-headings:text-sky-900 prose-b:text-sky-800 prose-b:border-sky-100 prose-ul:bg-sky-50/40 prose-ul:border-sky-100/50 prose-li:marker:text-sky-600',
        nodeBg: 'linear-gradient(to bottom right, #F0F9FF, #E0F2FE)',
        nodeBorder: '#0EA5E9',
        nodeText: '#0C4A6E',
        hex: '#0EA5E9'
    },
    Advanced: {
        bg: 'bg-violet-50/70',
        sectionBg: 'bg-white',
        border: 'border-violet-200',
        borderFaint: 'border-violet-100/50',
        text: 'text-violet-900',
        textMuted: 'text-violet-700/70',
        primary: 'bg-violet-600',
        secondary: 'bg-violet-100',
        accent: 'text-violet-600',
        gradient: 'from-violet-600 to-indigo-700',
        shadow: 'shadow-violet-200/50',
        glow: 'bg-violet-400/20',
        prose: 'prose-violet prose-headings:text-violet-900 prose-b:text-violet-800 prose-b:border-violet-100 prose-ul:bg-violet-50/40 prose-ul:border-violet-100/50 prose-li:marker:text-violet-600',
        nodeBg: 'linear-gradient(to bottom right, #F5F3FF, #EDE9FE)',
        nodeBorder: '#8B5CF6',
        nodeText: '#4C1D95',
        hex: '#8B5CF6'
    }
};

const ResultsDashboard = ({ stats, selection, onRetry, onTryAgain }: ResultsDashboardProps) => {
    const [levelData, setLevelData] = useState<LevelData | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [mindmapElements, setMindmapElements] = useState<MindmapElements | null>(null);
    const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const [isLevelLoading, setIsLevelLoading] = useState(true);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [isMindmapLoading, setIsMindmapLoading] = useState(false);
    const [isFlashcardsLoading, setIsFlashcardsLoading] = useState(false);
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchLevelAndData = async () => {
            setIsLevelLoading(true);
            try {
                const pLevel = await predictLevel(stats.score, stats.timeTaken, stats.attempts);
                if (signal.aborted) return;
                setLevelData(pLevel);
                setIsLevelLoading(false);

                const levelString: string = pLevel.predicted_level;

                setIsSummaryLoading(true);
                try {
                    const sumRes = await generateSummary(selection.module, selection.lecture, selection.topic, levelString, signal);
                    if (signal.aborted) return;
                    setSummary(sumRes.summary);
                } catch (e: unknown) {
                    if ((e as Error).name !== 'CanceledError') console.error('Summary error', e);
                } finally {
                    if (!signal.aborted) setIsSummaryLoading(false);
                }

                if (signal.aborted) return;
                setIsMindmapLoading(true);
                try {
                    const mmRes = await generateMindmap(selection.module, selection.lecture, selection.topic, levelString, signal);
                    if (signal.aborted) return;
                    if (mmRes.nodes && mmRes.edges) {
                        const dagreGraph = new (dagre as any).graphlib.Graph();
                        dagreGraph.setDefaultEdgeLabel(() => ({}));
                        dagreGraph.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120 });

                        mmRes.nodes.forEach((n: any) => dagreGraph.setNode(String(n.id), { width: 220, height: 75 }));
                        mmRes.edges.forEach((e: any) => dagreGraph.setEdge(String(e.source), String(e.target)));
                        (dagre as any).layout(dagreGraph);

                        const flowNodes = mmRes.nodes.map((n: any) => {
                            const nodeIdStr = String(n.id);
                            const nodeWithPosition = dagreGraph.node(nodeIdStr);
                            const xPos = nodeWithPosition ? nodeWithPosition.x - 110 : 0;
                            const yPos = nodeWithPosition ? nodeWithPosition.y - 37.5 : 0;

                            const theme = THEMES[levelString as keyof typeof THEMES] || THEMES.Intermediate;
                            let nodeStyle: React.CSSProperties = {
                                background: theme.nodeBg,
                                border: `2px solid ${theme.nodeBorder}`,
                                borderRadius: '12px',
                                padding: '10px',
                                color: theme.nodeText,
                                fontWeight: 'bold',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            };

                            return { id: nodeIdStr, targetPosition: 'left', sourcePosition: 'right', position: { x: xPos, y: yPos }, data: { label: n.label }, type: 'default', style: nodeStyle };
                        });

                        const flowEdges = mmRes.edges.map((e: any, i: number) => {
                            const theme = THEMES[levelString as keyof typeof THEMES] || THEMES.Intermediate;
                            let edgeStyle = { stroke: theme.nodeBorder, strokeWidth: 2 };
                            let isAnimated = levelString !== 'Advanced';
                            return { id: `e${i}`, source: String(e.source), target: String(e.target), animated: isAnimated, type: 'bezier', style: edgeStyle };
                        });
                        setMindmapElements({ nodes: flowNodes, edges: flowEdges });
                    }
                } catch (e: unknown) {
                    if ((e as Error).name !== 'CanceledError') console.error('Mindmap error', e);
                } finally {
                    if (!signal.aborted) setIsMindmapLoading(false);
                }

                if (signal.aborted) return;
                setIsFlashcardsLoading(true);
                try {
                    const fcRes = await generateFlashcards(selection.module, selection.lecture, selection.topic, levelString, signal);
                    if (signal.aborted) return;
                    if (Array.isArray(fcRes)) setFlashcards(fcRes);
                } catch (e: unknown) {
                    if ((e as Error).name !== 'CanceledError') console.error('Flashcards error', e);
                } finally {
                    if (!signal.aborted) setIsFlashcardsLoading(false);
                }

                if (signal.aborted) return;
                setIsFeedbackLoading(true);
                try {
                    const fbRes = await generateFeedback(selection.module, selection.lecture, selection.topic, stats.quizResults, signal);
                    if (signal.aborted) return;
                    setFeedback(fbRes.feedback);
                } catch (e: unknown) {
                    if ((e as Error).name !== 'CanceledError') console.error('Feedback error', e);
                } finally {
                    if (!signal.aborted) setIsFeedbackLoading(false);
                }

            } catch (err: unknown) {
                if ((err as Error).name !== 'CanceledError') {
                    console.error('Failed fetching results data', err);
                    if (!signal.aborted) setIsLevelLoading(false);
                }
            }
        };

        fetchLevelAndData();
        return () => controller.abort();
    }, [stats, selection]);

    if (isLevelLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xl w-full max-w-4xl min-h-[500px]">
                <Brain className="w-16 h-16 text-indigo-500 animate-pulse mb-6" />
                <h3 className="text-2xl font-bold text-slate-800">Analyzing Your Performance...</h3>
                <p className="text-slate-500 mt-2 text-center max-w-md">
                    We are predicting your proficiency level. This takes a moment.
                </p>
            </div>
        );
    }

    const theme = THEMES[levelData?.predicted_level as keyof typeof THEMES] || THEMES.Intermediate;

    return (
        <div className={`backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border w-full max-w-[1400px] relative overflow-hidden flex flex-col gap-8 ${theme.bg} ${theme.borderFaint}`}>
            {/* Decorative background glow synced with theme */}
            <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl pointer-events-none ${theme.glow}`}></div>
            <div className={`absolute -bottom-32 -left-32 w-64 h-64 rounded-full blur-3xl pointer-events-none ${theme.glow}`}></div>

            <div className="relative z-10 flex flex-col gap-8">
                <div className={`flex justify-between items-center px-6 py-4 rounded-2xl border shadow-sm backdrop-blur-sm ${theme.bg} ${theme.border}`}>
                    <span className={`font-semibold tracking-wide text-sm md:text-base ${theme.text}`}>
                        Module: <span className="font-bold">{selection.module}</span> | Topic: <span className="font-bold">{selection.topic}</span>
                    </span>
                    <span className={`text-white px-4 py-1.5 rounded-xl text-sm font-bold shadow-md bg-gradient-to-r ${theme.gradient} ${theme.shadow}`}>
                        Attempt #{stats.attempts}
                    </span>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-stretch">
                    <div className={`flex-1 p-6 rounded-3xl border flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden bg-gradient-to-br ${theme.bg} ${theme.border}`}>
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <p className={`font-bold tracking-widest uppercase text-sm mb-3 ${theme.textMuted}`}>Quiz Score</p>
                            <div className={`text-7xl font-bold mb-3 drop-shadow-sm tracking-tight ${theme.text}`}>
                                {stats.score}<span className="text-4xl opacity-50 font-semibold">/5</span>
                            </div>
                            {stats.score < 5 && (
                                <button
                                    onClick={onRetry}
                                    className={`mt-2 flex items-center gap-2 text-sm bg-white/90 backdrop-blur px-5 py-2.5 rounded-full font-bold transition-all border shadow-sm ${theme.accent} ${theme.border} hover:${theme.primary} hover:text-white`}
                                >
                                    <RefreshCw className="w-4 h-4" /> Try Again
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={`flex-[2] p-8 rounded-3xl border shadow-sm flex flex-col justify-center relative overflow-hidden bg-white ${theme.border}`}>
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <Star className={`w-32 h-32 ${theme.accent}`} />
                        </div>
                        <div className="flex items-center gap-4 mb-3 relative z-10">
                            <div className={`p-3 rounded-2xl shadow-sm border ${theme.secondary} ${theme.border}`}>
                                <Star className={`w-8 h-8 fill-current ${theme.accent}`} />
                            </div>
                            <h2 className={`text-3xl font-bold tracking-tight ${theme.text}`}>
                                You are <span className={`bg-clip-text text-transparent capitalize bg-gradient-to-r ${theme.gradient}`}>
                                    {levelData?.predicted_level || 'assessed'}
                                </span>
                            </h2>
                        </div>
                        <p className="text-slate-600 text-lg leading-relaxed relative z-10 font-medium">
                            Based on your score, time taken ({stats.timeTaken}s), and attempts ({stats.attempts}), our AI model predicts your knowledge level to personalize your learning materials.
                        </p>
                    </div>
                </div>

                {/* AI Summary */}
                <div className={`backdrop-blur-sm p-8 rounded-3xl min-h-[150px] shadow-inner relative border ${theme.bg} ${theme.border}`}>
                    <div className={`flex items-center gap-3 mb-6 border-b pb-4 ${theme.border}`}>
                        <div className={`p-2 rounded-xl shadow-sm text-white ${theme.primary}`}>
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className={`text-2xl font-bold tracking-tight ${theme.text}`}>
                            Personalized Summary
                        </h3>
                    </div>
                    {isSummaryLoading ? (
                        <div className="animate-pulse space-y-4 py-2">
                            <div className={`h-4 rounded-full w-3/4 ${theme.secondary}`}></div>
                            <div className={`h-4 rounded-full w-full ${theme.secondary}`}></div>
                            <div className={`h-4 rounded-full w-5/6 ${theme.secondary}`}></div>
                        </div>
                    ) : summary ? (
                        <div
                            className={`prose max-w-none text-slate-700 ${theme.prose}`}
                            dangerouslySetInnerHTML={{ __html: summary }}
                        />
                    ) : (
                        <p className={`font-medium bg-white px-4 py-2 rounded-lg inline-block border ${theme.textMuted} ${theme.border}`}>Failed to load summary.</p>
                    )}
                </div>

                {/* Grip Strength / Knowledge Gap Feedback */}
                <div className={`backdrop-blur-sm p-8 rounded-3xl min-h-[150px] shadow-inner relative border ${theme.bg} ${theme.border}`}>
                    <div className={`flex items-center gap-3 mb-6 border-b pb-4 ${theme.border}`}>
                        <div className={`p-2 rounded-xl shadow-sm text-white ${theme.primary}`}>
                            <Brain className="w-6 h-6" />
                        </div>
                        <h3 className={`text-2xl font-bold tracking-tight ${theme.text}`}>Grip Strength & Knowledge Gap Report</h3>
                    </div>
                    {isFeedbackLoading ? (
                        <div className="animate-pulse flex flex-col items-center justify-center space-y-4 py-4">
                            <Brain className={`w-8 h-8 animate-pulse ${theme.accent}`} />
                            <span className={`font-medium ${theme.accent}`}>Generating Personalized Gap Analysis...</span>
                        </div>
                    ) : feedback ? (
                        <div className={`${theme.sectionBg} p-6 md:p-8 rounded-2xl shadow-sm border ${theme.border}`}>
                            <div
                                className={`text-slate-700 w-full prose prose-slate max-w-none prose-p:leading-relaxed ${theme.prose}`}
                                dangerouslySetInnerHTML={{ __html: feedback }}
                            />
                        </div>
                    ) : (
                        <p className="text-slate-500 font-medium bg-white px-4 py-2 rounded-lg inline-block border border-slate-100">Failed to load feedback analysis.</p>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Mindmap */}
                    <div className={`border shadow-sm rounded-3xl overflow-hidden flex flex-col h-[500px] bg-white ${theme.border}`}>
                        <div className={`backdrop-blur p-5 border-b flex items-center gap-3 ${theme.bg} ${theme.border}`}>
                            <div className={`p-2 rounded-xl shadow-sm text-white ${theme.primary}`}>
                                <Share2 className="w-5 h-5" />
                            </div>
                            <h3 className={`text-xl font-bold ${theme.text}`}>Concept Map</h3>
                        </div>
                        <div className={`flex-1 relative ${theme.bg}`}>
                            {isMindmapLoading && !mindmapElements && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10 space-y-4">
                                    <div className={`p-4 bg-white rounded-2xl shadow-sm border ${theme.border}`}>
                                        <Brain className={`w-8 h-8 animate-pulse ${theme.accent}`} />
                                    </div>
                                    <span className={`font-bold tracking-wide uppercase text-sm ${theme.textMuted}`}>Generating Concept Map...</span>
                                </div>
                            )}
                            {mindmapElements ? (
                                <ReactFlow
                                    nodes={mindmapElements.nodes as any}
                                    edges={mindmapElements.edges as any}
                                    fitView
                                    minZoom={0.05}
                                    maxZoom={4}
                                    fitViewOptions={{ padding: 0.2 }}
                                    style={{ width: '100%', height: '100%' }}
                                >
                                    <Background color={theme.hex} gap={16} size={1} />
                                    <Controls className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden" />
                                </ReactFlow>
                            ) : !isMindmapLoading ? (
                                <div className="h-full flex items-center justify-center text-slate-400 font-medium">Failed to render mindmap.</div>
                            ) : null}
                        </div>
                    </div>

                    {/* Flashcards */}
                    <div className={`flex flex-col backdrop-blur-sm p-6 rounded-3xl border shadow-inner h-[500px] ${theme.bg} ${theme.border}`}>
                        <div className="flex items-center gap-3 mb-6 pb-2">
                            <div className={`p-2 rounded-xl shrink-0 shadow-sm text-white ${theme.primary}`}>
                                <Brain className="w-6 h-6" />
                            </div>
                            <h3 className={`text-xl font-bold tracking-tight ${theme.text}`}>Study Flashcards</h3>
                        </div>

                        <div className="grid gap-4 overflow-y-auto pr-3 custom-scrollbar flex-1 pb-4">
                            {isFlashcardsLoading && !flashcards && (
                                <div className="h-[150px] w-full bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm flex items-center justify-center">
                                    <span className={`font-bold tracking-wide uppercase text-sm ${theme.textMuted}`}>Generating Flashcards...</span>
                                </div>
                            )}
                            {flashcards?.map((card, idx) => {
                                let frontStyles = `bg-white ${theme.border} ${theme.text} shadow-sm hover:shadow-md transition-shadow`;
                                let backStyles = `bg-gradient-to-br ${theme.gradient} text-white shadow-lg ${theme.shadow}`;

                                return (
                                    <div key={idx} className="adaptive-card-container h-[160px] w-full cursor-pointer group">
                                        <div className="adaptive-card-inner relative w-full h-full transition-transform duration-500 group-hover:-translate-y-1">
                                            <div className={`adaptive-card-front absolute w-full h-full border rounded-2xl flex items-center justify-center p-4 text-center ${frontStyles}`}>
                                                <h4 className="text-base font-bold leading-tight">{card.front}</h4>
                                            </div>
                                            <div className={`adaptive-card-back absolute w-full h-full border rounded-2xl flex flex-col items-center justify-center p-4 ${backStyles}`}>
                                                <div className="w-full h-full overflow-y-auto custom-scrollbar flex items-center justify-center">
                                                    <p className="font-medium whitespace-pre-wrap text-sm leading-snug w-full drop-shadow-sm text-center">
                                                        {card.back}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className={`flex justify-end gap-4 pt-8 border-t mt-2 ${theme.border}`}>
                    <button
                        onClick={onTryAgain}
                        className={`bg-white border px-8 py-3.5 rounded-2xl font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${theme.text} ${theme.border} hover:${theme.bg}`}
                    >
                        Try Again
                    </button>
                    <button
                        onClick={onRetry}
                        className={`text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 bg-gradient-to-r ${theme.gradient} ${theme.shadow}`}
                    >
                        Choose Another Topic
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultsDashboard;
