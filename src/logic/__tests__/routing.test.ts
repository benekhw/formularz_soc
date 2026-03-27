import { describe, it, expect } from 'vitest';
import { determineNextModule, simulateRouting } from '../routing';
import { buildModuleResult } from '../scoring';

function makeModuleResults(ids: string[], answers: Record<string, Record<string, unknown>>) {
  const results: Record<string, ReturnType<typeof buildModuleResult>> = {};
  for (const id of ids) {
    results[id] = buildModuleResult(id, answers);
  }
  return results;
}

// Helper: build answers with all correct for a module
function allCorrect(moduleId: string): Record<string, Record<string, unknown>> {
  const correctMap: Record<string, string> = {
    'P2.1': 'B', 'P2.2': 'C', 'P2.3': 'A', 'P2.4': 'C', 'P2.5': 'B',
    'P3.1': 'C', 'P3.2': 'A', 'P3.3': 'C', 'P3.4': 'B', 'P3.5': 'B',
    'P4.1': 'B', 'P4.2': 'C', 'P4.3': 'A', 'P4.4': 'C', 'P4.5': 'C',
    'P5.1': 'B', 'P5.2': 'C', 'P5.3': 'C', 'P5.4': 'B', 'P5.5': 'C',
  };
  const answers: Record<string, Record<string, unknown>> = {};
  for (const [qid, correct] of Object.entries(correctMap)) {
    if (qid.startsWith(`P${moduleId.slice(1)}.`)) {
      answers[qid] = { choice: correct, skipped: false, confidence: 3 };
    }
  }
  return answers;
}

describe('determineNextModule', () => {
  it('M1 always routes to M2', () => {
    const answers = { 'P1.1': { choice: 'A' }, 'P1.2': { choice: 'A' }, 'P1.3': { selections: ['A'] }, 'P1.4': { choice: 'A' }, 'P1.5': { choice: 'A' } };
    const result = determineNextModule('M1', answers, {});
    expect(result).toBe('M2');
  });

  it('M2 below threshold routes to M6', () => {
    const answers = {
      'P1.1': { choice: 'A' }, 'P1.2': { choice: 'A' }, 'P1.3': { selections: ['A'] }, 'P1.4': { choice: 'A' }, 'P1.5': { choice: 'A' },
      ...Object.fromEntries(['P2.1', 'P2.2', 'P2.3', 'P2.4', 'P2.5'].map(q => [q, { choice: 'A', skipped: false, confidence: 3 }])),
    };
    const moduleResults = makeModuleResults(['M2'], answers);
    expect(determineNextModule('M2', answers, moduleResults)).toBe('M6');
  });

  it('M2 above threshold routes to M3', () => {
    const answers = {
      'P1.1': { choice: 'A' }, 'P1.2': { choice: 'A' }, 'P1.3': { selections: ['A'] }, 'P1.4': { choice: 'A' }, 'P1.5': { choice: 'A' },
      ...allCorrect('M2'),
    };
    const moduleResults = makeModuleResults(['M2'], answers);
    expect(determineNextModule('M2', answers, moduleResults)).toBe('M3');
  });
});

describe('simulateRouting', () => {
  it('preL1 candidate goes M1 -> M2 -> M6', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'A' }, 'P1.2': { choice: 'A' }, 'P1.3': { selections: ['A'] }, 'P1.4': { choice: 'A' }, 'P1.5': { choice: 'A' },
      // All wrong M2
      'P2.1': { choice: 'A', skipped: false, confidence: 3 },
      'P2.2': { choice: 'A', skipped: false, confidence: 3 },
      'P2.3': { choice: 'B', skipped: false, confidence: 3 },
      'P2.4': { choice: 'A', skipped: false, confidence: 3 },
      'P2.5': { choice: 'A', skipped: false, confidence: 3 },
      // M6
      'P6.1': { text: 'test' }, 'P6.2': { text: 'test' }, 'P6.3': { text: 'test' }, 'P6.4': { choice: 'A' },
    };
    const { visitedModules } = simulateRouting(answers);
    expect(visitedModules).toEqual(['M1', 'M2', 'M6']);
  });

  it('full pass candidate goes through all modules', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'D' }, 'P1.2': { choice: 'B' }, 'P1.3': { selections: ['C', 'D'] }, 'P1.4': { choice: 'C' }, 'P1.5': { choice: 'D' },
      ...allCorrect('M2'), ...allCorrect('M3'), ...allCorrect('M4'), ...allCorrect('M5'),
      'P6.1': { text: 'test' }, 'P6.2': { text: 'test' }, 'P6.3': { text: 'test' }, 'P6.4': { choice: 'D' },
    };
    const { visitedModules } = simulateRouting(answers);
    expect(visitedModules).toEqual(['M1', 'M2', 'M3', 'M4', 'M5', 'M6']);
  });
});
