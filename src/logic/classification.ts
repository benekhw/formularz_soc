import type { Level, SelfLevel, Profile, ModuleResult, InsightKey } from '../types/assessment';
import { getQuestionById } from '../data/questionBank';
import { sanitizeAnswer } from './scoring';

export const LEVEL_RANKS: Record<Level, number> = {
  preL1: 0, l1: 1, seniorL1: 1.5, l2: 2, seniorL2: 2.5, l3: 3, manager: 4,
};

const SELF_LEVEL_RANKS: Record<SelfLevel, number> = { l1: 1, l2: 2, l3: 3, manager: 4 };

const MODULE_GATE_PERCENT: Record<string, number> = { M2: 60, M3: 50, M4: 50, M5: 70 };

const EXPERIENCE_BAND: Record<string, { key: string; yearsMin: number; weight: number }> = {
  A: { key: 'none', yearsMin: 0, weight: 0 },
  B: { key: 'under2', yearsMin: 0, weight: 1 },
  C: { key: '2to4', yearsMin: 2, weight: 2 },
  D: { key: '4to7', yearsMin: 4, weight: 3 },
  E: { key: 'over7', yearsMin: 7, weight: 4 },
};

const BACKGROUND_MAP: Record<string, { key: string; weight: number }> = {
  A: { key: 'none', weight: 0 },
  B: { key: 'soc', weight: 3 },
  C: { key: 'blueTeam', weight: 2 },
  D: { key: 'adjacent', weight: 1 },
};

const CERTIFICATION_MAP: Record<string, { key: string; weight: number }> = {
  A: { key: 'none', weight: 0 },
  B: { key: 'entry', weight: 1 },
  C: { key: 'mid', weight: 2 },
  D: { key: 'advanced', weight: 3 },
};

const ROLE_MAP: Record<string, string> = { A: 'analyst', B: 'lead', C: 'management' };
const SELF_ASSESSMENT_MAP: Record<string, SelfLevel> = { A: 'l1', B: 'l2', C: 'l3', D: 'manager' };
const WORK_MODEL_MAP: Record<string, string> = { A: 'shift24x7', B: 'standardOnCall', C: 'project', D: 'management' };

export function buildProfile(answers: Record<string, Record<string, unknown>>): Profile {
  const experienceChoice = (answers['P1.1'] as { choice?: string } | undefined)?.choice ?? 'A';
  const backgroundChoice = (answers['P1.2'] as { choice?: string } | undefined)?.choice ?? 'A';

  const q13 = getQuestionById('P1.3');
  const certAnswer = q13 ? sanitizeAnswer(q13, answers['P1.3']) : null;
  const certificationSelections = (certAnswer && 'selections' in certAnswer) ? certAnswer.selections : [];

  const roleChoice = (answers['P1.4'] as { choice?: string } | undefined)?.choice ?? 'A';
  const selfChoice = (answers['P1.5'] as { choice?: string } | undefined)?.choice ?? 'A';
  const workModelChoice = (answers['P6.4'] as { choice?: string } | undefined)?.choice ?? null;

  const certWeights = certificationSelections.map((s: string) => CERTIFICATION_MAP[s]?.weight ?? 0);

  return {
    experienceChoice,
    experienceBand: EXPERIENCE_BAND[experienceChoice] ?? EXPERIENCE_BAND.A,
    backgroundChoice,
    background: BACKGROUND_MAP[backgroundChoice] ?? BACKGROUND_MAP.A,
    certifications: certificationSelections,
    certificationMaxWeight: certWeights.length ? Math.max(...certWeights) : 0,
    roleChoice,
    role: ROLE_MAP[roleChoice] ?? 'analyst',
    selfChoice,
    selfAssessment: SELF_ASSESSMENT_MAP[selfChoice] ?? 'l1',
    workModelChoice,
    workModel: workModelChoice ? (WORK_MODEL_MAP[workModelChoice] ?? null) : null,
  };
}

function round(n: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function getTechnicalBaseLevel(profile: Profile, moduleResults: Record<string, ModuleResult | null>): {
  baseLevel: Level;
  publicLevel: Level;
  managerEligible: boolean;
  managerThresholdMet: boolean;
} {
  const m2 = moduleResults.M2?.percent ?? 0;
  const m3 = moduleResults.M3?.percent ?? 0;
  const m4 = moduleResults.M4?.percent ?? 0;
  const m5 = moduleResults.M5?.percent ?? 0;

  if (m2 < MODULE_GATE_PERCENT.M2) {
    return { baseLevel: 'preL1', publicLevel: 'preL1', managerEligible: false, managerThresholdMet: false };
  }

  if (!moduleResults.M3 || m3 < MODULE_GATE_PERCENT.M3) {
    const seniorL1 = m2 >= 85 && m3 >= 30 && m3 < 50;
    const baseLevel: Level = seniorL1 ? 'seniorL1' : 'l1';
    const managerThresholdMet = profile.role === 'management' && (moduleResults.M5?.percent ?? 0) >= MODULE_GATE_PERCENT.M5;
    return { baseLevel, publicLevel: managerThresholdMet ? 'manager' : baseLevel, managerEligible: Boolean(moduleResults.M5), managerThresholdMet };
  }

  if (!moduleResults.M4 || m4 < MODULE_GATE_PERCENT.M4) {
    const seniorL2 = m3 >= 70 && m4 >= 30 && m4 < 50;
    const baseLevel: Level = seniorL2 ? 'seniorL2' : 'l2';
    const managerThresholdMet = profile.role === 'management' && (moduleResults.M5?.percent ?? 0) >= MODULE_GATE_PERCENT.M5;
    return { baseLevel, publicLevel: managerThresholdMet ? 'manager' : baseLevel, managerEligible: Boolean(moduleResults.M5), managerThresholdMet };
  }

  const managerThresholdMet = profile.role === 'management' && m5 >= MODULE_GATE_PERCENT.M5;
  return { baseLevel: 'l3', publicLevel: managerThresholdMet ? 'manager' : 'l3', managerEligible: Boolean(moduleResults.M5), managerThresholdMet };
}

export function buildInsights(profile: Profile, baseLevel: Level, publicLevel: Level, moduleResults: Record<string, ModuleResult | null>): InsightKey[] {
  const insights: InsightKey[] = [];
  const m5Percent = moduleResults.M5?.percent ?? 0;

  if (baseLevel === 'l3' && publicLevel === 'l3' && profile.role !== 'analyst' && m5Percent >= MODULE_GATE_PERCENT.M5) {
    insights.push('managerPotential');
  }
  if (profile.role === 'management' && moduleResults.M5 && publicLevel !== 'manager') {
    insights.push('managerAspiration');
  }
  return insights;
}

export function buildGapAnalysis(profile: Profile, publicLevel: Level) {
  const declaredRank = SELF_LEVEL_RANKS[profile.selfAssessment] ?? 1;
  const achievedRank = LEVEL_RANKS[publicLevel] ?? LEVEL_RANKS.l1;
  const diff = round(declaredRank - achievedRank, 2);

  let key: string = 'accurate';
  if (diff >= 1.5) key = 'strongOverestimate';
  else if (diff >= 0.75) key = 'moderateOverestimate';
  else if (diff <= -1.5) key = 'hiddenTalent';
  else if (diff <= -0.75) key = 'underestimate';

  return { key, declaredLevel: profile.selfAssessment, achievedLevel: publicLevel, delta: diff };
}

export function buildConfidenceAnalysis(moduleResults: Record<string, ModuleResult | null>, technicalModuleIds: string[]) {
  const detailRows = technicalModuleIds.flatMap((mid) => {
    const mr = moduleResults[mid];
    if (!mr || !mr.technical) return [];
    return (mr.details as import('../types/assessment').QuestionDetail[]).filter(
      (d) => d.answer && !d.skipped && d.answer.choice,
    );
  });

  if (!detailRows.length) {
    return { key: 'wellCalibrated' as const, averageConfidence: null, accuracy: null, calibrationGap: null };
  }

  const avgConf = round(detailRows.reduce((s, d) => s + (d.confidence ?? 0), 0) / detailRows.length, 2);
  const accuracy = round(detailRows.filter((d) => d.correct).length / detailRows.length, 3);
  const normConf = round((avgConf - 1) / 4, 3);
  const gap = round(normConf - accuracy, 3);

  let key: string = 'wellCalibrated';
  if (avgConf >= 4 && accuracy < 0.5) key = 'dunningKrugerRisk';
  else if (avgConf <= 2.5 && accuracy >= 0.8) key = 'hiddenTalent';
  else if (gap > 0.15) key = 'optimistic';
  else if (gap < -0.15) key = 'conservative';

  return { key, averageConfidence: avgConf, accuracy, calibrationGap: gap };
}

export function buildProfileSignals(profile: Profile, publicLevel: Level) {
  const expected: Record<string, { experienceMin: number; backgroundMin: number; certMin: number; role: string | null }> = {
    preL1: { experienceMin: 0, backgroundMin: 0, certMin: 0, role: null },
    l1: { experienceMin: 0, backgroundMin: 0, certMin: 0, role: null },
    seniorL1: { experienceMin: 1, backgroundMin: 0, certMin: 0, role: null },
    l2: { experienceMin: 2, backgroundMin: 1, certMin: 1, role: null },
    seniorL2: { experienceMin: 2, backgroundMin: 1, certMin: 1, role: null },
    l3: { experienceMin: 3, backgroundMin: 1, certMin: 2, role: null },
    manager: { experienceMin: 3, backgroundMin: 1, certMin: 1, role: 'management' },
  };

  const exp = expected[publicLevel] ?? expected.l1;
  const signals = [
    profile.experienceBand.weight >= exp.experienceMin,
    profile.background.weight >= exp.backgroundMin,
    profile.certificationMaxWeight >= exp.certMin,
  ];
  if (exp.role) signals.push(profile.role === exp.role);

  const met = signals.filter(Boolean).length;
  const ratio = signals.length ? met / signals.length : 1;
  const flags: string[] = [];

  if (publicLevel === 'manager') flags.push('leadershipVerification');
  if ((publicLevel === 'l3' || publicLevel === 'manager') && profile.experienceBand.weight <= 1) flags.push('strongResultLowExperience');
  if (publicLevel === 'manager' && profile.certificationMaxWeight === 0) flags.push('managerNoCertification');

  let status: string = 'match';
  if (ratio < 0.4) status = 'recruiterVerification';
  else if (ratio < 0.75) status = 'partial';
  if (publicLevel === 'manager' && profile.experienceBand.weight <= 1) status = 'recruiterVerification';

  return { status, matchedSignals: met, totalSignals: signals.length, flags };
}

export function getDevelopmentAreas(moduleResults: Record<string, ModuleResult | null>, confidenceKey: string, publicLevel: Level): string[] {
  const areas: string[] = [];
  const m2 = moduleResults.M2?.percent ?? 0;
  const m3 = moduleResults.M3?.percent ?? 0;
  const m4 = moduleResults.M4?.percent ?? 0;
  const m5 = moduleResults.M5?.percent ?? 0;

  if (m2 < 85 || publicLevel === 'preL1') areas.push('fundamentals');
  if (moduleResults.M3 && m3 < 70) areas.push('incidentAnalysis');
  if (moduleResults.M4 && m4 < 60) areas.push('huntingForensics');
  if (moduleResults.M5 && m5 < 70) areas.push('strategyLeadership');
  if (['dunningKrugerRisk', 'optimistic', 'conservative'].includes(confidenceKey)) areas.push('confidenceCalibration');

  if (!areas.length) {
    if (publicLevel === 'manager') areas.push('strategyLeadership');
    else if (publicLevel === 'l3') areas.push('huntingForensics');
    else if (publicLevel === 'l2' || publicLevel === 'seniorL2') areas.push('incidentAnalysis');
    else areas.push('fundamentals');
  }
  return [...new Set(areas)];
}

export function buildInterviewQuestionKeys(moduleResults: Record<string, ModuleResult | null>, confidenceKey: string, publicLevel: Level): string[] {
  const keys: string[] = [];

  if ((moduleResults.M2?.percent ?? 100) < 85 || publicLevel === 'preL1') keys.push('fundamentals');
  if ((moduleResults.M3?.percent ?? 100) < 70) keys.push('incidentAnalysis');
  if (moduleResults.M4 && (moduleResults.M4?.percent ?? 100) < 60) keys.push('huntingForensics');
  if (moduleResults.M5 && (moduleResults.M5?.percent ?? 100) < 70) keys.push('strategyLeadership');
  if (['dunningKrugerRisk', 'optimistic'].includes(confidenceKey)) keys.push('confidenceCalibration');
  if (publicLevel === 'manager') keys.push('managementVerification');

  if (!keys.length) {
    if (publicLevel === 'manager') keys.push('strategyLeadership', 'managementVerification');
    else if (publicLevel === 'l3') keys.push('huntingForensics');
    else if (publicLevel === 'l2' || publicLevel === 'seniorL2') keys.push('incidentAnalysis');
    else keys.push('fundamentals');
  }
  return [...new Set(keys)];
}
