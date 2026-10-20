const VIEWS = ['home', 'post', 'editor', 'profile'];

function navigateTo(view, id = null) {
  VIEWS.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.remove('active');
  });

  const target = document.getElementById(`view-${view}`);
  if (!target) return;
  target.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  switch (view) {
    case 'home':
      loadPosts(document.getElementById('search-input').value.trim());
      break;

    case 'post':
      if (!id) { navigateTo('home'); return; }
      loadPost(id);
      break;

    case 'editor':
      if (!isAuthenticated()) {
        openAuthModal('login');
        navigateTo('home');
        return;
      }
      break;

    case 'profile':
      if (!isAuthenticated()) {
        openAuthModal('login');
        navigateTo('home');
        return;
      }
      loadProfilePosts();
      break;
  }

  const titles = {
    home: 'Inkwell — Discover Stories',
    post: 'Reading Post — Inkwell',
    editor: editingPostId ? 'Edit Post — Inkwell' : 'Write a Post — Inkwell',
    profile: 'My Profile — Inkwell',
  };
  document.title = titles[view] || 'Inkwell';
}

function onAuthChange() {
  const activeView = VIEWS.find(v =>
    document.getElementById(`view-${v}`)?.classList.contains('active')
  ) || 'home';

  if (activeView === 'post' && currentPostId) {
    loadPost(currentPostId);
  } else if (activeView === 'home') {
    loadPosts();
  } else {
    navigateTo('home');
  }
}

let confirmCallback = null;

function showConfirm(title, message, onConfirm) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-dialog').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  confirmCallback = onConfirm;
}

function closeConfirm() {
  document.getElementById('confirm-dialog').classList.add('hidden');
  document.body.style.overflow = '';
  confirmCallback = null;
}

function initConfirmListeners() {
  document.getElementById('confirm-cancel-btn').addEventListener('click', closeConfirm);
  document.getElementById('confirm-ok-btn').addEventListener('click', async () => {
    if (confirmCallback) {
      const btn = document.getElementById('confirm-ok-btn');
      btn.disabled = true;
      btn.textContent = 'Deleting…';
      await confirmCallback();
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
    closeConfirm();
  });
  document.getElementById('confirm-dialog').addEventListener('click', (e) => {
    if (e.target === document.getElementById('confirm-dialog')) closeConfirm();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('confirm-dialog').classList.contains('hidden')) {
      closeConfirm();
    }
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = { success: '✓', error: '✕', info: '✦' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  const dismiss = () => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  const timer = setTimeout(dismiss, 4000);
  toast.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
}

async function initApp() {
  initAuthListeners();
  initPostsListeners();
  initCommentsListeners();
  initConfirmListeners();

  await initAuth();

  navigateTo('home');
}

document.addEventListener('DOMContentLoaded', initApp);
