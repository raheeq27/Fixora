const fs = require('fs');
const path = require('path');

const newFooter = `<!-- FOOTER -->
<footer class="fxr-footer" style="background: #3f4a4f; padding: 20px 32px; text-align: center;">
  <div style="color: rgba(255, 255, 255, 0.5); font-size: 11px; margin-bottom: 10px;">
    © 2026 <span style="color: #f07a26; font-weight: 700;">FIXORA</span> الأردن 🇯🇴 — جميع الحقوق محفوظة
  </div>
  <div class="fxr-footer-links" style="display: flex; justify-content: center; gap: 20px;">
    <a href="#" style="color: rgba(255, 255, 255, 0.5); text-decoration: none; font-size: 11px;">شروط الاستخدام</a>
    <a href="#" style="color: rgba(255, 255, 255, 0.5); text-decoration: none; font-size: 11px;">سياسة الخصوصية</a>
    <a href="contact.html" style="color: rgba(255, 255, 255, 0.5); text-decoration: none; font-size: 11px;">تواصل معنا</a>
  </div>
</footer>`;

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has new footer
  if (content.includes('<footer class="fxr-footer"')) {
    continue;
  }

  let updated = false;

  // Regex patterns to match old footers
  const regexes = [
    // <div class="sf"> ... </div> (might span multiple lines)
    /<div class="sf">[\s\S]*?<\/div>\s*(?=<script|<\/body)/i,
    // <div class="login-footer"> ... </div>
    /<div class="login-footer">[\s\S]*?<\/div>\s*(?=<\/div>|<\/body|<div class="modal)/i,
    // <div class="register-footer"> ... </div>
    /<div class="register-footer">[\s\S]*?<\/div>\s*(?=<\/div>|<\/body)/i,
    // <div class="pd-footer"> ... </div>
    /<div class="pd-footer">[\s\S]*?<\/div>\s*(?=<\/div>|<\/body|<script)/i,
    // <div class="profile-footer"> ... </div>
    /<div class="profile-footer">[\s\S]*?<\/div>\s*(?=<\/div>|<\/body|<script)/i,
  ];

  for (const regex of regexes) {
    if (regex.test(content)) {
      content = content.replace(regex, newFooter + '\n\n');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated footer in', file);
      updated = true;
      break;
    }
  }

  if (!updated) {
    console.log('No matching old footer found in', file, '- Please check manually.');
  }
}
