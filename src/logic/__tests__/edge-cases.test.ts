import { describe, it, expect } from 'vitest';
import { deriveAssessment } from '../assessment';
import { buildModuleResult, validateModuleAnswers } from '../scoring';

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

describe('Edge Cases', () => {
  it('boundary: M2 exactly 60% = pass (3 correct of 5 = 60%)', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'B' }, 'P1.2': { choice: 'A' }, 'P1.3': { selections: ['A'] }, 'P1.4': { choice: 'A' }, 'P1.5': { choice: 'A' },
      'P2.1': { choice: 'B', skipped: false, confidence: 3 }, // correct
      'P2.2': { choice: 'C', skipped: false, confidence: 3 }, // correct
      'P2.3': { choice: 'A', skipped: false, confidence: 3 }, // correct
      'P2.4': { choice: 'A', skipped: false, confidence: 3 }, // wrong
      'P2.5': { choice: 'A', skipped: false, confidence: 3 }, // wrong
    };
    const result = buildModuleResult('M2', answers);
    expect(result!.percent).toBe(60);
    expect(result!.thresholdMet).toBe(true);
  });

  it('boundary: M2 at 59.9% = fail (just under threshold)', () => {
    // 2 correct = 40%, which is below 60
    const answers: Record<string, Record<string, unknown>> = {
      'P2.1': { choice: 'B', skipped: false, confidence: 3 }, // correct
      'P2.2': { choice: 'C', skipped: false, confidence: 3 }, // correct
      'P2.3': { choice: 'B', skipped: false, confidence: 3 }, // wrong
      'P2.4': { choice: 'A', skipped: false, confidence: 3 }, // wrong
      'P2.5': { choice: 'A', skipped: false, confidence: 3 }, // wrong
    };
    const result = buildModuleResult('M2', answers);
    expect(result!.percent).toBe(40);
    expect(result!.thresholdMet).toBe(false);
  });

  it('all skipped M2 = 0% = preL1', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'A' }, 'P1.2': { choice: 'A' }, 'P1.3': { selections: ['A'] }, 'P1.4': { choice: 'A' }, 'P1.5': { choice: 'A' },
      'P2.1': { choice: null, skipped: true, confidence: null },
      'P2.2': { choice: null, skipped: true, confidence: null },
      'P2.3': { choice: null, skipped: true, confidence: null },
      'P2.4': { choice: null, skipped: true, confidence: null },
      'P2.5': { choice: null, skipped: true, confidence: null },
      'P6.1': { text: 'test' }, 'P6.2': { text: 'test' }, 'P6.3': { text: 'test' }, 'P6.4': { choice: 'A' },
    };
    const assessment = deriveAssessment(answers);
    expect(assessment.classification.publicLevel).toBe('preL1');
  });

  it('management track: fail M3 but role=management routes to M5', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'E' }, 'P1.2': { choice: 'B' }, 'P1.3': { selections: ['D'] }, 'P1.4': { choice: 'C' }, 'P1.5': { choice: 'D' },
      ...allCorrect('M2'),
      // All wrong M3
      'P3.1': { choice: 'A', skipped: false, confidence: 2 },
      'P3.2': { choice: 'B', skipped: false, confidence: 2 },
      'P3.3': { choice: 'A', skipped: false, confidence: 2 },
      'P3.4': { choice: 'A', skipped: false, confidence: 2 },
      'P3.5': { choice: 'A', skipped: false, confidence: 2 },
      // All correct M5
      ...allCorrect('M5'),
      'P6.1': { text: 'management' }, 'P6.2': { text: 'leadership' }, 'P6.3': { text: 'CISO' }, 'P6.4': { choice: 'D' },
    };
    const assessment = deriveAssessment(answers);
    // Should visit M5 even though M3 failed (because role=management)
    expect(assessment.visitedModules).toContain('M5');
    // Should be classified as manager if M5 passes
    expect(assessment.classification.publicLevel).toBe('manager');
  });

  it('seniorL1 detection: M2 >= 85% and M3 between 30-49%', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'B' }, 'P1.2': { choice: 'B' }, 'P1.3': { selections: ['B'] }, 'P1.4': { choice: 'A' }, 'P1.5': { choice: 'A' },
      ...allCorrect('M2'), // 100% M2
      // 2/5 correct M3 = 40% (between 30-49%)
      'P3.1': { choice: 'C', skipped: false, confidence: 3 }, // correct
      'P3.2': { choice: 'A', skipped: false, confidence: 3 }, // correct
      'P3.3': { choice: 'A', skipped: false, confidence: 3 }, // wrong
      'P3.4': { choice: 'A', skipped: false, confidence: 3 }, // wrong
      'P3.5': { choice: 'A', skipped: false, confidence: 3 }, // wrong
      'P6.1': { text: 'test' }, 'P6.2': { text: 'test' }, 'P6.3': { text: 'test' }, 'P6.4': { choice: 'A' },
    };
    const assessment = deriveAssessment(answers);
    expect(assessment.classification.publicLevel).toBe('seniorL1');
    expect(assessment.classification.baseLevel).toBe('seniorL1');
  });

  it('hidden talent: low self-assessment + high performance', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'D' }, 'P1.2': { choice: 'B' }, 'P1.3': { selections: ['C', 'D'] }, 'P1.4': { choice: 'B' }, 'P1.5': { choice: 'A' }, // declares L1
      ...allCorrect('M2'), ...allCorrect('M3'), ...allCorrect('M4'), ...allCorrect('M5'),
      'P6.1': { text: 'test' }, 'P6.2': { text: 'test' }, 'P6.3': { text: 'test' }, 'P6.4': { choice: 'C' },
    };
    const assessment = deriveAssessment(answers);
    expect(assessment.classification.publicLevel).toBe('l3');
    expect(assessment.gapAnalysis.key).toBe('hiddenTalent');
  });

  it('multi question: A (none) is exclusive', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.3': { selections: ['A', 'B'] }, // A should force exclusive
    };
    const result = buildModuleResult('M1', {
      'P1.1': { choice: 'A' }, 'P1.2': { choice: 'A' },
      ...answers,
      'P1.4': { choice: 'A' }, 'P1.5': { choice: 'A' },
    });
    // The sanitize function should strip B when A is present
    const detail = result!.details.find((d) => 'answered' in d && d.questionId === 'P1.3');
    const ans = (detail as { answered: { selections: string[] } | null })?.answered;
    expect(ans?.selections).toEqual(['A']);
  });

  it('open question validation: empty text is invalid', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P6.1': { text: '' },
      'P6.2': { text: 'something' },
      'P6.3': { text: 'test' },
      'P6.4': { choice: 'A' },
    };
    const result = validateModuleAnswers('M6', answers);
    expect(result.valid).toBe(false);
    expect(result.errors['P6.1']).toBe('open');
  });

  it('confidence analysis: well calibrated when accuracy matches confidence', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'C' }, 'P1.2': { choice: 'B' }, 'P1.3': { selections: ['C'] }, 'P1.4': { choice: 'A' }, 'P1.5': { choice: 'B' },
      // 3/5 correct with moderate confidence
      'P2.1': { choice: 'B', skipped: false, confidence: 3 }, // correct
      'P2.2': { choice: 'C', skipped: false, confidence: 3 }, // correct
      'P2.3': { choice: 'A', skipped: false, confidence: 3 }, // correct
      'P2.4': { choice: 'A', skipped: false, confidence: 3 }, // wrong
      'P2.5': { choice: 'A', skipped: false, confidence: 3 }, // wrong
      // 3/5 correct M3 with moderate confidence
      'P3.1': { choice: 'C', skipped: false, confidence: 3 },
      'P3.2': { choice: 'A', skipped: false, confidence: 3 },
      'P3.3': { choice: 'C', skipped: false, confidence: 3 },
      'P3.4': { choice: 'A', skipped: false, confidence: 3 },
      'P3.5': { choice: 'A', skipped: false, confidence: 3 },
      'P6.1': { text: 'test' }, 'P6.2': { text: 'test' }, 'P6.3': { text: 'test' }, 'P6.4': { choice: 'A' },
    };
    const assessment = deriveAssessment(answers);
    // With 60% accuracy and confidence 3 (normalized 0.5), gap = 0.5 - 0.6 = -0.1 → well calibrated or conservative
    expect(['wellCalibrated', 'conservative']).toContain(assessment.confidenceAnalysis.key);
  });
});
