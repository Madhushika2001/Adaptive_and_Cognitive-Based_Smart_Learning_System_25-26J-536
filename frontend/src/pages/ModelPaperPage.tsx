import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  AlertCircle, 
  Download, 
  Printer, 
  Clock, 
  Award, 
  BookOpen, 
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Play,
  Users,
  Star,
  ArrowRight
} from 'lucide-react';
import Button from '../components/Button';
import { questionApi } from '../api';
import type { Subject, ModelPaper } from '../types';

const subjects = [
  { 
    id: 'dl', 
    name: 'Deep Learning', 
    code: 'SE4050',
    instructor: 'Dr. Sarah Chen',
    totalLessons: 24,
    completedLessons: 18,
    rating: 4.8,
    students: 156,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
    color: 'from-violet-600 to-indigo-600',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-200'
  },
  { 
    id: 'da', 
    name: 'Data Analytics', 
    code: 'SE4040',
    instructor: 'Prof. Michael Lee',
    totalLessons: 20,
    completedLessons: 12,
    rating: 4.6,
    students: 189,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
    color: 'from-emerald-600 to-teal-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200'
  },
  { 
    id: 'ime', 
    name: 'Innovation & Entrepreneurship', 
    code: 'SE4030',
    instructor: 'Dr. Amanda Foster',
    totalLessons: 16,
    completedLessons: 8,
    rating: 4.9,
    students: 134,
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=200&fit=crop',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200'
  },
];

const paperTemplates = [
  { id: 'midterm', name: 'Mid-Term Exam', mcq: 15, short: 3, long: 2, marks: 50, duration: '1.5 hours', icon: '📝' },
  { id: 'final', name: 'Final Exam', mcq: 25, short: 5, long: 3, marks: 100, duration: '3 hours', icon: '📋' },
  { id: 'quiz', name: 'Quick Quiz', mcq: 10, short: 0, long: 0, marks: 20, duration: '30 minutes', icon: '⚡' },
  { id: 'custom', name: 'Custom Paper', mcq: 10, short: 5, long: 3, marks: 100, duration: '2 hours', icon: '✏️' },
];

export default function ModelPaperPage() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<Subject>('dl');
  const [selectedTemplate, setSelectedTemplate] = useState('final');
  const [mcqCount, setMcqCount] = useState(25);
  const [shortCount, setShortCount] = useState(5);
  const [longCount, setLongCount] = useState(3);
  const [totalMarks, setTotalMarks] = useState(100);
  const [duration, setDuration] = useState('3 hours');
  const [showConfig, setShowConfig] = useState(false);

  const [paper, setPaper] = useState<ModelPaper | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'result'>('select');

  const currentSubject = subjects.find(s => s.id === selectedSubject) || subjects[0];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = paperTemplates.find(t => t.id === templateId);
    if (template) {
      setMcqCount(template.mcq);
      setShortCount(template.short);
      setLongCount(template.long);
      setTotalMarks(template.marks);
      setDuration(template.duration);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setPaper(null);

    try {
      const response = await questionApi.generateModelPaper(selectedSubject, {
        totalMarks,
        duration,
        mcqCount,
        shortCount,
        longCount,
      });

      if (response) {
        setPaper(response);
        setStep('result');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate model paper');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen print:bg-white">
      {/* Page Header */}
      <div className="mb-8 print:hidden">
        <h1 className="text-[32px] font-semibold text-[#055160] mb-2">Model Paper Generator</h1>
        <p className="text-[#000000] text-[16px] font-normal">Select a course and generate AI-powered examination papers</p>
      </div>

      {step === 'select' && (
        <>
          {/* Course Selection Grid */}
          <div className="mb-8 print:hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Select Course</h2>
              <span className="text-sm text-gray-500">{subjects.length} courses available</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => {
                const progress = Math.round((subject.completedLessons / subject.totalLessons) * 100);
                const isSelected = selectedSubject === subject.id;
                
                return (
                  <div
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject.id as Subject)}
                    className={`bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 cursor-pointer ${
                      isSelected 
                        ? 'ring-2 ring-[#44A673] shadow-lg scale-[1.02]' 
                        : 'shadow-sm hover:shadow-md border border-gray-100'
                    }`}
                  >
                    {/* Course Image */}
                    <div className="relative h-32 overflow-hidden">
                      <img 
                        src={subject.image} 
                        alt={subject.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-white/80 text-xs font-medium">{subject.code}</span>
                        <h3 className="text-white font-bold text-lg leading-tight">{subject.name}</h3>
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-[#44A673] rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Course Details */}
                    <div className="p-4">
                      {/* Instructor */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#44A673] to-[#158289] flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {subject.instructor.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">{subject.instructor}</span>
                      </div>
                      
                      {/* Stats Row */}
                      <div className="flex items-center justify-between text-sm mb-3">
                        <div className="flex items-center gap-1 text-gray-500">
                          <BookOpen className="w-4 h-4" />
                          <span>{subject.totalLessons} lessons</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>{subject.students}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-gray-700 font-medium">{subject.rating}</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-medium text-gray-700">{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${progress}%`,
                              background: 'linear-gradient(90deg, #44A673 0%, #2E967E 50%, #158289 100%)'
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <button 
                        className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                          isSelected
                            ? 'text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                        style={isSelected ? { background: 'linear-gradient(90deg, #44A673 0%, #2E967E 50%, #158289 100%)' } : undefined}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Selected
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Select Course
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6 print:hidden">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end print:hidden">
            <Button
              onClick={() => navigate(`/model-paper/${selectedSubject}`)}
              // onClick={handleGenerate}
              loading={loading}
              size="lg"
              icon={<Sparkles className="w-5 h-5" />}
              className="!px-8 cursor-pointer"
              style={{ background: 'linear-gradient(90deg, #44A673 0%, #2E967E 50%, #158289 100%)' }}
            >
              Generate Model Paper
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ background: 'linear-gradient(90deg, #44A673 0%, #2E967E 50%, #158289 100%)' }}
                >
                  <div className="animate-spin w-8 h-8 border-3 border-white border-t-transparent rounded-full" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Generating Your Paper</h3>
                <p className="text-gray-500">AI is creating questions based on {currentSubject.name} materials...</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Result View */}
      {step === 'result' && paper && !loading && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between print:hidden">
            <button
              onClick={() => setStep('select')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Generate Another
            </button>
            <div className="flex gap-3">
              <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                Download PDF
              </Button>
              <Button 
                icon={<Printer className="w-4 h-4" />} 
                onClick={handlePrint}
                style={{ background: 'linear-gradient(90deg, #44A673 0%, #2E967E 50%, #158289 100%)' }}
              >
                Print Paper
              </Button>
            </div>
          </div>

          {/* Paper Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 print:shadow-none print:border-0">
            <div className="p-8 print:p-0">
              {/* Paper Header */}
              <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
                <div 
                  className="inline-block px-4 py-1 rounded-full text-white text-sm font-medium mb-3"
                  style={{ background: 'linear-gradient(90deg, #44A673 0%, #2E967E 50%, #158289 100%)' }}
                >
                  {currentSubject.code}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {paper.paper_title || `${currentSubject.name} Examination`}
                </h1>
                <div className="flex justify-center gap-8 text-gray-600 mt-4">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#44A673]" />
                    Duration: {paper.duration}
                  </span>
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#44A673]" />
                    Total Marks: {paper.total_marks}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              {paper.instructions && paper.instructions.length > 0 && (
                <div className="mb-8 p-4 rounded-xl bg-[#F2F8F5] border border-[#44A673]/20">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Instructions:</h2>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {paper.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sections (for traditional model paper format) */}
              {paper.sections && paper.sections.length > 0 && paper.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-8">
                  <div 
                    className="text-white p-4 rounded-xl mb-4"
                    style={{ background: 'linear-gradient(90deg, #44A673 0%, #2E967E 50%, #158289 100%)' }}
                  >
                    <h2 className="text-lg font-bold">{section.section_name}</h2>
                    <p className="text-white/80 text-sm">
                      {section.instructions} • {section.marks_per_question} marks each • Total: {section.total_marks} marks
                    </p>
                  </div>

                  <div className="space-y-4 pl-4">
                    {section.questions && section.questions.map((question, qIndex) => (
                      <div key={qIndex} className="border-b border-gray-100 pb-4 last:border-0">
                        <p className="font-medium text-gray-900 mb-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#44A673]/10 text-[#44A673] text-sm font-bold mr-2">
                            {qIndex + 1}
                          </span>
                          {question.question}
                        </p>
                        {question.options && (
                          <div className="ml-8 space-y-2">
                            {question.options.map((option, oIndex) => (
                              <p key={oIndex} className="text-gray-700 flex items-start gap-2">
                                <span className="font-medium text-gray-500">{String.fromCharCode(65 + oIndex)}.</span>
                                {option.replace(/^[A-D][\.\)]\s*/, '')}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Custom Paper Format (flat questions with answers) */}
              {paper.questions && paper.questions.length > 0 && (!paper.sections || paper.sections.length === 0) && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {paper.questions.map((question, qIndex) => (
                      <div key={qIndex} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        {/* Question */}
                        <p className="font-semibold text-gray-900 mb-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#44A673]/10 text-[#44A673] text-sm font-bold mr-2">
                            {qIndex + 1}
                          </span>
                          {question.q}
                        </p>

                        {/* Options (for MCQ) */}
                        {question.options && (
                          <div className="ml-8 space-y-2 mb-4">
                            {question.options.map((option, oIndex) => (
                              <p key={oIndex} className="text-gray-700 flex items-start gap-2">
                                <span className="font-medium text-gray-500">{String.fromCharCode(65 + oIndex)}.</span>
                                {option.replace(/^[A-D][\.\)]\s*/, '')}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Answer Key */}
                        {question.answer && (
                          <div className="ml-4 p-3 bg-[#F2F8F5] rounded-lg border border-[#44A673]/20 mb-3">
                            <p className="text-sm font-semibold text-[#055160] mb-1">Answer:</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{question.answer}</p>
                          </div>
                        )}

                        {/* Explanation */}
                        {question.explanation && (
                          <div className="ml-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-1">Explanation:</p>
                            <p className="text-sm text-blue-800">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Resources */}
              {(paper as any).recommended_resources && (paper as any).recommended_resources.resources && (paper as any).recommended_resources.resources.length > 0 && (
                <div className="mt-12 pt-8 border-t-2 border-gray-200">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommended Learning Resources</h2>
                    <p className="text-gray-600">
                      Enhance your understanding of <span className="font-semibold">{(paper as any).recommended_resources.topic}</span> with these curated materials:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(paper as any).recommended_resources.resources.map((resource: any, idx: number) => (
                      <a
                        key={idx}
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-[#44A673] transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="inline-block px-2.5 py-1 bg-[#44A673]/10 text-[#44A673] text-xs font-medium rounded">
                            {resource.type}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#44A673] transition-colors" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-[#44A673] transition-colors">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-gray-600">{resource.description}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
