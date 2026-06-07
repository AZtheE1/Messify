import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { state, switchView } from './app.js';
import { setupDBListeners, stopDBListeners } from './db.js';

let auth;
let db;

export async function initAuth(app) {
  auth = getAuth(app);
  db = getFirestore(app);

  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const btnGoogleLogin = document.getElementById('btn-google-login');

  if (btnLogin) btnLogin.addEventListener('click', login);
  if (btnLogout) btnLogout.addEventListener('click', logout);
  if (btnGoogleLogin) btnGoogleLogin.addEventListener('click', login);

  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          state.currentUser = user;
          
          // Check if member exists
          const memberRef = doc(db, 'members', user.uid);
          let memberSnap;
          try {
            memberSnap = await getDoc(memberRef);
          } catch(e) {
            console.error("Error fetching member", e);
          }

          if (!memberSnap || !memberSnap.exists()) {
            // Check if first user ever
            const membersSnap = await getDocs(collection(db, 'members'));
            const role = membersSnap.empty ? 'admin' : 'member';
            
            await setDoc(memberRef, {
              uid: user.uid,
              name: user.displayName || 'Unknown User',
              email: user.email,
              role: role,
              joinedAt: new Date().toISOString(),
              isActive: true
            });
            state.isAdmin = (role === 'admin');
          } else {
            state.isAdmin = (memberSnap.data().role === 'admin');
          }

          if (btnLogin) btnLogin.classList.add('hidden');
          if (btnLogout) btnLogout.classList.remove('hidden');
          document.getElementById('fab-add-bazar').classList.remove('hidden');

          if (state.isAdmin) {
            document.getElementById('nav-admin').classList.remove('hidden');
          } else {
            document.getElementById('nav-admin').classList.add('hidden');
          }

          document.querySelector('.nav-links').classList.remove('hidden');
          switchView('dashboard');

          await setupDBListeners();
          resolve(user);
        } else {
          state.currentUser = null;
          state.isAdmin = false;
          if (btnLogin) btnLogin.classList.remove('hidden');
          if (btnLogout) btnLogout.classList.add('hidden');
          document.getElementById('nav-admin').classList.add('hidden');
          document.getElementById('fab-add-bazar').classList.add('hidden');
          
          document.querySelector('.nav-links').classList.add('hidden');
          switchView('login');

          stopDBListeners();
          resolve(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        Swal.fire('Login Initialization Failed', error.message, 'error');
        // Fallback to login view on error
        document.querySelector('.nav-links').classList.add('hidden');
        switchView('login');
        resolve(null);
      }
    });
  });
}

export async function login() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Signed in successfully', showConfirmButton: false, timer: 3000 });
  } catch (error) {
    Swal.fire('Login Error', error.message, 'error');
  }
}

export async function logout() {
  try {
    await signOut(auth);
    window.location.reload();
  } catch (error) {
    Swal.fire('Logout Error', error.message, 'error');
  }
}
