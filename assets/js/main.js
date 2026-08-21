/* Lumière Studio — site behaviour */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ---------- sticky header ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-stuck', window.scrollY > 24);
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
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    rvs.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 70 + 'ms';
      io.observe(el);
    });
  }

  /* ---------- hero slideshow ---------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero__slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero__dot'));
  if (slides.length > 1) {
    var idx = 0, timer = null;
    function go(n) {
      slides[idx].classList.remove('is-active');
      if (dots[idx]) dots[idx].classList.remove('is-active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('is-active');
      if (dots[idx]) dots[idx].classList.add('is-active');
      var im = slides[idx].querySelector('img');
      if (im && !reduce) { im.style.animation = 'none'; void im.offsetWidth; im.style.animation = ''; }
    }
    function play() { if (!reduce) timer = setInterval(function () { go(idx + 1); }, 6200); }
    function stop() { clearInterval(timer); }
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { stop(); go(i); play(); });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else { stop(); play(); }
    });
    play();
  }

  /* ---------- gallery filters ---------- */
  var filterBar = document.querySelector('[data-filters]');
  if (filterBar) {
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      filterBar.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var f = btn.getAttribute('data-filter');
      document.querySelectorAll('[data-cat]').forEach(function (it) {
        var show = f === 'all' || it.getAttribute('data-cat') === f;
        it.style.display = show ? '' : 'none';
      });
      rebuildLightboxList();
    });
  }

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
        var t0 = null, dur = 1400;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
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
