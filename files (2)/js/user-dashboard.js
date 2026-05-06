// ========== بيانات المستخدم ==========
const userData = {
    name: 'أحمد محمد الكيلاني',
    phone: '0791234567',
    email: 'ahmad@example.com',
    city: 'عمّان',
    area: 'الشميساني، العبدلي'
};

// ========== بيانات الطلبات ==========
const ordersData = [
    { id: 1, icon: '❄️', title: 'تصليح تكييف سبليت', provider: 'محمد أبو خالد', location: 'الشميساني، عمّان', date: '15 مارس 2025', price: 25, status: 'progress' },
    { id: 2, icon: '⚡', title: 'تصليح مفتاح كهرباء', provider: 'خالد النابلسي', location: 'عبدون، عمّان', date: '10 مارس 2025', price: 15, status: 'accepted' },
    { id: 3, icon: '🚿', title: 'إصلاح تسريب ماء', provider: 'يوسف الحوراني', location: 'إربد', date: '2 مارس 2025', price: 20, status: 'completed' },
    { id: 4, icon: '🌀', title: 'تنظيف وصيانة تكييف', provider: 'عمر الرواشدة', location: 'الجبيهة، عمّان', date: '25 فبراير 2025', price: 18, status: 'completed' },
    { id: 5, icon: '🔌', title: 'تصليح غسالة أتوماتيك', provider: 'باسل المومني', location: 'ماركا، عمّان', date: '20 فبراير 2025', price: 22, status: 'rejected' }
];

// ========== بيانات الإشعارات ==========
let notificationsData = [
    { id: 1, icon: '✅', title: 'تم قبول طلبك!', text: 'محمد أبو خالد قبل طلب تصليح التكييف · الموعد: 15 مارس 10:00 ص', time: 'منذ 5 دقائق', read: false },
    { id: 2, icon: '💬', title: 'رسالة جديدة', text: 'محمد أبو خالد: "سأكون عندك الساعة 10 صباحاً إن شاء الله"', time: 'منذ 20 دقيقة', read: false },
    { id: 3, icon: '⭐', title: 'قيّم تجربتك', text: 'كيف كانت خدمة خالد النابلسي؟ ساعد مستخدمي FIXORA الأردن', time: 'منذ ساعة', read: false },
    { id: 4, icon: '🎉', title: 'مرحباً في FIXORA الأردن', text: 'حسابك جاهز! ابدأ بالبحث عن أفضل حرفي في منطقتك', time: 'أمس', read: true }
];

// ========== بيانات الحرفيين المفضلين ==========
const favoritesData = [
    { id: 1, icon: '👨‍🔧', name: 'محمد أبو خالد', specialty: 'تكييف وأجهزة منزلية', location: 'الشميساني، عمّان', rating: '4.9 ★' },
    { id: 2, icon: '👨‍🔧', name: 'خالد النابلسي', specialty: 'كهرباء منزلية', location: 'الزرقاء', rating: '4.7 ★' },
    { id: 3, icon: '👨‍🔧', name: 'يوسف الحوراني', specialty: 'سباكة', location: 'إربد', rating: '4.6 ★' },
    { id: 4, icon: '👨‍🔧', name: 'فراس الزيادات', specialty: 'تكييف وتبريد', location: 'مرج الحمام، عمّان', rating: '4.5 ★' }
];

// ========== بيانات الرسائل ==========
const messagesData = [
    { id: 1, icon: '👨‍🔧', sender: 'محمد أبو خالد', preview: 'سأكون عندك الساعة 10 صباحاً إن شاء الله', time: '10:30 ص', unread: true },
    { id: 2, icon: '👨‍🔧', sender: 'خالد النابلسي', preview: 'تم الانتهاء من العمل، شكراً لثقتكم', time: 'أمس', unread: false },
    { id: 3, icon: '👨‍🔧', sender: 'يوسف الحوراني', preview: 'هل لديك أي استفسار بخصوص الصيانة؟', time: 'أمس', unread: false }
];

// ========== المتغيرات العامة ==========
let currentTab = 'dashboard';
let currentOrderFilter = 'all';

// ========== دالة للحصول على نص الحالة ==========
function getStatusText(status) {
    const statuses = {
        'progress': 'جاري',
        'accepted': 'مقبول',
        'rejected': 'مرفوض',
        'completed': 'مكتمل'
    };
    return statuses[status] || status;
}

// ========== دالة للحصول على icon الحالة ==========
function getStatusIcon(status) {
    const icons = {
        'progress': '⏳',
        'accepted': '✅',
        'rejected': '❌',
        'completed': '✓'
    };
    return icons[status] || '•';
}

// ========== تحديث البادجات ==========
function updateBadges() {
    const activeCount = ordersData.filter(o => o.status === 'progress' || o.status === 'accepted').length;
    document.getElementById('ordersBadge').textContent = activeCount;
    document.getElementById('favBadge').textContent = favoritesData.length;
    document.getElementById('msgBadge').textContent = messagesData.filter(m => m.unread).length;
    const unreadCount = notificationsData.filter(n => !n.read).length;
    document.getElementById('notifBadge').textContent = unreadCount;
}

// ========== عرض نافذة الإشعار المحسّن ==========
function showNotificationPopup(title, message) {
    let popup = document.getElementById('notificationPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'notificationPopup';
        popup.className = 'notification-popup';
        document.body.appendChild(popup);
    }
    
    popup.innerHTML = `
        <div class="notification-popup-content">
            <div class="notification-popup-title">${title}</div>
            <div class="notification-popup-text">${message}</div>
            <button class="notification-popup-btn" onclick="closeNotificationPopup()">حسناً</button>
        </div>
    `;
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
    }, 4000);
}

function closeNotificationPopup() {
    const popup = document.getElementById('notificationPopup');
    if (popup) popup.classList.remove('show');
}

// ========== عرض الطلبات (صفحة طلباتي) ==========
function renderOrdersList() {
    let filtered = ordersData;
    if (currentOrderFilter === 'progress') {
        filtered = ordersData.filter(o => o.status === 'progress');
    } else if (currentOrderFilter === 'accepted') {
        filtered = ordersData.filter(o => o.status === 'accepted');
    } else if (currentOrderFilter === 'completed') {
        filtered = ordersData.filter(o => o.status === 'completed');
    } else if (currentOrderFilter === 'rejected') {
        filtered = ordersData.filter(o => o.status === 'rejected');
    }
    
    const container = document.getElementById('ordersListFull');
    if (!container) return;
    
    container.innerHTML = filtered.map(order => `
        <div class="order-full-item status-${order.status}">
            <div class="order-full-icon">${order.icon}</div>
            <div class="order-full-details">
                <div class="order-full-title">${order.title}</div>
                <div class="order-full-meta">${order.provider} · ${order.location} · ${order.date}</div>
            </div>
            <div class="order-full-status">
                <span class="status-badge status-${order.status}">${getStatusIcon(order.status)} ${getStatusText(order.status)}</span>
            </div>
            <div class="order-full-actions">
                ${order.status === 'completed' ? '<button class="btn-small btn-rate" data-order="' + order.id + '">⭐ قيّم</button>' : ''}
                <button class="btn-small btn-detail" data-order="' + order.id + '">تفاصيل</button>
            </div>
        </div>
    `).join('');
    
    // إضافة مستمعي الأحداث للأزرار
    document.querySelectorAll('.btn-rate').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab('notifications');
            showNotificationPopup('⭐ شكراً لتقييمك!', 'تم تسجيل تقييمك بنجاح. آرائك تساعدنا في تحسين الخدمة.');
        });
    });
    document.querySelectorAll('.btn-detail').forEach(btn => {
        btn.addEventListener('click', () => {
            showNotificationPopup('📋 تفاصيل الطلب', 'سيتم عرض معلومات أكثر تفصيلاً قريباً.');
        });
    });
}

// ========== عرض الإشعارات (صفحة الإشعارات) ==========
function renderNotifications() {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    container.innerHTML = notificationsData.map(notif => `
        <div class="notif-full-item ${!notif.read ? 'unread' : ''}" data-id="${notif.id}">
            <div class="notif-full-icon">${notif.icon}</div>
            <div class="notif-full-details">
                <div class="notif-full-title">${notif.title}</div>
                <div class="notif-full-text">${notif.text}</div>
                <div class="notif-full-time">${notif.time}</div>
            </div>
        </div>
    `).join('');
}

// ========== عرض الحرفيين المفضلين ==========
function renderFavorites() {
    const container = document.getElementById('favListFull');
    if (!container) return;
    
    container.innerHTML = favoritesData.map(fav => `
        <div class="fav-full-card">
            <div class="fav-full-icon">${fav.icon}</div>
            <div class="fav-full-info">
                <h4>${fav.name}</h4>
                <div class="fav-full-specialty">${fav.specialty}</div>
                <div class="fav-full-location">📍 ${fav.location} · ${fav.rating}</div>
            </div>
        </div>
    `).join('');
}

// ========== عرض الرسائل ==========
function renderMessages() {
    const container = document.getElementById('messagesList');
    if (!container) return;
    
    container.innerHTML = messagesData.map(msg => `
        <div class="message-item ${msg.unread ? 'unread' : ''}">
            <div class="message-avatar">${msg.icon}</div>
            <div class="message-content">
                <div class="message-sender">${msg.sender}</div>
                <div class="message-preview">${msg.preview}</div>
            </div>
            <div class="message-time">${msg.time}</div>
        </div>
    `).join('');
}

// ========== تبديل علامات التبويب ==========
function switchTab(tabId) {
    // تحديث القائمة الجانبية
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        }
    });
    
    // تحديث المحتوى
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const targetPanel = document.getElementById(`tab-${tabId}`);
    if (targetPanel) targetPanel.classList.add('active');
    
    currentTab = tabId;
    
    // تحديث المحتوى الديناميكي حسب التبويب
    if (tabId === 'orders') {
        renderOrdersList();
    } else if (tabId === 'favorites') {
        renderFavorites();
    } else if (tabId === 'messages') {
        renderMessages();
    } else if (tabId === 'notifications') {
        renderNotifications();
    }
}

// ========== فلترة الطلبات ==========
function initOrderFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentOrderFilter = this.getAttribute('data-filter');
            renderOrdersList();
        });
    });
}

// ========== تحديد الكل كمقروء ==========
function markAllRead() {
    notificationsData.forEach(n => n.read = true);
    renderNotifications();
    updateBadges();
    showNotificationPopup('✅ تم', 'تم تحديد جميع الإشعارات كمقروءة');
}

// ========== حفظ الملف الشخصي ==========
function saveProfile() {
    const newFirstName = document.getElementById('profileFirstName')?.value;
    const newLastName = document.getElementById('profileLastName')?.value;
    const newPhone = document.getElementById('profilePhone')?.value;
    const newEmail = document.getElementById('profileEmail')?.value;
    const newCity = document.getElementById('profileCity')?.value;
    const newArea = document.getElementById('profileArea')?.value;
    
    if (newFirstName && newLastName) userData.name = `${newFirstName} ${newLastName}`;
    if (newPhone) userData.phone = newPhone;
    if (newEmail) userData.email = newEmail;
    if (newCity) userData.city = newCity;
    if (newArea) userData.area = newArea;
    
    // تحديث اسم المستخدم في الهيدر
    const firstName = userData.name.split(' ')[0];
    document.getElementById('userNameDisplay').textContent = `أهلاً، ${firstName}`;
    
    showNotificationPopup('✅ تم', 'تم حفظ التغييرات بنجاح!');
}

// ========== معالج رفع صورة الملف الشخصي ==========
function handleProfilePictureUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
        showNotificationPopup('⚠️ خطأ', 'الرجاء اختيار ملف صورة صحيح (JPG, PNG, إلخ)');
        return;
    }
    
    // التحقق من حجم الملف (5 MB أقصى)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotificationPopup('⚠️ خطأ', 'حجم الصورة أكبر من 5 MB. الرجاء اختيار صورة أصغر.');
        return;
    }
    
    // قراءة الملف وعرض المعاينة
    const reader = new FileReader();
    reader.onload = function(e) {
        const imgUrl = e.target.result;
        
        // إخفاء الأيقونة الافتراضية وعرض الصورة
        const imgElement = document.getElementById('profileAvatarImg');
        const defaultElement = document.getElementById('profileAvatarDefault');
        
        imgElement.src = imgUrl;
        imgElement.style.display = 'flex';
        defaultElement.style.display = 'none';
        
        // حفظ الصورة في localStorage (أو يمكن إرسالها إلى السيرفر)
        localStorage.setItem('userProfilePicture', imgUrl);
        
        showNotificationPopup('✅ تم', 'تم تحديث الصورة بنجاح!');
    };
    reader.readAsDataURL(file);
    
    // إعادة تعيين حقل الملف
    event.target.value = '';
}

// ========== تسجيل الخروج ==========
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        showNotificationPopup('🔐 تم', 'تم تسجيل الخروج بنجاح. سيتم توجيهك إلى الصفحة الرئيسية.');
        // window.location.href = 'index.html';
    }
}

// ========== حذف الحساب ==========
function deleteAccount() {
    if (confirm('⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد من حذف حسابك؟')) {
        if (confirm('هل أنت متأكد تماماً؟ سيتم حذف جميع بياناتك نهائياً.')) {
            showNotificationPopup('🗑️ تم', 'تم حذف حسابك. نشكرك على ثقتك بنا.');
            // window.location.href = 'index.html';
        }
    }
}

// ========== عرض جميع الطلبات من الصفحة الرئيسية ==========
function viewAllOrders() {
    switchTab('orders');
}

// ========== عرض جميع الإشعارات من الصفحة الرئيسية ==========
function viewAllNotifications() {
    switchTab('notifications');
}

// ========== تهيئة الصفحة ==========
document.addEventListener('DOMContentLoaded', function() {
    // تحديث اسم المستخدم
    const firstName = userData.name.split(' ')[0];
    document.getElementById('userNameDisplay').textContent = `أهلاً، ${firstName}`;
    
    // تحديث البادجات
    updateBadges();
    
    // تهيئة القائمة الجانبية
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            if (tabId) switchTab(tabId);
        });
    });
    
    // تهيئة أزرار "عرض الكل"
    document.querySelectorAll('.view-all-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const goto = this.getAttribute('data-goto');
            if (goto === 'orders') viewAllOrders();
            else if (goto === 'notifications') viewAllNotifications();
        });
    });
    
    // تهيئة فلترة الطلبات
    initOrderFilters();
    
    // تهيئة زر تحديد الكل كمقروء
    const markReadBtn = document.getElementById('markAllRead');
    if (markReadBtn) markReadBtn.addEventListener('click', markAllRead);
    
    // تهيئة زر حفظ الملف الشخصي
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveProfile);
    
    // تهيئة زر تحميل صورة الملف الشخصي
    const uploadPictureBtn = document.getElementById('btnUploadPicture');
    const profilePictureInput = document.getElementById('profilePictureInput');
    if (uploadPictureBtn) uploadPictureBtn.addEventListener('click', function() {
        profilePictureInput.click();
    });
    if (profilePictureInput) profilePictureInput.addEventListener('change', handleProfilePictureUpload);
    
    // استرجاع الصورة المحفوظة من localStorage
    const savedPicture = localStorage.getItem('userProfilePicture');
    if (savedPicture) {
        const imgElement = document.getElementById('profileAvatarImg');
        const defaultElement = document.getElementById('profileAvatarDefault');
        imgElement.src = savedPicture;
        imgElement.style.display = 'flex';
        defaultElement.style.display = 'none';
    }
    
    // تهيئة زر تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // تهيئة زر حذف الحساب
    const deleteBtn = document.getElementById('deleteAccountBtn');
    if (deleteBtn) deleteBtn.addEventListener('click', deleteAccount);
    
    // عرض البيانات الافتراضية
    renderOrdersList();
    renderFavorites();
    renderMessages();
    renderNotifications();
});