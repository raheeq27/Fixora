const fs = require('fs');

function fixAbout() {
  const file = 'about.html';
  if (fs.existsSync(file)) {
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace(/<script>\s*document\.querySelector\('button'\)\?\.addEventListener\('click',\(\)=>\{\s*alert\('🇯🇴 شكراً لاهتمامك! قريباً سيتم تفعيل التسجيل للحرفيين الأردنيين\. تابعنا على وسائل التواصل\.'\);\s*\}\);\s*<\/script>/, '');
    fs.writeFileSync(file, html, 'utf8');
  }
}

function fixServices() {
  const file = 'services.html';
  if (fs.existsSync(file)) {
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace(/<script>\s*document\.querySelectorAll\('\.bo, \.bs'\)\.forEach\(btn => \{\s*btn\.addEventListener\('click', \(\) => \{\s*alert\('🔐 سيتم توجيهك إلى صفحة تسجيل الدخول أو إنشاء الحساب قريباً\.'\);\s*\}\);\s*\}\);\s*<\/script>/, '');
    fs.writeFileSync(file, html, 'utf8');
  }
}

fixAbout();
fixServices();
console.log('Fixed scripts');
