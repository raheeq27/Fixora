/**
 * عنوان الـ API — نفس المنفذ 3000 إن فُتحت الصفحة من Express، وإلا localhost:3000
 */
(function () {
  const { protocol, hostname, port } = window.location;

  if (protocol === 'file:') {
    window.FIXORA_API = 'http://localhost:3000';
    return;
  }

  if (port === '3000') {
    window.FIXORA_API = `${protocol}//${hostname}:3000`;
    return;
  }

  window.FIXORA_API = 'http://localhost:3000';
})();
