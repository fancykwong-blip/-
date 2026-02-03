
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home as HomeIcon, 
  Calendar as CalendarIcon, 
  Activity, 
  BookOpen, 
  BarChart3, 
  Plus, 
  ChevronRight,
  ChevronLeft,
  Settings,
  Sparkles,
  AlertCircle,
  Coffee,
  Moon,
  Info,
  Check,
  X,
  Trash2
} from 'lucide-react';
import { 
  format, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO, 
  differenceInDays, 
  isWithinInterval,
  startOfDay
} from 'date-fns';
// Fix for "no exported member 'zhCN'" by using the specific locale path often required in v3+ or specific ESM setups.
import { zhCN } from 'date-fns/locale/zh-CN';
import { View, CycleRecord, Symptom, PredictionResult, HealthReport, CyclePhase } from './types';
import { SYMPTOMS_LIST, MOCK_ARTICLES } from './constants';
import { getNextPeriodPrediction, generateHealthReport } from './services/geminiService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [cycles, setCycles] = useState<CycleRecord[]>(() => {
    const saved = localStorage.getItem('cycles');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLogging, setIsLogging] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [latestReport, setLatestReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('cycles', JSON.stringify(cycles));
    if (cycles.length > 0) {
      updatePrediction();
    }
  }, [cycles]);

  const updatePrediction = async () => {
    if (cycles.length === 0) return;
    try {
      const pred = await getNextPeriodPrediction(cycles);
      setPrediction(pred);
    } catch (err) {
      console.error("Prediction failed", err);
    }
  };

  const currentCycle = useMemo(() => {
    if (cycles.length === 0) return null;
    const sorted = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
    return sorted[0].endDate ? null : sorted[0];
  }, [cycles]);

  const handleLogPeriod = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = cycles.find(c => c.startDate === today || (c.endDate && c.startDate <= today && c.endDate >= today));
    
    if (existing) {
      alert("今天已经在经期记录中了哦");
      return;
    }

    const newCycle: CycleRecord = {
      id: Date.now().toString(),
      startDate: today,
      symptoms: []
    };
    setCycles([...cycles, newCycle]);
    setIsLogging(true);
  };

  const updateSymptoms = (symptom: Symptom) => {
    if (!currentCycle) return;
    const updatedSymptoms = currentCycle.symptoms.includes(symptom)
      ? currentCycle.symptoms.filter(s => s !== symptom)
      : [...currentCycle.symptoms, symptom];
    
    const updatedCycles = cycles.map(c => 
      c.id === currentCycle.id ? { ...c, symptoms: updatedSymptoms } : c
    );
    setCycles(updatedCycles);
  };

  const handleFinishPeriod = () => {
    if (!currentCycle) return;
    const updatedCycles = cycles.map(c => 
      c.id === currentCycle.id ? { ...c, endDate: format(new Date(), 'yyyy-MM-dd') } : c
    );
    setCycles(updatedCycles);
    setIsLogging(false);
    generateReport(currentCycle);
  };

  const handleUpdateCycleDates = (updatedCycle: CycleRecord) => {
    setCycles(cycles.map(c => c.id === updatedCycle.id ? updatedCycle : c));
  };

  const handleDeleteCycle = (id: string) => {
    setCycles(cycles.filter(c => c.id !== id));
  };

  const generateReport = async (cycle: CycleRecord) => {
    setLoading(true);
    try {
      const report = await generateHealthReport(cycle);
      setLatestReport(report);
      setActiveView('insights');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <HomeView 
          cycles={cycles} 
          prediction={prediction} 
          onLog={handleLogPeriod} 
          isLogging={!!currentCycle} 
          onFinish={handleFinishPeriod}
        />;
      case 'calendar':
        return <CalendarView 
          cycles={cycles} 
          onUpdateCycle={handleUpdateCycleDates} 
          onDeleteCycle={handleDeleteCycle}
        />;
      case 'symptoms':
        return <SymptomsView 
          currentCycle={currentCycle} 
          onUpdate={updateSymptoms} 
          onFinish={handleFinishPeriod}
        />;
      case 'insights':
        return <InsightsView report={latestReport} loading={loading} />;
      case 'learn':
        return <LearnView />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative pb-24 shadow-xl bg-white">
      <header className="px-6 py-8 flex justify-between items-center bg-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">CycleCare <span className="text-blue-600">AI</span></h1>
          <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMM do', { locale: zhCN })}</p>
        </div>
        <button className="p-2 bg-blue-50 rounded-full text-blue-600 hover:bg-blue-100 transition">
          <Settings className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-6">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center py-4 px-2 z-50">
        <NavButton icon={<HomeIcon />} label="首页" active={activeView === 'home'} onClick={() => setActiveView('home')} />
        <NavButton icon={<CalendarIcon />} label="日历" active={activeView === 'calendar'} onClick={() => setActiveView('calendar')} />
        <NavButton icon={<Activity />} label="记录" active={activeView === 'symptoms'} onClick={() => setActiveView('symptoms')} />
        <NavButton icon={<BarChart3 />} label="报告" active={activeView === 'insights'} onClick={() => setActiveView('insights')} />
        <NavButton icon={<BookOpen />} label="科普" active={activeView === 'learn'} onClick={() => setActiveView('learn')} />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-blue-700' : 'text-gray-400 hover:text-blue-400'}`}
  >
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-blue-100' : 'bg-transparent'}`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const HomeView: React.FC<{ 
  cycles: CycleRecord[], 
  prediction: PredictionResult | null, 
  onLog: () => void, 
  isLogging: boolean,
  onFinish: () => void
}> = ({ cycles, prediction, onLog, isLogging, onFinish }) => {
  const nextDate = prediction ? parseISO(prediction.nextDate) : null;
  const daysUntil = nextDate ? differenceInDays(nextDate, startOfDay(new Date())) : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center justify-center pt-8">
        <div className="w-64 h-64 rounded-full border-[12px] border-blue-50 flex flex-col items-center justify-center relative shadow-inner">
          <div className="absolute inset-0 rounded-full border-[12px] border-blue-500 border-t-transparent animate-spin-slow opacity-20" style={{ animationDuration: '10s' }}></div>
          {isLogging ? (
            <>
              <span className="text-gray-500 font-medium text-sm">姨妈期第</span>
              <span className="text-6xl font-black text-blue-600 my-1">
                {differenceInDays(startOfDay(new Date()), parseISO(cycles.sort((a,b)=>b.startDate.localeCompare(a.startDate))[0].startDate)) + 1}
              </span>
              <span className="text-gray-500 font-medium text-lg">天</span>
            </>
          ) : (
            <>
              <span className="text-gray-500 font-medium text-sm">距离下次姨妈还剩</span>
              <span className="text-6xl font-black text-blue-600 my-1">
                {daysUntil !== null ? (daysUntil < 0 ? 0 : daysUntil) : '--'}
              </span>
              <span className="text-gray-500 font-medium text-lg">天</span>
            </>
          )}
        </div>
        
        <button 
          onClick={isLogging ? onFinish : onLog}
          className={`mt-10 flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white shadow-lg shadow-blue-200 transition-transform active:scale-95 ${isLogging ? 'bg-gray-800' : 'bg-blue-600'}`}
        >
          {isLogging ? '结束经期' : '开始经期'}
          {!isLogging && <Plus className="w-5 h-5" />}
        </button>
      </div>

      {prediction && (
        <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3 border border-blue-100">
          <Sparkles className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <h4 className="font-bold text-blue-900 text-sm">AI 预测提示</h4>
            <p className="text-blue-800 text-xs mt-1 leading-relaxed">{prediction.message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-2xl">
          <span className="text-gray-400 text-xs block mb-1 uppercase tracking-wider font-bold">平均周期</span>
          <span className="text-xl font-bold text-gray-800">28 天</span>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl">
          <span className="text-gray-400 text-xs block mb-1 uppercase tracking-wider font-bold">平均经期</span>
          <span className="text-xl font-bold text-gray-800">5 天</span>
        </div>
      </div>
    </div>
  );
};

const CalendarView: React.FC<{ 
  cycles: CycleRecord[], 
  onUpdateCycle: (c: CycleRecord) => void,
  onDeleteCycle: (id: string) => void
}> = ({ cycles, onUpdateCycle, onDeleteCycle }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingCycle, setEditingCycle] = useState<CycleRecord | null>(null);
  
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getPhase = (date: Date): CyclePhase | null => {
    // Basic logic based on a standard 28-day cycle for visualization
    for (const c of cycles) {
      const start = parseISO(c.startDate);
      // Actual Period
      const end = c.endDate ? parseISO(c.endDate) : addDays(start, 5);
      if (isWithinInterval(date, { start, end })) return 'period';

      // Estimated Phases (based on standard cycle)
      const ovulationDay = addDays(start, 13); // Standard day 14
      if (isSameDay(date, ovulationDay)) return 'ovulation';
      
      const folStart = addDays(end, 1);
      // Fixed: subDays replaced with addDays(..., -1) to resolve reported missing export error.
      const folEnd = addDays(ovulationDay, -1);
      if (date >= folStart && date <= folEnd) return 'follicular';

      const lutStart = addDays(ovulationDay, 1);
      const lutEnd = addDays(start, 27); // Standard next cycle start
      if (date >= lutStart && date <= lutEnd) return 'luteal';
    }
    return null;
  };

  const handleEdit = (cycle: CycleRecord) => {
    setEditingCycle({ ...cycle });
  };

  const handleSaveEdit = () => {
    if (editingCycle) {
      onUpdateCycle(editingCycle);
      setEditingCycle(null);
    }
  };

  return (
    <div className="animate-in slide-in-from-right duration-300 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">{format(currentMonth, 'yyyy年 MMMM', { locale: zhCN })}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(addDays(currentMonth, -30))} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => setCurrentMonth(addDays(currentMonth, 30))} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-gray-300 mb-2 uppercase tracking-widest">
        <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const phase = getPhase(day);
          let bgClass = 'bg-gray-50 text-gray-600';
          let borderClass = 'border-transparent';
          
          if (phase === 'period') bgClass = 'bg-blue-600 text-white shadow-md shadow-blue-100';
          if (phase === 'follicular') bgClass = 'bg-blue-100 text-blue-700';
          if (phase === 'ovulation') bgClass = 'bg-indigo-600 text-white ring-2 ring-indigo-200';
          if (phase === 'luteal') bgClass = 'bg-sky-50 text-sky-700';

          return (
            <div 
              key={day.toString()} 
              className={`h-11 flex items-center justify-center rounded-2xl text-xs font-bold transition-all border ${bgClass} ${borderClass}`}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 py-4 border-t border-gray-100">
        <LegendItem label="姨妈期" color="bg-blue-600" />
        <LegendItem label="卵泡期" color="bg-blue-100" />
        <LegendItem label="排卵日" color="bg-indigo-600" />
        <LegendItem label="黄体期" color="bg-sky-50" />
      </div>

      {/* Edit Form */}
      {editingCycle && (
        <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 space-y-4 animate-in zoom-in duration-200">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-blue-900 flex items-center gap-2"><Settings className="w-4 h-4" /> 修改日期</h4>
            <button onClick={() => setEditingCycle(null)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-blue-600 uppercase">开始日期</label>
              <input 
                type="date" 
                value={editingCycle.startDate}
                onChange={e => setEditingCycle({...editingCycle, startDate: e.target.value})}
                className="w-full bg-white p-2 rounded-xl text-xs border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-blue-600 uppercase">结束日期</label>
              <input 
                type="date" 
                value={editingCycle.endDate || ''}
                onChange={e => setEditingCycle({...editingCycle, endDate: e.target.value})}
                className="w-full bg-white p-2 rounded-xl text-xs border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSaveEdit}
              className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> 保存修改
            </button>
            <button 
              onClick={() => { onDeleteCycle(editingCycle.id); setEditingCycle(null); }}
              className="px-3 bg-red-50 text-red-500 py-2 rounded-xl"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-4">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">历史记录 <span className="text-[10px] font-normal text-gray-400 tracking-normal">(点击修改)</span></h4>
        {cycles.length === 0 ? (
          <p className="text-sm text-gray-400 italic">暂无记录，快去开启你的第一份经期档案吧</p>
        ) : (
          cycles.slice().sort((a,b) => b.startDate.localeCompare(a.startDate)).map(c => (
            <div 
              key={c.id} 
              onClick={() => handleEdit(c)}
              className={`flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors border-2 ${editingCycle?.id === c.id ? 'border-blue-200' : 'border-transparent'}`}
            >
              <div>
                <p className="text-sm font-bold text-gray-700">{format(parseISO(c.startDate), 'MM月dd日')} - {c.endDate ? format(parseISO(c.endDate), 'MM月dd日') : '进行中'}</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                  {c.endDate ? `持续 ${differenceInDays(parseISO(c.endDate), parseISO(c.startDate)) + 1} 天` : '正在记录...'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const LegendItem: React.FC<{ label: string, color: string }> = ({ label, color }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-3 h-3 rounded-md ${color}`}></div>
    <span className="text-[10px] font-bold text-gray-400">{label}</span>
  </div>
);

const SymptomsView: React.FC<{ 
  currentCycle: CycleRecord | null, 
  onUpdate: (s: Symptom) => void,
  onFinish: () => void
}> = ({ currentCycle, onUpdate, onFinish }) => {
  if (!currentCycle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">当前不在经期中<br/>不需要记录症状哦</p>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom duration-300 space-y-8">
      <div>
        <h3 className="text-xl font-bold text-gray-800">记录身体反馈</h3>
        <p className="text-sm text-gray-400 mt-1">选择你今天感受到的任何不适</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {SYMPTOMS_LIST.map(({ name, icon }) => {
          const isSelected = currentCycle.symptoms.includes(name as Symptom);
          return (
            <button
              key={name}
              onClick={() => onUpdate(name as Symptom)}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-50 bg-gray-50 text-gray-500'}`}
            >
              {icon}
              <span className="font-medium text-sm">{name}</span>
            </button>
          );
        })}
      </div>

      <button 
        onClick={onFinish}
        className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold shadow-lg shadow-gray-200 transition-transform active:scale-[0.98]"
      >
        完成记录并生成报告
      </button>
    </div>
  );
};

const InsightsView: React.FC<{ report: HealthReport | null, loading: boolean }> = ({ report, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 w-6 h-6 animate-pulse" />
        </div>
        <p className="text-gray-500 font-medium animate-pulse text-center">AI 正在根据您的症状<br/>深度分析个性化建议...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BarChart3 className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">完成一个经期记录后<br/>AI 将在这里为你生成分析报告</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in duration-500 space-y-6 pb-8">
      <div className="bg-gradient-to-br from-blue-700 to-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-100">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> 智能健康建议
        </h3>
        <p className="mt-4 text-blue-50 leading-relaxed text-sm">{report.summary}</p>
      </div>

      <div className="space-y-4">
        <ReportCard icon={<Coffee className="w-5 h-5" />} title="饮食建议" content={report.advice.diet} color="bg-amber-50" textColor="text-amber-700" iconColor="text-amber-500" />
        <ReportCard icon={<Activity className="w-5 h-5" />} title="运动方案" content={report.advice.exercise} color="bg-indigo-50" textColor="text-indigo-700" iconColor="text-indigo-500" />
        <ReportCard icon={<Moon className="w-5 h-5" />} title="作息策略" content={report.advice.rest} color="bg-purple-50" textColor="text-purple-700" iconColor="text-purple-500" />
      </div>

      <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <p className="text-[10px] text-gray-400 leading-tight">
          * 以上报告由 AI 生成，仅供参考。如果症状严重（如剧烈痛经、异常出血），请务必咨询专业医生的建议。
        </p>
      </div>
    </div>
  );
};

const ReportCard: React.FC<{ icon: React.ReactNode, title: string, content: string, color: string, textColor: string, iconColor: string }> = ({ icon, title, content, color, textColor, iconColor }) => (
  <div className={`${color} p-5 rounded-2xl flex gap-4`}>
    <div className={`p-2 h-fit rounded-lg bg-white ${iconColor} shadow-sm`}>
      {icon}
    </div>
    <div>
      <h4 className={`font-bold ${textColor} mb-1 text-sm`}>{title}</h4>
      <p className="text-gray-600 text-xs leading-relaxed">{content}</p>
    </div>
  </div>
);

const LearnView: React.FC = () => {
  return (
    <div className="animate-in slide-in-from-left duration-300 space-y-6 pb-8">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-bold text-gray-800">科普知识</h3>
          <p className="text-sm text-gray-400 mt-1">每周更新最实用的健康干货</p>
        </div>
        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">Week 14</span>
      </div>

      <div className="space-y-6">
        {MOCK_ARTICLES.map(article => (
          <div key={article.id} className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-3xl mb-3 h-48 shadow-lg transition-transform group-hover:scale-[1.02]">
              <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4">
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-gray-800 uppercase tracking-wider">{article.category}</span>
              </div>
            </div>
            <h4 className="font-bold text-gray-800 text-lg group-hover:text-blue-700 transition-colors">{article.title}</h4>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2 leading-relaxed">{article.excerpt}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] font-bold text-gray-300 uppercase">{article.date}</span>
              <button className="text-blue-700 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                阅读全文 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
