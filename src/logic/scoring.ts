import type { Question } from '../types/questions';
import type { Answer, SingleAnswer, MultiAnswer, OpenAnswer, ModuleResult, QuestionDetail, NonTechnicalDetail } from '../types/assessment';
import type { Module } from '../types/questions';
import { getModuleById, getQuestionsByModule } from '../data/questionBank';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function round(n: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function sanitizeAnswer(question: Question, rawAnswer: Record<string, unknown> | null | undefined): Answer | null {
  if (!rawAnswer) return null;

  if (question.type === 'multi') {
    const raw = rawAnswer as { selections?: unknown[] };
    const selections = Array.isArray(raw.selections)
      ? [...new Set((raw.selections as string[]).filter(Boolean))]
      : [];
    if (selections.includes('A') && selections.length > 1) {
      return { selections: ['A'] } as MultiAnswer;
    }
    return { selections } as MultiAnswer;
  }

  if (question.type === 'open') {
    const raw = rawAnswer as { text?: string };
    return { text: `${raw.text ?? ''}`.trim() } as OpenAnswer;
  }

  const raw = rawAnswer as { choice?: string; skipped?: boolean; confidence?: number };
  return {
    choice: raw.choice ?? null,
    skipped: Boolean(raw.skipped),
    confidence:
      raw.skipped || raw.confidence == null
        ? null
        : clamp(Number(raw.confidence), 1, 5),
  } as SingleAnswer;
}

export function validateQuestionAnswer(question: Question, rawAnswer: Record<string, unknown> | null | undefined): { valid: boolean; code?: string } {
  const answer = sanitizeAnswer(question, rawAnswer);

  if (question.type === 'open') {
    if (!(answer as OpenAnswer | null)?.text) return { valid: false, code: 'open' };
    return { valid: true };
  }

  if (question.type === 'multi') {
    if (!(answer as MultiAnswer | null)?.selections?.length) return { valid: false, code: 'multi' };
    return { valid: true };
  }

  if (question.confidenceEnabled) {
    const sa = answer as SingleAnswer | null;
    if (sa?.skipped) return { valid: true };
    if (!sa?.choice) return { valid: false, code: 'single' };
    return { valid: true };
  }

  if (!(answer as SingleAnswer | null)?.choice) return { valid: false, code: 'single' };
  return { valid: true };
}

export function validateModuleAnswers(moduleId: string, answers: Record<string, Record<string, unknown>>): { valid: boolean; errors: Record<string, string> } {
  const questions = getQuestionsByModule(moduleId);
  const errors: Record<string, string> = {};

  for (const question of questions) {
    const v = validateQuestionAnswer(question, answers[question.id]);
    if (!v.valid) errors[question.id] = v.code!;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildModuleResult(moduleId: string, answers: Record<string, Record<string, unknown>>): ModuleResult | null {
  const mod: Module | undefined = getModuleById(moduleId);
  const questions = getQuestionsByModule(moduleId);

  if (!mod || !questions.length) return null;

  if (!mod.technical) {
    return {
      moduleId,
      score: 0, maxScore: 0, percent: 0,
      thresholdPercent: null, thresholdMet: null,
      answeredCount: questions.length, skippedCount: 0, correctCount: 0,
      totalQuestions: questions.length, technical: false,
      details: questions.map((q) => ({
        questionId: q.id,
        answered: sanitizeAnswer(q, answers[q.id]),
      } as NonTechnicalDetail)),
    };
  }

  let score = 0, maxScore = 0, correctCount = 0, skippedCount = 0, answeredCount = 0;
  const confidenceValues: number[] = [];
  const details: QuestionDetail[] = [];

  for (const question of questions) {
    const answer = sanitizeAnswer(question, answers[question.id]) as SingleAnswer | null;
    const skipped = Boolean(answer?.skipped);
    const correctAnswer = question.type === 'single' ? (question as { correctAnswer?: string }).correctAnswer : undefined;
    const correct = Boolean(!skipped && answer?.choice && answer.choice === correctAnswer);

    maxScore += question.points;
    if (skipped) skippedCount += 1;
    if (!skipped && answer?.choice) answeredCount += 1;
    if (correct) { correctCount += 1; score += question.points; }
    if (!skipped && answer?.confidence != null) confidenceValues.push(answer.confidence);

    details.push({
      questionId: question.id,
      answer,
      skipped,
      correct,
      earnedPoints: correct ? question.points : 0,
      maxPoints: question.points,
      confidence: answer?.confidence ?? null,
    });
  }

  const percent = maxScore ? round((score / maxScore) * 100, 1) : 0;
  const thresholdPercent = mod.thresholdPercent;
  const thresholdMet = thresholdPercent == null ? null : percent >= thresholdPercent;

  return {
    moduleId, score, maxScore, percent,
    thresholdPercent, thresholdMet,
    answeredCount, skippedCount, correctCount,
    totalQuestions: questions.length, technical: true,
    averageConfidence: confidenceValues.length
      ? round(confidenceValues.reduce((s, v) => s + v, 0) / confidenceValues.length, 2)
      : null,
    details,
  };
}
