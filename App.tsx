import React, { useState, useEffect, useRef } from 'react';
import { TopicPlan, ExamConfig, GeneratedExam } from './types';
import { generateFullExam, suggestTopicPlan } from './services/geminiService';
import { PlanRow } from './components/PlanRow';
import { StatsChart } from './components/StatsChart';

const SUBJECTS = [
  "Toán", "Vật lí", "Hóa học", "Sinh học", 
  "Ngữ văn", "Lịch sử", "Địa lí", "GDCD", "Tiếng Anh", "Tin học"
];

const App: React.FC = () => {
  // State
  const [config, setConfig] = useState<ExamConfig>({
    grade: '9',
    subject: 'Toán',
    model: 'gemini-2.5-flash',
    outputFormat: 'latex'
  });
  const [plans, setPlans] = useState<TopicPlan[]>([
    { id: '1', topic: 'Phương trình bậc hai', type: 'MCQ', count: 4, level: 'NB' },
    { id: '2', topic: 'Hệ phương trình', type: 'MCQ', count: 4, level: 'TH' },
    { id: '3', topic: 'Hệ thức lượng trong tam giác vuông', type: 'MCQ', count: 4, level: 'NB' },
    { id: '4', topic: 'Đường tròn và góc', type: 'TF', count: 2, level: 'TH' },
    { id: '5', topic: 'Hàm số y = ax^2', type: 'TF', count: 2, level: 'VD' },
    { id: '6', topic: 'Giải bài toán bằng cách lập hệ PT', type: 'SA', count: 3, level: 'VD' },
    { id: '7', topic: 'Hình học tổng hợp', type: 'SA', count: 3, level: 'VDC' },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [result, setResult] = useState<GeneratedExam | null>(null);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const previewRef = useRef<HTMLDivElement>(null);

  // Derived state
  const totalQuestions = plans.reduce((acc, curr) => acc + curr.count, 0);
  const typeCounts = {
    MCQ: plans.filter(p => p.type === 'MCQ').reduce((acc, c) => acc + c.count, 0),
    TF: plans.filter(p => p.type === 'TF').reduce((acc, c) => acc + c.count, 0),
    SA: plans.filter(p => p.type === 'SA').reduce((acc, c) => acc + c.count, 0),
  };

  // Effects
  useEffect(() => {
    if (viewMode === 'preview' && result && (window as any).MathJax) {
      // Trigger MathJax typeset
      setTimeout(() => {
        (window as any).MathJax.typesetPromise && (window as any).MathJax.typesetPromise([previewRef.current]);
      }, 100);
    }
  }, [viewMode, result]);

  // Handlers
  const addPlanRow = () => {
    setPlans([
      ...plans,
      { id: Date.now().toString(), topic: '', type: 'MCQ', count: 1, level: 'NB' }
    ]);
  };

  const updatePlan = (id: string, field: keyof TopicPlan, value: any) => {
    setPlans(plans.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePlan = (id: string) => {
    setPlans(plans.filter(p => p.id !== id));
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    try {
      const suggestedPlans = await suggestTopicPlan(config.grade, config.subject, config.model);
      setPlans(suggestedPlans);
    } catch (error) {
      alert("Không thể gợi ý chủ đề lúc này.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    setViewMode('code'); // Reset to code view on new generation

    try {
      const content = await generateFullExam(config.model, plans, config.outputFormat, config.subject);
      setResult({
        content,
        timestamp: new Date().toLocaleTimeString(),
        counts: typeCounts
      });
    } catch (error: any) {
      alert(`Lỗi: ${error.message || 'Không thể tạo đề thi'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.content);
      alert('Đã sao chép vào clipboard!');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const extension = config.outputFormat === 'latex' ? 'tex' : 'doc';
    const blob = new Blob([result.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Exam_${config.subject}_${config.grade}_${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50 text-slate-800 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-primary-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 text-white p-2 rounded-lg shadow-glow">
                <i className="fa-solid fa-graduation-cap fa-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold font-inter text-slate-900 leading-tight">
                  7991 Exam Generator
                </h1>
                <p className="text-slate-500 text-xs">
                  Gemini AI • 22 Questions (12-4-6)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xs font-semibold px-3 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-200">
                 <i className="fa-solid fa-check-circle mr-1"></i> System Ready
               </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: CONFIGURATION */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Config Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-white to-primary-50">
              <h2 className="text-slate-800 font-bold flex items-center">
                <i className="fa-solid fa-sliders text-primary-600 mr-2"></i>Cấu hình đề thi
              </h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-5">
               <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Môn học</label>
                  <select 
                    value={config.subject}
                    onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  >
                     {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
               </div>
               <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Khối Lớp</label>
                  <select 
                    value={config.grade}
                    onChange={(e) => setConfig({ ...config, grade: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  >
                     {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                       <option key={g} value={g}>Lớp {g}</option>
                     ))}
                  </select>
               </div>
               <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Model AI</label>
                  <select 
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Nhanh)</option>
                    <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Tốt nhất)</option>
                  </select>
               </div>
               <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Định dạng xuất</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button 
                      onClick={() => setConfig({ ...config, outputFormat: 'latex' })}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${config.outputFormat === 'latex' ? 'bg-white text-primary-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      LaTeX
                    </button>
                    <button 
                      onClick={() => setConfig({ ...config, outputFormat: 'word' })}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${config.outputFormat === 'word' ? 'bg-white text-primary-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Word / Text
                    </button>
                  </div>
               </div>
            </div>
          </div>

          {/* Plan Table Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-white to-primary-50">
                <h2 className="text-slate-800 font-bold text-sm flex items-center">
                  <i className="fa-solid fa-list-ol text-primary-600 mr-2"></i>Ma trận kiến thức
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={handleSuggest}
                    disabled={isSuggesting}
                    className="bg-white border border-primary-200 text-primary-700 hover:bg-primary-50 text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center shadow-sm"
                  >
                    {isSuggesting ? <i className="fa-solid fa-circle-notch fa-spin mr-1"></i> : <i className="fa-solid fa-wand-magic-sparkles mr-1"></i>}
                    {isSuggesting ? 'Đang tìm chủ đề...' : 'Tự động gợi ý'}
                  </button>
                  <button 
                    onClick={addPlanRow}
                    className="bg-primary-600 hover:bg-primary-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center shadow-sm"
                  >
                    <i className="fa-solid fa-plus mr-1"></i> Thêm
                  </button>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scroll p-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-3 text-[11px] font-bold text-slate-400 mb-3 px-2 uppercase tracking-wider">
                   <div className="col-span-5">Chủ đề (Môn {config.subject})</div>
                   <div className="col-span-3">Loại câu hỏi</div>
                   <div className="col-span-2 text-center">Số lượng</div>
                   <div className="col-span-2">Mức độ</div>
                </div>

                <div className="space-y-2">
                  {plans.map(plan => (
                    <PlanRow 
                      key={plan.id} 
                      plan={plan} 
                      onChange={updatePlan} 
                      onRemove={removePlan} 
                    />
                  ))}
                  {plans.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-primary-100 bg-primary-50/50 rounded-lg">
                      <p className="text-slate-400 text-sm">Danh sách trống</p>
                      <button onClick={handleSuggest} className="text-primary-600 text-sm font-bold mt-2 hover:underline">
                        Dùng AI gợi ý cho {config.subject}?
                      </button>
                    </div>
                  )}
                </div>
             </div>

             {/* Summary Footer */}
             <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="grid grid-cols-4 gap-4 items-center">
                   <div className="text-center p-2 bg-white rounded border border-slate-200 shadow-sm">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">MCQ</div>
                      <div className={`text-lg font-bold ${typeCounts.MCQ === 12 ? 'text-primary-600' : 'text-slate-700'}`}>{typeCounts.MCQ}/12</div>
                   </div>
                   <div className="text-center p-2 bg-white rounded border border-slate-200 shadow-sm">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Đúng/Sai</div>
                      <div className={`text-lg font-bold ${typeCounts.TF === 4 ? 'text-primary-600' : 'text-slate-700'}`}>{typeCounts.TF}/4</div>
                   </div>
                   <div className="text-center p-2 bg-white rounded border border-slate-200 shadow-sm">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Trả lời ngắn</div>
                      <div className={`text-lg font-bold ${typeCounts.SA === 6 ? 'text-primary-600' : 'text-slate-700'}`}>{typeCounts.SA}/6</div>
                   </div>
                   <div className="text-center p-2 bg-slate-800 rounded border border-slate-800 shadow-sm text-white">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Tổng</div>
                      <div className={`text-lg font-bold ${totalQuestions === 22 ? 'text-green-400' : 'text-white'}`}>
                        {totalQuestions}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-primary-200 transform transition-all active:scale-[0.99] ${
              isGenerating 
                ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600'
            }`}
          >
             {isGenerating ? (
               <div className="flex items-center justify-center">
                 <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                 <span>Đang khởi tạo đề thi {config.subject}...</span>
               </div>
             ) : (
               <div className="flex items-center justify-center">
                 <i className="fa-solid fa-bolt mr-2"></i>
                 <span>Tạo đề thi hoàn chỉnh</span>
               </div>
             )}
          </button>
        </div>

        {/* RIGHT COLUMN: PREVIEW */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Stats Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
             <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
                <i className="fa-solid fa-chart-pie mr-2 text-primary-500"></i>Phân bổ mức độ nhận thức
             </h3>
             <StatsChart plans={plans} />
          </div>

          {/* Output Card */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-[600px] overflow-hidden">
             <div className="bg-slate-900 text-slate-200 p-3 px-4 flex justify-between items-center">
               <div className="flex gap-2">
                 <button 
                    onClick={() => setViewMode('code')}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded transition ${viewMode === 'code' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                 >
                   <i className="fa-solid fa-code mr-1"></i> CODE
                 </button>
                 <button 
                    onClick={() => setViewMode('preview')}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded transition ${viewMode === 'preview' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                 >
                   <i className="fa-solid fa-eye mr-1"></i> PREVIEW
                 </button>
               </div>
               
               <div className="flex space-x-2">
                 <button 
                    onClick={handleCopy}
                    disabled={!result}
                    className="text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1.5 rounded transition disabled:opacity-50"
                 >
                   COPY
                 </button>
                 <button 
                    onClick={handleDownload}
                    disabled={!result}
                    className="text-[10px] font-bold bg-primary-600 hover:bg-primary-500 text-white px-2.5 py-1.5 rounded transition disabled:opacity-50"
                 >
                   DOWNLOAD
                 </button>
               </div>
             </div>
             
             <div className="flex-1 bg-[#1e293b] overflow-auto custom-scroll relative group">
                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1e293b]/90 z-10 backdrop-blur-sm">
                     <div className="text-primary-400 text-center">
                        <i className="fa-solid fa-brain fa-2x mb-3 animate-bounce"></i>
                        <p className="text-sm font-medium">Gemini đang suy nghĩ...</p>
                        <p className="text-xs text-slate-500 mt-1">Đang soạn thảo câu hỏi & lời giải</p>
                     </div>
                  </div>
                )}
                
                {result ? (
                  viewMode === 'code' ? (
                    <pre className={`p-6 text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed ${config.outputFormat === 'word' ? 'font-sans' : ''}`}>
                      {result.content}
                    </pre>
                  ) : (
                    <div 
                      ref={previewRef}
                      className="p-6 bg-white min-h-full text-slate-900 font-serif text-sm leading-relaxed whitespace-pre-wrap"
                    >
                      {result.content}
                    </div>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40">
                    <i className="fa-regular fa-file-lines fa-4x mb-4"></i>
                    <p className="font-medium text-sm">Kết quả sẽ hiển thị tại đây</p>
                    <p className="text-xs mt-1">Hỗ trợ xuất LaTeX và Word</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;