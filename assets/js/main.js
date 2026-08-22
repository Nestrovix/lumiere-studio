/* Lumière Studio — site behaviour */
(function () {
  'use strict';
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = reduceQuery.matches;

  /* ---------- image fade-in (works for lazy + cached) ---------- */
  function markLoaded(img) { img.classList.add('is-loaded'); }
  function initImages(scope) {
    (scope || document).querySelectorAll('.media > img').forEach(function (img) {
      if (img.complete && img.naturalWidth) markLoaded(img);
      else img.addEventListener('load', function () { markLoaded(img); }, { once: true });
      img.addEventListener('error', function () { markLoaded(img); }, { once: true });
    });
  }
  initImages();
  window.addEventListener('load', function () { initImages(); });

  /* ---------- sticky header hairline ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-stuck', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile nav ---------- */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('.mobile-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- scroll reveal ---------- */
  var rvs = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window) || reduce) {
    rvs.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    rvs.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 5, 4) * 55 + 'ms';
      io.observe(el);
    });
  }

  /* ---------- home hero: the projected frame ----------
     Six frames stacked in one stage. The incoming layer fades in ON TOP of the
     outgoing one and the outgoing one is only dropped once the fade has finished,
     so the stage is never blank between frames. A frame is never shown before its
     image has actually decoded. */
  var stage = document.querySelector('[data-proj-frames]');
  if (stage) {
    var frames = Array.prototype.slice.call(stage.querySelectorAll('.proj__frame'));
    var thumbs = Array.prototype.slice.call(document.querySelectorAll('[data-proj-go]'));
    var numEl = document.querySelector('[data-proj-num]');
    var slugEl = document.querySelector('[data-proj-slug]');
    var catEl = document.querySelector('[data-proj-cat]');
    var modeBtn = document.querySelector('[data-proj-mode]');
    var liveEl = document.querySelector('[data-proj-live]');
    var HOLD = 7000, FADE = 900;
    var cur = 0, timer = null, fadeT = null, auto = !reduce;

    function ready(i) {
      var img = frames[i] && frames[i].querySelector('img');
      return !!(img && img.complete && img.naturalWidth > 0);
    }
    function warm(i) {
      var img = frames[i] && frames[i].querySelector('img');
      if (!img) return;
      if (img.getAttribute('loading') === 'lazy') img.setAttribute('loading', 'eager');
      if (img.decode) img.decode().catch(function () {});
    }
    function slate(i) {
      var f = frames[i];
      if (numEl) numEl.textContent = f.getAttribute('data-num') || '';
      if (slugEl) slugEl.textContent = f.getAttribute('data-slug') || '';
      if (catEl) catEl.textContent = f.getAttribute('data-cat') || '';
      thumbs.forEach(function (b, j) {
        b.classList.toggle('is-on', j === i);
        if (j === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
    }
    function show(i, announce) {
      if (i === cur || !frames[i]) return;
      if (!ready(i)) { warm(i); return; }           /* never fade to a frame that has not loaded */
      var next = frames[i], prev = frames[cur];
      next.style.zIndex = '2';
      next.classList.add('is-on');
      cur = i;
      slate(i);
      clearTimeout(fadeT);
      fadeT = setTimeout(function () {
        if (prev !== next) { prev.classList.remove('is-on'); prev.style.zIndex = '0'; }
        next.style.zIndex = '1';
      }, reduce ? 20 : FADE + 60);
      warm((i + 1) % frames.length);
      if (announce && liveEl) {
        liveEl.textContent = 'Frame ' + next.getAttribute('data-num') + ', ' +
          next.getAttribute('data-slug') + ', ' + next.getAttribute('data-cat');
      }
    }
    function advance() {
      for (var k = 1; k <= frames.length; k++) {
        var j = (cur + k) % frames.length;
        if (ready(j)) { show(j); return; }
        warm(j);
      }
    }
    function setAuto(on) {
      auto = on && !reduce;
      clearInterval(timer);
      timer = null;
      if (auto) timer = setInterval(function () { if (!document.hidden) advance(); }, HOLD);
      if (modeBtn) {
        modeBtn.textContent = reduce ? 'Manual' : (auto ? 'Auto' : 'Paused');
        modeBtn.setAttribute('aria-pressed', auto ? 'false' : 'true');
      }
    }

    thumbs.forEach(function (b) {
      b.addEventListener('click', function () {
        setAuto(false);                              /* clicking a frame pauses the auto-advance */
        show(parseInt(b.getAttribute('data-proj-go'), 10), true);
      });
    });
    if (modeBtn) {
      if (reduce) { modeBtn.disabled = true; }
      else modeBtn.addEventListener('click', function () { setAuto(!auto); });
    }
    if (typeof reduceQuery.addEventListener === 'function') {
      reduceQuery.addEventListener('change', function (e) { reduce = e.matches; setAuto(!reduce); });
    }

    slate(0);
    setAuto(true);
    warm(1);
    window.addEventListener('load', function () { frames.forEach(function (f, i) { if (i) warm(i); }); });
  }

  /* ---------- filters (gallery + portfolio contact sheet) ---------- */
  var filterBar = document.querySelector('[data-filters]');
  function applyFilter(f) {
    if (!filterBar) return;
    filterBar.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-filter') === f);
    });
    document.querySelectorAll('[data-cat]').forEach(function (it) {
      var show = f === 'all' || it.getAttribute('data-cat') === f;
      it.style.display = show ? '' : 'none';
    });
    rebuildLightboxList();
  }
  if (filterBar) {
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      applyFilter(btn.getAttribute('data-filter'));
    });
  }

  /* ---------- series index rows drive the sheet filter ---------- */
  document.querySelectorAll('[data-series]').forEach(function (row) {
    row.addEventListener('click', function () {
      applyFilter(row.getAttribute('data-series'));
    });
  });

  /* ---------- lightbox ---------- */
  var lb = document.querySelector('.lb');
  var lbImg = lb && lb.querySelector('img');
  var lbCap = lb && lb.querySelector('.lb__cap');
  var items = [], cur = 0;

  function rebuildLightboxList() {
    items = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'))
      .filter(function (el) { return el.offsetParent !== null; });
  }
  function open(i) {
    if (!lb || !items.length) return;
    cur = (i + items.length) % items.length;
    var el = items[cur];
    lbImg.src = el.getAttribute('data-lightbox');
    lbImg.alt = el.getAttribute('data-alt') || '';
    lbCap.textContent = (el.getAttribute('data-caption') || '') + '  ·  ' + (cur + 1) + ' / ' + items.length;
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    if (!lb) return;
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  if (lb) {
    rebuildLightboxList();
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-lightbox]');
      if (t) { e.preventDefault(); rebuildLightboxList(); open(items.indexOf(t)); }
    });
    lb.querySelector('.lb__close').addEventListener('click', close);
    lb.querySelector('.lb__prev').addEventListener('click', function (e) { e.stopPropagation(); open(cur - 1); });
    lb.querySelector('.lb__next').addEventListener('click', function (e) { e.stopPropagation(); open(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbImg) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') open(cur - 1);
      if (e.key === 'ArrowRight') open(cur + 1);
    });
  }

  /* ---------- count-up stats ---------- */
  var nums = document.querySelectorAll('[data-count]');
  if (nums.length && 'IntersectionObserver' in window) {
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, to = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '';
        if (reduce) { el.textContent = to + suf; nio.unobserve(el); return; }
        var t0 = null, dur = 1200;
        function step2(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf;
          if (p < 1) requestAnimationFrame(step2);
        }
        requestAnimationFrame(step2);
        nio.unobserve(el);
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { nio.observe(n); });
  }

  /* ---------- contact form (front-end only) ---------- */
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var ok = form.querySelector('.form-ok');
      if (ok) { ok.classList.add('is-on'); ok.setAttribute('role', 'status'); }
      form.reset();
    });
  }

  /* ---------- footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
