import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { initAuth } from './auth.js';
import { initDB, checkAutoCloseMonth } from './db.js';
import { setupUI } from './ui.js'; // Let's split UI logic or keep it here. I'll keep UI logic in app.js and call it UI routing.

// 🔧 REPLACE WITH YOUR FIREBASE PROJECT CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

// Global State
export const state = {
  currentUser: null,
  isAdmin: false,
  activeCycleId: null
};

// UI Routing
function switchView(targetId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  
  const targetView = document.getElementById(`view-${targetId}`);
  if (targetView) targetView.classList.add('active');
  
  const targetLink = document.querySelector(`.nav-links a[data-target="${targetId}"]`);
  if (targetLink) targetLink.classList.add('active');
}

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = e.target.getAttribute('data-target');
    switchView(target);
  });
});

// Theme Toggle
const themeToggleBtn = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('messify_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('messify_theme', newTheme);
  themeToggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

// Offline Detection
window.addEventListener('offline', () => {
  Swal.fire({
    title: 'Offline Mode',
    text: 'You are offline. Data will sync when connection is restored.',
    icon: 'warning',
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 4000
  });
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => console.log('SW Registered', reg))
    .catch(err => console.error('SW Registration Failed', err));
}

// Initialize App
async function bootstrap() {
  await initAuth(app);
  await initDB(app);
  
  // Hide loading
  document.getElementById('loading-overlay').classList.remove('active');
  document.getElementById('navbar').classList.remove('hidden');
  document.getElementById('app-content').classList.remove('hidden');
}

bootstrap();

export { switchView };
