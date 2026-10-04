import { wildcardToRegex } from './utils';

describe('wildcardToRegex', () => {
    const matches = (typed, value) => new RegExp(wildcardToRegex(typed), 'i').test(value);

    it('treats * as "anything here"', () => {
        expect(wildcardToRegex('1301*Finley')).toBe('1301.*Finley');
        expect(matches('1301*Finley', '1301 S Finley Rd')).toBe(true);
        expect(matches('1301*Finley', '1301 South Finley Road')).toBe(true);
        expect(matches('1301*Finley', '1301 S FINLEY RD APT 217')).toBe(true);
        expect(matches('1301*Finley', '1300 S Finley Rd')).toBe(false);
    });

    it('collapses repeated * and allows leading/trailing *', () => {
        expect(wildcardToRegex('1301**Finley')).toBe('1301.*Finley');
        expect(wildcardToRegex('*Finley*')).toBe('.*Finley.*');
    });

    it('leaves plain text as a case-insensitive contains search', () => {
        expect(wildcardToRegex('  Main St ')).toBe('Main St');
        expect(matches('main st', '123 MAIN ST')).toBe(true);
    });

    it('matches other regex characters literally instead of breaking the search', () => {
        expect(wildcardToRegex('12 (Rear)')).toBe('12 \\(Rear\\)');
        ['12 (Rear', '[x', 'a+b', 'St.', 'Apt?', 'a|b', '\\'].forEach(typed => {
            expect(() => new RegExp(wildcardToRegex(typed))).not.toThrow();
        });
        expect(matches('St.', 'Main St.')).toBe(true);
        expect(matches('St.', 'Main Sta')).toBe(false);
    });

    it('returns an empty pattern for empty input', () => {
        expect(wildcardToRegex('')).toBe('');
        expect(wildcardToRegex('   ')).toBe('');
        expect(wildcardToRegex(undefined)).toBe('');
    });
});
