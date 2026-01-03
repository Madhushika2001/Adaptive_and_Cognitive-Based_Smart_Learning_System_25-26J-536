import { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import Select from '../components/Select';
import NumberInput from '../components/NumberInput';
import QuestionCard from '../components/QuestionCard';
import { questionApi } from '../api';
import type { Question, QuestionType, Difficulty, Subject } from '../types';

const subjectOptions = [
  { value: 'dl', label: 'Deep Learning' },
  { value: 'da', label: 'Data Analytics' },
  { value: 'ime', label: 'IME' },
];

const questionTypeOptions = [
  { value: 'mixed', label: 'Mixed (All Types)' },
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer', label: 'Long Answer' },
  { value: 'true_false', label: 'True/False' },
];

const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function GeneratePage() {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subject') || 'dl';

  const [subject, setSubject] = useState<Subject>(initialSubject as Subject);
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionType, setQuestionType] = useState<QuestionType>('mixed');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);

    try {
      const response = await questionApi.generateFromStored(
        subject,
        numQuestions,
        questionType,
        difficulty
      );

      if (response.questions && response.questions.length > 0) {
        setQuestions(response.questions);
      } else if (response.error) {
        setError(response.error);
      } else {
        setError('No questions were generated. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Questions</h1>
        <p className="text-gray-600">
          Generate AI-powered exam questions from your course materials
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Select
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject)}
            options={subjectOptions}
          />
          
          <NumberInput
            label="Number of Questions"
            value={numQuestions}
            onChange={setNumQuestions}
            min={1}
            max={50}
          />
          
          <Select
            label="Question Type"
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as QuestionType)}
            options={questionTypeOptions}
          />
          
          <Select
            label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            options={difficultyOptions}
          />
        </div>

        <Button
          onClick={handleGenerate}
          loading={loading}
          icon={<Sparkles className="w-5 h-5" />}
          size="lg"
          className="w-full md:w-auto"
        >
          Generate Questions
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Generating questions...</p>
          <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
        </div>
      )}

      {/* Results */}
      {!loading && questions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Generated Questions ({questions.length})
            </h2>
            <Button variant="outline" size="sm">
              Export PDF
            </Button>
          </div>
          
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id || index}
              question={question}
              index={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
