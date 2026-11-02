import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AddAddress from './AddAddress';
import { searchAddresses } from '../mapbox';

jest.mock('../mapbox', () => ({
    autocompleteEnabled: () => true,
    searchAddresses: jest.fn(),
}));

const suggestion = (over = {}) => ({
    id: 'addr.1',
    label: '456 Oak Ave, Chicago, Illinois 60614, United States',
    parts: { address1: '456 Oak Ave', address2: '', city: 'Chicago', state: 'IL', zipcode: '60614', ...over },
});

function mountAddForm() {
    // The duplicate check also fetches; report no matches.
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) }));
    render(
        <MemoryRouter>
            <AddAddress masjidID="7" unitOptions={[1, 2]} defaultUnitId={2} />
        </MemoryRouter>
    );
}

// user-event 13 events aren't wrapped in act(), so use findBy/waitFor for anything they change.
async function typeAndPick(text, result) {
    searchAddresses.mockResolvedValue([result]);
    userEvent.type(screen.getByPlaceholderText('Street address'), text);
    const option = await screen.findByText(result.label, {}, { timeout: 2000 });
    fireEvent.mouseDown(option);
}

afterEach(() => {
    delete global.fetch;
    jest.clearAllMocks();
});

describe('AddAddress address autocomplete', () => {
    it('fills address line 1, city, state and zip from the picked suggestion', async () => {
        mountAddForm();

        await typeAndPick('456 oak', suggestion());

        expect(await screen.findByDisplayValue('456 Oak Ave')).toBe(screen.getByPlaceholderText('Street address'));
        expect(screen.getByPlaceholderText('City')).toHaveValue('Chicago');
        expect(screen.getByPlaceholderText('IL')).toHaveValue('IL');
        expect(screen.getByPlaceholderText('60601')).toHaveValue('60614');
        expect(screen.queryByText(suggestion().label)).not.toBeInTheDocument();
    });

    it('fills address line 2 only when it is empty', async () => {
        mountAddForm();
        await typeAndPick('456 oak', suggestion({ address2: 'Apt 4' }));
        expect(await screen.findByDisplayValue('Apt 4')).toBe(screen.getByPlaceholderText('Apt / Suite / Unit'));
    });

    it('keeps an address line 2 the user already typed', async () => {
        mountAddForm();
        userEvent.type(screen.getByPlaceholderText('Apt / Suite / Unit'), '#9');
        await screen.findByDisplayValue('#9');

        await typeAndPick('456 oak', suggestion({ address2: 'Apt 4' }));

        await screen.findByDisplayValue('456 Oak Ave');
        expect(screen.getByPlaceholderText('Apt / Suite / Unit')).toHaveValue('#9');
    });
});
