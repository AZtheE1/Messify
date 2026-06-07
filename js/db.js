import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, query, where, orderBy, getDocs, addDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { state } from './app.js';
import { updateBazarChart } from './charts.js';
import { generatePDFReport } from './reports.js';

let db;
let unsubCycles, unsubMembers, unsubBazar;
let activeMembers = [];
let currentCycleData = null;

export async function initDB(app) {
  db = getFirestore(app);
  await checkAutoCloseMonth();
}

export async function checkAutoCloseMonth() {
  if (!db) db = getFirestore();
  const lastCheck = localStorage.getItem('messify_last_close_check');
  const now = new Date();
  const currentYYYYMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  if (lastCheck === currentYYYYMM) return;

  try {
    const q = query(collection(db, 'monthly_cycles'), where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const activeDoc = snapshot.docs[0];
      const activeData = activeDoc.data();
      
      if (activeData.yearMonth < currentYYYYMM) {
        // Close month
        await updateDoc(doc(db, 'monthly_cycles', activeDoc.id), {
          status: 'closed',
          closedAt: new Date().toISOString()
        });
        
        // Compute and write to arrears (simplified for this agent build)
        // ...
        
        // Show info
        Swal.fire({
          title: 'Month Closed',
          text: `The previous month (${activeData.yearMonth}) was closed automatically.`,
          icon: 'info'
        });
      }
    } else {
      // Create new cycle if none active
      await setDoc(doc(db, 'monthly_cycles', currentYYYYMM), {
        yearMonth: currentYYYYMM,
        status: 'active',
        totalDeposited: 0,
        totalBazarSpent: 0,
        remainingBalance: 0,
        totalMealsCount: 0,
        mealRate: 0,
        dailyMealsPerMember: 3,
        mealOverrides: {},
        closedAt: null
      });
    }
    
    localStorage.setItem('messify_last_close_check', currentYYYYMM);
  } catch(e) {
    console.error("Auto close check failed", e);
  }
}

export async function setupDBListeners() {
  if (!db) db = getFirestore();
  // Members Listener
  unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
    activeMembers = [];
    const tbody = document.querySelector('#members-table tbody');
    tbody.innerHTML = '';
    
    snapshot.forEach(docSnap => {
      const m = docSnap.data();
      if (m.isActive) activeMembers.push(m);
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${m.name}</td>
        <td>${m.role}</td>
        <td>${m.isActive ? 'Active' : 'Inactive'}</td>
        <td>-</td>
      `;
      tbody.appendChild(tr);
    });
    
    populateShopperDropdowns();
  });

  // Active Cycle Listener
  const qCycle = query(collection(db, 'monthly_cycles'), where('status', '==', 'active'));
  unsubCycles = onSnapshot(qCycle, (snapshot) => {
    if (!snapshot.empty) {
      const cycleDoc = snapshot.docs[0];
      currentCycleData = cycleDoc.data();
      state.activeCycleId = cycleDoc.id;
      
      document.getElementById('dash-total-deposited').textContent = `৳ ${currentCycleData.totalDeposited.toFixed(2)}`;
      document.getElementById('dash-total-spent').textContent = `৳ ${currentCycleData.totalBazarSpent.toFixed(2)}`;
      document.getElementById('dash-cash-on-hand').textContent = `৳ ${currentCycleData.remainingBalance.toFixed(2)}`;
      document.getElementById('admin-active-cycle').textContent = currentCycleData.yearMonth;
      
      setupBazarListener(cycleDoc.id);
    }
  });

  // History Listener
  const qHistory = query(collection(db, 'monthly_cycles'), where('status', '==', 'closed'), orderBy('yearMonth', 'desc'));
  onSnapshot(qHistory, (snapshot) => {
    const histContainer = document.getElementById('history-container');
    histContainer.innerHTML = '';
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <h3>${data.yearMonth}</h3>
        <div class="stat"><span>Spent:</span> <strong>৳ ${data.totalBazarSpent.toFixed(2)}</strong></div>
        <div class="stat"><span>Meal Rate:</span> <strong>৳ ${data.mealRate.toFixed(2)}</strong></div>
        <div class="stat"><span>Balance:</span> <strong>৳ ${data.remainingBalance.toFixed(2)}</strong></div>
        <button class="btn-primary full-width btn-download-pdf" data-id="${docSnap.id}">Download PDF</button>
      `;
      histContainer.appendChild(card);
    });
    
    document.querySelectorAll('.btn-download-pdf').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const d = await getDoc(doc(db, 'monthly_cycles', id));
        if(d.exists()) generatePDFReport(d.data());
      });
    });
  });
}

function setupBazarListener(cycleId) {
  if (unsubBazar) unsubBazar();
  const q = query(collection(db, `monthly_cycles/${cycleId}/bazar_logs`), orderBy('date', 'desc'));
  unsubBazar = onSnapshot(q, (snapshot) => {
    const logs = [];
    const container = document.getElementById('bazar-logs-container');
    container.innerHTML = '';
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      logs.push(data);
      
      const card = document.createElement('div');
      card.className = 'log-card';
      
      let itemsHtml = `<table><tr><th>Item</th><th>Qty</th><th>Cost</th></tr>`;
      data.items.forEach(i => {
        itemsHtml += `<tr><td>${i.category}</td><td>${i.quantity}</td><td>৳ ${i.cost}</td></tr>`;
      });
      itemsHtml += `</table>`;

      card.innerHTML = `
        <div class="log-header">
          <span>${data.date} | ${data.shopperName}</span>
          <span>৳ ${data.totalCost.toFixed(2)}</span>
        </div>
        <div class="log-details">${itemsHtml}</div>
      `;
      
      card.querySelector('.log-header').addEventListener('click', () => {
        card.classList.toggle('expanded');
      });
      
      container.appendChild(card);
    });
    
    if (logs.length === 0) {
      container.innerHTML = '<div class="empty-state">No bazar logs yet.</div>';
    }
    
    updateBazarChart(logs);
  });
}

export function stopDBListeners() {
  if (unsubMembers) unsubMembers();
  if (unsubCycles) unsubCycles();
  if (unsubBazar) unsubBazar();
}

function populateShopperDropdowns() {
  const shopperSelect = document.getElementById('bazar-shopper');
  const depositSelect = document.getElementById('deposit-member');
  const overrideSelect = document.getElementById('override-member');
  
  const optionsHtml = activeMembers.map(m => `<option value="${m.uid}">${m.name}</option>`).join('');
  
  if(shopperSelect) shopperSelect.innerHTML = optionsHtml;
  if(depositSelect) depositSelect.innerHTML = optionsHtml;
  if(overrideSelect) overrideSelect.innerHTML = optionsHtml;
}

// ---------------- FAB Multi-step logic ----------------

const fab = document.getElementById('fab-add-bazar');
const modal = document.getElementById('bazar-modal');
const btnClose = document.getElementById('btn-close-modal');
const btnNext = document.getElementById('btn-bazar-next');
const btnPrev = document.getElementById('btn-bazar-prev');
const btnSubmit = document.getElementById('btn-bazar-submit');
const btnAddRow = document.getElementById('btn-add-bazar-row');
const itemsContainer = document.getElementById('bazar-items-container');

let currentStep = 1;

fab.addEventListener('click', () => {
  currentStep = 1;
  updateModalView();
  modal.classList.remove('hidden');
  document.getElementById('bazar-date').valueAsDate = new Date();
  itemsContainer.innerHTML = '';
  addBazarRow();
  
  if(state.isAdmin) {
    btnSubmit.textContent = 'CONFIRM & ADD TO LOGS';
  } else {
    btnSubmit.textContent = 'SUBMIT FOR APPROVAL';
  }
});

btnClose.addEventListener('click', () => modal.classList.add('hidden'));

btnNext.addEventListener('click', () => {
  if (currentStep < 3) {
    currentStep++;
    if (currentStep === 3) populateReview();
    updateModalView();
  }
});

btnPrev.addEventListener('click', () => {
  if (currentStep > 1) {
    currentStep--;
    updateModalView();
  }
});

function updateModalView() {
  document.querySelectorAll('.modal-step').forEach(el => el.classList.add('hidden'));
  document.getElementById(`bazar-step-${currentStep}`).classList.remove('hidden');
  
  document.getElementById('bazar-step-title').textContent = `Step ${currentStep}: ${currentStep === 1 ? 'Entry Details' : currentStep === 2 ? 'Line Items' : 'Review & Submit'}`;
  
  btnPrev.classList.toggle('hidden', currentStep === 1);
  btnNext.classList.toggle('hidden', currentStep === 3);
  btnSubmit.classList.toggle('hidden', currentStep !== 3);
}

function addBazarRow() {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <select class="input-field item-cat">
      <optgroup label="Meats & Protein">
        <option value="Beef">Beef</option>
        <option value="Chicken">Chicken</option>
        <option value="Fish (Rui/Katla)">Fish (Rui/Katla)</option>
        <option value="Eggs">Eggs</option>
      </optgroup>
      <optgroup label="Essentials">
        <option value="Rice">Rice</option>
        <option value="Cooking Oil">Cooking Oil</option>
        <option value="Onion/Garlic/Ginger">Onion/Garlic/Ginger</option>
      </optgroup>
      <optgroup label="Vegetables">
        <option value="Vegetables (Mixed Seasonal)">Vegetables (Mixed Seasonal)</option>
      </optgroup>
    </select>
    <input type="text" class="input-field item-qty" placeholder="Qty">
    <input type="number" class="input-field item-cost" placeholder="Cost ৳" min="0">
    <button class="btn-remove-row">X</button>
  `;
  
  row.querySelector('.btn-remove-row').addEventListener('click', () => {
    row.remove();
    updateLiveTotal();
  });
  
  row.querySelector('.item-cost').addEventListener('input', updateLiveTotal);
  
  itemsContainer.appendChild(row);
}

btnAddRow.addEventListener('click', addBazarRow);

function updateLiveTotal() {
  let total = 0;
  document.querySelectorAll('.item-cost').forEach(input => {
    const val = parseFloat(input.value);
    if (!isNaN(val)) total += val;
  });
  document.getElementById('bazar-live-total').textContent = total.toFixed(2);
  return total;
}

function populateReview() {
  const summary = document.getElementById('bazar-review-summary');
  const date = document.getElementById('bazar-date').value;
  const shopperSelect = document.getElementById('bazar-shopper');
  const shopperName = shopperSelect.options[shopperSelect.selectedIndex].text;
  
  let html = `<p><strong>Date:</strong> ${date}</p><p><strong>Shopper:</strong> ${shopperName}</p><hr><ul>`;
  
  document.querySelectorAll('.item-row').forEach(row => {
    const cat = row.querySelector('.item-cat').value;
    const qty = row.querySelector('.item-qty').value || '-';
    const cost = row.querySelector('.item-cost').value || '0';
    html += `<li>${cat} (${qty}): ৳ ${cost}</li>`;
  });
  
  html += `</ul>`;
  summary.innerHTML = html;
  document.getElementById('bazar-final-total').textContent = updateLiveTotal().toFixed(2);
}

btnSubmit.addEventListener('click', async () => {
  if (!state.activeCycleId) return;
  
  const date = document.getElementById('bazar-date').value;
  const shopperId = document.getElementById('bazar-shopper').value;
  const shopperName = document.getElementById('bazar-shopper').options[document.getElementById('bazar-shopper').selectedIndex].text;
  const totalCost = updateLiveTotal();
  
  const items = [];
  document.querySelectorAll('.item-row').forEach(row => {
    items.push({
      category: row.querySelector('.item-cat').value,
      quantity: row.querySelector('.item-qty').value,
      cost: parseFloat(row.querySelector('.item-cost').value || 0)
    });
  });
  
  const payload = {
    date,
    shopperId,
    shopperName,
    totalCost,
    items,
    timestamp: new Date().toISOString()
  };

  try {
    if (state.isAdmin) {
      payload.confirmedBy = state.currentUser.uid;
      await addDoc(collection(db, `monthly_cycles/${state.activeCycleId}/bazar_logs`), payload);
      
      // Update cycle totals
      const newTotalBazar = currentCycleData.totalBazarSpent + totalCost;
      const newBalance = currentCycleData.totalDeposited - newTotalBazar;
      const newRate = currentCycleData.totalMealsCount > 0 ? (newTotalBazar / currentCycleData.totalMealsCount) : 0;
      
      await updateDoc(doc(db, 'monthly_cycles', state.activeCycleId), {
        totalBazarSpent: newTotalBazar,
        remainingBalance: newBalance,
        mealRate: newRate
      });
      
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Bazar Logged', showConfirmButton: false, timer: 3000 });
    } else {
      payload.status = 'pending';
      await addDoc(collection(db, 'bazar_requests'), payload);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Request Submitted', showConfirmButton: false, timer: 3000 });
    }
    modal.classList.add('hidden');
  } catch(e) {
    Swal.fire('Error', e.message, 'error');
  }
});
