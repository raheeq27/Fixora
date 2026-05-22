/**
 * FIXORA - لوحة تحكم المستخدم (User Dashboard)
 * كود الإدارة والربط مع الباك إند وقاعدة البيانات
 */

// ==========================================
// 1. التحقق من الهوية والحماية (Auth Check)
// ==========================================
const token = localStorage.getItem('token');
if (!token) {
    // إذا لم يكن هناك توكن، يتم توجيه المستخدم لصفحة تسجيل الدخول فوراً
    alert("غير مسموح بالدخول، يرجى تسجيل الدخول أولاً.");
    window.location.href = 'login.html';
}

// ==========================================
// 2. الانتظار حتى تحميل كامل عناصر الصفحة
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // جلب بيانات المستخدم الحالية من الكاش
    let currentUser = JSON.parse(sessionStorage.getItem('fixora_current_user'));
    
    initializeTabs();
    initializeLogout();
    
    // 🌟 التعديل الذكي هنا:
    // نتحقق من وجود المستخدم، وأن حقل الاسم الأول موجود ومملوء فعلياً
    if (currentUser && (currentUser.first_name || currentUser.firstName)) {
        console.log("تم تحميل البيانات الكاملة من الكاش بنجاح.");
        displayWelcomeMessage(currentUser);
        populateProfileFields(currentUser);
    } else {
        // إذا كان الكائن فارغاً أو كان يحتوي فقط على الـ role والـ id بدون الاسم الشخصي
        // نُجبر النظام فوراً على الذهاب للسيرفر وجلب ملف الداتا الحقيقي الكامل
        console.log("بيانات الاسم غير مكتملة في الكاش، جاري جلب البروفايل الكامل من السيرفر...");
        fetchUserDataFromServer();
    }

    // تفعيل مستمع الأحداث لزر حفظ التغييرات للبروفايل
    initializeProfileUpdate();
});

// ==========================================
// 3. نظام تبديل التبويبات (Tab Switching)
// ==========================================
function initializeTabs() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const viewAllButtons = document.querySelectorAll('.view-all-btn');

    // دالة الانتقال لتبويب معين
    function switchTab(tabId) {
        // إزالة الحالات النشطة من القائمة الجانبية والتبويبات
        sidebarItems.forEach(item => item.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));

        // تفعيل التبويب المختار في القائمة الجانبية
        const targetSidebarItem = document.querySelector(`.sidebar-item[data-tab="${tabId}"]`);
        if (targetSidebarItem) targetSidebarItem.classList.add('active');

        // عرض محتوى التبويب المقابل
        const targetPanel = document.getElementById(`tab-${tabId}`);
        if (targetPanel) targetPanel.classList.add('active');
    }

    // إضافة حدث الضغط لكل عنصر في القائمة الجانبية
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            if (tabId) switchTab(tabId);
        });
    });

    // ربط أزرار "عرض جميع الطلبات / الإشعارات" للتنقل بين التبويبات
    viewAllButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const goToTab = btn.getAttribute('data-goto');
            if (goToTab) switchTab(goToTab);
        });
    });
}

// ==========================================
// 4. عرض البيانات الحقيقية وتعبئة الحقول
// ==========================================
function displayWelcomeMessage(user) {
    const nameDisplay = document.getElementById('userNameDisplay');
    if (nameDisplay) {
        // دعم التسميتين (snake_case و CamelCase) لضمان التقاط الاسم مئة بالمئة
        const name = user.first_name || user.firstName; 
        
        if (name) {
            nameDisplay.textContent = `مرحباً ${name} 👋`;
            console.log(`تم تغيير الترحيب بنجاح إلى: ${name}`);
        } else {
            console.warn("وُجد كائن المستخدم ولكن حقل الاسم الأول (first_name أو firstName) فارغ أو غير معرف!", user);
        }
    }
}

function populateProfileFields(user) {
    if (!user) return;

    // تعبئة حقول الحساب الشخصي بالداتا الحقيقية من الـ Database
    if (document.getElementById('profileFirstName')) document.getElementById('profileFirstName').value = user.first_name || '';
    if (document.getElementById('profileLastName')) document.getElementById('profileLastName').value = user.last_name || '';
    if (document.getElementById('profilePhone')) document.getElementById('profilePhone').value = user.phone || '';
    if (document.getElementById('profileEmail')) document.getElementById('profileEmail').value = user.email || '';
    if (document.getElementById('profileCity')) document.getElementById('profileCity').value = user.governorate || 'Amman';
    
    if (document.getElementById('profileArea')) {
        document.getElementById('profileArea').value = user.detailed_area || user.area || '';
    }
}

// دالة احتياطية لجلب الداتا مباشرة من السيرفر إذا لم تكن مخزنة في الـ Session
// دالة جلب الداتا من السيرفر بناءً على الـ ID الحقيقي للمستخدم
async function fetchUserDataFromServer() {
    // جلب كائن الجلسة للوصول إلى الـ ID
    const currentUser = JSON.parse(sessionStorage.getItem('fixora_current_user'));
    
    if (!currentUser || !currentUser.id) {
        console.error("لم يتم العثور على ID المستخدم في الجلسة!");
        return;
    }

    try {
        // 🌟 تعديل المسار ليرسل الـ ID الحقيقي للمستخدم إلى الباك إند (مثال: /api/users/user/1)
        const response = await fetch(`http://localhost:3000/api/users/user/${currentUser.id}`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // التحقق من أن السيرفر رد بنجاح وليس 404
        if (!response.ok) {
            throw new Error(`تعذر جلب البيانات، كود الاستجابة: ${response.status}`);
        }

        const result = await response.json();
        
        // تأكدي من شكل النتيجة الراجعة من السيرفر عندكِ، هنا نفترض أنه يرجع كائن المستخدم مباشرة أو داخل result.user
        const userData = result.user || result; 

        if (userData) {
            // حفظ البيانات الكاملة في الـ Session لكي لا تضطري لطلبها من السيرفر في كل مرة
            sessionStorage.setItem('fixora_current_user', JSON.stringify(userData));
            
            // تحديث الشاشة بالبيانات الحقيقية
            displayWelcomeMessage(userData);
            populateProfileFields(userData);
        }
    } catch (error) {
        console.error("خطأ أثناء جلب بيانات المستخدم من السيرفر:", error);
        
        // 💡 خطوة جمالية: لكي لا يظهر "أحمد" إذا فشل السيرفر، نضع اسماً مؤقتاً عاماً
        const nameDisplay = document.getElementById('userNameDisplay');
        if (nameDisplay && nameDisplay.textContent.includes("أحمد")) {
            nameDisplay.textContent = `مرحباً بك في لوحة التحكم 👋`;
        }
    }
}

// ==========================================
// 5. حفظ وتحديث البيانات الشخصية (PUT Request)
// ==========================================
function initializeProfileUpdate() {
    const saveProfileBtn = document.getElementById('saveProfileBtn');

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // التقاط القيم الحالية المكتوبة في الشاشة بعد التعديل
            const firstName = document.getElementById('profileFirstName').value.trim();
            const lastName = document.getElementById('profileLastName').value.trim();
            const phone = document.getElementById('profilePhone').value.trim();
            const governorate = document.getElementById('profileCity').value;
            const detailedArea = document.getElementById('profileArea').value.trim();

            // تحقق بسيط من المدخلات الأساسية في الفرونت إند
            if (!firstName || !lastName || !phone) {
                alert("يرجى ملء الحقول الأساسية: الاسم الأول، اسم العائلة، ورقم الجوال.");
                return;
            }

            try {
                // إرسال طلب التحديث للباك إند
                const response = await fetch('http://localhost:3000/api/users/update-profile', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName,
                        phone: phone,
                        governorate: governorate,
                        detailed_area: detailedArea // تأكدي من مطابقة المسمى مع كود الـ Controller في الـ backend
                    })
                });

                const result = await response.json();

                if (result.success) {
                    alert(result.message || "تم تحديث البيانات الشخصية بنجاح! 🎉");

                    // تحديث الـ Session Storage بالبيانات الجديدة المستلمة من السيرفر
                    sessionStorage.setItem('fixora_current_user', JSON.stringify(result.user));
                    
                    // تحديث نص الترحيب العلوي فوراً دون الحاجة لتحديث الصفحة
                    displayWelcomeMessage(result.user);
                } else {
                    alert(result.message || "فشل تحديث البيانات، يرجى المحاولة لاحقاً.");
                }

            } catch (error) {
                console.error("خطأ أثناء الاتصال بالسيرفر لتحديث البيانات:", error);
                alert("حدث خطأ في الاتصال بالسيرفر، تأكدي من تشغيل السيرفر والمحاولة مجدداً.");
            }
        });
    }
}

// ==========================================
// 6. تسجيل الخروج (Logout)
// ==========================================
function initializeLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    // قمت بإضافة مستمع أيضاً للرابط الأحمر الموجود داخل السايد بار للاحتياط
    const sidebarLogoutLink = document.querySelector('.fxr-sidebar-links a[style*="color: #f75555"]');

    const handleLogout = (e) => {
        if(e) e.preventDefault();
        
        // تنظيف جلسة المستخدم والتوكنات بالكامل
        localStorage.removeItem('token');
        sessionStorage.removeItem('fixora_current_user');
        
        // التوجيه لصفحة تسجيل الدخول أو الرئيسية
        window.location.href = 'login.html';
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (sidebarLogoutLink) sidebarLogoutLink.addEventListener('click', handleLogout);
}