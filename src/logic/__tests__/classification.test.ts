import { describe, it, expect } from 'vitest';
import { deriveAssessment } from '../assessment';

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

describe('deriveAssessment', () => {
  it('classifies preL1 correctly', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'A' }, 'P1.2': { choice: 'A' }, 'P1.3': { selections: ['A'] }, 'P1.4': { choice: 'A' }, 'P1.5': { choice: 'A' },
      'P2.1': { choice: 'A', skipped: false, confidence: 3 },
      'P2.2': { choice: 'A', skipped: false, confidence: 3 },
      'P2.3': { choice: 'B', skipped: false, confidence: 3 },
      'P2.4': { choice: 'A', skipped: false, confidence: 3 },
      'P2.5': { choice: 'A', skipped: false, confidence: 3 },
      'P6.1': { text: 'test' }, 'P6.2': { text: 'test' }, 'P6.3': { text: 'test' }, 'P6.4': { choice: 'A' },
    };
    const assessment = deriveAssessment(answers);
    expect(assessment.classification.publicLevel).toBe('preL1');
    expect(assessment.visitedModules).toEqual(['M1', 'M2', 'M6']);
  });

  it('classifies L1 correctly (pass M2, fail M3)', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'B' }, 'P1.2': { choice: 'A' }, 'P1.3': { selections: ['A'] }, 'P1.4': { choice: 'A' }, 'P1.5': { choice: 'A' },
      ...allCorrect('M2'),
      // All wrong M3
      'P3.1': { choice: 'A', skipped: false, confidence: 3 },
      'P3.2': { choice: 'B', skipped: false, confidence: 3 },
      'P3.3': { choice: 'A', skipped: false, confidence: 3 },
      'P3.4': { choice: 'A', skipped: false, confidence: 3 },
      'P3.5': { choice: 'A', skipped: false, confidence: 3 },
      'P6.1': { text: 'test' }, 'P6.2': { text: 'test' }, 'P6.3': { text: 'test' }, 'P6.4': { choice: 'A' },
    };
    const assessment = deriveAssessment(answers);
    expect(assessment.classification.publicLevel).toBe('l1');
  });

  it('classifies L3 correctly (pass all technical)', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'D' }, 'P1.2': { choice: 'B' }, 'P1.3': { selections: ['C', 'D'] }, 'P1.4': { choice: 'B' }, 'P1.5': { choice: 'C' },
      ...allCorrect('M2'), ...allCorrect('M3'), ...allCorrect('M4'), ...allCorrect('M5'),
      'P6.1': { text: 'hunting' }, 'P6.2': { text: 'forensics' }, 'P6.3': { text: 'L3 role' }, 'P6.4': { choice: 'C' },
    };
    const assessment = deriveAssessment(answers);
    expect(assessment.classification.publicLevel).toBe('l3');
    expect(assessment.classification.baseLevel).toBe('l3');
  });

  it('classifies Manager correctly', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'E' }, 'P1.2': { choice: 'B' }, 'P1.3': { selections: ['D'] }, 'P1.4': { choice: 'C' }, 'P1.5': { choice: 'D' },
      ...allCorrect('M2'), ...allCorrect('M3'), ...allCorrect('M4'), ...allCorrect('M5'),
      'P6.1': { text: 'management' }, 'P6.2': { text: 'leadership' }, 'P6.3': { text: 'CISO' }, 'P6.4': { choice: 'D' },
    };
    const assessment = deriveAssessment(answers);
    expect(assessment.classification.publicLevel).toBe('manager');
    expect(assessment.classification.managerThresholdMet).toBe(true);
  });

  it('detects gap analysis correctly - strong overestimate', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'A' }, 'P1.2': { choice: 'A' }, 'P1.3': { selections: ['A'] }, 'P1.4': { choice: 'A' }, 'P1.5': { choice: 'D' }, // declares Manager
      'P2.1': { choice: 'A', skipped: false, confidence: 5 },
      'P2.2': { choice: 'A', skipped: false, confidence: 5 },
      'P2.3': { choice: 'B', skipped: false, confidence: 5 },
      'P2.4': { choice: 'A', skipped: false, confidence: 5 },
      'P2.5': { choice: 'A', skipped: false, confidence: 5 },
      'P6.1': { text: 'test' }, 'P6.2': { text: 'test' }, 'P6.3': { text: 'test' }, 'P6.4': { choice: 'A' },
    };
    const assessment = deriveAssessment(answers);
    expect(assessment.classification.publicLevel).toBe('preL1');
    expect(assessment.gapAnalysis.key).toBe('strongOverestimate');
  });

  it('detects Dunning-Kruger risk', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'A' }, 'P1.2': { choice: 'A' }, 'P1.3': { selections: ['A'] }, 'P1.4': { choice: 'A' }, 'P1.5': { choice: 'A' },
      // All wrong M2, but confidence 5
      'P2.1': { choice: 'A', skipped: false, confidence: 5 },
      'P2.2': { choice: 'A', skipped: false, confidence: 5 },
      'P2.3': { choice: 'B', skipped: false, confidence: 5 },
      'P2.4': { choice: 'A', skipped: false, confidence: 5 },
      'P2.5': { choice: 'A', skipped: false, confidence: 5 },
      'P6.1': { text: 'test' }, 'P6.2': { text: 'test' }, 'P6.3': { text: 'test' }, 'P6.4': { choice: 'A' },
    };
    const assessment = deriveAssessment(answers);
    expect(assessment.confidenceAnalysis.key).toBe('dunningKrugerRisk');
  });
});
