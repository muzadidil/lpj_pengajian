/* ==========================================
   TPQ AL-MAIDAH - Admin Panel Logic
   Depends on: firebase.js (Api, toArr, clean, logError)
   ========================================== */

lucide.createIcons();

let adminConfig = {};
let masterData = {};
let panitiaRecords = [];
let jabatanList = [];

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
  const [masterRes, panitiaRes] = await Promise.all([
    Api.getMasterData(),
    Api.getAllPanitiaRecords()
  ]);
  masterData = (masterRes.data) || {};
  panitiaRecords = (panitiaRes.data) || [];
  jabatanList = toArr(masterData.jabatan);

  renderMenuSettings();
  renderKategoriList();
  populatePanitiaSelects();
  renderPanitiaRecords();
  renderPanitiaList();
  renderLpjInfo();
}

// ===== SECTION SWITCHING =====
function showSection(name) {
  ['menu', 'kategori', 'panitia', 'lpj', 'pin'].forEach(s => {
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

// ===== PANITIA RECORDS (actual susunan) =====
function populatePanitiaSelects() {
  const namaSel = document.getElementById('panitia-nama-sel');
  const jabatanSel = document.getElementById('panitia-jabatan-sel');
  if (!namaSel || !jabatanSel) return;
  const namaList = toArr(masterData.namaPanitia);
  namaSel.innerHTML = '<option value="">-- Pilih Nama --</option>' +
    namaList.map(n => `<option value="${n}">${n}</option>`).join('');
  jabatanSel.innerHTML = '<option value="">-- Jabatan --</option>' +
    jabatanList.map(j => `<option value="${j}">${j}</option>`).join('');
}

async function addPanitiaRecord() {
  const nama = document.getElementById('panitia-nama-sel').value;
  const jabatan = document.getElementById('panitia-jabatan-sel').value;
  if (!nama || !jabatan) { showToast('Pilih nama dan jabatan terlebih dahulu', true); return; }
  const res = await Api.simpanSusunan({ nama, jabatan });
  if (res.status === 'success') {
    const pr = await Api.getAllPanitiaRecords();
    panitiaRecords = pr.data || [];
    renderPanitiaRecords();
    document.getElementById('panitia-nama-sel').value = '';
    document.getElementById('panitia-jabatan-sel').value = '';
    showToast('Panitia ditambahkan');
  } else {
    showToast('Gagal: ' + res.message, true);
  }
}

function renderPanitiaRecords() {
  const el = document.getElementById('panitia-records-list');
  if (!panitiaRecords || panitiaRecords.length === 0) {
    el.innerHTML = '<p class="text-xs text-gray-400 text-center py-4">Belum ada susunan panitia</p>';
    return;
  }
  el.innerHTML = panitiaRecords.map(item => `
    <div class="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
      <span class="flex-1 text-sm font-medium text-gray-700 truncate">${item.nama}</span>
      <select class="jabatan-select bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-700 appearance-none outline-none input-focus"
        onchange="updateJabatan('${item.key}', this.value)">
        ${jabatanList.map(j => `<option value="${j}" ${j === item.jabatan ? 'selected' : ''}>${j}</option>`).join('')}
        ${!jabatanList.includes(item.jabatan) ? `<option value="${item.jabatan}" selected>${item.jabatan}</option>` : ''}
      </select>
      <button onclick="deletePanitiaRecord('${item.key}')" class="btn-delete bg-red-50 hover:bg-red-100 rounded-lg transition-all flex-shrink-0">
        <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
      </button>
    </div>
  `).join('');
  lucide.createIcons();
}

async function updateJabatan(key, jabatan) {
  const res = await Api.updatePanitiaJabatan(key, jabatan);
  if (res.status === 'success') {
    const record = panitiaRecords.find(r => r.key === key);
    if (record) record.jabatan = jabatan;
    showToast('Jabatan diperbarui');
  } else {
    showToast('Gagal: ' + res.message, true);
  }
}

async function deletePanitiaRecord(key) {
  const res = await Api.deletePanitia(key);
  if (res.status === 'success') {
    panitiaRecords = panitiaRecords.filter(r => r.key !== key);
    renderPanitiaRecords();
    showToast('Panitia dihapus');
  } else {
    showToast('Gagal: ' + res.message, true);
  }
}

// ===== PANITIA MASTER (nama dropdown) =====
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

// ===== LPJ INFO =====
function renderLpjInfo() {
  const info = adminConfig.lpjInfo || {};
  document.getElementById('lpj-lembaga').value = info.lembaga || '';
  document.getElementById('lpj-alamat').value = info.alamat || '';
  document.getElementById('lpj-kegiatan').value = info.kegiatan || '';
}

async function saveLpjInfo() {
  const lembaga = clean(document.getElementById('lpj-lembaga').value, 100) || 'TPQ AL-MAIDAH KARANGSONO';
  const alamat = clean(document.getElementById('lpj-alamat').value, 200);
  const kegiatan = clean(document.getElementById('lpj-kegiatan').value, 100) || 'WISUDA SANTRI';
  const newConfig = Object.assign({}, adminConfig, { lpjInfo: { lembaga, alamat, kegiatan } });
  const res = await Api.saveAdminConfig(newConfig);
  if (res.status === 'success') {
    adminConfig = newConfig;
    showToast('Info LPJ disimpan');
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
