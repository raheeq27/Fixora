/**
 * FIXORA Login Page
 * تسجيل الدخول وربطه مع الباك إند الحقيقي
 */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================
    // عناصر الصفحة
    // =========================================
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
    const forgotModal = document.getElementById('forgotModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const sendResetBtn = document.getElementById('sendResetBtn');
    const resetEmailInput = document.getElementById('resetEmail');

    // =========================================
    // Toast Message
    // =========================================
    function showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // =========================================
    // Validation Helpers
    // =========================================
    function isValidJordanianPhone(phone) {
        const regex = /^07[0-9]{8}$/;
        return regex.test(phone);
    }

    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // =========================================
    // Validate Inputs
    // =========================================
    function validateInputs(username, password) {
        let isValid = true;

        if (usernameError) usernameError.textContent = '';
        if (passwordError) passwordError.textContent = '';

        // username validation
        if (!username.trim()) {
            if (usernameError) {
                usernameError.textContent = 'الرجاء إدخال البريد أو رقم الهاتف';
            }
            isValid = false;
        } else if (!isValidJordanianPhone(username) && !isValidEmail(username)) {
            if (usernameError) {
                usernameError.textContent = 'صيغة البريد الإلكتروني أو رقم الهاتف غير صحيحة';
            }
            isValid = false;
        }

        // password validation
        if (!password.trim()) {
            if (passwordError) {
                passwordError.textContent = 'الرجاء إدخال كلمة المرور';
            }
            isValid = false;
        } else if (password.length < 6) {
            if (passwordError) {
                passwordError.textContent = 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)';
            }
            isValid = false;
        }

        return isValid;
    }

    // =========================================
    // Toggle Password
    // =========================================
    function togglePasswordVisibility() {
        if (!passwordInput) return;
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
    }

    // =========================================
    // Forgot Password Modal
    // =========================================
    function openForgotModal() {
        if (forgotModal) forgotModal.style.display = 'flex';
    }

    // إصلاح مشكلة قفل الـ modal بتصفير القيم
    function closeModal() {
        if (forgotModal) {
            forgotModal.style.display = 'none';
            if (resetEmailInput) resetEmailInput.value = '';
        }
    }

    // =========================================
    // Load Remembered Data
    // =========================================
    function loadRememberedCredentials() {
        const rememberedUser = localStorage.getItem('fixora_remembered_user');
        const rememberedPass = localStorage.getItem('fixora_remembered_pass');

        if (rememberedUser && rememberedPass) {
            if (usernameInput) usernameInput.value = rememberedUser;
            if (passwordInput) {
                try {
                    passwordInput.value = atob(rememberedPass);
                } catch (e) {
                    passwordInput.value = '';
                }
            }
            if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
        }
    }

    // =========================================
    // Login Handler
    // =========================================
    async function handleLogin(event) {
        event.preventDefault();

        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!validateInputs(username, password)) {
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'جاري تسجيل الدخول...';

        try {
            // [إصلاح منطقي]: تحديد ما إذا كان المدخل إيميل أم هاتف لإرساله للباك إند بشكل صحيح
            const requestBody = {};
            if (isValidEmail(username)) {
                requestBody.email = username;
            } else {
                requestBody.phone = username;
            }
            requestBody.password = password;

            const data = await window.FixoraAPI.login(requestBody);

            if (data.success) {
                showToast('تم تسجيل الدخول بنجاح 🎉', 'success');

                // Remember Me Logic
                if (rememberMeCheckbox && rememberMeCheckbox.checked) {
                    localStorage.setItem('fixora_remembered_user', username);
                    localStorage.setItem('fixora_remembered_pass', btoa(password));
                } else {
                    localStorage.removeItem('fixora_remembered_user');
                    localStorage.removeItem('fixora_remembered_pass');
                }

                // حفظ التوكن وبيانات المستخدم المسترجعة من الباك إند
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }

                const currentUser = data.user || data.data || {};
                sessionStorage.setItem('fixora_current_user', JSON.stringify(currentUser));

                if (currentUser.id) {
                    localStorage.setItem('userId', currentUser.id);
                }
                const displayName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
                if (displayName) {
                    localStorage.setItem('userName', displayName.split(' ')[0] || displayName);
                }

                // التوجيه التلقائي حسب الصلاحيات والـ Role المرجعة من السيرفر
                setTimeout(() => {
                    const role = window.FixoraAccess
                      ? window.FixoraAccess.normalizeRole(currentUser.role || 'client')
                      : (currentUser.role || 'client');

                    const safeRedirect = window.FixoraAccess
                      ? window.FixoraAccess.resolveRedirectAfterLogin(role)
                      : null;

                    if (safeRedirect) {
                        window.location.href = safeRedirect;
                        return;
                    }

                    if (role === 'provider') {
                        window.FixoraAPI.getProviderProfile()
                          .then((res) => {
                            const verified = res.profile?.is_verified;
                            window.location.href = verified
                              ? 'provider-dashboard.html'
                              : 'provider-pending.html';
                          })
                          .catch(() => {
                            window.location.href = 'provider-pending.html';
                          });
                        return;
                    }

                    if (window.FixoraAccess) {
                        window.FixoraAccess.redirectToRoleHome(role);
                        return;
                    }

                    if (role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1000);
            }

        } catch (error) {
            console.error('Login Error:', error);
            showToast(
              error.message === 'Failed to fetch'
                ? window.FixoraAPI.networkHint
                : (error.message || 'فشل تسجيل الدخول'),
              'error'
            );
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'تسجيل الدخول';
        }
    }

    // =========================================
    // Reset Password
    // =========================================
    function sendResetLink() {
        const value = resetEmailInput ? resetEmailInput.value.trim() : '';

        if (!value) {
            showToast('أدخل البريد أو رقم الهاتف', 'error');
            return;
        }

        if (!isValidJordanianPhone(value) && !isValidEmail(value)) {
            showToast('صيغة غير صحيحة', 'error');
            return;
        }

        showToast(`📧 تم إرسال رابط الاستعادة إلى ${value}`, 'success');
        closeModal();
    }

    // =========================================
    // Events
    // =========================================
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }

    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', openForgotModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (sendResetBtn) {
        sendResetBtn.addEventListener('click', sendResetLink);
    }

    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'register.html';
        });
    }

    if (resetEmailInput) {
        resetEmailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendResetLink();
            }
        });
    }

    // تنظيف رسائل الأخطاء فوراً عند بدء الكتابة من جديد لتجربة مستخدم أفضل
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            if (usernameError) usernameError.textContent = '';
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            if (passwordError) passwordError.textContent = '';
        });
    }

    // إغلاق الـ Modal عند الضغط خارجه
    window.addEventListener('click', (e) => {
        if (e.target === forgotModal) {
            closeModal();
        }
    });

    // تحميل البيانات المحفوظة إن وجدت
    loadRememberedCredentials();
});