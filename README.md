# gwcatat v2 — Catatan & Keuangan Pribadi (iOS 18 Native Style)

Aplikasi pencatatan keuangan pribadi lokal (*offline-first*) yang dirancang mengadopsi standar **Apple Human Interface Guidelines (HIG)** bergaya **iOS 18 Native App Store / Widget Style**.

Dibuat sebagai versi **v2 lokal** tanpa halaman login (*zero-login wall*), cepat, privat, dan aman.

---

## ✨ Fitur Utama

1. **Desain iOS 18 Native Widget & App Store Style**:
   - Latar belakang abu-abu lembut khas iOS (`#f2f2f7` / `#000000`).
   - Kartu putih susu (*milk-white squircle 20px*) dengan *soft multi-layer shadow*.
   - Ikon kategori bergradien segar ala aplikasi iPhone (Sunset Coral, Ocean Mint, Fresh Green, Deep Electric Blue, Royal Purple).
   - Efek kompresi pegas haptik pada sentuhan (`transform: scale(0.97)`).
   - *iOS Segmented Controls* dan *iOS Floating Bottom Dock* untuk pengalaman HP yang sangat organik.
   - *Dynamic Island Toast Notification* di bagian atas layar.

2. **Tanpa Halaman Login (100% Lokal & Privat)**:
   - Langsung terbuka ke dasbor keuangan utama tanpa perlu mendaftar atau login akun.
   - Data tersimpan langsung di browser Anda melalui `localStorage`.
   - Mendukung pencadangan (*backup*) dan pemulihan (*restore*) berformat JSON secara offline.

3. **Mesin Finansial 50 / 30 / 20**:
   - Visualisasi alokasi otomatis:
     - **50% Kebutuhan Pokok** (makan, bensin, kos, tagihan).
     - **30% Keinginan** (belanja, nongkrong, hobi).
     - **20% Simpanan & Investasi** (tabungan masa depan, dana darurat).

4. **5 Indikator Kesehatan Finansial Interaktif**:
   - Rasio Tabungan (Target: $\ge$ 20%).
   - Rasio Gaya Hidup (Target: $\le$ 30%).
   - Daya Tahan Likuiditas Kas (Target: $\ge$ 3 bulan).
   - Kesiapan Dana Darurat (Target: 80%–100%).
   - Rasio Beban Utang (*Debt Service Ratio* $\le$ 30%).

5. **Laporan Keuangan Standar SAK EMKM & Ekspor Excel (5 Sheet)**:
   - Laporan Laba Rugi (Pendapatan vs Beban vs Laba Bersih & Margin).
   - Neraca Sederhana (Aset vs Utang + Ekuitas Modal Bersih dengan validasi seimbang).
   - Rincian Arus Kas harian dengan kalkulasi saldo dinamis.
   - Jurnal Umum otomatis (pembukuan berpasangan Debit & Kredit).
   - Ekspor berkas Excel `.xlsx` 5 Sheet dalam satu klik via SheetJS.

---

## 🚀 Cara Menjalankan

Buka berkas `index.html` langsung di browser favorit Anda (Google Chrome, Safari, Edge, Firefox), atau gunakan ekstensi Live Server / server statis:

```bash
# Opsi 1: Buka langsung di Windows
start index.html

# Opsi 2: Menggunakan server lokal sederhana (misal npx serve atau python)
npx serve .
# atau
python -m http.server 3000
```
