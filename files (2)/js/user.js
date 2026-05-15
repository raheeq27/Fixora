// بيانات المستخدم (تأتي من قاعدة البيانات بعد تسجيل الدخول)
let userData = {
    fullName: 'أحمد محمد الكيلاني',
    phone: '0791234567',
    email: 'ahmad@example.com',
    location: 'عمّان – العبدلي',
    joinDate: '15 يناير 2025'
};

// تحديث واجهة المستخدم بالبيانات
function updateProfileUI() {
    const firstName = userData.fullName.split(' ')[0];
    const lastName = userData.fullName.split(' ')[1] || '';
    document.getElementById('userName').textContent = firstName + ' ' + lastName;
    document.getElementById('displayFullName').textContent = userData.fullName;
    document.getElementById('displayPhone').textContent = userData.phone;
    document.getElementById('displayEmail').textContent = userData.email;
    document.getElementById('displayLocation').textContent = userData.location;
    document.getElementById('displayJoinDate').textContent = userData.joinDate;
}

// التحقق من صحة رقم الجوال الأردني
function isValidJordanianPhone(phone) {
    return /^07[0-9]{8}$/.test(phone);
}

// التحقق من صحة البريد الإلكتروني
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// تعديل الملف الشخصي
function editProfile() {
    let newName = prompt('الاسم الكامل:', userData.fullName);
    if (newName && newName.trim()) {
        userData.fullName = newName.trim();
    }
    
    let newPhone = prompt('رقم الجوال (أردني - يبدأ بـ 07):', userData.phone);
    if (newPhone && newPhone.trim()) {
        if (isValidJordanianPhone(newPhone.trim())) {
            userData.phone = newPhone.trim();
        } else {
            alert('❌ رقم الجوال غير صحيح. يجب أن يبدأ بـ 07 ويتكون من 10 أرقام.');
        }
    }
    
    let newEmail = prompt('البريد الإلكتروني:', userData.email);
    if (newEmail && newEmail.trim()) {
        if (isValidEmail(newEmail.trim())) {
            userData.email = newEmail.trim();
        } else {
            alert('❌ البريد الإلكتروني غير صحيح.');
        }
    }
    
    let newLocation = prompt('المحافظة والمنطقة:', userData.location);
    if (newLocation && newLocation.trim()) {
        userData.location = newLocation.trim();
    }
    
    updateProfileUI();
    alert('✅ تم تحديث الملف الشخصي بنجاح!');
}

// تسجيل الخروج
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        alert('🔐 تم تسجيل الخروج بنجاح. سيتم توجيهك إلى الصفحة الرئيسية.');
        // في التطبيق الحقيقي: window.location.href = 'index.html';
    }
}

// عرض جميع الطلبات
function viewAllOrders() {
    alert('📋 سيتم توجيهك إلى صفحة جميع الطلبات قريباً.');
}

// عند تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', function() {
    // تحديث واجهة المستخدم
    updateProfileUI();
    
    // إضافة مستمعي الأحداث
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', editProfile);
    }
    
    const viewAllOrdersBtn = document.getElementById('viewAllOrdersBtn');
    if (viewAllOrdersBtn) {
        viewAllOrdersBtn.addEventListener('click', viewAllOrders);
    }
});