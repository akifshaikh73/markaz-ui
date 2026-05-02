/**
 * Safely formats a date value that may be a MongoDB extended JSON object
 * ({ $date: "..." }), a plain ISO string, or a Date instance.
 *
 * Uses UTC date parts to avoid timezone-offset "off by one day" issues
 * that occur when a date-only ISO string is parsed as UTC midnight and
 * then displayed in a negative-offset local timezone.
 */
export function formatDate(value) {
    if (!value) return '';
    const raw = (typeof value === 'object' && value.$date) ? value.$date : value;
    const d = new Date(raw);
    if (isNaN(d)) return String(raw);
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day   = String(d.getUTCDate()).padStart(2, '0');
    const year  = d.getUTCFullYear();
    return `${month}/${day}/${year}`;
}
