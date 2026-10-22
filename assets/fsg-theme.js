/* FSG theme behaviour: sticky offset, mega menu (touch + keyboard), mobile drawer, scroll reveal. */
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- Sticky header: keep only the category bar (desktop) or main row (mobile) ---------- */
  function setStickOffset() {
    const header = document.querySelector('[data-fsg-header]');
    if (!header) return;
    const cats = header.querySelector('.fsg-cats');
    const head = header.querySelector('.fsg-head');
    const keep = cats && cats.offsetParent !== null ? cats : head;
    const offset = keep ? keep.offsetTop : 0;
    root.style.setProperty('--fsg-stick-offset', `${offset}px`);
    root.style.setProperty('--fsg-sticky-h', `${header.offsetHeight - offset}px`);
  }

  /* ---------- Mega menu ---------- */
  function initMega(scope) {
    const bar = scope.querySelector('.fsg-cats');
    if (!bar || bar.dataset.fsgReady) return;
    bar.dataset.fsgReady = 'true';
    const items = [...bar.querySelectorAll('.fsg-cats__item.has-mega')];

    const closeAll = (except) => {
      items.forEach((item) => {
        if (item === except) return;
        item.classList.remove('is-open');
        item.querySelector('.fsg-cats__link')?.setAttribute('aria-expanded', 'false');
      });
    };

    items.forEach((item) => {
      const link = item.querySelector('.fsg-cats__link');
      // First tap on touch devices opens the panel; second tap follows the link.
      link.addEventListener('click', (event) => {
        if (hoverCapable.matches) return;
        if (!item.classList.contains('is-open')) {
          event.preventDefault();
          closeAll(item);
          item.classList.add('is-open');
          link.setAttribute('aria-expanded', 'true');
        }
      });
      item.addEventListener('mouseenter', () => link.setAttribute('aria-expanded', 'true'));
      item.addEventListener('mouseleave', () => {
        item.classList.remove('is-open');
        link.setAttribute('aria-expanded', 'false');
      });
      item.addEventListener('focusin', () => link.setAttribute('aria-expanded', 'true'));
      item.addEventListener('focusout', (event) => {
        if (!item.contains(event.relatedTarget)) link.setAttribute('aria-expanded', 'false');
      });
    });

    bar.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const open = event.target.closest('.fsg-cats__item');
      closeAll();
      bar.classList.add('is-closing');
      open?.querySelector('.fsg-cats__link')?.focus();
    });
    bar.addEventListener('mouseleave', () => bar.classList.remove('is-closing'));
    bar.addEventListener('focusin', (event) => {
      if (event.target.closest('.fsg-mega')) bar.classList.remove('is-closing');
    });
    bar.addEventListener('keydown', (event) => {
      if (event.key === 'Tab' || event.key === 'Enter') bar.classList.remove('is-closing');
    });

    document.addEventListener('click', (event) => {
      if (!bar.contains(event.target)) closeAll();
    });

    // 3-level menus: hovering or focusing a subcategory shows its panel.
    bar.querySelectorAll('[data-fsg-split]').forEach((split) => {
      const links = split.querySelectorAll('[data-fsg-pane]');
      const panels = split.querySelectorAll('[data-fsg-panel]');
      const show = (index) => {
        links.forEach((l) => l.classList.toggle('is-active', l.dataset.fsgPane === index));
        panels.forEach((p) => p.classList.toggle('is-active', p.dataset.fsgPanel === index));
      };
      links.forEach((link) => {
        link.addEventListener('mouseenter', () => show(link.dataset.fsgPane));
        link.addEventListener('focus', () => show(link.dataset.fsgPane));
      });
    });
  }

  /* ---------- Mobile drawer ---------- */
  function initDrawer(scope) {
    const drawer = scope.querySelector('.fsg-drawer');
    const opener = scope.querySelector('[data-fsg-drawer-open]');
    if (!drawer || !opener || drawer.dataset.fsgReady) return;
    drawer.dataset.fsgReady = 'true';
    let lastFocus = null;

    const open = () => {
      lastFocus = document.activeElement;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      opener.setAttribute('aria-expanded', 'true');
      root.classList.add('fsg-lock');
      setTimeout(() => drawer.querySelector('.fsg-drawer__close')?.focus(), 50);
    };
    const close = () => {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      opener.setAttribute('aria-expanded', 'false');
      root.classList.remove('fsg-lock');
      lastFocus?.focus();
    };

    opener.addEventListener('click', open);
    drawer.querySelectorAll('[data-fsg-drawer-close]').forEach((el) => el.addEventListener('click', close));
    drawer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab') return;
      const focusable = [...drawer.querySelectorAll('a, button, summary, input')].filter((el) => el.offsetParent);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    window.matchMedia('(min-width: 990px)').addEventListener('change', (mq) => {
      if (mq.matches && drawer.classList.contains('is-open')) close();
    });
  }

  /* ---------- Scroll reveal ---------- */
  let observer = null;
  function initReveal(scope) {
    const els = scope.querySelectorAll('.fsg-rv:not(.is-in)');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window) || window.Shopify?.designMode) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    observer =
      observer ||
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
      );
    els.forEach((el) => observer.observe(el));
  }

  /* ---------- FAQ: one panel open at a time ---------- */
  function initFaq(scope) {
    scope.querySelectorAll('[data-fsg-faq]').forEach((list) => {
      if (list.dataset.fsgReady) return;
      list.dataset.fsgReady = 'true';
      list.addEventListener(
        'toggle',
        (event) => {
          if (!event.target.open) return;
          list.querySelectorAll('details[open]').forEach((d) => d !== event.target && (d.open = false));
        },
        true
      );
    });
  }

  /* ---------- Policy pages (rendered by Shopify, so tidied here) ---------- */
  function initPolicy() {
    const box = document.querySelector('.shopify-policy__container');
    if (!box || box.dataset.fsgReady) return;
    box.dataset.fsgReady = 'true';
    box.classList.add('fsg', 'fsg-policy');
    const body = box.querySelector('.shopify-policy__body .rte') || box.querySelector('.shopify-policy__body');

    // Policies pasted from a PDF arrive as one block with a <br> at the end of every line.
    // Rejoin wrapped lines into paragraphs and turn short stand-alone lines into headings.
    if (body && !body.querySelector('p, h1, h2, h3, ul, ol') && body.querySelectorAll('br').length > 5) {
      const lines = body.innerHTML
        .split(/<br\s*\/?>/i)
        .map((l) => l.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim());
      const text = (html) => html.replace(/<[^>]+>/g, '').trim();
      const ends = (l) => /[.!?:;]$/.test(text(l));
      const out = [];
      let para = [];
      let list = [];
      const flushPara = () => para.length && out.push(`<p>${para.join(' ')}</p>`) && (para = []);
      const flushList = () => list.length && out.push(`<ul>${list.map((i) => `<li>${i}</li>`).join('')}</ul>`) && (list = []);
      lines.forEach((line, i) => {
        if (!text(line)) {
          flushPara();
          flushList();
          return;
        }
        const next = lines.slice(i + 1).find((l) => text(l)) || '';
        const prevEnded = !para.length;
        const t = text(line);
        // ALL-CAPS lines (e.g. "1. WHO WE ARE") are always headings.
        const caps = t.length <= 80 && /[A-Z]{3}/.test(t) && t === t.toUpperCase();
        const bullet = !caps && /^([•●▪\-–]|\d+[.)])\s+/.test(t);
        const heading =
          caps || (prevEnded && t.length <= 60 && !ends(line) && /^[A-Z0-9]/.test(t) && (!next || /^[A-Z0-9“"(]/.test(text(next))));
        if (bullet) {
          flushPara();
          list.push(line.replace(/^\s*([•●▪\-–]|\d+[.)])\s+/, ''));
        } else if (heading) {
          flushPara();
          flushList();
          out.push(`<h2>${line}</h2>`);
        } else {
          flushList();
          para.push(line);
          if (ends(line)) flushPara();
        }
      });
      flushPara();
      flushList();
      body.innerHTML = out.join('');
    }
    if (body) body.classList.add('fsg-prose');

    // Side menu with every policy (links come from the footer's policy list).
    const links = [...document.querySelectorAll('.fsg-footer__legal a[href*="/policies/"]')];
    if (links.length > 1) {
      const nav = document.createElement('nav');
      nav.className = 'fsg-policy__nav';
      nav.setAttribute('aria-label', 'Policies');
      nav.innerHTML =
        '<strong>Policies</strong>' +
        links
          .map((a) => {
            const current = new URL(a.href).pathname === location.pathname;
            return `<a href="${a.getAttribute('href')}"${current ? ' aria-current="page"' : ''}>${a.textContent.trim()}</a>`;
          })
          .join('');
      box.prepend(nav);
    }
  }

  function init(scope = document) {
    initPolicy();
    initMega(scope);
    initDrawer(scope);
    initReveal(scope);
    initFaq(scope);
    setStickOffset();
  }

  document.addEventListener('DOMContentLoaded', () => init());
  window.addEventListener('load', setStickOffset);
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setStickOffset, 120);
  });

  // Theme editor: re-run when sections are added or re-rendered.
  document.addEventListener('shopify:section:load', (event) => init(event.target));
  document.addEventListener('shopify:block:select', (event) => {
    event.target.classList?.add('is-in');
    const item = event.target.closest?.('.fsg-cats__item');
    if (item) item.classList.add('is-open');
  });
  document.addEventListener('shopify:block:deselect', (event) => {
    event.target.closest?.('.fsg-cats__item')?.classList.remove('is-open');
  });
})();
