export const TEST_USER_ID =
  process.env.PLAYWRIGHT_TEST_USER_ID ?? "11111111-1111-1111-1111-111111111111";

export function uniqueName(prefix: string): string {
  const stamp = Date.now();
  const suffix = Math.random().toString(36).slice(2, 7);
  return `e2e-${prefix}-${stamp}-${suffix}`;
}

/** Today's date YYYY-MM-DD in the runner's local timezone (matches `<input type="date">`). */
export function todayLocalIsoDate(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
