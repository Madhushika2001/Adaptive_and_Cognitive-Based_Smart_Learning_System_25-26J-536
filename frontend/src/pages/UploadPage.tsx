import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';
import Button from '../components/Button';
import Select from '../components/Select';
import NumberInput from '../components/NumberInput';
import QuestionCard from '../components/QuestionCard';
import { questionApi } from '../api';
import type { Question, QuestionType, Difficulty } from '../types';

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

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionType, setQuestionType] = useState<QuestionType>('mixed');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a PDF file');
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please drop a PDF file');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setError(null);
    setQuestions([]);

    try {
      const response = await questionApi.generateFromPdf(
        file,
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload PDF</h1>
        <p className="text-gray-600">
          Upload your lecture notes or study materials to generate custom questions
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Document</h2>

        {!file ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Drag and drop your PDF file here, or click to browse
            </p>
            <p className="text-gray-400 text-sm">Supports PDF files up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-10 h-10 text-red-500" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Generation Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
          disabled={!file}
          size="lg"
          className="w-full md:w-auto"
        >
          Generate Questions from PDF
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
          <p className="text-gray-600">Processing PDF and generating questions...</p>
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
