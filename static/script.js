// ==========================================================
// LOGIKA JAVASCRIPT KASIR SEDERHANA (CLIENT-SIDE INTERACTION)
// ==========================================================

// State Global (Disimpan di RAM Browser selama halaman tidak direfresh)
let keranjang = [];
let totalPemasukanHariIni = 0; // Mimic 'total_harian' dari program Python CLI Anda

// ==========================================================
// 1. EVENT LISTENER: TAMBAH BARANG
// ==========================================================
const formBarang = document.getElementById('form-tambah-barang');
formBarang.addEventListener('submit', function (event) {
    event.preventDefault(); // Mencegah reload halaman

    // Ambil input dari form HTML
    const nama = document.getElementById('input-nama').value.trim();
    const harga = parseFloat(document.getElementById('input-harga').value);
    const jumlah = parseInt(document.getElementById('input-jumlah').value);

    // Validasi tambahan di frontend
    if (harga <= 0 || jumlah <= 0) {
        alert("Harga dan Jumlah harus lebih besar dari 0!");
        return;
    }

    // Buat objek barang baru
    const itemBaru = {
        nama: nama,
        harga: harga,
        jumlah: jumlah,
        subtotal: harga * jumlah
    };

    // Tambah barang ke array global keranjang
    keranjang.push(itemBaru);

    // Reset input form agar siap diisi barang berikutnya
    formBarang.reset();
    document.getElementById('input-nama').focus();

    // Render ulang tabel keranjang belanja
    updateTampilanKeranjang();
});

// ==========================================================
// 2. FUNGSI: RENDER TABEL KERANJANG
// ==========================================================
function updateTampilanKeranjang() {
    const listBarang = document.getElementById('list-barang');
    listBarang.innerHTML = ''; // Bersihkan tabel lama

    let totalBelanja = 0;

    // Loop array keranjang dan masukkan baris ke HTML tabel
    keranjang.forEach((item, index) => {
        totalBelanja += item.subtotal;

        listBarang.innerHTML += `
            <tr>
                <td class="bold">${item.nama}</td>
                <td>Rp ${item.harga.toLocaleString('id-ID')}</td>
                <td>${item.jumlah}</td>
                <td class="bold">Rp ${item.subtotal.toLocaleString('id-ID')}</td>
                <td>
                    <button class="btn-danger" onclick="hapusItem(${index})">🗑️ Hapus</button>
                </td>
            </tr>
        `;
    });

    // Update teks Total Belanja di kolom kanan (Pembayaran)
    document.getElementById('text-total').innerText = `Rp ${totalBelanja.toLocaleString('id-ID')}`;

    // Hitung diskon secara otomatis
    hitungDiskonOtomatis(totalBelanja);
}

// ==========================================================
// 3. FUNGSI: HAPUS BARANG DARI KERANJANG
// ==========================================================
function hapusItem(index) {
    // Hapus 1 elemen pada posisi index
    keranjang.splice(index, 1);
    
    // Update ulang tabel di layar
    updateTampilanKeranjang();
}

// ==========================================================
// 4. FUNGSI: HITUNG DISKON OTOMATIS REAL-TIME
// ==========================================================
function hitungDiskonOtomatis(totalBelanja) {
    const isMember = document.getElementById('cbox-member').checked;
    let diskon = 0;

    // Syarat diskon: jika member
    if (isMember) {
        if (totalBelanja >= 100000) {
            diskon = totalBelanja * 0.07; // Diskon 7%
        } else if (totalBelanja >= 50000) {
            diskon = totalBelanja * 0.05; // Diskon 5%
        }
    }

    const totalBayar = totalBelanja - diskon;

    // Update teks diskon dan total bayar akhir
    document.getElementById('text-diskon').innerText = `Rp ${diskon.toLocaleString('id-ID')}`;
    document.getElementById('text-total-bayar').innerText = `Rp ${totalBayar.toLocaleString('id-ID')}`;
}

// Event listener agar diskon langsung beradaptasi saat checkbox member di-klik
document.getElementById('cbox-member').addEventListener('change', function () {
    // Ambil total belanja saat ini secara dinamis dari array
    const totalBelanja = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
    hitungDiskonOtomatis(totalBelanja);
});

// ==========================================================
// 5. EVENT LISTENER: PROSES BAYAR & CETAK STRUK DIGITAL
// ==========================================================
document.getElementById('btn-bayar').addEventListener('click', function () {
    const errorEl = document.getElementById('error-message');
    errorEl.innerText = ''; // Reset pesan error

    // Validasi keranjang kosong
    if (keranjang.length === 0) {
        errorEl.innerText = "Keranjang belanja kosong! Tambahkan barang terlebih dahulu.";
        return;
    }

    // Ambil nominal uang bayar
    const inputBayarRaw = document.getElementById('input-bayar').value;
    const uangBayar = parseFloat(inputBayarRaw);

    // Hitung total belanja & diskon saat ini
    const totalBelanja = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
    const isMember = document.getElementById('cbox-member').checked;
    let diskon = 0;
    if (isMember) {
        if (totalBelanja >= 100000) diskon = totalBelanja * 0.07;
        else if (totalBelanja >= 50000) diskon = totalBelanja * 0.05;
    }
    const totalBayar = totalBelanja - diskon;

    // Validasi uang bayar
    if (isNaN(uangBayar) || uangBayar <= 0) {
        errorEl.innerText = "Masukkan uang bayar yang valid!";
        return;
    }

    if (uangBayar < totalBayar) {
        errorEl.innerText = `Uang tidak cukup! Kurang Rp ${(totalBayar - uangBayar).toLocaleString('id-ID')}`;
        return;
    }

    // Transaksi Sukses! Hitung kembalian
    const kembalian = uangBayar - totalBayar;

    // Tambahkan total bayar hari ini ke pemasukan admin
    totalPemasukanHariIni += totalBayar;

    // Tampilkan & Cetak Struk Belanja Digital
    cetakStrukDigital(totalBelanja, diskon, totalBayar, uangBayar, kembalian);

    /* 
    ========================================================================
    EDUKASI: CARA MENGHUBUNGKAN KE API BACKEND PYTHON (FLASK/FASTAPI) NANTI
    ========================================================================
    Jika nanti Anda sudah membuat backend API sendiri di Python, Anda cukup
    mengganti logika lokal di atas dengan kode Fetch API seperti ini:

    const dataTransaksi = {
        daftar_barang: keranjang,
        member: isMember ? 'y' : 'n',
        uang_bayar: uangBayar
    };

    fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataTransaksi)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Tampilkan struk dari server
            cetakStrukDigital(...);
        } else {
            errorEl.innerText = result.error;
        }
    })
    .catch(err => console.error("Error API:", err));
    ========================================================================
    */
});

// ==========================================================
// 6. FUNGSI: CETAK STRUK DIGITAL (VISUAL PREMIUM)
// ==========================================================
function cetakStrukDigital(total, diskon, final, cash, change) {
    const receiptCard = document.getElementById('receipt-card');
    const receiptItemsList = document.getElementById('receipt-items-list');
    const receiptDate = document.getElementById('receipt-date');

    // Tulis Tanggal Transaksi
    const sekarang = new Date();
    receiptDate.innerText = sekarang.toLocaleString('id-ID');

    // Bersihkan daftar item struk lama
    receiptItemsList.innerHTML = '';

    // Isi daftar item di struk belanja
    keranjang.forEach(item => {
        receiptItemsList.innerHTML += `
            <div class="receipt-item-row">
                <div class="bold">${item.nama}</div>
                <div class="receipt-item-details">
                    <span>${item.jumlah} x Rp ${item.harga.toLocaleString('id-ID')}</span>
                    <span>Rp ${item.subtotal.toLocaleString('id-ID')}</span>
                </div>
            </div>
        `;
    });

    // Isi data ringkasan harga
    document.getElementById('receipt-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
    document.getElementById('receipt-discount').innerText = `Rp ${diskon.toLocaleString('id-ID')}`;
    document.getElementById('receipt-final').innerText = `Rp ${final.toLocaleString('id-ID')}`;
    document.getElementById('receipt-cash').innerText = `Rp ${cash.toLocaleString('id-ID')}`;
    document.getElementById('receipt-change').innerText = `Rp ${change.toLocaleString('id-ID')}`;

    // Munculkan kartu struk belanja (display block)
    receiptCard.style.display = 'block';

    // Kosongkan keranjang belanja setelah sukses transaksi
    keranjang = [];
    updateTampilanKeranjang();
    document.getElementById('input-bayar').value = '';
    document.getElementById('cbox-member').checked = false;
}

// Tombol Transaksi Baru untuk menutup struk digital
document.getElementById('btn-transaksi-baru').addEventListener('click', function() {
    document.getElementById('receipt-card').style.display = 'none';
});


// ==========================================================
// 7. LOGIKA DIALOG MODAL ADMIN (PASSWORD: admin123)
// ==========================================================
const modalAdmin = document.getElementById('modal-admin');
const btnAdmin = document.getElementById('btn-admin');
const closeModal = document.getElementById('close-modal');

// Buka Modal Admin
btnAdmin.addEventListener('click', function () {
    modalAdmin.style.display = 'flex';
    document.getElementById('admin-password').focus();
});

// Tutup Modal Admin via tombol silang (x)
closeModal.addEventListener('click', function () {
    tutupModalAdmin();
});

// Tutup modal jika user klik di luar area card modal
window.addEventListener('click', function (event) {
    if (event.target === modalAdmin) {
        tutupModalAdmin();
    }
});

function tutupModalAdmin() {
    modalAdmin.style.display = 'none';
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-login-error').innerText = '';
    
    // Kembalikan ke tampilan login
    document.getElementById('admin-login-section').style.display = 'block';
    document.getElementById('admin-dashboard-section').style.display = 'none';
}

// Proses Login Admin
document.getElementById('btn-login-admin').addEventListener('click', verifyAdminLogin);
document.getElementById('admin-password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        verifyAdminLogin();
    }
});

function verifyAdminLogin() {
    const passwordInput = document.getElementById('admin-password').value;
    const loginError = document.getElementById('admin-login-error');

    if (passwordInput === 'admin123') {
        loginError.innerText = '';
        
        // Sembunyikan form login, tunjukkan dashboard admin
        document.getElementById('admin-login-section').style.display = 'none';
        document.getElementById('admin-dashboard-section').style.display = 'block';
        
        // Update nominal pendapatan harian ke layar admin
        document.getElementById('text-pemasukan-admin').innerText = `Rp ${totalPemasukanHariIni.toLocaleString('id-ID')}`;
    } else {
        loginError.innerText = "Password salah, silahkan ulangi!";
    }
}

// Tombol Reset Pemasukan Admin
document.getElementById('btn-reset-pemasukan').addEventListener('click', function () {
    if (confirm("Apakah Anda yakin ingin mereset total pemasukan hari ini menjadi Rp0?")) {
        totalPemasukanHariIni = 0;
        document.getElementById('text-pemasukan-admin').innerText = "Rp 0";
        alert("Total berhasil direset!!");
    }
});

// Keluar dari Akun Admin (Logout)
document.getElementById('btn-logout-admin').addEventListener('click', function () {
    tutupModalAdmin();
});
