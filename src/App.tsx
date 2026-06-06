import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  BookOpen, 
  Award, 
  Compass, 
  Copy, 
  Check, 
  RotateCcw, 
  Download, 
  Plus, 
  Trash2, 
  Lightbulb, 
  FileText, 
  GraduationCap, 
  Search, 
  Bookmark, 
  BookmarkCheck, 
  HelpCircle, 
  ChevronRight, 
  ArrowRight, 
  Info,
  Layers,
  Activity,
  Heart
} from "lucide-react";
import { CURRICULUM_TEMPLATES } from "./data/templates.ts";
import { CurriculumTemplate, LessonDesign, AchievementAnalysis } from "./types.ts";

export default function App() {
  // Input form state
  const [subject, setSubject] = useState<string>("사회");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [grade, setGrade] = useState<string>("초등 3~4학년군");
  const [customGrade, setCustomGrade] = useState<string>("");
  const [rawStandard, setRawStandard] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorOnAnalyze, setErrorOnAnalyze] = useState<string | null>(null);

  // Active analysis results
  const [analysis, setAnalysis] = useState<AchievementAnalysis | null>(null);
  const [title, setTitle] = useState<string>(""); // Custom title for saving

  // Saved designs list (localStorage)
  const [savedDesigns, setSavedDesigns] = useState<LessonDesign[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  // General Notification / Tip UI
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Selected preset template tracking
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Load from template
  const handleSelectTemplate = (template: CurriculumTemplate) => {
    setSelectedTemplateId(template.id);
    setSubject(CURRICULUM_TEMPLATES.find(t => t.id === template.id)?.subject || "기타");
    setGrade(CURRICULUM_TEMPLATES.find(t => t.id === template.id)?.grade || "기타");
    setRawStandard(template.rawStandard);
    
    // If the template is already pre-analyzed, load it instantly so the teacher doesn't have to wait or spend tokens!
    if (template.preAnalysed) {
      setAnalysis(template.preAnalysed);
      const randomTopicName = template.rawStandard.substring(0, 15) + "... 분석안";
      setTitle(`${template.subject} - ${template.sourceCode || "분석안"}`);
      setErrorOnAnalyze(null);
    } else {
      setAnalysis(null);
      setTitle("");
    }
  };

  // Set up default initial template on mount
  useEffect(() => {
    if (CURRICULUM_TEMPLATES.length > 0) {
      handleSelectTemplate(CURRICULUM_TEMPLATES[0]);
    }
    // Load saved plans from localStorage
    try {
      const plans = localStorage.getItem("curriculum_designs");
      if (plans) {
        setSavedDesigns(JSON.parse(plans));
      }
    } catch (e) {
      console.error("Local storage load error:", e);
    }
  }, []);

  // Save changes to localStorage helper
  const savePlansToLocalStorage = (updatedPlans: LessonDesign[]) => {
    try {
      localStorage.setItem("curriculum_designs", JSON.stringify(updatedPlans));
      setSavedDesigns(updatedPlans);
    } catch (e) {
      console.error("Failed to save to local storage", e);
    }
  };

  // Handle analyzer submission to Gemini API
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawStandard.trim()) {
      setErrorOnAnalyze("성취기준을 입력하거나 템플릿을 선택해 주세요.");
      return;
    }

    setIsAnalyzing(true);
    setErrorOnAnalyze(null);
    setAnalysis(null);

    const actualSubject = subject === "기타" ? customSubject || "기타" : subject;
    const actualGrade = grade === "기타" ? customGrade || "기타" : grade;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          achievementStandard: rawStandard.trim(),
          subject: actualSubject,
          grade: actualGrade,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `서버 오류가 발생했습니다 (코드: ${response.status})`);
      }

      const data = await response.json();
      setAnalysis(data);
      setTitle(`${actualSubject} - 성취기준 분석안`);
    } catch (err: any) {
      console.error("API Error:", err);
      setErrorOnAnalyze(err.message || "성취기준 분석 중 에러가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setRawStandard("");
    setSubject("기타");
    setCustomSubject("");
    setGrade("기타");
    setCustomGrade("");
    setAnalysis(null);
    setTitle("");
    setSelectedTemplateId("");
    setErrorOnAnalyze(null);
  };

  // Copy text helper
  const triggerCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Format full deconstruction report into Markdown for easy teacher export
  const handleCopyMarkdownReport = () => {
    if (!analysis) return;
    
    const actualSubject = subject === "기타" ? customSubject || "기타" : subject;
    const actualGrade = grade === "기타" ? customGrade || "기타" : grade;

    const markdownText = `## [2022 개정 교육과정 성취기준 분석 보고서]
* **교과:** ${actualSubject}
* **대상 학년군:** ${actualGrade}
* **대상 성취기준:** "${rawStandard}"

---

### 1. 핵심 아이디어 (Big Idea / 영속적 이해)
> "${analysis.core_idea}"

---

### 2. 성취기준 3대 영역 해체 분석
#### 📘 지식·이해 (What)
${analysis.knowledge.map(item => `* ${item}`).join('\n')}

#### 🟢 과정·기능 (How)
${analysis.process.map(item => `* ${item}`).join('\n')}

#### 🧡 가치·태도 (Why / Attitude)
${analysis.attitude.map(item => `* ${item}`).join('\n')}

---

### 3. 교실 연계 수행평가 방안
${analysis.evaluation_plans.map((item, index) => `${index + 1}. ${item}`).join('\n')}

---

### 4. 교육과정 해석 및 Rationale (교사 제언)
"${analysis.rationale}"

*본 분석은 2022 개정 교육과정의 깊이 있는 학습 및 백워드 설계 준거에 맞춰 생성되었습니다.*`;

    triggerCopy(markdownText, "full-report");
    showNotification("보고서 전문이 마크다운 형식으로 클립보드에 복사되었습니다!");
  };

  // Helper for notification toast
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Save design to list
  const handleSaveDesign = () => {
    if (!analysis || !rawStandard.trim()) return;

    const actualSubject = subject === "기타" ? customSubject || "기타" : subject;
    const actualGrade = grade === "기타" ? customGrade || "기타" : grade;
    const cleanTitle = title.trim() || `${actualSubject} 성취기준 설계안`;

    const newDesign: LessonDesign = {
      id: "design-" + Date.now(),
      title: cleanTitle,
      creationDate: new Date().toISOString(),
      subject: actualSubject,
      grade: actualGrade,
      rawStandard: rawStandard.trim(),
      analysis: analysis,
    };

    const updated = [newDesign, ...savedDesigns];
    savePlansToLocalStorage(updated);
    setSelectedSavedId(newDesign.id);
    showNotification(`'${cleanTitle}' 설계안이 보관함에 안전하게 저장되었습니다.`);
  };

  // Load saved design
  const handleLoadSavedDesign = (design: LessonDesign) => {
    setSelectedSavedId(design.id);
    setSubject(design.subject);
    setRawStandard(design.rawStandard);
    setGrade(design.grade);
    setAnalysis(design.analysis);
    setTitle(design.title);
  };

  // Delete saved design
  const handleDeleteDesign = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("정말 이 설계안을 보관함에서 삭제하시겠습니까?")) return;
    
    const updated = savedDesigns.filter(d => d.id !== id);
    savePlansToLocalStorage(updated);
    if (selectedSavedId === id) {
      setSelectedSavedId(null);
      setAnalysis(null);
      setTitle("");
    }
    showNotification("설계안이 보관함에서 삭제되었습니다.");
  };

  // Helper to extract highlighted parts if possible
  // We can provide an explanatory breakdown of the parts for visual interest.
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col" id="app_root">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-slate-800 text-teal-400 font-medium px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce" id="toast_notification">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white py-6 px-4 md:px-8 shadow-md border-b border-indigo-900/40" id="app_header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 inline-block mt-1">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  2022 개정 교육과정 맞춤형
                </span>
                <span className="bg-teal-500/15 text-teal-300 border border-teal-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  백워드 설계(Backward Design)
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-slate-50">
                교육과정 성취기준 3차원 분석기
              </h1>
              <p className="text-slate-400 text-sm mt-0.5 max-w-2xl font-light">
                단편적 암기를 넘어 '지식·이해', '과정·기능', '가치·태도'를 면밀하게 추출하고, 
                전이 가능한 삶의 핵심 아이디어(Big Idea)와 실제 수행평가 시나리오를 설계합니다.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end md:self-center">
            <span className="text-xs text-slate-500 bg-slate-800/40 border border-slate-700/40 px-3 py-1.5 rounded-lg font-mono">
              v1.2.0 Stable
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard_main">
        
        {/* Left Sidebar / Form Controls (5 columns on large screen) */}
        <div className="lg:col-span-5 flex flex-col gap-6" id="input_panel">
          
          {/* Quick Curriculum Presets */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm transition-all hover:shadow-md" id="presets_section">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <h2 className="font-bold text-slate-900 text-sm">교육과정 샘플 템플릿</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">검증 데이터 즉시 분석</span>
            </div>
            
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              성취기준 해체 기법을 바로 체험할 수 있도록 미리 설계된 과목별 국가 성취기준입니다. 클릭 시 즉시 3차원 구조가 해체됩니다.
            </p>

            <div className="grid grid-cols-1 gap-2.5" id="template_buttons_container">
              {CURRICULUM_TEMPLATES.map((item) => {
                const isSelected = selectedTemplateId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTemplate(item)}
                    type="button"
                    className={`text-left p-3 rounded-xl border transition-all duration-150 relative ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/60 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/55"
                    }`}
                    id={`template_btn_${item.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono">
                          {item.subject}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium font-mono">
                          {item.sourceCode}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{item.grade}</span>
                    </div>
                    <div className="text-xs text-slate-800 font-medium line-clamp-1 mt-1.5" title={item.rawStandard}>
                      &ldquo;{item.rawStandard}&rdquo;
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {item.description}
                    </div>
                    {isSelected && (
                      <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleAnalyze} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col gap-4" id="main_analyze_form">
            <div className="flex items-center justify-between mb-1 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-500" />
                <h2 className="font-bold text-slate-900 text-sm">성취기준 수동 입력 분석</h2>
              </div>
              <button 
                type="button" 
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-600 transition-colors text-xs flex items-center gap-1 font-medium"
                id="reset_form_button"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                초기화
              </button>
            </div>

            {/* Subject Select */}
            <div className="grid grid-cols-2 gap-3" id="meta_inputs">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="subject_select">분석 대상 교과</label>
                <select
                  id="subject_select"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setSelectedTemplateId(""); // clear template selection when manually touching the fields
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="국어">국어</option>
                  <option value="수학">수학</option>
                  <option value="사회">사회</option>
                  <option value="과학">과학</option>
                  <option value="영어">영어</option>
                  <option value="도덕">도덕</option>
                  <option value="실과/정보">실과/정보</option>
                  <option value="음악">음악</option>
                  <option value="미술">미술</option>
                  <option value="체육">체육</option>
                  <option value="기타">기타 (직접 입력)</option>
                </select>
              </div>

              {/* Grade Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="grade_select">해당 학년군</label>
                <select
                  id="grade_select"
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                    setSelectedTemplateId("");
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="초등 1~2학년군">초등 1~2학년군</option>
                  <option value="초등 3~4학년군">초등 3~4학년군</option>
                  <option value="초등 5~6학년군">초등 5~6학년군</option>
                  <option value="중학교 1~3학년군">중학교 1~3학년군</option>
                  <option value="고등학교">고등학교 1~3학년군</option>
                  <option value="기타">기타 (직접 입력)</option>
                </select>
              </div>
            </div>

            {/* Conditional custom inputs if "기타" is selected */}
            {(subject === "기타" || grade === "기타") && (
              <div className="bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100 flex flex-col gap-2.5 animate-fadeIn" id="custom_meta_inputs">
                {subject === "기타" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600" htmlFor="custom_subject_input">맞춤 교과 이름</label>
                    <input
                      id="custom_subject_input"
                      type="text"
                      className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="예: 생태와 환경, 미디어 비평 등"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                    />
                  </div>
                )}
                {grade === "기타" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600" htmlFor="custom_grade_input">맞춤 대상/학년</label>
                    <input
                      id="custom_grade_input"
                      type="text"
                      className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="예: 고교 2-3학년 선택교과"
                      value={customGrade}
                      onChange={(e) => setCustomGrade(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Achievement standard textarea */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700" htmlFor="raw_standard_textarea">
                  성취기준 본문 <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {rawStandard.length}자 입력됨
                </span>
              </div>
              <textarea
                id="raw_standard_textarea"
                rows={4}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white leading-relaxed resize-none font-medium"
                placeholder="예: 우리 지역의 고유한 역사적 유산을 탐구하고 조사하는 과정을 통해 조상들의 삶의 지혜를 존중하는 태도를 가진다."
                value={rawStandard}
                onChange={(e) => {
                  setRawStandard(e.target.value);
                  setSelectedTemplateId(""); // manually typed
                }}
              />
              <p className="text-[10px] text-slate-400 leading-normal flex items-start gap-1">
                <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 inline" />
                <span>성취기준을 문장 그대로 넣으면 국가 교육과정 설계 원리에 기초하여 분해됩니다.</span>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="submit"
                disabled={isAnalyzing || !rawStandard.trim()}
                className={`w-full py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm ${
                  isAnalyzing || !rawStandard.trim()
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow"
                }`}
                id="analyse_submit_btn"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-4.5 w-4.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>교과 분석 엔진 해독 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>2022 개정 성취기준 정밀 분석</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Teacher's Saved Board (Local Storage) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm" id="saved_designs_panel">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-indigo-500" />
                <h2 className="font-bold text-slate-900 text-sm">내 로컬 저장소 ({savedDesigns.length})</h2>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200/60 px-2 py-0.5 rounded font-mono font-bold">SOLO</span>
            </div>

            {savedDesigns.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl" id="saved_empty_state">
                <p className="text-xs text-slate-400 font-medium">아직 보관된 설계안이 없습니다.</p>
                <p className="text-[11px] text-slate-400/80 mt-1 max-w-[200px] mx-auto leading-normal">
                  우측 분석 결과에서 &apos;내 보관함에 저장&apos; 버튼을 클릭하면 차시 수업 설계안이 안전하게 저장됩니다.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1" id="saved_list_scrollbar">
                {savedDesigns.map((design) => {
                  const isCurrent = selectedSavedId === design.id;
                  return (
                    <div
                      key={design.id}
                      onClick={() => handleLoadSavedDesign(design)}
                      className={`group p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        isCurrent 
                          ? "border-teal-500 bg-teal-50/30" 
                          : "border-slate-150 hover:bg-slate-50"
                      }`}
                      id={`saved_item_${design.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                            {design.subject}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold font-mono">
                            {design.grade}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteDesign(design.id, e)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 mt-1.5 line-clamp-1">
                        {design.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {new Date(design.creationDate).toLocaleDateString()} 저장됨
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Section: The Pedagogical Report (7 columns on large screen) */}
        <div className="lg:col-span-7 flex flex-col gap-6" id="output_panel">

          {/* Initial/Ready State or Loader */}
          {!analysis && !isAnalyzing && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm flex flex-col items-center justify-center text-center flex-1 min-h-[450px]" id="empty_output_state">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-100 to-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-200/40 mb-4 animate-pulse">
                <Lightbulb className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">성취기준을 분석할 준비가 완료되었습니다</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                좌측의 <span className="font-bold text-slate-800">샘플 템플릿</span> 중 하나를 선해 해체 효과를 즉시 관찰하거나, 준비하신 국가 교육과정 성취기준 문장을 복사하여 수동 입력창에 붙여넣은 뒤 분석을 돌려 주세요.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 text-left max-w-xl w-full border-t border-slate-100 pt-6">
                <div className="flex gap-2.5 items-start p-3 bg-slate-50/60 rounded-xl border border-slate-200/40">
                  <span className="p-1 px-1.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded select-none font-mono mt-0.5">01</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">인공지능 해체</h4>
                    <p className="text-[11px] text-slate-400/90 mt-0.5">Gemini 3.5 모델을 통해 성취기준에 잠든 고차적 메커니즘을 3차원으로 꿰뚫어 줍니다.</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start p-3 bg-slate-50/60 rounded-xl border border-slate-200/40">
                  <span className="p-1 px-1.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded select-none font-mono mt-0.5">02</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">영속적 이해 공식</h4>
                    <p className="text-[11px] text-slate-400/90 mt-0.5">수년에 걸친 지적 전이가 이루어지는 완결무결한 대주제(Big Idea) 문장 구조를 자동 직조합니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Animation States with Educational Detail */}
          {isAnalyzing && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm flex flex-col justify-center items-center flex-1 min-h-[450px]" id="loading_output_state">
              <div className="flex flex-col items-center max-w-md w-full">
                {/* Custom educational gears animation */}
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 text-emerald-400 rounded-xl flex items-center justify-center animate-spin">
                    <Activity className="w-5 h-5" />
                  </div>
                  <ArrowRight className="text-slate-300 w-4 h-4 animate-pulse" />
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 text-amber-400 rounded-xl flex items-center justify-center animate-bounce">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-slate-800 text-center animate-pulse">2022 개정 성취기준 분석 파이프라인 가동</h3>
                <p className="text-xs text-indigo-600 font-bold tracking-tight mt-1">
                  학교 교육과정 컨설팅 AI 에이전트 구동 중...
                </p>

                <div className="mt-6 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                  <div className="bg-indigo-600 h-full w-[70%] rounded-full animate-pulse"></div>
                </div>

                <div className="flex flex-col gap-2.5 w-full mt-6 text-left border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block animate-ping"></span>
                    <span>1단계: 문법 대조 및 국역 성취기준 맥락 정보 수거 중</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-teal-500 inline-block animate-ping"></span>
                    <span>2단계: 지식·이해, 과정·기능, 가치·태도 3대 인지적 차원 디코딩</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
                    <span>3단계: 삶의 전이를 안내하는 영속적 핵심 아이디어 결합문 빌드</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Render Full Pedagogical Report */}
          {analysis && !isAnalyzing && (
            <div className="flex flex-col gap-6 animate-fadeIn" id="real_report_section">
              
              {/* Header Box with custom titling option and metadata */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm" id="report_metadata_header">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-slate-900 text-slate-100 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase font-mono">
                        {subject === "기타" ? customSubject || "기타" : subject}
                      </span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md font-mono">
                        {grade === "기타" ? customGrade || "기타" : grade}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium select-none">
                        분석 성공
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        onClick={handleCopyMarkdownReport}
                        className="text-[11px] font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                        id="copy_report_markdown"
                        title="Markdown 복사"
                      >
                        {copiedSection === "full-report" ? (
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>전체 내용 마크다운 복사</span>
                      </button>

                      <button
                        onClick={handleSaveDesign}
                        className="text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                        id="save_design_localStorage"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>내 보관함에 저장</span>
                      </button>
                    </div>
                  </div>

                  {/* Customizable plan name for local indexation */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wide">
                      수업 설계안 명칭 수정
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="설계안 별칭을 입력해 주세요 (보관함 인덱스용)"
                      className="border-b border-slate-200 focus:border-indigo-500 bg-transparent text-slate-800 text-sm font-bold pb-1 outline-none font-medium focus:ring-0"
                      id="plan_title_input"
                    />
                  </div>

                  {/* Raw Standards Blockquote */}
                  <div className="bg-slate-50 rounded-xl p-4 border-l-4 border-indigo-500 mt-1 relative">
                    <div className="absolute top-2 right-3 text-[10px] text-slate-300 font-bold select-none">성취기준 원문</div>
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold italic pr-12">
                      &ldquo;{rawStandard}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* CENTERPIECE BANNER: The Big Idea Statement */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-950 text-white rounded-2xl p-6 shadow-md border border-indigo-950 relative overflow-hidden" id="big_idea_centerpiece">
                
                {/* Decorative glow elements */}
                <div className="absolute -right-12 -bottom-12 w-44 h-44 bg-teal-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-12 -top-12 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl"></div>

                <div className="flex items-center justify-between mb-3.5 relative z-10 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-2 rounded-md bg-white/10 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest font-mono">
                      CORE IDEA
                    </div>
                    <h3 className="text-xs font-bold text-slate-100">영속적 핵심 아이디어 (Big Idea)</h3>
                  </div>
                  
                  <button
                    onClick={() => triggerCopy(analysis.core_idea, "core-idea")}
                    className="text-white/60 hover:text-white hover:bg-white/10 rounded-md p-1.5 transition-colors"
                    title="핵심 아이디어 복사"
                  >
                    {copiedSection === "core-idea" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-sm md:text-base leading-relaxed tracking-wide font-medium relative z-10 italic text-slate-100 first-letter:text-2xl first-letter:font-extrabold first-letter:text-teal-300 first-letter:mr-1">
                  &ldquo;{analysis.core_idea}&rdquo;
                </p>

                {/* Analytical breakdown of the formula */}
                <div className="mt-5 pt-4 border-t border-white/10 relative z-10 grid grid-cols-3 gap-2.5 text-center text-[10px] font-medium" id="formula_visualizer_legend">
                  <div className="bg-blue-950/40 border border-blue-500/20 rounded-md p-1.5 text-blue-300">
                    <p className="font-bold underline text-[8px] text-blue-400">지식·이해 영역</p>
                    <p className="line-clamp-1 mt-0.5">내용/개념 지탱</p>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-md p-1.5 text-emerald-300">
                    <p className="font-bold underline text-[8px] text-emerald-400">과정·기능 영역</p>
                    <p className="line-clamp-1 mt-0.5">주체적 행동 방법</p>
                  </div>
                  <div className="bg-pink-950/40 border border-pink-500/20 rounded-md p-1.5 text-pink-300">
                    <p className="font-bold underline text-[8px] text-pink-400">가치·태도 영역</p>
                    <p className="line-clamp-1 mt-0.5">삶의 귀속성/정체성</p>
                  </div>
                </div>
              </div>

              {/* THREE CORE DIMENSIONS GRAPHICS / CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="three_dimensions_cards_grid">
                
                {/* 1. KNOWLEDGE */}
                <div className="bg-white rounded-2xl border-t-4 border-t-blue-500 border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between" id="knowledge_card">
                  <div>
                    <div className="flex items-center gap-2 text-blue-600 mb-3">
                      <Layers className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">지식·이해 (What)</h4>
                    </div>
                    <ul className="flex flex-col gap-2">
                      {analysis.knowledge.map((item, index) => (
                        <li key={index} className="text-xs text-slate-600 font-medium pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-blue-400 leading-normal">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-slate-100/80 mt-4 pt-2 flex justify-between items-center text-[10px] text-slate-400">
                    <span>지적 가사성 확인</span>
                    <button 
                      onClick={() => triggerCopy(analysis.knowledge.join("\n"), "knowledge-list")}
                      className="hover:text-blue-600 transition-colors"
                      title="복사"
                    >
                      {copiedSection === "knowledge-list" ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 2. PROCESS */}
                <div className="bg-white rounded-2xl border-t-4 border-t-emerald-500 border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between" id="process_card">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-600 mb-3">
                      <Activity className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">과정·기능 (How)</h4>
                    </div>
                    <ul className="flex flex-col gap-2">
                      {analysis.process.map((item, index) => (
                        <li key={index} className="text-xs text-slate-600 font-medium pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-400 leading-normal">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-slate-100/80 mt-4 pt-2 flex justify-between items-center text-[10px] text-slate-400">
                    <span>활동 및 탐구 기준</span>
                    <button 
                      onClick={() => triggerCopy(analysis.process.join("\n"), "process-list")}
                      className="hover:text-emerald-600 transition-colors"
                      title="복사"
                    >
                      {copiedSection === "process-list" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 3. ATTITUDE */}
                <div className="bg-white rounded-2xl border-t-4 border-t-pink-500 border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between" id="attitude_card">
                  <div>
                    <div className="flex items-center gap-2 text-pink-600 mb-3">
                      <Heart className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">가치·태도 (Why)</h4>
                    </div>
                    <ul className="flex flex-col gap-2">
                      {analysis.attitude.map((item, index) => (
                        <li key={index} className="text-xs text-slate-600 font-medium pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-pink-400 leading-normal">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-slate-100/80 mt-4 pt-2 flex justify-between items-center text-[10px] text-slate-400">
                    <span>인성 및 정의적 목표</span>
                    <button 
                      onClick={() => triggerCopy(analysis.attitude.join("\n"), "attitude-list")}
                      className="hover:text-pink-600 transition-colors"
                      title="복사"
                    >
                      {copiedSection === "attitude-list" ? <Check className="w-3.5 h-3.5 text-pink-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

              </div>

              {/* CLASSROOM INTERVENTIONS: PERFORMANCE EVALUATION PLANS */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm" id="evaluation_section">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Award className="w-5 h-5 text-indigo-500" />
                    <span>성취기준 맞춤형 교실 수행평가 연계 시나리오</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">루브릭 소스</span>
                </div>

                <div className="flex flex-col gap-3" id="plans_holder">
                  {analysis.evaluation_plans.map((plan, index) => {
                    return (
                      <div key={index} className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-150 transition-colors hover:border-slate-350">
                        <span className="p-1 px-2 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md select-none font-mono">
                          과제 {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-700 leading-relaxed">
                            {plan}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RATIONALE & ANALYTICAL REVIEW */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm" id="rationale_section">
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 text-sm border-b border-slate-150/40 pb-2">
                  <Info className="w-5 h-5 text-indigo-500" />
                  <span>수석교사 교육과정 해설 및 Rationale</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {analysis.rationale}
                </p>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-4 md:px-8 border-t border-slate-800 text-center text-xs mt-12" id="app_footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-medium text-slate-500 text-[11px]">
            &copy; 2026. 교원 AI 디지털 기반 수업 역량 강화 직무연수(심화과정) - 학습 설계 솔루션 Design by HorimT
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400/90 font-medium">
            <span>대한민국 상위 1% 역량 중심 교육과정 재구성 지원 에이전트</span>
            <span className="text-slate-750">|</span>
            <span className="text-indigo-400">Gemini 3.5 Flash Model Powered</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
