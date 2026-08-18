



// Admin password
export const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;

// Helper — comment to get masjid config is now in useMasjids.js

// Returns the current Hijri (Islamic) year using the browser's Intl API
export const getHijriYear = () => {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic', { year: 'numeric' });
    const parts = formatter.formatToParts(new Date());
    return parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
};

export const setUserRole = (role) => {
    localStorage.setItem('userRole', role);
};

export const getUserRole = () => localStorage.getItem('userRole') || '';

// Clears role on logout; kept for call sites that only need a boolean clear
export const setAdmin = (value) => {
    if (!value) setUserRole('');
};

export const getAdmin = () => {
    const role = getUserRole();
    return role === 'MarkazAdmin' || role === 'MasjidAdmin';
};
