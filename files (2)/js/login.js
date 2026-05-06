/**
 * FIXORA Login Page - تسجيل الدخول
 * ملف JavaScript منفصل
 */

// بيانات المستخدمين التجريبية (محاكاة)
const DEMO_USERS = [];

// عناصر DOM
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const togglePasswordBtn = document.getElementById('togglePassword');
const rememberMeCheckbox = document.getElementById('rememberMe');
const loginBtn = document.getElementById('loginBtn');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const registerLink = document.getElementById('registerLink');
const goHomeBtn = document.getElementById('goHomeBtn');
const goRegisterBtn = document.getElementById('goRegisterBtn');
const forgotModal = document.getElementById('forgotModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const sendResetBtn = document.getElementById('sendResetBtn');
const resetEmailInput = document.getElementById('resetEmail');

/**
 * عرض رسالة تنبيه عائمة
 */
function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast-message');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * التحقق من صحة رقم جوال أردني
 */
function isValidJordanianPhone(phone) {
  const phoneRegex = /^07[0-9]{8}$/;
  return phoneRegex.test(phone);
}

/**
 * التحقق من صحة البريد الإلكتروني
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * البحث عن المستخدم
 */
function findUser(identifier) {
  return DEMO_USERS.find(user => 
    user.username === identifier || 
    user.email === identifier
  );
}

/**
 * التحقق من صحة المدخلات
 */
function validateInputs(username, password) {
  let isValid = true;
  
  usernameError.textContent = '';
  passwordError.textContent = '';
  
  if (!username.trim()) {
    usernameError.textContent = 'الرجاء إدخال رقم الجوال أو البريد الإلكتروني';
    isValid = false;
  } else if (!isValidJordanianPhone(username) && !isValidEmail(username)) {
    usernameError.textContent = 'صيغة غير صحيحة. استخدم 07xxxxxxxx أو بريد إلكتروني صحيح';
    isValid = false;
  }
  
  if (!password.trim()) {
    passwordError.textContent = 'الرجاء إدخال كلمة المرور';
    isValid = false;
  } else if (password.length < 6) {
    passwordError.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    isValid = false;
  }
  
  return isValid;
}

/**
 * معالجة تسجيل الدخول
 */
function handleLogin(event) {
  event.preventDefault();
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  
  if (!validateInputs(username, password)) {
    return;
  }
  
  const user = findUser(username);
  
  if (user && user.password === password) {
    // تسجيل الدخول ناجح
    if (rememberMeCheckbox.checked) {
      localStorage.setItem('fixora_remembered_user', username);
      localStorage.setItem('fixora_remembered_pass', btoa(password)); // تشفير بسيط
    } else {
      localStorage.removeItem('fixora_remembered_user');
      localStorage.removeItem('fixora_remembered_pass');
    }
    
    sessionStorage.setItem('fixora_current_user', JSON.stringify({
      id: user.id,
      name: user.name,
      role: user.role,
      username: user.username
    }));
    
    showToast(`مرحباً ${user.name}! جاري تحويلك إلى لوحة التحكم... ✅`, 'success');
    
    // محاكاة التحويل
    setTimeout(() => {
      if (user.role === 'provider') {
        window.location.href = '/dashboard/provider';
        showToast('سيتم توجيهك إلى لوحة تحكم الحرفي', 'success');
      } else {
        window.location.href = '/dashboard/user';
        showToast('سيتم توجيهك إلى لوحة تحكم المستخدم', 'success');
      }
    }, 1500);
  } else {
    showToast('❌ خطأ في رقم الجوال/البريد أو كلمة المرور', 'error');
    passwordError.textContent = 'بيانات الدخول غير صحيحة';
    passwordInput.classList.add('error');
    setTimeout(() => passwordInput.classList.remove('error'), 2000);
  }
}

/**
 * إظهار/إخفاء كلمة المرور
 */
function togglePasswordVisibility() {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
}

/**
 * تحميل البيانات المحفوظة (تذكرني)
 */
function loadRememberedCredentials() {
  const rememberedUser = localStorage.getItem('fixora_remembered_user');
  const rememberedPass = localStorage.getItem('fixora_remembered_pass');
  
  if (rememberedUser && rememberedPass) {
    usernameInput.value = rememberedUser;
    passwordInput.value = atob(rememberedPass);
    rememberMeCheckbox.checked = true;
    showToast('تم تحميل بيانات الدخول المحفوظة', 'success');
  }
}

/**
 * فتح مودال نسيت كلمة المرور
 */
function openForgotModal() {
  forgotModal.classList.add('show');
}

/**
 * إغلاق المودال
 */
function closeModal() {
  forgotModal.classList.remove('show');
  resetEmailInput.value = '';
}

/**
 * إرسال رابط استعادة كلمة المرور
 */
function sendResetLink() {
  const emailOrPhone = resetEmailInput.value.trim();
  
  if (!emailOrPhone) {
    showToast('الرجاء إدخال بريدك الإلكتروني أو رقم جوالك', 'error');
    return;
  }
  
  if (!isValidJordanianPhone(emailOrPhone) && !isValidEmail(emailOrPhone)) {
    showToast('صيغة غير صحيحة', 'error');
    return;
  }
  
  const user = findUser(emailOrPhone);
  
  if (user) {
    showToast(`📧 تم إرسال رابط استعادة كلمة المرور إلى ${emailOrPhone}`, 'success');
    closeModal();
  } else {
    showToast('❌ لا يوجد حساب مرتبط بهذا البريد أو رقم الجوال', 'error');
  }
}

/**
 * التوجه إلى صفحة التسجيل
 */
function goToRegister() {
  showToast('جاري التوجه إلى صفحة إنشاء الحساب...', 'success');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

/**
 * التوجه إلى الصفحة الرئيسية
 */
function goToHome() {
  window.location.href = 'index.html';
}

/**
 * إغلاق المودال عند الضغط خارج المحتوى
 */
function handleModalClick(e) {
  if (e.target === forgotModal) {
    closeModal();
  }
}

/**
 * ربط الأحداث
 */
function init() {
  loginForm.addEventListener('submit', handleLogin);
  togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
  forgotPasswordBtn.addEventListener('click', openForgotModal);
  closeModalBtn.addEventListener('click', closeModal);
  sendResetBtn.addEventListener('click', sendResetLink);
  registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    goToRegister();
  });
  if(goRegisterBtn) goRegisterBtn.addEventListener('click', goToRegister);
  if(goHomeBtn) goHomeBtn.addEventListener('click', goToHome);
  window.addEventListener('click', handleModalClick);
  
  // الضغط على Enter في حقل إعادة التعيين
  resetEmailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendResetLink();
  });
  
  loadRememberedCredentials();
  
  // إضافة تأثيرات بصرية للحقول
  usernameInput.addEventListener('focus', () => usernameError.textContent = '');
  passwordInput.addEventListener('focus', () => {
    passwordError.textContent = '';
    passwordInput.classList.remove('error');
  });
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', init);