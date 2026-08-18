/* ==========================================================
   GitHub Pages -> Google Apps Script compatibility layer

   HTML lama menggunakan google.script.run.
   File ini membuat google.script.run tersedia kembali di
   GitHub Pages, tetapi request-nya dikirim ke Web App GAS.
   ========================================================== */

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbyKiFoHDndz1UKjfaUdqCu-Ws8vhmOwEjzQljfQkFZb-kU28csjZgt4bvSL5IqhklUnRA/exec';
const GAS_API_KEY = 'ADMIN-515KA';

(function () {
  let successHandler = null;
  let failureHandler = null;

  function currentPage() {
    const p = (location.pathname || '').toLowerCase();
    if (p.includes('artikel')) return 'artikel';
    if (p.includes('ijp')) return 'ijp';
    if (p.includes('data')) return 'data';
    return 'buku';
  }

  function callGas(method, args) {
    let payload = args || [];

    // Method generic perlu mengetahui halaman asal.
    if (method === 'simpanOrder' || method === 'simpanAuthor') {
      payload = [Object.assign({}, args[0] || {}, { _page: currentPage() })];
    }

    if (method === 'ambilDaftarOrder') {
      payload = [currentPage()];
    }

    if (method === 'ambilDetailOrder') {
      payload = [{ idOrder: args[0], _page: currentPage() }];
    }

    return new Promise(function (resolve, reject) {
      const cb = '__gas_cb_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
      const script = document.createElement('script');
      let timer;

      function cleanup() {
        clearTimeout(timer);
        delete window[cb];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[cb] = function (result) {
        cleanup();
        if (result && result.success === false) {
          reject(new Error(result.message || 'Google Apps Script error'));
          return;
        }
        resolve(result);
      };

      script.onerror = function () {
        cleanup();
        reject(new Error('Tidak dapat menghubungi Google Apps Script'));
      };

      timer = setTimeout(function () {
        cleanup();
        reject(new Error('Request ke Google Apps Script timeout'));
      }, 30000);

      const params = new URLSearchParams();
      params.set('key', GAS_API_KEY);
      params.set('method', method);
      params.set('callback', cb);
      params.set('data', encodeURIComponent(JSON.stringify(payload)));

      script.src = GAS_API_URL + '?' + params.toString();
      document.head.appendChild(script);
    });
  }

  const runProxy = new Proxy({}, {
    get: function (_, method) {
      if (method === 'withSuccessHandler') {
        return function (fn) {
          successHandler = fn;
          return runProxy;
        };
      }

      if (method === 'withFailureHandler') {
        return function (fn) {
          failureHandler = fn;
          return runProxy;
        };
      }

      return function () {
        const args = Array.prototype.slice.call(arguments);
        const s = successHandler;
        const f = failureHandler;
        successHandler = null;
        failureHandler = null;

        callGas(method, args)
          .then(function (result) {
            if (typeof s === 'function') s(result);
          })
          .catch(function (error) {
            if (typeof f === 'function') f(error);
            else console.error(error);
          });
      };
    }
  });

  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = runProxy;
})();
