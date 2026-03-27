import { create } from 'zustand';
import type { CandidateIdentity } from '../types/identity';
import type { Assessment } from '../types/assessment';
import type { AIReport } from '../types/assessment';
import { deriveAssessment } from '../logic/assessment';
import { validateModuleAnswers, buildModuleResult } from '../logic/scoring';
import { determineNextModule, getInitialDiscoveredRoute } from '../logic/routing';
import { submitAnswers as apiSubmitAnswers } from '../services/api';

export type Phase = 'identity' | 'form' | 'report';

interface AuthState {
  email: string;
  token: string;
  name: string;
}

interface FormState {
  // Session
  locale: 'pl' | 'en';
  sessionId: string;
  phase: Phase;

  // Identity
  identity: CandidateIdentity | null;

  // Form navigation
  currentModuleId: string;
  discoveredRoute: string[];
  completedModules: string[];

  // Answers
  answers: Record<string, Record<string, unknown>>;
  validationErrors: Record<string, string>;

  // Assessment
  assessment: Assessment | null;
  submitting: boolean;

  // Report tabs
  activeReportTab: 'candidate' | 'recruiter';

  // Auth
  auth: AuthState | null;

  // AI Report
  aiReport: AIReport | null;
  aiReportLoading: boolean;
  aiReportError: string | null;

  // Actions
  setLocale: (l: 'pl' | 'en') => void;
  submitIdentity: (data: CandidateIdentity) => void;
  setAnswer: (questionId: string, answer: Record<string, unknown>) => void;
  submitModule: () => string | null;
  finishForm: () => void;
  setActiveReportTab: (tab: 'candidate' | 'recruiter') => void;
  setAuth: (auth: AuthState | null) => void;
  setAIReport: (report: AIReport | null) => void;
  setAIReportLoading: (loading: boolean) => void;
  setAIReportError: (error: string | null) => void;
  resetSession: () => void;
}

function generateSessionId(): string {
  return `soc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const initialState = {
  locale: 'pl' as const,
  sessionId: generateSessionId(),
  phase: 'identity' as Phase,
  identity: null,
  currentModuleId: 'M1',
  discoveredRoute: getInitialDiscoveredRoute(),
  completedModules: [],
  answers: {},
  validationErrors: {},
  assessment: null,
  submitting: false,
  activeReportTab: 'candidate' as const,
  auth: null,
  aiReport: null,
  aiReportLoading: false,
  aiReportError: null,
};

export const useFormStore = create<FormState>((set, get) => ({
  ...initialState,

  setLocale: (l) => set({ locale: l }),

  submitIdentity: (data) =>
    set({
      identity: data,
      phase: 'form',
    }),

  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
      validationErrors: { ...state.validationErrors, [questionId]: undefined } as Record<string, string>,
    })),

  submitModule: () => {
    const { currentModuleId, answers, discoveredRoute, completedModules } = get();

    const validation = validateModuleAnswers(currentModuleId, answers);
    if (!validation.valid) {
      set({ validationErrors: validation.errors });
      return null;
    }

    const moduleResults: Record<string, ReturnType<typeof buildModuleResult>> = {};

    for (const mid of [...completedModules, currentModuleId]) {
      moduleResults[mid] = buildModuleResult(mid, answers);
    }

    const nextModule = determineNextModule(currentModuleId, answers, moduleResults);
    const newCompleted = [...completedModules, currentModuleId];

    if (nextModule) {
      const newRoute = discoveredRoute.includes(nextModule)
        ? discoveredRoute
        : [...discoveredRoute, nextModule];

      set({
        completedModules: newCompleted,
        currentModuleId: nextModule,
        discoveredRoute: newRoute,
        validationErrors: {},
      });
      return nextModule;
    }

    // No next module = form is done
    return null;
  },

  finishForm: () => {
    const { answers, sessionId, identity } = get();
    const assessment = deriveAssessment(answers);

    // Show report immediately (don't block on API)
    set({
      assessment,
      phase: 'report',
      submitting: false,
    });

    // Submit to backend asynchronously (fire-and-forget with logging)
    if (identity) {
      apiSubmitAnswers({
        sessionId,
        identity: identity as unknown as Record<string, string>,
        answers,
        assessment: assessment as unknown as Record<string, unknown>,
        timestamp: new Date().toISOString(),
      }).then(() => {
        console.log('[SOC] Answers submitted to backend successfully');
      }).catch((err) => {
        console.warn('[SOC] Backend submit failed (offline mode):', err.message);
      });
    }
  },

  setActiveReportTab: (tab) => set({ activeReportTab: tab }),

  setAuth: (auth) => set({ auth }),

  setAIReport: (report) => set({ aiReport: report }),
  setAIReportLoading: (loading) => set({ aiReportLoading: loading }),
  setAIReportError: (error) => set({ aiReportError: error }),

  resetSession: () =>
    set({
      ...initialState,
      sessionId: generateSessionId(),
      locale: get().locale,
      auth: get().auth,
    }),
}));
