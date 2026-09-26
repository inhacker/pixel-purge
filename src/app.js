// Neural Flow — client-side script.
// Renders the features grid and pricing table from the API, falling back to
// the static markup already in index.html if either request fails, and
// wires up the contact form to submit as JSON via fetch.

(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[ch];
    });
  }

  // ---------- Features ----------

  function renderFeatures(features) {
    const grid = document.getElementById('feature-grid');
    if (!grid || !Array.isArray(features) || features.length === 0) return;

    grid.innerHTML = features
      .map(function (f) {
        return (
          '<article class="feature-card">' +
          '<span class="feature-icon" aria-hidden="true">' + escapeHtml(f.icon || '✦') + '</span>' +
          '<h3>' + escapeHtml(f.title || '') + '</h3>' +
          '<p>' + escapeHtml(f.description || '') + '</p>' +
          '</article>'
        );
      })
      .join('');
    grid.dataset.state = 'live';
  }

  async function loadFeatures() {
    try {
      const res = await fetch('/api/features');
      if (!res.ok) throw new Error('Bad response: ' + res.status);
      const data = await res.json();
      renderFeatures(data);
    } catch (err) {
      // Leave the static fallback content already in the page untouched.
      console.warn('Neural Flow: could not load features, showing fallback content.', err);
    }
  }

  // ---------- Pricing ----------

  function formatPrice(price) {
    const n = Number(price);
    return Number.isFinite(n) ? '$' + n : String(price);
  }

  function renderPricing(tiers) {
    const grid = document.getElementById('pricing-grid');
    if (!grid || !Array.isArray(tiers) || tiers.length === 0) return;

    grid.innerHTML = tiers
      .map(function (tier) {
        const highlighted = !!tier.highlighted;
        const features = Array.isArray(tier.features) ? tier.features : [];
        const period = tier.period ? '/' + tier.period : '';
        const ctaLabel = highlighted ? 'Get started' : tier.price === 0 ? 'Get started' : 'Talk to sales';
        const ctaClass = highlighted ? 'btn-primary' : 'btn-secondary';

        return (
          '<article class="price-card' + (highlighted ? ' price-card--highlighted' : '') + '">' +
          (highlighted ? '<p class="price-tag">Most teams choose this</p>' : '') +
          '<h3>' + escapeHtml(tier.name || '') + '</h3>' +
          '<p class="price"><span class="amount">' + formatPrice(tier.price) + '</span>' +
          '<span class="period">' + escapeHtml(period) + '</span></p>' +
          '<ul class="price-features">' +
          features.map(function (f) { return '<li>' + escapeHtml(f) + '</li>'; }).join('') +
          '</ul>' +
          '<a class="btn ' + ctaClass + ' price-cta" href="#contact">' + ctaLabel + '</a>' +
          '</article>'
        );
      })
      .join('');
    grid.dataset.state = 'live';
  }

  async function loadPricing() {
    try {
      const res = await fetch('/api/pricing');
      if (!res.ok) throw new Error('Bad response: ' + res.status);
      const data = await res.json();
      renderPricing(data);
    } catch (err) {
      console.warn('Neural Flow: could not load pricing, showing fallback content.', err);
    }
  }

  // ---------- Contact form ----------

  function setStatus(el, text, kind) {
    el.textContent = text;
    el.classList.remove('form-status--ok', 'form-status--error');
    if (kind) el.classList.add('form-status--' + kind);
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    if (!form || !status) return;

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const message = form.elements.message.value.trim();

      if (!name || !email || !message) {
        setStatus(status, 'Fill in every field before sending.', 'error');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      setStatus(status, 'Sending…', null);

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message }),
        });

        let data = null;
        try {
          data = await res.json();
        } catch (_) {
          // no JSON body
        }

        if (res.ok && data && data.ok) {
          setStatus(status, data.message || "Thanks, we'll be in touch.", 'ok');
          form.reset();
        } else {
          const errMsg = (data && data.error) || 'Something went wrong. Try again.';
          setStatus(status, errMsg, 'error');
        }
      } catch (err) {
        setStatus(status, "Couldn't reach the server. Check your connection and try again.", 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadFeatures();
    loadPricing();
    initContactForm();
  });
})();
