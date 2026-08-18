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

/** Returns today's date as a YYYY-MM-DD string in local time (for date input defaults). */
export function localDateString(d = new Date()) {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

import { getUserRole } from './config';

const roleStyles = {
    MarkazAdmin: { background: '#ede7f6', color: '#6a1b9a', border: '1px solid #ce93d8' },
    MasjidAdmin: { background: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80' },
    '':          { background: '#f5f5f5', color: '#555',    border: '1px solid #ddd' },
};

const roleLabel = { MarkazAdmin: 'Markaz Admin', MasjidAdmin: 'Masjid Admin', '': 'General' };

/** Inline role badge — reads role from localStorage via config. */
export function RoleBadge() {
    const role = getUserRole();
    const style = {
        fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px',
        fontWeight: 600, whiteSpace: 'nowrap',
        ...(roleStyles[role] || roleStyles['']),
    };
    return <span style={style}>{roleLabel[role] || 'General'}</span>;
}
