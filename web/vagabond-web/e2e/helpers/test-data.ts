export const TEST_USER_ID =
  process.env.PLAYWRIGHT_TEST_USER_ID ?? "11111111-1111-1111-1111-111111111111";

export function uniqueName(prefix: string): string {
  const stamp = Date.now();
  const suffix = Math.random().toString(36).slice(2, 7);
  return `e2e-${prefix}-${stamp}-${suffix}`;
}

export function todayIsoDate(): string {
  const date = new Date();
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
