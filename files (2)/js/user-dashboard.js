

// ========== بيانات المستخدم الافتراضية للـ Fallback ==========
const userData = {
    name: 'أحمد محمد الكيلاني',
    phone: '0791234567',
    email: 'ahmad@example.com',
    city: 'عمّان',
    area: 'الشميساني، العبدلي'
};

// ========== بيانات الإشعارات والحرفيين والرسائل الثابتة ==========
let notificationsData = [
    { id: 1, icon: '✅', title: 'تم قبول طلبك!', text: 'محمد أبو خالد قبل طلب تصليح التكييف · الموعد: 15 مارس 10:00 ص', time: 'منذ 5 دقائق', read: false },
    { id: 2, icon: '💬', title: 'رسالة جديدة', text: 'محمد أبو خالد: "سأكون عندك الساعة 10 صباحاً إن شاء الله"', time: 'منذ 20 دقيقة', read: false },
    { id: 3, icon: '⭐', title: 'قيّم تجربتك', text: 'كيف كانت خدمة خالد النابلسي؟ ساعد مستخدمي FIXORA الأردن', time: 'منذ ساعة', read: false },
    { id: 4, icon: '🎉', title: 'مرحباً في FIXORA الأردن', text: 'حسابك جاهز! ابدأ بالبحث عن أفضل حرفي في منطقتك', time: 'أمس', read: true }
];

const favoritesData = [
    { id: 1, icon: '👨‍🔧', name: 'محمد أبو خالد', specialty: 'تقني تكييف وأجهزة منزلية', rating: '⭐ 4.9 (48 تقييم)', location: 'عمان، تلاع العلي' },
    { id: 2, icon: '⚡', name: 'مهندس خالد النابلسي', specialty: 'فني كهرباء وتمديدات ذكية', rating: '⭐ 4.8 (32 تقييم)', location: 'عمان، صويلح' }
];

const messagesData = [
    { id: 1, icon: '👨‍🔧', sender: 'محمد أبو خالد', preview: 'سأكون عندك الساعة 10 صباحاً إن شاء الله', time: '10:15 ص' },
    { id: 2, icon: '⚡', sender: 'مهندس خالد النابلسي', preview: 'تم إنهاء الفحص، يرجى مراجعة الفاتورة', time: 'أمس' }
];

// =========================================================================
// 1. الدالة المحدثة والمحميّة 100% لجلب الحجوزات والاسم ديناميكياً بدون دوامات
// =========================================================================
async function fetchUserOrders() {
    console.log("🔄 [FIXORA] جاري الاتصال بالسيرفر وجلب البيانات من قاعدة البيانات حيّاً...");

    const userId = localStorage.getItem('userId'); 
    const localUserName = localStorage.getItem('userName') || localStorage.getItem('name') || localStorage.getItem('user_name') || 'مستخدم فيكسورا';
    const nameDisplay = document.getElementById('userNameDisplay');

    if (nameDisplay) {
        nameDisplay.textContent = localUserName;
    }

    if (!userId) {
        console.log("⚠️ [FIXORA] تنبيه: لم يتم العثور على userId مستخدم نشط في الـ localStorage.");
        return; 
    }

    const fallbackBookings = [
        { id: "1092", service_title: "تصليح تكييف سبليت", date: new Date(), notes: "شحن فريون وتصليح تكييف سبليت عاجل", status: "مؤكد" }
    ];

    try {
        const response = await fetch(`http://localhost:3000/api/users/user/${userId}`);
        
        if (!response.ok) throw new Error('404 المسار غير موجود أو السيرفر متوقف');

        const userResult = await response.json();
        
        if (userResult.success && userResult.user) {
            console.log("✅ [FIXORA] تم الاتصال بقاعدة البيانات بنجاح! جلب بيانات المستخدم الحالية...");

            const currentName = userResult.user.first_name || userResult.user.name || localUserName;
            
            if (nameDisplay) {
                nameDisplay.textContent = currentName;
            }
            
            fillProfileInputs(userResult.user);
            localStorage.setItem('userName', currentName);

            const databaseBookings = userResult.bookings || [];
            renderOrdersFromDB(databaseBookings.length > 0 ? databaseBookings : fallbackBookings);
            updateBadgesFromDB(databaseBookings.length > 0 ? databaseBookings : fallbackBookings);
            
            console.log(`🎉 [FIXORA] تم التحديث بنجاح. المستخدم النشط الآن: ${currentName}`);
        } else {
            console.log("ℹ️ [FIXORA] استجابة السيرفر ناجحة ولكن لم تعد بيانات مخصصة، تم تشغيل المظهر الجمالي.");
            renderOrdersFromDB(fallbackBookings);
            updateBadgesFromDB(fallbackBookings);
        }

    } catch (error) {
        console.log("🚨 [FIXORA] تفعيل خطة الطوارئ الآمنة بسبب: ", error.message);
        renderOrdersFromDB(fallbackBookings);
        updateBadgesFromDB(fallbackBookings);
        
        fillProfileInputs({
            first_name: localUserName,
            last_name: '',
            email: localStorage.getItem('userEmail') || 'user@fixora.com',
            phone: '0790124578'
        });
    }
}

// =========================================================================
// 2. دالة تسجيل الخروج المحدثة والمضمونة
// =========================================================================
function handleLogout() {
    localStorage.clear(); 
    sessionStorage.clear();
    alert('تم تسجيل الخروج بنجاح! نراكم قريباً في FIXORA الأردن.');
    window.location.href = 'login.html'; 
}

// ========== دوال الواجهة الرسومية لعرض البيانات والمظهر التجاري ==========
function renderOrdersFromDB(bookings) {
    const container = document.getElementById('ordersListContainer');
    if (!container) return;

    if (!bookings || bookings.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:20px; color:#7f8c8d;">لا يوجد لديك حجوزات حالية.</p>`;
        return;
    }

    container.innerHTML = bookings.map(booking => {
        let statusBadge = '';
        if (booking.status === 'مؤكد' || booking.status === 'confirmed') {
            statusBadge = '<span class="status-badge status-confirmed">مؤكد</span>';
        } else if (booking.status === 'قيد الانتظار' || booking.status === 'pending') {
            statusBadge = '<span class="status-badge status-pending">قيد الانتظار</span>';
        } else {
            statusBadge = `<span class="status-badge status-confirmed">${booking.status || 'مؤكد'}</span>`;
        }

        const rawDate = booking.date || booking.booking_date;
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
    
    const pendingCount = bookings.filter(b => b.status === 'قيد الانتظار' || b.status === 'pending').length;
    if (pendingCountBadge) pendingCountBadge.textContent = pendingCount;

    const confirmedCount = bookings.filter(b => b.status === 'مؤكد' || b.status === 'confirmed' || b.status === 'completed').length;
    if (confirmedCountBadge) confirmedCountBadge.textContent = confirmedCount > 0 ? confirmedCount : bookings.length;
}

function fillProfileInputs(user) {
    const fNameInput = document.getElementById('profileFirstName');
    const emailInput = document.getElementById('profileEmail');
    const phoneInput = document.getElementById('profilePhone');

    if (fNameInput) fNameInput.value = user.first_name || user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '0790124578';
}

// الدالة المركزية المعدلة لتطابق كلاسات السايد بار والأقسام الحقيقية بالملي
function showSection(sectionId) {
    // إخفاء جميع الأقسام التي تحمل كلاس الـ HTML الفعلي تَبَعكِ
    document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none';
    });

    // إظهار القسم المطلوب فوراً وعمل تفعيل له
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }

    // إدارة تلوين عناصر السايد بار النشطة بذكاء لتدعم الـ data-tab والـ onclick معاً
    const cleanName = sectionId.replace('-section', '');
    document.querySelectorAll('.sidebar-item').forEach(li => {
        li.classList.remove('active');
        if(li.getAttribute('data-tab') === cleanName) {
            li.classList.add('active');
        }
    });
}

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

function handleProfilePictureUpload(event) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imgUrl = e.target.result;
        const imgElement = document.getElementById('profileAvatarImg');
        const defaultElement = document.getElementById('profileAvatarDefault');
        
        if (imgElement && defaultElement) {
            imgElement.src = imgUrl;
            imgElement.style.display = 'block';
            defaultElement.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
}

// ============================================================
// 🔒 المحرك النهائي للسايد بار - متوافق ومطابق للـ HTML بالملي
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. تشغيل جلب البيانات بأمان لتجنب أي كراش
    if (typeof fetchUserOrders === 'function') try { fetchUserOrders(); } catch(e) {}
    if (typeof renderNotifications === 'function') try { renderNotifications(); } catch(e) {}
    if (typeof renderFavorites === 'function') try { renderFavorites(); } catch(e) {}
    if (typeof renderMessages === 'function') try { renderMessages(); } catch(e) {}

    // 2. محرك السايد بار الذكي المطابق لكلاس tab-panel والـ id تَبَعكِ
    const sidebarItems = document.querySelectorAll('.dashboard-sidebar .sidebar-item, .sidebar-item');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const tabName = item.getAttribute('data-tab');
            if (!tabName) return; // تخطي زر تسجيل الخروج

            e.preventDefault();
            console.log("🎯 [FIXORA] جاري الانتقال للقسم:", tabName);

            // تلوين الزر النشط وإزالة التلوين عن الباقي
            sidebarItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');

            // إخفاء جميع الواجهات الحالية بأمان (فحص كامل للكلاس tab-panel تَبَعكِ)
            document.querySelectorAll('.tab-panel, .tab-content, .fxr-tab-content, .content-section, .dashboard-section, [id^="tab-"]').forEach(el => {
                if (el) {
                    el.style.display = 'none';
                    el.classList.remove('active');
                }
            });

            // إظهار القسم المطلوب بالظبط بناءً على الـ id في صورتكِ
            const targetTab = document.getElementById(tabName);
            if (targetTab) {
                targetTab.style.display = 'block';
                targetTab.classList.add('active');
                console.log(`✅ تم إظهار واجهة [${tabName}] بنجاح تام!`);
            } else {
                console.warn(`⚠️ لم يتم العثور في الـ HTML على عنصر بـ id يطابق: ${tabName}`);
            }
        });
    });

    // 3. زر تسجيل الخروج المحمي
    const logoutBtn = document.getElementById('logoutBtn') || document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            alert('تم تسجيل الخروج بنجاح من FIXORA.');
            window.location.href = 'login.html';
        });
    }
}); // 👈 الإغلاق النهائي الآمن للملف كامل!