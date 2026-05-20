/* ==========================================
   TPQ AL-MAIDAH - Admin Panel Logic
   Depends on: firebase.js (Api, toArr, clean, logError)
   ========================================== */

lucide.createIcons();

let adminConfig = {};
let masterData = {};

// ===== PIN HASHING =====
async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== PIN GATE =====
async function verifyPin() {
  const input = document.getElementById('pin-input').value.trim();
  const errEl = document.getElementById('pin-error');
  errEl.classList.add('hidden');

  if (!input) {
    errEl.textContent = 'Masukkan PIN terlebih dahulu';
    errEl.classList.remove('hidden');
    return;
  }

  const res = await Api.getAdminConfig();
  const storedHash = res.data && res.data.pinHash;
  const inputHash = await hashPin(input);

  if (!storedHash) {
    const defaultHash = await hashPin('1234');
    if (inputHash !== defaultHash) {
      errEl.textContent = 'PIN salah. PIN default: 1234';
      errEl.classList.remove('hidden');
      document.getElementById('pin-input').value = '';
      return;
    }
    const initConfig = {
      pinHash: defaultHash,
      menu: { keluar: true, masuk: true, panitia: true, riwayat: true, cetak: true }
    };
    await Api.saveAdminConfig(initConfig);
    adminConfig = initConfig;
  } else {
    if (inputHash !== storedHash) {
      errEl.textContent = 'PIN salah';
      errEl.classList.remove('hidden');
      document.getElementById('pin-input').value = '';
      return;
    }
    adminConfig = res.data;
  }

  document.getElementById('pin-gate').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
  loadAdminPanel();
}

document.getElementById('pin-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') verifyPin();
});

// ===== LOAD PANEL =====
async function loadAdminPanel() {
  const masterRes = await Api.getMasterData();
  masterData = (masterRes.data) || {};
  renderMenuSettings();
  renderKategoriList();
  renderPanitiaList();
}

// ===== SECTION SWITCHING =====
function showSection(name) {
  ['menu', 'kategori', 'panitia', 'pin'].forEach(s => {
    document.getElementById('section-' + s).classList.add('hidden');
    document.getElementById('tab-btn-' + s).className =
      "flex-1 py-2.5 px-2 text-[11px] font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all";
  });
  document.getElementById('section-' + name).classList.remove('hidden');
  document.getElementById('tab-btn-' + name).className =
    "active-tab flex-1 py-2.5 px-2 text-[11px] font-bold rounded-xl transition-all";
  lucide.createIcons();
}

// ===== MENU SETTINGS =====
function renderMenuSettings() {
  const menu = adminConfig.menu || { keluar: true, masuk: true, panitia: true, riwayat: true, cetak: true };
  ['keluar', 'masuk', 'panitia', 'riwayat', 'cetak'].forEach(key => {
    const el = document.getElementById('menu-' + key);
    if (el) el.checked = menu[key] !== false;
  });
}

async function saveMenuSettings() {
  const menu = {};
  ['keluar', 'masuk', 'panitia', 'riwayat', 'cetak'].forEach(key => {
    menu[key] = document.getElementById('menu-' + key).checked;
  });
  const newConfig = Object.assign({}, adminConfig, { menu });
  const res = await Api.saveAdminConfig(newConfig);
  if (res.status === 'success') {
    adminConfig = newConfig;
    showToast('Pengaturan menu disimpan');
  } else {
    showToast('Gagal menyimpan: ' + res.message, true);
  }
}

// ===== KATEGORI =====
function renderKategoriList() {
  const list = toArr(masterData.kategori);
  const el = document.getElementById('kategori-list');
  if (list.length === 0) {
    el.innerHTML = '<p class="text-xs text-gray-400 text-center py-4">Belum ada kategori</p>';
    return;
  }
  el.innerHTML = list.map((item, i) => `
    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
      <span class="text-sm font-medium text-gray-700">${item}</span>
      <button onclick="removeKategori(${i})" class="btn-delete bg-red-50 hover:bg-red-100 rounded-lg transition-all">
        <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
      </button>
    </div>
  `).join('');
  lucide.createIcons();
}

async function addKategori() {
  const input = document.getElementById('new-kategori');
  const val = clean(input.value, 50);
  if (!val) return;
  const list = toArr(masterData.kategori);
  if (list.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
    showToast('Kategori sudah ada', true);
    return;
  }
  list.push(val);
  const res = await Api.updateMasterList('kategori', list);
  if (res.status === 'success') {
    masterData.kategori = list;
    input.value = '';
    renderKategoriList();
    showToast('Kategori ditambahkan');
  } else {
    showToast('Gagal: ' + res.message, true);
  }
}

async function removeKategori(index) {
  const list = toArr(masterData.kategori);
  list.splice(index, 1);
  const res = await Api.updateMasterList('kategori', list);
  if (res.status === 'success') {
    masterData.kategori = list;
    renderKategoriList();
    showToast('Kategori dihapus');
  } else {
    showToast('Gagal: ' + res.message, true);
  }
}

// ===== PANITIA MASTER =====
function renderPanitiaList() {
  const list = toArr(masterData.namaPanitia);
  const el = document.getElementById('panitia-master-list');
  if (list.length === 0) {
    el.innerHTML = '<p class="text-xs text-gray-400 text-center py-4">Belum ada nama panitia</p>';
    return;
  }
  el.innerHTML = list.map((item, i) => `
    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
      <span class="text-sm font-medium text-gray-700">${item}</span>
      <button onclick="removePanitia(${i})" class="btn-delete bg-red-50 hover:bg-red-100 rounded-lg transition-all">
        <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
      </button>
    </div>
  `).join('');
  lucide.createIcons();
}

async function addPanitia() {
  const input = document.getElementById('new-panitia');
  const val = clean(input.value, 100).toUpperCase();
  if (!val) return;
  const list = toArr(masterData.namaPanitia);
  if (list.map(s => s.toUpperCase()).includes(val)) {
    showToast('Nama sudah ada', true);
    return;
  }
  list.push(val);
  const res = await Api.updateMasterList('namaPanitia', list);
  if (res.status === 'success') {
    masterData.namaPanitia = list;
    input.value = '';
    renderPanitiaList();
    showToast('Nama panitia ditambahkan');
  } else {
    showToast('Gagal: ' + res.message, true);
  }
}

async function removePanitia(index) {
  const list = toArr(masterData.namaPanitia);
  list.splice(index, 1);
  const res = await Api.updateMasterList('namaPanitia', list);
  if (res.status === 'success') {
    masterData.namaPanitia = list;
    renderPanitiaList();
    showToast('Nama dihapus');
  } else {
    showToast('Gagal: ' + res.message, true);
  }
}

// ===== PIN CHANGE =====
async function changePin() {
  const newPin = document.getElementById('new-pin').value.trim();
  const confirmPin = document.getElementById('confirm-pin').value.trim();
  const errEl = document.getElementById('pin-change-error');
  errEl.classList.add('hidden');

  if (!newPin || newPin.length < 4) {
    errEl.textContent = 'PIN minimal 4 karakter';
    errEl.classList.remove('hidden');
    return;
  }
  if (newPin !== confirmPin) {
    errEl.textContent = 'Konfirmasi PIN tidak cocok';
    errEl.classList.remove('hidden');
    return;
  }

  const newHash = await hashPin(newPin);
  const newConfig = Object.assign({}, adminConfig, { pinHash: newHash });
  const res = await Api.saveAdminConfig(newConfig);
  if (res.status === 'success') {
    adminConfig = newConfig;
    document.getElementById('new-pin').value = '';
    document.getElementById('confirm-pin').value = '';
    showToast('PIN berhasil diubah');
  } else {
    showToast('Gagal: ' + res.message, true);
  }
}

// ===== TOAST =====
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl z-[200] transition-all whitespace-nowrap ${isError ? 'bg-red-500' : 'bg-green-500'}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}
