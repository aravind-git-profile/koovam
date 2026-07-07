/* ==================================================================
   KOOVAM — SUPABASE CONFIGURATION
   ------------------------------------------------------------------
   1. Create a free project at https://supabase.com
   2. Run supabase-setup.sql (in this folder) in the SQL editor
   3. Paste your Project URL and anon public key below
      (Supabase dashboard → Settings → API)
   Until these are filled in, the archive runs in LOCAL mode:
   the sample posts below are shown, and admin posts save to the
   admin's own browser only.
   ================================================================== */
window.KOOVAM_SUPABASE = {
  url: "",      /* e.g. "https://abcdefgh.supabase.co" */
  anonKey: ""   /* the long "anon public" key — safe to ship in frontend */
};

/* Fallback / sample posts — shown only while Supabase is not configured.
   Once Supabase is live, all posts come from the `posts` table and this
   list is ignored. */
window.KOOVAM_SEED_POSTS = [
  {
    "id": "seed-v1", "section": "videos", "type": "demo", "src": "", "thumb": "",
    "title_en": "Drone survey — Kesavaram Dam to Tiruvallur Check Dam",
    "title_ta": "ட்ரோன் ஆய்வு — கேசவரம் அணை முதல் திருவள்ளூர் தடுப்பணை வரை",
    "desc_en": "Sample post. Connect Supabase (see assets/config.js) and publish real footage from the Campaign Studio.",
    "desc_ta": "மாதிரி பதிவு. Supabase-ஐ இணைத்து (assets/config.js) உண்மையான காட்சிகளை வெளியிடுங்கள்.",
    "source": "Campaign drone team", "date": "2026-06-14", "tags": ["drone", "kesavaram", "sample"], "demo": true
  },
  {
    "id": "seed-c1", "section": "cartoons", "type": "demo", "src": "", "thumb": "",
    "title_en": "\"One river, two realities\" — awareness cartoon",
    "title_ta": "\"ஒரே ஆறு, இரண்டு யதார்த்தங்கள்\" — விழிப்புணர்வு கார்ட்டூன்",
    "desc_en": "Sample post. In the Campaign Studio you can upload cartoon images straight from your device once Supabase is connected.",
    "desc_ta": "மாதிரி பதிவு. Supabase இணைந்ததும், உங்கள் சாதனத்திலிருந்து நேரடியாக கார்ட்டூன்களை பதிவேற்றலாம்.",
    "source": "Campaign volunteers", "date": "2026-06-20", "tags": ["cartoon", "sample"], "demo": true
  },
  {
    "id": "seed-m1", "section": "media", "type": "demo", "src": "", "thumb": "",
    "title_en": "Press coverage placeholder — link news reports here",
    "title_ta": "பத்திரிக்கை செய்தி இடம் — செய்தி அறிக்கைகளை இங்கே இணைக்கவும்",
    "desc_en": "Sample post. Add article links (The Hindu, Dinamalar, TV reports…) with a thumbnail from the Campaign Studio.",
    "desc_ta": "மாதிரி பதிவு. கட்டுரை இணைப்புகளை (தி இந்து, தினமலர், TV செய்திகள்…) ஸ்டுடியோ வழியாக சேர்க்கவும்.",
    "source": "Press desk", "date": "2026-06-25", "tags": ["press", "sample"], "demo": true
  }
];

/* Background media slots for the home page — set type:"video" with an
   .mp4/.webm URL (Lovable asset or Supabase Storage URL), or
   type:"image" with an image URL. Leave type:"" for the built-in photo. */
window.MEDIA_SLOTS = {
  hero:      { type: "", src: "", poster: "" },
  signature: { type: "", src: "", poster: "" },
  closing:   { type: "", src: "", poster: "" }
};
