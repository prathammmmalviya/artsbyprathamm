# PRATHAM — The Art of Details

A responsive artist portfolio built with HTML, CSS and vanilla JavaScript. Artwork management uses the **free Supabase tier** for secure admin login, image storage and an online artwork catalogue.

## What visitors see

- Portfolio gallery with Portrait / Devotional / Studies filters.
- Each artwork opens a detail panel showing title, description, medium, size, price and availability.
- Enquiry button opens an email draft.
- Instagram branding links to @artsbyprathamm throughout the site.
- The shop-style gallery highlights artwork price and availability, with a clear view-and-enquire action.
- The contact section has separate email and Instagram contact cards.

## What only the admin can do

The **ADMIN** link in the footer opens a private login. The authorised admin can add, edit and delete artwork listings, upload photos, and set each artwork's price, size, medium, description and availability. The public website is read-only.

## One-time free setup

You need a free Supabase project. No paid plan or card is required for this starter setup.

1. Create a project at https://supabase.com/ and open its dashboard.
2. Go to **Project Settings → API**. Copy the Project URL and the `anon` / publishable key.
3. Open **Authentication → Users** and add your own email/password user. Confirm the account if the dashboard asks.
4. Copy that user's **UUID** from the Users page.
5. Open **SQL Editor → New query**. Open `supabase-setup.sql`, replace BOTH occurrences of `YOUR_ADMIN_USER_UUID` with your user UUID, then run the SQL.
6. Open `supabase-config.js` and fill in:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_ADMIN_UID`
   - `PORTFOLIO_EMAIL`
7. Save the file. Do not put a `service_role` key in the website. Only the anon/publishable key belongs in browser code.

The UUID check in the app is for the admin interface; the database and storage Row Level Security policies are the actual security boundary. Only the one UUID entered in the SQL policies can add, edit, delete or upload. Everyone else can only view the public portfolio.

## Run locally

1. Extract the ZIP.
2. Open the folder in VS Code.
3. Run with VS Code Live Server, or any simple local static web server. Supabase authentication works best on `http://localhost` or your deployed HTTPS website rather than opening the file directly.

## Publish free with GitHub Pages

1. Create a free GitHub account at https://github.com.
2. Create a public repository, e.g. `pratham-art-portfolio`.
3. Upload all files and folders, keeping `index.html` in the repository root.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, select **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
6. Wait for GitHub Pages to provide your public site address.

Your Supabase project URL and anon key are public browser configuration by design. Security comes from Row Level Security policies. Never expose your Supabase service_role key. Keep your admin password private.

## Notes

- Supabase free-tier quotas and policies can change; check its current dashboard for limits.
- If you change the admin account, update the UUID in the SQL policies and in `supabase-config.js`.
- The contact email is configured in `supabase-config.js` (`PORTFOLIO_EMAIL`). The Instagram handle is set to `@artsbyprathamm` in `index.html`; update its profile URL there if the handle changes.
