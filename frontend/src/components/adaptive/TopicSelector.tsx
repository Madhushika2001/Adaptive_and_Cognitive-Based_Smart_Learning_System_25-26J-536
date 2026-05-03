import { useState, useEffect } from 'react';
import { getModules, getLectures, getTopics } from '../../api/adaptiveApi';
import { Database, Cloud, Brain, ChevronRight, ChevronLeft, BookOpen, Layers, Target, CheckCircle2, Compass } from 'lucide-react';

interface TopicSelection {
    module: string;
    lecture: string;
    topic: string;
}

interface TopicSelectorProps {
    onTopicSelected: (selection: TopicSelection) => void;
}

const MODULE_ICONS: { [key: string]: any } = {
    "Cloud Computing": <Cloud className="w-8 h-8" />,
    "CloudComputing": <Cloud className="w-8 h-8" />,
    "Database Administration": <Database className="w-8 h-8" />,
    "DatabaseAdministration": <Database className="w-8 h-8" />,
    "Deep Learning": <Brain className="w-8 h-8" />,
    "DeepLearning": <Brain className="w-8 h-8" />,
    "Intelligent Multi-agent Systems": <Target className="w-8 h-8" />,
    "IntelligentMulti-AgentSystems": <Target className="w-8 h-8" />,
    "default": <Layers className="w-8 h-8" />
};

const TopicSelector = ({ onTopicSelected }: TopicSelectorProps) => {
    const [step, setStep] = useState(1);
    const [modules, setModules] = useState<string[]>([]);
    const [selectedModule, setSelectedModule] = useState('');

    const [lectures, setLectures] = useState<string[]>([]);
    const [selectedLecture, setSelectedLecture] = useState('');

    const [topics, setTopics] = useState<string[]>([]);
    const [selectedTopic, setSelectedTopic] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchModules = async () => {
            setIsLoading(true);
            try {
                const data = await getModules();
                setModules(data.modules || []);
            } catch (err) {
                console.error('Failed to fetch modules', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchModules();
    }, []);

    const handleModuleSelect = async (mod: string) => {
        setSelectedModule(mod);
        setIsLoading(true);
        try {
            const data = await getLectures(mod);
            setLectures(data.lectures || []);
            setSelectedLecture('');
            setTopics([]);
            setSelectedTopic('');
            setStep(2);
        } catch (err) {
            console.error('Failed to fetch lectures', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLectureSelect = async (lec: string) => {
        setSelectedLecture(lec);
        setIsLoading(true);
        try {
            const data = await getTopics(selectedModule, lec);
            setTopics(data.topics || []);
            setSelectedTopic('');
            setStep(3);
        } catch (err) {
            console.error('Failed to fetch topics', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStart = () => {
        if (selectedModule && selectedLecture && selectedTopic) {
            onTopicSelected({ module: selectedModule, lecture: selectedLecture, topic: selectedTopic });
        }
    };

    const steps = [
        { id: 1, label: 'Module', icon: <Layers className="w-4 h-4" /> },
        { id: 2, label: 'Lecture', icon: <BookOpen className="w-4 h-4" /> },
        { id: 3, label: 'Topic', icon: <Target className="w-4 h-4" /> }
    ];

    return (
        <div className="w-full max-w-4xl">
            {/* Progress Stepper */}
            <div className="flex items-center justify-between mb-8 px-4">
                {steps.map((s, idx) => (
                    <div key={s.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${step >= s.id ? 'bg-[#087990] border-[#087990] text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>
                                {step > s.id ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${step >= s.id ? 'text-[#087990]' : 'text-slate-400'}`}>
                                {s.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`h-0.5 mx-4 flex-1 transition-all duration-500 ${step > s.id ? 'bg-[#087990]' : 'bg-slate-200'}`}></div>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden flex flex-col min-h-[500px]">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Compass className="w-64 h-64 text-[#087990]" />
                </div>

                {/* Step Content */}
                <div className="relative z-10 flex-1 flex flex-col">
                    {/* Header / Breadcrumbs */}
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-6 overflow-x-auto whitespace-nowrap pb-2 custom-scrollbar">
                        <button onClick={() => setStep(1)} className={`hover:text-[#087990] transition-colors ${step === 1 ? 'text-[#087990] font-bold' : ''}`}>Modules</button>
                        {step >= 2 && (
                            <>
                                <ChevronRight className="w-4 h-4 shrink-0" />
                                <button onClick={() => setStep(2)} className={`hover:text-[#087990] transition-colors ${step === 2 ? 'text-[#087990] font-bold' : ''}`}>{selectedModule}</button>
                            </>
                        )}
                        {step >= 3 && (
                            <>
                                <ChevronRight className="w-4 h-4 shrink-0" />
                                <span className="text-[#087990] font-bold">{selectedLecture}</span>
                            </>
                        )}
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                            {step === 1 && "Pick your Module"}
                            {step === 2 && "Choose a Lecture"}
                            {step === 3 && "Master a Topic"}
                        </h2>
                        <p className="text-slate-500 font-medium">
                            {step === 1 && "Select the core course you want to explore today."}
                            {step === 2 && `Browsing materials for ${selectedModule}.`}
                            {step === 3 && "Select a specific area to generate your revision tools."}
                        </p>
                    </div>

                    <div className="flex-1">
                        {isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center py-20 animate-pulse">
                                <div className="w-16 h-16 border-4 border-[#087990]/20 border-t-[#087990] rounded-full animate-spin mb-4"></div>
                                <span className="text-[#087990] font-bold tracking-widest uppercase text-sm">Loading Content...</span>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Step 1: Module Cards */}
                                {step === 1 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                                        {modules.map((mod, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleModuleSelect(mod)}
                                                className="group relative flex flex-col p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-[#087990] hover:bg-white hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
                                            >
                                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#087990]/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                                                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-[#087990] mb-4 group-hover:bg-[#087990] group-hover:text-white transition-colors duration-300">
                                                    {MODULE_ICONS[mod] || MODULE_ICONS.default}
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-800 group-hover:text-[#087990] transition-colors mb-2">{mod}</h3>
                                                <p className="text-slate-500 text-sm font-medium leading-relaxed">Master the foundational and advanced concepts of this module with AI. </p>
                                                <div className="mt-4 flex items-center gap-2 text-[#087990] font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Browse Lectures <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Step 2: Lectures List */}
                                {step === 2 && (
                                    <div className="space-y-3">
                                        {lectures.map((lec, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleLectureSelect(lec)}
                                                className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#087990] hover:bg-white transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#087990] transition-colors">
                                                        <FileCode2 className="w-5 h-5" />
                                                    </div>
                                                    <span className="font-bold text-slate-700 group-hover:text-slate-900">{lec}</span>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#087990] transform group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Step 3: Topics List */}
                                {step === 3 && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {topics.map((topic, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedTopic(topic)}
                                                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${selectedTopic === topic ? 'bg-[#087990] border-[#087990] text-white shadow-lg ring-4 ring-[#087990]/10' : 'bg-slate-50 border-slate-100 hover:border-[#087990] hover:bg-white text-slate-700'}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedTopic === topic ? 'bg-white/20' : 'bg-white shadow-sm border border-slate-100'}`}>
                                                        {selectedTopic === topic ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5 text-[#087990]/40" />}
                                                    </div>
                                                    <span className="font-bold leading-tight">{topic}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative group w-full mt-10">
                                            <button
                                                onClick={handleStart}
                                                disabled={!selectedTopic}
                                                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#44A673] to-[#158289] hover:from-[#3d9567] hover:to-[#116e74] text-white font-black py-5 px-6 rounded-2xl shadow-[0_15px_30px_rgba(21,130,137,0.25)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_15px_35px_rgba(21,130,137,0.35)] hover:-translate-y-1 active:translate-y-0 text-xl tracking-tight"
                                            >
                                                Generate Master Revision <ChevronRight className="w-6 h-6" />
                                            </button>
                                            
                                            {/* Tooltip */}
                                            {!selectedTopic && (
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 flex flex-col items-center">
                                                    <div className="bg-slate-800 text-white text-sm font-bold py-2 px-4 rounded-xl shadow-lg whitespace-nowrap">
                                                        Please select a Topic first
                                                    </div>
                                                    <div className="w-3 h-3 bg-slate-800 rotate-45 -mt-1.5"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer / Navigation */}
                    <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="flex items-center gap-2 text-slate-500 font-bold hover:text-[#087990] transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" /> Go Back
                            </button>
                        ) : (
                            <div className="text-slate-400 text-sm font-medium flex items-center gap-2">
                                <Layers className="w-4 h-4" /> Start by choosing a module
                            </div>
                        )}

                        <div className="text-slate-300 font-black italic text-2xl tracking-tighter select-none"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for the missing icon in step 2
const FileCode2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M2 15.5 4.5 13 7 15.5" />
        <path d="m7 18.5-2.5 2.5L2 18.5" />
    </svg>
);

export default TopicSelector;
