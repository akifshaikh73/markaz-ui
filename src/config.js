



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
    }, {
        "name": "Al Hira",
        "landing": "alhira",
        "id": 105,
        "units": [1]
    }, {
        "name": "ICW",
        "landing": "icw",
        "id": 230,
        "units": [1, 2]
    }, {
        "name": "Al Hidayah",
        "landing": "oleson",
        "id": 102,
        "units": [1, 2, 3]
    }
];

export const MASJID_UNITS = Object.fromEntries(
    MASJID_CONFIG.map(m => [m.id, m.units])
);

// Default unit options fallback
export const UNIT_OPTIONS = [1];

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
