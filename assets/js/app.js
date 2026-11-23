/* ZUGVOGEL Umzüge – Demo. Scroll-Filme, Rechner, Besichtigung, Halteverbot, Live-Status, Karriere, Bewertungen. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var band = function (p, a, b, f) { f = f || .06; return Math.min(seg(p, a, a + f), 1 - seg(p, b - f, b)); };
  var mobile = function () { return innerWidth <= 900; };
  var de = function (n, d) { return n.toLocaleString('de-DE', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Persönlicher Link: ?firma=Umzüge+Müller ---------- */
  (function () {
    var f = null;
    try { f = new URLSearchParams(location.search).get('firma'); if (f) sessionStorage.setItem('zv-firma', f); else f = sessionStorage.getItem('zv-firma'); } catch (e) {}
    if (!f) return;
    $$('[data-firma]').forEach(function (el) { el.textContent = f; });
    root.classList.add('has-firma');
  })();

  /* ---------- Bilder ohne Datei ausblenden (nie Platzhalter) ---------- */
  $$('img').forEach(function (im) {
    function gone() { var p = im.closest('.calc-bg,.scan-bg') || im; p.style.display = 'none'; }
    if (im.complete && im.naturalWidth === 0 && im.getAttribute('src')) gone();
    im.addEventListener('error', gone);
  });

  /* ---------- Kopfzeile + Menü ---------- */
  var top = $('#top'), burger = $('#burger');
  burger.addEventListener('click', function () {
    var o = !root.classList.contains('menu-open');
    root.classList.toggle('menu-open', o); burger.setAttribute('aria-expanded', o);
    burger.setAttribute('aria-label', o ? 'Menü schließen' : 'Menü öffnen');
  });
  $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { root.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); }); });

  /* ---------- Hilfen ---------- */
  function prog(sec) {
    var r = sec.getBoundingClientRect(), h = sec.offsetHeight - innerHeight;
    return h > 0 ? clamp(-r.top / h, 0, 1) : 0;
  }
  function vis(sec) { var r = sec.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }
  function show(el, o, dy) {
    if (!el) return;
    el.style.opacity = o.toFixed(3);
    var base = el.classList.contains('b-hero') ? 'translateY(-40%) ' : el.classList.contains('b-cta') ? 'translateY(-50%) ' : '';
    el.style.transform = base + 'translateY(' + ((1 - o) * (dy == null ? 26 : dy)).toFixed(1) + 'px)';
    el.style.visibility = o < .01 ? 'hidden' : 'visible';
  }

  /* ---------- Film: Video spulen, sonst Standbild mit Kamerafahrt ---------- */
  function Film(sec) {
    var box = $('.media', sec), v = $('.vid', box), ok = false;
    var base = v && v.getAttribute('data-src'), key = v && v.getAttribute('data-key');
    var V = window.ZV_VID || {};
    if (base && V[key]) {
      var s = document.createElement('source');
      // volle Auflösung: Desktop Original, Handy hochkant Ausschnitt in voller Höhe (-p), Handy quer (-m)
      s.src = base + (mobile() ? (innerWidth / innerHeight <= .75 ? '-p' : '-m') : '') + '.mp4?v=' + V._v; s.type = 'video/mp4'; v.appendChild(s);
      v.addEventListener('loadeddata', function () { ok = true; box.classList.add('has-vid'); });
      v.load(); var pr = v.play && v.play(); if (pr && pr.then) pr.then(function () { v.pause(); }).catch(function () {});
    }
    var cur = 0;
    return function (p, z) {
      box.style.setProperty('--z', ok ? 1 : (z == null ? 1 : z));
      if (ok && v.duration) {
        var want = Math.min(v.duration - .05, v.duration * p);
        cur += (want - cur) * .35;
        if (Math.abs(v.currentTime - cur) > .02) v.currentTime = cur;
      }
    };
  }

  /* 1 Möbellift */
  var S1 = $('#lift'), f1 = Film(S1), b1 = $$('.beat', S1);
  function ch1(p) {
    f1(p, 1 + .16 * ease(p));
    show(b1[0], 1 - seg(p, .04, .14), 30);
    show(b1[1], band(p, .28, .66, .08));
    show(b1[2], band(p, .7, .99, .06));
  }
  /* 2 Sofa + Festpreis-Frage, endet als Bauplan */
  var S2 = $('#festpreis'), f2 = Film(S2), b2 = $$('.beat', S2), bp = $('.blueprint', S2);
  function ch2(p) {
    f2(seg(p, 0, .8), 1.04 + .12 * ease(seg(p, 0, .8)));
    show(b2[0], band(p, .04, .32));
    show(b2[1], band(p, .34, .6));
    show(b2[2], band(p, .62, .9, .06));
    var b = seg(p, .86, 1);
    bp.style.opacity = b.toFixed(3);
    $('.media', S2).style.filter = b > 0 ? 'grayscale(' + b + ') brightness(' + (1 - .6 * b) + ')' : '';
  }

  /* 3 Umzugsrechner */
  var CAT = [
    ['Sofa', 1.8], ['Sessel', .6], ['Bett (doppelt)', 1.6], ['Kleiderschrank', 2.4], ['Esstisch + Stühle', 1.2],
    ['Regal', .9], ['Kommode', .7], ['Schreibtisch', .8], ['Waschmaschine', .5], ['Kühlschrank', .6], ['Kartons (10 Stück)', 1.0], ['Fahrrad', .4]
  ];
  var PRE = {
    1: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 2, 1],
    2: [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 3, 1],
    3: [1, 1, 2, 2, 1, 3, 2, 1, 1, 1, 5, 2],
    4: [2, 2, 3, 3, 1, 4, 3, 2, 1, 2, 8, 3]
  };
  var qty = PRE[2].slice(), ul = $('#items');
  CAT.forEach(function (c, i) {
    var li = document.createElement('li');
    li.innerHTML = '<span>' + c[0] + '</span><button type="button" aria-label="' + c[0] + ' weniger">−</button><b>0</b><button type="button" aria-label="' + c[0] + ' mehr">+</button>';
    var bs = $$('button', li);
    bs[0].addEventListener('click', function () { qty[i] = Math.max(0, qty[i] - 1); calc(); });
    bs[1].addEventListener('click', function () { qty[i] = Math.min(20, qty[i] + 1); calc(); });
    ul.appendChild(li);
  });
  $$('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.tabs button').forEach(function (x) { x.setAttribute('aria-selected', x === b); });
      qty = PRE[b.getAttribute('data-preset')].slice(); calc();
    });
  });
  ['floorA', 'km', 'optLift', 'pack', 'hvz'].forEach(function (id) { $('#' + id).addEventListener('change', calc); });

  // Ladefläche als isometrische Kisten (3 Reihen x 4 Spalten x 3 Lagen = 36 Plätze)
  var fill = $('#fill'), SLOTS = [];
  (function () {
    // Ladeboden-Ecken: hinten-links (220,250) – vorne-links (60,210) … Vektoren im Bild
    var O = [220, 236], X = [-38, -9.5], Y = [58, -12], Z = [0, -36]; // X = Richtung Fahrerhaus, Y = nach hinten, Z = hoch
    for (var z = 0; z < 3; z++) for (var y = 0; y < 4; y++) for (var x = 0; x < 3; x++) {
      var ox = O[0] + X[0] * x + Y[0] * y + Z[0] * z, oy = O[1] + X[1] * x + Y[1] * y + Z[1] * z;
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      var pt = function (a, b, c) { return (ox + X[0] * a + Y[0] * b + Z[0] * c).toFixed(1) + ',' + (oy + X[1] * a + Y[1] * b + Z[1] * c).toFixed(1); };
      var s = .9;
      g.innerHTML =
        '<path class="box-s" d="M' + pt(0, 0, 0) + ' L' + pt(s, 0, 0) + ' L' + pt(s, 0, s) + ' L' + pt(0, 0, s) + 'Z"/>' +
        '<path class="box-f" d="M' + pt(0, 0, 0) + ' L' + pt(0, s, 0) + ' L' + pt(0, s, s) + ' L' + pt(0, 0, s) + 'Z"/>' +
        '<path class="box-t" d="M' + pt(0, 0, s) + ' L' + pt(s, 0, s) + ' L' + pt(s, s, s) + ' L' + pt(0, s, s) + 'Z"/>';
      g.style.opacity = 0; g.style.transform = 'translateY(-40px)';
      SLOTS.push({ g: g, k: z * 100 + (3 - y) * 10 + (2 - x) });
    }
    // Zeichenreihenfolge: hinten zuerst, unten zuerst
    SLOTS.sort(function (a, b) { return a.k - b.k; });
    SLOTS.forEach(function (s) { fill.appendChild(s.g); });
  })();
  var shown = 0;
  function calc() {
    var m3 = 0;
    $$('li', ul).forEach(function (li, i) { $('b', li).textContent = qty[i]; li.classList.toggle('has', qty[i] > 0); m3 += qty[i] * CAT[i][1]; });
    var floor = +$('#floorA').value, km = +$('#km').value, lift = $('#optLift').checked, pack = $('#pack').checked, hvz = $('#hvz').checked;
    m3 = Math.round(m3 * 10) / 10;
    var crew = m3 < 12 ? 2 : m3 < 30 ? 3 : 4;
    var truck = m3 < 14 ? '3,5 t' : m3 < 34 ? '7,5 t' : '12 t';
    var hours = Math.max(3, Math.round(m3 * (lift || floor === 0 ? .22 : .22 + floor * .05) + km / 60 + (pack ? m3 * .12 : 0)));
    var base = hours * crew * 39 + (m3 < 14 ? 120 : m3 < 34 ? 190 : 290) + km * 1.6 + (lift && floor > 0 ? 220 : 0) + (pack ? m3 * 14 : 0) + (hvz ? 140 : 0);
    var from = Math.round(base * .92 / 10) * 10, to = Math.round(base * 1.12 / 10) * 10;
    count($('#m3'), m3, 1); count($('#pFrom'), from, 0); count($('#pTo'), to, 0);
    $('#truckSize').textContent = truck; $('#crew').textContent = crew; $('#hours').textContent = hours;
    // LKW-Füllung: 36 Plätze ~ 40 m³
    var n = clamp(Math.round(m3 / 40 * SLOTS.length), m3 > 0 ? 1 : 0, SLOTS.length);
    SLOTS.forEach(function (s, i) {
      var on = i < n;
      s.g.style.transitionDelay = (on ? Math.max(0, i - shown) * 40 : 0) + 'ms';
      s.g.style.opacity = on ? 1 : 0; s.g.style.transform = on ? 'none' : 'translateY(-40px)';
    });
    shown = n;
  }
  var cnt = new WeakMap();
  function count(el, to, d) {
    var from = cnt.get(el) || 0, t0 = performance.now(), dur = RM ? 0 : 500;
    cnt.set(el, to);
    (function step(t) {
      var k = dur ? clamp((t - t0) / dur, 0, 1) : 1, v = from + (to - from) * ease(k);
      el.textContent = de(v, d);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  var calcStarted = false;
  new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !calcStarted) { calcStarted = true; calc(); } }); }, { threshold: .25 }).observe($('#rechner'));

  /* 4 Besichtigung per Handy: AR-Rahmen erscheinen beim Scrollen */
  var AR = [
    // x,y,w,h in % des Handy-Bilds (16:9-Bildausschnitt) + Name + m³
    [28, 44, 34, 30, 'Sofa · 1,8 m³', 1.8], [63, 44, 14, 28, 'Sessel · 0,6 m³', .6], [36, 68, 18, 14, 'Couchtisch · 0,3 m³', .3],
    [5, 22, 15, 60, 'Regal · 0,9 m³', .9], [78, 50, 18, 26, 'Sideboard · 0,7 m³', .7], [82, 14, 12, 40, 'Pflanze · 0,2 m³', .2]
  ];
  var arBox = $('#ar'), arEls = AR.map(function (a) {
    var d = document.createElement('div'); d.className = 'bx';
    d.style.cssText = 'left:' + a[0] + '%;top:' + a[1] + '%;width:' + a[2] + '%;height:' + a[3] + '%';
    if (a[0] + a[2] > 70) d.classList.add('rt'); d.innerHTML = '<span>' + a[4] + '</span>'; arBox.appendChild(d); return d;
  });
  var S4 = $('#besichtigung'), arSum = $('#arM3'), recT = $('#recT'), lastN = -1;
  function ch4(p) {
    var n = Math.round(seg(p, .1, .8) * AR.length), m = 0;
    arEls.forEach(function (e, i) { e.classList.toggle('on', i < n); if (i < n) m += AR[i][5]; });
    if (n !== lastN) { arSum.textContent = de(m, 1); lastN = n; }
    var s = Math.round(seg(p, 0, 1) * 30); recT.textContent = '00:' + (s < 10 ? '0' : '') + s;
  }
  var file = $('#file');
  file.addEventListener('change', function () {
    var n = file.files.length;
    $('#fileInfo').textContent = n ? n + (n === 1 ? ' Datei' : ' Dateien') + ' ausgewählt · Demo: nichts wird hochgeladen.' : 'Demo: Dateien werden nicht hochgeladen.';
  });

  /* 5 Halteverbot */
  var S5 = $('#halteverbot'), tl = $('#tl'), tls = $$('li', tl);
  function ch5(p) {
    var a = seg(p, .05, .3), b = seg(p, .3, .55), c = seg(p, .55, .9);
    S5.style.setProperty('--zo', a.toFixed(3));
    S5.style.setProperty('--so', Math.min(1, b * 3).toFixed(3));
    S5.style.setProperty('--sd', ((1 - ease(seg(b, 0, .6))) * 220).toFixed(1) + 'px');
    S5.style.setProperty('--sd2', ((1 - ease(seg(b, .3, 1))) * 220).toFixed(1) + 'px');
    S5.style.setProperty('--ro', ((1 - c) * 800).toFixed(1));
    S5.style.setProperty('--tx', (-120 + ease(c) * 950).toFixed(1) + 'px');
    S5.style.setProperty('--lit', seg(p, .85, .95).toFixed(3));
    S5.style.setProperty('--tp', (a * .0 + (b > 0 ? .5 * b : 0) + (c > 0 ? .5 * c : 0)).toFixed(3));
    tls[0].classList.toggle('on', a > .3); tls[1].classList.toggle('on', b > .5); tls[2].classList.toggle('on', c > .9);
  }

  /* 6 Live-Status */
  var S6 = $('#live'), feed = $$('#feed li'), lr = $('#lroute'), lt = $('#ltruck'), LEN = lr.getTotalLength();
  var CARD = [['06:45', 'Team startet im Depot', 8], ['07:12', 'Team unterwegs – Ankunft 7:30', 35], ['07:29', 'Team ist da, Möbellift wird aufgebaut', 55], ['11:40', 'LKW beladen, Abfahrt zur neuen Adresse', 80], ['14:55', 'Alles drin. Willkommen zu Hause.', 100]];
  var lastC = -1;
  function ch6(p) {
    var k = seg(p, .05, .9), pt = lr.getPointAtLength(LEN * k);
    lt.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
    var c = Math.min(CARD.length - 1, Math.floor(k * CARD.length));
    feed.forEach(function (li, i) { li.classList.toggle('on', i <= c); li.classList.toggle('cur', i === c); });
    if (c !== lastC) { $('#cardT').textContent = CARD[c][0]; $('#cardS').textContent = CARD[c][1]; $('#card').style.setProperty('--cb', CARD[c][2] + '%'); lastC = c; }
  }

  /* 7 Karriere: Film + Kinetik-Typo */
  var S7 = $('#karriere'), f7 = Film(S7), b7 = $$('.beat', S7), kin = $$('.kin p', S7);
  function ch7(p) {
    f7(seg(p, 0, .75), 1 + .1 * ease(p));
    show(b7[0], band(p, .02, .3));
    kin.forEach(function (k, i) {
      var a = .3 + i * .09, o = band(p, a, .74, .05), t = seg(p, a, a + .06);
      k.style.opacity = o.toFixed(3); k.style.transform = mobile() ? 'translateY(' + ((1 - ease(t)) * 40).toFixed(1) + 'px)' : 'translateX(' + ((1 - ease(t)) * 90).toFixed(1) + 'px)';
    });
    show(b7[1], seg(p, .78, .86));
  }

  /* ---------- Schleife ---------- */
  var CH = [[S1, ch1], [S2, ch2], [S4, ch4], [S5, ch5], [S6, ch6], [S7, ch7]], tick = false;
  function frame() {
    tick = false;
    top.classList.toggle('solid', scrollY > innerHeight * .6);
    CH.forEach(function (c) { if (vis(c[0])) c[1](prog(c[0])); });
  }
  function req() { if (!tick) { tick = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  CH.forEach(function (c) { c[1](prog(c[0])); });
  frame();

  /* Aktiver Menüpunkt */
  var navA = $$('.nav a');
  var navIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) navA.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['rechner', 'besichtigung', 'halteverbot', 'live', 'karriere', 'bewertungen'].forEach(function (id) { navIO.observe($('#' + id)); });

  /* ---------- Bewertungen: hochzählen, Sterne füllen, Karten wechseln ---------- */
  var revDone = false;
  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting || revDone) return; revDone = true;
      $$('.count', e.target).forEach(function (el) {
        var to = +el.getAttribute('data-to'), d = +el.getAttribute('data-dec'), t0 = performance.now(), dur = RM ? 0 : 1600;
        (function st(t) { var k = dur ? clamp((t - t0) / dur, 0, 1) : 1; el.textContent = de(to * ease(k), d); if (k < 1) requestAnimationFrame(st); })(t0);
      });
      var stars = $('.stars', e.target); setTimeout(function () { stars.style.transition = 'none'; var t0 = performance.now(); (function st(t) { var k = clamp((t - t0) / 1600, 0, 1); stars.style.setProperty('--v', (.98 * ease(k)).toFixed(3)); if (k < 1) requestAnimationFrame(st); })(t0); }, 100);
    });
  }, { threshold: .3 }).observe($('#bewertungen'));
  var qs = $$('#quotes figure'), qi = 0;
  // nacheinander: erst ausblenden, dann die nächste Karte einblenden (nie Text über Text)
  setInterval(function () { qs[qi].classList.remove('on'); qi = (qi + 1) % qs.length; var n = qs[qi]; setTimeout(function () { n.classList.add('on'); }, 800); }, 5600);

  /* ---------- Freie Termine (Beispiel) ---------- */
  (function () {
    var cal = $('#cal'), d = new Date(); d.setHours(0, 0, 0, 0);
    ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(function (w) { var s = document.createElement('span'); s.className = 'dh'; s.textContent = w; cal.appendChild(s); });
    var start = new Date(d); start.setDate(d.getDate() + 7 - ((d.getDay() + 6) % 7)); // nächster Montag
    for (var i = 0; i < 21; i++) {
      var x = new Date(start); x.setDate(start.getDate() + i);
      var b = document.createElement('button'); b.type = 'button'; b.textContent = x.getDate() + '.';
      var wd = (x.getDay() + 6) % 7, free = wd < 6 && ((i * 7 + 3) % 5 !== 0);
      b.setAttribute('aria-label', x.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) + (free ? ', frei' : ', belegt'));
      if (free) { b.className = 'free'; b.addEventListener('click', function () { $$('#cal .sel').forEach(function (s) { s.classList.remove('sel'); }); this.classList.add('sel'); }); } else b.disabled = true;
      cal.appendChild(b);
    }
    var n = document.createElement('p'); n.className = 'cal-note'; n.textContent = 'Beispiel-Kalender · freie Tage sind hervorgehoben'; cal.appendChild(n);
  })();

  /* ---------- Modals mit Schritt-Formular ---------- */
  $$('[data-open]').forEach(function (b) {
    b.addEventListener('click', function (ev) {
      ev.preventDefault();
      var m = $('#' + b.getAttribute('data-open'));
      $$('.step', m).forEach(function (s, i) { s.classList.toggle('on', i === 0); });
      if (m.showModal) m.showModal(); else m.setAttribute('open', '');
    });
  });
  $$('[data-flow]').forEach(function (f) {
    $$('[data-next]', f).forEach(function (b) {
      b.addEventListener('click', function () {
        var cur = b.closest('.step'), nx = cur.nextElementSibling;
        if (nx && nx.classList.contains('step')) { cur.classList.remove('on'); nx.classList.add('on'); var i = $('input', nx); if (i && !mobile()) i.focus(); }
      });
    });
  });
  $$('.modal').forEach(function (m) { m.addEventListener('click', function (e) { if (e.target === m) m.close(); }); });
})();
