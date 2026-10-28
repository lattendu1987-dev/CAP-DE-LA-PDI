import { ageOn } from "./age";

export interface TrialLike {
  minAge: number | null;
  maxAge: number | null;
  deadline: Date;
  startsAt: Date;
}

/** Âge du joueur le jour de la détection. */
export function eligibleAge(trial: TrialLike, birthDate: Date): boolean {
  const age = ageOn(birthDate, trial.startsAt);
  if (trial.minAge && age < trial.minAge) return false;
  if (trial.maxAge && age > trial.maxAge) return false;
  return true;
}

export function isOpen(trial: TrialLike, now = new Date()): boolean {
  return trial.deadline.getTime() >= now.getTime();
}

export function validTrialDates(startsAt: Date, deadline: Date, now = new Date()): boolean {
  return !isNaN(startsAt.getTime()) && !isNaN(deadline.getTime()) && deadline > now && deadline <= startsAt;
}
