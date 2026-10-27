// Dijalankan sebelum halaman digambar (tanpa menunggu aplikasi):
// 1) pasang tema tersimpan agar tidak berkedip, 2) tandai jika ada sesi login,
// sehingga index.html menampilkan layar "Menyiapkan…" alih-alih halaman masuk pre-render.
(function () {
  var d = document.documentElement;
  try {
    var t = localStorage.getItem('ruang-baca-theme');
    if (t) d.setAttribute('data-theme', t);
  } catch (e) {}
  try {
    var s = /access_token=|refresh_token=|type=recovery|[?&]code=/.test(location.hash + location.search);
    [localStorage, sessionStorage].forEach(function (st) {
      for (var i = 0; i < st.length; i++) if (/^sb-.*-auth-token$/.test(st.key(i) || '')) s = true;
    });
    if (s) d.className += ' rb-session';
  } catch (e) { d.className += ' rb-session'; }
})();
