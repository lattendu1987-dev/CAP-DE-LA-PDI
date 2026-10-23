export function ageOn(birthDate: Date, today: Date = new Date()): number {
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const m = today.getUTCMonth() - birthDate.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < birthDate.getUTCDate())) age--;
  return age;
}

export function isMinor(birthDate: Date, today: Date = new Date()): boolean {
  return ageOn(birthDate, today) < 18;
}

/** Date de naissance la plus récente / la plus ancienne pour un âge donné. */
export function birthDateRangeForAge(minAge?: number, maxAge?: number, today: Date = new Date()) {
  const range: { gte?: Date; lte?: Date } = {};
  if (maxAge !== undefined) {
    // né après (aujourd'hui - (maxAge+1) ans)
    const d = new Date(Date.UTC(today.getUTCFullYear() - maxAge - 1, today.getUTCMonth(), today.getUTCDate()));
    d.setUTCDate(d.getUTCDate() + 1);
    range.gte = d;
  }
  if (minAge !== undefined) {
    range.lte = new Date(Date.UTC(today.getUTCFullYear() - minAge, today.getUTCMonth(), today.getUTCDate()));
  }
  return range;
}
