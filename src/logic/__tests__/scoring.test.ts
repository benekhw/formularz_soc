import { describe, it, expect } from 'vitest';
import { buildModuleResult, validateModuleAnswers } from '../scoring';

describe('buildModuleResult', () => {
  it('scores M2 correctly with all correct answers', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P2.1': { choice: 'B', skipped: false, confidence: 4 },
      'P2.2': { choice: 'C', skipped: false, confidence: 3 },
      'P2.3': { choice: 'A', skipped: false, confidence: 5 },
      'P2.4': { choice: 'C', skipped: false, confidence: 4 },
      'P2.5': { choice: 'B', skipped: false, confidence: 3 },
    };
    const result = buildModuleResult('M2', answers);
    expect(result).not.toBeNull();
    expect(result!.score).toBe(15);
    expect(result!.maxScore).toBe(15);
    expect(result!.percent).toBe(100);
    expect(result!.thresholdMet).toBe(true);
    expect(result!.correctCount).toBe(5);
  });

  it('scores M2 with 0 for all wrong answers', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P2.1': { choice: 'A', skipped: false, confidence: 3 },
      'P2.2': { choice: 'A', skipped: false, confidence: 3 },
      'P2.3': { choice: 'B', skipped: false, confidence: 3 },
      'P2.4': { choice: 'A', skipped: false, confidence: 3 },
      'P2.5': { choice: 'A', skipped: false, confidence: 3 },
    };
    const result = buildModuleResult('M2', answers);
    expect(result!.score).toBe(0);
    expect(result!.percent).toBe(0);
    expect(result!.thresholdMet).toBe(false);
  });

  it('handles skipped questions correctly', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P2.1': { choice: 'B', skipped: false, confidence: 4 },
      'P2.2': { choice: null, skipped: true, confidence: null },
      'P2.3': { choice: 'A', skipped: false, confidence: 5 },
      'P2.4': { choice: null, skipped: true, confidence: null },
      'P2.5': { choice: 'B', skipped: false, confidence: 3 },
    };
    const result = buildModuleResult('M2', answers);
    expect(result!.score).toBe(9); // 3+3+3
    expect(result!.skippedCount).toBe(2);
    expect(result!.answeredCount).toBe(3);
    expect(result!.percent).toBe(60);
    expect(result!.thresholdMet).toBe(true); // exactly 60% = pass
  });

  it('returns non-technical result for M1', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'C' },
      'P1.2': { choice: 'B' },
      'P1.3': { selections: ['B', 'C'] },
      'P1.4': { choice: 'A' },
      'P1.5': { choice: 'B' },
    };
    const result = buildModuleResult('M1', answers);
    expect(result!.technical).toBe(false);
    expect(result!.score).toBe(0);
  });
});

describe('validateModuleAnswers', () => {
  it('rejects unanswered required questions', () => {
    const answers: Record<string, Record<string, unknown>> = {};
    const result = validateModuleAnswers('M1', answers);
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });

  it('accepts valid M1 answers', () => {
    const answers: Record<string, Record<string, unknown>> = {
      'P1.1': { choice: 'C' },
      'P1.2': { choice: 'B' },
      'P1.3': { selections: ['B'] },
      'P1.4': { choice: 'A' },
      'P1.5': { choice: 'B' },
    };
    const result = validateModuleAnswers('M1', answers);
    expect(result.valid).toBe(true);
  });
});
