/* FSG product page: option steps → variant, gallery, delivery estimate, quantity, sticky add bar.
   Add to cart itself is handled by Dawn's <product-form> so the cart drawer keeps working. */
(() => {
  const DAY_MS = 86400000;

  // Adds n working days (Mon–Fri) to a date.
  function addWorkingDays(date, n) {
    const d = new Date(date);
    let added = 0;
    while (added < n) {
      d.setTime(d.getTime() + DAY_MS);
      const day = d.getDay();
      if (day !== 0 && day !== 6) added++;
    }
    return d;
  }

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // e.g. "Mon 26" or "Tue 27 Oct"
  const fmt = (d, withMonth) => `${DAYS[d.getDay()]} ${d.getDate()}${withMonth ? ` ${MONTHS[d.getMonth()]}` : ''}`;

  function initDelivery(box) {
    const min = parseInt(box.dataset.min, 10);
    const max = parseInt(box.dataset.max, 10);
    const cutoff = parseInt(box.dataset.cutoff, 10);
    const range = box.querySelector('[data-fsg-delivery-range]');
    const cutoffLine = box.querySelector('[data-fsg-delivery-cutoff]');
    const countdown = box.querySelector('[data-fsg-countdown]');

    const render = () => {
      const now = new Date();
      const day = now.getDay();
      const workingDay = day !== 0 && day !== 6;
      const beforeCutoff = workingDay && now.getHours() < cutoff;
      // After the cut-off (or at the weekend) the order dispatches on the next working day.
      const start = beforeCutoff ? now : addWorkingDays(now, 1);
      const from = addWorkingDays(start, min);
      const to = addWorkingDays(start, max);
      const sameMonth = from.getMonth() === to.getMonth();
      if (range) {
        range.textContent =
          min === max ? fmt(to, true) : `${fmt(from, !sameMonth)} – ${fmt(to, true)}`;
      }
      if (cutoffLine && countdown) {
        // The same-day dispatch countdown only makes sense for stock items.
        if (beforeCutoff && min <= 5) {
          const end = new Date(now);
          end.setHours(cutoff, 0, 0, 0);
          const mins = Math.max(0, Math.round((end - now) / 60000));
          const h = Math.floor(mins / 60);
          countdown.textContent = h ? `${h}h ${mins % 60}m` : `${mins}m`;
          cutoffLine.hidden = false;
        } else {
          cutoffLine.hidden = true;
        }
      }
    };
    render();
    setInterval(render, 60000);
  }

  function initGallery(root) {
    const gallery = root.querySelector('[data-fsg-gallery]');
    if (!gallery) return () => {};
    const slides = [...gallery.querySelectorAll('.fsg-gallery__slide')];
    const thumbs = [...gallery.querySelectorAll('.fsg-gallery__thumb')];
    let index = Math.max(0, slides.findIndex((s) => s.classList.contains('is-active')));

    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle('is-active', n === index));
      thumbs.forEach((t, n) => t.classList.toggle('is-active', n === index));
      thumbs[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };
    thumbs.forEach((t, n) => t.addEventListener('click', () => show(n)));
    gallery.querySelector('[data-fsg-gallery-prev]')?.addEventListener('click', () => show(index - 1));
    gallery.querySelector('[data-fsg-gallery-next]')?.addEventListener('click', () => show(index + 1));

    // Swipe on touch screens
    let x0 = null;
    const main = gallery.querySelector('.fsg-gallery__main');
    main.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
    main.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    return (mediaId) => {
      const i = slides.findIndex((s) => s.dataset.mediaId === String(mediaId));
      if (i >= 0) show(i);
    };
  }

  function initProduct(root) {
    if (root.dataset.fsgReady) return;
    root.dataset.fsgReady = 'true';

    const data = JSON.parse(root.querySelector('[data-fsg-product-json]').textContent);
    const showMedia = initGallery(root);
    const delivery = root.querySelector('[data-fsg-delivery]');
    // Tidy the description; if it states a lead time, use it for the delivery estimate.
    const details = root.querySelector('[data-fsg-details]');
    const lead = details && window.FsgDetails ? window.FsgDetails.enhance(details) : null;
    if (delivery && lead) {
      delivery.dataset.min = lead.leadMin;
      delivery.dataset.max = lead.leadMax;
    }
    if (delivery) initDelivery(delivery);

    const form = root.querySelector('form[data-type="add-to-cart-form"]');
    const idInput = form.querySelector('input[name="id"]');
    const addBtn = root.querySelector('[data-fsg-add]');
    const addLabel = root.querySelector('[data-fsg-add-label]');
    const addLabelHTML = addLabel.innerHTML;
    const fieldsets = [...root.querySelectorAll('[data-fsg-option]')];

    const selected = () =>
      fieldsets.map((fs) => fs.querySelector('input:checked')?.value ?? null);

    const findVariant = (opts) => data.variants.find((v) => v.options.every((o, i) => o === opts[i]));

    // Grey out values that don't exist with the choices made in earlier steps.
    const updateAvailability = (opts) => {
      fieldsets.forEach((fs, i) => {
        fs.querySelectorAll('input').forEach((input) => {
          const test = opts.slice();
          test[i] = input.value;
          const match = data.variants.filter((v) => v.options.every((o, j) => j > i || o === test[j]));
          const exists = match.length > 0;
          const inStock = match.some((v) => v.available);
          const label = input.nextElementSibling;
          label.classList.toggle('is-unavailable', !exists);
          label.classList.toggle('is-soldout', exists && !inStock);
        });
      });
    };

    const update = (changed) => {
      const opts = selected();
      fieldsets.forEach((fs, i) => {
        const out = fs.querySelector('[data-fsg-option-value]');
        if (out) out.textContent = opts[i] ?? '';
      });
      updateAvailability(opts);

      let variant = findVariant(opts);
      // If this combination doesn't exist, keep the latest choice and pick the first variant that has it.
      if (!variant && changed !== null) {
        variant =
          data.variants.find((v) => v.options[changed] === opts[changed] && v.available) ||
          data.variants.find((v) => v.options[changed] === opts[changed]);
        if (variant) {
          fieldsets.forEach((fs, i) => {
            const input = [...fs.querySelectorAll('input')].find((inp) => inp.value === variant.options[i]);
            if (input) input.checked = true;
          });
          return update(null);
        }
      }

      if (!variant) {
        addBtn.disabled = true;
        addLabel.textContent = data.unavailable;
        return;
      }

      idInput.value = variant.id;
      idInput.dispatchEvent(new Event('change', { bubbles: true }));
      root.querySelectorAll('[data-fsg-price]').forEach((el) => (el.textContent = variant.price));
      const exVat = root.querySelector('[data-fsg-exvat]');
      if (exVat) exVat.textContent = variant.exVat;
      const compare = root.querySelector('[data-fsg-compare]');
      if (compare) {
        compare.hidden = !variant.compare;
        compare.textContent = variant.compare || '';
      }
      const sku = root.querySelector('[data-fsg-sku]');
      if (sku) {
        sku.textContent = variant.sku || '';
        sku.parentElement.hidden = !variant.sku;
      }
      addBtn.disabled = !variant.available;
      if (variant.available) addLabel.innerHTML = addLabelHTML;
      else addLabel.textContent = data.soldOut;
      const stock = root.querySelector('[data-fsg-stock]');
      if (stock) {
        stock.innerHTML = variant.available
          ? '<i class="is-in" aria-hidden="true"></i> In stock, ready to ship'
          : '<i aria-hidden="true"></i> Currently out of stock';
      }
      if (variant.mediaId) showMedia(variant.mediaId);

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);
    };

    fieldsets.forEach((fs, i) => fs.addEventListener('change', () => update(i)));
    // Respect ?variant= on load
    const fromUrl = new URL(window.location.href).searchParams.get('variant');
    const startVariant = data.variants.find((v) => String(v.id) === fromUrl);
    if (startVariant) {
      fieldsets.forEach((fs, i) => {
        const input = [...fs.querySelectorAll('input')].find((inp) => inp.value === startVariant.options[i]);
        if (input) input.checked = true;
      });
    }
    if (fieldsets.length) update(null);

    // Quantity stepper
    const qty = root.querySelector('.fsg-qty__input');
    root.querySelectorAll('[data-fsg-qty]').forEach((btn) =>
      btn.addEventListener('click', () => {
        qty.value = Math.max(1, (parseInt(qty.value, 10) || 1) + parseInt(btn.dataset.fsgQty, 10));
      })
    );

    // Sticky bar: appears once the main Add button leaves the screen.
    const bar = root.querySelector('[data-fsg-sticky-buy]');
    if (bar && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        bar.classList.toggle('is-visible', show);
        bar.setAttribute('aria-hidden', String(!show));
        bar.querySelector('button').tabIndex = show ? 0 : -1;
      }).observe(addBtn);
      bar.querySelector('[data-fsg-sticky-add]').addEventListener('click', () => {
        if (addBtn.disabled) {
          addBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        form.requestSubmit(addBtn);
      });
    }
  }

  const init = (scope = document) => scope.querySelectorAll('[data-fsg-product]').forEach(initProduct);
  document.addEventListener('DOMContentLoaded', () => init());
  document.addEventListener('shopify:section:load', (e) => init(e.target));
})();
