const AUTO_EXPLORE_STEP_MS = 520;

export function autoExploreStepDuration(speed: number): number {
  return Math.round(AUTO_EXPLORE_STEP_MS / ([1, 2, 3].includes(speed) ? speed : 1));
}

export function autoExploreStepDelay(speed: number, lastStartedAt: number | null, now: number): number {
  const duration = autoExploreStepDuration(speed);
  return lastStartedAt === null ? duration : Math.max(0, duration - (now - lastStartedAt));
}
