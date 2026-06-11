

// State Global (Disimpan di RAM Browser selama halaman tidak direfresh)
let keranjang = [];
let totalPemasukanHariIni = 0; // Mimic 'total_harian' dari program Python CLI Anda

// tambah barang
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

// render tabel keranjang
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

// hapus barang dari keranjang
function hapusItem(index) {
    // Hapus 1 elemen pada posisi index
    keranjang.splice(index, 1);

    // Update ulang tabel di layar
    updateTampilanKeranjang();
}

// hitung diskon otomatis real time
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

// proses bayar & cetak struk digital ke API Flask
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

    // Validasi uang bayar
    if (isNaN(uangBayar) || uangBayar <= 0) {
        errorEl.innerText = "Masukkan uang bayar yang valid!";
        return;
    }

    const isMember = document.getElementById('cbox-member').checked;

    // Persiapkan data transaksi dengan kunci yang sesuai dengan api.py
    const dataTransaksi = {
        items: keranjang,
        is_member: isMember,
        uang_bayar: uangBayar
    };

    // Kirim data ke API checkout Flask
    fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataTransaksi)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || "Transaksi gagal."); });
            }
            return response.json();
        })
        .then(result => {
            if (result.status === 'success') {
                // Cetak struk digital menggunakan data kalkulasi resmi dari server
                cetakStrukDigital(
                    result.total_belanja,
                    result.diskon,
                    result.total_bayar,
                    result.uang_bayar,
                    result.kembalian
                );
            } else {
                errorEl.innerText = result.message || "Terjadi kesalahan pada transaksi.";
            }
        })
        .catch(err => {
            console.error("Error API Checkout:", err);
            errorEl.innerText = err.message || "Gagal terhubung ke server. Pastikan server Flask Anda sedang berjalan.";
        });
});

// cetak struk
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
document.getElementById('btn-transaksi-baru').addEventListener('click', function () {
    document.getElementById('receipt-card').style.display = 'none';
});

// login admin
const modalAdmin = document.getElementById('modal-admin');
const btnAdmin = document.getElementById('btn-admin');
const closeModal = document.getElementById('close-modal');
const modalDetail = document.getElementById('modal-detail-transaksi');
const closeModalDetail = document.getElementById('close-modal-detail');

// Buka Modal Admin
btnAdmin.addEventListener('click', function () {
    modalAdmin.style.display = 'flex';
    document.getElementById('admin-password').focus();
});

// Tutup Modal Admin via tombol silang (x)
closeModal.addEventListener('click', function () {
    tutupModalAdmin();
});

// Tutup Modal Detail Transaksi via tombol silang (x)
closeModalDetail.addEventListener('click', function () {
    modalDetail.style.display = 'none';
});

// Tutup modal jika user klik di luar area card modal
window.addEventListener('click', function (event) {
    if (event.target === modalAdmin) {
        tutupModalAdmin();
    }
    if (event.target === modalDetail) {
        modalDetail.style.display = 'none';
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
document.getElementById('admin-password').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        verifyAdminLogin();
    }
});

function verifyAdminLogin() {
    const passwordInput = document.getElementById('admin-password').value;
    const loginError = document.getElementById('admin-login-error');

    // Verifikasi password ke API backend Flask
    fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || "Password salah, silahkan ulangi!"); });
            }
            return response.json();
        })
        .then(result => {
            if (result.status === 'success') {
                loginError.innerText = '';

                // Sembunyikan form login, tunjukkan dashboard admin
                document.getElementById('admin-login-section').style.display = 'none';
                document.getElementById('admin-dashboard-section').style.display = 'block';

                // Ambil nominal pendapatan harian terbaru dari database
                ambilPemasukanAdmin();
                // Ambil riwayat transaksi terbaru dari database
                ambilRiwayatTransaksi();
            } else {
                loginError.innerText = result.body.message || "Password salah, silahkan ulangi!";
            }
        })
        .catch(err => {
            console.error("Error API Login:", err);
            loginError.innerText = err.message || "Gagal terhubung ke server.";
        });
}

// Fungsi pembantu untuk mengambil total pendapatan harian dari database
function ambilPemasukanAdmin() {
    fetch('/api/admin/transaksi')
        .then(response => {
            if (!response.ok) throw new Error("Gagal mengambil data transaksi.");
            return response.json();
        })
        .then(result => {
            if (result.status === 'success') {
                document.getElementById('text-pemasukan-admin').innerText = `Rp ${result.total_pemasukan.toLocaleString('id-ID')}`;
            }
        })
        .catch(err => {
            console.error("Error API Ambil Pemasukan:", err);
        });
}

// Global variable untuk menyimpan riwayat transaksi
let dataRiwayatGlobal = [];

// Fungsi pembantu untuk mengambil total riwayat transaksi
function ambilRiwayatTransaksi() {
    fetch('/api/admin/riwayat')
        .then(response => {
            if (!response.ok) throw new Error("Gagal mengambil riwayat transaksi.");
            return response.json();
        })
        .then(result => {
            if (result.status === 'success') {
                dataRiwayatGlobal = result.riwayat;
                const listRiwayat = document.getElementById('list-riwayat');
                listRiwayat.innerHTML = '';

                if (dataRiwayatGlobal.length === 0) {
                    listRiwayat.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 15px 0;">Belum ada transaksi hari ini</td></tr>`;
                    return;
                }

                dataRiwayatGlobal.forEach((tx, index) => {
                    listRiwayat.innerHTML += `
                        <tr>
                            <td style="font-size: 0.8rem;">${tx.tanggal}</td>
                            <td class="bold">Rp ${tx.total_bayar.toLocaleString('id-ID')}</td>
                            <td>
                                <button class="btn-detail-riwayat" onclick="tampilkanDetailTransaksi(${index})">🔍 Detail</button>
                            </td>
                        </tr>
                    `;
                });
            }
        })
        .catch(err => {
            console.error("Error API Riwayat:", err);
        });
}

// Menampilkan modal detail belanja dari index transaksi terpilih
function tampilkanDetailTransaksi(index) {
    const tx = dataRiwayatGlobal[index];
    if (!tx) return;

    const detailBody = document.getElementById('detail-transaksi-body');
    let itemsHTML = '';

    tx.items.forEach(item => {
        itemsHTML += `
            <div class="detail-item-spec">
                <span>${item.nama} (${item.jumlah}x)</span>
                <span>Rp ${(item.harga * item.jumlah).toLocaleString('id-ID')}</span>
            </div>
        `;
    });

    detailBody.innerHTML = `
        <div class="detail-row">
            <span>ID Transaksi:</span>
            <span class="bold">#${tx.id_transaksi}</span>
        </div>
        <div class="detail-row">
            <span>Waktu:</span>
            <span>${tx.tanggal}</span>
        </div>
        <div class="detail-row">
            <span>Status Member:</span>
            <span>${tx.is_member ? 'Ya (Member)' : 'Tidak'}</span>
        </div>
        <hr style="border-color: rgba(255,255,255,0.05); margin: 10px 0;">
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">Daftar Item Belanja:</p>
        <div class="detail-items-list">
            ${itemsHTML}
        </div>
        <hr style="border-color: rgba(255,255,255,0.05); margin: 10px 0;">
        <div class="detail-row">
            <span>Total Belanja:</span>
            <span>Rp ${tx.total_belanja.toLocaleString('id-ID')}</span>
        </div>
        <div class="detail-row">
            <span>Diskon:</span>
            <span class="text-success">- Rp ${tx.diskon.toLocaleString('id-ID')}</span>
        </div>
        <div class="detail-row bold">
            <span>Total Bayar:</span>
            <span>Rp ${tx.total_bayar.toLocaleString('id-ID')}</span>
        </div>
        <div class="detail-row">
            <span>Uang Bayar:</span>
            <span>Rp ${tx.uang_bayar.toLocaleString('id-ID')}</span>
        </div>
        <div class="detail-row bold text-success">
            <span>Kembalian:</span>
            <span>Rp ${tx.kembalian.toLocaleString('id-ID')}</span>
        </div>
    `;

    document.getElementById('modal-detail-transaksi').style.display = 'flex';
}

// Tombol Reset Pemasukan Admin
document.getElementById('btn-reset-pemasukan').addEventListener('click', function () {
    if (confirm("Apakah Anda yakin ingin mereset total pemasukan hari ini menjadi Rp0?")) {
        fetch('/api/admin/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => {
                if (!response.ok) throw new Error("Gagal mereset pendapatan di server.");
                return response.json();
            })
            .then(result => {
                if (result.status === 'success') {
                    document.getElementById('text-pemasukan-admin').innerText = "Rp 0";
                    // Reload data riwayat transaksi
                    ambilRiwayatTransaksi();
                    alert(result.message || "Total berhasil direset!!");
                } else {
                    alert("Gagal mereset: " + result.message);
                }
            })
            .catch(err => {
                console.error("Error API Reset:", err);
                alert(err.message || "Gagal mereset pendapatan. Terjadi kesalahan jaringan.");
            });
    }
});

// Keluar dari Akun Admin (Logout)
document.getElementById('btn-logout-admin').addEventListener('click', function () {
    tutupModalAdmin();
});
