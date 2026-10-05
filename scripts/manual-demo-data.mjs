// Fictitious data for the User Manual screenshots. Every name, street, city and phone number here
// is made up — scripts/capture-manual-screenshots.mjs serves it in place of the real API, so the
// published screenshots contain no real household data.

export const MASJID = {
    _id: 156, id: 156, name: 'Masjid An-Noor', landing: 'muthman', units: [1, 2, 3, 4],
    address: '500 Crescent Way', city: 'Cedarbrook', state: 'IL', zipcode: 60999,
    latitude: 41.8805, longitude: -88.0405, pin: '0000',
};

const CITY = { city: 'Cedarbrook', state: 'IL', zipcode: 60999 };
const BUILDING = { latitude: 41.8722, longitude: -88.0104 }; // the 1301 S Larkspur Rd apartment block
const visit = (date, response, comments = '') => ({ createdDate: `${date}T00:00:00.000Z`, response, comments });

// [id, unit, first, last, address1, address2, area, coords, extra]
const ROWS = [
    ['5001', 1, 'Yusuf', 'Rahman', '214 Amber Crest Ln', '', 'Crescent Park', [41.8851, -88.0302],
        { phoneNumber: '630-555-0142', visits: [visit('2024-03-10', 'Met the brother', 'Comes for Isha, invited to Sunday halaqa')] }],
    ['5002', 1, 'Bilal', 'Siddiqui', '238 Amber Crest Ln', '', 'Crescent Park', [41.8856, -88.0296],
        { students: [{ name: 'Hamza', goesTo: 'madrasa', yob: 2014 }, { name: 'Maryam', goesTo: 'high-school', yob: 2009 }],
          visits: [visit('2023-11-18', 'Met the brother', 'Two children, interested in weekend madrasa')] }],
    ['5003', 1, 'Imran', 'Qureshi', '17 Willowmere Dr', '', 'Olive Grove', [41.8792, -88.0251],
        { visits: [visit('2022-05-02', 'Met', ''), visit('2023-06-14', 'Do Not Disturb', 'Asked us not to visit')] }],
    ['5004', 1, 'Tariq', 'Hussain', '42 Willowmere Dr', '', 'Olive Grove', [41.8789, -88.0244],
        { visits: [visit('2021-09-12', 'No Response', 'Left a flyer')] }],
    ['5005', 1, 'Omar', 'Farooq', '1301 S Larkspur Rd APT 204', '', 'Larkspur Commons', [BUILDING.latitude, BUILDING.longitude],
        { visits: [visit('2022-02-20', 'Met the brother', 'Works evenings')] }],
    ['5006', 2, 'Zaid', 'Ansari', '1301 South Larkspur Road', 'Apt Door Code # 55', 'Larkspur Commons', [BUILDING.latitude, BUILDING.longitude],
        { visits: [visit('2019-12-05', 'Met the brother', 'Has guests this week, come another evening')] }],
    ['5007', 2, 'Hassan', 'Mirza', '1301 South Larkspur Road', 'Apt Door Code # 55', 'Larkspur Commons', [BUILDING.latitude, BUILDING.longitude],
        { inactive: true, visits: [visit('2023-08-10', 'Wrong address', 'Family moved out')] }],
    ['5008', 2, 'Faisal', 'Karim', '1301 S Larkspur Rd # 360', '', 'Larkspur Commons', [BUILDING.latitude, BUILDING.longitude],
        { visits: [visit('2020-04-11', 'Not home, left a message', '')] }],
    ['5009', 2, 'Adnan', 'Malik', '1301 S Larkspur Rd (Code #36)', '', 'Larkspur Commons', [BUILDING.latitude, BUILDING.longitude],
        { visits: [visit('2021-07-03', 'Met the brother', 'Regular at Jumuah')] }],
    ['5010', 1, 'Khalid', 'Usmani', '88 Juniper Hollow Rd', '', 'Cedar Hills', [41.8902, -88.0188],
        { isStudent: true, students: [{ name: 'Ayaan', goesTo: 'college', yob: 2005 }],
          visits: [visit('2024-01-14', 'Met', 'Son studies engineering, wants to help with youth program')] }],
    ['5011', 2, 'Ibrahim', 'Sheikh', '9 Falcon Ridge Ct', '', 'Maple Commons', [41.8711, -88.0362],
        { phoneNumber: '630-555-0177', visits: [visit('2022-10-09', 'Met the brother', 'Receptive')] }],
    ['5012', 2, 'Mustafa', 'Patel', '15 Falcon Ridge Ct', '', 'Maple Commons', [41.8714, -88.0355],
        { visits: [visit('2020-03-21', 'No Response', '')] }],
    ['5013', 2, 'Saad', 'Chaudhry', '301 Saffron Way', '', 'Maple Commons', [41.8698, -88.0330],
        { visits: [visit('2023-02-26', 'Met the brother', 'Available weekends')] }],
    ['5014', 2, 'Waleed', 'Haddad', '327 Saffron Way', '', 'Maple Commons', [41.8694, -88.0322],
        { students: [{ name: 'Sumayyah', goesTo: 'high-school', yob: 2010 }], visits: [visit('2024-04-07', 'Met', '')] }],
    ['5015', 2, 'Junaid', 'Aziz', '1301 South Larkspur Road', 'Apt 77', 'Larkspur Commons', [BUILDING.latitude, BUILDING.longitude],
        { visits: [visit('2021-11-11', 'Met the brother', '')] }],
    ['5016', 2, 'Hamid', 'Rashid', '512 Quillstone Ave', '', '', [41.8662, -88.0410],
        { visits: [] }],
    ['5017', 3, 'Abdullah', 'Noor', '70 Birchmoor Pl', '', 'Birchmoor', [41.8935, -88.0451],
        { visits: [visit('2022-08-15', 'Met the brother', 'Invited for dinner after Maghrib')] }],
    ['5018', 3, 'Sami', 'Yousef', '74 Birchmoor Pl', '', 'Birchmoor', [41.8938, -88.0445],
        { visits: [visit('2020-12-12', 'Not home, left a message', '')] }],
    ['5019', 3, 'Rayyan', 'Kareem', '600 Tamarind Blvd', '', 'Tamarind Heights', [41.8970, -88.0390],
        { visits: [visit('2023-09-30', 'Met', 'New to the area')] }],
    ['5020', 3, 'Nabil', 'Saleh', '612 Tamarind Blvd', '', 'Tamarind Heights', [41.8973, -88.0384],
        { visits: [visit('2024-02-18', 'Met the brother', 'DND please - night shifts')] }],
    ['5021', 4, 'Idris', 'Bakr', '23 Lantern Glen Rd', '', 'Lantern Glen', [41.8630, -88.0205],
        { visits: [visit('2019-10-27', 'Met the brother', '')] }],
    ['5022', 4, 'Usman', 'Ghani', '31 Lantern Glen Rd', '', 'Lantern Glen', [41.8627, -88.0198],
        { visits: [visit('2021-05-16', 'No Response', '')] }],
    ['5023', 4, 'Arif', 'Jamal', '45 Lantern Glen Rd', '', 'Lantern Glen', [41.8624, -88.0190],
        { inactive: true, visits: [visit('2022-06-05', 'Moved', 'Moved to another state')] }],
    ['5024', 4, 'Kamal', 'Hadi', '908 Starling Path', '', 'Lantern Glen', [41.8601, -88.0152],
        { visits: [visit('2023-12-03', 'Met', 'Wants Quran class for kids')] }],
];

export const LISTINGS = ROWS.map(([id, unitId, firstName, lastName, address1, address2, area, [latitude, longitude], extra]) => {
    const { visits = [], ...rest } = extra;
    const last = visits[visits.length - 1];
    return {
        _id: id, masjidId: MASJID._id, unitId, firstName, lastName, address1, address2, area, ...CITY,
        latitude, longitude, inactive: false, version: 1, visitHistory: visits,
        latestResponse: last ? last.response : '', lastModifiedDate: last ? last.createdDate : undefined,
        met: Boolean(last && /\bmet\b/i.test(last.response)), ...rest,
    };
});
