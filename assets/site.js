/* KOOVAM — shared site behaviour (all pages) */
(function(){
"use strict";
function $(s,c){ return (c||document).querySelector(s); }
function $$(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); }
function each(list, fn){ for(var i=0;i<list.length;i++){ fn(list[i], i); } }

/* ---- language toggle (persists across pages) ---- */
var langBtns = $$('[data-setlang]');
function setLang(l){
  document.documentElement.setAttribute('data-lang', l);
  each(langBtns, function(b){ b.classList.toggle('active', b.getAttribute('data-setlang')===l); });
  try{ localStorage.setItem('koovam_lang', l); }catch(e){}
  document.dispatchEvent(new CustomEvent('koovam:lang'));
}
each(langBtns, function(b){ b.addEventListener('click', function(){ setLang(b.getAttribute('data-setlang')); }); });
var savedLang='en'; try{ savedLang = localStorage.getItem('koovam_lang')||'en'; }catch(e){}
setLang(savedLang);
window.koovamT = function(en, ta){ return document.documentElement.getAttribute('data-lang')==='ta' ? ta : en; };

/* ---- mobile menu ---- */
var burger = $('#burgerBtn'), menu = $('#mobileMenu');
if(burger && menu){
  burger.addEventListener('click', function(){ menu.classList.toggle('open'); });
  each(menu.querySelectorAll('a'), function(a){ a.addEventListener('click', function(){ menu.classList.remove('open'); }); });
}

/* ---- scroll reveal ---- */
var reveals = $$('.reveal');
if('IntersectionObserver' in window){
  var io = new IntersectionObserver(function(entries){
    each(entries, function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
  }, {threshold:0.12, rootMargin:'0px 0px -60px 0px'});
  each(reveals, function(el){ io.observe(el); });
} else { each(reveals, function(el){ el.classList.add('in'); }); }

/* ---- animated counters ---- */
var counters = $$('[data-count]');
function animateCounter(el){
  var target = parseFloat(el.getAttribute('data-count'));
  var suffix = el.getAttribute('data-suffix')||'';
  var isDecimal = String(target).indexOf('.')!==-1;
  var dur=1400, start=null;
  function step(ts){
    if(!start) start=ts;
    var p=Math.min((ts-start)/dur,1), eased=1-Math.pow(1-p,3), val=target*eased;
    el.textContent = (isDecimal?val.toFixed(1):Math.round(val).toLocaleString('en-IN'))+suffix;
    if(p<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
if(counters.length){
  if('IntersectionObserver' in window){
    var io2 = new IntersectionObserver(function(entries){
      each(entries, function(en){ if(en.isIntersecting){ animateCounter(en.target); io2.unobserve(en.target); } });
    }, {threshold:0.4});
    each(counters, function(el){ io2.observe(el); });
  } else { each(counters, function(el){ el.textContent = el.getAttribute('data-count')+(el.getAttribute('data-suffix')||''); }); }
}

/* ---- toast ---- */
var toastEl = $('#toast'), toastTimer;
window.koovamToast = function(msg){
  if(!toastEl) return;
  toastEl.textContent = msg; toastEl.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 2400);
};

/* ---- background media slots (home page) ---- */
each($$('[data-media-slot]'), function(box){
  var cfg = (window.MEDIA_SLOTS||{})[box.getAttribute('data-media-slot')];
  if(!cfg || !cfg.type || !cfg.src) return;
  var img = box.querySelector('img');
  if(cfg.type==='image'){ if(img) img.src = cfg.src; return; }
  if(cfg.type==='video'){
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce) return;
    var v = document.createElement('video');
    v.className='slot-video'; v.src=cfg.src; v.muted=true; v.loop=true; v.autoplay=true;
    v.playsInline=true; v.setAttribute('playsinline','');
    v.poster = cfg.poster || (img && img.src) || '';
    box.insertBefore(v, box.firstChild);
    if(img) img.style.visibility='hidden';
  }
});

/* ================= Take-Action page tools (guarded) ================= */
function currentLetter(){
  var box = document.documentElement.getAttribute('data-lang')==='ta' ? $('#letterBoxTa') : $('#letterBoxEn');
  return box ? box.value : '';
}
var mailBtn = $('#mailBtn');
if(mailBtn) mailBtn.addEventListener('click', function(e){
  e.preventDefault();
  var ta = document.documentElement.getAttribute('data-lang')==='ta';
  var subject = ta ? 'கேசவரம்-செம்பரம்பாக்கம் பகுதியை பாதுகாக்கப்பட்ட குடிநீர் மண்டலமாக அறிவிக்கவும்'
                   : 'Declare the Kesavaram-Chembarambakkam stretch a Protected Drinking Water Zone';
  window.location.href = 'mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(currentLetter());
});
var copyLetterBtn = $('#copyLetterBtn');
if(copyLetterBtn) copyLetterBtn.addEventListener('click', function(){
  navigator.clipboard.writeText(currentLetter()).then(function(){
    window.koovamToast(window.koovamT('Letter copied to clipboard','கடிதம் நகலெடுக்கப்பட்டது'));
  });
});
var shareBtn = $('#shareBtn');
if(shareBtn) shareBtn.addEventListener('click', function(){
  var shareData = {
    title: 'Protecting the Koovam — Kesavaram to Chembarambakkam',
    text: "A third of Chennai's Chembarambakkam Lake water flows through a Koovam River stretch being contaminated by untreated sewage right now.",
    url: window.location.href
  };
  if(navigator.share){ navigator.share(shareData).catch(function(){}); }
  else{ navigator.clipboard.writeText(shareData.url); window.koovamToast(window.koovamT('Link copied to clipboard','இணைப்பு நகலெடுக்கப்பட்டது')); }
});
var copyLinkBtn = $('#copyLinkBtn');
if(copyLinkBtn) copyLinkBtn.addEventListener('click', function(){
  navigator.clipboard.writeText(window.location.href).then(function(){
    window.koovamToast(window.koovamT('Link copied to clipboard','இணைப்பு நகலெடுக்கப்பட்டது'));
  });
});

/* press kit — now real file downloads */
var kitList = $('#kitList');
if(kitList){
  var kitItems = [
    {key:'signboard', en:'01 — Official Kesavaram signboard', ta:'01 — அதிகாரப்பூர்வ கேசவரம் பலகை'},
    {key:'signature_split', en:'02 — Clean water meets sewage (aerial)', ta:'02 — தூய்மையான நீரும் கழிவுநீரும் சந்திக்கும் காட்சி'},
    {key:'map_route', en:'03 — Route map: Korattur to Chembarambakkam', ta:'03 — வழி வரைபடம்'},
    {key:'map_sewage', en:'04 — Sewage confluence map', ta:'04 — கழிவுநீர் சங்கம வரைபடம்'},
    {key:'riverbed_wide', en:'05 — Exposed riverbed, aerial', ta:'05 — வெளிப்பட்ட ஆற்றுப் படுகை, வான்வழி'},
    {key:'riverbed_close', en:'06 — Exposed riverbed, close-up', ta:'06 — வெளிப்பட்ட ஆற்றுப் படுகை, அருகில்'},
    {key:'stagnant_pond', en:'07 — Stagnant impounded water', ta:'07 — தேங்கிய நீர்'},
    {key:'bangaru_canal', en:'08 — Bangaru Canal', ta:'08 — பங்காரு கால்வாய்'},
    {key:'chembarambakkam', en:'09 — Chembarambakkam Lake', ta:'09 — செம்பரம்பாக்கம் ஏரி'}
  ];
  each(kitItems, function(item){
    var row=document.createElement('div'); row.className='kit-row';
    var nameSpan=document.createElement('div'); nameSpan.className='k-name';
    var enS=document.createElement('span'); enS.setAttribute('lang','en'); enS.textContent=item.en;
    var taS=document.createElement('span'); taS.setAttribute('lang','ta'); taS.textContent=item.ta;
    nameSpan.appendChild(enS); nameSpan.appendChild(taS);
    var a=document.createElement('a');
    a.href='assets/img/koovam-'+item.key+'.jpg'; a.download='koovam-'+item.key+'.jpg';
    var dlEn=document.createElement('span'); dlEn.setAttribute('lang','en'); dlEn.textContent='Download';
    var dlTa=document.createElement('span'); dlTa.setAttribute('lang','ta'); dlTa.textContent='பதிவிறக்கம்';
    a.appendChild(dlEn); a.appendChild(dlTa);
    row.appendChild(nameSpan); row.appendChild(a);
    kitList.appendChild(row);
  });
}
var factsheetBtn = $('#factsheetBtn');
if(factsheetBtn) factsheetBtn.addEventListener('click', function(){
  var sheet = [
    'PROTECTING THE KOOVAM — FACT SHEET',
    'Kesavaram Dam to Chembarambakkam Lake, Tiruvallur District, Tamil Nadu',
    '',
    "- This stretch fills ~1/3 of Chembarambakkam Lake's annual storage (~1,300 Mcft/year), one of Greater Chennai's principal drinking-water reservoirs.",
    '- Untreated sewage enters at Tiruvallur Check Dam from Tiruvallur Municipality (Periyakuppam STP, designed 6.2 MLD, failing to treat 5.5 MLD inflow) and Manavalanagar Municipality (27 wards, storm water drains), affecting 10,000+ families.',
    '- Korattur Check Dam diverts flow ~12 km downstream via Bangaru Canal into Chembarambakkam Lake.',
    '- IIT Madras (Prof. Indumathi M. Nambi & G.V. Koulini) detected PFAS ("forever chemicals") in Chembarambakkam Lake, Buckingham Canal, and Adyar River surface water, pointing to untreated wastewater as a key source. Referenced in NGT proceedings OA 548/2024.',
    '- The Chennai Peripheral Ring Road bridge project emptied the Tiruvallur check dam in 2026, exposing a concentrated stream of untreated sewage and dumped waste; The Hindu (May 2026) reported groundwater depletion of ~20 ft in Vengathur, Putlur and Manavala Nagar during construction.',
    '- Recommendation: declare the Kesavaram-Chembarambakkam stretch a "Protected Koovam Drinking Water Zone" with mandatory STP standards, infrastructure project review, routine water quality monitoring, cross-department accountability, and buffer/encroachment control.',
    '',
    'Sources: Water Resources Department records; Chennai Rivers Restoration Trust; TNPCB RTI disclosure (New Indian Express, Dec 2025); The Hindu; Times of India; Dinamalar; NGT OA 548/2024.',
    '',
    'Media contact: [add your campaign email or phone here]'
  ].join('\n');
  navigator.clipboard.writeText(sheet).then(function(){
    window.koovamToast(window.koovamT('Fact sheet copied to clipboard','தகவல் தாள் நகலெடுக்கப்பட்டது'));
  });
});

/* ---- home page: live archive counts on the River Record cards ---- */
var countEls = $$('[data-archive-count]');
if(countEls.length && window.KoovamStore){
  window.KoovamStore.all().then(function(posts){
    each(countEls, function(el){
      var sec = el.getAttribute('data-archive-count');
      var n = posts.filter(function(p){ return p.section===sec; }).length;
      el.textContent = n;
    });
  }).catch(function(){});
}
})();
