const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? '×' : '☰';
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.textContent = '☰';
}));
document.getElementById('year').textContent = new Date().getFullYear();
const contactEmail = window.PORTFOLIO_EMAIL || 'your-email@example.com';
const contactEmailLink = document.getElementById('contact-email');
if (contactEmailLink) contactEmailLink.href = `mailto:${contactEmail}`;

const supabaseReady = window.supabase &&
  window.SUPABASE_URL && !window.SUPABASE_URL.includes('PASTE_') &&
  window.SUPABASE_ANON_KEY && !window.SUPABASE_ANON_KEY.includes('PASTE_') &&
  window.SUPABASE_ADMIN_UID && !window.SUPABASE_ADMIN_UID.includes('PASTE_');
const db = supabaseReady
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
  : null;

const gallery = document.getElementById('artwork-gallery');
const loginDialog = document.getElementById('admin-login-dialog');
const dashboardDialog = document.getElementById('admin-dashboard-dialog');
const detailsDialog = document.getElementById('art-details-dialog');
let currentUser = null;
let artworks = [];

function money(value) {
  if (value === null || value === undefined || value === '') return 'Ask for price';
  return new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', maximumFractionDigits:0}).format(value);
}
function escapeHtml(value='') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function showSetupMessage() {
  gallery.innerHTML = '<p class="gallery-loading">The artwork gallery is ready. Connect the free Supabase setup in the README to add and publish your own drawings.</p>';
}
function renderGallery() {
  if (!artworks.length) {
    gallery.innerHTML = '<p class="gallery-loading">New artwork will be added here soon.</p>';
    return;
  }
  gallery.innerHTML = artworks.map((art, i) => `
    <button class="art-card ${i===0?'card-large':''}" data-art-id="${escapeHtml(art.id)}" data-category="${escapeHtml(art.category)}">
      <div class="art-image artwork-photo" style="background-image:url('${escapeHtml(art.image_url)}')"><span class="art-index">${String(i+1).padStart(2,'0')}</span></div>
      <div class="card-meta"><div><h3>${escapeHtml(art.title)}</h3><p>${escapeHtml(art.medium || '')} · ${escapeHtml(art.category || '')}</p><div class="card-sale-row"><strong>${money(art.price)}</strong><span>${escapeHtml(art.availability || 'Enquire')}</span></div></div><span class="card-arrow">VIEW & ENQUIRE ↗</span></div>
    </button>`).join('');
  gallery.querySelectorAll('.art-card').forEach(card => card.addEventListener('click', () => {
    const art = artworks.find(item => String(item.id) === card.dataset.artId);
    if (art) openArtworkDetails(art);
  }));
}
function openArtworkDetails(art) {
  document.getElementById('details-image').src = art.image_url;
  document.getElementById('details-image').alt = art.title;
  document.getElementById('details-title').textContent = art.title;
  document.getElementById('details-description').textContent = art.description || '';
  document.getElementById('details-medium').textContent = art.medium || 'Not specified';
  document.getElementById('details-size').textContent = art.size || 'Not specified';
  document.getElementById('details-price').textContent = money(art.price);
  document.getElementById('details-availability').textContent = art.availability || 'Ask';
  const subject = encodeURIComponent(`Artwork enquiry: ${art.title}`);
  const body = encodeURIComponent(`Hello, I am interested in "${art.title}". Please share more details.`);
  document.getElementById('details-enquire').href = `mailto:${window.PORTFOLIO_EMAIL || 'your-email@example.com'}?subject=${subject}&body=${body}`;
  detailsDialog.showModal();
}
document.getElementById('details-close').addEventListener('click', () => detailsDialog.close());

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.filter;
    gallery.querySelectorAll('.art-card').forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
    });
  });
});

async function loadArtworks() {
  if (!db) { showSetupMessage(); return; }
  const {data, error} = await db.from('artworks').select('*').order('created_at', {ascending:false});
  if (error) {
    gallery.innerHTML = '<p class="gallery-loading">Could not load artworks. Check the Supabase setup instructions.</p>';
    console.error(error);
    return;
  }
  artworks = data || [];
  renderGallery();
}
document.getElementById('open-admin').addEventListener('click', async () => {
  if (!db) {
    alert('Admin setup is not connected yet. Follow the Supabase steps in README.md first.');
    return;
  }
  const {data:{session}} = await db.auth.getSession();
  if (session && session.user.id === window.SUPABASE_ADMIN_UID) {
    currentUser = session.user;
    await loadAdminList();
    dashboardDialog.showModal();
  } else {
    loginDialog.showModal();
  }
});
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => {
  document.getElementById(button.dataset.closeDialog).close();
}));
document.getElementById('admin-login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const message = document.getElementById('login-message');
  message.textContent = 'Signing in...';
  const {data, error} = await db.auth.signInWithPassword({
    email: document.getElementById('admin-email').value.trim(),
    password: document.getElementById('admin-password').value
  });
  if (error) { message.textContent = error.message; return; }
  if (data.user.id !== window.SUPABASE_ADMIN_UID) {
    await db.auth.signOut();
    message.textContent = 'This account is not authorised as the portfolio admin.';
    return;
  }
  currentUser = data.user;
  loginDialog.close();
  message.textContent = '';
  await loadAdminList();
  dashboardDialog.showModal();
});
document.getElementById('admin-logout').addEventListener('click', async () => {
  await db.auth.signOut();
  currentUser = null;
  dashboardDialog.close();
});
function resetArtworkForm() {
  document.getElementById('artwork-form').reset();
  document.getElementById('artwork-id').value = '';
  document.getElementById('save-artwork-button').innerHTML = 'Save artwork <span>↗</span>';
  document.getElementById('cancel-edit').hidden = true;
  document.getElementById('artwork-message').textContent = '';
}
document.getElementById('cancel-edit').addEventListener('click', resetArtworkForm);
document.getElementById('artwork-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!currentUser || currentUser.id !== window.SUPABASE_ADMIN_UID) return;
  const message = document.getElementById('artwork-message');
  const saveButton = document.getElementById('save-artwork-button');
  saveButton.disabled = true;
  message.textContent = 'Saving artwork...';
  try {
    const id = document.getElementById('artwork-id').value;
    const file = document.getElementById('art-image').files[0];
    let imageUrl = id ? artworks.find(a => String(a.id) === id)?.image_url : null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) throw new Error('Image must be 5 MB or smaller.');
      if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Use JPG, PNG or WebP image.');
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g,'-');
      const path = `${currentUser.id}/${crypto.randomUUID()}-${safeName}`;
      const {error:uploadError} = await db.storage.from('artworks').upload(path, file, {upsert:false});
      if (uploadError) throw uploadError;
      const {data:publicData} = db.storage.from('artworks').getPublicUrl(path);
      imageUrl = publicData.publicUrl;
    }
    if (!imageUrl) throw new Error('Please choose an artwork photo.');
    const payload = {
      title: document.getElementById('art-title').value.trim(),
      category: document.getElementById('art-category').value,
      medium: document.getElementById('art-medium').value.trim(),
      size: document.getElementById('art-size').value.trim(),
      price: document.getElementById('art-price').value ? Number(document.getElementById('art-price').value) : null,
      availability: document.getElementById('art-availability').value,
      description: document.getElementById('art-description').value.trim(),
      image_url: imageUrl,
      owner_id: currentUser.id
    };
    const result = id
      ? await db.from('artworks').update(payload).eq('id', id).select().single()
      : await db.from('artworks').insert(payload).select().single();
    if (result.error) throw result.error;
    message.textContent = 'Artwork saved successfully.';
    resetArtworkForm();
    await loadArtworks();
    await loadAdminList();
  } catch (error) {
    message.textContent = error.message || 'Could not save artwork.';
  } finally {
    saveButton.disabled = false;
  }
});
async function loadAdminList() {
  if (!currentUser || currentUser.id !== window.SUPABASE_ADMIN_UID) return;
  const list = document.getElementById('admin-artwork-list');
  const {data, error} = await db.from('artworks').select('*').order('created_at',{ascending:false});
  if (error) { list.textContent = error.message; return; }
  artworks = data || [];
  list.innerHTML = artworks.length ? artworks.map(art => `
    <div class="admin-art-row"><div><strong>${escapeHtml(art.title)}</strong><small>${escapeHtml(art.size || 'Size not set')} · ${money(art.price)}</small></div>
    <div><button type="button" data-edit="${escapeHtml(art.id)}">Edit</button><button type="button" data-delete="${escapeHtml(art.id)}">Delete</button></div></div>`).join('') : '<p>No artworks added yet.</p>';
  list.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => {
    const art = artworks.find(a => String(a.id) === button.dataset.edit);
    if (!art) return;
    document.getElementById('artwork-id').value = art.id;
    document.getElementById('art-title').value = art.title;
    document.getElementById('art-category').value = art.category;
    document.getElementById('art-medium').value = art.medium || '';
    document.getElementById('art-size').value = art.size || '';
    document.getElementById('art-price').value = art.price ?? '';
    document.getElementById('art-availability').value = art.availability || 'Available';
    document.getElementById('art-description').value = art.description || '';
    document.getElementById('save-artwork-button').innerHTML = 'Update artwork <span>↗</span>';
    document.getElementById('cancel-edit').hidden = false;
    document.getElementById('artwork-message').textContent = 'Choose a new photo only if you want to replace the current one.';
    document.getElementById('artwork-form').scrollIntoView({behavior:'smooth',block:'start'});
  }));
  list.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', async () => {
    const art = artworks.find(a => String(a.id) === button.dataset.delete);
    if (!art || !confirm(`Delete "${art.title}" from your portfolio?`)) return;
    const {error} = await db.from('artworks').delete().eq('id', art.id);
    if (error) { alert(error.message); return; }
    await loadArtworks();
    await loadAdminList();
  }));
}
if (db) loadArtworks(); else showSetupMessage();


// Editorial scroll experience: progress line, sticky-header state, reveal-on-scroll.
(() => {
  const header = document.querySelector('.site-header');
  const progress = document.getElementById('scroll-progress-bar');
  const topButton = document.getElementById('back-to-top');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;
  const updateScrollUI = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const percent = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = `${percent}%`;
    if (header) header.classList.toggle('scrolled', window.scrollY > 24);
    if (topButton) topButton.classList.toggle('visible', window.scrollY > 550);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { window.requestAnimationFrame(updateScrollUI); ticking = true; }
  }, {passive:true});
  window.addEventListener('resize', updateScrollUI);
  updateScrollUI();
  topButton?.addEventListener('click', () => window.scrollTo({top:0,behavior:reducedMotion?'auto':'smooth'}));

  const revealTargets = document.querySelectorAll('.hero-copy,.hero-art-wrap,.intro-strip,.section-heading,.filters,.about-mark,.about-content,.about-side,.process-grid article,.contact-section > *');
  revealTargets.forEach((el, index) => {
    el.classList.add('reveal');
    if (el.matches('.process-grid article')) el.style.transitionDelay = `${(index % 3) * 100}ms`;
  });
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, {threshold:0.12,rootMargin:'0px 0px -35px 0px'});
    revealTargets.forEach(el => observer.observe(el));
    const gallery = document.getElementById('artwork-gallery');
    if (gallery) {
      const watchCards = () => gallery.querySelectorAll('.art-card:not(.reveal)').forEach((card, i) => {
        card.classList.add('reveal'); card.style.transitionDelay = `${(i % 2) * 110}ms`; observer.observe(card);
      });
      watchCards();
      new MutationObserver(watchCards).observe(gallery,{childList:true});
    }
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }
})();
