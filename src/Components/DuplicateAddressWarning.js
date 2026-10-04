import React from 'react';
import { formatDate } from '../utils';

const pillStyle = { fontSize: '0.7rem', fontWeight: 700, color: '#e65100', border: '1px solid #ffb74d', borderRadius: '10px', padding: '0 6px', marginLeft: '0.4rem' };
const noteStyle = { color: '#888', fontSize: '0.8rem', margin: '0 0 0.75rem' };

function MatchRow({ match, renderActions }) {
    const name = [match.firstName, match.lastName].filter(Boolean).join(' ') || '(no name)';
    const street = [match.address1, match.address2 && match.address2.trim()].filter(Boolean).join(', ');
    const place = [match.city, [match.state, match.zipcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    return (
        <li style={{ padding: '0.4rem 0', borderTop: '1px solid #ffe0b2', listStyle: 'none' }}>
            <div style={{ fontSize: '0.9rem' }}>
                <strong>{name}</strong>
                {match.inactive && <span style={pillStyle}>INACTIVE</span>}
                <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '0.4rem' }}>#{match._id} · M{match.masjidId}-U{match.unitId}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#444' }}>{street}{place && <span style={{ color: '#888' }}> — {place}</span>}</div>
            {(match.latestResponse || match.lastModifiedDate) && (
                <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    Last visit: {match.latestResponse || '—'}{match.lastModifiedDate && ` (${formatDate(match.lastModifiedDate)})`}
                </div>
            )}
            {renderActions && <div style={{ marginTop: '0.3rem' }}>{renderActions(match)}</div>}
        </li>
    );
}

/**
 * Shows existing listings found by useDuplicateAddressCheck. The host form supplies the
 * per-listing buttons through renderActions(match).
 */
function DuplicateAddressWarning({ checking, likely = [], sameBuilding = [], error, renderActions }) {
    if (error) return <p style={noteStyle}>Couldn't check for existing listings ({error}).</p>;
    if (likely.length === 0 && sameBuilding.length === 0) {
        return checking ? <p style={noteStyle}>Checking for existing listings…</p> : null;
    }

    return (
        <div role="alert" style={{ margin: '0 0 0.75rem', padding: '0.6rem 0.8rem', background: '#fff8e1', border: '1px solid #ffb74d', borderRadius: '6px' }}>
            {likely.length > 0 && (
                <>
                    <div style={{ color: '#e65100', fontWeight: 700, fontSize: '0.9rem' }}>
                        ⚠ This address already exists ({likely.length})
                    </div>
                    <div style={{ color: '#795548', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        Use the existing listing instead of adding a duplicate.
                    </div>
                    <ul style={{ margin: 0, padding: 0 }}>
                        {likely.map(m => <MatchRow key={m._id} match={m} renderActions={renderActions} />)}
                    </ul>
                </>
            )}
            {sameBuilding.length > 0 && (
                <>
                    <div style={{ color: '#795548', fontWeight: 600, fontSize: '0.85rem', marginTop: likely.length > 0 ? '0.5rem' : 0 }}>
                        Other units at this address ({sameBuilding.length})
                    </div>
                    <ul style={{ margin: 0, padding: 0 }}>
                        {sameBuilding.map(m => <MatchRow key={m._id} match={m} renderActions={renderActions} />)}
                    </ul>
                </>
            )}
        </div>
    );
}

export default DuplicateAddressWarning;
