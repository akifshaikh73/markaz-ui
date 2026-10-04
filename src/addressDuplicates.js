// Client-side duplicate-address detection used by the add/edit address forms.
// Only address1 and address2 are compared: city, state and zipcode are often missing
// on listings, so they are deliberately ignored. address2 only contributes an
// apartment / suite number.

const ABBREVIATIONS = {
    street: 'st', str: 'st', avenue: 'ave', av: 'ave', road: 'rd', drive: 'dr', lane: 'ln',
    court: 'ct', boulevard: 'blvd', place: 'pl', circle: 'cir', parkway: 'pkwy', highway: 'hwy',
    terrace: 'ter', trail: 'trl', square: 'sq',
    north: 'n', south: 's', east: 'e', west: 'w',
    northeast: 'ne', northwest: 'nw', southeast: 'se', southwest: 'sw',
};

// Street-type and direction words; dropped when comparing so "123 N Main" matches "123 Main St".
const NOISE_WORDS = new Set(['st', 'ave', 'rd', 'dr', 'ln', 'ct', 'blvd', 'pl', 'cir', 'pkwy', 'hwy',
    'ter', 'trl', 'sq', 'way', 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']);

const UNIT_DESIGNATOR = String.raw`(?:\b(?:apartment|apt|unit|suite|ste)\b\.?|#)\s*#?\s*`;
const TRAILING_UNIT_RE = new RegExp(`[\\s,]*${UNIT_DESIGNATOR}([a-z0-9-]+)\\s*$`, 'i');
const ANY_UNIT_RE = new RegExp(`${UNIT_DESIGNATOR}([a-z0-9-]+)`, 'i');
const BARE_UNIT_RE = /^#?\s*([0-9][a-z0-9-]*|[a-z])$/i;

export function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const normalizeUnit = (u) => (u ? u.toLowerCase().replace(/-/g, '') : '');

function tokens(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

// address2 counts only when it holds an apartment/suite number ("Apt 4B", "#4", "Suite 200", "4B").
function unitFromAddress2(address2) {
    const text = String(address2 || '').trim();
    if (!text) return '';
    const designated = text.match(ANY_UNIT_RE);
    if (designated) return normalizeUnit(designated[1]);
    const bare = text.match(BARE_UNIT_RE);
    return bare ? normalizeUnit(bare[1]) : '';
}

/**
 * @returns {{ houseNumber: string, street: string, core: string, unit: string }}
 *   core is the street without street-type/direction words, used for matching.
 */
export function normalizeAddress({ address1, address2 } = {}) {
    let line1 = String(address1 || '').trim();
    let unit = '';
    // Legacy listings often carry the apartment in address1 ("123 Main St Apt 4").
    const trailing = line1.match(TRAILING_UNIT_RE);
    if (trailing) {
        unit = normalizeUnit(trailing[1]);
        line1 = line1.slice(0, trailing.index);
    }
    if (!unit) unit = unitFromAddress2(address2);

    const words = tokens(line1).map(w => ABBREVIATIONS[w] || w);
    const houseNumber = words.length > 0 && /^\d[\da-z]*$/.test(words[0]) ? words.shift() : '';
    const coreWords = words.filter(w => !NOISE_WORDS.has(w));
    return {
        houseNumber,
        street: words.join(' '),
        core: (coreWords.length > 0 ? coreWords : words).join(' '),
        unit,
    };
}

/**
 * Regex sent to GET /api/addressList/search/address/:address (matched server-side against
 * address1/address2). Anchored on the house number so the result set stays small.
 * Returns null when there isn't enough of an address to search yet.
 */
export function buildSearchPattern(address1) {
    const { houseNumber, street } = normalizeAddress({ address1 });
    const streetWords = street.split(' ').filter(Boolean);
    if (houseNumber) {
        if (!streetWords.some(w => w.length >= 2)) return null;
        return `^\\s*${escapeRegex(houseNumber)}\\b`;
    }
    if (streetWords.length < 2 || streetWords[0].length < 3) return null;
    return `\\b${escapeRegex(streetWords[0])}\\W+${escapeRegex(streetWords[1])}\\b`;
}

/**
 * Split search results into exact-address matches and other units in the same building.
 * Listings from other masjids and the listing being edited (excludeId) are dropped.
 * Once an apartment/suite is entered, other apartments are narrowed to those whose unit
 * starts with what was typed ("1" keeps 1A, 10, 12; "12" keeps 12B); listings with no
 * unit on record stay, since the data is often incomplete.
 */
export function classifyMatches(input, candidates, { masjidId, excludeId } = {}) {
    const likely = [];
    const sameBuilding = [];
    const target = normalizeAddress(input);
    if (!target.core) return { likely, sameBuilding };

    (candidates || []).forEach(c => {
        if (!c || !c._id) return;
        if (masjidId !== undefined && masjidId !== null && masjidId !== '' && String(c.masjidId) !== String(masjidId)) return;
        if (excludeId !== undefined && excludeId !== null && String(c._id) === String(excludeId)) return;
        const n = normalizeAddress(c);
        if (n.houseNumber !== target.houseNumber || n.core !== target.core) return;
        if (n.unit === target.unit) likely.push(c);
        else if (!target.unit || !n.unit || n.unit.startsWith(target.unit)) sameBuilding.push(c);
    });
    return { likely, sameBuilding };
}
