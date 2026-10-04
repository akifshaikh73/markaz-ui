import { escapeRegex, normalizeAddress, apartmentSearchTerm, buildSearchPattern, classifyMatches } from './addressDuplicates';

describe('normalizeAddress', () => {
    it('abbreviates street types and directions', () => {
        expect(normalizeAddress({ address1: '123 North Main Street' }))
            .toEqual({ houseNumber: '123', street: 'n main st', core: 'main', unitText: '' });
        expect(normalizeAddress({ address1: '123 N. Main St.' }).core).toBe('main');
    });

    it('keeps address2 as plain searchable text', () => {
        expect(normalizeAddress({ address1: '10 Elm Ave', address2: 'Apt Door Code # 55' }).unitText).toBe('apt door code 55');
        expect(normalizeAddress({ address1: '10 Elm Ave', address2: '#12-B' }).unitText).toBe('12 b');
    });

    it('splits apartment / code text off the end of address1 so the street still matches', () => {
        expect(normalizeAddress({ address1: '1301 S Finley Rd (Code #10)' }))
            .toEqual({ houseNumber: '1301', street: 's finley rd', core: 'finley', unitText: 'code 10' });
        expect(normalizeAddress({ address1: '1301 S Finley ( Code # 76 )' })).toMatchObject({ core: 'finley', unitText: 'code 76' });
        expect(normalizeAddress({ address1: '1301 S FINLEY RD APT 217' })).toMatchObject({ core: 'finley', unitText: 'apt 217' });
        expect(normalizeAddress({ address1: '1301 S Finley Rd # 416' })).toMatchObject({ core: 'finley', unitText: '416' });
        expect(normalizeAddress({ address1: '1301 South Finley Road' })).toMatchObject({ core: 'finley', unitText: '' });
    });

    it('splits letter-only units and floors off address1', () => {
        expect(normalizeAddress({ address1: '2400 W North Ave APT B' })).toMatchObject({ street: 'w n ave', unitText: 'apt b' });
        expect(normalizeAddress({ address1: '1500 W ANN ST # A' })).toMatchObject({ street: 'w ann st', unitText: 'a' });
        expect(normalizeAddress({ address1: '10 S Main St STE D' })).toMatchObject({ street: 's main st', unitText: 'ste d' });
        expect(normalizeAddress({ address1: '5 W Ann St UNIT B' })).toMatchObject({ street: 'w ann st', unitText: 'unit b' });
        expect(normalizeAddress({ address1: '2200 N OAKLEY AVE 3rd Floor' })).toMatchObject({ street: 'n oakley ave', unitText: '3rd floor' });
        expect(normalizeAddress({ address1: '7 Elm St Bldg 2' })).toMatchObject({ street: 'elm st', unitText: 'bldg 2' });
    });

    it('does not mistake street names for apartment labels', () => {
        expect(normalizeAddress({ address1: '9 Unity Ave' })).toMatchObject({ street: 'unity ave', unitText: '' });
        expect(normalizeAddress({ address1: '123 Main Ave E' })).toMatchObject({ street: 'main ave e', unitText: '' });
        expect(normalizeAddress({ address1: '40 Floral Ave' })).toMatchObject({ street: 'floral ave', unitText: '' });
    });
});

describe('apartmentSearchTerm', () => {
    it('drops leading labels and punctuation from what was typed', () => {
        expect(apartmentSearchTerm('36')).toBe('36');
        expect(apartmentSearchTerm('#36')).toBe('36');
        expect(apartmentSearchTerm('Apt 36')).toBe('36');
        expect(apartmentSearchTerm('Unit # 4B')).toBe('4b');
        expect(apartmentSearchTerm('Apt ')).toBe('');
        expect(apartmentSearchTerm('')).toBe('');
    });
});

describe('buildSearchPattern', () => {
    it('anchors on the house number', () => {
        expect(buildSearchPattern('123 Main St')).toBe('^\\s*123\\b');
        expect(new RegExp(buildSearchPattern('123 Main St'), 'i').test('123 Main Street')).toBe(true);
        expect(new RegExp(buildSearchPattern('123 Main St'), 'i').test('1123 Main Street')).toBe(false);
    });

    it('waits until there is a street name', () => {
        expect(buildSearchPattern('')).toBeNull();
        expect(buildSearchPattern('123')).toBeNull();
        expect(buildSearchPattern('123 M')).toBeNull();
    });

    it('falls back to the first two street words, escaped', () => {
        expect(buildSearchPattern('Rural Route 5')).toBe('\\brural\\W+route\\b');
        expect(buildSearchPattern('Main')).toBeNull();
    });

    it('never passes raw regex characters through', () => {
        const pattern = buildSearchPattern('12 (Rear) Main St [x]');
        expect(() => new RegExp(pattern)).not.toThrow();
        expect(pattern).toBe('^\\s*12\\b');
    });
});

describe('escapeRegex', () => {
    it('escapes regex metacharacters', () => {
        expect(escapeRegex('a.b*(c)')).toBe('a\\.b\\*\\(c\\)');
    });
});

describe('classifyMatches', () => {
    const listing = (over) => ({ _id: '1', masjidId: 7, unitId: 1, address1: '123 Main Street', ...over });
    const ids = (list) => list.map(l => l._id);

    it('matches regardless of city, state and zip (often missing)', () => {
        const candidates = [
            listing({ _id: 'a', city: 'Lombard', state: 'IL', zipcode: 60148 }),
            listing({ _id: 'b' }),
        ];
        const { likely } = classifyMatches({ address1: '123 main st' }, candidates, { masjidId: '7' });
        expect(ids(likely)).toEqual(['a', 'b']);
    });

    it('includes inactive listings and listings without names', () => {
        const { likely } = classifyMatches(
            { address1: '123 Main St' },
            [listing({ _id: 'x', inactive: true, firstName: undefined, lastName: undefined })],
            { masjidId: 7 }
        );
        expect(ids(likely)).toEqual(['x']);
    });

    it('drops other masjids, the excluded listing and different streets', () => {
        const candidates = [
            listing({ _id: 'self' }),
            listing({ _id: 'otherMasjid', masjidId: 8 }),
            listing({ _id: 'otherStreet', address1: '123 Maple St' }),
            listing({ _id: 'keep' }),
        ];
        const { likely, sameBuilding } = classifyMatches(
            { address1: '123 Main St' }, candidates, { masjidId: 7, excludeId: 'self' }
        );
        expect(ids(likely)).toEqual(['keep']);
        expect(sameBuilding).toEqual([]);
    });

    describe('address2 contains search', () => {
        const building = [
            listing({ _id: 'none' }),
            listing({ _id: 'blankApt', address2: 'Apt ' }),
            listing({ _id: 'apt36', address2: 'Apt 36' }),
            listing({ _id: 'unit36', address2: 'UNit 36' }),
            listing({ _id: 'code36', address2: 'Apt code #36' }),
            listing({ _id: 'door36', address2: 'Apt Door Code # 36' }),
            listing({ _id: 'n360', address2: '360' }),
            listing({ _id: 'apt136', address2: 'Apt 136' }),
            listing({ _id: 'apt36b', address2: 'Apt 36B' }),
            listing({ _id: 'apt63', address2: 'Apt 63' }),
            listing({ _id: 'line1', address1: '123 Main St Apt 36' }),
        ];
        const check = (address2) => classifyMatches({ address1: '123 Main St', address2 }, building, { masjidId: 7 });

        it('with nothing typed, lists listings without an apartment as existing and the rest as other units', () => {
            const result = check('');
            expect(ids(result.likely)).toEqual(['none', 'blankApt']);
            expect(ids(result.sameBuilding)).toEqual(['apt36', 'unit36', 'code36', 'door36', 'n360', 'apt136', 'apt36b', 'apt63', 'line1']);
        });

        it('"36" finds every address2 containing 36, whether apartment or door code', () => {
            const result = check('36');
            expect(ids(result.likely)).toEqual(['apt36', 'unit36', 'code36', 'door36', 'line1']);
            expect(ids(result.sameBuilding)).toEqual(['n360', 'apt136', 'apt36b']);
        });

        it('typed labels are ignored: "Apt 36" and "#36" search for 36', () => {
            expect(check('Apt 36')).toEqual(check('36'));
            expect(check('#36')).toEqual(check('36'));
        });

        it('hides listings that do not contain the typed text', () => {
            const result = check('5');
            expect(result.likely).toEqual([]);
            expect(result.sameBuilding).toEqual([]);
            expect(ids(check('63').likely)).toEqual(['apt63']);
        });
    });

    it('a large complex: "55" finds only listings whose address2 contains 55', () => {
        const complex = [
            listing({ _id: 'c55', address1: '1301 South Finley Road', address2: 'Apt Door Code # 55' }),
            listing({ _id: 'c55old', address1: '1301 South Finley Road', address2: 'Apt Door Code # 55', inactive: true }),
            listing({ _id: 'c36', address1: '1301 South Finley Road', address2: 'Apt code #36' }),
            listing({ _id: 'c65', address1: '1301 South Finley Road', address2: 'Apt code #65' }),
            listing({ _id: 'nounit', address1: '1301 South Finley Road' }),
            listing({ _id: 'a1code10', address1: '1301 S Finley Rd (Code #10)' }),
            listing({ _id: 'a1apt550', address1: '1301 S Finley Rd APT 550' }),
        ];
        const result = classifyMatches({ address1: '1301 S Finley', address2: '55' }, complex, { masjidId: 7 });
        expect(ids(result.likely)).toEqual(['c55', 'c55old']);
        expect(ids(result.sameBuilding)).toEqual(['a1apt550']);

        // the apartment typed into address1 instead of address2 is used the same way
        const inLine1 = classifyMatches({ address1: '1301 S Finley Rd Apt 55', address2: '' }, complex, { masjidId: 7 });
        expect(inLine1).toEqual(result);
    });

    it('letter-only units in address1: "B" finds APT B, not APT D', () => {
        const northAve = [
            listing({ _id: 'aptB', address1: '2400 W North Ave APT B' }),
            listing({ _id: 'aptD', address1: '2400 W North Ave APT D' }),
            listing({ _id: 'plain', address1: '2400 W North Ave' }),
        ];
        const result = classifyMatches({ address1: '2400 W North Ave', address2: 'B' }, northAve, { masjidId: 7 });
        expect(ids(result.likely)).toEqual(['aptB']);
        expect(result.sameBuilding).toEqual([]);

        const nothingTyped = classifyMatches({ address1: '2400 W North Ave', address2: '' }, northAve, { masjidId: 7 });
        expect(ids(nothingTyped.likely)).toEqual(['plain']);
        expect(ids(nothingTyped.sameBuilding)).toEqual(['aptB', 'aptD']);
    });
});
