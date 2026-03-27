import type { Assessment } from '../types/assessment';
import { TECHNICAL_MODULE_IDS } from '../data/questionBank';
import { simulateRouting } from './routing';
import {
  buildProfile,
  getTechnicalBaseLevel,
  buildInsights,
  buildGapAnalysis,
  buildConfidenceAnalysis,
  buildProfileSignals,
  getDevelopmentAreas,
  buildInterviewQuestionKeys,
} from './classification';

function buildCandidateSnapshot(
  profile: ReturnType<typeof buildProfile>,
  answers: Record<string, Record<string, unknown>>,
) {
  return {
    experienceChoice: profile.experienceChoice,
    backgroundChoice: profile.backgroundChoice,
    certifications: profile.certifications,
    targetRoleChoice: profile.roleChoice,
    selfAssessmentChoice: profile.selfChoice,
    workModelChoice: profile.workModelChoice,
    motivations: {
      'P6.1': (answers['P6.1'] as { text?: string })?.text?.trim?.() ?? '',
      'P6.2': (answers['P6.2'] as { text?: string })?.text?.trim?.() ?? '',
      'P6.3': (answers['P6.3'] as { text?: string })?.text?.trim?.() ?? '',
      'P6.4': (answers['P6.4'] as { choice?: string })?.choice ?? null,
    },
  };
}

export function deriveAssessment(
  answers: Record<string, Record<string, unknown>>,
): Assessment {
  const profile = buildProfile(answers);
  const { visitedModules, moduleResults } = simulateRouting(answers);
  const levelInfo = getTechnicalBaseLevel(profile, moduleResults);
  const insights = buildInsights(
    profile,
    levelInfo.baseLevel,
    levelInfo.publicLevel,
    moduleResults,
  );
  const gapAnalysis = buildGapAnalysis(profile, levelInfo.publicLevel);
  const confidenceAnalysis = buildConfidenceAnalysis(
    moduleResults,
    TECHNICAL_MODULE_IDS,
  );
  const profileSignals = buildProfileSignals(profile, levelInfo.publicLevel);
  const developmentAreas = getDevelopmentAreas(
    moduleResults,
    confidenceAnalysis.key,
    levelInfo.publicLevel,
  );
  const interviewQuestionKeys = buildInterviewQuestionKeys(
    moduleResults,
    confidenceAnalysis.key,
    levelInfo.publicLevel,
  );

  return {
    profile,
    visitedModules,
    moduleResults: moduleResults as Record<string, import('../types/assessment').ModuleResult>,
    classification: {
      baseLevel: levelInfo.baseLevel,
      publicLevel: levelInfo.publicLevel,
      insights,
      managerEligible: levelInfo.managerEligible,
      managerThresholdMet: levelInfo.managerThresholdMet,
    },
    gapAnalysis: gapAnalysis as Assessment['gapAnalysis'],
    confidenceAnalysis: confidenceAnalysis as Assessment['confidenceAnalysis'],
    profileSignals: profileSignals as Assessment['profileSignals'],
    developmentAreas: developmentAreas as Assessment['developmentAreas'],
    interviewQuestionKeys: interviewQuestionKeys as Assessment['interviewQuestionKeys'],
    candidateSnapshot: buildCandidateSnapshot(profile, answers),
  };
}
