/**
 * API Service layer — connects frontend to Cloud Functions backend.
 * Falls back gracefully when backend is not available (dev/testing mode).
 */

const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new Error('API_URL not configured');
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  return res.json();
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

// ── Questions (from Sheets, cached on backend) ──
export async function fetchQuestions() {
  return fetchJSON<{
    modules: Record<string, string>[];
    questions: Record<string, string>[];
    source: string;
  }>('/api/questions');
}

// ── Submit Answers ──
export async function submitAnswers(data: {
  sessionId: string;
  identity: Record<string, string>;
  answers: Record<string, unknown>;
  assessment: Record<string, unknown>;
  timestamp: string;
}) {
  return fetchJSON<{ success: boolean; sessionId: string }>('/api/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Verify Google Auth ──
export async function verifyAuth(token: string) {
  return fetchJSON<{
    success: boolean;
    user: { email: string; name: string };
  }>('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// ── Get AI Report ──
export async function fetchAIReport(sessionId: string, token: string) {
  return fetchJSON<import('../types/assessment').AIReport>(
    `/api/report/${sessionId}`,
    { headers: authHeaders(token) },
  );
}

// ── Get Candidates List ──
export async function fetchCandidates(token: string) {
  return fetchJSON<{
    candidates: Array<{
      timestamp: string;
      sessionId: string;
      firstName: string;
      lastName: string;
      email: string;
      classification: string;
    }>;
  }>('/api/candidates', { headers: authHeaders(token) });
}
