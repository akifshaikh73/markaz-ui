// One-off geocoding through the public OpenStreetMap Nominatim service.
// Usage policy: max 1 request/second, no search-as-you-type, attribute © OpenStreetMap contributors.
const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const TIMEOUT_MS = 5000;

const hasLocality = ({ city, state, zipcode }) => Boolean((city && state) || zipcode);

// Resolves to { latitude, longitude } for the first match, or null. Never rejects: callers carry on
// without a location when the lookup fails.
function lookup(parts) {
    const params = new URLSearchParams({
        format: 'json',
        limit: '1',
        countrycodes: 'us',
        q: parts.filter(Boolean).join(', '),
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    return fetch(`${ENDPOINT}?${params}`, { signal: controller.signal, headers: { 'Accept-Language': 'en' } })
        .then(res => (res.ok ? res.json() : null))
        .then(results => {
            const hit = Array.isArray(results) ? results[0] : null;
            const latitude = hit ? parseFloat(hit.lat) : NaN;
            const longitude = hit ? parseFloat(hit.lon) : NaN;
            return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
        })
        .catch(() => null)
        .finally(() => clearTimeout(timer));
}

export function geocodeAddress({ address1, city, state, zipcode }) {
    // Street + number alone matches towns across the whole US; require a locality to pin it down.
    if (!address1 || !hasLocality({ city, state, zipcode })) return Promise.resolve(null);
    return lookup([address1, city, state, zipcode]);
}

// Rough position of a city/zip, used to centre a map when the street itself can't be found.
export function geocodeArea({ city, state, zipcode }) {
    if (!hasLocality({ city, state, zipcode })) return Promise.resolve(null);
    return lookup([city, state, zipcode]);
}
