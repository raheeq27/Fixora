const fs = require('fs');
const path = require('path');

const dir = __dirname;
const headerHtml = `<!-- HEADER / NAVBAR -->
<header class="fxr-header" style="z-index: 1000; position: sticky; top: 0;">
  <div style="display: flex; align-items: center; gap: 16px;">
    <!-- Hamburger button -->
    <button class="fxr-hamburger-btn" onclick="fxrToggleSidebar()">
      <span></span>
      <span></span>
      <span></span>
    </button>
    <a href="index.html" class="fxr-logo" style="display: flex; align-items: center; gap: 10px; text-decoration: none;">
      <img src="png/logo-header.jpeg" alt="FIXORA" class="fxr-logo-icon" style="width: 65px; height: 65px; object-fit: contain;">
      <span class="fxr-logo-text" style="color: white; font-size: 18px; font-weight: 900;">FIX<span style="color: #f07a26;">O</span>RA</span>
    </a>
  </div>

  <nav>
    <ul class="fxr-nav" style="display: flex; gap: 4px; list-style: none; margin: 0; padding: 0;">
      <li><a href="index.html" style="color: white; font-size: 13px; font-weight: 600; padding: 7px 14px; text-decoration: none;">الرئيسية</a></li>
      <li><a href="services.html" style="color: white; font-size: 13px; font-weight: 600; padding: 7px 14px; text-decoration: none;">الخدمات</a></li>
      <li><a href="about.html" style="color: white; font-size: 13px; font-weight: 600; padding: 7px 14px; text-decoration: none;">من نحن</a></li>
      <li><a href="contact.html" style="color: white; font-size: 13px; font-weight: 600; padding: 7px 14px; text-decoration: none;">تواصل معنا</a></li>
    </ul>
  </nav>

  <div class="fxr-header-btns" style="display: flex; align-items: center; gap: 10px;">
    <a href="login.html" class="fxr-btn fxr-btn-outline" style="border: 1px solid rgba(255,255,255,0.3); color: white; border-radius: 8px; padding: 8px 18px; text-decoration: none; font-size: 13px; font-weight: 700;">دخول</a>
    <a href="register.html" class="fxr-btn fxr-btn-primary" style="background: #f07a26; color: white; border: none; border-radius: 8px; padding: 8px 18px; text-decoration: none; font-size: 13px; font-weight: 700;">تسجيل مجاناً</a>
  </div>
</header>

<!-- SIDEBAR OVERLAY -->
<div class="fxr-main-sidebar-overlay" id="fxrSidebarOverlay" onclick="fxrToggleSidebar()"></div>

<!-- SIDEBAR CONTENT -->
<aside class="fxr-main-sidebar" id="fxrMainSidebar">
  <div class="fxr-sidebar-header">
    <a href="index.html" class="fxr-logo" style="padding:0; border:none; margin-bottom:0; display: flex; align-items: center; gap: 10px; text-decoration: none;">
      <img src="png/logo-header.jpeg" alt="FIXORA" style="width: 40px; height: 40px; border-radius:8px; object-fit: contain;">
      <span class="fxr-logo-text" style="color: white; font-size: 18px; font-weight: 900;">FIX<span style="color: #f07a26;">O</span>RA</span>
    </a>
    <button class="fxr-sidebar-close" onclick="fxrToggleSidebar()">✕</button>
  </div>
  <div class="fxr-sidebar-links">
    <a href="index.html" class="fxr-sidebar-link">🏠 الرئيسية</a>
    <a href="search.html" class="fxr-sidebar-link">🔍 البحث</a>
    <a href="services.html" class="fxr-sidebar-link">⚙️ الخدمات</a>
    <a href="about.html" class="fxr-sidebar-link">ℹ️ من نحن</a>
    <a href="contact.html" class="fxr-sidebar-link">📞 تواصل معنا</a>
    
    <div style="height: 1px; background: rgba(255,255,255,0.08); margin: 10px 20px;"></div>
    
    <a href="login.html" class="fxr-sidebar-link">🔑 تسجيل الدخول</a>
    <a href="register.html" class="fxr-sidebar-link">📝 إنشاء حساب</a>
    <a href="user.html" class="fxr-sidebar-link">👤 الصفحة الشخصية للمستخدم</a>
    <a href="user-dashboard.html" class="fxr-sidebar-link">🎛️ لوحة تحكم المستخدم</a>
    <a href="provider-dashboard.html" class="fxr-sidebar-link">🛠️ لوحة تحكم الحرفي</a>
    <a href="privider.html" class="fxr-sidebar-link">📋 الصفحة الشخصية للحرفي</a>
    
    <div style="height: 1px; background: rgba(255,255,255,0.08); margin: 10px 20px;"></div>
    
    <a href="#" class="fxr-sidebar-link" style="color: #f75555;">🚪 تسجيل الخروج</a>
  </div>
  
  <style>
    .fxr-header { background: #3f4a4f; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; box-shadow: 0 2px 16px rgba(0,0,0,.18); font-family: 'Cairo', sans-serif;}
    .fxr-hamburger-btn { display: flex; flex-direction: column; gap: 4px; background: transparent; border: none; cursor: pointer; padding: 4px; }
    .fxr-hamburger-btn span { width: 24px; height: 3px; background-color: white; border-radius: 2px; transition: 0.2s; }
    .fxr-main-sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); z-index: 1050; opacity: 0; visibility: hidden; transition: 0.2s; }
    .fxr-main-sidebar-overlay.active { opacity: 1; visibility: visible; }
    .fxr-main-sidebar { position: fixed; top: 0; right: 0; width: 280px; height: 100vh; background: #3f4a4f; z-index: 1100; transform: translateX(100%); transition: transform 0.3s ease; display: flex; flex-direction: column; box-shadow: -4px 0 24px rgba(0,0,0,0.2); font-family: 'Cairo', sans-serif;}
    .fxr-main-sidebar.active { transform: translateX(0); }
    .fxr-sidebar-header { padding: 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .fxr-sidebar-close { background: transparent; border: none; color: white; font-size: 20px; cursor: pointer; opacity: 0.7; }
    .fxr-sidebar-close:hover { opacity: 1; }
    .fxr-sidebar-links { display: flex; flex-direction: column; padding: 20px 0; overflow-y: auto; }
    .fxr-sidebar-link { padding: 12px 24px; color: rgba(255, 255, 255, 0.7); text-decoration: none; font-size: 14px; font-weight: 600; transition: 0.2s; display: flex; align-items: center; gap: 12px; border-right: 3px solid transparent; }
    .fxr-sidebar-link:hover, .fxr-sidebar-link.active { background: rgba(240, 122, 38, 0.1); color: white; border-right-color: #f07a26; }
  </style>
  <script>
    function fxrToggleSidebar() {
      const s = document.getElementById('fxrMainSidebar');
      const o = document.getElementById('fxrSidebarOverlay');
      if(s && o) { s.classList.toggle('active'); o.classList.toggle('active'); }
    }
  </script>
</aside>
`;

function replaceRegex(file, regex) {
  let p = path.join(dir, file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  if (regex.test(content)) {
    content = content.replace(regex, headerHtml);
    fs.writeFileSync(p, content, 'utf8');
    console.log('Replaced in', file);
  } else {
    console.log('Not found in', file, 'regex:', regex.toString().slice(0,50));
  }
}

// services.html, about.html, contact.html
// They have: <div class="sh"> ... </div> right before next main div
const shRegex = /<div class="sh">[\s\S]*?<\/div>(\s*<div class="(services-hero|hero-about|contact-hero|contact-wrapper|dashboard-shell|dshell)")/i;

replaceRegex('services.html', shRegex);
replaceRegex('about.html', shRegex);
replaceRegex('contact.html', shRegex);
replaceRegex('user-dashboard.html', /<!-- ========== الهيدر ========== -->\s*<div class="sh">[\s\S]*?<\/div>(\s*<!-- ========== لوحة التحكم ========== -->)/i);
replaceRegex('provider-dashboard.html', /<!-- HEADER -->\s*<div class="sh">[\s\S]*?<\/div>(\s*<!-- DASHBOARD -->)/i);
replaceRegex('register.html', /<!-- NAVBAR -->\s*<nav class="fxr-navbar">[\s\S]*?<\/nav>(\s*<!-- REGISTER PAGE -->)/i);
replaceRegex('login.html', /<!-- الهيدر العلوي -->\s*<div class="login-header">[\s\S]*?<\/div>(\s*<!-- محتوى تسجيل الدخول -->)/i);

