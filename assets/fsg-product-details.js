/* FSG product details: turns free-typed product descriptions into a tidy layout.
   - "Shipping cost / Price includes VAT / Lead time / Non-refundable" lines → "Good to know" chips
   - Bold label + value paragraphs (MATERIAL / 100% Polyamide) → Specifications card
   - ● / • / - lines and <ul> lists → tick lists; "Step 1: …" lines → numbered steps
   - Links to PDFs (brochures, guides) → download buttons; decorative brochure images dropped
   Exposes window.FsgDetails.enhance(el) → { leadMin, leadMax } (working days) or null.
   If anything goes wrong the original description is left untouched. */
(() => {
  const INVISIBLE = /[​-‍⁠﻿]/g;
  const clean = (t) => (t || '').replace(INVISIBLE, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  const BULLET = /^[●•▪‣◦\-–—*]\s*/;
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const ICONS = {
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
    file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  };
  const icon = (name, size = 16) =>
    `<svg class="fsg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  // Keep only text and links; rewrite links to old preview domains to this store.
  function safeHTML(nodes) {
    const div = document.createElement('div');
    const walk = (node, parent) => {
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) parent.append(n.textContent.replace(INVISIBLE, ''));
        else if (n.nodeName === 'BR') parent.append(document.createElement('br'));
        else if (n.nodeName === 'A' && n.getAttribute('href')) {
          const a = document.createElement('a');
          let href = n.getAttribute('href');
          try {
            const url = new URL(href, location.origin);
            if (/shopifypreview\.com|myshopify\.com/.test(url.hostname)) href = url.pathname + url.search;
          } catch (e) {}
          a.href = href;
          walk(n, a);
          if (clean(a.textContent)) parent.append(a);
        } else if (n.nodeType === 1 && n.nodeName !== 'IMG') walk(n, parent);
      });
    };
    nodes.forEach((n) => (n.nodeType === 3 ? div.append(n.textContent) : walk({ childNodes: [n] }, div)));
    // Drop trailing line breaks (also just inside a closing link).
    return div.innerHTML
      .replace(/\s+/g, ' ')
      .replace(/(\s*<br>\s*)+(<\/a>)?\s*$/, '$2')
      .trim();
  }

  // Split a block into lines at <br>, remembering whether each line is entirely bold.
  function lines(block) {
    const out = [];
    let cur = [];
    const flush = () => {
      if (!cur.length) return;
      const text = clean(cur.map((n) => n.textContent).join(''));
      if (text) {
        const boldText = clean(
          cur
            .map((n) => {
              if (n.nodeType !== 1) return '';
              if (/^(B|STRONG|H\d)$/.test(n.nodeName)) return n.textContent;
              return [...n.querySelectorAll('b, strong')].map((b) => b.textContent).join('');
            })
            .join('')
        );
        out.push({ text, html: safeHTML(cur), bold: boldText.length > 0 && boldText.length >= text.length - 1 });
      }
      cur = [];
    };
    const visit = (node, inheritBold) => {
      node.childNodes.forEach((n) => {
        if (n.nodeName === 'BR') return flush();
        // Inline wrappers that contain <br> (e.g. <b>LOCATION<br></b>) are split too.
        if (n.nodeType === 1 && n.querySelector && n.querySelector('br') && !/^A$/.test(n.nodeName)) {
          const bold = inheritBold || /^(B|STRONG)$/.test(n.nodeName);
          if (bold) {
            const wrap = document.createElement('b');
            n.childNodes.forEach((c) => {
              if (c.nodeName === 'BR') {
                if (wrap.childNodes.length) cur.push(wrap.cloneNode(true));
                wrap.innerHTML = '';
                flush();
              } else wrap.append(c.cloneNode(true));
            });
            if (wrap.childNodes.length) cur.push(wrap);
            return;
          }
          return visit(n, inheritBold);
        }
        cur.push(n.cloneNode(true));
      });
    };
    visit(block, false);
    flush();
    return out;
  }

  const FACTS = [
    { re: /shipping cost|delivery cost/i, icon: 'truck', tone: 'blue' },
    { re: /price includes .*vat/i, icon: 'check', tone: 'green' },
    { re: /lead\s*time/i, icon: 'clock', tone: 'amber' },
    { re: /non[-\s]?refundable/i, icon: 'alert', tone: 'red' },
  ];

  function parseLead(text) {
    const t = text.replace(/[–—]/g, '-');
    let m = t.match(/lead[^.]*?(\d+)\s*(?:-|to)\s*(\d+)\s*(working\s*days|days|weeks?)/i);
    if (m) {
      const mult = /week/i.test(m[3]) ? 5 : 1;
      return { min: +m[1] * mult, max: +m[2] * mult };
    }
    m = t.match(/lead[^.]*?(\d+)\s*(working\s*days|days|weeks?)/i);
    if (m) {
      const n = +m[1] * (/week/i.test(m[2]) ? 5 : 1);
      return { min: n, max: n };
    }
    return null;
  }

  function enhance(el) {
    const src = el.cloneNode(true);
    const facts = [];
    const blocks = []; // {type: 'heading'|'para'|'list'|'steps'|'image', ...}
    const specs = [];
    const downloads = [];
    let lead = null;
    let pendingLabel = null;
    // The spec added most recently, while no other content has come after it.
    let lastSpec = null;
    let lastSpecAt = -1;
    const addSpec = (spec) => {
      specs.push(spec);
      lastSpec = spec;
      lastSpecAt = blocks.length;
    };

    const pushPara = (html, text) => blocks.push({ type: 'para', html, text });

    // Pull PDF links out first so they become download buttons.
    src.querySelectorAll('a[href$=".pdf" i], a[href*=".pdf?" i]').forEach((a) => {
      const img = a.querySelector('img');
      let label = clean(a.getAttribute('title') || a.textContent);
      if (!label && img) {
        const name = (img.getAttribute('src') || '').split('/').pop().split(/[_.?]/)[0];
        label = name.replace(/[-_]+/g, ' ');
      }
      if (/^brochure$/i.test(label) || /brochure/i.test(label)) label = 'Product brochure';
      downloads.push({ href: a.href, label: label || 'Product information' });
      a.remove();
    });
    // Decorative "brochure" graphics that don't link anywhere.
    src.querySelectorAll('img').forEach((img) => {
      if (/brochure|application_guide/i.test(img.getAttribute('src') || '')) img.remove();
    });

    [...src.children].forEach((node) => {
      const tag = node.nodeName;
      const imgs = [...node.querySelectorAll('img')];

      if (tag === 'UL' || tag === 'OL') {
        const items = [...node.querySelectorAll('li')].map((li) => ({ html: safeHTML([li]), text: clean(li.textContent) })).filter((i) => i.text);
        if (!items.length) return;
        let title = null;
        const prev = blocks[blocks.length - 1];
        if (pendingLabel) {
          addSpec({ label: pendingLabel, items });
          pendingLabel = null;
          return;
        }
        if (prev && (prev.type === 'para' || prev.type === 'heading') && prev.text.length < 40 && !/[.!]$/.test(prev.text)) {
          title = prev.text.replace(/:$/, '');
          blocks.pop();
        }
        blocks.push({ type: 'list', title, items });
        return;
      }

      if (/^H\d$/.test(tag)) {
        const ls = lines(node).filter((l) => !FACTS.some((f) => f.re.test(l.text)));
        if (ls.length) blocks.push({ type: 'heading', text: ls.map((l) => l.text).join(' · ') });
        return;
      }

      const ls = lines(node);
      imgs.forEach((img) => blocks.push({ type: 'image', src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' }));
      if (!ls.length) return;

      // Facts and lead time
      const rest = [];
      ls.forEach((l) => {
        const fact = l.text.length < 60 && FACTS.find((f) => f.re.test(l.text));
        if (fact) {
          if (!facts.some((f) => f.text === l.text)) facts.push({ ...fact, text: l.text.replace(/\s+-\s+/, ': ') });
          lead = lead || parseLead(l.text);
        } else {
          lead = lead || (/lead/i.test(l.text) ? parseLead(l.text) : null);
          rest.push(l);
        }
      });
      if (!rest.length) return;

      // Several bold lines → a heading
      if (rest.length > 1 && rest.every((l) => l.bold)) {
        blocks.push({ type: 'heading', text: rest.map((l) => l.text).join(' · ') });
        return;
      }
      // A paragraph that is only a link, right after a spec (e.g. more accessories) → add to that spec
      if (lastSpec && lastSpecAt === blocks.length && rest.length === 1 && node.querySelector('a') && clean(node.querySelector('a').textContent) === rest[0].text) {
        lastSpec.items.push({ html: rest[0].html, text: rest[0].text });
        return;
      }
      // Label on its own line, value(s) underneath → specification
      if (rest[0].bold && rest.length > 1 && rest[0].text.length < 40) {
        const label = rest[0].text.replace(/:$/, '');
        const values = rest.slice(1).map((l) => ({ html: l.html.replace(BULLET, ''), text: l.text.replace(BULLET, '') }));
        addSpec({ label, items: values });
        pendingLabel = null;
        return;
      }
      // A lone bold label: its value is in the next block
      if (rest.length === 1 && rest[0].bold && rest[0].text.length < 40 && rest[0].text === rest[0].text.toUpperCase()) {
        pendingLabel = rest[0].text.replace(/:$/, '');
        return;
      }
      // Several bold lines → a heading
      if (rest.every((l) => l.bold)) {
        blocks.push({ type: 'heading', text: rest.map((l) => l.text).join(' · ') });
        return;
      }

      const bullets = rest.filter((l) => BULLET.test(l.text));
      const steps = rest.filter((l) => /^step\s*\d+/i.test(l.text));
      if (pendingLabel) {
        addSpec({ label: pendingLabel, items: rest.map((l) => ({ html: l.html.replace(BULLET, ''), text: l.text.replace(BULLET, '') })) });
        pendingLabel = null;
        return;
      }
      if (steps.length >= 2) {
        rest.filter((l) => !steps.includes(l)).forEach((l) => pushPara(l.html, l.text));
        blocks.push({
          type: 'steps',
          items: steps.map((l) => l.html.replace(/^\s*step\s*\d+\s*[.:]*\s*:?\s*/i, '')),
        });
        return;
      }
      if (bullets.length >= 2) {
        rest.filter((l) => !bullets.includes(l)).forEach((l) => pushPara(l.html, l.text));
        blocks.push({ type: 'list', title: null, items: bullets.map((l) => ({ html: l.html.replace(BULLET, ''), text: l.text })) });
        return;
      }
      pushPara(rest.map((l) => l.html).join('<br>'), rest.map((l) => l.text).join(' '));
    });

    // Nothing recognisable → leave the original as it is.
    if (!blocks.length && !specs.length) return lead ? { leadMin: lead.min, leadMax: lead.max } : null;

    const html = [];
    if (facts.length) {
      html.push('<ul class="fsg-desc__facts" role="list">');
      facts.forEach((f) => html.push(`<li class="is-${f.tone}">${icon(f.icon)}<span>${esc(f.text)}</span></li>`));
      html.push('</ul>');
    }
    const side = specs.length || downloads.length;
    html.push(`<div class="fsg-desc__grid${side ? '' : ' fsg-desc__grid--single'}"><div class="fsg-desc__main">`);
    blocks.forEach((b) => {
      if (b.type === 'heading') html.push(`<h3 class="fsg-desc__heading">${esc(b.text)}</h3>`);
      else if (b.type === 'para') html.push(`<p>${b.html}</p>`);
      else if (b.type === 'image') html.push(`<img class="fsg-desc__img" src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy">`);
      else if (b.type === 'list') {
        html.push('<div class="fsg-desc__list">');
        if (b.title) html.push(`<strong>${esc(b.title)}</strong>`);
        html.push(`<ul role="list"${b.items.length > 5 ? ' class="is-cols"' : ''}>`);
        b.items.forEach((i) => html.push(`<li>${icon('check', 14)}<span>${i.html}</span></li>`));
        html.push('</ul></div>');
      } else if (b.type === 'steps') {
        html.push('<ol class="fsg-desc__steps" role="list">');
        b.items.forEach((i, n) => html.push(`<li><span class="fsg-desc__step-num">${n + 1}</span><span>${i}</span></li>`));
        html.push('</ol>');
      }
    });
    html.push('</div>');
    if (side) {
      html.push('<aside class="fsg-desc__side">');
      if (specs.length) {
        html.push('<div class="fsg-desc__specs"><h3>Specifications</h3><dl>');
        specs.forEach((s) => {
          const value =
            s.items.length > 1
              ? `<ul role="list">${s.items.map((i) => `<li>${i.html}</li>`).join('')}</ul>`
              : s.items.map((i) => i.html).join('');
          const label = s.label.charAt(0) + s.label.slice(1).toLowerCase();
          html.push(`<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`);
        });
        html.push('</dl></div>');
      }
      if (downloads.length) {
        html.push('<div class="fsg-desc__downloads">');
        downloads.forEach((d) =>
          html.push(`<a href="${esc(d.href)}" target="_blank" rel="noopener">${icon('file', 18)}<span>${esc(d.label)}<small>PDF download</small></span></a>`)
        );
        html.push('</div>');
      }
      html.push('</aside>');
    }
    html.push('</div>');

    el.classList.remove('fsg-rte');
    el.classList.add('fsg-desc');
    el.innerHTML = html.join('');
    return lead ? { leadMin: lead.min, leadMax: lead.max } : null;
  }

  window.FsgDetails = {
    enhance(el) {
      try {
        return enhance(el);
      } catch (e) {
        return null;
      }
    },
  };
})();
