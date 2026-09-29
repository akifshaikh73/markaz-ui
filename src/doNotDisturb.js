import React from 'react';
import { formatDate } from './utils';

// Response value used in RESPONSE_OPTIONS (AddressDetail / AddAddress).
export const DND_RESPONSE = 'Do Not Disturb';
// How many of the most recent visits to look at.
export const DND_LOOKBACK = 3;

// Shared look for Do Not Disturb listings: row tint, badge and banner colors.
export const DND_COLORS = {
    rowBackground: '#fdecea',
    accent: '#c62828',
    border: '#ef9a9a',
    text: '#b71c1c',
};

const DND_COMMENT_PATTERN = /do\s*not\s*disturb|\bdnd\b/i;

function visitTime(visit) {
    const raw = visit?.createdDate?.$date ?? visit?.createdDate;
    const t = new Date(raw).getTime();
    return isNaN(t) ? 0 : t;
}

function isDndVisit(visit) {
    if (!visit) return false;
    if ((visit.response || '').trim().toLowerCase() === DND_RESPONSE.toLowerCase()) return true;
    return DND_COMMENT_PATTERN.test(visit.comments || '');
}

/**
 * Returns the most recent visit (within the last DND_LOOKBACK visits) that marks the
 * listing as Do Not Disturb — via the response or the comment text — or null.
 * Ties on date fall back to array order (visits are appended, so later = newer).
 */
export function getDoNotDisturbVisit(address) {
    const history = Array.isArray(address?.visitHistory) ? address.visitHistory : [];
    return history
        .map((visit, index) => ({ visit, index }))
        .sort((a, b) => (visitTime(b.visit) - visitTime(a.visit)) || (b.index - a.index))
        .slice(0, DND_LOOKBACK)
        .map(({ visit }) => visit)
        .find(isDndVisit) || null;
}

export function isDoNotDisturb(address) {
    return getDoNotDisturbVisit(address) !== null;
}

/** Small ⛔ marker shown next to the listing ID in tables. */
export function DoNotDisturbIcon({ style }) {
    return (
        <span
            title="Do Not Disturb — do not visit"
            aria-label="Do Not Disturb"
            role="img"
            style={{ marginLeft: '4px', fontSize: '0.9em', ...style }}
        >⛔</span>
    );
}

/** Prominent warning banner for the top of the address detail page. */
export function DoNotDisturbBanner({ visit }) {
    if (!visit) return null;
    const date = formatDate(visit.createdDate);
    return (
        <div
            role="alert"
            style={{
                margin: '0.5rem 0',
                padding: '0.75rem 1rem',
                background: DND_COLORS.rowBackground,
                border: `1px solid ${DND_COLORS.border}`,
                borderLeft: `6px solid ${DND_COLORS.accent}`,
                borderRadius: '6px',
                color: DND_COLORS.text,
            }}
        >
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>⛔ Do Not Disturb — please do not visit</div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.25rem', color: '#5d1a1a' }}>
                This household asked not to be visited{date ? ` (recorded ${date})` : ''}.
                If contact is truly necessary, check with your Masjid Admin first and proceed with caution and respect.
            </div>
            {visit.comments && visit.comments.trim() && (
                <div style={{ fontSize: '0.85rem', marginTop: '0.35rem', fontStyle: 'italic', color: '#5d1a1a' }}>
                    “{visit.comments.trim()}”
                </div>
            )}
        </div>
    );
}
