// Global configuration for Masjid units
export const MASJID_UTHMAN_ID = 156;
export const CPSA_ID = 109;

export const UNIT_OPTIONS = [1, 2, 3];

export const MASJID_UNITS = {
    [MASJID_UTHMAN_ID]: UNIT_OPTIONS,
    [CPSA_ID]: [1], // Masjid 109
};

// Multi-Masjid Configuration
export const MASJID_CONFIG = [
    {
        "name": "Masjid Uthhman",
        "landing": "muthman",
        "id": 156,
        "units": [1, 2, 3]
    },
    {
        "name": "CPSA",
        "landing": "cpsa",
        "id": 109,
        "units": [1]
    },
    {
        "name": "Aurora Masjid",
        "landing": "aurora",
        "id": 203,
        "units": [1, 2]
    }, {
        "name": "Masjid Darussalam",
        "landing": "masjid-ds",
        "id": 112,
        "units": [1,2,3,4]
    }
];

// Helper function to get masjid config by landing slug
export const getMasjidByLanding = (landing) => {
    return MASJID_CONFIG.find(m => m.landing === landing);
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
