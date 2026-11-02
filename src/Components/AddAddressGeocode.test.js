import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AddAddress from './AddAddress';
import { geocodeAddress } from '../geocode';

jest.mock('../geocode', () => ({ geocodeAddress: jest.fn() }));

function mountAndFill() {
    global.fetch = jest.fn((url, opts = {}) => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(opts.method === 'POST' ? { _id: '900' } : []),
    }));
    render(
        <MemoryRouter>
            <AddAddress masjidID="7" unitOptions={[1, 2]} defaultUnitId={2} />
        </MemoryRouter>
    );
    userEvent.type(screen.getByPlaceholderText('First name'), 'New');
    userEvent.type(screen.getByPlaceholderText('Last name'), 'Person');
    userEvent.type(screen.getByPlaceholderText('Street address'), '456 Oak Ave');
    userEvent.type(screen.getByPlaceholderText('City'), 'Chicago');
    userEvent.type(screen.getByPlaceholderText('IL'), 'IL');
    userEvent.click(screen.getByRole('button', { name: 'Add Address' }));
}

const postedBody = () => {
    const post = global.fetch.mock.calls.find(([, opts = {}]) => opts.method === 'POST');
    return post && JSON.parse(post[1].body);
};

afterEach(() => {
    delete global.fetch;
    jest.clearAllMocks();
});

describe('AddAddress coordinates on save', () => {
    it('sends the geocoded latitude/longitude with the new address', async () => {
        geocodeAddress.mockResolvedValue({ latitude: 41.9, longitude: -87.7 });
        mountAndFill();

        await waitFor(() => expect(postedBody()).toBeTruthy());
        expect(geocodeAddress).toHaveBeenCalledWith(expect.objectContaining({ address1: '456 Oak Ave', city: 'Chicago', state: 'IL' }));
        expect(postedBody()).toMatchObject({ address1: '456 Oak Ave', latitude: 41.9, longitude: -87.7 });
        expect(await screen.findByText('Address Created')).toBeInTheDocument();
    });

    it('still saves the address, without coordinates, when the lookup finds nothing', async () => {
        geocodeAddress.mockResolvedValue(null);
        mountAndFill();

        await waitFor(() => expect(postedBody()).toBeTruthy());
        expect(postedBody()).not.toHaveProperty('latitude');
        expect(postedBody()).not.toHaveProperty('longitude');
        expect(await screen.findByText('Address Created')).toBeInTheDocument();
    });
});
