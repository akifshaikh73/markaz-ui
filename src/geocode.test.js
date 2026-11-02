import { geocodeAddress } from './geocode';

const respond = (body, ok = true) => {
    global.fetch = jest.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(body) }));
};

afterEach(() => {
    delete global.fetch;
});

describe('geocodeAddress', () => {
    const full = { address1: '456 Oak Ave', city: 'Chicago', state: 'IL', zipcode: '60614' };

    it('returns numeric coordinates for the first match', async () => {
        respond([{ lat: '41.92', lon: '-87.65' }]);
        await expect(geocodeAddress(full)).resolves.toEqual({ latitude: 41.92, longitude: -87.65 });
        const url = global.fetch.mock.calls[0][0];
        expect(url).toContain('countrycodes=us');
        expect(url).toContain(encodeURIComponent('456 Oak Ave, Chicago, IL, 60614').replace(/%20/g, '+'));
    });

    it('returns null without calling out when there is no city/state or zip', async () => {
        respond([{ lat: '1', lon: '2' }]);
        await expect(geocodeAddress({ address1: '456 Oak Ave' })).resolves.toBeNull();
        await expect(geocodeAddress({ address1: '456 Oak Ave', city: 'Chicago' })).resolves.toBeNull();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns null for no match, a bad response, or a network failure', async () => {
        respond([]);
        await expect(geocodeAddress(full)).resolves.toBeNull();
        respond({ error: 'nope' });
        await expect(geocodeAddress(full)).resolves.toBeNull();
        respond([], false);
        await expect(geocodeAddress(full)).resolves.toBeNull();
        global.fetch = jest.fn(() => Promise.reject(new Error('offline')));
        await expect(geocodeAddress(full)).resolves.toBeNull();
    });
});
