// Question types
export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'mixed';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Subject = 'dl' | 'da' | 'ime';

export interface Question {
  id: number;
  type: string;
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  topic: string;
}

export interface QuestionResponse {
  questions: Question[];
  total_questions: number;
  source: string;
  raw_response?: string;
  error?: string;
}

export interface ModelPaperSection {
  section_name: string;
  marks_per_question: number;
  total_marks: number;
  instructions: string;
  questions: Question[];
}

export interface ModelPaper {
  paper_title: string;
  duration: string;
  total_marks: number;
  instructions: string[];
  sections: ModelPaperSection[];
  answer_key: any[];
}

export interface GenerateRequest {
  source: Subject;
  num_questions: number;
  question_type: QuestionType;
  difficulty: Difficulty;
}
