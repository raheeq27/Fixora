// ========== بيانات الحرفي ==========
const providerData = {
    name: 'محمد أحمد أبو خالد',
    phone: '0791234567',
    specialty: 'تكييف وتبريد',
    city: 'عمّان',
    areas: 'الشميساني، عبدون، الجبيهة، الدوار السابع، مرج الحمام',
    minPrice: 15,
    maxPrice: 30,
    hours: 'الأحد – الخميس: 8:00 ص – 8:00 م | السبت: 9:00 ص – 4:00 م',
    bio: 'فني تكييف وأجهزة منزلية بخبرة 8 سنوات. أقدم خدمات التركيب والصيانة والتصليح بأسعار مناسبة وجودة عالية.',
    isAvailable: true,
    totalEarnings: 2540,
    monthlyEarnings: 620,
    totalServices: 127,
    avgRating: 4.9,
    totalReviews: 127
};

// ========== بيانات طلبات العمل ==========
let jobsData = [
    { id: 1, icon: '❄️', title: 'تصليح تكييف سبليت', customer: 'أحمد الكيلاني', location: 'الشميساني، عمّان', date: 'اليوم 3:00 م', price: 20, status: 'pending' },
    { id: 2, icon: '🌀', title: 'تنظيف وصيانة تكييف', customer: 'رنا الشرايري', location: 'عبدون، عمّان', date: 'غداً 10:00 ص', price: 15, status: 'pending' },
    { id: 3, icon: '🔌', title: 'تصليح غسالة أتوماتيك', customer: 'سامر البطاينة', location: 'الجبيهة، عمّان', date: 'غداً 2:00 م', price: 25, status: 'pending' },
    { id: 4, icon: '⚡', title: 'تصليح مفتاح كهرباء', customer: 'ليلى المصري', location: 'الدوار السابع، عمّان', date: 'السبت 11:00 ص', price: 12, status: 'accepted' }
];

// ========== بيانات الخدمات ==========
let servicesData = [
    { id: 1, icon: '❄️', name: 'تصليح وصيانة تكييفات', price: '15-30 دينار', description: 'جميع أنواع المكيفات سبليت ومركزي' },
    { id: 2, icon: '🔌', name: 'تصليح أجهزة منزلية', price: '10-25 دينار', description: 'غسالات، ثلاجات، مجففات' },
    { id: 3, icon: '⚡', name: 'كهرباء منزلية', price: '10-20 دينار', description: 'تصليح الأعطال الكهربائية' }
];

// ========== بيانات معرض الأعمال ==========
let galleryData = [
    { id: 1, icon: '❄️', label: 'تركيب تكييف سبليت' },
    { id: 2, icon: '🔧', label: 'صيانة مكيف مركزي' },
    { id: 3, icon: '⚙️', label: 'تصليح غسالة' },
    { id: 4, icon: '🌀', label: 'تنظيف مكيفات' }
];

// ========== بيانات التقييمات ==========
const reviewsData = [
    { id: 1, name: 'أحمد الكيلاني', rating: 5, text: 'خدمة ممتازة وسريعة، أسعاره معقولة جداً', date: '15 مارس 2025' },
    { id: 2, name: 'رنا الشرايري', rating: 4, text: 'جاء في الوقت المحدد وأصلح المشكلة بكفاءة', date: '10 مارس 2025' },
    { id: 3, name: 'سامر البطاينة', rating: 5, text: 'فني محترف وأنصح به بشدة', date: '5 مارس 2025' },
    { id: 4, name: 'ليلى المصري', rating: 4.5, text: 'خدمة جيدة وسعر مناسب', date: '28 فبراير 2025' }
];

// ========== بيانات المعاملات ==========
const transactionsData = [
    { id: 1, customer: 'أحمد الكيلاني', service: 'تصليح تكييف سبليت', amount: 20, date: '15 مارس 2025' },
    { id: 2, customer: 'رنا الشرايري', service: 'تنظيف وصيانة تكييف', amount: 15, date: '12 مارس 2025' },
    { id: 3, customer: 'سامر البطاينة', service: 'تصليح غسالة', amount: 25, date: '8 مارس 2025' }
];

// ========== المتغيرات العامة ==========
let currentTab = 'dashboard';
let currentEarningsFilter = 'month';

// ========== تحديث البادجات ==========
function updateBadges() {
    const pendingCount = jobsData.filter(j => j.status === 'pending').length;
    document.getElementById('jobsBadge').textContent = pendingCount;
}

// ========== عرض طلبات العمل (الصفحة 11) ==========
function renderJobsList() {
    const container = document.getElementById('jobsList');
    if (!container) return;
    
    const pendingJobs = jobsData.filter(j => j.status === 'pending');
    
    if (pendingJobs.length === 0) {
        container.innerHTML = '<div class="empty-state">🎉 لا توجد طلبات جديدة حالياً</div>';
        return;
    }
    
    container.innerHTML = pendingJobs.map(job => `
        <div class="job-card" data-id="${job.id}">
            <div class="job-icon">${job.icon}</div>
            <div class="job-details">
                <div class="job-title">${job.title}</div>
                <div class="job-meta">${job.customer} · ${job.location} · ${job.date}</div>
            </div>
            <div class="job-price">${job.price} دينار</div>
            <div class="job-actions">
                <button class="btn-accept" data-id="${job.id}">✅ قبول</button>
                <button class="btn-reject" data-id="${job.id}">✗ رفض</button>
            </div>
        </div>
    `).join('');
    
    // إضافة مستمعي الأحداث
    document.querySelectorAll('.btn-accept').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            acceptJob(id);
        });
    });
    
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            rejectJob(id);
        });
    });
}

// ========== قبول طلب عمل ==========
function acceptJob(jobId) {
    const job = jobsData.find(j => j.id === jobId);
    if (job) {
        job.status = 'accepted';
        updateBadges();
        renderJobsList();
        renderOrdersPreview();
        alert(`✅ تم قبول طلب "${job.title}" بنجاح! سيتم إشعار العميل.`);
    }
}

// ========== رفض طلب عمل ==========
function rejectJob(jobId) {
    const job = jobsData.find(j => j.id === jobId);
    if (job) {
        job.status = 'rejected';
        updateBadges();
        renderJobsList();
        renderOrdersPreview();
        alert(`❌ تم رفض طلب "${job.title}".`);
    }
}

// ========== عرض معاينة الطلبات في الصفحة الرئيسية ==========
function renderOrdersPreview() {
    const container = document.getElementById('ordersPreview');
    if (!container) return;
    
    const recentJobs = jobsData.filter(j => j.status === 'pending').slice(0, 3);
    
    if (recentJobs.length === 0) {
        container.innerHTML = '<div class="empty-state">لا توجد طلبات جديدة</div>';
        return;
    }
    
    container.innerHTML = recentJobs.map(job => `
        <div class="order-preview-item">
            <div class="order-preview-icon">${job.icon}</div>
            <div class="order-preview-details">
                <div class="order-preview-title">${job.title}</div>
                <div class="order-preview-meta">${job.customer} · ${job.location}</div>
            </div>
            <div class="order-preview-status">جديد</div>
        </div>
    `).join('');
}

// ========== عرض الخدمات ==========
function renderServicesList() {
    const container = document.getElementById('servicesList');
    if (!container) return;
    
    container.innerHTML = servicesData.map(service => `
        <div class="service-card">
            <div class="service-icon">${service.icon}</div>
            <div class="service-details">
                <div class="service-title">${service.name}</div>
                <div class="service-meta">${service.description}</div>
            </div>
            <div class="job-price">${service.price}</div>
            <button class="btn-reject delete-service" data-id="${service.id}">🗑️ حذف</button>
        </div>
    `).join('');
    
    document.querySelectorAll('.delete-service').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            servicesData = servicesData.filter(s => s.id !== id);
            renderServicesList();
            alert('🗑️ تم حذف الخدمة');
        });
    });
}

// ========== عرض معرض الأعمال ==========
function renderGallery() {
    const container = document.getElementById('galleryGrid');
    if (!container) return;
    
    container.innerHTML = galleryData.map(item => `
        <div class="gallery-item">
            <div class="gallery-image">${item.icon}</div>
            <button class="gallery-delete" data-id="${item.id}">✕</button>
        </div>
    `).join('');
    
    document.querySelectorAll('.gallery-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            galleryData = galleryData.filter(g => g.id !== id);
            renderGallery();
            alert('🗑️ تم حذف الصورة');
        });
    });
}

// ========== عرض الجدول ==========
function renderSchedule() {
    const container = document.getElementById('scheduleFull');
    if (!container) return;
    
    const days = [
        { name: 'الأحد', hours: '8:00 ص – 8:00 م' },
        { name: 'الإثنين', hours: '8:00 ص – 8:00 م' },
        { name: 'الثلاثاء', hours: '8:00 ص – 8:00 م' },
        { name: 'الأربعاء', hours: '8:00 ص – 8:00 م' },
        { name: 'الخميس', hours: '8:00 ص – 8:00 م' },
        { name: 'الجمعة', hours: 'إجازة' },
        { name: 'السبت', hours: '9:00 ص – 4:00 م' }
    ];
    
    container.innerHTML = `
        <div class="week-schedule">
            ${days.map(day => `
                <div class="day-schedule">
                    <div class="day-name">${day.name}</div>
                    <div class="day-hours">${day.hours}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// ========== عرض الأرباح ==========
function renderEarnings() {
    let total = providerData.totalEarnings;
    if (currentEarningsFilter === 'month') total = providerData.monthlyEarnings;
    
    document.getElementById('earningsTotal').textContent = total;
    
    // رسم بياني بسيط
    const chartContainer = document.getElementById('chartBars');
    const monthlyData = [450, 520, 580, 490, 620, 540];
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
    
    chartContainer.innerHTML = monthlyData.map(value => `
        <div class="chart-bar" style="height: ${value / 6}px;" title="${value} دينار"></div>
    `).join('');
    
    // عرض المعاملات
    const transactionsContainer = document.getElementById('transactionsList');
    if (transactionsContainer) {
        transactionsContainer.innerHTML = transactionsData.map(t => `
            <div class="transaction-item">
                <div class="job-details">
                    <div class="job-title">${t.service}</div>
                    <div class="job-meta">${t.customer} · ${t.date}</div>
                </div>
                <div class="transaction-amount">${t.amount} دينار</div>
            </div>
        `).join('');
    }
}

// ========== عرض التقييمات ==========
function renderReviews() {
    const container = document.getElementById('reviewsList');
    if (!container) return;
    
    container.innerHTML = reviewsData.map(review => `
        <div class="review-card">
            <div class="review-header">
                <span class="reviewer-name">${review.name}</span>
                <span class="review-rating">${'★'.repeat(Math.floor(review.rating))}${review.rating % 1 ? '½' : ''}</span>
            </div>
            <div class="review-text">${review.text}</div>
            <div class="review-date">${review.date}</div>
        </div>
    `).join('');
}

// ========== تبديل حالة التوفر ==========
function toggleAvailability() {
    providerData.isAvailable = !providerData.isAvailable;
    const btn = document.getElementById('toggleAvailabilityBtn');
    const headerBadge = document.getElementById('statusBadge');
    
    if (providerData.isAvailable) {
        btn.textContent = '🟢 متاح';
        btn.className = 'availability-btn available';
        headerBadge.innerHTML = '🟢 متاح الآن';
        headerBadge.style.background = 'rgba(40,200,100,.15)';
        headerBadge.style.color = '#28c840';
    } else {
        btn.textContent = '🔴 غير متاح';
        btn.className = 'availability-btn unavailable';
        headerBadge.innerHTML = '🔴 غير متاح';
        headerBadge.style.background = 'rgba(240,122,38,.15)';
        headerBadge.style.color = 'var(--orange)';
    }
    alert(`✅ تم تغيير حالة التوفر إلى "${providerData.isAvailable ? 'متاح' : 'غير متاح'}"`);
}

// ========== حفظ الملف الشخصي (الصفحة 12) ==========
function saveProfile() {
    const newName = document.getElementById('profileFullName')?.value;
    const newPhone = document.getElementById('profilePhone')?.value;
    const newSpecialty = document.getElementById('profileSpecialty')?.value;
    const newCity = document.getElementById('profileCity')?.value;
    const newAreas = document.getElementById('profileAreas')?.value;
    const newMinPrice = document.getElementById('profileMinPrice')?.value;
    const newMaxPrice = document.getElementById('profileMaxPrice')?.value;
    const newHours = document.getElementById('profileHours')?.value;
    const newBio = document.getElementById('profileBio')?.value;
    
    if (newName) providerData.name = newName;
    if (newPhone) providerData.phone = newPhone;
    if (newSpecialty) providerData.specialty = newSpecialty;
    if (newCity) providerData.city = newCity;
    if (newAreas) providerData.areas = newAreas;
    if (newMinPrice) providerData.minPrice = parseInt(newMinPrice);
    if (newMaxPrice) providerData.maxPrice = parseInt(newMaxPrice);
    if (newHours) providerData.hours = newHours;
    if (newBio) providerData.bio = newBio;
    
    // تحديث اسم المستخدم في الهيدر
    const firstName = providerData.name.split(' ')[0];
    document.getElementById('userNameDisplay').textContent = `أهلاً، ${firstName}`;
    
    alert('✅ تم حفظ التغييرات بنجاح!');
}

// ========== تبديل علامات التبويب ==========
function switchTab(tabId) {
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        }
    });
    
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const targetPanel = document.getElementById(`tab-${tabId}`);
    if (targetPanel) targetPanel.classList.add('active');
    
    currentTab = tabId;
    
    // تحديث المحتوى الديناميكي حسب التبويب
    if (tabId === 'jobs') renderJobsList();
    else if (tabId === 'services') renderServicesList();
    else if (tabId === 'gallery') renderGallery();
    else if (tabId === 'schedule') renderSchedule();
    else if (tabId === 'earnings') renderEarnings();
    else if (tabId === 'reviews') renderReviews();
}

// ========== عرض جميع طلبات العمل ==========
function viewAllJobs() {
    switchTab('jobs');
}

// ========== إضافة خدمة جديدة ==========
function addNewService() {
    const name = prompt('🔨 أدخل اسم الخدمة الجديدة:');
    if (name) {
        const price = prompt('💰 السعر التقريبي (دينار أردني):');
        const newId = servicesData.length + 1;
        servicesData.push({
            id: newId,
            icon: '🔧',
            name: name,
            price: price || 'حسب الخدمة',
            description: 'خدمة جديدة'
        });
        renderServicesList();
        alert('✅ تم إضافة الخدمة بنجاح');
    }
}

// ========== إضافة صورة جديدة ==========
function addNewImage() {
    const newId = galleryData.length + 1;
    galleryData.push({
        id: newId,
        icon: '🖼️',
        label: 'عمل جديد'
    });
    renderGallery();
    alert('✅ تم إضافة صورة جديدة');
}

// ========== تسجيل الخروج ==========
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        alert('🔐 تم تسجيل الخروج بنجاح.');
        // window.location.href = 'index.html';
    }
}

// ========== تهيئة الصفحة ==========
document.addEventListener('DOMContentLoaded', function() {
    // تحديث اسم المستخدم
    const firstName = providerData.name.split(' ')[0];
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
            if (goto === 'jobs') viewAllJobs();
        });
    });
    
    // تهيئة زر إضافة خدمة
    const addServiceBtn = document.getElementById('addServiceBtn');
    if (addServiceBtn) addServiceBtn.addEventListener('click', addNewService);
    
    // تهيئة زر إضافة صورة
    const addImageBtn = document.getElementById('addImageBtn');
    if (addImageBtn) addImageBtn.addEventListener('click', addNewImage);
    
    // تهيئة زر تبديل التوفر
    const toggleBtn = document.getElementById('toggleAvailabilityBtn');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleAvailability);
    
    // تهيئة زر حفظ الملف الشخصي
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveProfile);
    
    // تهيئة زر تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // تهيئة فلتر الأرباح
    const earningsFilter = document.getElementById('earningsFilter');
    if (earningsFilter) {
        earningsFilter.addEventListener('change', function() {
            currentEarningsFilter = this.value;
            renderEarnings();
        });
    }
    
    // عرض البيانات الافتراضية
    renderOrdersPreview();
    renderJobsList();
    renderServicesList();
    renderGallery();
    renderSchedule();
    renderEarnings();
    renderReviews();
});