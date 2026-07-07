/* KOOVAM — River Record archive engine
   Data source: Supabase `posts` table when configured in assets/config.js;
   otherwise falls back to seed posts + this browser's localStorage. */
(function(){
"use strict";
function $(s,c){ return (c||document).querySelector(s); }
function $$(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); }
function esc(s){ var d=document.createElement('div'); d.textContent = s==null?'':String(s); return d.innerHTML; }
function isTa(){ return document.documentElement.getAttribute('data-lang')==='ta'; }
function t(en, ta){ return isTa()? ta : en; }
function toast(m){ if(window.koovamToast) window.koovamToast(m); }

/* ---------------- Supabase client ---------------- */
var CFG = window.KOOVAM_SUPABASE || {};
var sb = null;
if(CFG.url && CFG.anonKey && window.supabase && window.supabase.createClient){
  try{ sb = window.supabase.createClient(CFG.url, CFG.anonKey); }catch(e){ sb = null; }
}
var LS_POSTS='koovam_rr_posts_v1';

function localPosts(){ try{ return JSON.parse(localStorage.getItem(LS_POSTS)||'[]'); }catch(e){ return []; } }
function normalize(row){
  /* Supabase rows come back with the same column names we use */
  if(row && !Array.isArray(row.tags)) row.tags = row.tags ? String(row.tags).split(',') : [];
  return row;
}

var KoovamStore = {
  live: !!sb,
  _cache: null,
  all: function(force){
    var self = this;
    if(self._cache && !force) return Promise.resolve(self._cache);
    if(sb){
      return sb.from('posts').select('*').order('date', {ascending:false})
        .then(function(res){
          if(res.error) throw res.error;
          self._cache = (res.data||[]).map(normalize);
          return self._cache;
        });
    }
    self._cache = (window.KOOVAM_SEED_POSTS||[]).concat(localPosts());
    return Promise.resolve(self._cache);
  },
  add: function(post){
    var self=this;
    if(sb){
      var row = Object.assign({}, post); delete row.id; delete row.demo;
      return sb.from('posts').insert(row).select().then(function(res){
        if(res.error) throw res.error;
        self._cache = null;
        return normalize(res.data && res.data[0]);
      });
    }
    var arr = localPosts(); arr.push(post);
    try{ localStorage.setItem(LS_POSTS, JSON.stringify(arr)); }catch(e){}
    self._cache = null;
    return Promise.resolve(post);
  },
  remove: function(id){
    var self=this;
    if(sb){
      return sb.from('posts').delete().eq('id', id).then(function(res){
        if(res.error) throw res.error;
        self._cache = null;
      });
    }
    var arr = localPosts().filter(function(p){ return p.id!==id; });
    try{ localStorage.setItem(LS_POSTS, JSON.stringify(arr)); }catch(e){}
    self._cache = null;
    return Promise.resolve();
  },
  uploadImage: function(file){
    if(!sb) return Promise.reject(new Error('supabase-not-configured'));
    var path = Date.now().toString(36) + '-' + file.name.replace(/[^\w.\-]+/g,'_');
    return sb.storage.from('media').upload(path, file, {upsert:false}).then(function(res){
      if(res.error) throw res.error;
      return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
    });
  }
};
window.KoovamStore = KoovamStore;

/* ---------------- helpers ---------------- */
function ytId(url){
  if(!url) return null;
  var m = String(url).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/);
  return m ? m[1] : null;
}
function postThumb(p){
  if(p.thumb) return p.thumb;
  if(p.type==='youtube'){ var id=ytId(p.src); if(id) return 'https://img.youtube.com/vi/'+id+'/hqdefault.jpg'; }
  if(p.type==='image') return p.src;
  return null;
}
function fmtDate(d){
  if(!d) return '';
  try{
    var dt = new Date(String(d).slice(0,10)+'T00:00:00');
    return dt.toLocaleDateString(isTa()?'ta-IN':'en-IN', {year:'numeric', month:'short', day:'numeric'});
  }catch(e){ return d; }
}
function stampFor(p){
  if(p.demo) return {cls:'demo', en:'SAMPLE', ta:'மாதிரி'};
  if(p.type==='youtube') return {cls:'v', en:'VIDEO', ta:'காணொளி'};
  if(p.type==='image') return {cls:'c', en:'IMAGE', ta:'படம்'};
  return {cls:'m', en:'PRESS', ta:'செய்தி'};
}
function pageForSection(sec){ return sec + '.html'; }
function postUrl(p){
  var base = location.origin + location.pathname.replace(/[^\/]*$/, '');
  return base + pageForSection(p.section) + '#post-' + encodeURIComponent(p.id);
}
window.koovamCardHTML = cardHTML;
window.koovamYtId = ytId;
window.koovamPostThumb = postThumb;

function cardHTML(p){
  var th = postThumb(p), st = stampFor(p), isVid = p.type==='youtube';
  return ''+
  '<article class="rr-card" data-post="'+esc(p.id)+'">'+
    '<div class="rr-thumb" data-open role="button" tabindex="0" aria-label="'+esc(p.title_en||'')+'">'+
      '<span class="rr-stamp '+st.cls+'"><span lang="en">'+st.en+'</span><span lang="ta">'+st.ta+'</span></span>'+
      (th ? '<img loading="lazy" src="'+esc(th)+'" alt="'+esc(p.title_en||p.title_ta||'')+'">'
          : '<div class="ph"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12c3-4 6 4 9 0s6 4 9 0"/><path d="M3 17c3-4 6 4 9 0s6 4 9 0"/></svg><span>'+t('MEDIA PLACEHOLDER','ஊடக இடம்')+'</span></div>')+
      (isVid ? '<span class="play"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' : '')+
    '</div>'+
    '<div class="rr-body">'+
      '<div class="rr-date">'+esc(fmtDate(p.date))+'</div>'+
      '<div class="rr-title"><span lang="en">'+esc(p.title_en||p.title_ta||'')+'</span><span lang="ta">'+esc(p.title_ta||p.title_en||'')+'</span></div>'+
      '<div class="rr-desc"><span lang="en" class="block">'+esc(p.desc_en||'')+'</span><span lang="ta" class="block">'+esc(p.desc_ta||'')+'</span></div>'+
      '<div class="rr-foot">'+
        '<span class="rr-src">'+esc(p.source||'')+'</span>'+
        '<span class="rr-actions">'+
          '<button class="rr-ibtn" data-share title="'+t('Share','பகிர்')+'" aria-label="Share"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg></button>'+
          '<button class="rr-ibtn" data-open title="'+t('Open','திற')+'" aria-label="Open"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M9 7h8v8"/></svg></button>'+
        '</span>'+
      '</div>'+
    '</div>'+
  '</article>';
}

/* ---------------- share ---------------- */
var pop = $('#sharePop');
function shareText(p){
  var title = t(p.title_en||p.title_ta, p.title_ta||p.title_en);
  return title + ' — ' + t('Protecting the Koovam River','கூவம் ஆற்றைப் பாதுகாப்போம்');
}
function openSharePop(p, anchorEl){
  if(!pop) return;
  var url = postUrl(p), text = shareText(p), enc = encodeURIComponent;
  pop.innerHTML =
    '<a target="_blank" rel="noopener" href="https://wa.me/?text='+enc(text+'\n'+url)+'">WhatsApp</a>'+
    '<a target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text='+enc(text)+'&url='+enc(url)+'">X</a>'+
    '<a target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u='+enc(url)+'">Facebook</a>'+
    '<button type="button" data-copy>'+t('Copy link','இணைப்பு நகல்')+'</button>';
  pop.querySelector('[data-copy]').addEventListener('click', function(){
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
      .then(function(){ toast(t('Link copied','இணைப்பு நகலெடுக்கப்பட்டது')); })
      .catch(function(){ prompt(t('Copy this link:','இந்த இணைப்பை நகலெடுக்கவும்:'), url); });
    closeSharePop();
  });
  var r = anchorEl.getBoundingClientRect();
  pop.classList.add('open');
  var pw = pop.offsetWidth;
  var left = Math.min(Math.max(10, r.left + r.width/2 - pw/2), window.innerWidth - pw - 10);
  var top = r.top - pop.offsetHeight - 10;
  if(top < 10) top = r.bottom + 10;
  pop.style.left = left+'px'; pop.style.top = top+'px';
}
function closeSharePop(){ if(pop) pop.classList.remove('open'); }
document.addEventListener('click', function(e){
  if(pop && pop.classList.contains('open') && !pop.contains(e.target) && !e.target.closest('[data-share]')) closeSharePop();
});
window.addEventListener('scroll', closeSharePop, {passive:true});
function sharePost(p, anchorEl){
  if(navigator.share){ navigator.share({title:shareText(p), text:shareText(p), url:postUrl(p)}).catch(function(){}); }
  else{ openSharePop(p, anchorEl); }
}
window.koovamSharePost = sharePost;

/* ---------------- gallery (single-section pages) ---------------- */
var SECTION = document.body.getAttribute('data-archive-section');
var state = {q:'', sort:'new', type:'all'};

function buildToolbar(){
  var host = $('[data-rr-toolbar]'); if(!host) return;
  host.innerHTML =
  '<div class="rr-toolbar reveal in">'+
    '<div class="rr-search">'+
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>'+
      '<input type="search" data-rr-q placeholder="'+t('Search titles, tags, sources…','தலைப்பு, குறிச்சொல், மூலம் தேடுங்கள்…')+'" aria-label="Search">'+
    '</div>'+
    '<div class="rr-chips" data-rr-type>'+
      '<button class="rr-chip on" data-v="all"><span lang="en">All</span><span lang="ta">அனைத்தும்</span></button>'+
      '<button class="rr-chip" data-v="youtube"><span lang="en">Videos</span><span lang="ta">காணொளி</span></button>'+
      '<button class="rr-chip" data-v="image"><span lang="en">Images</span><span lang="ta">படங்கள்</span></button>'+
      '<button class="rr-chip" data-v="link"><span lang="en">Links</span><span lang="ta">இணைப்புகள்</span></button>'+
    '</div>'+
    '<select class="rr-select" data-rr-sort aria-label="Sort">'+
      '<option value="new">'+t('Newest first','புதியவை முதலில்')+'</option>'+
      '<option value="old">'+t('Oldest first','பழையவை முதலில்')+'</option>'+
      '<option value="az">'+t('Title A–Z','தலைப்பு A–Z')+'</option>'+
    '</select>'+
  '</div>';
  $('[data-rr-q]', host).addEventListener('input', function(){ state.q=this.value.toLowerCase(); render(); });
  $('[data-rr-sort]', host).addEventListener('change', function(){ state.sort=this.value; render(); });
  $$('[data-rr-type] .rr-chip', host).forEach(function(ch){
    ch.addEventListener('click', function(){
      $$('[data-rr-type] .rr-chip', host).forEach(function(c){ c.classList.remove('on'); });
      ch.classList.add('on'); state.type = ch.getAttribute('data-v'); render();
    });
  });
}

var allPosts = [];
function filterSort(){
  var items = allPosts.filter(function(p){ return p.section===SECTION; });
  if(state.type!=='all') items = items.filter(function(p){ return p.type===state.type || (state.type==='youtube' && p.demo && SECTION==='videos'); });
  if(state.q){
    items = items.filter(function(p){
      var hay=[p.title_en,p.title_ta,p.desc_en,p.desc_ta,p.source,(p.tags||[]).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(state.q)!==-1;
    });
  }
  items.sort(function(a,b){
    if(state.sort==='az') return String(a.title_en||a.title_ta||'').localeCompare(String(b.title_en||b.title_ta||''));
    var da=String(a.date||''), db=String(b.date||'');
    return state.sort==='old' ? da.localeCompare(db) : db.localeCompare(da);
  });
  return items;
}

function render(){
  var grid = $('[data-rr-grid]'); if(!grid) return;
  var empty = $('[data-rr-empty]'), count = $('[data-rr-count]');
  var items = filterSort();
  var total = allPosts.filter(function(p){ return p.section===SECTION; }).length;
  if(count) count.textContent = total + ' ' + t(total===1?'entry':'entries','பதிவுகள்');
  grid.innerHTML = items.map(cardHTML).join('');
  if(empty) empty.style.display = items.length ? 'none' : 'block';
  $$('.rr-card', grid).forEach(function(card){
    var p = items.filter(function(x){ return String(x.id)===card.getAttribute('data-post'); })[0];
    if(!p) return;
    $$('[data-open]', card).forEach(function(el){
      el.addEventListener('click', function(){ openLightbox(p); });
      el.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openLightbox(p); } });
    });
    $('[data-share]', card).addEventListener('click', function(e){ e.stopPropagation(); sharePost(p, this); });
  });
}

/* ---------------- lightbox ---------------- */
var lb = $('#rrLightbox'), lbMedia = $('#rrLbMedia'), lbCurrent=null;
function openLightbox(p){
  if(!lb) return;
  lbCurrent = p;
  $$('.rr-lb-media iframe, .rr-lb-media img, .rr-lb-media .ph-lb', lbMedia).forEach(function(n){ n.remove(); });
  var id = p.type==='youtube' ? ytId(p.src) : null;
  if(id){
    var f=document.createElement('iframe');
    f.src='https://www.youtube-nocookie.com/embed/'+id+'?rel=0';
    f.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.allowFullscreen=true; lbMedia.appendChild(f);
  } else if(p.type==='image' && p.src){
    var im=document.createElement('img'); im.src=p.src; im.alt=p.title_en||''; lbMedia.appendChild(im);
  } else {
    var ph=document.createElement('div'); ph.className='ph-lb';
    ph.style.cssText='aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:rgba(244,246,241,0.6);font-family:var(--f-mono);font-size:12px;letter-spacing:0.14em;';
    ph.textContent = p.demo ? t('SAMPLE POST','மாதிரி பதிவு') : t('LINKED ARTICLE','இணைக்கப்பட்ட கட்டுரை');
    lbMedia.appendChild(ph);
  }
  $('#rrLbDate').textContent = fmtDate(p.date) + (p.source ? '  ·  '+p.source : '');
  $('#rrLbTitle').textContent = t(p.title_en||p.title_ta, p.title_ta||p.title_en) || '';
  $('#rrLbDesc').textContent = t(p.desc_en||'', p.desc_ta||p.desc_en||'');
  var srcA = $('#rrLbSource');
  if(p.src){
    srcA.href=p.src; srcA.style.display='inline';
    srcA.textContent = p.type==='link' ? t('Read the full article ↗','முழு கட்டுரையைப் படிக்க ↗') : t('Open original ↗','மூலத்தைத் திற ↗');
  } else srcA.style.display='none';
  lb.classList.add('open'); document.body.style.overflow='hidden';
  try{ history.replaceState(null,'','#post-'+encodeURIComponent(p.id)); }catch(e){}
}
function closeLightbox(){
  if(!lb) return;
  lb.classList.remove('open'); document.body.style.overflow='';
  $$('.rr-lb-media iframe', lbMedia).forEach(function(n){ n.remove(); });
  try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){}
}
if(lb){
  $('#rrLbClose').addEventListener('click', closeLightbox);
  lb.addEventListener('click', function(e){ if(e.target===lb) closeLightbox(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeLightbox(); closeSharePop(); } });
  $('#rrLbShare').addEventListener('click', function(){ if(lbCurrent) sharePost(lbCurrent, this); });
}

/* ---------------- init ---------------- */
function loadAndRender(){
  KoovamStore.all().then(function(posts){
    allPosts = posts;
    render();
    var m = location.hash.match(/^#post-(.+)$/);
    if(m){
      var id = decodeURIComponent(m[1]);
      var p = allPosts.filter(function(x){ return String(x.id)===id; })[0];
      if(p) setTimeout(function(){ openLightbox(p); }, 250);
    }
  }).catch(function(err){
    var grid = $('[data-rr-grid]');
    if(grid) grid.innerHTML = '<div class="rr-empty" style="grid-column:1/-1; display:block;"><b>'+t('Could not load the archive','பதிவேட்டை ஏற்ற முடியவில்லை')+'</b>'+t('Check the Supabase configuration in assets/config.js, then reload.','assets/config.js-இல் Supabase அமைப்பை சரிபார்த்து மீண்டும் ஏற்றவும்.')+'</div>';
  });
}
if(SECTION){
  var mode = $('[data-rr-mode]');
  if(mode) mode.textContent = KoovamStore.live ? t('LIVE ARCHIVE','நேரடி பதிவேடு') : t('SAMPLE MODE — CONNECT SUPABASE','மாதிரி முறை');
  buildToolbar();
  loadAndRender();
  document.addEventListener('koovam:lang', function(){ buildToolbar(); render(); });
}
})();
