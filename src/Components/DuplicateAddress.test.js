import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';
import AddAddress from './AddAddress';
import AddressDetail from './AddressDetail';

const listing = (over) => ({
    _id: '501', masjidId: 7, unitId: 1, firstName: 'Old', lastName: 'Name',
    address1: '123 Main Street', inactive: false, ...over,
});

// Answers the duplicate search with `searchResults`; every other call succeeds.
function mockApi(searchResults) {
    global.fetch = jest.fn((url, opts = {}) => {
        const method = opts.method || 'GET';
        let body = { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
        if (url.includes('/api/addressList/search/address/')) body = searchResults;
        else if (method === 'POST') body = { acknowledged: true, _id: '900' };
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
    });
    return global.fetch;
}

const calls = (fetchMock, method, fragment) => fetchMock.mock.calls.filter(([url, opts = {}]) =>
    (opts.method || 'GET') === method && url.includes(fragment));

const bodyOf = (call) => JSON.parse(call[1].body);

// user-event 13 resolves a different @testing-library/dom copy than RTL, so its events aren't
// wrapped in act() and React 18 renders their state updates asynchronously — always use
// findBy/waitFor for what a click or keystroke changes.

function ListingPage() {
    const { id } = useParams();
    return <div>Listing page {id}</div>;
}

function mountAddForm(onCreated = jest.fn(), props = {}) {
    render(
        <MemoryRouter initialEntries={['/landing/7/2']}>
            <Routes>
                <Route path="/landing/:masjidID/:unitID" element={
                    <AddAddress masjidID="7" unitOptions={[1, 2]} defaultUnitId={2} onCreated={onCreated} {...props} />
                } />
                <Route path="/address/:id" element={<ListingPage />} />
            </Routes>
        </MemoryRouter>
    );
    return onCreated;
}

const findWarning = async (title = /This address already exists/) => {
    await screen.findByText(title, {}, { timeout: 2000 });
    return screen.getAllByRole('alert').find(el => within(el).queryByText(title));
};

afterEach(() => {
    delete global.fetch;
    jest.restoreAllMocks();
});

describe('AddAddress duplicate check', () => {
    it('searches once after typing stops and lists only same-masjid matches', async () => {
        const fetchMock = mockApi([listing(), listing({ _id: '777', masjidId: 8 })]);
        mountAddForm();

        userEvent.type(screen.getByPlaceholderText('Street address'), '123 main st');
        const warning = await findWarning();

        const searches = calls(fetchMock, 'GET', '/search/address/');
        expect(searches).toHaveLength(1);
        expect(searches[0][0]).toContain(encodeURIComponent('^\\s*123\\b'));
        expect(within(warning).getByText(/#501/)).toBeInTheDocument();
        expect(within(warning).queryByText(/#777/)).not.toBeInTheDocument();
    });

    it('shows nothing when no listing is at that address', async () => {
        const fetchMock = mockApi([listing({ address1: '123 Maple Ave' })]);
        mountAddForm();

        userEvent.type(screen.getByPlaceholderText('Street address'), '123 Main St');
        await waitFor(() => expect(calls(fetchMock, 'GET', '/search/address/')).toHaveLength(1), { timeout: 2000 });
        await waitFor(() => expect(screen.queryByText(/Checking for existing listings/)).not.toBeInTheDocument());
        expect(screen.queryByText(/already exists/)).not.toBeInTheDocument();
    });

    it('offers only "Open listing" for an active match and opens it', async () => {
        const fetchMock = mockApi([listing()]);
        mountAddForm();

        userEvent.type(screen.getByPlaceholderText('Street address'), '123 Main St');
        const warning = await findWarning();

        expect(within(warning).getAllByRole('button').map(b => b.textContent)).toEqual(['Open listing']);
        userEvent.click(within(warning).getByRole('button', { name: 'Open listing' }));

        expect(await screen.findByText('Listing page 501')).toBeInTheDocument();
        expect(calls(fetchMock, 'PUT', '/api/addressList/')).toHaveLength(0);
    });

    it('offers only "Activate & open" for an inactive match, activating before opening', async () => {
        const fetchMock = mockApi([listing({ _id: '600', inactive: true })]);
        mountAddForm();

        userEvent.type(screen.getByPlaceholderText('Street address'), '123 Main St');
        const warning = await findWarning();

        expect(within(warning).getAllByRole('button').map(b => b.textContent)).toEqual(['Activate & open']);
        userEvent.click(within(warning).getByRole('button', { name: 'Activate & open' }));

        expect(await screen.findByText('Listing page 600')).toBeInTheDocument();
        const puts = calls(fetchMock, 'PUT', '/api/addressList/600');
        expect(puts).toHaveLength(1);
        expect(bodyOf(puts[0])).toEqual({ inactive: false });
    });

    it('asks before leaving a form that has details entered', async () => {
        mockApi([listing()]);
        const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
        mountAddForm();

        userEvent.type(screen.getByPlaceholderText('First name'), 'Yusuf');
        userEvent.type(screen.getByPlaceholderText('Street address'), '123 Main St');
        const warning = await findWarning();
        userEvent.click(within(warning).getByRole('button', { name: 'Open listing' }));

        expect(confirm).toHaveBeenCalled();
        expect(screen.queryByText(/Listing page/)).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText('First name')).toHaveValue('Yusuf');
    });

    // Saving the form onto the existing listing is hidden for now (allowUpdateExisting defaults to false).
    it('allowUpdateExisting: updates the existing listing instead of creating a new one', async () => {
        const fetchMock = mockApi([listing()]);
        const onCreated = mountAddForm(jest.fn(), { allowUpdateExisting: true });

        userEvent.type(screen.getByPlaceholderText('First name'), 'Yusuf');
        userEvent.type(screen.getByPlaceholderText('Street address'), '123 Main St');
        userEvent.type(screen.getByPlaceholderText('Phone number'), '555-1234');
        const warning = await findWarning();

        userEvent.click(within(warning).getByRole('button', { name: 'Update this listing' }));
        expect(await within(warning).findByText('First name: Old → Yusuf')).toBeInTheDocument();
        expect(within(warning).getByText('Unit: 1 → 2')).toBeInTheDocument();
        userEvent.click(within(warning).getByRole('button', { name: 'Confirm' }));

        expect(await screen.findByText('Listing Updated')).toBeInTheDocument();
        const puts = calls(fetchMock, 'PUT', '/api/addressList/501');
        expect(puts).toHaveLength(1);
        // address1 is never overwritten; lastName was left blank so it isn't sent.
        expect(bodyOf(puts[0])).toEqual({ firstName: 'Yusuf', phoneNumber: '555-1234', unitId: 2 });
        expect(calls(fetchMock, 'POST', '/api/addressList')).toHaveLength(0);
        expect(onCreated).toHaveBeenCalledWith('501');
    });

    it('allowUpdateExisting: activates an inactive match and logs the visit on it', async () => {
        const fetchMock = mockApi([listing({ _id: '600', inactive: true, address2: 'Apt 4B' })]);
        mountAddForm(jest.fn(), { allowUpdateExisting: true });

        userEvent.type(screen.getByPlaceholderText('Street address'), '123 Main St');
        userEvent.type(screen.getByPlaceholderText('Apt / Suite / Unit'), '#4b');
        const responseSelect = screen.getAllByRole('combobox')[1];
        userEvent.selectOptions(responseSelect, 'Met');
        const warning = await findWarning();

        expect(within(warning).getByText('INACTIVE')).toBeInTheDocument();
        userEvent.click(within(warning).getByRole('button', { name: 'Activate & save' }));
        expect(await within(warning).findByText('Status: Inactive → Active')).toBeInTheDocument();
        userEvent.click(within(warning).getByRole('button', { name: 'Confirm' }));

        expect(await screen.findByText('Listing Activated')).toBeInTheDocument();
        const update = calls(fetchMock, 'PUT', '/api/addressList/600')[0];
        expect(bodyOf(update)).toMatchObject({ inactive: false, unitId: 2 });
        expect(bodyOf(update)).not.toHaveProperty('address2'); // listing already has one
        const visit = calls(fetchMock, 'PUT', '/api/addressList/visit/600');
        expect(visit).toHaveLength(1);
        expect(bodyOf(visit[0])).toMatchObject({ response: 'Met' });
    });

    it('narrows the apartments as address line 2 is typed, without searching again', async () => {
        const fetchMock = mockApi([
            listing({ _id: '700', address2: 'Apt 3' }),
            listing({ _id: '701', address2: 'Apt 12' }),
            listing({ _id: '702', address2: 'Apt 15' }),
        ]);
        mountAddForm();

        userEvent.type(screen.getByPlaceholderText('Street address'), '123 Main St');
        const warning = await findWarning(/Other units at this address \(3\)/);
        expect(screen.queryByText(/This address already exists/)).not.toBeInTheDocument();

        const apt = screen.getByPlaceholderText('Apt / Suite / Unit');
        userEvent.type(apt, 'Apt 1');
        expect(await screen.findByText(/Other units at this address \(2\)/)).toBeInTheDocument();
        expect(within(warning).queryByText(/#700/)).not.toBeInTheDocument();

        userEvent.type(apt, '2');
        const exact = await findWarning(/This address already exists \(1\)/);
        expect(within(exact).getByText(/#701/)).toBeInTheDocument();
        expect(within(exact).queryByText(/#702/)).not.toBeInTheDocument();

        userEvent.clear(apt);
        userEvent.type(apt, 'Apt 9');
        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());

        expect(calls(fetchMock, 'GET', '/search/address/')).toHaveLength(1);
    });

    it('still lets the user create a new listing despite the warning', async () => {
        const fetchMock = mockApi([listing()]);
        mountAddForm();

        userEvent.type(screen.getByPlaceholderText('First name'), 'New');
        userEvent.type(screen.getByPlaceholderText('Last name'), 'Person');
        userEvent.type(screen.getByPlaceholderText('Street address'), '123 Main St');
        await findWarning();
        userEvent.click(screen.getByRole('button', { name: 'Add Address' }));

        expect(await screen.findByText('Address Created')).toBeInTheDocument();
        expect(calls(fetchMock, 'POST', '/api/addressList')).toHaveLength(1);
    });
});

describe('AddressDetail duplicate check while editing the address', () => {
    function renderDetail() {
        render(
            <MemoryRouter>
                <AddressDetail address={listing({ _id: '1', address1: '9 Oak Dr' })} isModal />
            </MemoryRouter>
        );
    }

    it('flags another listing at the new address, never itself, and can activate & open it', async () => {
        const fetchMock = mockApi([
            listing({ _id: '1', address1: '123 Main St' }),
            listing({ _id: '2', inactive: true }),
        ]);
        jest.spyOn(window, 'confirm').mockReturnValue(true);
        renderDetail();

        userEvent.click(screen.getByRole('button', { name: 'Edit address' }));
        const street = await screen.findByPlaceholderText('Street address');
        userEvent.clear(street);
        userEvent.type(street, '123 Main Street');
        const warning = await findWarning();

        expect(within(warning).getByText(/#2/)).toBeInTheDocument();
        expect(within(warning).queryByText(/#1\b/)).not.toBeInTheDocument();

        userEvent.click(within(warning).getByRole('button', { name: 'Activate & open' }));
        await waitFor(() => expect(calls(fetchMock, 'PUT', '/api/addressList/2')).toHaveLength(1));
        expect(bodyOf(calls(fetchMock, 'PUT', '/api/addressList/2')[0])).toEqual({ inactive: false });
    });

    it('does not search while the address is unchanged', async () => {
        const fetchMock = mockApi([]);
        renderDetail();

        userEvent.click(screen.getByRole('button', { name: 'Edit address' }));
        await new Promise(r => setTimeout(r, 700));
        expect(calls(fetchMock, 'GET', '/search/address/')).toHaveLength(0);
    });
});
