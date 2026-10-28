/* Motion layer: count-up numbers, scroll reveals, growing chart bars and soft pulses.
   Shared by every page. Does nothing when the visitor prefers reduced motion. */
(function(){
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var css = [
    '.mo-rv{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1);transition-delay:var(--mo-d,0ms)}',
    '.mo-rv.mo-in{opacity:1;transform:none}',
    '.mo-num{font-variant-numeric:tabular-nums}',
    '.mo-num.mo-done{animation:mo-pop .5s cubic-bezier(.3,1.6,.5,1)}',
    '@keyframes mo-pop{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)}}',
    '.stat b,.big-num,.tier .price{transform-origin:left center}.t b{transform-origin:center}',
    /* chart bars grow from the baseline */
    '.mo-bar{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0);transition:transform .9s cubic-bezier(.2,.8,.2,1);transition-delay:var(--mo-d,0ms)}',
    '.mo-in .mo-bar{transform:scaleY(1)}',
    '.mo-lbl{opacity:0;transition:opacity .5s ease;transition-delay:var(--mo-d,0ms)}',
    '.mo-in .mo-lbl{opacity:1}',
    /* the funnel path lights up step by step */
    '.path.mo-path span{transition:transform .4s ease,box-shadow .4s ease,background .4s ease}',
    '.path.mo-path span:not(.end).mo-lit{animation:mo-hop .7s ease}',
    '@keyframes mo-hop{0%,100%{transform:none;box-shadow:none}40%{transform:translateY(-4px);box-shadow:0 8px 18px rgba(0,113,227,.22)}}',
    '.path.mo-path i{transform:scaleX(0);transform-origin:left;transition:transform .35s ease}',
    '.path.mo-path i.mo-lit{transform:scaleX(1)}',
    /* breathing and pulsing accents */
    '.btn-p{position:relative;animation:mo-ring 2.8s ease-out infinite}',
    '@keyframes mo-ring{0%{box-shadow:0 0 0 0 rgba(0,113,227,.45)}70%{box-shadow:0 0 0 14px rgba(0,113,227,0)}100%{box-shadow:0 0 0 0 rgba(0,113,227,0)}}',
    '.btn{transition:transform .2s ease,background .2s ease}.btn:hover{transform:translateY(-2px)}',
    '.path span.end{animation:mo-breathe 3.2s ease-in-out infinite}',
    '@keyframes mo-breathe{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(0,113,227,.35)}50%{transform:scale(1.05);box-shadow:0 0 0 8px rgba(0,113,227,0)}}',
    '.case-head .dot{animation:mo-dot 2.4s ease-in-out infinite}',
    '@keyframes mo-dot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:.7}}',
    '.rating svg{animation:mo-star 3s ease-in-out infinite;transform-origin:center}',
    '@keyframes mo-star{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.2) rotate(12deg)}}',
    '.t.out b,.big-num{animation:mo-glow 3.6s ease-in-out infinite}',
    '@keyframes mo-glow{0%,100%{text-shadow:0 0 0 rgba(245,165,36,0)}50%{text-shadow:0 0 18px rgba(245,165,36,.45)}}',
    '.tier.feat{animation:mo-lift 4s ease-in-out infinite}',
    '@keyframes mo-lift{0%,100%{box-shadow:0 10px 30px rgba(0,113,227,.18)}50%{box-shadow:0 18px 48px rgba(0,113,227,.34)}}',
    '.hero h1 .hl{background:linear-gradient(90deg,var(--blue) 0%,#4DA3FF 25%,var(--blue) 50%,#4DA3FF 75%,var(--blue) 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:mo-shine 6s linear infinite;padding-right:.08em}',
    '@keyframes mo-shine{to{background-position:-200% 0}}',
    /* hover lift on cards */
    '.stat,.t,.step,.pain-c,.w-card,.peep,.tier,.bcard,.ecard,.dstep,.doc,.obj,.block{transition:transform .25s ease,box-shadow .25s ease}',
    '.stat:hover,.t:hover,.step:hover,.pain-c:hover,.w-card:hover,.peep:hover,.bcard:hover,.ecard:hover,.dstep:hover,.doc:hover,.obj:hover{transform:translateY(-4px);box-shadow:0 14px 34px rgba(10,22,40,.10);position:relative;z-index:1}',
    '.tier:not(.feat):hover{transform:translateY(-4px);box-shadow:0 14px 34px rgba(10,22,40,.10)}',
    '.shot img{transition:transform .6s cubic-bezier(.2,.7,.2,1)}.shot:hover img{transform:scale(1.02)}'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function inSlide(el){ return !!el.closest('.slide'); }

  /* ---- scroll reveal ---- */
  var REVEAL = '.hero .eyebrow,.hero h1,.hero .lede,.hero .btns,.hero .meta,.trust .t,.sec-title,.kicker,.lead-in,.pain,.mini,' +
    '.stat,.step,.pain-c,.cmp-row,.hl-grid figure,.hl-old,.w-card,.peep,.block,.vid,.tier,.bcard,.ecard,.dstep,.doc,' +
    '.obj,.fgroup,.chartbox,.kicker-box,blockquote,.miro figure,.gal img,.ba > div,.more-box,.snapshot,.endgrid > *,' +
    'figure > .shot,.sysfig,.case-head,.phase-badge,.note-big,.slides';
  var items = [].slice.call(document.querySelectorAll(REVEAL)).filter(function(el){
    return !inSlide(el) && !el.closest('.nav') && !el.closest('.cta');
  });
  // skip anything nested inside another reveal target so nothing fades twice
  var set = new Set(items);
  items = items.filter(function(el){
    for (var p = el.parentElement; p; p = p.parentElement) if (set.has(p)) return false;
    return true;
  });
  items.forEach(function(el){
    var sib = 0, s = el.previousElementSibling;
    while (s) { if (set.has(s)) sib++; s = s.previousElementSibling; }
    el.style.setProperty('--mo-d', Math.min(sib, 6) * 80 + 'ms');
    el.classList.add('mo-rv');
  });
  var revealIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      e.target.classList.add('mo-in');
      revealIO.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach(function(el){ revealIO.observe(el); });

  /* ---- count-up numbers ---- */
  var NUMS = '.stat b,.t b,.big-num,.tier .price,.rating b,.note-big b,.more-box b';
  var ease = function(t){ return 1 - Math.pow(1 - t, 3); };
  function prep(el){
    if (el.children.length) return null;
    var txt = el.textContent;
    var m = txt.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/);
    if (!m) return null;
    var raw = m[2];
    if (/^0\d/.test(raw)) return null; // "01"-style labels stay as they are
    var val = parseFloat(raw.replace(/,/g, ''));
    if (!val) return null;
    var dec = (raw.split('.')[1] || '').length;
    return { el: el, pre: m[1], suf: m[3], val: val, dec: dec, comma: raw.indexOf(',') > -1, final: txt };
  }
  function fmt(n, d){
    var s = n.toFixed(d.dec);
    if (d.comma) { var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); s = p.join('.'); }
    return d.pre + s + d.suf;
  }
  function run(d, dur){
    var t0 = null;
    function tick(ts){
      if (t0 === null) t0 = ts;
      var k = Math.min((ts - t0) / dur, 1);
      d.el.textContent = k < 1 ? fmt(d.val * ease(k), d) : d.final;
      if (k < 1) requestAnimationFrame(tick);
      else d.el.classList.add('mo-done');
    }
    requestAnimationFrame(tick);
  }
  var nums = [].slice.call(document.querySelectorAll(NUMS)).map(prep).filter(Boolean);
  var numIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      numIO.unobserve(e.target);
      var d = e.target._mo;
      setTimeout(function(){ run(d, d.val > 1000 ? 1900 : 1500); }, 150);
    });
  }, { threshold: 0.6 });
  nums.forEach(function(d){
    d.el.classList.add('mo-num');
    d.el._mo = d;
    d.el.textContent = fmt(0, d);
    numIO.observe(d.el);
  });

  /* ---- bar charts ---- */
  [].slice.call(document.querySelectorAll('.chartbox svg')).forEach(function(svg){
    var bars = svg.querySelectorAll('rect');
    [].forEach.call(bars, function(r, i){
      r.classList.add('mo-bar');
      r.style.setProperty('--mo-d', i * 90 + 'ms');
    });
    // value labels above bars fade in once the bars have grown
    [].forEach.call(svg.querySelectorAll('text'), function(t){
      if (parseFloat(t.getAttribute('font-size')) < 20) return;
      t.classList.add('mo-lbl');
      t.style.setProperty('--mo-d', 500 + bars.length * 60 + 'ms');
    });
  });
  var chartIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      e.target.classList.add('mo-in');
      chartIO.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  [].forEach.call(document.querySelectorAll('.chartbox svg'), function(s){ chartIO.observe(s); });

  /* ---- funnel path lights up in sequence ---- */
  [].forEach.call(document.querySelectorAll('.path'), function(path){
    path.classList.add('mo-path');
    var io = new IntersectionObserver(function(entries){
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      [].forEach.call(path.children, function(c, i){
        setTimeout(function(){ c.classList.add('mo-lit'); }, i * 160);
      });
    }, { threshold: 0.5 });
    io.observe(path);
  });
})();
