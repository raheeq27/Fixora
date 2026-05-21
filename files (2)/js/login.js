document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('username'); 
    const passwordInput = document.getElementById('password'); 
    const loginBtn = document.getElementById('loginBtn');

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    async function handleLogin(event) {
        if (event) event.preventDefault();

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!email || !password) {
            showToast('يرجى تعبئة جميع الحقول', 'error');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'جاري التحقق...';

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const rawResponse = await response.text();
            let data;
            try {
                data = JSON.parse(rawResponse);
                console.log("LOGIN RESPONSE:", data);
            } catch (e) {
                data = { message: rawResponse };
            }

            if (response.ok) {
                showToast('تم تسجيل الدخول بنجاح!');
                
                // 1. حفظ التوكن
                localStorage.setItem('token', data.token);
                
                // 2. حفظ الـ ID (السطر الأهم ليتعرف عليكِ نظام الحجز)
                // نتأكد من مكان الـ id بناءً على ما يرسله السيرفر (data.data.id)
                if (data.user && data.user.id) {
                    localStorage.setItem('userId', data.user.id);
                }

                // 3. التوجيه
                const redirect = localStorage.getItem('redirectAfterLogin');
                if (redirect) {
                    localStorage.removeItem('redirectAfterLogin'); 
                    setTimeout(() => window.location.href = redirect, 1000);
                } else {
                    setTimeout(() => window.location.href = 'user-dashboard.html', 1000);
                }
            } else {
                showToast(data.message || 'بيانات الدخول غير صحيحة', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('فشل الاتصال بالسيرفر', 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'تسجيل الدخول';
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});