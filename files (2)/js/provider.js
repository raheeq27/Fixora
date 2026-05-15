/**
 * FIXORA — booking.js
 * JavaScript الخاص بصفحة حجز الخدمة - مع استقبال معرف الحرفي من الرابط
 */

'use strict';

// ========================================
// PROVIDER DATA (يتم جلبها حسب ID من الرابط)
// ========================================
const fxrProvidersDB = {
  1: {
    id: 1,
    name: 'محمد أبو خالد',
    specialty: 'تقني تكييف وأجهزة منزلية',
    rating: 4.9,
    avatar: '👨‍🔧',
    priceMin: 15,
    priceMax: 30
  },
  2: {
    id: 2,
    name: 'خالد النابلسي',
    specialty: 'كهرباء منزلية',
    rating: 4.7,
    avatar: '👨‍🔧',
    priceMin: 10,
    priceMax: 25
  },
  3: {
    id: 3,
    name: 'يوسف الحوراني',
    specialty: 'سباكة وصرف صحي',
    rating: 4.6,
    avatar: '👷',
    priceMin: 12,
    priceMax: 35
  }
};

// ========================================
// STATE
// ========================================
let fxrProvider = null;
let fxrBookingState = {
  step: 1,
  serviceType: '',
  problemDescription: '',
  urgency: 'normal',
  selectedDate: null,
  selectedDay: null,
  selectedDayName: null,
  selectedTime: null,
  locationType: 'home',
  governorate: 'عمّان',
  area: '',
  addressDetail: '',
  landmark: '',
  additionalNotes: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  paymentMethod: 'cash'
};

// ========================================
// PRICE MAPPING
// ========================================
const fxrPriceMapping = {
  'تصليح تكييف سبليت': { min: 15, max: 25 },
  'تصليح تكييف مركزي': { min: 25, max: 40 },
  'شحن فريون': { min: 10, max: 20 },
  'صيانة دورية': { min: 12, max: 20 },
  'تنظيف مكيفات': { min: 8, max: 15 },
  'تصليح غسالة': { min: 12, max: 25 },
  'تصليح ثلاجة': { min: 15, max: 30 },
  'تصليح سخان مياه': { min: 10, max: 20 }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================
function fxrShowToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

function fxrFormatPrice(min, max) {
  return `${min} - ${max} دينار أردني`;
}

function fxrGetEstimatedPrice() {
  if (!fxrBookingState.serviceType || !fxrProvider) return '—';
  const price = fxrPriceMapping[fxrBookingState.serviceType];
  if (!price) return '—';
  if (fxrBookingState.urgency === 'emergency') {
    return fxrFormatPrice(price.min + 10, price.max + 15);
  }
  if (fxrBookingState.urgency === 'urgent') {
    return fxrFormatPrice(price.min + 5, price.max + 8);
  }
  return fxrFormatPrice(price.min, price.max);
}

// ========================================
// STEP NAVIGATION
// ========================================
function fxrUpdateStepsUI() {
  for (let i = 1; i <= 3; i++) {
    const step = document.querySelector(`.fxr-step[data-step="${i}"]`);
    const content = document.getElementById(`step${i}`);
    if (step) {
      if (i < fxrBookingState.step) {
        step.classList.add('completed');
      } else {
        step.classList.remove('completed');
      }
      if (i === fxrBookingState.step) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    }
    if (content) {
      if (i === fxrBookingState.step) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    }
  }
}

function fxrNextStep(step) {
  // Validation for step 1
  if (step === 2) {
    if (!fxrBookingState.serviceType) {
      fxrShowToast('❌ الرجاء اختيار نوع الخدمة');
      return;
    }
    if (!fxrBookingState.problemDescription) {
      fxrShowToast('❌ الرجاء كتابة وصف المشكلة');
      return;
    }
  }
  
  // Validation for step 2
  if (step === 3) {
    if (!fxrBookingState.selectedDate) {
      fxrShowToast('❌ الرجاء اختيار تاريخ الخدمة');
      return;
    }
    if (!fxrBookingState.selectedTime) {
      fxrShowToast('❌ الرجاء اختيار الوقت المناسب');
      return;
    }
    if (!fxrBookingState.area || !fxrBookingState.addressDetail) {
      fxrShowToast('❌ الرجاء إدخال العنوان بالكامل');
      return;
    }
    
    // Update order summary before showing step 3
    fxrUpdateOrderSummary();
  }
  
  fxrBookingState.step = step;
  fxrUpdateStepsUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fxrPrevStep(step) {
  fxrBookingState.step = step;
  fxrUpdateStepsUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// STEP 1 FUNCTIONS
// ========================================
function fxrUpdateServiceDetails() {
  const serviceSelect = document.getElementById('serviceType');
  fxrBookingState.serviceType = serviceSelect.value;
  
  const priceEl = document.getElementById('estimatedPrice');
  if (priceEl) {
    priceEl.textContent = fxrGetEstimatedPrice();
  }
}

function fxrUpdateProblemDescription() {
  fxrBookingState.problemDescription = document.getElementById('problemDescription').value;
}

function fxrUpdateUrgency() {
  const radios = document.querySelectorAll('input[name="urgency"]');
  for (const radio of radios) {
    if (radio.checked) {
      fxrBookingState.urgency = radio.value;
      break;
    }
  }
  const priceEl = document.getElementById('estimatedPrice');
  if (priceEl) {
    priceEl.textContent = fxrGetEstimatedPrice();
  }
}

// ========================================
// STEP 2 FUNCTIONS - DATE & TIME
// ========================================
function fxrGenerateDates() {
  const dateGrid = document.getElementById('dateGrid');
  if (!dateGrid) return;
  
  const today = new Date();
  const dates = [];
  
  for (let i = 1; i <= 12; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  dateGrid.innerHTML = dates.map(date => {
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = dayNames[date.getDay()];
    const dayNumber = date.getDate();
    const month = date.getMonth() + 1;
    const dateStr = `${date.getFullYear()}-${month}-${dayNumber}`;
    const isSelected = fxrBookingState.selectedDate === dateStr;
    
    return `
      <div class="fxr-date-card ${isSelected ? 'selected' : ''}" onclick="fxrSelectDate('${dateStr}', ${dayNumber}, '${dayName}')">
        <div class="fxr-date-day">${dayName}</div>
        <div class="fxr-date-number">${dayNumber}</div>
      </div>
    `;
  }).join('');
}

function fxrSelectDate(dateStr, dayNumber, dayName) {
  fxrBookingState.selectedDate = dateStr;
  fxrBookingState.selectedDay = dayNumber;
  fxrBookingState.selectedDayName = dayName;
  
  // Update UI
  document.querySelectorAll('.fxr-date-card').forEach(card => {
    card.classList.remove('selected');
  });
  event.target.closest('.fxr-date-card').classList.add('selected');
  
  // Show time selection
  const timeGroup = document.getElementById('timeGroup');
  if (timeGroup) timeGroup.style.display = 'block';
  
  fxrGenerateTimes();
}

function fxrGenerateTimes() {
  const timeGrid = document.getElementById('timeGrid');
  if (!timeGrid) return;
  
  const times = ['9:00 ص', '10:00 ص', '11:00 ص', '12:00 م', '1:00 م', '2:00 م', '3:00 م', '4:00 م', '5:00 م', '6:00 م'];
  const isFriday = fxrBookingState.selectedDayName === 'الجمعة';
  
  timeGrid.innerHTML = times.map(time => {
    let disabled = false;
    if (isFriday) disabled = true;
    if (time === '12:00 م') disabled = true;
    
    const isSelected = fxrBookingState.selectedTime === time;
    
    return `
      <div class="fxr-time-card ${disabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}" 
           onclick="${disabled ? '' : `fxrSelectTime('${time}')`}">
        ${time}
      </div>
    `;
  }).join('');
}

function fxrSelectTime(time) {
  fxrBookingState.selectedTime = time;
  
  document.querySelectorAll('.fxr-time-card').forEach(card => {
    card.classList.remove('selected');
  });
  event.target.classList.add('selected');
}

// ========================================
// STEP 2 FUNCTIONS - LOCATION
// ========================================
function fxrToggleLocationForm() {
  const radios = document.querySelectorAll('input[name="locationType"]');
  for (const radio of radios) {
    if (radio.checked) {
      fxrBookingState.locationType = radio.value;
      break;
    }
  }
  
  const addressForm = document.getElementById('addressForm');
  if (addressForm) addressForm.style.display = 'block';
}

function fxrUpdateAddress() {
  fxrBookingState.governorate = document.getElementById('governorate').value;
  fxrBookingState.area = document.getElementById('area').value;
  fxrBookingState.addressDetail = document.getElementById('addressDetail').value;
  fxrBookingState.landmark = document.getElementById('landmark').value;
  fxrBookingState.additionalNotes = document.getElementById('additionalNotes').value;
}

// ========================================
// STEP 3 FUNCTIONS
// ========================================
function fxrUpdateOrderSummary() {
  const summaryEl = document.getElementById('orderSummary');
  if (!summaryEl || !fxrProvider) return;
  
  const fullAddress = `${fxrBookingState.governorate}، ${fxrBookingState.area}، ${fxrBookingState.addressDetail}`;
  const urgencyText = {
    'normal': 'عادي',
    'urgent': 'مستعجل',
    'emergency': 'طوارئ'
  };
  
  summaryEl.innerHTML = `
    <div class="fxr-summary-item">
      <span class="fxr-summary-label">الحرفي</span>
      <span class="fxr-summary-value">${fxrProvider.name}</span>
    </div>
    <div class="fxr-summary-item">
      <span class="fxr-summary-label">نوع الخدمة</span>
      <span class="fxr-summary-value">${fxrBookingState.serviceType}</span>
    </div>
    <div class="fxr-summary-item">
      <span class="fxr-summary-label">وصف المشكلة</span>
      <span class="fxr-summary-value">${fxrBookingState.problemDescription.substring(0, 60)}${fxrBookingState.problemDescription.length > 60 ? '...' : ''}</span>
    </div>
    <div class="fxr-summary-item">
      <span class="fxr-summary-label">درجة الإلحاح</span>
      <span class="fxr-summary-value">${urgencyText[fxrBookingState.urgency]}</span>
    </div>
    <div class="fxr-summary-item">
      <span class="fxr-summary-label">تاريخ ووقت الخدمة</span>
      <span class="fxr-summary-value">${fxrBookingState.selectedDayName} ${fxrBookingState.selectedDay} — ${fxrBookingState.selectedTime}</span>
    </div>
    <div class="fxr-summary-item">
      <span class="fxr-summary-label">موقع الخدمة</span>
      <span class="fxr-summary-value">${fullAddress}</span>
    </div>
    <div class="fxr-summary-item fxr-summary-total">
      <span class="fxr-summary-label">السعر التقريبي</span>
      <span class="fxr-summary-value">${fxrGetEstimatedPrice()}</span>
    </div>
  `;
}

function fxrUpdateCustomerInfo() {
  fxrBookingState.customerName = document.getElementById('customerName').value;
  fxrBookingState.customerPhone = document.getElementById('customerPhone').value;
  fxrBookingState.customerEmail = document.getElementById('customerEmail').value;
}

function fxrUpdatePaymentMethod() {
  const radios = document.querySelectorAll('input[name="payment"]');
  for (const radio of radios) {
    if (radio.checked) {
      fxrBookingState.paymentMethod = radio.value;
      break;
    }
  }
}

function fxrToggleConfirmBtn() {
  const agreeCheckbox = document.getElementById('agreeTerms');
  const confirmBtn = document.getElementById('confirmBtn');
  if (confirmBtn) {
    confirmBtn.disabled = !agreeCheckbox.checked;
  }
}

function fxrConfirmBooking() {
  fxrUpdateCustomerInfo();
  fxrUpdatePaymentMethod();
  
  // Validate customer info
  if (!fxrBookingState.customerName) {
    fxrShowToast('❌ الرجاء إدخال الاسم الكامل');
    return;
  }
  if (!fxrBookingState.customerPhone) {
    fxrShowToast('❌ الرجاء إدخال رقم الجوال');
    return;
  }
  if (!fxrBookingState.customerPhone.match(/07[0-9]{8}/)) {
    fxrShowToast('❌ الرجاء إدخال رقم جوال أردني صحيح (07xxxxxxxx)');
    return;
  }
  
  // Save booking to localStorage (simulate)
  const booking = {
    id: Date.now(),
    providerId: fxrProvider.id,
    provider: fxrProvider,
    ...fxrBookingState,
    bookingDate: new Date().toISOString(),
    status: 'pending'
  };
  
  const bookings = JSON.parse(localStorage.getItem('fxrBookings') || '[]');
  bookings.push(booking);
  localStorage.setItem('fxrBookings', JSON.stringify(bookings));
  
  fxrShowToast('✅ تم تأكيد حجزك بنجاح! سيتم إشعارك قريباً');
  
  // Redirect to user dashboard after 2 seconds
  setTimeout(() => {
    window.location.href = 'user-dashboard.html';
  }, 2000);
}

// ========================================
// INITIALIZE PROVIDER INFO FROM URL
// ========================================
function fxrInitProviderInfo() {
  // Get provider ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const providerId = urlParams.get('id');
  
  if (providerId && fxrProvidersDB[providerId]) {
    fxrProvider = fxrProvidersDB[providerId];
  } else {
    // Default to first provider if ID not found
    fxrProvider = fxrProvidersDB[1];
  }
  
  // Update UI with provider info
  const avatarEl = document.getElementById('providerAvatar');
  const nameEl = document.getElementById('providerName');
  const specialtyEl = document.getElementById('providerSpecialty');
  const ratingEl = document.getElementById('providerRating');
  
  if (avatarEl) avatarEl.textContent = fxrProvider.avatar;
  if (nameEl) nameEl.textContent = fxrProvider.name;
  if (specialtyEl) specialtyEl.textContent = `🔧 ${fxrProvider.specialty}`;
  if (ratingEl) ratingEl.textContent = `★★★★★ ${fxrProvider.rating}`;
}

// ========================================
// EVENT LISTENERS
// ========================================
function fxrSetupEventListeners() {
  // Step 1
  const serviceSelect = document.getElementById('serviceType');
  if (serviceSelect) serviceSelect.addEventListener('change', fxrUpdateServiceDetails);
  
  const problemDesc = document.getElementById('problemDescription');
  if (problemDesc) problemDesc.addEventListener('input', fxrUpdateProblemDescription);
  
  const urgencyRadios = document.querySelectorAll('input[name="urgency"]');
  urgencyRadios.forEach(radio => radio.addEventListener('change', fxrUpdateUrgency));
  
  // Step 2
  const governorateSelect = document.getElementById('governorate');
  if (governorateSelect) governorateSelect.addEventListener('change', fxrUpdateAddress);
  
  const areaInput = document.getElementById('area');
  if (areaInput) areaInput.addEventListener('input', fxrUpdateAddress);
  
  const addressDetailInput = document.getElementById('addressDetail');
  if (addressDetailInput) addressDetailInput.addEventListener('input', fxrUpdateAddress);
  
  const landmarkInput = document.getElementById('landmark');
  if (landmarkInput) landmarkInput.addEventListener('input', fxrUpdateAddress);
  
  const notesInput = document.getElementById('additionalNotes');
  if (notesInput) notesInput.addEventListener('input', fxrUpdateAddress);
  
  const locationRadios = document.querySelectorAll('input[name="locationType"]');
  locationRadios.forEach(radio => radio.addEventListener('change', fxrToggleLocationForm));
  
  // Step 3
  const customerNameInput = document.getElementById('customerName');
  if (customerNameInput) customerNameInput.addEventListener('input', fxrUpdateCustomerInfo);
  
  const customerPhoneInput = document.getElementById('customerPhone');
  if (customerPhoneInput) customerPhoneInput.addEventListener('input', fxrUpdateCustomerInfo);
  
  const customerEmailInput = document.getElementById('customerEmail');
  if (customerEmailInput) customerEmailInput.addEventListener('input', fxrUpdateCustomerInfo);
  
  const paymentRadios = document.querySelectorAll('input[name="payment"]');
  paymentRadios.forEach(radio => radio.addEventListener('change', fxrUpdatePaymentMethod));
  
  const agreeCheckbox = document.getElementById('agreeTerms');
  if (agreeCheckbox) agreeCheckbox.addEventListener('change', fxrToggleConfirmBtn);
}

// ========================================
// INITIALIZE
// ========================================
function fxrInit() {
  fxrInitProviderInfo();
  fxrGenerateDates();
  fxrSetupEventListeners();
  
  // Set initial urgency
  fxrBookingState.urgency = 'normal';
}
/**
 * FIXORA — provider.js
 * JavaScript الخاص بصفحة بروفايل الحرفي
 */

'use strict';

// ========================================
// DATA - معلومات الحرفي (Mock Data)
// ========================================
const fxrProviderData = {
  id: 1,
  name: 'محمد أحمد أبو خالد',
  specialty: 'تقني تكييف وأجهزة منزلية',
  rating: 4.9,
  reviewsCount: 112,
  governorate: 'عمّان',
  areas: ['الشميساني', 'عبدون', 'الجبيهة', 'الدوار السابع', 'مرج الحمام', 'خلدا', 'الرابية', 'تلاع العلي'],
  priceMin: 15,
  priceMax: 30,
  phone: '079 1234 567',
  email: 'mohammad.abukhaled@fixora.com',
  avatar: '👨‍🔧',
  services: [
    'تصليح تكييفات سبليت',
    'تصليح تكييفات مركزية',
    'تصليح تكييفات شباك',
    'تصليح غسالات',
    'تصليح ثلاجات',
    'تصليح سخانات مياه',
    'شحن فريون',
    'صيانة دورية'
  ],
  schedule: {
    'الأحد': { hours: '8:00 ص – 8:00 م', available: true },
    'الإثنين': { hours: '8:00 ص – 8:00 م', available: true },
    'الثلاثاء': { hours: '8:00 ص – 8:00 م', available: true },
    'الأربعاء': { hours: '8:00 ص – 8:00 م', available: true },
    'الخميس': { hours: '8:00 ص – 8:00 م', available: true },
    'الجمعة': { hours: '——', available: false },
    'السبت': { hours: '9:00 ص – 4:00 م', available: true }
  },
  // بيانات التقييمات
  reviews: [
    { id: 1, name: 'أحمد الكيلاني', rating: 5, date: '15 مارس 2025', text: 'خدمة ممتازة وسريعة، أسعاره معقولة جداً. جاء في الوقت المحدد وأصلح المشكلة بكفاءة عالية. أنصح به بشدة.' },
    { id: 2, name: 'رنا الشرايري', rating: 4, date: '10 مارس 2025', text: 'جاء في الوقت المحدد وأصلح المشكلة. التعامل محترم والخدمة جيدة. السعر مناسب مقارنة بغيره.' },
    { id: 3, name: 'سامر البطاينة', rating: 5, date: '5 مارس 2025', text: 'ممتاز محترم وفاهم بشغله. شكراً لكم على هذا الحرفي المتميز. سأتعامل معه مرة أخرى بالتأكيد.' },
    { id: 4, name: 'ليلى عبابنة', rating: 5, date: '28 فبراير 2025', text: 'الله يبارك فيه، أصلح التكييف بسرعة وخبرة. أنصح الجميع بالتعامل معه. أسعاره مناسبة جداً.' },
    { id: 5, name: 'محمود السعدي', rating: 4, date: '20 فبراير 2025', text: 'جيد جداً، أنجز العمل في الوقت المتفق عليه. السعر مناسب.' },
    { id: 6, name: 'ناديا الخالدي', rating: 5, date: '15 فبراير 2025', text: 'أفضل حرفي تعاملت معه. محترم ومتقن لعمله.' }
  ],
  // إحصائيات التقييمات
  ratingStats: {
    5: 78,
    4: 15,
    3: 5,
    2: 1,
    1: 1
  },
  // معرض الأعمال
  gallery: [
    { id: 1, icon: '❄️', caption: 'تصليح تكييف سبليت', color: 'rgba(145,189,209,.15)' },
    { id: 2, icon: '🔧', caption: 'صيانة مكيف مركزي', color: 'rgba(240,122,38,.1)' },
    { id: 3, icon: '⚙️', caption: 'تركيب وحدة خارجية', color: 'rgba(40,200,100,.08)' },
    { id: 4, icon: '🧊', caption: 'شحن فريون', color: 'rgba(145,189,209,.12)' },
    { id: 5, icon: '🌀', caption: 'تنظيف مكيفات', color: 'rgba(240,122,38,.08)' },
    { id: 6, icon: '📺', caption: 'تصليح شاشات', color: 'rgba(40,200,100,.1)' },
    { id: 7, icon: '🔌', caption: 'تصليح أجهزة كهربائية', color: 'rgba(145,189,209,.15)' },
    { id: 8, icon: '💧', caption: 'تصليح سخانات مياه', color: 'rgba(240,122,38,.1)' },
    { id: 9, icon: '🧹', caption: 'تنظيف فلتر المكيف', color: 'rgba(40,200,100,.08)' }
  ]
};

// ========================================
// STATE
// ========================================
let fxrIsFavorite = false;
let fxrCurrentProviderId = 1;

// ========================================
// UTILITY FUNCTIONS
// ========================================
function fxrBuildStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  
  let stars = '★'.repeat(full);
  if (half) stars += '½';
  stars += '☆'.repeat(empty);
  
  return stars;
}

function fxrShowToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// ========================================
// UPDATE BOOKING BUTTON LINK
// ========================================
function fxrUpdateBookingLink() {
  const bookBtn = document.getElementById('bookBtn');
  if (bookBtn) {
    bookBtn.href = `booking.html?id=${fxrCurrentProviderId}`;
  }
}

// ========================================
// RENDER FUNCTIONS
// ========================================
function fxrRenderProviderInfo() {
  const nameEl = document.getElementById('providerName');
  if (nameEl) nameEl.textContent = fxrProviderData.name;
  
  const specialtyEl = document.getElementById('providerSpecialty');
  if (specialtyEl) specialtyEl.textContent = `🔧 ${fxrProviderData.specialty}`;
  
  const starsEl = document.getElementById('starsRating');
  if (starsEl) starsEl.textContent = fxrBuildStars(fxrProviderData.rating);
  
  const ratingValueEl = document.getElementById('ratingValue');
  if (ratingValueEl) ratingValueEl.textContent = fxrProviderData.rating;
  
  const reviewsCountEl = document.getElementById('reviewsCount');
  if (reviewsCountEl) reviewsCountEl.textContent = `(${fxrProviderData.reviewsCount} تقييم)`;
  
  const avatarEl = document.getElementById('avatarCircle');
  if (avatarEl) avatarEl.textContent = fxrProviderData.avatar;
  
  const locationTagsEl = document.getElementById('locationTags');
  if (locationTagsEl) {
    locationTagsEl.innerHTML = `
      <span class="fxr-location-tag">📍 ${fxrProviderData.governorate}</span>
      ${fxrProviderData.areas.slice(0, 6).map(area => `<span class="fxr-location-tag">🏘️ ${area}</span>`).join('')}
    `;
  }
}

function fxrRenderServices() {
  const servicesList = document.getElementById('servicesList');
  if (servicesList) {
    servicesList.innerHTML = fxrProviderData.services.map(service => 
      `<span class="fxr-service-tag">${service}</span>`
    ).join('');
  }
  
  const priceRangeEl = document.getElementById('priceRange');
  if (priceRangeEl) {
    priceRangeEl.innerHTML = `
      <span class="fxr-price-value">${fxrProviderData.priceMin} - ${fxrProviderData.priceMax} دينار أردني</span>
      <span class="fxr-price-note">(حسب نوع العطل وقطع الغيار)</span>
    `;
  }
  
  const areasListEl = document.getElementById('areasList');
  if (areasListEl) {
    areasListEl.innerHTML = fxrProviderData.areas.map(area => 
      `<span class="fxr-area-tag">${area}</span>`
    ).join('');
  }
  
  const phoneEl = document.getElementById('phoneNumber');
  if (phoneEl) phoneEl.textContent = fxrProviderData.phone;
  
  const emailEl = document.getElementById('email');
  if (emailEl) emailEl.textContent = fxrProviderData.email;
}

// ========================================
// RENDER SCHEDULE (ساعات العمل)
// ========================================
function fxrRenderSchedule() {
  const scheduleTable = document.getElementById('scheduleTable');
  if (scheduleTable) {
    scheduleTable.innerHTML = Object.entries(fxrProviderData.schedule).map(([day, data]) => `
      <div class="fxr-schedule-row">
        <div class="fxr-schedule-day">${day}</div>
        <div class="fxr-schedule-hours">${data.hours}</div>
        <div class="fxr-schedule-status ${data.available ? 'available' : 'closed'}">
          ${data.available ? 'متاح' : 'إجازة'}
        </div>
      </div>
    `).join('');
  }
  
  // التقويم الأسبوعي (حالة الحجوزات)
  const calendarEl = document.getElementById('calendar');
  if (calendarEl) {
    const days = [
      { name: 'سبت', status: 'available', label: 'متاح' },
      { name: 'أحد', status: 'available', label: 'متاح' },
      { name: 'اثن', status: 'busy', label: 'محجوز' },
      { name: 'ثلا', status: 'available', label: 'متاح' },
      { name: 'أرب', status: 'available', label: 'متاح' },
      { name: 'خمي', status: 'available', label: 'متاح' },
      { name: 'جمعة', status: 'closed', label: 'إجازة' }
    ];
    
    calendarEl.innerHTML = days.map(day => `
      <div class="fxr-calendar-day">
        <div class="fxr-calendar-name">${day.name}</div>
        <div class="fxr-calendar-status ${day.status}">${day.label}</div>
      </div>
    `).join('');
  }
}

// ========================================
// RENDER REVIEWS (التقييمات)
// ========================================
function fxrRenderReviews() {
  // ملخص التقييمات
  const summaryScore = document.getElementById('summaryScore');
  if (summaryScore) summaryScore.textContent = fxrProviderData.rating;
  
  const summaryStars = document.getElementById('summaryStars');
  if (summaryStars) summaryStars.textContent = fxrBuildStars(fxrProviderData.rating);
  
  const summaryCount = document.getElementById('summaryCount');
  if (summaryCount) summaryCount.textContent = `بناءً على ${fxrProviderData.reviewsCount} تقييم`;
  
  // أشرطة النسبة المئوية
  const ratingBars = document.getElementById('ratingBars');
  if (ratingBars) {
    const stars = [5, 4, 3, 2, 1];
    ratingBars.innerHTML = stars.map(star => `
      <div class="fxr-rating-bar-item">
        <span class="fxr-bar-label">${star} ★</span>
        <div class="fxr-bar-bg">
          <div class="fxr-bar-fill" style="width: ${fxrProviderData.ratingStats[star]}%"></div>
        </div>
        <span class="fxr-bar-percent">${fxrProviderData.ratingStats[star]}%</span>
      </div>
    `).join('');
  }
  
  // قائمة التقييمات
  const reviewsList = document.getElementById('reviewsList');
  if (reviewsList) {
    reviewsList.innerHTML = fxrProviderData.reviews.map(review => `
      <div class="fxr-review-card">
        <div class="fxr-review-header">
          <div class="fxr-reviewer-avatar">${review.name.charAt(0)}</div>
          <div class="fxr-reviewer-info">
            <div class="fxr-reviewer-name">${review.name}</div>
            <div class="fxr-review-stars">${fxrBuildStars(review.rating)}</div>
          </div>
          <div class="fxr-review-date">${review.date}</div>
        </div>
        <p class="fxr-review-text">${review.text}</p>
      </div>
    `).join('');
  }
}

// ========================================
// RENDER GALLERY (معرض الأعمال)
// ========================================
function fxrRenderGallery() {
  const galleryGrid = document.getElementById('galleryGrid');
  if (galleryGrid) {
    galleryGrid.innerHTML = fxrProviderData.gallery.map(item => `
      <div class="fxr-gallery-item" style="background: ${item.color}" onclick="fxrShowGalleryItem('${item.caption}')">
        <div class="fxr-gallery-icon">${item.icon}</div>
        <div class="fxr-gallery-caption">${item.caption}</div>
      </div>
    `).join('');
  }
}

// ========================================
// TAB SWITCHING
// ========================================
function fxrSwitchTab(tabId) {
  // تحديث أزرار التبويب
  document.querySelectorAll('.fxr-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  const activeTab = document.querySelector(`.fxr-tab[data-tab="${tabId}"]`);
  if (activeTab) activeTab.classList.add('active');
  
  // تحديث محتوى التبويب
  document.querySelectorAll('.fxr-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  const activeContent = document.getElementById(`${tabId}Tab`);
  if (activeContent) activeContent.classList.add('active');
}

// ========================================
// ACTION FUNCTIONS
// ========================================
function fxrMessageProvider() {
  fxrShowToast('💬 سيتم فتح نافذة المراسلة مع الحرفي');
}

function fxrToggleFavorite() {
  fxrIsFavorite = !fxrIsFavorite;
  const favBtn = document.getElementById('favBtn');
  const favIcon = document.getElementById('favIcon');
  const favText = document.getElementById('favText');
  
  if (fxrIsFavorite) {
    favBtn.classList.add('active');
    favIcon.textContent = '❤️';
    favText.textContent = 'تمت الإضافة للمفضلة';
    fxrShowToast('❤️ تم إضافة الحرفي إلى المفضلة');
    
    // حفظ في localStorage
    const favorites = JSON.parse(localStorage.getItem('fxrFavorites') || '[]');
    if (!favorites.includes(fxrCurrentProviderId)) {
      favorites.push(fxrCurrentProviderId);
      localStorage.setItem('fxrFavorites', JSON.stringify(favorites));
    }
  } else {
    favBtn.classList.remove('active');
    favIcon.textContent = '🤍';
    favText.textContent = 'أضف للمفضلة';
    fxrShowToast('🗑️ تم إزالة الحرفي من المفضلة');
    
    // إزالة من localStorage
    const favorites = JSON.parse(localStorage.getItem('fxrFavorites') || '[]');
    const index = favorites.indexOf(fxrCurrentProviderId);
    if (index > -1) {
      favorites.splice(index, 1);
      localStorage.setItem('fxrFavorites', JSON.stringify(favorites));
    }
  }
}

function fxrCopyPhone() {
  navigator.clipboard.writeText(fxrProviderData.phone);
  fxrShowToast('📱 تم نسخ رقم الجوال');
}

function fxrCopyEmail() {
  navigator.clipboard.writeText(fxrProviderData.email);
  fxrShowToast('✉️ تم نسخ البريد الإلكتروني');
}

function fxrShowMoreReviews() {
  fxrShowToast('📋 يتم تحميل المزيد من التقييمات...');
}

function fxrShowGalleryItem(caption) {
  fxrShowToast(`🖼️ عرض: ${caption}`);
}

// ========================================
// LOAD PROVIDER BY ID
// ========================================
function fxrLoadProviderById(providerId) {
  fxrCurrentProviderId = parseInt(providerId) || 1;
  
  // تحديث رابط زر الحجز
  fxrUpdateBookingLink();
  
  // إعادة عرض جميع البيانات
  fxrRenderProviderInfo();
  fxrRenderServices();
  fxrRenderSchedule();
  fxrRenderReviews();
  fxrRenderGallery();
}

// ========================================
// CHECK FAVORITE STATUS
// ========================================
function fxrCheckFavoriteStatus() {
  const favorites = JSON.parse(localStorage.getItem('fxrFavorites') || '[]');
  if (favorites.includes(fxrCurrentProviderId)) {
    fxrIsFavorite = true;
    const favBtn = document.getElementById('favBtn');
    const favIcon = document.getElementById('favIcon');
    const favText = document.getElementById('favText');
    if (favBtn) favBtn.classList.add('active');
    if (favIcon) favIcon.textContent = '❤️';
    if (favText) favText.textContent = 'تمت الإضافة للمفضلة';
  }
}

// ========================================
// INITIALIZE
// ========================================
function fxrInit() {
  // Get provider ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const providerId = urlParams.get('id');
  
  if (providerId) {
    fxrLoadProviderById(providerId);
  } else {
    fxrCurrentProviderId = 1;
    fxrUpdateBookingLink();
    fxrRenderProviderInfo();
    fxrRenderServices();
    fxrRenderSchedule();
    fxrRenderReviews();
    fxrRenderGallery();
  }
  
  // التحقق من حالة المفضلة
  fxrCheckFavoriteStatus();
}


// Start when DOM is ready
document.addEventListener('DOMContentLoaded', fxrInit);
