print('======Kasir Sederhana======\n')
total_harian = 0
while True:
   print('======Menu Kasir======\n')
   print('1.Mulai transaksi')
   print('2.Riwayat transaksi hari ini')
   print('3.Keluar')
   menu = input('Silahkan pilih menu program[1/2/3]: ')
   # =========================== Menu 1 ================================
   if menu == '1':
    total_belanja = 0
    while True:
         try:
         # validasi harga
            input_barang = input('Masukan nama barang :')
            harga = float(input ('Masukan harga barang: '))
            jumlah = int(input('Masukan jumlah barang: '))
            if harga <=0 or jumlah <=0:
               print('Harga & jumlah harus lebih dari 0!')
               continue 

         except ValueError: 
            print('Input harus angka!')
            continue
         subtotal = harga*jumlah
         total_belanja = total_belanja+subtotal
         print(f"subtotal: {subtotal:.2f}")
            
         tambah_barang = input('Apakah ingin menambahkan barang?[y/n]: ').lower()
         if tambah_barang == "n":
            break
         elif tambah_barang != 'y':
            print('Input tidak valid')

         # total belanja
         print(f'Total belanja anda sebesar Rp.{total_belanja:.2f}')
   # ========================== Menu 2 ==============================
   elif menu == '2': 
      total_harian = total_harian + subtotal
      print(f'Total pemasukan hari ini Rp.{total_harian:.2f}')
      continue
         # ========================== Menu 3 ==============================
   elif menu == '3':
      print('Terimakasih,kasir ditutup😊')
      break
         #  ========================= Input salah ==========================
   else:
      print('Input tidak valid!!')
      continue 

    
   diskon = 0
   while True:
         member = input('Apakah anda memiliki kartu member?[y/n]: ').lower()
         if member == "y":
          if total_belanja >=100000:        
               diskon = total_belanja*7/100
               print('Mendapatkan diskon 7%')
         elif total_belanja >=50000:
               diskon = total_belanja*5/100
               print('Mendapatkan diskon 5%')
         elif member == "n":
            diskon = 0
            print('Diskon tidak tersedia!')
         else:
            print('input tidak valid')
            continue
         break
         


   while True:
      #input uang bayar
      kembalian = 0
      total_bayar = subtotal-diskon
      uang_bayar = input('Masukan uang bayar: ')
      if not uang_bayar.isdigit():
         print('Input hanya boleh angka!!')
         continue
      uang_bayar = int(uang_bayar)

      if uang_bayar < total_bayar:
         print('Uang tidak cukup!!')
      elif uang_bayar == total_bayar:
         print('Uang pas,terimakasih')
         kembalian = 0
      else:
         kembalian =uang_bayar-total_bayar
         print(f'Uang kembalian: Rp.{kembalian:.2f}')
         

      # struk belanja
      if uang_bayar < total_bayar :
         print()
      else:
            print('\n======Struk Belanja======')
            print(f'nama barang: {input_barang}')
            print(f'harga barang: Rp.{harga:.2f}')
            print(f'jumlah barang: {jumlah}')
            print(f'total awal: Rp.{total_belanja:.2f}')
            print(f'diskon: Rp.{diskon:.2f}')
            print(f'total bayar: Rp.{total_bayar:.2f}')
            print(f'Uang kembalian: Rp.{kembalian}') 
            print('Terimakasih telah berbelanja😊🙏📋\n')
            break