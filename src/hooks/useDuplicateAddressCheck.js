import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { buildSearchPattern, classifyMatches } from '../addressDuplicates';

const EMPTY_SEARCH = { pattern: null, candidates: [], checking: false, error: '' };
const NO_MATCHES = { likely: [], sameBuilding: [] };
const DEBOUNCE_MS = 500;

/**
 * Looks up existing listings (active and inactive) at the address being typed.
 * Uses GET /api/addressList/search/address/:address, which matches only address1/address2 —
 * city/state/zip are intentionally not part of the search. The API is queried only when the
 * house-number search changes; edits to the rest of the street or to address2 (apartment)
 * re-filter the fetched listings immediately. Never blocks: on error it reports the message
 * and returns no matches.
 */
export default function useDuplicateAddressCheck({ masjidId, address1, address2, excludeId, enabled = true }) {
    const API_URL = process.env.REACT_APP_API_URL || '';
    const pattern = enabled ? buildSearchPattern(address1) : null;
    const [search, setSearch] = useState(EMPTY_SEARCH);
    const [nonce, setNonce] = useState(0);
    const timer = useRef(null);
    const seq = useRef(0);

    useEffect(() => {
        clearTimeout(timer.current);
        const mySeq = ++seq.current;
        if (!pattern) {
            setSearch(EMPTY_SEARCH);
            return undefined;
        }
        setSearch(prev => ({ ...prev, checking: true, error: '' }));
        timer.current = setTimeout(() => {
            fetch(`${API_URL}/api/addressList/search/address/${encodeURIComponent(pattern)}`)
                .then(res => {
                    if (!res.ok) throw new Error(`Server error: ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    if (mySeq !== seq.current) return;
                    setSearch({ pattern, candidates: Array.isArray(data) ? data : [], checking: false, error: '' });
                })
                .catch(err => {
                    if (mySeq !== seq.current) return;
                    setSearch({ ...EMPTY_SEARCH, error: err.message });
                });
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer.current);
    }, [API_URL, pattern, nonce]);

    // Results fetched for an older house number are not shown while the new search runs.
    const { likely, sameBuilding } = useMemo(() => (
        pattern && search.pattern === pattern
            ? classifyMatches({ address1, address2 }, search.candidates, { masjidId, excludeId })
            : NO_MATCHES
    ), [pattern, search, address1, address2, masjidId, excludeId]);

    const recheck = useCallback(() => setNonce(n => n + 1), []);

    return { checking: search.checking, error: search.error, likely, sameBuilding, recheck };
}
