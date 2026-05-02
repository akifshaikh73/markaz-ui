/**
 * Safely formats a date value that may be a MongoDB extended JSON object
 * ({ $date: "..." }), a plain ISO string, or a Date instance.
 */
export function formatDate(value) {
    if (!value) return '';
    const raw = (typeof value === 'object' && value.$date) ? value.$date : value;
    const d = new Date(raw);
    return isNaN(d) ? String(raw) : d.toLocaleDateString();
}
