/* KOOVAM — Campaign Studio (admin.html)
   With Supabase configured: real email/password sign-in (Supabase Auth),
   posts go to the `posts` table, images upload to the `media` bucket.
   Without Supabase: passcode gate + localStorage (preview mode). */
(function(){
"use strict";
function $(s,c){ return (c||document).querySelector(s); }
function $$(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); }
function esc(s){ var d=document.createElement('div'); d.textContent=s==null?'':String(s); return d.innerHTML; }
function toast(m){ if(window.koovamToast) window.koovamToast(m); }
var Store = window.KoovamStore;
var LIVE = Store.live;
var CFG = window.KOOVAM_SUPABASE || {};
var sb = LIVE && window.supabase ? window.supabase.createClient(CFG.url, CFG.anonKey) : null;

/* Fallback passcode (LOCAL mode only). Default: koovam2026
   To change: run in a browser console →
   crypto.subtle.digest('SHA-256', new TextEncoder().encode('newPass')).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''))) */
var ADMIN_PASS_SHA256 = '21b8df8a2702a06b8c6b6f75441df01b0e9b193e17f8f14ffba897c672e53c6e';
var ADM_SESSION = 'koovam_studio_unlocked';

var gate = $('#admGate'), studio = $('#admStudio');

/* ---------- gate mode ---------- */
if(LIVE){
  $('#gatePassWrap').style.display='none';
  $('#gateAuthWrap').style.display='block';
  $('#gateModeNote').innerHTML = 'Connected to Supabase — sign in with the admin account you created in the Supabase dashboard (Authentication → Users).';
} else {
  $('#gatePassWrap').style.display='block';
  $('#gateAuthWrap').style.display='none';
  $('#gateModeNote').innerHTML = '<b style="color:var(--alarm)">Preview mode:</b> Supabase is not configured yet (assets/config.js), so posts will save to this browser only. Passcode: the campaign contributor passcode.';
}

function showStudio(){
  gate.style.display='none'; studio.style.display='block';
  buildManage(); admPreview(); syncModeBanner();
}
function showGate(){ gate.style.display='flex'; studio.style.display='none'; }

/* auto-restore session */
if(LIVE){
  sb.auth.getSession().then(function(res){
    if(res.data && res.data.session) showStudio();
  });
} else {
  try{ if(sessionStorage.getItem(ADM_SESSION)==='1') showStudio(); }catch(e){}
}

/* sign in — Supabase */
var authBtn = $('#gateSignIn');
if(authBtn) authBtn.addEventListener('click', function(){
  var email=$('#gateEmail').value.trim(), pass=$('#gatePassword').value;
  var err=$('#admErr'); err.textContent='';
  authBtn.disabled=true; authBtn.textContent='Signing in…';
  sb.auth.signInWithPassword({email:email, password:pass}).then(function(res){
    authBtn.disabled=false; authBtn.textContent='Sign in';
    if(res.error){ err.textContent = res.error.message; return; }
    showStudio();
  });
});

/* passcode — local mode */
function sha256hex(str){
  if(!(window.crypto && crypto.subtle)) return Promise.reject(new Error('no-subtle'));
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function(buf){
    return Array.prototype.map.call(new Uint8Array(buf), function(x){ return x.toString(16).padStart(2,'0'); }).join('');
  });
}
var passBtn = $('#gateUnlock');
if(passBtn){
  function tryUnlock(){
    var err=$('#admErr');
    sha256hex($('#gatePass').value).then(function(h){
      if(h===ADMIN_PASS_SHA256){
        try{ sessionStorage.setItem(ADM_SESSION,'1'); }catch(e){}
        $('#gatePass').value=''; err.textContent=''; showStudio();
      } else err.textContent='Incorrect passcode.';
    }).catch(function(){ err.textContent='Open this page over https (or localhost) to unlock.'; });
  }
  passBtn.addEventListener('click', tryUnlock);
  $('#gatePass').addEventListener('keydown', function(e){ if(e.key==='Enter') tryUnlock(); });
}

$('#admLogout').addEventListener('click', function(){
  if(LIVE) sb.auth.signOut();
  try{ sessionStorage.removeItem(ADM_SESSION); }catch(e){}
  showGate(); toast('Studio locked');
});

function syncModeBanner(){
  var note = $('#admModeNote');
  if(LIVE){
    note.innerHTML = '<b>Live publishing:</b> posts save to Supabase and appear on the site for every visitor immediately. Images you upload go to the public <code>media</code> storage bucket.';
    note.style.borderColor='rgba(140,166,28,0.5)'; note.style.background='rgba(140,166,28,0.08)';
    $('[data-admtab="export"]').style.display='none';
  } else {
    note.innerHTML = '<b>Preview mode:</b> Supabase is not configured (assets/config.js), so posts save in <u>this browser</u> only. Use the Export tab to move them, or connect Supabase for real publishing — see the README.';
  }
}

/* ---------- tabs ---------- */
$$('.adm-tab').forEach(function(tab){
  tab.addEventListener('click', function(){
    $$('.adm-tab').forEach(function(x){ x.classList.remove('on'); });
    $$('.adm-pane').forEach(function(x){ x.classList.remove('on'); });
    tab.classList.add('on');
    $('[data-admpane="'+tab.getAttribute('data-admtab')+'"]').classList.add('on');
    if(tab.getAttribute('data-admtab')==='export') buildExport();
    if(tab.getAttribute('data-admtab')==='manage') buildManage();
  });
});

/* ---------- compose ---------- */
var comp = { section:'videos', type:'youtube' };
function segWire(id, key, after){
  $$('#'+id+' button').forEach(function(b){
    b.addEventListener('click', function(){
      $$('#'+id+' button').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on'); comp[key]=b.getAttribute('data-v');
      if(after) after(); admPreview();
    });
  });
}
segWire('admSection','section');
segWire('admType','type', function(){
  var lbl=$('#admUrlLabel'), hint=$('#admUrlHint'), thumbF=$('#admThumbField'), url=$('#admUrl'), up=$('#admUploadWrap');
  if(comp.type==='youtube'){
    lbl.textContent='YouTube URL'; url.placeholder='https://www.youtube.com/watch?v=…';
    hint.textContent='Paste any YouTube link — watch, share (youtu.be) or Shorts. Thumbnail and player are automatic.';
    thumbF.style.display='none'; up.style.display='none';
  } else if(comp.type==='image'){
    lbl.textContent='Image URL'; url.placeholder='https://…/cartoon.jpg';
    hint.textContent = LIVE ? 'Paste an image URL — or upload straight from your device below.' : 'Direct link to a hosted image.';
    thumbF.style.display='none'; up.style.display = LIVE ? 'block' : 'none';
  } else {
    lbl.textContent='Article / page URL'; url.placeholder='https://www.thehindu.com/…';
    hint.textContent='Link to the news article or broadcast. Add a thumbnail so the card has a picture.';
    thumbF.style.display='block'; up.style.display = LIVE ? 'block' : 'none';
  }
});

/* device upload (Supabase Storage) */
var fileInput = $('#admFile');
if(fileInput) fileInput.addEventListener('change', function(){
  var f = fileInput.files && fileInput.files[0];
  if(!f) return;
  if(f.size > 8*1024*1024){ $('#admProgress').textContent='File too large (max 8 MB) — please compress it first.'; return; }
  $('#admProgress').textContent='Uploading '+f.name+'…';
  Store.uploadImage(f).then(function(url){
    if(comp.type==='link'){ $('#admThumb').value=url; } else { $('#admUrl').value=url; }
    $('#admProgress').textContent='Uploaded ✓';
    admPreview();
  }).catch(function(e){
    $('#admProgress').textContent='Upload failed: '+(e.message||e);
  });
});

['admUrl','admThumb','admTitleEn','admTitleTa','admDescEn','admDescTa','admSource','admDate','admTags'].forEach(function(id){
  var el=$('#'+id); if(el) el.addEventListener('input', admPreview);
});
(function(){ var d=$('#admDate'); if(d && !d.value) d.value=new Date().toISOString().slice(0,10); })();

function draftPost(){
  return {
    id: 'p-'+Date.now().toString(36),
    section: comp.section, type: comp.type,
    src: $('#admUrl').value.trim(),
    thumb: comp.type==='link' ? $('#admThumb').value.trim() : '',
    title_en: $('#admTitleEn').value.trim(), title_ta: $('#admTitleTa').value.trim(),
    desc_en: $('#admDescEn').value.trim(), desc_ta: $('#admDescTa').value.trim(),
    source: $('#admSource').value.trim(),
    date: $('#admDate').value || new Date().toISOString().slice(0,10),
    tags: $('#admTags').value.split(',').map(function(s){return s.trim();}).filter(Boolean)
  };
}
function admPreview(){
  var p=draftPost();
  if(!p.title_en && !p.title_ta) p.title_en='Your post title appears here';
  $('#admPreview').innerHTML = window.koovamCardHTML(p);
}

$('#admPost').addEventListener('click', function(){
  var p=draftPost(), msg=$('#admPostMsg'), btn=$('#admPost');
  if(!p.title_en && !p.title_ta){ msg.textContent='Add a title (English or Tamil) before publishing.'; return; }
  if(comp.type==='youtube' && !window.koovamYtId(p.src)){ msg.textContent='That doesn\u2019t look like a YouTube link \u2014 please check the URL.'; return; }
  if(comp.type!=='youtube' && !p.src){ msg.textContent='Add the media URL (or upload a file) before publishing.'; return; }
  btn.disabled=true; btn.textContent='Publishing…';
  Store.add(p).then(function(){
    btn.disabled=false; btn.textContent='Publish to archive';
    msg.textContent = LIVE
      ? 'Published \u2713 \u2014 live for all visitors in the '+p.section+' page.'
      : 'Published \u2713 \u2014 visible in this browser only (preview mode).';
    ['admUrl','admThumb','admTitleEn','admTitleTa','admDescEn','admDescTa','admTags'].forEach(function(id){ $('#'+id).value=''; });
    $('#admProgress').textContent='';
    admPreview(); buildManage();
    toast('Post added to the River Record');
  }).catch(function(e){
    btn.disabled=false; btn.textContent='Publish to archive';
    msg.textContent='Could not publish: '+(e.message||e);
  });
});

/* ---------- manage ---------- */
function buildManage(){
  var host=$('#admList');
  host.innerHTML='<div class="adm-hint">Loading…</div>';
  Store.all(true).then(function(posts){
    var items = posts.filter(function(p){ return !p.demo; });
    if(!items.length){ host.innerHTML='<div class="adm-hint">No posts yet — publish your first from the New post tab.</div>'; return; }
    host.innerHTML = items.map(function(p){
      var th = window.koovamPostThumb(p);
      return '<div class="adm-row">'+
        '<div class="th">'+(th?'<img src="'+esc(th)+'" alt="">':'')+'</div>'+
        '<div class="meta"><div class="n">'+esc(p.title_en||p.title_ta||'(untitled)')+'</div><div class="s">'+esc(p.section)+' · '+esc(p.type)+' · '+esc(String(p.date||'').slice(0,10))+'</div></div>'+
        '<button class="adm-del" data-id="'+esc(p.id)+'">Remove</button>'+
      '</div>';
    }).join('');
    $$('.adm-del', host).forEach(function(b){
      b.addEventListener('click', function(){
        b.disabled=true;
        Store.remove(b.getAttribute('data-id')).then(function(){ buildManage(); toast('Post removed'); })
          .catch(function(e){ b.disabled=false; toast('Could not remove: '+(e.message||e)); });
      });
    });
  });
}

/* ---------- export (local mode) ---------- */
function buildExport(){
  Store.all(true).then(function(posts){
    var all = posts.filter(function(p){ return !p.demo; });
    $('#admJson').value = 'window.KOOVAM_SEED_POSTS = '+JSON.stringify(all, null, 2)+';';
  });
}
$('#admRefreshJson').addEventListener('click', buildExport);
$('#admCopyJson').addEventListener('click', function(){
  var ta=$('#admJson');
  (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject())
    .then(function(){ toast('Block copied'); })
    .catch(function(){ ta.select(); document.execCommand && document.execCommand('copy'); toast('Copied'); });
});
admPreview();
})();
