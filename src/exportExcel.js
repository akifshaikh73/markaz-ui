import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatDate } from './utils';
import { MASJID_CONFIG } from './config';

const EXPORT_COLUMNS = [
    { header: 'ID', key: 'ID', width: 26 },
    { header: 'Name', key: 'Name', width: 24 },
    { header: 'Address', key: 'Address', width: 40 },
    { header: 'Met', key: 'Met', width: 10 },
    { header: 'Last Response', key: 'Last Response', width: 16 },
    { header: 'Last Visit', key: 'Last Visit', width: 14 },
    { header: 'Comments', key: 'Comments', width: 56 },
];

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
        .map(v => v.comments)
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

function getMasjidName(masjidID) {
    const idNum = Number(masjidID);
    const masjid = MASJID_CONFIG.find(m => m.id === idNum);
    return masjid?.name || String(masjidID || 'Masjid');
}

function excelHeaderText(text) {
    // In Excel headers/footers, '&' starts control codes; escape it to render literal text.
    return String(text || '').replace(/&/g, '&&');
}

function buildSheet(workbook, sheetName, rows, pageHeaderText) {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = EXPORT_COLUMNS;

    rows.forEach(row => {
        sheet.addRow(row);
    });

    sheet.pageSetup = {
        orientation: 'landscape',
        showGridLines: true,
        printTitlesRow: '1:1',
    };

    sheet.headerFooter = {
        differentFirst: false,
        differentOddEven: false,
        oddHeader: `&C${excelHeaderText(pageHeaderText)}`,
    };

    return sheet;
}

function toRow(address) {
    const comments = [
        address.profession ? `Profession: ${address.profession}` : null,
        formatComments(address.visitHistory) || null,
    ].filter(Boolean).join('\n');

    return {
        'ID':            address._id,
        'Name':          `${address.firstName || ''} ${address.lastName || ''}`.trim(),
        'Address':       address.address1 || '',
        'Met':           address.met ? 'Yes' : 'No',
        'Last Response': lastResponse(address.visitHistory),
        'Last Visit':    lastVisitDate(address.visitHistory),
        'Comments':      comments,
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
export async function exportToExcel(addressList, masjidID, unitID) {
    const workbook = new ExcelJS.Workbook();
    const masjidName = getMasjidName(masjidID);

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
            // Limit sheet name to 31 chars (Excel limit)
            const sheetName = area.substring(0, 31);
            buildSheet(workbook, sheetName, rows, `${masjidName}-${area}`);
        });

    // Add unassigned as the last sheet
    if (unassigned.length > 0) {
        const rows = unassigned.sort(sortByDate).map(toRow);
        const sheetName = 'Unassigned';
        buildSheet(workbook, sheetName, rows, `${masjidName}-Unassigned`);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([
        buffer,
    ], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, `${masjidID}_${unitID}.xlsx`);
}
