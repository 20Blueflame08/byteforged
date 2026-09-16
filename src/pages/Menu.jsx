import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { sounds } from '../lib/soundEngine';
import { 
  BookOpen, Unlock, ArrowRight, CheckCircle2, 
  Layers, ChevronRight, Zap, Award, Sparkles, Target, Compass
} from 'lucide-react';

const COURSES = [
  { 
    id: 'ict-fund', 
    title: 'ICT Fundamentals', 
    category: 'Core Syllabus', 
    description: 'Comprehensive SHS curriculum covering hardware, software, networking, databases, and digital security.' 
  },
  { 
    id: 'cs-year1', 
    title: 'Computer Science Guide 1', 
    category: 'Elective', 
    description: 'Foundational CS principles including logic gates, Boolean algebra, algorithms, and modular programming.' 
  },
];

const TOPICS = {
  'ict-fund': [
    { id: 'ict-101', title: '1. Introduction to Information & Communication Technology', notes: 30, tests: 15 },
    { id: 'ict-102', title: '2. Computer Systems & Hardware Architecture', notes: 30, tests: 15 },
    { id: 'ict-103', title: '3. Input & Output Devices Engineering', notes: 30, tests: 15 },
    { id: 'ict-104', title: '4. Storage Media & Memory Management (RAM/ROM)', notes: 30, tests: 15 },
    { id: 'ict-105', title: '5. System Software & Operating Systems', notes: 30, tests: 15 },
    { id: 'ict-106', title: '6. Application Software & Productivity Tools', notes: 30, tests: 15 },
    { id: 'ict-107', title: '7. Data Communication & Computer Networks', notes: 30, tests: 15 },
    { id: 'ict-108', title: '8. Internet, WWW, & Web Browsing Security', notes: 30, tests: 15 },
    { id: 'ict-109', title: '9. Information Security & Cyber Hygiene', notes: 30, tests: 15 },
    { id: 'ict-110', title: '10. Data Processing & File System Management', notes: 30, tests: 15 },
    { id: 'ict-111', title: '11. Multimedia Systems & Digital Content Creation', notes: 30, tests: 15 },
    { id: 'ict-112', title: '12. Database Management Systems (DBMS) Fundamentals', notes: 30, tests: 15 },
    { id: 'ict-113', title: '13. Systems Development & Problem-Solving Logic', notes: 30, tests: 15 },
    { id: 'ict-114', title: '14. Ethical, Legal, & Environmental Impacts of ICT', notes: 30, tests: 15 },
  ],
  'cs-year1': [
    { id: 'cs-201', title: '1. Foundations of CS & Algorithmic Thinking', notes: 30, tests: 15 },
    { id: 'cs-202', title: '2. Number Systems & Binary Arithmetic', notes: 30, tests: 15 },
    { id: 'cs-203', title: '3. Digital Logic Gates & Circuit Design', notes: 30, tests: 15 },
    { id: 'cs-204', title: '4. Boolean Algebra & Circuit Simplification', notes: 30, tests: 15 },
    { id: 'cs-205', title: '5. Introduction to Programming Logic & Pseudocode', notes: 30, tests: 15 },
    { id: 'cs-206', title: '6. Variable Types, Operations, & Expressions', notes: 30, tests: 15 },
    { id: 'cs-207', title: '7. Control Structures: Conditionals & Branching', notes: 30, tests: 15 },
    { id: 'cs-208', title: '8. Control Structures: Loops & Iteration Logic', notes: 30, tests: 15 },
    { id: 'cs-209', title: '9. Arrays, Vectors, & Linear Data Structures', notes: 30, tests: 15 },
    { id: 'cs-210', title: '10. Functions, Modules, & Program Scope', notes: 30, tests: 15 },
    { id: 'cs-211', title: '11. Basic Searching & Sorting Algorithms', notes: 30, tests: 15 },
    { id: 'cs-212', title: '12. Introduction to Software Testing & Debugging', notes: 30, tests: 15 },
  ]
};

export default function Menu() {
  const store = useAppStore();

  const [useDynamicThreshold, setUseDynamicThreshold] = useState(false);

  const selectedCourseId = store.selectedCourseId || 'ict-fund';
  const setSelectedCourse = store.setSelectedCourse || store.setSelectedCourseId || (() => {});
  const selectedTopicId = store.selectedTopicId || 'ict-101';
  const setSelectedTopic = store.setSelectedTopic || store.setSelectedTopicId || (() => {});
  const setActiveTab = store.setActiveTab || (() => {});
  const topicProgress = store.topicProgress || {};
  const savePageState = store.savePageState || (() => {});

  const currentCourseId = TOPICS[selectedCourseId] ? selectedCourseId : 'ict-fund';
  const activeCourse = COURSES.find((c) => c.id === currentCourseId) || COURSES[0];
  const activeTopics = TOPICS[currentCourseId] || [];

  const getRequiredScoreForTopic = (index, totalTopics) => {
    if (!useDynamicThreshold) return 50;
    if (totalTopics <= 1) return 30;
    return Math.min(90, Math.floor(30 + ((90 - 30) / (totalTopics - 1)) * index));
  };

  const handleSelectCourse = (courseId) => {
    try { sounds?.playClick?.(); } catch (e) {}
    setSelectedCourse(courseId);
    savePageState('menu', { selectedCourseId: courseId });
  };

  const handleSelectTopic = (topicId) => {
    try { sounds?.playClick?.(); } catch (e) {}
    setSelectedTopic(topicId);
    savePageState('menu', { selectedCourseId: currentCourseId, selectedTopicId: topicId });
  };

  const handleLaunchTopic = (e, topicId) => {
    e.stopPropagation();
    try { sounds?.playUnlock?.(); } catch (e) {}
    setSelectedTopic(topicId);
    savePageState('menu', { selectedCourseId: currentCourseId, selectedTopicId: topicId });
    setActiveTab('home');
  };

  const toggleThresholdMode = () => {
    try { sounds?.playClick?.(); } catch (e) {}
    setUseDynamicThreshold(!useDynamicThreshold);
  };

  return (
    <div className="w-full max-w-[1650px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-mono select-none antialiased min-h-screen relative">
      
      {/* Gold/Amber Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-yellow-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-orange-400/5 rounded-full blur-[100px]" />
      </div>

      {/* Header Banner Hub — Frosted Glass */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/40 border border-amber-500/20 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-amber-500/10">
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-yellow-400/8 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold tracking-widest uppercase backdrop-blur-sm">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Curriculum Control Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center space-x-3.5 tracking-wide">
              <BookOpen className="text-amber-400 w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300">
                COURSE SELECTION HUB
              </span>
            </h1>
            <p className="text-amber-100/60 text-sm sm:text-base leading-relaxed">
              Explore all modules freely. Achieve a Unified Topic Progress <span className="text-emerald-400 font-bold">≥ 50%</span> to secure a <span className="text-emerald-400 font-bold">PASS</span> status.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={toggleThresholdMode}
              className={`px-4.5 py-3 rounded-xl border text-sm font-bold transition-all duration-300 flex items-center space-x-2.5 shadow-lg active:scale-95 backdrop-blur-sm ${
                useDynamicThreshold
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30 shadow-amber-500/20 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/60 border-slate-700 text-amber-400 hover:bg-slate-800/80 shadow-amber-500/10 ring-1 ring-amber-500/20'
              }`}
            >
              <Zap className={`w-4 h-4 ${useDynamicThreshold ? 'animate-pulse text-amber-400' : 'text-amber-400'}`} />
              <span className="tracking-wide">
                {useDynamicThreshold ? '⚡ MODE: DYNAMIC (30% ➔ 90%)' : '🔒 MODE: UNIFIED PASS (50%)'}
              </span>
            </button>

            <div className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-200 text-sm hidden xl:flex items-center space-x-2 shadow-inner backdrop-blur-sm">
              <Compass className="w-4.5 h-4.5 text-amber-400" />
              <span>Active Course:</span>
              <span className="text-amber-300 font-bold tracking-wide">{activeCourse.title}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Course Sidebar — Frosted Glass */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm uppercase text-amber-200/70 tracking-wider font-bold flex items-center space-x-2">
              <Layers className="w-4.5 h-4.5 text-amber-400" />
              <span>Available Courses ({COURSES.length})</span>
            </h2>
          </div>

          <div className="space-y-4">
            {COURSES.map((course) => {
              const isSelected = currentCourseId === course.id;
              return (
                <div
                  key={course.id}
                  onClick={() => handleSelectCourse(course.id)}
                  className={`group p-5 sm:p-6 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden active:scale-[0.99] backdrop-blur-2xl ${
                    isSelected
                      ? 'bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-amber-500/10 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-900/40 border-slate-700 hover:border-amber-500/40 hover:bg-slate-900/60'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500 shadow-[0_0_12px_#f59e0b]"></div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs px-3 py-1 rounded-md font-bold tracking-wider uppercase border ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300'
                    }`}>
                      {course.category}
                    </span>
                    <ChevronRight className={`w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 ${
                      isSelected ? 'text-amber-400' : 'text-slate-500'
                    }`} />
                  </div>

                  <h3 className="text-lg font-bold text-white mt-3.5 tracking-wide group-hover:text-amber-300 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed font-sans">
                    {course.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topic Roadmap Section — Frosted Glass */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 px-1">
            <h2 className="text-sm uppercase text-amber-200/70 tracking-wider font-bold flex items-center space-x-2">
              <Target className="w-4.5 h-4.5 text-amber-400" />
              <span>Module Roadmap ({activeTopics.length} Topics - All Unlocked)</span>
            </h2>
            
            <div className="text-sm text-slate-200 flex items-center space-x-2 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-700 shadow-sm backdrop-blur-sm">
              <span className="text-slate-400">Pass Target:</span>
              <strong className={`font-bold ${useDynamicThreshold ? 'text-amber-400' : 'text-emerald-400'}`}>
                {useDynamicThreshold ? 'Dynamic Escalating (30% ➔ 90%)' : 'Unified Progress ≥ 50%'}
              </strong>
            </div>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1.5 custom-scrollbar">
            {activeTopics.map((topic, index) => {
              const topicData = topicProgress[topic.id] || {};
              const actualProgress = topicData.actualProgress !== undefined ? topicData.actualProgress : 0;
              const quizScore = topicData.quizScore !== undefined ? topicData.quizScore : 0;
              
              const unifiedProgress = topicData.progress !== undefined 
                ? topicData.progress 
                : Math.round((quizScore + actualProgress) / 2);

              const targetThreshold = getRequiredScoreForTopic(index, activeTopics.length);
              
              const isPassed = topicData.isPassed ?? (unifiedProgress >= targetThreshold);
              const isSelected = selectedTopicId === topic.id;

              return (
                <div
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic.id)}
                  className={`group p-5 sm:p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-300 cursor-pointer relative overflow-hidden active:scale-[0.995] backdrop-blur-2xl ${
                    isPassed
                      ? 'bg-gradient-to-r from-emerald-950/20 via-slate-900/60 to-emerald-950/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                      : isSelected
                      ? 'bg-slate-900/60 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                      : 'bg-slate-900/40 border-slate-700 hover:border-amber-500/40 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start sm:items-center space-x-4 min-w-0">
                    <div className={`p-3.5 rounded-xl border flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                      isPassed
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    }`}>
                      {isPassed ? <CheckCircle2 className="w-6 h-6" /> : <Unlock className="w-5 h-5" />}
                    </div>

                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-2.5">
                        <h4 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">{topic.title}</h4>
                        {isPassed && (
                          <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center space-x-1 shadow-sm">
                            <Award className="w-3.5 h-3.5" />
                            <span>PASSED</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-slate-300 font-sans">
                        <span>
                          Unified: <strong className={unifiedProgress >= 50 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{unifiedProgress}%</strong>
                        </span>
                        <span className="text-slate-600">•</span>
                        <span>
                          Quiz: <strong className="text-amber-400 font-bold">{quizScore}%</strong> / Module: <strong className="text-amber-400 font-bold">{actualProgress}%</strong>
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 font-mono text-xs">{topic.notes} Notes / {topic.tests} Cards</span>
                      </div>

                      <div className="w-full max-w-md h-2 bg-slate-800/80 rounded-full overflow-hidden mt-2">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            isPassed ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_8px_#f59e0b]'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, unifiedProgress))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleLaunchTopic(e, topic.id)}
                    className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl border transition-all duration-300 text-sm font-bold self-end md:self-auto w-full md:w-auto flex-shrink-0 shadow-md backdrop-blur-sm ${
                      isPassed
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-400 hover:text-slate-950 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'bg-amber-500/15 border-amber-500/50 text-amber-300 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:text-slate-950 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    }`}
                  >
                    <span>LAUNCH</span>
                    <ArrowRight className="w-4.5 h-4.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}