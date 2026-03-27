import { create } from 'zustand';
import type { AIReport } from '../types/assessment';

export interface AdminAuth {
  email: string;
  name: string;
  token: string;
}

export interface CandidateRow {
  timestamp: string;
  sessionId: string;
  firstName: string;
  lastName: string;
  email: string;
  continent: string;
  country: string;
  classification: string;
  baseLevel: string;
  route: string;
  answersJson?: string;
  assessmentJson?: string;
}

export interface CandidateDetail extends CandidateRow {
  answers: Record<string, unknown>;
  assessment: Record<string, unknown>;
  aiReport: AIReport | null;
}

export type AdminView = 'dashboard' | 'list' | 'detail' | 'compare' | 'questions';

export interface AdminFilters {
  search: string;
  level: string;
  sortBy: 'date' | 'name' | 'level';
  sortDir: 'asc' | 'desc';
}

export interface AdminStats {
  totalCandidates: number;
  levelBreakdown: Record<string, number>;
  avgScoresByModule: Record<string, number>;
  passRatesByModule: Record<string, number>;
  recommendationBreakdown: Record<string, number>;
  recentCandidates: CandidateRow[];
}

interface AdminState {
  // Auth
  auth: AdminAuth | null;

  // View state
  view: AdminView;

  // Candidates
  candidates: CandidateRow[];
  candidatesLoading: boolean;
  candidatesError: string | null;

  // Selected candidate
  selectedSessionId: string | null;
  selectedDetail: CandidateDetail | null;
  detailLoading: boolean;
  detailError: string | null;

  // Comparison
  compareList: string[];

  // Filters
  filters: AdminFilters;

  // Stats
  stats: AdminStats | null;
  statsLoading: boolean;

  // Actions
  setAuth: (auth: AdminAuth | null) => void;
  setView: (view: AdminView) => void;
  setCandidates: (candidates: CandidateRow[]) => void;
  setCandidatesLoading: (loading: boolean) => void;
  setCandidatesError: (error: string | null) => void;
  selectCandidate: (sessionId: string | null) => void;
  setSelectedDetail: (detail: CandidateDetail | null) => void;
  setDetailLoading: (loading: boolean) => void;
  setDetailError: (error: string | null) => void;
  addToCompare: (sessionId: string) => void;
  removeFromCompare: (sessionId: string) => void;
  clearCompare: () => void;
  setFilter: (filter: Partial<AdminFilters>) => void;
  setStats: (stats: AdminStats | null) => void;
  setStatsLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  auth: null,
  view: 'dashboard',
  candidates: [],
  candidatesLoading: false,
  candidatesError: null,
  selectedSessionId: null,
  selectedDetail: null,
  detailLoading: false,
  detailError: null,
  compareList: [],
  filters: {
    search: '',
    level: '',
    sortBy: 'date',
    sortDir: 'desc',
  },
  stats: null,
  statsLoading: false,

  setAuth: (auth) => set({ auth }),
  setView: (view) => set({ view }),
  setCandidates: (candidates) => set({ candidates }),
  setCandidatesLoading: (loading) => set({ candidatesLoading: loading }),
  setCandidatesError: (error) => set({ candidatesError: error }),

  selectCandidate: (sessionId) =>
    set({ selectedSessionId: sessionId, selectedDetail: null, detailError: null, view: sessionId ? 'detail' : get().view }),

  setSelectedDetail: (detail) => set({ selectedDetail: detail }),
  setDetailLoading: (loading) => set({ detailLoading: loading }),
  setDetailError: (error) => set({ detailError: error }),

  addToCompare: (sessionId) => {
    const list = get().compareList;
    if (list.length < 3 && !list.includes(sessionId)) {
      set({ compareList: [...list, sessionId] });
    }
  },

  removeFromCompare: (sessionId) =>
    set({ compareList: get().compareList.filter((id) => id !== sessionId) }),

  clearCompare: () => set({ compareList: [] }),

  setFilter: (filter) =>
    set({ filters: { ...get().filters, ...filter } }),

  setStats: (stats) => set({ stats }),
  setStatsLoading: (loading) => set({ statsLoading: loading }),

  logout: () =>
    set({
      auth: null,
      view: 'dashboard',
      candidates: [],
      selectedSessionId: null,
      selectedDetail: null,
      compareList: [],
      stats: null,
    }),
}));
