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

export interface CustomQuestion {
  q: string;
  answer?: string;
  explanation?: string;
  options?: string[];
  correct_answer?: string;
  parts?: string[];
}

export interface QuestionResponse {
  questions: Question[];
  total_questions: number;
  source: string;
  raw_response?: string;
  error?: string;
}

export interface RecommendedResource {
  title: string;
  type: string;
  url: string;
  description: string;
}

export interface RecommendedResourcesSection {
  topic: string;
  resources: RecommendedResource[];
}

export interface ModelPaperSection {
  section_name: string;
  marks_per_question: number;
  total_marks: number;
  instructions: string;
  questions: Question[];
}

export interface ModelPaper {
  paper_title?: string;
  duration?: string;
  total_marks?: number;
  instructions?: string[];
  sections?: ModelPaperSection[];
  answer_key?: any[];
  // Custom paper format
  title?: string;
  meta?: {
    topic: string;
    difficulty: string;
    type: string;
    count: number;
  };
  questions?: CustomQuestion[];
  recommended_resources?: RecommendedResourcesSection;
}

export interface GenerateRequest {
  source: Subject;
  num_questions: number;
  question_type: QuestionType;
  difficulty: Difficulty;
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  key_points_missed: string[];
  suggested_improvements: string;
  comparison_with_model_answer: string;
  overall_assessment: string;
  error?: string;
}

export interface StructuredAnswerEvaluation {
  part_a: {
    score: number;
    feedback: string;
    status: "excellent" | "good" | "satisfactory" | "needs_improvement" | "insufficient";
  };
  part_b: {
    score: number;
    feedback: string;
    status: "excellent" | "good" | "satisfactory" | "needs_improvement" | "insufficient";
  };
  part_c: {
    score: number;
    feedback: string;
    status: "excellent" | "good" | "satisfactory" | "needs_improvement" | "insufficient";
  };
  overall_score: number;
  overall_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  key_points_missed: string[];
  error?: string;
}
