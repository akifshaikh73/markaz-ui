import React from 'react';
import { getUserRole } from './config';

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

/**
 * Applies an edit made on Address Detail to Landing's cached `addressList` in localStorage,
 * so the row is current when the user navigates back (Landing reuses the cache instead of
 * re-fetching). A unit change drops the listing from a unit-scoped cached list.
 */
export function patchCachedListing(id, fields) {
    try {
        const list = JSON.parse(localStorage.getItem('addressList') || 'null');
        if (!Array.isArray(list)) return;
        const ctx = JSON.parse(localStorage.getItem('landingContext') || '{}');
        const next = list.flatMap(item => {
            if (item._id !== id) return [item];
            const updated = { ...item, ...fields };
            if (fields.unitId !== undefined && ctx.unitID && ctx.unitID !== 'all'
                && String(updated.unitId) !== String(ctx.unitID)) {
                return [];
            }
            return [updated];
        });
        localStorage.setItem('addressList', JSON.stringify(next));
    } catch {
        // Cache is a convenience; Landing re-fetches on the next search/unit switch.
    }
}

/**
 * Turns search-box text into the regex the API's filter/search expects: `*` is a wildcard,
 * everything else is matched literally. "1301*Finley" -> "1301.*Finley" (finds "1301 S Finley"
 * and "1301 South Finley Road"); "12 (Rear)" -> "12 \(Rear\)" instead of breaking the regex.
 * Text containing `.*` is taken as a regex typed on purpose ("13.*Finley", "1.*.S.* Finley") and
 * passed through unchanged when it is a valid pattern; otherwise the wildcard rules apply.
 */
export function wildcardToRegex(text) {
    const typed = String(text ?? '').trim();
    if (typed.includes('.*')) {
        try {
            new RegExp(typed); // throws if the pattern is invalid
            return typed;
        } catch {
            // not a valid regex: fall back to wildcard matching below
        }
    }
    return typed
        .split(/\*+/)
        .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*');
}

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
