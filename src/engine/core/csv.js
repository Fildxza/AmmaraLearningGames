// CSV export: UTF-8 with BOM (Excel friendly), CRLF line ends, every field quoted,
// and spreadsheet formula injection neutralised.

const DANGEROUS_START = /^[\s\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028\u2029\ufeff]*[=+\-@＋－＝＠]/;
const CONTROL_START = /^[\t\r\n]/;

// A cell that a spreadsheet could read as a formula gets a leading apostrophe.
export function protectCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  let s = String(value);
  if (DANGEROUS_START.test(s) || CONTROL_START.test(s)) s = "'" + s;
  return s;
}

export function quoteCell(value) {
  return '"' + protectCell(value).replace(/"/g, '""') + '"';
}

/**
 * @param {string[]} headers
 * @param {Array<Array<any>>} rows
 * @returns {string} CSV text starting with a UTF-8 byte order mark
 */
export function toCSV(headers, rows) {
  const lines = [headers.map(quoteCell).join(',')];
  for (const r of rows) lines.push(r.map(quoteCell).join(','));
  return '\ufeff' + lines.join('\r\n') + '\r\n';
}
