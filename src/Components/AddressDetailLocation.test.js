import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AddressDetail from './AddressDetail';
import { geocodeAddress } from '../geocode';

jest.mock('../geocode', () => ({ geocodeAddress: jest.fn(), geocodeArea: jest.fn() }));
// react-leaflet is ESM-only, which Jest can't load; the picker is tested through a stand-in.
jest.mock('./PinPicker', () => {
    const { createElement } = require('react');
    return {
        __esModule: true,
        default: ({ onSave, onCancel }) => createElement('div', null,
            createElement('button', { onClick: () => onSave({ latitude: 41.5, longitude: -87.5 }) }, 'Stub save pin'),
            createElement('button', { onClick: onCancel }, 'Stub cancel pin')),
    };
});

const listing = (over) => ({
    _id: '1', masjidId: 7, unitId: 1, firstName: 'Old', lastName: 'Name',
    address1: '9 Oak Dr', city: 'Chicago', state: 'IL', zipcode: 60614, inactive: false, ...over,
});
const located = { latitude: 41.9, longitude: -87.7 };

function mount(address) {
    global.fetch = jest.fn(() => Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve({ acknowledged: true, matchedCount: 1, modifiedCount: 1 }),
    }));
    render(
        <MemoryRouter initialEntries={['/address/1']}>
            <Routes>
                <Route path="/address/:id" element={<AddressDetail address={address} isModal />} />
                <Route path="/route" element={<div>Route page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

const puts = () => global.fetch.mock.calls
    .filter(([url, opts = {}]) => opts.method === 'PUT' && url.includes('/api/addressList/1'))
    .map(([, opts]) => JSON.parse(opts.body));

async function editAddress(field, value) {
    userEvent.click(screen.getByRole('button', { name: 'Edit address' }));
    const input = await screen.findByPlaceholderText(field);
    userEvent.clear(input);
    userEvent.type(input, value);
    userEvent.click(screen.getByTitle('Save address'));
}

afterEach(() => {
    delete global.fetch;
    jest.clearAllMocks();
});

describe('AddressDetail: Locate & route', () => {
    it('keeps the plain Route button and skips the lookup when coordinates exist', () => {
        mount(listing(located));
        expect(screen.getByRole('button', { name: /🗺 Route/ })).toBeEnabled();
        expect(screen.queryByRole('button', { name: /Locate & route/ })).not.toBeInTheDocument();
        expect(geocodeAddress).not.toHaveBeenCalled();
    });

    it('finds the location, saves it, then opens the route', async () => {
        geocodeAddress.mockResolvedValue(located);
        mount(listing());

        userEvent.click(screen.getByRole('button', { name: /Locate & route/ }));

        expect(await screen.findByText('Route page')).toBeInTheDocument();
        expect(puts()).toEqual([located]);
    });

    it('offers to fix the address or place it on the map when it is not found', async () => {
        geocodeAddress.mockResolvedValue(null);
        mount(listing());

        userEvent.click(screen.getByRole('button', { name: /Locate & route/ }));

        expect(await screen.findByText(/couldn't find this address on the map/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Fix address' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Place on map' })).toBeInTheDocument();
        expect(puts()).toEqual([]);
        expect(screen.queryByText('Route page')).not.toBeInTheDocument();
    });

    it('"Fix address" opens the address editor', async () => {
        geocodeAddress.mockResolvedValue(null);
        mount(listing());
        userEvent.click(screen.getByRole('button', { name: /Locate & route/ }));

        userEvent.click(await screen.findByRole('button', { name: 'Fix address' }));

        expect(await screen.findByPlaceholderText('Street address')).toBeInTheDocument();
    });

    it('saves a hand-placed pin and then enables Route', async () => {
        geocodeAddress.mockResolvedValue(null);
        mount(listing());
        userEvent.click(screen.getByRole('button', { name: /Locate & route/ }));
        userEvent.click(await screen.findByRole('button', { name: 'Place on map' }));

        userEvent.click(await screen.findByRole('button', { name: 'Stub save pin' }));

        expect(await screen.findByRole('button', { name: /🗺 Route/ })).toBeEnabled();
        expect(puts()).toEqual([{ latitude: 41.5, longitude: -87.5 }]);
        expect(screen.queryByRole('button', { name: 'Stub save pin' })).not.toBeInTheDocument();
    });

    it('reports an API that does not store the location', async () => {
        geocodeAddress.mockResolvedValue(located);
        mount(listing());
        global.fetch.mockImplementation(() => Promise.resolve({
            ok: true, status: 200, json: () => Promise.resolve({ acknowledged: true, matchedCount: 1, modifiedCount: 0 }),
        }));

        userEvent.click(screen.getByRole('button', { name: /Locate & route/ }));

        expect(await screen.findByText(/API needs updating/)).toBeInTheDocument();
        expect(screen.queryByText('Route page')).not.toBeInTheDocument();
    });
});

describe('AddressDetail: coordinates follow address edits', () => {
    it('sends the new location with the street change', async () => {
        geocodeAddress.mockResolvedValue({ latitude: 42.0, longitude: -88.0 });
        mount(listing(located));

        await editAddress('Street address', '77 Elm St');

        await waitFor(() => expect(puts()).toHaveLength(1));
        expect(puts()[0]).toEqual({ address1: '77 Elm St', latitude: 42.0, longitude: -88.0 });
        expect(geocodeAddress).toHaveBeenCalledWith(expect.objectContaining({ address1: '77 Elm St', city: 'Chicago', state: 'IL' }));
    });

    it('clears the old location, and says so, when the new address is not found', async () => {
        geocodeAddress.mockResolvedValue(null);
        mount(listing(located));

        await editAddress('Street address', '77 Elm St');

        await waitFor(() => expect(puts()).toHaveLength(1));
        expect(puts()[0]).toEqual({ address1: '77 Elm St', latitude: 0, longitude: 0 });
        expect(await screen.findByText(/old location was removed/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Locate & route/ })).toBeInTheDocument();
    });

    it('does not touch coordinates when no location existed and none is found', async () => {
        geocodeAddress.mockResolvedValue(null);
        mount(listing());

        await editAddress('Street address', '77 Elm St');

        await waitFor(() => expect(puts()).toHaveLength(1));
        expect(puts()[0]).toEqual({ address1: '77 Elm St' });
    });

    it('does not look anything up for an apartment-only change', async () => {
        mount(listing(located));

        await editAddress('Apt / Suite / Unit', '4B');

        await waitFor(() => expect(puts()).toHaveLength(1));
        expect(puts()[0]).toEqual({ address2: '4B' });
        expect(geocodeAddress).not.toHaveBeenCalled();
    });
});
