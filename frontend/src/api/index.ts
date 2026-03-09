import axios from "axios";
import type {
  QuestionType,
  Difficulty,
  Subject,
  QuestionResponse,
  ModelPaper,
  AnswerEvaluation,
  StructuredAnswerEvaluation,
} from "../types";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const questionApi = {
  // Generate questions from stored content
  generateFromStored: async (
    source: Subject,
    numQuestions: number = 10,
    questionType: QuestionType = "mixed",
    difficulty: Difficulty = "medium",
  ): Promise<QuestionResponse> => {
    const response = await api.get(`/questions/generate/stored/${source}`, {
      params: {
        num_questions: numQuestions,
        question_type: questionType,
        difficulty: difficulty,
      },
    });
    return response.data;
  },

  // Generate questions from PDF
  generateFromPdf: async (
    file: File,
    numQuestions: number = 10,
    questionType: QuestionType = "mixed",
    difficulty: Difficulty = "medium",
  ): Promise<QuestionResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/questions/generate/pdf", formData, {
      params: {
        num_questions: numQuestions,
        question_type: questionType,
        difficulty: difficulty,
      },
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Generate questions from text
  generateFromText: async (
    content: string,
    numQuestions: number = 10,
    questionType: QuestionType = "mixed",
    difficulty: Difficulty = "medium",
  ): Promise<QuestionResponse> => {
    const response = await api.post("/questions/generate/text", {
      content,
      num_questions: numQuestions,
      question_type: questionType,
      difficulty: difficulty,
    });
    return response.data;
  },

  // Generate model paper from stored content
  generateModelPaper: async (
    source: Subject,
    config: {
      totalMarks?: number;
      duration?: string;
      mcqCount?: number;
      shortCount?: number;
      longCount?: number;
    } = {},
  ): Promise<ModelPaper> => {
    const response = await api.get(`/questions/model-paper/stored/${source}`, {
      params: {
        total_marks: config.totalMarks || 100,
        duration: config.duration || "3 hours",
        mcq_count: config.mcqCount || 10,
        short_count: config.shortCount || 5,
        long_count: config.longCount || 3,
      },
    });
    return response.data;
  },

  // Generate personalized questions
  generatePersonalized: async (
    subject: Subject,
    numQuestions: number = 5,
    questionType: QuestionType = "mixed",
  ): Promise<QuestionResponse> => {
    const response = await api.get(
      `/questions/generate/personalized/${subject}`,
      {
        params: {
          num_questions: numQuestions,
          question_type: questionType,
        },
      },
    );
    return response.data;
  },

  // Get available personalized models
  getAvailableModels: async (): Promise<{
    available_models: string[];
    device: string;
  }> => {
    const response = await api.get("/questions/personalized/models");
    return response.data;
  },

  // Generate custom paper with specific topic, difficulty, type, and count
  generateCustomPaper: async (
    subject: Subject,
    config: {
      topic: string;
      difficulty: string;
      questionType: string;
      count: number;
    },
  ): Promise<ModelPaper> => {
    const response = await api.get(`/questions/generate/custom/${subject}`, {
      params: {
        topic: config.topic,
        difficulty: config.difficulty.toLowerCase(),
        question_type: config.questionType.toLowerCase().replace(" ", "_"),
        num_questions: config.count,
      },
    });
    return response.data;
  },

  // Evaluate a user's answer against the model answer
  evaluateAnswer: async (
    question: string,
    userAnswer: string,
    modelAnswer: string,
    questionType: string = "short_answer",
    topic: string = "General",
  ): Promise<AnswerEvaluation> => {
    const response = await api.post("/questions/evaluate/answer", {
      question,
      user_answer: userAnswer,
      model_answer: modelAnswer,
      question_type: questionType,
      topic,
    });
    return response.data;
  },

  // Evaluate a structured answer with parts (a), (b), (c)
  evaluateStructuredAnswer: async (
    question: string,
    partAUser: string,
    partAModel: string,
    partBUser: string,
    partBModel: string,
    partCUser: string,
    partCModel: string,
    topic: string = "General",
  ): Promise<StructuredAnswerEvaluation> => {
    const response = await api.post("/questions/evaluate/structured-answer", {
      question,
      part_a_user: partAUser,
      part_a_model: partAModel,
      part_b_user: partBUser,
      part_b_model: partBModel,
      part_c_user: partCUser,
      part_c_model: partCModel,
      topic,
    });
    return response.data;
  },

  // Validate exam submission
  validateSubmission: async (
    questions: any[],
    paperType: string,
    topic: string = "General",
  ) => {
    const response = await api.post("/questions/validate-submission", {
      questions,
      paper_type: paperType,
      topic,
    });
    return response.data;
  },
};
