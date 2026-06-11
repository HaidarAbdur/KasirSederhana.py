print('Kasir Sederhana')
total_harian = 0

def menu_utama():
   print('======Menu Kasir======\n')
   print('1.Mulai transaksi')
   print('2.Riwayat transaksi hari ini')
   print('3.Admin')
   print('4.Keluar')
   return input('Silahkan pilih menu program[1/2/3/4]: \n')
   # =========================== Menu 1 ================================

def menu_admin(total_harian):
   password = 'admin123'
   print('======Menu Admin======\n')
   pw = input('Masukan password: ')
   if pw != password:
      print('Password salah,silahkan ulangi!')
      return total_harian
   
   while True:
      print('\n1.Total pemasukan')
      print('2.Reset Total pemasukan')
      print('3.Kembali')
      pilih = input('Silahkan pilih menu 1/2/3: ')
      if pilih == "1":
            print(f'total pemasukan hari ini: Rp{total_harian:.2f}')
      elif pilih == "2":
         total_harian = 0
         print('Total berhasil direset!!')
         continue
      elif pilih == "3":
         print('Kembali ke menu utama...')
         break
      else:
         print('Input tidak valid')
         continue
   return total_harian

def transaksi(): 
  daftar_barang = []
  total_belanja = 0

  while True:
         nama = input('Masukan nama barang :')
         try:
            
         # validasi harga
            harga = float(input ('Masukan harga barang: '))
            jumlah = int(input('Masukan jumlah barang: '))

            if harga <=0 or jumlah <=0:
               print('Harga & jumlah harus lebih dari 0!')
               continue 

         except ValueError: 
            print('Input harus angka!')
            continue

         subtotal = harga*jumlah
         total_belanja += subtotal
         daftar_barang.append((nama,harga,jumlah,subtotal))
         while True:
            tambah_barang = input('Apakah ingin menambahkan barang?[y/n]: ').lower()
            if tambah_barang == "y":  
               break
            elif tambah_barang == 'n':
               print('transaksi selesai!')
            print(f'Total belanja anda sebesar Rp.{total_belanja:.2f}')
            return total_belanja,daftar_barang
         else:
            print('Masukan input yang sesuai!!')
            
   # total belanja
   # ========================== Menu 2 ==============================
def hitung_diskon(total_belanja):
    potongan = 0

    while True:
        member = input('Apakah anda memiliki kartu member? [y/n]: ').lower()

        if member == "y":
            if total_belanja >= 100000:
                potongan = total_belanja * 0.07
                print('Mendapatkan diskon 7%')
            elif total_belanja >= 50000:
                potongan = total_belanja * 0.05
                print('Mendapatkan diskon 5%')
            else:
                print('Belum memenuhi syarat diskon')
            break

        elif member == "n":
            print('Tidak mendapatkan diskon')
            break

        else:
            print('Input tidak valid!')
            continue

    return potongan

         

def pembayaran(total_bayar):
   while True:
      #input uang bayar
      kembalian = 0
      uang_bayar = input('Masukan uang bayar: ')
      if not uang_bayar.isdigit():
         print('Input hanya boleh angka!!')
         continue

      uang_bayar = int(uang_bayar)

      if uang_bayar < total_bayar:
         print('Uang tidak cukup!!')
         continue

      elif uang_bayar == total_bayar:
         print('Uang pas,terimakasih')
         kembalian = 0
         return uang_bayar,kembalian
      else:
         kembalian =uang_bayar-total_bayar
         break
   return uang_bayar,kembalian
         

      # struk belanja
def struk_belanja(daftar_barang,total_belanja,potongan,total_bayar,uang_bayar,kembalian):
   print('\n======Struk Belanja======')
   for b in daftar_barang:
      print(f'{b[0]} | {b[2]} x {b[1]}= Rp.{b[3]:.2f}')
   print(f'Total belanja : Rp.{total_belanja:.2f}')
   print(f'Diskon : Rp.{potongan:.2f}')
   print(f'Total bayar : Rp.{total_bayar:.2f}')
   print(f'Uang bayar : Rp.{uang_bayar:.2f}')
   print(f'Kembalian : Rp.{kembalian:.2f}')
   print('Terimakasih🙏')


def program_kasir():
   global total_harian

   while True:
      menu = menu_utama()

      if menu == '1':
         total_belanja,daftar_barang = transaksi()
         potongan = hitung_diskon(total_belanja)
         total_bayar = total_belanja-potongan
         uang_bayar,kembalian = pembayaran(total_bayar)
         
         struk_belanja(daftar_barang,total_belanja,potongan,total_bayar,uang_bayar,kembalian)
            
         total_harian += total_bayar

      elif menu == '2':
          print (f'total pemasukan hari ini: Rp{total_harian:.2f}')
      
      elif menu == '3':
        total_harian = menu_admin(total_harian)
        
      elif menu == '4':
         print('Kasir ditutup👋')
         break
      else:
         print('Input tidak valid')
         break
program_kasir()
