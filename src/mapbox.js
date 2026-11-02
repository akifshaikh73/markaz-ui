// Mapbox Geocoding v6 helpers for address autocomplete. Without a token, autocomplete is disabled
// and callers fall back to a plain text input.
const TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
const ENDPOINT = 'https://api.mapbox.com/search/geocode/v6/forward';

export const autocompleteEnabled = () => !!TOKEN;

// Resolves to [{ id, label, parts: { address1, address2, city, state, zipcode } }].
export function searchAddresses(text, { location, signal } = {}) {
    const params = new URLSearchParams({
        q: text,
        access_token: TOKEN,
        autocomplete: 'true',
        types: 'address',
        country: 'us',
        limit: '5',
    });
    if (location) params.set('proximity', `${location.lng},${location.lat}`);

    return fetch(`${ENDPOINT}?${params}`, { signal })
        .then(res => {
            if (!res.ok) throw new Error(`Mapbox error: ${res.status}`);
            return res.json();
        })
        .then(data => (data.features || []).map(f => {
            const ctx = f.properties.context || {};
            return {
                id: f.id || f.properties.mapbox_id,
                label: f.properties.full_address || f.properties.name,
                parts: {
                    address1: ctx.address?.name || f.properties.name || '',
                    address2: '',
                    city: ctx.place?.name || '',
                    state: ctx.region?.region_code || '',
                    zipcode: ctx.postcode?.name || '',
                },
            };
        }));
}
