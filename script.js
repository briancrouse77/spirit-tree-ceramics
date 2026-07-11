/* ══════════════════════════════════════════
   Spirit Tree Ceramics — Main Script
   ══════════════════════════════════════════ */

(() => {
  'use strict';

  // ── State ──
  const state = {
    step: 1,
    selectedClass: null,
    selectedDate: null,
    selectedTime: null,
    details: {},
    calYear: null,
    calMonth: null,
  };

  const today = new Date();
  state.calYear = today.getFullYear();
  state.calMonth = today.getMonth();

  // ── Booking trigger buttons ──
  const openButtons = document.querySelectorAll(
    '#hero-book-btn, #nav-book-btn, #mobile-book-btn, #contact-book-btn, .class-card__btn'
  );

  openButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const preClass = btn.dataset.class || null;
      openModal(preClass);
    });
  });

  // ── Nav scroll effect ──
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // ── Hamburger ──
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  // ── Particles ──
  // Earthy dust motes — terracotta, sienna, warm gold, sage
  const PARTICLE_COLORS = [
    'rgba(193,84,10,0.4)',
    'rgba(160,60,10,0.35)',
    'rgba(200,149,42,0.38)',
    'rgba(74,122,74,0.30)',
    'rgba(212,180,120,0.28)',
  ];

  function generateParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 5 + 2;
      const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
      p.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${Math.random() * 100}%;
        background: ${color};
        animation-duration: ${Math.random() * 24 + 16}s;
        animation-delay: ${Math.random() * 14}s;
        opacity: ${Math.random() * 0.35 + 0.1};
      `;
      container.appendChild(p);
    }
  }

  generateParticles();

  // ── Intersection Observer for scroll animations ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.class-card, .how__step, .gallery__item, .about__features li').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // ── Smooth nav link close ──
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
    });
  });


  /* ══════════════════════════════════════════
     MODAL
  ══════════════════════════════════════════ */
  const overlay    = document.getElementById('modal-overlay');
  const modal      = document.getElementById('booking-modal');
  const closeBtn   = document.getElementById('modal-close');
  const progressBar = document.getElementById('progress-bar');

  function openModal(preClass) {
    resetModal();
    if (preClass) {
      state.selectedClass = preClass;
      const radio = document.querySelector(`input[value="${preClass}"]`);
      if (radio) radio.checked = true;
    }
    overlay.classList.add('open');
    document.body.classList.add('modal-open');
    updateProgress();
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.classList.remove('modal-open');
    setTimeout(resetModal, 350);
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  function resetModal() {
    state.step = 1;
    state.selectedClass = null;
    state.selectedDate = null;
    state.selectedTime = null;
    state.details = {};

    document.querySelectorAll('input[name="class-type"]').forEach(r => r.checked = false);
    document.getElementById('details-form').reset();
    goToStep(1, false);
  }

  function updateProgress() {
    const pct = ((state.step - 1) / 4) * 100;
    progressBar.style.width = pct + '%';

    document.querySelectorAll('.step-label').forEach((lbl, i) => {
      lbl.classList.toggle('active', i < state.step);
    });
  }

  function goToStep(n, animate = true) {
    document.querySelectorAll('.modal__step').forEach(s => s.classList.remove('active'));
    state.step = n;
    const target = document.getElementById(n === 'success' ? 'step-success' : `step-${n}`);
    if (target) {
      target.classList.add('active');
      if (animate) {
        target.style.animation = 'none';
        target.offsetHeight; // reflow
        target.style.animation = '';
      }
    }
    updateProgress();
    modal.scrollTop = 0;
  }

  // ── Step 1 → 2 ──
  document.getElementById('step1-next').addEventListener('click', () => {
    const selected = document.querySelector('input[name="class-type"]:checked');
    if (!selected) {
      shakeEl(document.querySelector('.modal__class-options'));
      return;
    }
    state.selectedClass = selected.value;
    goToStep(2);
  });

  // ── Step 2 → 3 ──
  document.getElementById('step2-next').addEventListener('click', () => {
    if (!validateDetails()) return;
    collectDetails();
    goToStep(3);
    renderCalendar();
  });
  document.getElementById('step2-back').addEventListener('click', () => goToStep(1));

  // ── Step 3 → 4 ──
  document.getElementById('step3-next').addEventListener('click', () => {
    if (!state.selectedDate || !state.selectedTime) {
      shakeEl(document.querySelector('.calendar-wrap'));
      return;
    }
    goToStep(4);
    renderConfirmation();
  });
  document.getElementById('step3-back').addEventListener('click', () => goToStep(2));

  // ── Step 4 → Submit ──
  document.getElementById('step4-confirm').addEventListener('click', () => {
    submitBooking();
  });
  document.getElementById('step4-back').addEventListener('click', () => goToStep(3));

  // ── Success close ──
  document.getElementById('success-close').addEventListener('click', closeModal);


  /* ── Validation ── */
  function validateDetails() {
    const fields = ['f-name', 'f-lname', 'f-email', 'f-phone', 'f-address', 'f-city', 'f-state'];
    let valid = true;
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.classList.add('error');
        el.addEventListener('input', () => el.classList.remove('error'), { once: true });
        valid = false;
      }
    });
    const email = document.getElementById('f-email');
    if (email.value && !email.value.includes('@')) {
      email.classList.add('error');
      valid = false;
    }
    return valid;
  }

  function collectDetails() {
    const street = document.getElementById('f-address').value.trim();
    const city   = document.getElementById('f-city').value.trim();
    const st     = document.getElementById('f-state').value.trim().toUpperCase();
    state.details = {
      firstName:  document.getElementById('f-name').value.trim(),
      lastName:   document.getElementById('f-lname').value.trim(),
      email:      document.getElementById('f-email').value.trim(),
      phone:      document.getElementById('f-phone').value.trim(),
      address:    street,
      city,
      state:      st,
      fullAddress: `${street}, ${city}, ${st}`,
      guests:     document.getElementById('f-guests').value,
      experience: document.getElementById('f-exp').value,
      notes:      document.getElementById('f-notes').value.trim(),
    };
  }


  /* ── Address Autocomplete (Nominatim / OpenStreetMap) ── */
  (function initAutocomplete() {
    const input    = document.getElementById('f-address');
    const cityIn   = document.getElementById('f-city');
    const stateIn  = document.getElementById('f-state');
    const dropdown = document.getElementById('ac-dropdown');
    const spinner  = document.getElementById('ac-spinner');
    if (!input) return;

    // US state name → abbreviation map
    const STATE_ABBR = {
      'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
      'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
      'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA',
      'Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD',
      'Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS',
      'Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH',
      'New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC',
      'North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA',
      'Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD','Tennessee':'TN',
      'Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA','Washington':'WA',
      'West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY','District of Columbia':'DC',
    };

    let debounceTimer;
    let highlightIndex = -1;
    let results = [];

    function openDrop() { dropdown.classList.add('open'); }
    function closeDrop() { dropdown.classList.remove('open'); highlightIndex = -1; }

    function setHighlight(idx) {
      const items = dropdown.querySelectorAll('.ac-item:not(.ac-item--info)');
      items.forEach(i => i.classList.remove('highlighted'));
      if (idx >= 0 && idx < items.length) {
        items[idx].classList.add('highlighted');
        items[idx].scrollIntoView({ block: 'nearest' });
      }
      highlightIndex = idx;
    }

    function fillFromResult(r) {
      const a = r.address || {};
      const street = [a.house_number, a.road].filter(Boolean).join(' ');
      const city   = a.city || a.town || a.village || a.county || '';
      const stFull = a.state || '';
      const stAbbr = STATE_ABBR[stFull] || stFull.substring(0,2).toUpperCase();

      input.value   = street || r.display_name.split(',')[0].trim();
      cityIn.value  = city;
      stateIn.value = stAbbr;

      // Clear validation errors
      [input, cityIn, stateIn].forEach(el => el.classList.remove('error'));
      closeDrop();
    }

    function renderResults(data) {
      dropdown.innerHTML = '';
      results = data;
      if (!data.length) {
        const li = document.createElement('li');
        li.className = 'ac-item ac-item--info';
        li.textContent = 'No results — try a different address';
        dropdown.appendChild(li);
        openDrop();
        return;
      }
      data.forEach((r, i) => {
        const parts = r.display_name.split(',');
        const primary   = parts.slice(0,2).join(',').trim();
        const secondary = parts.slice(2).join(',').trim();
        const li = document.createElement('li');
        li.className = 'ac-item';
        li.setAttribute('role', 'option');
        li.innerHTML = `<div class="ac-item__primary">${primary}</div><div class="ac-item__secondary">${secondary}</div>`;
        li.addEventListener('mousedown', e => { e.preventDefault(); fillFromResult(r); });
        dropdown.appendChild(li);
      });
      openDrop();
    }

    async function fetchSuggestions(q) {
      spinner.classList.add('active');
      try {
        const url = `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6` +
          `&countrycodes=us&viewbox=-97.5,32.2,-96.2,33.3&bounded=0`;
        const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        renderResults(data.filter(r => r.address && r.address.road));
      } catch {
        closeDrop();
      } finally {
        spinner.classList.remove('active');
      }
    }

    input.addEventListener('input', () => {
      const val = input.value.trim();
      clearTimeout(debounceTimer);
      if (val.length < 4) { closeDrop(); return; }
      debounceTimer = setTimeout(() => fetchSuggestions(val + ', Dallas TX'), 420);
    });

    input.addEventListener('keydown', e => {
      const items = dropdown.querySelectorAll('.ac-item:not(.ac-item--info)');
      if (e.key === 'ArrowDown')  { e.preventDefault(); setHighlight(Math.min(highlightIndex + 1, items.length - 1)); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); setHighlight(Math.max(highlightIndex - 1, 0)); }
      if (e.key === 'Enter' && highlightIndex >= 0 && results[highlightIndex]) {
        e.preventDefault(); fillFromResult(results[highlightIndex]);
      }
      if (e.key === 'Escape') closeDrop();
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.form__group--ac')) closeDrop();
    });
  })();


  /* ── Calendar ── */
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const TIME_SLOTS = ['9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','6:00 PM','7:00 PM'];
  // Simulate some fully-booked slots (deterministic by day seed)
  const BOOKED_PATTERN = [0, 2, 5]; // indices of time slots that are "booked" on odd days

  function renderCalendar() {
    const label = document.getElementById('cal-month-label');
    const daysEl = document.getElementById('cal-days');
    const year = state.calYear;
    const month = state.calMonth;

    label.textContent = `${MONTHS[month]} ${year}`;
    daysEl.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Empty padding cells
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day empty';
      daysEl.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      cell.textContent = d;

      const date = new Date(year, month, d);
      const isPast = date < todayMidnight;
      const isSunday = date.getDay() === 0; // closed Sundays

      if (isPast || isSunday) {
        cell.classList.add('disabled');
      } else {
        if (date.toDateString() === today.toDateString()) cell.classList.add('today');
        if (state.selectedDate && date.toDateString() === state.selectedDate.toDateString()) {
          cell.classList.add('selected');
        }
        cell.addEventListener('click', () => selectDate(date));
      }
      daysEl.appendChild(cell);
    }
  }

  function selectDate(date) {
    state.selectedDate = date;
    state.selectedTime = null;
    renderCalendar();
    renderTimeslots(date);
  }

  function renderTimeslots(date) {
    const wrap = document.getElementById('timeslots');
    const label = document.getElementById('timeslots-label');
    wrap.innerHTML = '';

    const dateStr = date.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
    label.textContent = dateStr;

    // Simulate availability: odd-numbered days have some slots "booked"
    const isOdd = date.getDate() % 2 !== 0;
    TIME_SLOTS.forEach((slot, i) => {
      const btn = document.createElement('button');
      btn.className = 'timeslot';
      btn.textContent = slot;
      const isBooked = isOdd && BOOKED_PATTERN.includes(i);
      if (isBooked) {
        btn.textContent += ' — Booked';
        btn.disabled = true;
        btn.style.color = '#c0b0a0';
        btn.style.cursor = 'not-allowed';
        btn.style.opacity = '0.55';
      } else {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.timeslot').forEach(t => t.classList.remove('selected'));
          btn.classList.add('selected');
          state.selectedTime = slot;
        });
        if (state.selectedTime === slot) btn.classList.add('selected');
      }
      wrap.appendChild(btn);
    });
  }

  document.getElementById('cal-prev').addEventListener('click', () => {
    state.calMonth--;
    if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    state.calMonth++;
    if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
    renderCalendar();
  });


  /* ── Confirmation Screen ── */
  function renderConfirmation() {
    const card = document.getElementById('confirm-card');
    const d = state.details;
    const dateStr = state.selectedDate.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    card.innerHTML = `
      <div class="confirm__row">
        <span>Session</span>
        <span>${state.selectedClass}</span>
      </div>
      <div class="confirm__divider"></div>
      <div class="confirm__row">
        <span>Name</span>
        <span>${d.firstName} ${d.lastName}</span>
      </div>
      <div class="confirm__row">
        <span>Email</span>
        <span>${d.email}</span>
      </div>
      <div class="confirm__row">
        <span>Phone</span>
        <span>${d.phone}</span>
      </div>
      <div class="confirm__row">
        <span>Address</span>
        <span>${d.address}</span>
      </div>
      <div class="confirm__row">
        <span>City / State</span>
        <span>${d.city}, ${d.state}</span>
      </div>
      <div class="confirm__row">
        <span>Guests</span>
        <span>${d.guests}</span>
      </div>
      <div class="confirm__divider"></div>
      <div class="confirm__row">
        <span>Date</span>
        <span>${dateStr}</span>
      </div>
      <div class="confirm__row">
        <span>Time</span>
        <span>${state.selectedTime}</span>
      </div>
      ${d.notes ? `
      <div class="confirm__divider"></div>
      <div class="confirm__row">
        <span>Notes</span>
        <span>${d.notes}</span>
      </div>` : ''}
    `;
  }


  /* ── Submit & Save ── */
  function submitBooking() {
    const booking = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      class: state.selectedClass,
      details: { ...state.details },
      date: state.selectedDate.toISOString(),
      time: state.selectedTime,
      status: 'new',
    };

    // Save to Firestore (cross-device) with localStorage fallback
    if (typeof db !== 'undefined') {
      db.collection('bookings').add(booking).catch(err => {
        console.warn('Firestore write failed, using localStorage', err);
        const ex = JSON.parse(localStorage.getItem('stc_bookings') || '[]');
        ex.push(booking);
        localStorage.setItem('stc_bookings', JSON.stringify(ex));
      });
    } else {
      const ex = JSON.parse(localStorage.getItem('stc_bookings') || '[]');
      ex.push(booking);
      localStorage.setItem('stc_bookings', JSON.stringify(ex));
    }

    // Show success
    const dateStr = state.selectedDate.toLocaleDateString('en-US', {
      weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
    });
    document.getElementById('success-detail').textContent =
      `${state.selectedClass} · ${dateStr} at ${state.selectedTime}`;

    state.step = 4;
    goToStep('success');
    progressBar.style.width = '100%';
    document.querySelectorAll('.step-label').forEach(l => l.classList.add('active'));
  }

  function generateId() {
    return 'BK-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }


  /* ── Contact Form ── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const name  = document.getElementById('cf-name').value.trim();
      const email = document.getElementById('cf-email').value.trim();
      const msg   = document.getElementById('cf-msg').value.trim();
      if (!name || !email || !msg) return;

      const msgObj = {
        id: 'MSG-' + Math.random().toString(36).substr(2,6).toUpperCase(),
        timestamp: new Date().toISOString(),
        name, email, message: msg, read: false,
      };

      if (typeof db !== 'undefined') {
        db.collection('messages').add(msgObj).catch(err => {
          console.warn('Firestore write failed, using localStorage', err);
          const msgs = JSON.parse(localStorage.getItem('stc_messages') || '[]');
          msgs.push(msgObj);
          localStorage.setItem('stc_messages', JSON.stringify(msgs));
        });
      } else {
        const msgs = JSON.parse(localStorage.getItem('stc_messages') || '[]');
        msgs.push(msgObj);
        localStorage.setItem('stc_messages', JSON.stringify(msgs));
      }

      contactForm.reset();
      const success = document.getElementById('cf-success');
      success.style.display = 'block';
      setTimeout(() => { success.style.display = 'none'; }, 5000);
    });
  }


  /* ── Shake animation utility ── */
  function shakeEl(el) {
    if (!el) return;
    el.style.animation = 'none';
    el.style.transition = 'none';
    el.style.transform = 'translateX(-8px)';
    setTimeout(() => { el.style.transform = 'translateX(8px)'; }, 80);
    setTimeout(() => { el.style.transform = 'translateX(-6px)'; }, 160);
    setTimeout(() => { el.style.transform = 'translateX(0)'; el.style.transition = ''; }, 240);
  }


  /* ══════════════════════════════════════════
     ADMIN VIEW  (?admin=true)
  ══════════════════════════════════════════ */
  if (new URLSearchParams(window.location.search).get('admin') === 'true') {
    renderAdminView();
  }

  function renderAdminView() {
    const bookings = JSON.parse(localStorage.getItem('stc_bookings') || '[]');
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(30,22,18,0.92);z-index:9999;
      overflow-y:auto;padding:40px 20px;font-family:'Inter',sans-serif;
    `;
    const inner = document.createElement('div');
    inner.style.cssText = `
      max-width:900px;margin:0 auto;background:#1E1612;border-radius:16px;
      padding:40px;color:#F7F0E6;
    `;
    inner.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;">
        <div>
          <h1 style="font-family:'Cormorant Garamond',serif;font-size:2rem;color:#A78BFA;">Spirit Tree Ceramics — Admin</h1>
          <p style="color:#b0a090;font-size:0.85rem;">Booking Dashboard · ${bookings.length} booking(s)</p>
        </div>
        <button onclick="this.closest('div[style]').remove()" style="
          background:#C1440E;color:#fff;border:none;padding:10px 20px;
          border-radius:50px;cursor:pointer;font-weight:600;font-size:0.88rem;
        ">Close</button>
      </div>
      ${bookings.length === 0 ? `<p style="color:#7a6a60;text-align:center;padding:40px 0;">No bookings yet.</p>` : ''}
      ${bookings.slice().reverse().map(b => {
        const d = new Date(b.date).toLocaleDateString('en-US', {weekday:'short',month:'short',day:'numeric',year:'numeric'});
        return `
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(212,149,106,0.2);
               border-radius:12px;padding:20px 24px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
              <div>
                <p style="font-size:0.7rem;color:#D4956A;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">${b.id}</p>
                <p style="font-size:1.05rem;font-weight:600;margin:4px 0;">${b.details.firstName} ${b.details.lastName}</p>
                <p style="font-size:0.85rem;color:#b0a090;">${b.class}</p>
              </div>
              <div style="text-align:right;">
                <p style="font-size:0.9rem;color:#EAC9AD;font-weight:600;">${d} at ${b.time}</p>
                <p style="font-size:0.8rem;color:#b0a090;">${b.details.guests} guest(s) · ${b.details.experience}</p>
              </div>
            </div>
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(212,149,106,0.15);
                 display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.8rem;color:#a09080;">
              <span>📧 ${b.details.email}</span>
              <span>📱 ${b.details.phone}</span>
              <span style="grid-column:1/-1;">📍 ${b.details.address}</span>
              ${b.details.notes ? `<span style="grid-column:1/-1;color:#c0b0a0;">💬 ${b.details.notes}</span>` : ''}
            </div>
          </div>
        `;
      }).join('')}
      ${bookings.length > 0 ? `
        <div style="text-align:center;margin-top:24px;">
          <button onclick="if(confirm('Clear all bookings?')){localStorage.removeItem('stc_bookings');location.reload();}" style="
            background:transparent;color:#7a6a60;border:1px solid #4a3a30;
            padding:8px 20px;border-radius:50px;cursor:pointer;font-size:0.8rem;
          ">Clear All Bookings</button>
        </div>` : ''}
    `;
    overlay.appendChild(inner);
    document.body.appendChild(overlay);
  }

})();

// ── Shop: Load & Render ──────────────────────────────────────────────────────
var _shopPotsMap = {};

(function initShop() {
  const shopSection = document.getElementById('shop');
  const shopGrid    = document.getElementById('shop-grid');
  const shopEmpty   = document.getElementById('shop-empty');
  if (!shopSection || !shopGrid) return;

  if (typeof db === 'undefined') return;

  db.collection('pots')
    .orderBy('timestamp', 'desc')
    .onSnapshot(function(snap) {
      var pots = snap.docs
        .map(function(d) { return Object.assign({}, d.data(), { _docId: d.id }); })
        .filter(function(p) { return p.status === 'available'; });

      // Update the global registry
      _shopPotsMap = {};
      pots.forEach(function(p) { _shopPotsMap[p.id || p._docId] = p; });

      if (pots.length === 0) {
        shopGrid.innerHTML = '';
        shopEmpty.style.display = '';
        return;
      }

      shopEmpty.style.display = 'none';
      shopGrid.innerHTML = pots.map(function(p) {
        var key = p.id || p._docId;
        return '<div class="shop-card" onclick="openPurchaseModal(\'' + key + '\')">'
          + (p.imageUrl
              ? '<img src="' + p.imageUrl + '" class="shop-card__img" alt="' + p.title + '" loading="lazy" />'
              : '<div class="shop-card__img-ph">🏺</div>')
          + '<div class="shop-card__body">'
          + '<div class="shop-card__title">' + p.title + '</div>'
          + (p.description ? '<div class="shop-card__desc">' + p.description + '</div>' : '')
          + '<div class="shop-card__footer">'
          + '<div class="shop-card__price">$' + Number(p.price).toFixed(0) + '</div>'
          + '<button class="shop-card__cta" onclick="event.stopPropagation();openPurchaseModal(\'' + key + '\')">Inquire \u2192</button>'
          + '</div></div></div>';
      }).join('');
    });
})();

// ── Purchase Modal ───────────────────────────────────────────────────────────
var _purchasePot = null;

function openPurchaseModal(potId) {
  var pot = _shopPotsMap[potId];
  if (!pot) return;
  _purchasePot = pot;

  // Populate step 1
  const img = document.getElementById('purchase-pot-img');
  if (pot.imageUrl) { img.src = pot.imageUrl; img.style.display = 'block'; }
  else              { img.style.display = 'none'; }
  document.getElementById('purchase-pot-title').textContent = pot.title || '';
  document.getElementById('purchase-pot-price').textContent = pot.price ? `$${Number(pot.price).toFixed(0)}` : '';
  document.getElementById('purchase-pot-desc').textContent  = pot.description || '';

  // Reset steps and form fields
  goPurchaseStep(1);
  ['pur-name','pur-email','pur-phone','pur-address','pur-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.querySelector('input[name="pur-delivery"][value="pickup"]').checked = true;
  document.getElementById('pur-address-wrap').style.display = 'none';

  var overlay = document.getElementById('purchase-overlay');
  overlay.classList.add('open');
  document.body.classList.add('modal-open');
}

function closePurchaseModal() {
  document.getElementById('purchase-overlay').classList.remove('open');
  document.body.classList.remove('modal-open');
}

function goPurchaseStep(n) {
  [1,2,3,4].forEach(i => {
    const el = document.getElementById('pstep-' + i);
    if (el) el.style.display = i === n ? '' : 'none';
  });

  // Validate step 2 before moving to 3
  if (n === 3) {
    const name  = (document.getElementById('pur-name')?.value  || '').trim();
    const email = (document.getElementById('pur-email')?.value || '').trim();
    const phone = (document.getElementById('pur-phone')?.value || '').trim();
    if (!name || !email) {
      goPurchaseStep(2);
      const bad = !name ? 'pur-name' : 'pur-email';
      document.getElementById(bad)?.focus();
      return;
    }
  }
}

// Show/hide address field when "ship" is selected
document.addEventListener('change', e => {
  if (e.target.name === 'pur-delivery') {
    document.getElementById('pur-address-wrap').style.display =
      e.target.value === 'ship' ? '' : 'none';
  }
});

// Close on backdrop or × button
document.getElementById('purchase-close')?.addEventListener('click', closePurchaseModal);
var purOverlay = document.getElementById('purchase-overlay');
if (purOverlay) {
  purOverlay.addEventListener('click', function(e) {
    if (e.target === purOverlay) closePurchaseModal();
  });
}

async function submitPurchase() {
  const name     = (document.getElementById('pur-name')?.value  || '').trim();
  const email    = (document.getElementById('pur-email')?.value || '').trim();
  const phone    = (document.getElementById('pur-phone')?.value || '').trim();
  const delivery = document.querySelector('input[name="pur-delivery"]:checked')?.value || 'pickup';
  const address  = (document.getElementById('pur-address')?.value || '').trim();
  const notes    = (document.getElementById('pur-notes')?.value  || '').trim();

  if (!name || !email) { goPurchaseStep(2); return; }

  const btn = document.getElementById('pur-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Sending…';

  const record = {
    id:        'PUR-' + Math.random().toString(36).substr(2,6).toUpperCase(),
    potId:     _purchasePot?.id    || '',
    potTitle:  _purchasePot?.title || '',
    potPrice:  _purchasePot?.price || 0,
    name, email, phone, delivery, address, notes,
    status:    'new',
    timestamp: new Date().toISOString(),
  };

  try {
    if (typeof db !== 'undefined') {
      await db.collection('purchases').add(record);
    }
    goPurchaseStep(4);
  } catch(err) {
    console.error(err);
    btn.textContent = 'Error — try again';
  } finally {
    btn.disabled = false;
  }
}

// ── Subscription Membership Mockup Logic ─────────────────────────────────────
var currentRole = 'free';
var selectedUpgradeTier = 'premium';

const mockVideos = [
  {
    id: 'vid-1',
    title: 'Centering & Wedging Clay (Teaser)',
    description: 'A brief overview of coning, wedging, and finding your physical center at the wheel. Perfect introductory lesson to get a feel for the clay.',
    duration: '8 min',
    difficulty: 'Beginner',
    tier: 'free',
    thumbnailUrl: 'images/gallery3.png',
    youtubeId: 'OnYSjEehxH0'
  },
  {
    id: 'vid-2',
    title: 'Opening & Pulling the Cylinder (Detailed)',
    description: 'Step-by-step detailed masterclass on opening the centered clay and pulling uniform walls to create basic cups, mugs, and cylinders.',
    duration: '24 min',
    difficulty: 'Beginner',
    tier: 'premium',
    thumbnailUrl: 'images/gallery2.png',
    youtubeId: 'OnYSjEehxH0'
  },
  {
    id: 'vid-3',
    title: 'Trimming & Foot Rings (Detailed)',
    description: 'Turn your greenware into refined pieces. John demonstrates wheel trimming, using loop tools, and throwing clean foot rings.',
    duration: '15 min',
    difficulty: 'Intermediate',
    tier: 'premium',
    thumbnailUrl: 'images/gallery1.png',
    youtubeId: 'OnYSjEehxH0'
  },
  {
    id: 'vid-4',
    title: 'Masterclass: Tall Bottle Forms (Detailed)',
    description: 'Collaring, shaping, and managing thin clay walls to pull tall, graceful narrow-neck bottle vases.',
    duration: '32 min',
    difficulty: 'Advanced',
    tier: 'premium',
    thumbnailUrl: 'images/hero.png',
    youtubeId: 'OnYSjEehxH0'
  }
];

function renderVideos() {
  const grid = document.getElementById('video-grid');
  if (!grid) return;

  grid.innerHTML = mockVideos.map(v => {
    // Check if the video is locked for the current role
    var isLocked = false;
    if (v.tier === 'premium' && currentRole === 'free') isLocked = true;

    return '<div class="shop-card video-card" onclick="handleVideoClick(\'' + v.id + '\')">'
      + '<div style="position:relative; overflow:hidden; aspect-ratio:4/3;">'
      + '<img src="' + v.thumbnailUrl + '" class="shop-card__img" alt="' + v.title + '" style="width:100%;height:100%;object-fit:cover;" />'
      + (!isLocked ? '<div class="video-play-indicator">▶</div>' : '')
      + (isLocked 
          ? '<div class="video-lock-overlay">'
            + '<div class="video-lock-badge">🔒 Premium Access</div>'
            + '<div class="video-lock-text">Click to Unlock</div>'
            + '</div>'
          : '')
      + '</div>'
      + '<div class="shop-card__body">'
      + '<div style="font-size:0.75rem;color:var(--teal-lt);text-transform:uppercase;font-weight:600;margin-bottom:6px;letter-spacing:0.04em;">' + v.difficulty + ' · ' + v.duration + '</div>'
      + '<div class="shop-card__title">' + v.title + '</div>'
      + '<div class="shop-card__desc">' + v.description + '</div>'
      + '</div></div>';
  }).join('');
}

function handleVideoClick(id) {
  const v = mockVideos.find(x => x.id === id);
  if (!v) return;

  var isLocked = false;
  if (v.tier === 'premium' && currentRole === 'free') isLocked = true;

  if (isLocked) {
    openUpgradeModal(v.tier);
  } else {
    openVideoPlayModal(v);
  }
}

window.changeStagingRole = function(role) {
  currentRole = role;
  const select = document.getElementById('state-role-select');
  if (select) select.value = role;

  // Show/hide Premium Coaching booking option
  const dash = document.getElementById('premium-dashboard');
  if (dash) {
    dash.style.display = role === 'premium' ? 'block' : 'none';
  }

  renderVideos();
};

window.openCheckoutModal = function(tier) {
  selectedUpgradeTier = tier;
  
  const title = document.getElementById('checkout-tier-title');
  const desc  = document.getElementById('checkout-tier-desc');
  const paymentFields = document.getElementById('checkout-payment-fields');
  const submitBtn     = document.getElementById('checkout-submit-btn');

  // Reset fields
  document.getElementById('check-name').value = '';
  document.getElementById('check-email').value = '';
  
  document.getElementById('checkout-step-form').style.display = 'block';
  document.getElementById('checkout-step-success').style.display = 'none';

  if (tier === 'free') {
    title.textContent = 'Join the Community';
    desc.textContent = 'Get access to updates, alerts, and public teaser features.';
    paymentFields.style.display = 'none';
    submitBtn.textContent = 'Register Now';
  } else if (tier === 'premium') {
    title.textContent = 'Join Studio Circle';
    desc.textContent = 'Full video library + monthly 1-on-1 critique for $29/month.';
    paymentFields.style.display = 'block';
    submitBtn.textContent = 'Subscribe ($29/mo)';
  }

  const overlay = document.getElementById('checkout-overlay');
  overlay.style.display = 'flex';
  overlay.classList.add('open');
  document.body.classList.add('modal-open');
};

window.closeCheckoutModal = function() {
  const overlay = document.getElementById('checkout-overlay');
  overlay.style.display = 'none';
  overlay.classList.remove('open');
  document.body.classList.remove('modal-open');
};

window.submitCheckout = function() {
  const name  = document.getElementById('check-name').value.trim();
  const email = document.getElementById('check-email').value.trim();
  
  if (!name || !email) {
    alert('Please enter your name and email.');
    return;
  }

  // Upgrade the UI role simulator state dynamically to matching tier
  window.changeStagingRole(selectedUpgradeTier);

  // Show success step
  document.getElementById('checkout-step-form').style.display = 'none';
  const successStep = document.getElementById('checkout-step-success');
  successStep.style.display = 'block';

  const msg = document.getElementById('checkout-success-msg');
  if (selectedUpgradeTier === 'free') {
    msg.textContent = 'You have registered for the free Clay Community. John will keep you posted on new drops and public tutorial highlights!';
  } else if (selectedUpgradeTier === 'premium') {
    msg.textContent = 'Your Studio Circle membership is active. The complete wheel tutorial library is now fully unlocked, you can join our monthly group Zoom calls, and you can schedule private 1-on-1 critiques directly with John!';
  }
};

window.openUpgradeModal = function(requiredTier) {
  selectedUpgradeTier = requiredTier;
  const title = document.getElementById('upgrade-title');
  const desc  = document.getElementById('upgrade-desc');

  title.textContent = 'Unlock Studio Circle';
  desc.textContent = 'This detailed masterclass requires a Studio Circle membership. Upgrade to get full access to all step-by-step wheel tutorials, monthly group Zoom critiques, and private 1-on-1 Zoom reviews with John for just $29/mo.';

  const overlay = document.getElementById('upgrade-overlay');
  overlay.style.display = 'flex';
  overlay.classList.add('open');
  document.body.classList.add('modal-open');
};

window.closeUpgradeModal = function() {
  const overlay = document.getElementById('upgrade-overlay');
  overlay.style.display = 'none';
  overlay.classList.remove('open');
  document.body.classList.remove('modal-open');
};

window.goToCheckoutFromUpgrade = function() {
  window.closeUpgradeModal();
  window.openCheckoutModal(selectedUpgradeTier);
};

window.openVideoPlayModal = function(video) {
  document.getElementById('video-play-title').textContent = video.title;
  document.getElementById('video-play-desc').textContent = video.description;
  
  // Use standard YouTube embed
  document.getElementById('video-iframe').src = 'https://www.youtube.com/embed/' + video.youtubeId + '?autoplay=1';

  const overlay = document.getElementById('video-play-overlay');
  overlay.style.display = 'flex';
  overlay.classList.add('open');
  document.body.classList.add('modal-open');
};

window.closeVideoPlayModal = function() {
  document.getElementById('video-iframe').src = ''; // stop playback
  const overlay = document.getElementById('video-play-overlay');
  overlay.style.display = 'none';
  overlay.classList.remove('open');
  document.body.classList.remove('modal-open');
};

// Hook up the Zoom coaching call scheduler inside dashboard
document.addEventListener('DOMContentLoaded', () => {
  renderVideos();
  
  document.getElementById('dash-schedule-btn')?.addEventListener('click', () => {
    // Open existing scheduling modal
    if (typeof openModal === 'function') {
      openModal('The Still Point — Private Session');
    }
  });

  // Close overlays on outside click
  ['checkout-overlay', 'upgrade-overlay', 'video-play-overlay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', e => {
        if (e.target === el) {
          if (id === 'checkout-overlay') window.closeCheckoutModal();
          if (id === 'upgrade-overlay') window.closeUpgradeModal();
          if (id === 'video-play-overlay') window.closeVideoPlayModal();
        }
      });
    }
  });
});
