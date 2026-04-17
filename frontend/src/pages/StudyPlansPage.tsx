import { useState, useEffect } from 'react';
import { BookOpen, Calendar as CalendarIcon, Clock, ArrowLeft, RefreshCw, LayoutGrid, Trophy } from 'lucide-react';
import { StudyPlan } from '../components/adaptive/StudyPlan';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

export default function StudyPlansPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

  useEffect(() => {
    loadPlans();
  }, [user?.id]);

  const loadPlans = () => {
    const storageKey = user?.id ? `user_study_plans_${user.id}` : 'user_study_plans';
    const savedStr = localStorage.getItem(storageKey);
    // If we have plans, use them. If not, explicitly clear the state to prevent bleed.
    if (savedStr) {
      try {
        const parsed = JSON.parse(savedStr);
        // Convert map to array and sort by latest
        const plansArray = Object.values(parsed).sort((a: any, b: any) => b.timestamp - a.timestamp);
        setPlans(plansArray);
      } catch (e) {
        console.error('Error parsing plans', e);
      }
    } else {
      setPlans([]);
    }
  };

  const getTheme = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return { bg: 'bg-emerald-50/70', border: 'border-emerald-200', text: 'text-emerald-900', textMuted: 'text-emerald-700/70', primary: 'bg-emerald-600', secondary: 'bg-emerald-100', accent: 'text-emerald-600' };
      case 'advanced': return { bg: 'bg-violet-50/70', border: 'border-violet-200', text: 'text-violet-900', textMuted: 'text-violet-700/70', primary: 'bg-violet-600', secondary: 'bg-violet-100', accent: 'text-violet-600' };
      default: return { bg: 'bg-sky-50/70', border: 'border-sky-200', text: 'text-sky-900', textMuted: 'text-sky-700/70', primary: 'bg-sky-600', secondary: 'bg-sky-100', accent: 'text-sky-600' };
    }
  };

  if (selectedPlan) {
    const theme = getTheme(selectedPlan.level);
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedPlan(null)}
            className="p-2 border rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Study Plan Viewer</h1>
            <p className="text-sm font-medium text-slate-500">
              Module: <span className="text-slate-800">{selectedPlan.module}</span> | Topic: <span className="text-slate-800">{selectedPlan.topic}</span>
            </p>
          </div>
        </div>

        <StudyPlan 
          plan={selectedPlan.data.plan} 
          overview={selectedPlan.data.overview} 
          planId={selectedPlan.id} 
          theme={theme} 
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between ml-4 mt-6 items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#087990] tracking-tight">My Study Plans</h1>
          <p className="text-slate-500 mt-2 font-medium">Review your personalized academic schedules.</p>
        </div>
        <button onClick={loadPlans} className="p-2 bg-white rounded-xl shadow-sm border text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/50 border rounded-3xl backdrop-blur-sm">
          <div className="p-4 bg-white rounded-2xl shadow-sm border mb-4">
            <LayoutGrid className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Study Plans Found</h3>
          <p className="text-slate-500 text-center max-w-sm">
            Generate your first study plan by completing a quiz in the Adaptive Learning dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-4">
          {plans.map((p) => {
            const theme = getTheme(p.level);
            const totalTasks = p.data.plan?.reduce((acc: number, day: any) => acc + (day.tasks?.length || 0), 0) || 0;
            const dateStr = new Date(p.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            
            const savedStr = localStorage.getItem(`study_plan_progress_${p.id}`);
            let completedTasksCount = 0;
            if (savedStr) {
               try {
                  const parsed = JSON.parse(savedStr);
                  completedTasksCount = parsed.length;
               } catch (e) {}
            }
            const isMastered = totalTasks > 0 && completedTasksCount === totalTasks;

            return (
              <div 
                key={p.id}
                onClick={() => setSelectedPlan(p)}
                className={`flex flex-col p-6 rounded-3xl border shadow-sm cursor-pointer hover:-translate-y-1 transition-all duration-300 ${isMastered ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' : `${theme.bg} ${theme.border}`}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center ${isMastered ? 'bg-gradient-to-tr from-yellow-400 to-amber-500' : theme.primary}`}>
                    {isMastered ? <Trophy className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white shadow-sm border ${theme.text} ${theme.border}`}>
                    {p.level}
                  </span>
                </div>
                
                <h4 className={`text-xl font-bold tracking-tight mb-1 line-clamp-1 ${theme.text}`}>{p.topic}</h4>
                <p className={`text-sm font-medium mb-6 line-clamp-1 ${theme.textMuted}`}>{p.module}</p>
                
                <div className={`mt-auto pt-4 border-t flex items-center justify-between font-bold text-sm ${theme.border} ${theme.textMuted}`}>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>{totalTasks} Tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{dateStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
