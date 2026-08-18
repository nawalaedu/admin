/************************************************************
 * ADMIN MANAGEMENT - GOOGLE APPS SCRIPT API
 *
 * Arsitektur:
 * GitHub Pages HTML -> JSONP -> Apps Script -> Google Sheets
 ************************************************************/

const CONFIG = {
  API_KEY: 'GANTI_API_KEY_ANDA',

  DB: {
    BUKU: '1wloSgV44Alewr6qubwO2_oqjqT3Dbqmd9NBMKhgPBIw',
    ARTIKEL: '14oEPpJJ_6G76rkVJtKDX7MgxPVHZIBzUvpvghv7iZhw',
    DATA: '1CWswwCkaGGhaNWJ31RSyd3O8EctNhySxu_oCW9TKRas',
    IJP: '1jBpSJaYwLX6oLAzSh4AO7G0-KcZjXhDnDBesSDjwEwo'
  },

  SHEET: {
    BUKU_ORDER: 'ORDER BUKU',
    BUKU_AUTHOR: 'AUTHOR BUKU',
    BUKU_INVOICE: 'INVOICE BUKU',
    BUKU_ISBN: 'ISBN',
    BUKU_HKI: 'HKI',
    BUKU_HASIL: 'HASIL BUKU',

    ART_ORDER: 'ORDER ARTIKEL',
    ART_AUTHOR: 'AUTHOR ARTIKEL',
    ART_INVOICE: 'INVOICE ARTIKEL',
    ART_HASIL: 'HASIL ARTIKEL',

    DATA_ORDER: 'ORDER DATA',
    DATA_INVOICE: 'INVOICE DATA',
    DATA_HASIL: 'HASIL DATA',

    IJP_ORDER: 'ORDER IJP',
    IJP_AUTHOR: 'AUTHOR IJP',
    IJP_INVOICE: 'INVOICE IJP',
    IJP_HASIL: 'HASIL IJP'
  }
};

function doGet(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};

    if (p.action === 'ping') {
      return jsonp({ success: true, message: 'API aktif' }, p.callback);
    }

    if (p.key !== CONFIG.API_KEY) {
      return jsonp({ success: false, message: 'API KEY tidak valid' }, p.callback);
    }

    const method = String(p.method || '');

    if (!method) {
      return jsonp({ success: false, message: 'Method kosong' }, p.callback);
    }

    let args = [];
    if (p.data) {
      args = JSON.parse(decodeURIComponent(p.data));
      if (!Array.isArray(args)) args = [args];
    }

    const result = dispatch(method, args);
    return jsonp(result, p.callback);

  } catch (err) {
    return jsonp({ success: false, message: err.message }, e && e.parameter ? e.parameter.callback : 'callback');
  }
}

function jsonp(data, callback) {
  callback = String(callback || 'callback').replace(/[^A-Za-z0-9_$]/g, '');
  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(data) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function dispatch(method, args) {
  switch (method) {
    case 'ambilDaftarOrder':
      return getGenericOrderList(args[0]);
    case 'ambilDetailOrder':
      return getGenericOrderDetail(args[0]);

    case 'simpanOrder':
      return saveOrderGeneric(args[0]);
    case 'simpanAuthor':
      return saveAuthorGeneric(args[0]);
    case 'simpanInvoice':
      return save(CONFIG.DB.BUKU, CONFIG.SHEET.BUKU_INVOICE, args[0], 'INV/BUK/');

    case 'ambilDaftarOrderBuku':
      return getOrderList(CONFIG.DB.BUKU, CONFIG.SHEET.BUKU_ORDER);
    case 'ambilDetailOrderBuku':
      return getOrderDetail(CONFIG.DB.BUKU, CONFIG.SHEET.BUKU_ORDER, args[0]);
    case 'ambilOrderUntukInvoice':
      return getOrderForInvoice(CONFIG.DB.BUKU, CONFIG.SHEET.BUKU_ORDER, CONFIG.DB.BUKU, CONFIG.SHEET.BUKU_AUTHOR, args[0], 'buku');
    case 'ambilDetailAuthor':
      return getAuthorDetail(CONFIG.DB.BUKU, CONFIG.SHEET.BUKU_AUTHOR, args[0]);

    case 'simpanISBN':
      return save(CONFIG.DB.BUKU, CONFIG.SHEET.BUKU_ISBN, args[0], 'ISBN/');
    case 'simpanHKI':
      return save(CONFIG.DB.BUKU, CONFIG.SHEET.BUKU_HKI, args[0], 'HKI/');
    case 'simpanHasilBuku':
      return save(CONFIG.DB.BUKU, CONFIG.SHEET.BUKU_HASIL, args[0], 'HAS/BUK/');

    case 'ambilDaftarOrderArtikel':
      return getOrderList(CONFIG.DB.ARTIKEL, CONFIG.SHEET.ART_ORDER);
    case 'ambilDetailOrderArtikel':
      return getOrderDetail(CONFIG.DB.ARTIKEL, CONFIG.SHEET.ART_ORDER, args[0]);
    case 'ambilOrderArtikelUntukInvoice':
      return getOrderForInvoice(CONFIG.DB.ARTIKEL, CONFIG.SHEET.ART_ORDER, CONFIG.DB.ARTIKEL, CONFIG.SHEET.ART_AUTHOR, args[0], 'artikel');
    case 'ambilDetailPenulisArtikel':
      return getAuthorDetail(CONFIG.DB.ARTIKEL, CONFIG.SHEET.ART_AUTHOR, args[0], 'artikel');
    case 'simpanInvoiceArtikel':
      return save(CONFIG.DB.ARTIKEL, CONFIG.SHEET.ART_INVOICE, args[0], 'INV/ART/');
    case 'simpanRisetArtikel':
      return save(CONFIG.DB.ARTIKEL, CONFIG.SHEET.ART_HASIL, args[0], 'HAS/ART/');

    case 'ambilDaftarOrderData':
    case 'ambilDaftarOrderOlahData':
      return getOrderList(CONFIG.DB.DATA, CONFIG.SHEET.DATA_ORDER);
    case 'ambilDetailOrderOlahData':
    case 'ambilDetailOrderData':
      return getOrderDetail(CONFIG.DB.DATA, CONFIG.SHEET.DATA_ORDER, args[0]);
    case 'ambilOrderDataUntukInvoice':
      return getOrderDetail(CONFIG.DB.DATA, CONFIG.SHEET.DATA_ORDER, args[0]);
    case 'simpanInvoiceOlahData':
      return save(CONFIG.DB.DATA, CONFIG.SHEET.DATA_INVOICE, args[0], 'INV/DATA/');
    case 'simpanHasilData':
      return save(CONFIG.DB.DATA, CONFIG.SHEET.DATA_HASIL, args[0], 'HAS/DATA/');

    case 'ambilDaftarOrderIJP':
      return getOrderList(CONFIG.DB.IJP, CONFIG.SHEET.IJP_ORDER);
    case 'ambilDetailOrderIJP':
      return getOrderDetail(CONFIG.DB.IJP, CONFIG.SHEET.IJP_ORDER, args[0]);
    case 'ambilOrderIJPUntukInvoice':
      return getOrderForInvoice(CONFIG.DB.IJP, CONFIG.SHEET.IJP_ORDER, CONFIG.DB.IJP, CONFIG.SHEET.IJP_AUTHOR, args[0], 'ijp');
    case 'ambilDetailPenulisIJP':
      return getAuthorDetail(CONFIG.DB.IJP, CONFIG.SHEET.IJP_AUTHOR, args[0], 'ijp');
    case 'simpanOrderIJP':
      return save(CONFIG.DB.IJP, CONFIG.SHEET.IJP_ORDER, args[0], 'ORD/IJP/');
    case 'simpanAuthorIJP':
      return saveAuthorIJP(args[0]);
    case 'simpanInvoiceIJP':
      return save(CONFIG.DB.IJP, CONFIG.SHEET.IJP_INVOICE, args[0], 'INV/IJP/');
    case 'simpanHasilIJP':
      return save(CONFIG.DB.IJP, CONFIG.SHEET.IJP_HASIL, args[0], 'HAS/IJP/');

    default:
      throw new Error('Method tidak terdaftar: ' + method);
  }
}


function getGenericOrderList(page) {
  page = String(page || 'buku');
  if (page === 'artikel') return getOrderList(CONFIG.DB.ARTIKEL, CONFIG.SHEET.ART_ORDER);
  if (page === 'data') return getOrderList(CONFIG.DB.DATA, CONFIG.SHEET.DATA_ORDER);
  return getOrderList(CONFIG.DB.BUKU, CONFIG.SHEET.BUKU_ORDER);
}

function getGenericOrderDetail(request) {
  request = request || {};
  const page = String(request._page || 'buku');
  const idOrder = request.idOrder || request.id || request.value;
  if (page === 'artikel') return getOrderDetail(CONFIG.DB.ARTIKEL, CONFIG.SHEET.ART_ORDER, idOrder);
  if (page === 'data') return getOrderDetail(CONFIG.DB.DATA, CONFIG.SHEET.DATA_ORDER, idOrder);
  return getOrderDetail(CONFIG.DB.BUKU, CONFIG.SHEET.BUKU_ORDER, idOrder);
}

function saveOrderGeneric(data) {
  data = Object.assign({}, data || {});
  const page = normalizePage(data);
  delete data._page;
  if (page === 'artikel') return save(CONFIG.DB.ARTIKEL, CONFIG.SHEET.ART_ORDER, data, 'ORD/ART/');
  if (page === 'data') return save(CONFIG.DB.DATA, CONFIG.SHEET.DATA_ORDER, data, 'ORD/DATA/');
  return save(CONFIG.DB.BUKU, CONFIG.SHEET.BUKU_ORDER, data, 'ORD/BUK/');
}

function saveAuthorGeneric(data) {
  data = Object.assign({}, data || {});
  const page = normalizePage(data);
  delete data._page;
  if (page === 'artikel') return saveAuthorTo(CONFIG.DB.ARTIKEL, CONFIG.SHEET.ART_AUTHOR, data, 'AUT/ART/');
  return saveAuthorTo(CONFIG.DB.BUKU, CONFIG.SHEET.BUKU_AUTHOR, data, 'AUT/BUK/');
}

function saveAuthorIJP(data) {
  return saveAuthorTo(CONFIG.DB.IJP, CONFIG.SHEET.IJP_AUTHOR, data, 'AUT/IJP/');
}

function saveAuthorTo(db, sheetName, data, prefix) {
  data = data || {};
  data.idAuthor = data.idAuthor || nextId(db, sheetName, prefix);

  const author = data.author || {};
  const flat = Object.assign({}, data);
  delete flat.author;

  Object.keys(author).forEach(k => {
    flat['author_' + k] = author[k];
  });

  return appendObject(db, sheetName, flat);
}

function save(db, sheetName, data, prefix) {
  data = Object.assign({}, data || {});

  if (!data.idOrder && /^ORD\//.test(prefix)) data.idOrder = nextId(db, sheetName, prefix);
  if (!data.idInvoice && /^INV\//.test(prefix)) data.idInvoice = nextId(db, sheetName, prefix);
  if (!data.idHasil && /^HAS\//.test(prefix)) data.idHasil = nextId(db, sheetName, prefix);
  if (!data.idISBN && /^ISBN\//.test(prefix)) data.idISBN = nextId(db, sheetName, prefix);
  if (!data.idHKI && /^HKI\//.test(prefix)) data.idHKI = nextId(db, sheetName, prefix);

  return appendObject(db, sheetName, data);
}

function appendObject(db, sheetName, data) {
  const sheet = getSheet(db, sheetName);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    let headers = sheet.getLastColumn() ? sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0] : [];

    Object.keys(data).forEach(k => {
      if (headers.indexOf(k) === -1) headers.push(k);
    });

    if (!headers.length) throw new Error('Tidak ada data untuk disimpan');

    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold');

    const row = headers.map(h => serialize(data[h]));
    const rowNumber = sheet.getLastRow() + 1;
    sheet.getRange(rowNumber,1,1,row.length).setValues([row]);

    return Object.assign({ success:true, row:rowNumber }, data);
  } finally {
    lock.releaseLock();
  }
}

function serialize(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

function getSheet(db, sheetName) {
  const ss = SpreadsheetApp.openById(db);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  return sheet;
}

function getRows(db, sheetName) {
  const sheet = getSheet(db, sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(String);
  return values.slice(1).filter(row => row.some(v => v !== '')).map(row => {
    const obj = {};
    headers.forEach((h,i) => obj[h] = row[i]);
    return obj;
  });
}

function getOrderList(db, sheetName) {
  return getRows(db, sheetName).filter(x => x.idOrder);
}

function getOrderDetail(db, sheetName, idOrder) {
  if (!idOrder) return null;
  return getRows(db, sheetName).find(x => String(x.idOrder) === String(idOrder)) || null;
}

function getAuthorDetail(db, sheetName, idAuthor, type) {
  if (!idAuthor) return null;
  const row = getRows(db, sheetName).find(x => String(x.idAuthor) === String(idAuthor));
  if (!row) return null;

  return {
    idAuthor: row.idAuthor,
    idOrder: row.idOrder,
    namaAuthor: row.author_nama || row.namaAuthor || row.nama || '',
    namaPenulis: row.author_nama || row.namaPenulis || row.nama || '',
    penulisKe: row.author_urutanPenulis || row.penulisKe || row.urutanPenulis || '',
    urutan: row.author_urutanPenulis || row.penulisKe || row.urutanPenulis || '',
    email: row.author_email || row.email || '',
    telp: row.author_telp || row.telp || '',
    afiliasi: row.author_afiliasi || row.afiliasi || '',
    bab: row.author_bab || row.bab || ''
  };
}

function getOrderForInvoice(orderDb, orderSheet, authorDb, authorSheet, idOrder, type) {
  const order = getOrderDetail(orderDb, orderSheet, idOrder);
  if (!order) return null;

  const authors = getRows(authorDb, authorSheet)
    .filter(x => String(x.idOrder) === String(idOrder))
    .map((x, i) => ({
      idAuthor: x.idAuthor,
      namaAuthor: x.author_nama || x.namaAuthor || x.authorNama || x.namaPenulis || x.nama || '',
      namaPenulis: x.author_nama || x.namaPenulis || x.nama || '',
      penulisKe: x.author_urutanPenulis || x.penulisKe || x.urutanPenulis || (i+1),
      urutan: x.author_urutanPenulis || x.penulisKe || x.urutanPenulis || (i+1),
      bab: x.author_bab || x.bab || ''
    }));

  const result = Object.assign({}, order, { authors: authors });
  result.judulBuku = result.judulBuku || result.judul || '';
  result.judulArtikel = result.judulArtikel || result.judul || '';
  result.judulIJP = result.judulIJP || result.judulArtikel || result.judul || '';
  return result;
}

function nextId(db, sheetName, prefix) {
  const rows = getRows(db, sheetName);
  let max = 0;
  rows.forEach(r => {
    Object.keys(r).forEach(k => {
      const v = String(r[k] || '');
      if (v.indexOf(prefix) === 0) {
        const n = parseInt(v.substring(prefix.length), 10);
        if (!isNaN(n)) max = Math.max(max, n);
      }
    });
  });
  return prefix + String(max + 1).padStart(4, '0');
}

function normalizePage(data) {
  return data && data._page ? String(data._page) : 'buku';
}
