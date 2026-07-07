# Koovam Awareness Site — Multi-page + Supabase

## What's in this folder

```
index.html        Home — hero, the story's stakes, chapter cards, River Record links
journey.html      Chapter 01 — Kesavaram to the contamination point (evidence + maps)
data.html         Chapter 02 — data, science, and the recommendation to the Minister
action.html       Chapter 03 — letter to the Minister, share tools, press kit
videos.html       River Record 01 — Koovam Videos (search / filter / sort / share)
cartoons.html     River Record 02 — Awareness Cartoons
media.html        River Record 03 — Koovam in the Media
admin.html        Campaign Studio (hidden — not linked anywhere; direct URL only)
assets/
  styles.css      One shared stylesheet for all pages
  config.js       ← Supabase keys + background media slots (edit this)
  site.js         Shared behaviour (language toggle, menus, letter/press-kit tools)
  archive.js      River Record engine (Supabase store, gallery, share, lightbox)
  admin.js        Campaign Studio logic (auth, composer, uploads)
  img/            The 10 campaign photographs (now real .jpg files, ~1.8 MB total)
supabase-setup.sql  Run once in Supabase to create the table, policies and bucket
```

## Deploy on Lovable
Upload the whole folder (keep the structure). Every page works immediately —
before Supabase is connected, the three archive pages run in **sample mode**
showing placeholder posts, and everything else is fully live.

## Connect Supabase (makes the archive real, for all visitors)
1. Create a free project at supabase.com
2. SQL Editor → paste and run `supabase-setup.sql`
3. Authentication → Users → **Add user** (your admin email + password).
   Then Authentication → Providers → Email → **disable public sign-ups**.
4. Settings → API → copy the **Project URL** and **anon public** key into
   `assets/config.js`
5. Reload the site — archive pages now show "LIVE ARCHIVE", and posts come
   from your database.

The anon key is designed to be public; your data is protected by the
row-level-security policies in the SQL file (anyone can read, only your
signed-in admin account can post or delete).

## Using the Campaign Studio (admin)
- Go to `yoursite.com/admin.html` — it is not linked from any menu.
- **With Supabase connected:** sign in with the email/password you created in
  step 3. This is real authentication. Posts publish instantly for everyone;
  for cartoons/images you can **upload straight from your device** (stored in
  the public `media` bucket) or paste a URL.
- **Before Supabase is connected:** a passcode gate is used instead
  (default `koovam2026`) and posts save to your browser only — clearly
  labelled as preview mode. To change the passcode, run this in any browser
  console and paste the result into `ADMIN_PASS_SHA256` in `assets/admin.js`:
  ```js
  crypto.subtle.digest('SHA-256', new TextEncoder().encode('newPass'))
    .then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
  ```

## Post features (all three archive pages)
- Composer fields: section, media type (YouTube / image / article link),
  title + description in **English and Tamil separately**, source, date, tags
- Any YouTube URL format works (watch, youtu.be, Shorts) — thumbnail and
  embedded player are automatic
- Visitors can **search** (EN + Tamil, titles/descriptions/tags/sources),
  **filter** by type, **sort** (newest / oldest / A–Z)
- Every post has a **share** button — native share sheet on mobile;
  WhatsApp / X / Facebook / copy-link on desktop. Shared links deep-link
  to the exact post and open it in the player.

## Background video / image placeholders (home page)
In `assets/config.js`, `MEDIA_SLOTS` controls the hero, the split-frame
"signature" section and the closing background. Example:
```js
hero: { type: "video", src: "/assets/koovam-drone.mp4", poster: "" },
```
Upload the .mp4 as a Lovable asset (or to Supabase Storage) and paste its URL.
Videos autoplay muted, loop, respect reduced-motion, and fall back to the photo.

## Notes
- `admin.html` carries `noindex` so search engines won't list it.
- The press-kit downloads on the Take Action page now serve the real .jpg
  files from `assets/img/`.
- Tamil translations carry the same not-yet-professionally-reviewed
  disclaimer as before (in the footer).
