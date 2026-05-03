import * as XLSX from 'xlsx';
import { formatDate } from './utils';

/**
 * Converts a visit history array into a single string of non-empty comments,
 * sorted newest first, formatted as "date: comment" lines.
 */
function formatComments(visitHistory = []) {
    return [...visitHistory]
        .filter(v => v.comments && v.comments.trim())
        .sort((a, b) => {
            const dA = new Date((a.createdDate?.$date) ?? a.createdDate);
            const dB = new Date((b.createdDate?.$date) ?? b.createdDate);
            return dB - dA;
        })
        .map(v => `${formatDate(v.createdDate)}: ${v.comments}`)
        .join('\n');
}

function lastResponse(visitHistory = []) {
    if (!visitHistory.length) return '';
    const last = visitHistory[visitHistory.length - 1];
    return last.response || '';
}

function lastVisitDate(visitHistory = []) {
    if (!visitHistory.length) return '';
    const last = visitHistory[visitHistory.length - 1];
    return formatDate(last.createdDate);
}

function toRow(address) {
    const comments = [
        address.profession ? `Profession: ${address.profession}` : null,
        formatComments(address.visitHistory) || null,
    ].filter(Boolean).join('\n');

    return {
        'ID':            address._id,
        'Name':          `${address.firstName || ''} ${address.lastName || ''}`.trim(),
        'Address':       [address.address1, address.city, address.state].filter(Boolean).join(', '),
        'Best Time':     address.bestTime || '',
        'Met':           address.met ? 'Yes' : 'No',
        'Last Response': lastResponse(address.visitHistory),
        'Last Visit':    lastVisitDate(address.visitHistory),
        'Comments':      comments,
        'Last Modified': formatDate(address.lastModifiedDate),
    };
}

/**
 * Exports the address list to an Excel file.
 * Each area becomes a separate sheet; unassigned addresses go on the last sheet.
 *
 * @param {Array}  addressList
 * @param {string} masjidID
 * @param {string} unitID
 */
export function exportToExcel(addressList, masjidID, unitID) {
    const workbook = XLSX.utils.book_new();

    // Group by area; collect unassigned separately
    const groups = {};
    const unassigned = [];

    addressList.forEach(address => {
        if (address.area && address.area.trim()) {
            const key = address.area.trim();
            if (!groups[key]) groups[key] = [];
            groups[key].push(address);
        } else {
            unassigned.push(address);
        }
    });

    // Sort each group by lastModifiedDate descending
    const sortByDate = (a, b) => {
        const dA = new Date((a.lastModifiedDate?.$date) ?? a.lastModifiedDate);
        const dB = new Date((b.lastModifiedDate?.$date) ?? b.lastModifiedDate);
        return dB - dA;
    };

    // Add named area sheets (alphabetical)
    Object.keys(groups)
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .forEach(area => {
            const rows = groups[area].sort(sortByDate).map(toRow);
            const sheet = XLSX.utils.json_to_sheet(rows);
            // Limit sheet name to 31 chars (Excel limit)
            const sheetName = area.substring(0, 31);
            XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
        });

    // Add unassigned as the last sheet
    if (unassigned.length > 0) {
        const rows = unassigned.sort(sortByDate).map(toRow);
        const sheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, sheet, 'Unassigned');
    }

    XLSX.writeFile(workbook, `${masjidID}_${unitID}.xlsx`);
}
