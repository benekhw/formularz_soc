export type Level =
  | 'preL1'
  | 'l1'
  | 'seniorL1'
  | 'l2'
  | 'seniorL2'
  | 'l3'
  | 'manager';

export type SelfLevel = 'l1' | 'l2' | 'l3' | 'manager';

export type GapKey =
  | 'accurate'
  | 'moderateOverestimate'
  | 'strongOverestimate'
  | 'underestimate'
  | 'hiddenTalent';

export type ConfidenceKey =
  | 'wellCalibrated'
  | 'dunningKrugerRisk'
  | 'hiddenTalent'
  | 'optimistic'
  | 'conservative';

export type ProfileSignalStatus = 'match' | 'partial' | 'recruiterVerification';

export type DevelopmentArea =
  | 'fundamentals'
  | 'incidentAnalysis'
  | 'huntingForensics'
  | 'strategyLeadership'
  | 'confidenceCalibration';

export type InsightKey = 'managerPotential' | 'managerAspiration';

export type InterviewKey =
  | 'fundamentals'
  | 'incidentAnalysis'
  | 'huntingForensics'
  | 'strategyLeadership'
  | 'confidenceCalibration'
  | 'managementVerification';

export interface SingleAnswer {
  choice: string | null;
  skipped: boolean;
  confidence: number | null;
}

export interface MultiAnswer {
  selections: string[];
}

export interface OpenAnswer {
  text: string;
}

export type Answer = SingleAnswer | MultiAnswer | OpenAnswer;

export interface QuestionDetail {
  questionId: string;
  answer: SingleAnswer | null;
  skipped: boolean;
  correct: boolean;
  earnedPoints: number;
  maxPoints: number;
  confidence: number | null;
}

export interface NonTechnicalDetail {
  questionId: string;
  answered: Answer | null;
}

export interface ModuleResult {
  moduleId: string;
  score: number;
  maxScore: number;
  percent: number;
  thresholdPercent: number | null;
  thresholdMet: boolean | null;
  answeredCount: number;
  skippedCount: number;
  correctCount: number;
  totalQuestions: number;
  technical: boolean;
  averageConfidence?: number | null;
  details: (QuestionDetail | NonTechnicalDetail)[];
}

export interface Profile {
  experienceChoice: string;
  experienceBand: { key: string; yearsMin: number; weight: number };
  backgroundChoice: string;
  background: { key: string; weight: number };
  certifications: string[];
  certificationMaxWeight: number;
  roleChoice: string;
  role: string;
  selfChoice: string;
  selfAssessment: SelfLevel;
  workModelChoice: string | null;
  workModel: string | null;
}

export interface Classification {
  baseLevel: Level;
  publicLevel: Level;
  insights: InsightKey[];
  managerEligible: boolean;
  managerThresholdMet: boolean;
}

export interface GapAnalysis {
  key: GapKey;
  declaredLevel: SelfLevel;
  achievedLevel: Level;
  delta: number;
}

export interface ConfidenceAnalysis {
  key: ConfidenceKey;
  averageConfidence: number | null;
  accuracy: number | null;
  calibrationGap: number | null;
}

export interface ProfileSignals {
  status: ProfileSignalStatus;
  matchedSignals: number;
  totalSignals: number;
  flags: string[];
}

export interface CandidateSnapshot {
  experienceChoice: string;
  backgroundChoice: string;
  certifications: string[];
  targetRoleChoice: string;
  selfAssessmentChoice: string;
  workModelChoice: string | null;
  motivations: Record<string, string | null>;
}

export interface Assessment {
  profile: Profile;
  visitedModules: string[];
  moduleResults: Record<string, ModuleResult>;
  classification: Classification;
  gapAnalysis: GapAnalysis;
  confidenceAnalysis: ConfidenceAnalysis;
  profileSignals: ProfileSignals;
  developmentAreas: DevelopmentArea[];
  interviewQuestionKeys: InterviewKey[];
  candidateSnapshot: CandidateSnapshot;
}

export interface AIReport {
  sessionId: string;
  timestamp: string;
  model: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  competencyProfile: Record<string, string>;
  confidenceAssessment: string;
  interviewFocus: string[];
  recommendation: 'hire' | 'consider' | 'reject';
  recommendationRationale: string;
  developmentPlan: string;
  riskFlags: string[];
}
