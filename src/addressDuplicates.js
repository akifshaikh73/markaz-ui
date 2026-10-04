// Client-side duplicate-address detection used by the add/edit address forms.
// Only address1 and address2 are compared: city, state and zipcode are often missing
// on listings, so they are deliberately ignored. The street (house number + name) must
// match; address2 is then filtered with a plain "contains" search on what was typed.

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

// Text after the street in address1 ("... Rd APT 217", "... Ave APT B", "... Rd (Code #10)", "... Rd # 416",
// "... Ave 3rd Floor") is split off so the street still compares equal; that tail is searched together
// with address2. A label is required (except "<n>th Floor"), so "... Ave E" stays part of the street.
const LABELLED_TAIL = String.raw`(?:(?:\b(?:apartment|apt|unit|suite|ste|door|code|buzzer|buzz|bldg|building|floor|fl)(?![a-z])\.?|#)[\s:.-]*)+#?\s*(?:[a-z0-9-]*\d[a-z0-9-]*|[a-z](?![a-z0-9]))`;
const FLOOR_TAIL = String.raw`\d+(?:st|nd|rd|th)?\s+(?:floor|fl)\.?`;
const TRAILING_RE = new RegExp(String.raw`[\s,([]*(?:${LABELLED_TAIL}|${FLOOR_TAIL})[\s)\]]*$`, 'i');
// Labels typed before the apartment ("Apt 36", "Unit #36", "Code 36") — not part of the search.
const LEADING_LABELS_RE = /^(?:(?:apartment|apt|unit|suite|ste|door|code|buzzer|buzz|bldg|building)(?: |$))+/;
// Labels alone ("Apt ") mean no apartment is recorded.
const LABEL_WORDS_RE = /\b(?:apartment|apt|unit|suite|ste)\b/g;

export function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Lowercase, punctuation to spaces, single-spaced: "Apt Door Code # 55" -> "apt door code 55".
const normalizeText = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function tokens(s) {
    return normalizeText(s).split(' ').filter(Boolean);
}

/**
 * @returns {{ houseNumber: string, street: string, core: string, unitText: string }}
 *   core is the street without street-type/direction words, used for matching;
 *   unitText is address2 plus any tail split off address1, normalized for searching.
 */
export function normalizeAddress({ address1, address2 } = {}) {
    let line1 = String(address1 || '');
    let tail = '';
    const trailing = line1.match(TRAILING_RE);
    if (trailing && trailing.index > 0) {
        tail = line1.slice(trailing.index);
        line1 = line1.slice(0, trailing.index);
    }

    const words = tokens(line1).map(w => ABBREVIATIONS[w] || w);
    const houseNumber = words.length > 0 && /^\d[\da-z]*$/.test(words[0]) ? words.shift() : '';
    const coreWords = words.filter(w => !NOISE_WORDS.has(w));
    return {
        houseNumber,
        street: words.join(' '),
        core: (coreWords.length > 0 ? coreWords : words).join(' '),
        unitText: normalizeText(`${address2 || ''} ${tail}`),
    };
}

/** What to look for in address2: the typed text without leading "Apt" / "Unit" / "Code" / "#". */
export function apartmentSearchTerm(address2) {
    return normalizeText(address2).replace(LEADING_LABELS_RE, '').trim();
}

const hasApartment = (unitText) => unitText.replace(LABEL_WORDS_RE, '').trim() !== '';

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
 * Split search results at the same street into "already exists" (likely) and "other units at
 * this address" (sameBuilding). Listings from other masjids and excludeId are dropped.
 * - Nothing typed in address2: listings without an apartment are likely, the rest sameBuilding.
 * - Something typed ("36"): only listings whose address2 contains it are kept — as a separate
 *   number ("Apt code #36", "Unit 36") they are likely, inside a longer one ("360", "136",
 *   "36B") they are sameBuilding. Nothing is interpreted (door code vs apartment).
 */
export function classifyMatches(input, candidates, { masjidId, excludeId } = {}) {
    const likely = [];
    const sameBuilding = [];
    const target = normalizeAddress(input);
    if (!target.core) return { likely, sameBuilding };
    // An apartment typed into address1 ("1301 S Finley Rd Apt 55") counts when address2 is empty.
    const term = apartmentSearchTerm(input.address2) || apartmentSearchTerm(target.unitText);
    const wholeTerm = term ? new RegExp(`(?:^| )${escapeRegex(term)}(?: |$)`) : null;

    (candidates || []).forEach(c => {
        if (!c || !c._id) return;
        if (masjidId !== undefined && masjidId !== null && masjidId !== '' && String(c.masjidId) !== String(masjidId)) return;
        if (excludeId !== undefined && excludeId !== null && String(c._id) === String(excludeId)) return;
        const n = normalizeAddress(c);
        if (n.houseNumber !== target.houseNumber || n.core !== target.core) return;
        if (!term) {
            (hasApartment(n.unitText) ? sameBuilding : likely).push(c);
        } else if (n.unitText.includes(term)) {
            (wholeTerm.test(n.unitText) ? likely : sameBuilding).push(c);
        }
    });
    return { likely, sameBuilding };
}
