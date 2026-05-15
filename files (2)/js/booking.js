/**
 * FIXORA — booking.js
 * JavaScript الخاص بصفحة حجز الخدمة
 */

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
// كود جمالات ليكون ديناميك
// استبدلي دالة fxrConfirmBooking القديمة بهذا الكود بالكامل

// async function fxrConfirmBooking() {
//     // 1. التأكد من وجود البيانات في الذاكرة
//     const token = localStorage.getItem('token');
//     const userId = localStorage.getItem('userId');

//     if (!token || !userId) {
//         alert("يرجى تسجيل الدخول أولاً لتتمكن من الحجز");
//         window.location.href = 'login.html';
//         return;
//     }

//     // 2. المترجم الديناميكي (عشان الداتابيز تقبل الأيام)
//     const dayMapping = {
//         'السبت': 'sat', 'الأحد': 'sun', 'الإثنين': 'mon',
//         'الثلاثاء': 'tue', 'الأربعاء': 'wed', 'الخميس': 'thu', 'الجمعة': 'fri'
//     };

//     // 3. تجهيز الـ Payload المطابق لجدول bookings في DBeaver
//     const payload = {
//         client_id: userId, // UUID
//         provider_id: "c82c9688-296d-415a-8d30-0fd6dc74f6b4", // تأكدي من الـ ID في DBeaver
//         category_id: 1, // رقم صحيح (Integer) كما يظهر في صورتك
//         scheduled_at: new Date().toISOString(), // تاريخ كامل متوافق مع timestamptz
//         day_of_week: dayMapping[fxrBookingState.selectedDay] || 'mon', // Enum
//         notes: document.getElementById('problemDescription')?.value || "لا يوجد ملاحظات"
//     };

//     try {
//         const res = await fetch('http://localhost:3000/api/users/bookings', {
//             method: 'POST',
//             headers: { 
//                 'Content-Type': 'application/json', 
//                 'Authorization': `Bearer ${token}` 
//             },
//             body: JSON.stringify(payload)
//         });

//         const result = await res.json();

//         if (res.ok && result.success) {
//             alert("✅ تم الحجز بنجاح! السطر الآن في DBeaver.");
//             window.location.href = 'user-dashboard.html'; // الانتقال
//         } else {
//             alert("❌ خطأ من الداتابيز: " + result.message);
//         }
//     } catch (err) {
//         alert("❌ تأكدي من تشغيل السيرفر (node app.js)");
//     }
// }
// 4. إرسال البيانات (Confirm) - نسخة جمالات المطورة
async function fxrConfirmBooking() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        alert("يرجى تسجيل الدخول.");
        window.location.href = 'login.html';
        return;
    }

    const payload = {
        client_id: userId,
        provider_id: "c0a8011c-992a-4f5b-802c-56905589985c", // مثال UUID
        service_id: "772f884a-9351-4f1b-802c-56905589985c",  // مثال UUID
        booking_date: fxrBookingState.selectedDate,
        start_time: fxrBookingState.selectedTime, // الوقت المختار ديناميكياً
        end_time: "12:00:00", // يمكنكِ تعديلها لتكون +ساعة من البداية
        notes: fxrBookingState.problemDescription
    };

    try {
        const res = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (result.success) {
            alert(result.message);
            window.location.href = 'user-dashboard.html';
        } else {
            alert("فشل الحجز: " + result.message);
        }
    } catch (error) {
        alert("خطأ في الاتصال بالسيرفر.");
    }
}
// function fxrConfirmBooking() {
//   fxrUpdateCustomerInfo();
//   fxrUpdatePaymentMethod();
  
//   // Validate customer info
//   if (!fxrBookingState.customerName) {
//     fxrShowToast('❌ الرجاء إدخال الاسم الكامل');
//     return;
//   }
//   if (!fxrBookingState.customerPhone) {
//     fxrShowToast('❌ الرجاء إدخال رقم الجوال');
//     return;
//   }
//   if (!fxrBookingState.customerPhone.match(/07[0-9]{8}/)) {
//     fxrShowToast('❌ الرجاء إدخال رقم جوال أردني صحيح (07xxxxxxxx)');
//     return;
//   }
  
//   // Save booking to localStorage (simulate)
//   const booking = {
//     id: Date.now(),
//     provider: fxrProvider,
//     ...fxrBookingState,
//     bookingDate: new Date().toISOString(),
//     status: 'pending'
//   };
  
//   const bookings = JSON.parse(localStorage.getItem('fxrBookings') || '[]');
//   bookings.push(booking);
//   localStorage.setItem('fxrBookings', JSON.stringify(bookings));
  
//   fxrShowToast('✅ تم تأكيد حجزك بنجاح! سيتم إشعارك قريباً');
  
//   // Redirect to user dashboard after 2 seconds
//   setTimeout(() => {
//     window.location.href = 'user-dashboard.html';
//   }, 2000);
// }

// ========================================
// INITIALIZE PROVIDER INFO
// ========================================



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
  fxrInitProviderInfo();
  fxrGenerateDates();
  fxrSetupEventListeners();
  
  // Set initial urgency
  fxrBookingState.urgency = 'normal';
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', fxrInit);