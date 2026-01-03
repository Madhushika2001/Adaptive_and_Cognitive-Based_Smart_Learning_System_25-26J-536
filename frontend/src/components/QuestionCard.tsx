import type { Question } from '../types';
import { CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface QuestionCardProps {
  question: Question;
  index: number;
  showAnswer?: boolean;
}

export default function QuestionCard({ question, index, showAnswer = false }: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(showAnswer);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mcq':
        return 'bg-blue-100 text-blue-800';
      case 'short_answer':
        return 'bg-green-100 text-green-800';
      case 'long_answer':
        return 'bg-purple-100 text-purple-800';
      case 'true_false':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 bg-gray-900 text-white rounded-full text-sm font-bold">
            {index}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(question.type)}`}>
            {question.type.replace('_', ' ').toUpperCase()}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty.toUpperCase()}
          </span>
        </div>
        {question.topic && (
          <span className="text-sm text-gray-500">{question.topic}</span>
        )}
      </div>

      {/* Question */}
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {question.question}
      </h3>

      {/* Options for MCQ */}
      {question.options && question.options.length > 0 && (
        <div className="space-y-2 mb-4">
          {question.options.map((option, optIndex) => (
            <div
              key={optIndex}
              className={`p-3 rounded-lg border ${
                isExpanded && option.startsWith(question.correct_answer?.charAt(0))
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option}
            </div>
          ))}
        </div>
      )}

      {/* Toggle Answer Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-4 h-4 mr-1" />
            Hide Answer
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 mr-1" />
            Show Answer
          </>
        )}
      </button>

      {/* Answer & Explanation */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <span className="font-medium text-gray-900">Answer: </span>
              <span className="text-gray-700">{question.correct_answer}</span>
            </div>
          </div>
          {question.explanation && (
            <div className="flex items-start gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <span className="font-medium text-gray-900">Explanation: </span>
                <span className="text-gray-700">{question.explanation}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
