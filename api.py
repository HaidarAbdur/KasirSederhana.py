# pyrefly: ignore [missing-import]
from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime
import json

DATABASE = 'kasir.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

app = Flask(__name__)

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS transaksi (
        id_transaksi INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal TEXT NOT NULL,
        items TEXT,
        total_belanja INTEGER,
        is_member INTEGER,
        diskon INTEGER,
        total_bayar INTEGER,
        uang_bayar INTEGER,
        kembalian INTEGER
    )
    """)
    conn.commit()
    conn.close()
    

@app.route('/')
def index():
   return render_template('index.html')

@app.route('/api/checkout', methods=['POST'])
def checkout():
    total_belanja = 0
    diskon = 0
    total_bayar = 0
    kembalian = 0
    try:
        # mengambil data json dari client
        data = request.get_json()
        print("DEBUG: Data Diterima:", data)
        items = data.get('items', [])
        is_member = data.get('is_member', False)
        uang_bayar = data.get('uang_bayar', 0)
        # menghitung total belanja
        if not items or len(items) == 0:
            return jsonify({'status':'error', 'message':'Keranjang masih kosong, silahkan tambahkan barang'}), 400
        elif not isinstance(uang_bayar, (int, float)) or uang_bayar <= 0:
            return jsonify({'status':'error', 'message':'Uang bayar tidak valid, harus berupa angka'}), 400
        for item in items:
            total_belanja += item['harga'] * item['jumlah']
        
        # menghitung diskon
        if is_member == True:
            if total_belanja >=100000:
                diskon = total_belanja *0.07
            elif total_belanja >=50000:
                diskon = total_belanja *0.05   
            else:
                diskon = 0
        # total bayar dan kembalian
        total_bayar = total_belanja - diskon
        if uang_bayar >= total_bayar:
            kembalian = uang_bayar - total_bayar
        else:
            return jsonify({'status':'error', 'message':'Uang bayar kurang!'}), 400
        # simpan ke database
        conn = get_db()
        cur = conn.cursor()
        tanggal = datetime.now().strftime("%Y-%m-%d %H:%M:%S")   
        cur.execute("""
          INSERT INTO transaksi (tanggal, items, total_belanja, is_member, diskon, total_bayar, uang_bayar, kembalian)
          VALUES(?, ?, ?, ?, ?, ?, ?, ?)""",(tanggal, json.dumps(items), total_belanja, 1 if is_member else 0, diskon, total_bayar, uang_bayar, kembalian))
        conn.commit()
        conn.close()

        return jsonify({
            'status': 'success',
            'tanggal': tanggal,
            'total_belanja': total_belanja,
            'is_member': is_member,
            'diskon': diskon,
            'total_bayar': total_bayar,
            'uang_bayar': uang_bayar,
            'kembalian': kembalian
        }), 200
    except Exception as e:
        return jsonify({'status':'error', 'message':str(e)}), 500

# login admin
@app.route('/api/admin/login', methods = ['POST'])
def login():
    password = 'admin123'
    data = request.get_json()
    input_password = data.get('password', '')
    if input_password == password:
        return jsonify({'status': 'success', 'message': 'Login Berhasil'}), 200
    else:
        return jsonify({'status': 'error', 'message': 'Password Salah'}), 400


@app.route('/api/admin/transaksi', methods = ['GET'])
def get_pemasukan():
    conn = get_db()
    cur = conn.cursor()
    tanggal_hariini = datetime.now().strftime("%Y-%m-%d")
    cur.execute(""" SELECT COALESCE(SUM(total_bayar), 0) as total FROM transaksi WHERE tanggal LIKE ? """, (tanggal_hariini + '%',))
                
    result = cur.fetchone()
    total_pemasukan = result['total']
    conn.close()
    return jsonify({'status':'success', 'total_pemasukan':total_pemasukan}), 200
        
        
@app.route('/api/admin/reset', methods = ['POST'])
def reset():
    conn = get_db()
    cur = conn.cursor()
    tanggal_hariini = datetime.now().strftime("%Y-%m-%d")
    cur.execute("DELETE FROM transaksi WHERE tanggal LIKE ?", (tanggal_hariini + '%',))
    conn.commit()
    conn.close()
    return jsonify({'status':'success', 'message':'Berhasil melakukan reset'}), 200

@app.route('/api/admin/riwayat', methods = ['GET'])
def riwayat():
    list_transaksi = []
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM transaksi ORDER BY id_transaksi DESC")
        rows = cur.fetchall()
        for row in rows:
            transaksi_dict = dict(row)
            if "items" in transaksi_dict and transaksi_dict["items"]:
                transaksi_dict["items"] = json.loads(transaksi_dict["items"])
            list_transaksi.append(transaksi_dict)
        conn.close()
        return jsonify({'status': 'success', 'riwayat': list_transaksi}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
            

        


        

# def diskon_member(total_belanja,is_member,uang_bayar):
#     diskon = 0
#     if is_member=="true":
#         if total_belanja >= 100000:
#             diskon = total_belanja * 0.07
#         elif total_belanja >= 50000:
#             diskon = total_belanja * 0.05
#         else:
#             diskon = 0
#         total_bayar = total_belanja - diskon
#         kembalian =  uang_bayar - total_bayar
#         return jsonify({'status': 'success', 'diskon': diskon, 'total_bayar': total_bayar, 'uang_bayar':uang_bayar,'kembalian': kembalian}), 200
#     else:
#         return jsonify({'status': 'error'}), 400

# def simpan_transaksi(items):
#     try:
#         conn = get_db()
#         cur = conn.cursor()
#         tanggal = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#         cur.execute("INSERT INTO transaksi(tanggal,id_transaksi,total_belanja,diskon,total_bayar,uang_bayar,kembalian)")
#         id_transaksi = cur.lastrowid()
#         conn.commit()
#         conn.close()
#         return jsonify({'status': 'success'}), 200
#     except:
#         conn.rollback()
#         return jsonify({'status': 'error'}), 500

