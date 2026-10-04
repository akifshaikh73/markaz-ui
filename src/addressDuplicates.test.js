import { escapeRegex, normalizeAddress, buildSearchPattern, classifyMatches } from './addressDuplicates';

describe('normalizeAddress', () => {
    it('abbreviates street types and directions', () => {
        expect(normalizeAddress({ address1: '123 North Main Street' }))
            .toEqual({ houseNumber: '123', street: 'n main st', core: 'main', unit: '' });
        expect(normalizeAddress({ address1: '123 N. Main St.' }).core).toBe('main');
    });

    it('reads the unit from address2 in any common form', () => {
        ['Apt 4B', 'apt. 4b', '#4B', '# 4-B', 'Suite 4B', 'Unit 4B', 'Ste 4B', '4B'].forEach(a2 => {
            expect(normalizeAddress({ address1: '10 Elm Ave', address2: a2 }).unit).toBe('4b');
        });
    });

    it('ignores address2 text that is not an apartment/suite number', () => {
        ['c/o Ahmed', 'Rear house', 'Basement'].forEach(a2 => {
            expect(normalizeAddress({ address1: '10 Elm Ave', address2: a2 }).unit).toBe('');
        });
    });

    it('splits a trailing unit off address1', () => {
        expect(normalizeAddress({ address1: '55 Oak Dr Apt 12' }))
            .toEqual({ houseNumber: '55', street: 'oak dr', core: 'oak', unit: '12' });
        expect(normalizeAddress({ address1: '55 Oak Dr #12' }).unit).toBe('12');
    });

    it('does not mistake street names for unit designators', () => {
        expect(normalizeAddress({ address1: '9 Unity Ave' })).toMatchObject({ street: 'unity ave', unit: '' });
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

    it('matches regardless of city, state and zip (often missing)', () => {
        const candidates = [
            listing({ _id: 'a', city: 'Lombard', state: 'IL', zipcode: 60148 }),
            listing({ _id: 'b' }),
        ];
        const { likely } = classifyMatches({ address1: '123 main st' }, candidates, { masjidId: '7' });
        expect(likely.map(l => l._id)).toEqual(['a', 'b']);
    });

    it('includes inactive listings and listings without names', () => {
        const { likely } = classifyMatches(
            { address1: '123 Main St' },
            [listing({ _id: 'x', inactive: true, firstName: undefined, lastName: undefined })],
            { masjidId: 7 }
        );
        expect(likely.map(l => l._id)).toEqual(['x']);
    });

    describe('apartments in the same building', () => {
        const building = [
            listing({ _id: 'none' }),
            listing({ _id: 'apt1', address2: 'Apt 1' }),
            listing({ _id: 'apt1a', address2: 'Apt 1A' }),
            listing({ _id: 'apt12', address2: 'Unit 12' }),
            listing({ _id: 'apt12b', address2: '#12-B' }),
            listing({ _id: 'apt3', address2: 'Apt 3' }),
        ];
        const ids = (list) => list.map(l => l._id);
        const check = (address2) => classifyMatches({ address1: '123 Main St', address2 }, building, { masjidId: 7 });

        it('lists every apartment while no apartment is entered', () => {
            const result = check('');
            expect(ids(result.likely)).toEqual(['none']);
            expect(ids(result.sameBuilding)).toEqual(['apt1', 'apt1a', 'apt12', 'apt12b', 'apt3']);
        });

        it('narrows to apartments starting with what was typed, keeping listings with no unit', () => {
            const typed1 = check('Apt 1');
            expect(ids(typed1.likely)).toEqual(['apt1']);
            expect(ids(typed1.sameBuilding)).toEqual(['none', 'apt1a', 'apt12', 'apt12b']);

            const typed12 = check('#12');
            expect(ids(typed12.likely)).toEqual(['apt12']);
            expect(ids(typed12.sameBuilding)).toEqual(['none', 'apt12b']);
        });

        it('hides other apartments once a non-matching apartment is entered', () => {
            const result = check('Suite 5');
            expect(result.likely).toEqual([]);
            expect(ids(result.sameBuilding)).toEqual(['none']);
        });
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
        expect(likely.map(l => l._id)).toEqual(['keep']);
        expect(sameBuilding).toEqual([]);
    });
});
