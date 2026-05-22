/**
 * FIXORA - لوحة تحكم المستخدم (User Dashboard)
 * كود الإدارة الموحد والربط الحقيقي مع الباك إند وقاعدة البيانات
 */

// ==========================================
// 1. التحقق من الهوية والحماية (Auth Check)
// ==========================================
const token = localStorage.getItem('token');

if (!token) {
    alert("غير مسموح بالدخول، يرجى تسجيل الدخول أولاً.");
    window.location.href = 'login.html';
}

// ========== بيانات المستخدم الافتراضية للـ Fallback ==========
const fallbackUserData = {
    name: 'مستخدم فيكسورا',
    phone: '0790000000',
    email: 'user@fixora.com',
    city: 'عمّان',
    area: 'الشميساني'
};

// ========== بيانات الإشعارات والحرفيين والرسائل الثابتة (الواجهة الجمالية) ==========
let notificationsData = [
    { id: 1, icon: '✅', title: 'تم قبول طلبك!', text: 'تم قبول طلب تصليح التكييف · الموعد المحدد قريباً', time: 'منذ 5 دقائق', read: false },
    { id: 2, icon: '💬', title: 'رسالة جديدة', text: 'الفني: "سأكون عندك في الموعد المحدد إن شاء الله"', time: 'منذ 20 دقيقة', read: false },
    { id: 3, icon: '🎉', title: 'مرحباً في FIXORA الأردن', text: 'حسابك جاهز! ابدأ بالبحث عن أفضل فني في منطقتك', time: 'أمس', read: true }
];

const favoritesData = [
    { id: 1, icon: '👨‍🔧', name: 'محمد أبو خالد', specialty: 'تقني تكييف وأجهزة منزلية', rating: '⭐ 4.9 (48 تقييم)', location: 'عمان، تلاع العلي' },
    { id: 2, icon: '⚡', name: 'مهندس خالد النابلسي', specialty: 'فني كهرباء وتمديدات ذكية', rating: '⭐ 4.8 (32 تقييم)', location: 'عمان، صويلح' }
];

const messagesData = [
    { id: 1, icon: '👨‍🔧', sender: 'محمد أبو خالد', preview: 'سأكون عندك في الوقت المحدد إن شاء الله', time: '10:15 ص' },
    { id: 2, icon: '⚡', sender: 'مهندس خالد النابلسي', preview: 'تم إنهاء الفحص، يرجى مراجعة الفاتورة', time: 'أمس' }
];

// ==========================================
// 2. الانتظار حتى تحميل كامل عناصر الصفحة
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    let currentUser = JSON.parse(sessionStorage.getItem('fixora_current_user'));

    // تهيئة محركات الواجهة الأساسية
    initializeTabs();
    initializeLogout();
    renderNotifications();
    renderFavorites();
    renderMessages();

    // التحقق من حالة الكاش قبل استدعاء السيرفر
    if (currentUser && (currentUser.first_name || currentUser.firstName)) {
        console.log("✅ [FIXORA] تم تحميل البيانات الكاملة من الكاش بنجاح.");
        displayWelcomeMessage(currentUser);
        populateProfileFields(currentUser);
        
        // جلب الحجوزات المرتبطة بالمستخدم حتى لو كانت البيانات الشخصية في الكاش
        fetchUserDataFromServer();
    } else {
        console.log("ℹ️ [FIXORA] بيانات الاسم غير مكتملة في الكاش، جاري جلب الملف الكامل من السيرفر...");
        fetchUserDataFromServer();
    }

    // تفعيل مستمع الأحداث لتعديل الملف الشخصي
    initializeProfileUpdate();
});

// ==========================================
// 3. نظام تبديل التبويبات (Tab Switching)
// ==========================================
function initializeTabs() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const tabPanels = document.querySelectorAll('.tab-panel, .dashboard-section');
    const viewAllButtons = document.querySelectorAll('.view-all-btn');

    function switchTab(tabId) {
        // إزالة الفاعلية من السايد بار والأقسام
        sidebarItems.forEach(item => item.classList.remove('active'));
        tabPanels.forEach(panel => {
            panel.classList.remove('active');
            panel.style.display = 'none';
        });

        // تفعيل العنصر المختار في السايد بار
        const targetSidebarItem = document.querySelector(`.sidebar-item[data-tab="${tabId}"]`);
        if (targetSidebarItem) targetSidebarItem.classList.add('active');

        // إظهار القسم المطابق للـ id
        const cleanId = tabId.replace('-section', '');
        const targetPanel = document.getElementById(`tab-${cleanId}`) || 
                            document.getElementById(cleanId) || 
                            document.getElementById(tabId);

        if (targetPanel) {
            targetPanel.classList.add('active');
            targetPanel.style.display = 'block';
            console.log(`🎯 [FIXORA] الانتقال إلى واجهة: [${tabId}]`);
        } else {
            console.warn(`⚠️ [FIXORA] لم يتم العثور في الـ HTML على عنصر بـ id يطابق: ${tabId}`);
        }
    }

    sidebarItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const tabId = item.getAttribute('data-tab');
            if (!tabId) return; // تخطي أزرار تسجيل الخروج التي لا تحمل داتا تبويب

            e.preventDefault();
            switchTab(tabId);
        });
    });

    viewAllButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const goToTab = btn.getAttribute('data-goto');
            if (goToTab) switchTab(goToTab);
        });
    });
}

// ==========================================
// 4. عرض البيانات الرسومية وتعبئة الحقول
// ==========================================
function displayWelcomeMessage(user) {
    const nameDisplay = document.getElementById('userNameDisplay');
    if (!nameDisplay) return;

    const name = user.first_name || user.firstName || user.name || fallbackUserData.name;
    nameDisplay.textContent = `مرحباً ${name} 👋`;
    
    // حفظ الاسم في الـ localStorage لسرعة القراءة الفورية عند التحميل القادم
    localStorage.setItem('userName', name);
}

function populateProfileFields(user) {
    if (!user) return;

    const firstNameInput = document.getElementById('profileFirstName');
    const lastNameInput = document.getElementById('profileLastName');
    const phoneInput = document.getElementById('profilePhone');
    const emailInput = document.getElementById('profileEmail');
    const cityInput = document.getElementById('profileCity');
    const areaInput = document.getElementById('profileArea');

    if (firstNameInput) firstNameInput.value = user.first_name || user.name || '';
    if (lastNameInput) lastNameInput.value = user.last_name || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (emailInput) emailInput.value = user.email || '';
    if (cityInput) cityInput.value = user.governorate || 'Amman';
    if (areaInput) areaInput.value = user.detailed_area || user.area || '';
}

// ==========================================
// 5. جلب بيانات المستخدم والحجوزات من السيرفر
// ==========================================
async function fetchUserDataFromServer() {
    let userId = localStorage.getItem('userId');
    
    // محاولة استخراج الـ ID من كائن الجلسة كخطة بديلة
    if (!userId) {
        const currentUser = JSON.parse(sessionStorage.getItem('fixora_current_user'));
        userId = currentUser ? currentUser.id : null;
    }

    if (!userId) {
        console.error("🚨 [FIXORA] لم يتم العثور على المعرف الحقيقي للمستخدم (User ID).");
        return;
    }

    const fallbackBookings = [
        { id: "1092", service_title: "تصليح تكييف سبليت", booking_date: new Date(), notes: "شحن فريون وتصليح تكييف سبليت عاجل", status: "مؤكد" }
    ];

    try {
        const response = await fetch(`http://localhost:3000/api/users/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`خطأ سيرفر بكود استجابة: ${response.status}`);
        }

        const result = await response.json();
        const userData = result.user || result;

        if (userData) {
            // تحديث كاش الجلسة بالبيانات المحدثة كاملة
            sessionStorage.setItem('fixora_current_user', JSON.stringify(userData));

            displayWelcomeMessage(userData);
            populateProfileFields(userData);

            // جلب الحجوزات الديناميكية المسترجعة من الـ Controller
            const bookings = result.bookings || userData.bookings || [];
            renderOrdersFromDB(bookings.length > 0 ? bookings : fallbackBookings);
            updateBadgesFromDB(bookings.length > 0 ? bookings : fallbackBookings);
            
            console.log("✅ [FIXORA] تم تحديث البيانات والحجوزات حياً من قاعدة البيانات.");
        }

    } catch (error) {
        console.warn("🚨 [FIXORA] تفعيل خطة الطوارئ الآمنة واستخدام الـ Fallback بسبب:", error.message);
        
        renderOrdersFromDB(fallbackBookings);
        updateBadgesFromDB(fallbackBookings);
        
        // محاولة عرض الاسم المخزن محلياً لضمان الشكل الجمالي
        const localName = localStorage.getItem('userName') || fallbackUserData.name;
        const nameDisplay = document.getElementById('userNameDisplay');
        if (nameDisplay) nameDisplay.textContent = `مرحباً ${localName} 👋`;
    }
}

// ==========================================
// 6. حقن وعرض الحجوزات في شاشات الـ HTML
// ==========================================
function renderOrdersFromDB(bookings) {
    const container = document.getElementById('ordersListContainer');
    if (!container) return;

    if (!bookings || bookings.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:20px; color:#7f8c8d;">لا يوجد لديك حجوزات حالية.</p>`;
        return;
    }

    container.innerHTML = bookings.map(booking => {
        let statusBadge = '';
        const status = (booking.status || '').toLowerCase();
        
        if (status === 'مؤكد' || status === 'confirmed') {
            statusBadge = '<span class="status-badge status-confirmed" style="background:#2ecc71; color:#fff; padding:4px 8px; border-radius:4px; font-size:12px;">مؤكد</span>';
        } else if (status === 'قيد الانتظار' || status === 'pending') {
            statusBadge = '<span class="status-badge status-pending" style="background:#f1c40f; color:#fff; padding:4px 8px; border-radius:4px; font-size:12px;">قيد الانتظار</span>';
        } else {
            statusBadge = `<span class="status-badge" style="background:#3498db; color:#fff; padding:4px 8px; border-radius:4px; font-size:12px;">${booking.status || 'مؤكد'}</span>`;
        }

        const rawDate = booking.booking_date || booking.date;
        const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('ar-JO', { day: 'numeric', month: 'long', year: 'numeric' }) : 'قريباً';

        return `
            <div class="order-card" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:15px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h4 style="margin:0; color:#2c3e50; font-size:16px;">طلب خدمة: ${booking.service_title || 'صيانة عامة'}</h4>
                    ${statusBadge}
                </div>
                <p style="margin:4px 0; font-size:14px; color:#7f8c8d;">🔢 رقم الطلب: <span style="color:#2c3e50; font-weight:bold;">#${booking.id || '1092'}</span></p>
                <p style="margin:4px 0; font-size:14px; color:#7f8c8d;">📅 الموعد: <span style="color:#2c3e50;">${formattedDate}</span></p>
                <p style="margin:4px 0; font-size:14px; color:#7f8c8d;">📝 تفاصيل وملاحظات: <span style="color:#2c3e50;">${booking.notes || 'لا يوجد ملاحظات إضافية'}</span></p>
            </div>
        `;
    }).join('');
}

function updateBadgesFromDB(bookings) {
    const totalCountBadge = document.getElementById('totalOrdersCount');
    const pendingCountBadge = document.getElementById('pendingOrdersCount');
    const confirmedCountBadge = document.getElementById('confirmedOrdersCount');

    if (totalCountBadge) totalCountBadge.textContent = bookings.length;
    
    const pendingCount = bookings.filter(b => {
        const s = (b.status || '').toLowerCase();
        return s === 'قيد الانتظار' || s === 'pending';
    }).length;
    if (pendingCountBadge) pendingCountBadge.textContent = pendingCount;

    const confirmedCount = bookings.filter(b => {
        const s = (b.status || '').toLowerCase();
        return s === 'مؤكد' || s === 'confirmed' || s === 'completed';
    }).length;
    if (confirmedCountBadge) confirmedCountBadge.textContent = confirmedCount > 0 ? confirmedCount : bookings.length;
}

// ==========================================
// 7. تحديث البيانات الشخصية (PUT Request)
// ==========================================
function initializeProfileUpdate() {
    const saveProfileBtn = document.getElementById('saveProfileBtn');

    if (!saveProfileBtn) return;

    saveProfileBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const firstName = document.getElementById('profileFirstName').value.trim();
        const lastName = document.getElementById('profileLastName').value.trim();
        const phone = document.getElementById('profilePhone').value.trim();
        const governorate = document.getElementById('profileCity').value;
        const detailedArea = document.getElementById('profileArea').value.trim();

        if (!firstName || !lastName || !phone) {
            alert("يرجى تعبئة الحقول الأساسية: الاسم الأول، العائلة، ورقم الهاتف.");
            return;
        }

        try {
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
                    detailed_area: detailedArea
                })
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message || "تم تحديث البيانات الشخصية بنجاح! 🎉");

                // تحديث الـ Session Storage بالملف الشخصي الجديد المستلم من السيرفر
                sessionStorage.setItem('fixora_current_user', JSON.stringify(result.user));
                
                // تحديث الرسائل والمدخلات الفورية على الشاشة
                displayWelcomeMessage(result.user);
                populateProfileFields(result.user);
            } else {
                alert(result.message || "فشل تحديث البيانات، يرجى المحاولة لاحقاً.");
            }

        } catch (error) {
            console.error("خطأ أثناء تحديث الملف الشخصي:", error);
            alert("حدث خطأ في الاتصال بالسيرفر، يرجى التحقق من تشغيل السيرفر والمحاولة مجدداً.");
        }
    });
}

// ==========================================
// 8. عرض البيانات الجمالية للإشعارات والمحادثات
// ==========================================
function renderNotifications() {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    container.innerHTML = notificationsData.map(notif => `
        <div class="notification-item ${notif.read ? 'read' : ''}" style="padding: 12px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 20px;">${notif.icon}</div>
            <div style="flex: 1;">
                <strong style="color:#2c3e50; font-size:14px;">${notif.title}</strong>
                <p style="margin: 3px 0 0 0; font-size: 13px; color:#555;">${notif.text}</p>
                <span style="font-size: 11px; color: #999;">${notif.time}</span>
            </div>
        </div>
    `).join('');
}

function renderFavorites() {
    const container = document.getElementById('favoritesList');
    if (!container) return;
    container.innerHTML = favoritesData.map(fav => `
        <div class="favorite-card" style="padding: 12px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 24px; background: #f0f4f8; padding: 8px; border-radius: 50%;">${fav.icon}</div>
            <div>
                <strong style="color:#2c3e50;">${fav.name}</strong>
                <p style="margin: 3px 0 0 0; font-size: 13px; color:#7f8c8d;">${fav.specialty} · 📍 ${fav.location} · <span style="color:#f1c40f;">${fav.rating}</span></p>
            </div>
        </div>
    `).join('');
}

function renderMessages() {
    const container = document.getElementById('messagesList');
    if (!container) return;
    container.innerHTML = messagesData.map(msg => `
        <div class="message-item" style="padding: 12px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 20px;">${msg.icon}</div>
            <div>
                <strong style="color:#2c3e50;">${msg.sender}</strong>
                <p style="margin: 3px 0 0 0; font-size: 13px; color:#7f8c8d;">${msg.preview}</p>
            </div>
        </div>
    `).join('');
}

// ==========================================
// 9. إدارة تسجيل الخروج بأمان (Logout)
// ==========================================
function initializeLogout() {
    const logoutBtn = document.getElementById('logoutBtn') || document.getElementById('logout-btn');
    const sidebarLogoutLink = document.querySelector('.fxr-sidebar-links a[style*="color: #f75555"]');

    const handleLogout = (e) => {
        if (e) e.preventDefault();
        
        // تنظيف جلسة المستخدم والتوكنات بالكامل لمنع الوصول غير المصرح به
        localStorage.clear();
        sessionStorage.clear();
        
        alert('تم تسجيل الخروج بنجاح! نراكم قريباً في FIXORA الأردن.');
        window.location.href = 'login.html';
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (sidebarLogoutLink) sidebarLogoutLink.addEventListener('click', handleLogout);
}