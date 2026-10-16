// ── Indian Rupee Number Formatter ─────────────────────────────────────────
// Formats 120000 -> "Rs 1,20,000" or paise (12000000 -> "Rs 1,20,000")
export function formatINR(amount: number, isPaise = true): string {
  const rupees = isPaise ? Math.floor(amount / 100) : amount;
  const parts = rupees.toString().split('.');
  let lastThree = parts[0].slice(-3);
  const otherNumbers = parts[0].slice(0, -3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `Rs ${formatted}`;
}

// ── IST Date-Time Formatter ──────────────────────────────────────────────
export function formatIST(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid date';

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${formatter.format(date)} (IST)`;
}
