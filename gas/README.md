# Opus AI — Contact form handler (Google Apps Script + Sheets)

The website's contact form posts to a Google Apps Script web app that logs each
submission to a Google Sheet and emails a notification. Until it is deployed,
the form gracefully falls back to opening the visitor's email client (mailto).

This was chosen for the current volume: free, no backend/server to maintain,
the team already knows Apps Script + Sheets, and submissions land in a
spreadsheet that's easy to triage and reply from.

## Deploy (5 minutes)

1. **Create / open a Google Sheet** that will hold the submissions.
2. **Extensions → Apps Script**. Delete the placeholder `Code.gs` and paste the
   contents of [`form-handler.gs`](./form-handler.gs).
3. (Optional) Edit `CONTACT_EMAIL` or `SHEET_NAME` at the top of the script.
4. **Deploy → New deployment**:
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** and authorize the requested scopes
     (Google Sheets + send email).
5. **Copy the Web app URL** (it ends in `/exec`).
6. Open `index.html` and set:
   ```js
   const GAS_ENDPOINT = "https://script.google.com/macros/s/.../exec";
   ```

That's it. The first submission auto-creates a `Submissions` sheet with headers.

## Test

- Visit the `/exec` URL in a browser → should return
  `{"result":"ok","service":"opus-ai-contact"}`.
- Submit the form on the site → a new row appears in the sheet and a
  notification email arrives at the contact address.

## Notes

- The form posts JSON with `Content-Type: text/plain` and `mode: 'no-cors'` —
  a "simple" request with no CORS preflight; Apps Script reads it from
  `e.postData.contents`. Because the response is opaque (unreadable
  cross-origin), the site treats a non-throwing fetch as delivered; only a real
  network failure falls back to `mailto:`.
- To re-deploy after editing the script: **Deploy → Manage deployments →
  Edit → Version: New version → Deploy** (the `/exec` URL stays the same).
- Optional spam protection: add a hidden honeypot field named
  `company_website` to the form; filled-in values are silently dropped.
