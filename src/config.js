// Global configuration for Masjid units
export const MASJID_UTHMAN_ID = 156;
export const CPSA_ID = 109;

export const UNIT_OPTIONS = [1, 2, 3];

export const MASJID_UNITS = {
    [MASJID_UTHMAN_ID]: UNIT_OPTIONS,
    [CPSA_ID]: [1], // Masjid 109
};

// Admin mode flag
export let ADMIN = localStorage.getItem('ADMIN') === 'true';

export const setAdmin = (value) => {
    ADMIN = value;
    localStorage.setItem('ADMIN', value);
};

export const getAdmin = () => {
    return ADMIN;
};
