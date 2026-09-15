/**
 * The current date in India, as YYYY-MM-DD.
 *
 * Limitation periods are counted in Indian calendar days, so a user in Mumbai
 * at 00:30 IST must not be told it is still yesterday because the server is on
 * UTC. `now` is a parameter so this is testable without faking the clock.
 */
export function todayInIndia(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
