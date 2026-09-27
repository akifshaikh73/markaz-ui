// Student goesTo values are stored as lowercase slugs (legacy format); these are the display labels.
// Must stay in sync with GOES_TO_VALUES in visitation_api.js.
export const GOES_TO_OPTIONS = [
    { value: 'madrasa', label: 'Madrasa' },
    { value: 'high-school', label: 'High-School' },
    { value: 'college', label: 'College-University' },
    { value: 'work', label: 'Work' },
];

export const MIN_YOB = 1900;

// A listing is a student listing if the listing itself is a student or it has students
// (same rule as the API's filterByStudents).
export function hasStudentData(address) {
    return Boolean(address && (address.isStudent || (Array.isArray(address.students) && address.students.length > 0)));
}

export function goesToLabel(value) {
    if (!value) return '';
    const option = GOES_TO_OPTIONS.find(o => o.value === value);
    return option ? option.label : value;
}

// Mirrors validateStudents() in the API; returns an error message or '' if valid.
export function validateStudent({ name, goesTo, yob }) {
    const trimmed = (name || '').trim();
    if (!trimmed) return 'Name is required';
    if (trimmed.length > 100) return 'Name must be at most 100 characters';
    if (goesTo && !GOES_TO_OPTIONS.some(o => o.value === goesTo)) return 'Invalid "Goes to" value';
    if (yob !== '' && yob !== undefined && yob !== null) {
        const currentYear = new Date().getFullYear();
        const year = Number(yob);
        if (!/^\d{4}$/.test(String(yob)) || year < MIN_YOB || year > currentYear) {
            return `Year of birth must be between ${MIN_YOB} and ${currentYear}`;
        }
    }
    return '';
}
