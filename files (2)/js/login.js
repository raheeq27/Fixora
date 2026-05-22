/**
 * FIXORA Login Page - تسجيل الدخول
 * ملف JavaScript منفصل مرتبط بالباك إند الحقيقي
 */

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
 * التحقق من صحة المدخلات قبل الإرسال
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
 * 🔥 دالة معالجة تسجيل الدخول والربط مع السيرفر الحقيقي
 */
async function handleLogin(event) {
  event.preventDefault();
  
  const username = usernameInput.value.trim(); // قد يكون إيميل أو هاتف حسب إدخال المستخدم
  const password = passwordInput.value;
  
  // التحقق من المدخلات في الفرونت إند أولاً
  if (!validateInputs(username, password)) {
    return;
  }
  
  // تعطيل الزر وإظهار مؤشر تحميل لمنع الضغط المتكرر
  loginBtn.disabled = true;
  loginBtn.textContent = 'جاري تسجيل الدخول...';
  
  try {
    // 📨 إرسال الطلب الفعلي إلى سيرفر Express الباك إند
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email: username, 
        password: password 
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showToast('تم تسجيل الدخول بنجاح!', 'success');

      // 1. معالجة نظام "تذكرني" المحلي
      if (rememberMeCheckbox.checked) {
        localStorage.setItem('fixora_remembered_user', username);
        localStorage.setItem('fixora_remembered_pass', btoa(password)); 
      } else {
        localStorage.removeItem('fixora_remembered_user');
        localStorage.removeItem('fixora_remembered_pass');
      }
      
      // 2. تخرين بيانات التوكن والـ User الحقيقية القادمة من الباك إند
      localStorage.setItem('token', result.token); 
      
      // حفظ بيانات المستخدم الحالي في الـ Session
      sessionStorage.setItem('fixora_current_user', JSON.stringify(result.user));

      // 3. التوجيه الديناميكي الذكي حسب صلاحية (Role) المستخدم القادم من الداتابيز
      setTimeout(() => {
        if (result.user.role === 'client') {
          window.location.href = 'user-dashboard.html'; // صفحة العميل
        } else if (result.user.role === 'provider') {
          window.location.href = 'provider-dashboard.html'; // صفحة الفني
        } else if (result.user.role === 'admin') {
          window.location.href = 'admin-dashboard.html'; // صفحة الأدمن
        }
      }, 1000);

    } else {
      // عرض رسالة الخطأ القادمة من السيرفر مباشرة (مثل: كلمة المرور خاطئة أو الحساب غير موجود)
      showToast(result.message || 'فشل تسجيل الدخول، تأكد من البيانات.', 'error');
    }

  } catch (error) {
    console.error('حدث خطأ أثناء الاتصال بالسيرفر:', error);
    showToast('❌ تعذر الاتصال بالسيرفر حالياً. تأكدي أن سيرفر Node.js شغال!', 'error');
  } finally {
    // إعادة الزر لحالته الطبيعية بعد انتهاء العملية
    loginBtn.disabled = false;
    loginBtn.textContent = 'تسجيل الدخول';
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
 * إرسال رابط استعادة كلمة المرور (يمكن ربطها بـ API لاحقاً)
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
  
  // محاكاة مؤقتة للاستعادة لحين بناء الـ Route الخاص بها
  showToast(`📧 إذا كان الحساب مسجلاً، فسيتم إرسال رابط الاستعادة إلى ${emailOrPhone}`, 'success');
  closeModal();
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
 * ربط الأحداث وتشغيلها
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