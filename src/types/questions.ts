export type QuestionType = 'single' | 'multi' | 'open';

export interface LocalizedText {
  pl: string;
  en: string;
}

export interface QuestionOption {
  id: string;
  text: LocalizedText;
}

export interface BaseQuestion {
  id: string;
  moduleId: string;
  type: QuestionType;
  points: number;
  confidenceEnabled: boolean;
  sourceRef: string;
  prompt: LocalizedText;
}

export interface SingleQuestion extends BaseQuestion {
  type: 'single';
  options: QuestionOption[];
  correctAnswer?: string;
}

export interface MultiQuestion extends BaseQuestion {
  type: 'multi';
  options: QuestionOption[];
}

export interface OpenQuestion extends BaseQuestion {
  type: 'open';
  placeholder?: LocalizedText;
}

export type Question = SingleQuestion | MultiQuestion | OpenQuestion;

export interface Module {
  id: string;
  thresholdPercent: number | null;
  technical: boolean;
  title: LocalizedText;
  shortTitle: LocalizedText;
  description: LocalizedText;
}

export function isSelectableQuestion(q: Question): q is SingleQuestion | MultiQuestion {
  return q.type === 'single' || q.type === 'multi';
}
