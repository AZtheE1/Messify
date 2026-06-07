import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { initAuth } from './auth.js';
import { initDB, checkAutoCloseMonth } from './db.js';

async function loadEnv() {
  if (window.location.protocol === 'file:') {
    throw new Error("CORS Restriction: Fetching configuration is not allowed using the file:// protocol. Please run a local web server (e.g., VS Code Live Server or 'npx http-server') to run this application.");
  }

  // Try fetching .env
  try {
    const response = await fetch('./.env');
    if (response.ok) {
      const text = await response.text();
      const env = {};
      text.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
          env[key] = value;
        }
      });
      return env;
    }
  } catch (e) {
    console.warn("Failed to fetch .env directly, trying fallback:", e);
  }

  // Fallback to env.json (useful for local development servers that block dotfiles)
  try {
    const jsonResponse = await fetch('./env.json');
    if (jsonResponse.ok) {
      return await jsonResponse.json();
    }
  } catch (e) {
    console.warn("Failed to fetch env.json fallback:", e);
  }

  throw new Error("Failed to load environment configuration. Please ensure either '.env' or 'env.json' is present at the website root.");
}

let app;


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
  try {
    const env = await loadEnv();
    
    if (!env.FIREBASE_API_KEY || env.FIREBASE_API_KEY.includes('YOUR_')) {
      throw new Error("Firebase configuration keys are missing or invalid in your .env file.");
    }
    
    const firebaseConfig = {
      apiKey: env.FIREBASE_API_KEY,
      authDomain: env.FIREBASE_AUTH_DOMAIN,
      projectId: env.FIREBASE_PROJECT_ID,
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
      appId: env.FIREBASE_APP_ID
    };
    
    app = initializeApp(firebaseConfig);

    await initAuth(app);
    await initDB(app);
    
    // Hide loading
    document.getElementById('loading-overlay').classList.remove('active');
    document.getElementById('navbar').classList.remove('hidden');
    document.getElementById('app-content').classList.remove('hidden');
  } catch (error) {
    console.error("Bootstrap Error:", error);
    // Display error message instead of hanging spinner
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div style="padding: 2rem; text-align: center; max-width: 500px; font-family: var(--font-display);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
          <h2 style="color: var(--color-danger); margin-bottom: 1rem;">Configuration Error</h2>
          <p style="color: var(--color-text-main); margin-bottom: 1.5rem; line-height: 1.5;">${error.message}</p>
          <p style="font-size: 0.875rem; color: var(--color-text-muted);">
            If you are deploying to GitHub Pages, make sure you have added your secrets to the repository and triggered the deployment action to generate the <code>.env</code> file.
          </p>
        </div>
      `;
    }
  }
}

bootstrap();

export { switchView };
