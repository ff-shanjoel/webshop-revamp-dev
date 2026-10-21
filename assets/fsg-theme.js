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

  function init(scope = document) {
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
