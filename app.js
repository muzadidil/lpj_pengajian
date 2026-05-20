/* ==========================================
   TPQ AL-MAIDAH KARANGSONO - Application Logic
   Data calls now go through the `Api` object (see js/firebase.js).
   Rendering, tabs, and PDF generation are unchanged.
   ========================================== */

lucide.createIcons();

function applyMenuVisibility() {
  Api.getAdminConfig().then(res => {
    if (res.status !== 'success' || !res.data || !res.data.menu) return;
    const menu = res.data.menu;
    const map = { keluar: 'input', masuk: 'pemasukan', panitia: 'panitia', riwayat: 'riwayat', cetak: 'laporan' };
    Object.entries(map).forEach(([key, tabId]) => {
      if (menu[key] === false) {
        const btn = document.getElementById('btn-' + tabId);
        if (btn) btn.style.display = 'none';
      }
    });
  });
}

applyMenuVisibility();

// ===== DROPDOWN LOADING =====
function loadDropdowns() {
  Api.getDropdownData().then((res) => {
    if (res.status === 'success') {
      const elSatuan = document.getElementById('harga');
      const elKategori = document.getElementById('jenis');
      const elFilterKat = document.getElementById('filterKatRiwayat');

      elSatuan.innerHTML = '<option value="" disabled selected>Pilih Satuan</option>';
      res.satuan.forEach(s => elSatuan.innerHTML += `<option value="${s}">${s}</option>`);

      elKategori.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
      elFilterKat.innerHTML = '<option value="">Semua Kategori</option>';
      res.kategori.forEach(k => {
        elKategori.innerHTML += `<option value="${k}">${k}</option>`;
        elFilterKat.innerHTML += `<option value="${k}">${k}</option>`;
      });
    }
  });

  Api.getDataPanitia().then((res) => {
    if (res.status === 'success') {
      const elNama = document.getElementById('namaAnggota');
      const elJabatan = document.getElementById('jabatanPanitia');
      const elFilterJabatan = document.getElementById('filterJabatanList');

      elNama.innerHTML = '<option value="" disabled selected>Pilih Nama Anggota</option>';
      res.nama.forEach(n => elNama.innerHTML += `<option value="${n}">${n}</option>`);

      elJabatan.innerHTML = '<option value="" disabled selected>Pilih Jabatan / Peran</option>';
      elFilterJabatan.innerHTML = '<option value="">Semua Jabatan</option>';
      res.jabatan.forEach(j => {
        elJabatan.innerHTML += `<option value="${j}">${j}</option>`;
        elFilterJabatan.innerHTML += `<option value="${j}">${j}</option>`;
      });
    }
  });
}

loadDropdowns();

// ===== TAB NAVIGATION =====
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.add('hidden');
    tab.classList.remove('block');
  });
  document.getElementById('tab-' + tabId).classList.remove('hidden');
  document.getElementById('tab-' + tabId).classList.add('block');

  ['input', 'pemasukan', 'panitia', 'riwayat', 'laporan'].forEach(t => {
    const btn = document.getElementById('btn-' + t);
    if (btn) btn.className = "flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-gray-400 transition-all";
  });
  const active = document.getElementById('btn-' + tabId);
  if (active) active.className = "flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[#003399] transition-all";

  if (tabId === 'riwayat') fetchRiwayat();
  if (tabId === 'panitia') fetchPanitia();
}

// ===== FORM: PENGELUARAN =====
function handleSubmit(e) {
  e.preventDefault();
  const btnSubmit = document.getElementById('btnSubmit');
  const btnText = document.getElementById('btnText');
  const loading = document.getElementById('loading');
  const payload = {
    pj: document.getElementById('pjPengeluaran').value,
    noRek: document.getElementById('noRek').value,
    nama: document.getElementById('nama').value,
    harga: document.getElementById('harga').value,
    qty: document.getElementById('qty').value,
    jenis: document.getElementById('jenis').value
  };

  const resetBtn = () => {
    btnSubmit.disabled = false;
    btnText.classList.remove('hidden');
    loading.classList.add('hidden');
  };

  btnSubmit.disabled = true;
  btnText.classList.add('hidden');
  loading.classList.remove('hidden');

  Api.simpanData(payload).then((res) => {
    resetBtn();
    if (res.status === 'success') {
      openModal();
      document.getElementById('bcaForm').reset();
    } else {
      alert('Gagal: ' + res.message);
    }
  }).catch((err) => {
    resetBtn();
    alert('Error: ' + err);
  });
}

// ===== FORM: PEMASUKAN =====
function handlePemasukan(e) {
  e.preventDefault();
  const btnSubmit = document.getElementById('btnSubmitPemasukan');
  const btnText = document.getElementById('btnTextPemasukan');
  const loading = document.getElementById('loadingPemasukan');
  const payload = {
    pj: document.getElementById('pjPemasukan').value,
    nominal: document.getElementById('nominalPemasukan').value,
    keterangan: document.getElementById('ketPemasukan').value
  };

  const resetBtn = () => {
    btnSubmit.disabled = false;
    btnText.classList.remove('hidden');
    loading.classList.add('hidden');
  };

  btnSubmit.disabled = true;
  btnText.classList.add('hidden');
  loading.classList.remove('hidden');

  Api.simpanPemasukan(payload).then((res) => {
    resetBtn();
    if (res.status === 'success') {
      openModal();
      document.getElementById('pemasukanForm').reset();
    } else {
      alert('Gagal: ' + res.message);
    }
  }).catch((err) => {
    resetBtn();
    alert('Error: ' + err);
  });
}

// ===== FORM: PANITIA =====
function handlePanitia(e) {
  e.preventDefault();
  const btnSubmit = document.getElementById('btnSubmitPanitia');
  const btnText = document.getElementById('btnTextPanitia');
  const loading = document.getElementById('loadingPanitia');
  const payload = {
    jabatan: document.getElementById('jabatanPanitia').value,
    nama: document.getElementById('namaAnggota').value
  };

  const resetBtn = () => {
    btnSubmit.disabled = false;
    btnText.classList.remove('hidden');
    loading.classList.add('hidden');
  };

  btnSubmit.disabled = true;
  btnText.classList.add('hidden');
  loading.classList.remove('hidden');

  Api.simpanSusunan(payload).then((res) => {
    resetBtn();
    if (res.status === 'success') {
      openModal();
      document.getElementById('panitiaForm').reset();
      fetchPanitia();
    } else {
      alert('Gagal: ' + res.message);
    }
  }).catch((err) => {
    resetBtn();
    alert('Error: ' + err);
  });
}

// ===== PANITIA LIST =====
let searchTimerPanitia;
function delaySearchPanitia() {
  clearTimeout(searchTimerPanitia);
  searchTimerPanitia = setTimeout(() => { fetchPanitia(); }, 600);
}

function fetchPanitia() {
  const loadingEl = document.getElementById('panitia-loading');
  const listEl = document.getElementById('panitia-list');
  const paramSearch = document.getElementById('searchPanitia').value;
  const paramJabatan = document.getElementById('filterJabatanList').value;

  loadingEl.classList.remove('hidden');
  loadingEl.classList.add('flex');
  listEl.innerHTML = '';

  const params = { search: paramSearch, jabatan: paramJabatan };

  Api.getSusunanPanitia(params).then((res) => {
    loadingEl.classList.add('hidden');
    loadingEl.classList.remove('flex');
    if (res.status === 'success') {
      tampilkanDataPanitia(res.data);
      lucide.createIcons();
    } else {
      listEl.innerHTML = `<p class="text-xs text-red-500 text-center py-4">Gagal memuat: ${res.message}</p>`;
    }
  }).catch((err) => {
    loadingEl.classList.add('hidden');
    loadingEl.classList.remove('flex');
    listEl.innerHTML = `<p class="text-xs text-red-500 text-center py-4">Sistem Error: ${err}</p>`;
  });
}

function tampilkanDataPanitia(dataArray) {
  const listEl = document.getElementById('panitia-list');
  if (!dataArray || dataArray.length === 0) {
    listEl.innerHTML = `<div class="text-center py-6"><p class="text-xs text-gray-500">Belum ada data panitia yang terdaftar.</p></div>`;
    return;
  }
  dataArray.forEach(item => {
    const card = document.createElement('div');
    card.className = "flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100";
    card.innerHTML = `
      <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shadow-sm">
        <i data-lucide="user" class="w-4 h-4 text-purple-600"></i>
      </div>
      <div>
        <h3 class="text-sm font-bold text-gray-800">${item.nama}</h3>
        <p class="text-[10px] text-purple-600 font-semibold uppercase tracking-wider">${item.jabatan}</p>
      </div>
    `;
    listEl.appendChild(card);
  });
}

// ===== RIWAYAT =====
let searchTimer;
function delaySearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { fetchRiwayat(); }, 600);
}

function fetchRiwayat() {
  const loadingEl = document.getElementById('riwayat-loading');
  const listEl = document.getElementById('riwayat-list');
  const paramSearch = document.getElementById('searchRiwayat').value;
  const paramKategori = document.getElementById('filterKatRiwayat').value;
  const paramLimit = document.getElementById('limitRiwayat').value;

  loadingEl.classList.remove('hidden');
  loadingEl.classList.add('flex');
  listEl.innerHTML = '';

  const params = { search: paramSearch, kategori: paramKategori, limit: parseInt(paramLimit) };

  Api.getRiwayatData(params).then((res) => {
    loadingEl.classList.add('hidden');
    loadingEl.classList.remove('flex');
    if (res.status === 'success') {
      tampilkanDataRiwayat(res.data);
      lucide.createIcons();
    } else {
      listEl.innerHTML = `<p class="text-xs text-red-500 text-center py-4">Gagal memuat: ${res.message}</p>`;
    }
  }).catch((err) => {
    loadingEl.classList.add('hidden');
    loadingEl.classList.remove('flex');
    listEl.innerHTML = `<p class="text-xs text-red-500 text-center py-4">Sistem Error: ${err}</p>`;
  });
}

function tampilkanDataRiwayat(dataArray) {
  const listEl = document.getElementById('riwayat-list');
  if (!dataArray || dataArray.length === 0) {
    listEl.innerHTML = `<div class="text-center py-8"><p class="text-xs text-gray-500">Data tidak ditemukan.</p></div>`;
    return;
  }
  dataArray.forEach(item => {
    const totalRp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.total);
    const card = document.createElement('div');
    card.className = "p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between";
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100"><i data-lucide="receipt" class="w-4 h-4 text-gray-600"></i></div>
        <div>
          <h3 class="text-sm font-bold text-gray-800 uppercase">${item.keterangan}</h3>
          <p class="text-[10px] text-gray-500">${item.waktu} • PJ: <span class="font-bold">${item.pj}</span> • <span class="text-blue-600 font-semibold">${item.kategori}</span></p>
          <p class="text-[10px] text-gray-500 font-medium">${item.qty} ${item.satuan}</p>
        </div>
      </div>
      <div class="text-right"><p class="text-sm font-bold text-red-600">-${totalRp}</p></div>
    `;
    listEl.appendChild(card);
  });
}

// ===== TERBILANG (number to Indonesian words) =====
function terbilang(angka) {
  angka = Math.abs(angka);
  var bilne = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  if (angka < 12) return bilne[angka];
  else if (angka < 20) return terbilang(angka - 10) + " Belas";
  else if (angka < 100) return terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10);
  else if (angka < 200) return "Seratus " + (terbilang(angka - 100)).toLowerCase();
  else if (angka < 1000) return terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100);
  else if (angka < 2000) return "Seribu " + terbilang(angka - 1000);
  else if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000);
  else if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + " Juta " + terbilang(angka % 1000000);
  else return "";
}

// ===== LPJ / PDF =====
function printLPJ() {
  const btn = document.getElementById('btnPrint');
  const text = document.getElementById('btnTextPrint');
  const load = document.getElementById('loadingPrint');

  const resetBtn = () => {
    btn.disabled = false;
    text.classList.remove('hidden');
    load.classList.add('hidden');
  };

  btn.disabled = true;
  text.classList.add('hidden');
  load.classList.remove('hidden');

  Api.getLPJData().then((res) => {
    resetBtn();
    if (res.status === 'success') {
      generatePDFLayout(res.data);
    } else {
      alert('Gagal mengambil data LPJ: ' + res.message);
    }
  }).catch((err) => {
    resetBtn();
    alert('System Error: ' + err);
  });
}

function generatePDFLayout(data) {
  const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  const dateObj = new Date();
  const tahun = dateObj.getFullYear();
  const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const tanggalSekarang = dateObj.getDate() + ' ' + bulanIndo[dateObj.getMonth()] + ' ' + tahun;

  let html = `
  <html><head><title>Cetak LPJ Keuangan</title>
  <style>
       body { font-family: 'Times New Roman', serif; font-size: 14px; padding: 20px; color: #000; }
       h2 { text-align: center; margin-bottom: 20px; text-transform: uppercase; font-size: 18px; }
       h3 { text-transform: uppercase; font-size: 15px; margin-top: 30px; border-bottom: 2px solid #000; padding-bottom: 5px; }
       table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
       th, td { border: 1px solid #000; padding: 6px; text-align: left; }
       .bg-cat { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
       .highlight-total { font-weight: bold; background-color: #e6f0ff !important; color: #003399; text-align: right; -webkit-print-color-adjust: exact; }
       .cat-title { font-weight: bold; font-size: 14px; text-transform: uppercase; }
       .summary-table td { border: none !important; font-size: 16px; padding: 4px 0; }
       .sign-table td { border: none !important; text-align: center; vertical-align: bottom; }
  </style></head>
  <body>
    <h2>LPJ KEUANGAN TPQ AL-MAIDAH<br>TAHUN ${tahun}</h2>
    <table class="summary-table" style="margin-bottom: 30px; margin-top: 30px;">
       <tr><td width="30%"><b>Total Pemasukan</b></td><td width="2%">:</td><td width="68%"><b>${formatRp(data.totalPemasukan)}</b></td></tr>
       <tr><td><b>Total Pengeluaran</b></td><td>:</td><td><b>${formatRp(data.totalPengeluaran)}</b></td></tr>
       <tr><td><b>Saldo Akhir</b></td><td>:</td><td style="color: ${data.saldo < 0 ? 'red' : 'green'};"><b>${formatRp(data.saldo)}</b></td></tr>
       <tr><td colspan="3" style="font-style: italic; padding-top: 10px;">Terbilang: ${terbilang(data.saldo)} Rupiah</td></tr>
    </table>
    <h3>Rincian Pengeluaran</h3>
  `;

  for (const [kategori, info] of Object.entries(data.grouped)) {
    html += `
    <table><tr class="bg-cat"><td colspan="3" class="cat-title">${kategori}</td><td class="highlight-total">${formatRp(info.total)}</td></tr>
       <tr><th width="15%" style="text-align: center;">Tanggal</th><th width="45%">Keterangan</th><th width="15%" style="text-align: center;">Satuan</th><th width="25%" style="text-align: center;">Nominal</th></tr>
    `;
    info.items.forEach(item => {
      html += `<tr><td style="text-align: center;">${item.tanggal}</td><td>${item.keterangan}</td><td style="text-align: center;">${item.qty} ${item.satuan}</td><td style="text-align: right;">${formatRp(item.nominal)}</td></tr>`;
    });
    html += `</table>`;
  }

  html += `
    <div style="text-align: right; margin-top: 40px; margin-right: 5%; font-size: 15px;">Karangsono, ${tanggalSekarang}</div><br>
    <div style="width: 100%; text-align: center; margin-top: 10px;">
       <div style="margin-bottom: 20px;">
           <p style="margin: 0;">Mengetahui,</p><br><br>
           <p style="margin: 0; margin-bottom: 70px;">Penanggung Jawab Kegiatan</p>
           <p style="margin: 0; font-weight: bold; text-decoration: underline;">${data.struktur.pj}</p>
       </div>
       <table class="sign-table" style="width: 100%; margin-top: 40px;">
           <tr>
               <td style="width: 33%;"><p style="margin: 0; margin-bottom: 70px;">Sekretaris</p><p style="margin: 0; font-weight: bold; text-decoration: underline;">${data.struktur.sekretaris}</p></td>
               <td style="width: 33%;"><p style="margin: 0; margin-bottom: 70px;">Ketua Panitia</p><p style="margin: 0; font-weight: bold; text-decoration: underline;">${data.struktur.ketua}</p></td>
               <td style="width: 33%;"><p style="margin: 0; margin-bottom: 70px;">Bendahara</p><p style="margin: 0; font-weight: bold; text-decoration: underline;">${data.struktur.bendahara}</p></td>
           </tr>
       </table>
    </div></body></html>`;

  let win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.print(); }, 800);
}

// ===== MODAL =====
function openModal() {
  document.getElementById('successModal').classList.remove('hidden');
  document.getElementById('successModal').classList.add('flex');
}

function closeModal() {
  document.getElementById('successModal').classList.add('hidden');
  document.getElementById('successModal').classList.remove('flex');
}
