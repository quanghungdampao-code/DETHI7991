export type QuestionType = 'MCQ' | 'TF' | 'SA';
export type DifficultyLevel = 'NB' | 'TH' | 'VD' | 'VDC';
export type ModelType = 'gemini-2.5-flash' | 'gemini-3-pro-preview';

export interface TopicPlan {
  id: string;
  topic: string;
  type: QuestionType;
  count: number;
  level: DifficultyLevel;
}

export interface ExamConfig {
  grade: string;
  subject: string; // Defaults to Math but can be flexible
  model: ModelType;
  outputFormat: 'latex' | 'word';
}

export interface GeneratedExam {
  content: string;
  timestamp: string;
  counts: {
    MCQ: number;
    TF: number;
    SA: number;
  };
}

export const QUESTION_TYPES: Record<QuestionType, string> = {
  MCQ: 'Trắc nghiệm (TNKQ)',
  TF: 'Đúng/Sai (Đ/S)',
  SA: 'Trả lời ngắn (TL)'
};

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, string> = {
  NB: 'Nhận biết',
  TH: 'Thông hiểu',
  VD: 'Vận dụng',
  VDC: 'Vận dụng cao'
};