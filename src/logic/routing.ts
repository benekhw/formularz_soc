import type { ModuleResult } from '../types/assessment';
import { buildProfile } from './classification';
import { buildModuleResult } from './scoring';

const MODULE_GATE_PERCENT: Record<string, number> = {
  M2: 60,
  M3: 50,
  M4: 50,
  M5: 70,
};

export { MODULE_GATE_PERCENT };

export function determineNextModule(
  currentModuleId: string,
  answers: Record<string, Record<string, unknown>>,
  moduleResults: Record<string, ModuleResult | null>,
): string | null {
  const profile = buildProfile(answers);

  if (currentModuleId === 'M1') return 'M2';

  if (currentModuleId === 'M2') {
    return (moduleResults.M2?.percent ?? 0) >= MODULE_GATE_PERCENT.M2 ? 'M3' : 'M6';
  }

  if (currentModuleId === 'M3') {
    if ((moduleResults.M3?.percent ?? 0) >= MODULE_GATE_PERCENT.M3) return 'M4';
    return profile.role === 'management' ? 'M5' : 'M6';
  }

  if (currentModuleId === 'M4') {
    if ((moduleResults.M4?.percent ?? 0) >= MODULE_GATE_PERCENT.M4) return 'M5';
    return profile.role === 'management' ? 'M5' : 'M6';
  }

  if (currentModuleId === 'M5') return 'M6';

  return null;
}

export function simulateRouting(answers: Record<string, Record<string, unknown>>): {
  visitedModules: string[];
  moduleResults: Record<string, ModuleResult | null>;
} {
  const visitedModules: string[] = [];
  const moduleResults: Record<string, ModuleResult | null> = {};
  let currentModuleId: string | null = 'M1';

  while (currentModuleId) {
    if (!visitedModules.includes(currentModuleId)) {
      visitedModules.push(currentModuleId);
    }
    moduleResults[currentModuleId] = buildModuleResult(currentModuleId, answers);
    currentModuleId = determineNextModule(currentModuleId, answers, moduleResults);
  }

  return { visitedModules, moduleResults };
}

export function getInitialDiscoveredRoute(): string[] {
  return ['M1', 'M2'];
}
