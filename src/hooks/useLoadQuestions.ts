import { useState, useEffect } from 'react';
import { fetchQuestions } from '../services/api';
import { setQuestionsFromSheets } from '../data/questionBank';
import type { Module, Question } from '../types/questions';

/**
 * On mount, fetches questions from the backend (Google Sheets).
 * If the backend is unavailable or returns empty data, the hardcoded
 * question bank in questionBank.ts remains active as the fallback.
 */
export function useLoadQuestions() {
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'hardcoded' | 'sheets'>('hardcoded');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchQuestions();

        if (cancelled) return;

        if (data.source === 'sheets' && data.modules?.length && data.questions?.length) {
          setQuestionsFromSheets(
            data.modules as unknown as Module[],
            data.questions as unknown as Question[],
          );
          setSource('sheets');
          console.log(`[SOC] Questions loaded from Sheets: ${data.modules.length} modules, ${data.questions.length} questions`);
        } else {
          console.log('[SOC] Sheets data empty or unavailable, using hardcoded fallback');
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        console.warn('[SOC] Failed to load questions from API, using hardcoded fallback:', msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, source, error };
}
