/**
 * Opus AI — Website contact form handler (Google Apps Script + Google Sheets)
 * -----------------------------------------------------------------------------
 * Receives POSTs from the Opus AI website contact form, appends each submission
 * to a "Submissions" sheet, and emails a notification to CONTACT_EMAIL.
 *
 * SETUP (5 minutes):
 *   1. Create a new Google Sheet (or use an existing one).
 *   2. Extensions → Apps Script. Paste this whole file in (replace Code.gs).
 *   3. (Optional) Edit CONTACT_EMAIL / SHEET_NAME below.
 *   4. Deploy → New deployment → type "Web app":
 *        - Execute as:        Me (your account)
 *        - Who has access:    Anyone
 *      Authorize the scopes when prompted (sheets + email).
 *   5. Copy the Web app URL ending in /exec.
 *   6. In index.html, set:  const GAS_ENDPOINT = "https://script.google.com/macros/s/.../exec";
 *
 * The sheet is auto-created with headers on first submission. Test by visiting
 * the /exec URL in a browser — it should return {"result":"ok","service":"opus-ai-contact"}.
 */

var SHEET_NAME   = 'Submissions';
var CONTACT_EMAIL = 'contato@studiokephra.org';

/** GET — simple health check. */
function doGet() {
  return jsonOut({ result: 'ok', service: 'opus-ai-contact' });
}

/** POST — receive a form submission. */
function doPost(e) {
  try {
    var data = parsePayload(e);

    // Basic validation (the site also validates client-side).
    if (!data || !data.email || !data.nome) {
      return jsonOut({ result: 'error', message: 'Missing required fields (nome, email).' });
    }
    if (isSpammy(data)) {
      return jsonOut({ result: 'ok' }); // silently drop spam, look successful to bots
    }

    appendRow(data);
    notify(data);
    return jsonOut({ result: 'ok' });
  } catch (err) {
    return jsonOut({ result: 'error', message: String(err) });
  }
}

/** Accepts JSON or URL-encoded bodies. */
function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  var raw = e.postData.contents;
  try { return JSON.parse(raw); } catch (x) {
    var out = {};
    raw.split('&').forEach(function (kv) {
      var pair = kv.split('=');
      if (pair[0]) out[decodeURIComponent(pair[0])] =
        decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
    });
    return out;
  }
}

function appendRow(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Company / Institution', 'Message', 'Language', 'Source']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  sheet.appendRow([
    new Date(),
    data.nome || '',
    data.email || '',
    data.empresa || '',
    data.mensagem || '',
    data.lang || '',
    data.source || 'website'
  ]);
}

function notify(data) {
  var subject = 'Opus AI — new website contact';
  var body = [
    'New contact from the Opus AI website:',
    '',
    'Name:      ' + (data.nome || ''),
    'Email:     ' + (data.email || ''),
    'Company:   ' + (data.empresa || '—'),
    'Language:  ' + (data.lang || '—'),
    '',
    'Message:',
    (data.mensagem || '—'),
    '',
    '— Logged to the "' + SHEET_NAME + '" sheet.'
  ].join('\n');
  try { MailApp.sendEmail(CONTACT_EMAIL, subject, body); } catch (e) { /* email optional */ }
}

/** Lightweight honeypot / size guard. Add a hidden "company_website" field on the form to use the honeypot. */
function isSpammy(data) {
  if (data.company_website) return true;          // honeypot filled = bot
  var msg = String(data.mensagem || '');
  if (msg.length > 5000) return true;             // oversized payload
  return false;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
