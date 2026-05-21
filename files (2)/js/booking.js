/**
 * FIXORA — booking.js
 * JavaScript الخاص بصفحة حجز الخدمة
 */
// في بداية ملف booking.js توقيف موقت 
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    // إضافة سطر للتصحيح (Debugging)
    console.log("Token value found in storage:", token); 
    console.log("Storage location:", window.location.origin);

    if (!token) {
        alert("يرجى تسجيل الدخول أولاً");
        window.location.href = 'login.html';
    } else {
        console.log("تم التعرف على التوكن بنجاح!");
    }
});

'use strict';

// ========================================
// PROVIDER DATA (Mock Data - comes from URL)
// ========================================
const fxrProvider = {
  id: 1,
  name: 'محمد أبو خالد',
  specialty: 'تقني تكييف وأجهزة منزلية',
  rating: 4.9,
  avatar: '👨‍🔧',
  priceMin: 15,
  priceMax: 30
};

// ========================================
// STATE
// ========================================
let fxrBookingState = {
  step: 1,
  serviceType: '',
  problemDescription: '',
  urgency: 'normal',
  selectedDate: null,
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
  if (!fxrBookingState.serviceType) return '—';
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
}

// ========================================
// STEP 2 FUNCTIONS - DATE & TIME
// ========================================
function fxrGenerateDates() {
  const dateGrid = document.getElementById('dateGrid');
  if (!dateGrid) return;
  
  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  
  dateGrid.innerHTML = dayNames.map((dayName, index) => {
    const isSelected = fxrBookingState.selectedDay === dayName;
    
    return `
      <div class="fxr-date-card ${isSelected ? 'selected' : ''}" onclick="fxrSelectDate('${dayName}')">
        <div class="fxr-date-day">${dayName}</div>
      </div>
    `;
  }).join('');
}

function fxrSelectDate(dayName) {
  fxrBookingState.selectedDate = dayName;
  fxrBookingState.selectedDay = dayName;
  
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
  const isFriday = fxrBookingState.selectedDay === 'الجمعة';
  
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
// دالة جلب الخدمات (ديناميكية)
async function loadDynamicServices() {
    const icons = {
        'تصليح تكييف سبليت': '❄️', 'تصليح تكييف مركزي': '🌀',
        'شحن فريون': '🧊', 'صيانة دورية': '🔧',
        'تنظيف مكيفات': '🧹', 'تصليح غسالة': '👕',
        'تصليح ثلاجة': '🧊', 'تصليح سخان مياه': '💧'
    };

    try {
        // الرابط هنا يجب أن يكون '/api/categories' فقط ليطابق app.js
const response = await fetch('http://localhost:3000/api/categories');
        const data = await response.json();
        const serviceSelect = document.getElementById('serviceType');
        
        if (serviceSelect && data.success) {
            serviceSelect.innerHTML = '<option value="">اختر نوع الخدمة</option>';
            data.categories.forEach(cat => {
                const icon = icons[cat.name_ar] || '🛠️';
                const option = document.createElement('option');
                option.value = cat.id; 
                option.textContent = `${icon} ${cat.name_ar}`;
                serviceSelect.appendChild(option);
            });
        }
    } catch (err) { console.error("خطأ:", err); }
}
function fxrUpdateOrderSummary() {
  const summaryEl = document.getElementById('orderSummary');
  if (!summaryEl) return;
  
  const fullAddress = `${fxrBookingState.governorate}، ${fxrBookingState.area}، ${fxrBookingState.addressDetail}`;
  const urgencyText = {
    'normal': 'عادي',
    'urgent': 'مستعجل',
    'emergency': 'طوارئ'
  };
  
  summaryEl.innerHTML = `
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
      <span class="fxr-summary-label">يوم الخدمة والوقت</span>
      <span class="fxr-summary-value">${fxrBookingState.selectedDay} — ${fxrBookingState.selectedTime}</span>
    </div>
    <div class="fxr-summary-item">
      <span class="fxr-summary-label">موقع الخدمة</span>
      <span class="fxr-summary-value">${fullAddress}</span>
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
// 4. إرسال البيانات (Confirm) - نسخة جمالات المطورة
// =========================================================================
async function fxrConfirmBooking() {
    const token = localStorage.getItem('token');
    const selectedCategory = document.getElementById('serviceType').value;

    // 1. التحقق من التوكن والخدمة
    if (!token) { 
        alert("يرجى تسجيل الدخول أولاً."); 
        window.location.href = 'login.html';
        return; 
    }
    if (!selectedCategory) { 
        alert("❌ الرجاء اختيار نوع الخدمة من القائمة!"); 
        return; 
    }

    // 2. تجهيز البيانات
    const payload = {
        provider_id: "c0a8011c-992a-4f5b-802c-56905589985c", 
        category_id: selectedCategory, 
        scheduled_at: new Date().toISOString().split('T')[0], // التاريخ اليوم
        start_time: "09:00:00",
        end_time: "10:00:00",
        notes: fxrBookingState.problemDescription || "طلب صيانة"
    };

    // 3. إرسال الطلب للسيرفر
    try {
       const response = await fetch('http://localhost:3000/api/bookings/create-booking', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token.trim()}` 
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        // 4. التعامل مع النتيجة
        if (response.ok && result.success) {
            alert("تم إرسال طلب الحجز بنجاح! ✅");
            window.location.href = 'user-dashboard.html'; // الانتقال المطلوب
        } else {
            // عرض رسالة الخطأ القادمة من السيرفر
            alert("عذراً: " + (result.message || "فشل تأكيد الحجز."));
        }
    } catch (error) {
        console.error("خطأ في الاتصال:", error);
        alert("حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.");
    }
}
// async function fxrConfirmBooking() {
//     const token = localStorage.getItem('token');
//     const userId = localStorage.getItem('userId');

//     // 1. تنظيف التوكن (إزالة أي مسافات زائدة قد تسبب خطأ Bearer)
//     const cleanToken = token ? token.trim() : null;

//     if (!cleanToken || !userId) {
//         alert("يرجى تسجيل الدخول أولاً.");
//         // window.location.href = 'login.html';
//         return;
//     }

//     // 2. تحويل التاريخ (كما هو بدون تغيير)
//     const getFormattedDate = (dayName) => {
//         const today = new Date();
//         const dayMap = { 'الأحد': 0, 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6 };
//         const targetDay = dayMap[dayName];
//         if (targetDay === undefined) return today.toISOString().split('T')[0];
//         const currentDay = today.getDay();
//         const distance = (targetDay - currentDay + 7) % 7;
//         const targetDate = new Date(today);
//         targetDate.setDate(today.getDate() + distance);
//         return targetDate.toISOString().split('T')[0];
//     };

//     const dateToUse = fxrBookingState.selectedDate || 'الأحد'; 
//     const formattedDate = getFormattedDate(dateToUse);
// const payload = {
//     // احذفي client_id من هنا لأن السيرفر (الذي عدلناه قبل قليل) 
//     // سيستخرجه من التوكن (req.user.userId) تلقائياً، 
//     // وهذا يمنع حدوث تضارب.
//     provider_id: "c0a8011c-992a-4f5b-802c-56905589985c", 
//     category_id: 1, 
//     scheduled_at: formattedDate,
//     start_time: "09:00:00",
//     end_time: "10:00:00",
//     notes: fxrBookingState.problemDescription || "طلب صيانة"
// };

//     try {
//         // خطوة حاسمة: التأكد أن التوكن يرسل بصيغة صحيحة تماماً                    
//         const res = await fetch('http://localhost:3000/api/bookings/create-booking', {
//             method: 'POST',
//             headers: { 
//                 'Content-Type': 'application/json', 
//                 'Authorization': `Bearer ${cleanToken}` // استخدام التوكن المنظف
//             },
//             body: JSON.stringify(payload)
//         });

//         // إذا كان هناك خطأ في الاتصال (401 أو 403) سنعرفه هنا
//         if (res.status === 401) {
//             console.error("❌ السيرفر رفض التوكن (401 Unauthorized)");
//             alert("جلسة العمل انتهت، يرجى تسجيل الدخول مجدداً.");
//             window.location.href = 'login.html';
//             return;
//         }

//         const result = await res.json();

//         if (res.ok && result.success) {
//             alert("تم إرسال طلب الحجز بنجاح. ✅");
//             window.location.href = 'user-dashboard.html';
//         } else {
//             alert("عذراً: " + (result.message || "فشل تأكيد الحجز."));
//         }
//     } catch (error) {
//         console.error("🚨 خطأ اتصال:", error);
//         alert("حدث خطأ في الاتصال بالسيرفر.");
//     }
// }
// تعديل جمالات ليكون ديناميك
 


function fxrInitProviderInfo() {
  // Get provider ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const providerId = urlParams.get('id');
  
  if (providerId) {
    // In a real app, fetch provider data by ID
    console.log(`Loading provider with ID: ${providerId}`);
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
}

// ========================================
// INITIALIZE
// ========================================


function fxrInit() {
 loadDynamicServices(); // <-- إضافة هذا السطر
  fxrInitProviderInfo();
  fxrGenerateDates();
  fxrSetupEventListeners();
  
  // Set initial urgency
  fxrBookingState.urgency = 'normal';
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', fxrInit);