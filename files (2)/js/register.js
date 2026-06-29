/* ═══════════════════════════════════════════════════════
   FIXORA — script.js
   Namespace: window.FXR
   يتوافق مع هيكل 3 صفحات:
     1. fxr-page-select  — اختيار الدور
     2. fxr-page-user    — تسجيل مستخدم
     3. fxr-page-provider — تسجيل حرفي (3 خطوات)
═══════════════════════════════════════════════════════ */

const FXR = (() => {

  const api = window.FixoraAPI;

  /* ── الدور المختار حالياً ── */
  let _currentRole = 'user'; // 'user' | 'provider'

  /* ── نصوص خطوات الحرفي ── */
  const STEP_LABELS = {
    1: 'الخطوة <strong>1</strong> من 3 — المعلومات الشخصية',
    2: 'الخطوة <strong>2</strong> من 3 — المعلومات المهنية',
    3: 'الخطوة <strong>3</strong> من 3 — المستندات والتحقق',
  };

  /* ══════════════════════════════════════
     اختيار الدور (بطاقات الصفحة الأولى)
  ══════════════════════════════════════ */
  function selectRole(role) {
    _currentRole = role;

    const cardUser     = document.getElementById('card-user');
    const cardProvider = document.getElementById('card-provider');
    const checkUser    = document.getElementById('check-user');
    const checkProv    = document.getElementById('check-provider');

    if (role === 'user') {
      cardUser.classList.add('fxr-selected');
      cardProvider.classList.remove('fxr-selected');
      checkUser.classList.remove('fxr-check-hidden');
      checkProv.classList.add('fxr-check-hidden');
    } else {
      cardProvider.classList.add('fxr-selected');
      cardUser.classList.remove('fxr-selected');
      checkProv.classList.remove('fxr-check-hidden');
      checkUser.classList.add('fxr-check-hidden');
    }
  }

  /* ══════════════════════════════════════
     الانتقال من صفحة الاختيار للنموذج
  ══════════════════════════════════════ */
  function goToForm() {
    _hide('fxr-page-select');
    if (_currentRole === 'user') {
      _show('fxr-page-user');
    } else {
      _show('fxr-page-provider');
      loadProviderCategories();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function loadProviderCategories() {
    const specEl = document.getElementById('p-spec');
    if (!specEl || specEl.dataset.loaded === '1') return;
    try {
      const res = await api.getCategories();
      const cats = res.categories || res.data || [];
      specEl.innerHTML = '<option value="">— اختر تخصصك —</option>'
        + cats.filter((c) => c.is_active !== false)
          .map((c) => `<option value="${c.id}">${c.name_ar}</option>`)
          .join('');
      specEl.dataset.loaded = '1';
    } catch (_) {
      /* keep static fallback if API unavailable */
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadProviderRegistrationAssets() {
    const certInput = document.getElementById('input-cert');
    if (certInput?.files?.[0]) {
      const fd = new FormData();
      fd.append('file', certInput.files[0]);
      fd.append('doc_type', 'certificate');
      await api.uploadDocument(fd);
    }

    const portfolioInput = document.getElementById('input-portfolio');
    const files = portfolioInput?.files;
    if (files?.length) {
      const portfolio = [];
      for (let i = 0; i < files.length; i++) {
        const dataUrl = await fileToDataUrl(files[i]);
        portfolio.push({
          id: i + 1,
          description: files[i].name.replace(/\.[^.]+$/, ''),
          imageData: dataUrl,
          icon: '📷'
        });
      }
      if (portfolio.length) {
        await api.updateProviderPortfolio(portfolio);
      }
    }
  }

  /* ══════════════════════════════════════
     رجوع لصفحة الاختيار
  ══════════════════════════════════════ */
  function goBack() {
    _hide('fxr-page-user');
    _hide('fxr-page-provider');
    _show('fxr-page-select');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ══════════════════════════════════════
     التوجيه الخارجي
  ══════════════════════════════════════ */
  function switchPage(page) {
    if (page === 'login') {
      window.location.href = 'login.html';
    } else {
      window.location.href = 'index.html';
    }
  }

  function goHome() { switchPage('home'); }

  /* ══════════════════════════════════════
     خطوات الحرفي
  ══════════════════════════════════════ */
  function nextStep(step) {
    document.querySelectorAll('.fxr-step-panel').forEach(p => {
      p.classList.remove('fxr-step-active');
    });

    const target = document.getElementById('prov-step' + step);
    if (target) target.classList.add('fxr-step-active');

    for (let i = 1; i <= 3; i++) {
      const bar = document.getElementById('pbar' + i);
      if (!bar) continue;
      bar.className = 'fxr-step-bar ' + (
        i < step   ? 'fxr-done'   :
        i === step  ? 'fxr-active' : ''
      );
    }

    const labelEl = document.getElementById('fxr-step-label');
    if (labelEl) labelEl.innerHTML = STEP_LABELS[step] || '';

    const card = document.getElementById('fxr-page-provider');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ══════════════════════════════════════
     رفع الملفات
  ══════════════════════════════════════ */
  function showFileName(input, labelId) {
    const lbl = document.getElementById(labelId);
    if (!lbl) return;
    if (input.files && input.files.length > 0) {
      const names = Array.from(input.files).map(f => f.name).join(', ');
      lbl.textContent = '✅ ' + names;
      lbl.style.color = '#28c840';
    } else {
      lbl.textContent = 'لم يتم اختيار ملف';
      lbl.style.color = '';
    }
  }

  /* ══════════════════════════════════════
     إظهار / إخفاء كلمة المرور
  ══════════════════════════════════════ */
  function togglePass(inputId, eyeId) {
    const inp = document.getElementById(inputId);
    const eye = document.getElementById(eyeId);
    if (!inp) return;
    const isPass = inp.type === 'password';
    inp.type = isPass ? 'text' : 'password';
    if (eye) eye.textContent = isPass ? '🙈' : '👁️';
  }

  /* ══════════════════════════════════════
     قوة كلمة المرور
  ══════════════════════════════════════ */
  function checkStrength(val) {
    const bars  = [1,2,3,4].map(i => document.getElementById('sb' + i));
    const label = document.getElementById('fxr-strength-label');

    let score = 0;
    if (val.length >= 8)          score++;
    if (/[A-Za-z]/.test(val))     score++;
    if (/\d/.test(val))           score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    bars.forEach(b => { if (b) b.className = 'fxr-strength-bar'; });

    if (score === 0) {
      if (label) label.textContent = 'قوة كلمة المرور';
      return;
    }

    const cfg = [
      null,
      { fill: 1, cls: 'fxr-s-weak',   txt: 'ضعيفة 🔴' },
      { fill: 2, cls: 'fxr-s-weak',   txt: 'متوسطة 🟡' },
      { fill: 3, cls: 'fxr-s-medium', txt: 'جيدة 🟢' },
      { fill: 4, cls: 'fxr-s-strong', txt: 'قوية جداً ✅' },
    ];
    const c = cfg[score];
    for (let i = 0; i < c.fill; i++) {
      if (bars[i]) bars[i].classList.add(c.cls);
    }
    if (label) label.textContent = c.txt;
  }

  /* ══════════════════════════════════════
     Validation helpers
  ══════════════════════════════════════ */
  function _showErr(id, show) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('fxr-visible', show);
  }
  function _markInput(id, hasError) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('fxr-error', hasError);
  }

  /* ══════════════════════════════════════
     إرسال — مستخدم عادي
  ══════════════════════════════════════ */
  // function submitUser() {
  //   const fname = document.getElementById('u-fname').value.trim();
  //   const lname = document.getElementById('u-lname').value.trim();
  //   const phone = document.getElementById('u-phone').value.trim();
  //   const gov   = document.getElementById('u-gov').value;
  //   const email = document.getElementById('u-email').value.trim();
  //   const pass  = document.getElementById('u-pass').value;
  //   const pass2 = document.getElementById('u-pass2').value;
  //   const terms = document.getElementById('u-terms').checked;

  //   let valid = true;

  //   const fErr = !fname;
  //   _markInput('u-fname', fErr); _showErr('err-fname', fErr);
  //   if (fErr) valid = false;

  //   const lErr = !lname;
  //   _markInput('u-lname', lErr); _showErr('err-lname', lErr);
  //   if (lErr) valid = false;

  //   const phoneOk = /^07\d{8}$/.test(phone);
  //   _markInput('u-phone', !phoneOk); _showErr('err-phone', !phoneOk);
  //   if (!phoneOk) valid = false;

  //   const govErr = !gov;
  //   _markInput('u-gov', govErr); _showErr('err-gov', govErr);
  //   if (govErr) valid = false;

  //   const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  //   _markInput('u-email', !emailOk); _showErr('err-email', !emailOk);
  //   if (!emailOk) valid = false;

  //   const passErr = pass.length < 8;
  //   _markInput('u-pass', passErr); _showErr('err-pass', passErr);
  //   if (passErr) valid = false;

  //   const p2Err = pass !== pass2 || pass2 === '';
  //   _markInput('u-pass2', p2Err); _showErr('err-pass2', p2Err);
  //   if (p2Err) valid = false;

  //   if (!terms) {
  //     alert('يجب الموافقة على شروط الاستخدام للمتابعة');
  //     valid = false;
  //   }

  //   if (!valid) return;

  //   /* ← fetch('/api/register/user', { method:'POST', ... }) */

  //   const formBody = document.getElementById('user-form-body');
  //   const success  = document.getElementById('user-success');
  //   if (formBody) formBody.style.display = 'none';
  //   if (success) {
  //     success.classList.add('fxr-visible');
  //     success.style.display = 'block';
  //   }
  // }

async function submitUser() {
    // 1. جلب العناصر من الـ HTML
    const fnameEl = document.getElementById('u-fname');
    const lnameEl = document.getElementById('u-lname');
    const phoneEl = document.getElementById('u-phone');
    const govEl   = document.getElementById('u-gov');
    const emailEl = document.getElementById('u-email');
    const passEl  = document.getElementById('u-pass');
    const pass2El = document.getElementById('u-pass2');
    const termsEl = document.getElementById('u-terms');

    // تأكد من وجود العناصر (لمنع الـ TypeError)
    if (!fnameEl || !lnameEl || !phoneEl || !emailEl) {
        alert("خطأ: تأكدي أن جميع حقول التسجيل موجودة في الصفحة!");
        return;
    }

    const fname = fnameEl.value.trim();
    const lname = lnameEl.value.trim();
    const phone = phoneEl.value.trim();
    const gov   = govEl ? govEl.value : '';
    const email = emailEl.value.trim();
    const pass  = passEl.value;
    const pass2 = pass2El.value;
    const terms = termsEl ? termsEl.checked : false;

    let valid = true;

    // 2. التحقق من البيانات
    if (!fname) { _markInput('u-fname', true); valid = false; }
    if (!lname) { _markInput('u-lname', true); valid = false; }
    
    // التحقق من رقم الهاتف (يجب أن يكون 10 أرقام ويبدأ بـ 07)
    const phoneOk = /^07\d{8}$/.test(phone);
    _markInput('u-phone', !phoneOk);
    if (!phoneOk) { alert("رقم الهاتف غير صحيح"); valid = false; }

    if (!gov) { valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { valid = false; }
    if (pass.length < 8) { alert("كلمة السر قصيرة جداً"); valid = false; }
    if (pass !== pass2) { alert("كلمات السر غير متطابقة"); valid = false; }
    if (!terms) { alert('يجب الموافقة على الشروط'); valid = false; }

    if (!valid) return;

    // 3. الإرسال للسيرفر
    try {
        await api.register({
                first_name: fname,
                last_name: lname,
                phone: phone,
                governorate: gov,
                email: email,
                password: pass,
                role: 'client'
            });

        // 4. في حال النجاح
        const formBody = document.getElementById('user-form-body');
        const success  = document.getElementById('user-success');
        if (formBody) formBody.style.display = 'none';
        if (success) {
            success.classList.add('fxr-visible');
            success.style.display = 'block';
        }
    } catch (error) {
        alert(error.message === 'Failed to fetch' ? api.networkHint : ('خطأ: ' + error.message));
    }
}

  /* ══════════════════════════════════════
     إرسال — حرفي
  ══════════════════════════════════════ */
  async function submitProvider() {
    const fnameEl = document.getElementById('p-fname');
    const lnameEl = document.getElementById('p-lname');
    const phoneEl = document.getElementById('p-phone');
    const emailEl = document.getElementById('p-email');
    const passEl  = document.getElementById('p-pass');
    const pass2El = document.getElementById('p-pass2');
    const termsEl = document.getElementById('p-terms');
    const specEl  = document.getElementById('p-spec');
    const govEl   = document.getElementById('p-gov');
    const bioEl   = document.getElementById('p-bio');
    const areasEl = document.getElementById('p-areas');

    if (!fnameEl || !lnameEl || !phoneEl || !emailEl || !passEl) return;

    const fname = fnameEl.value.trim();
    const lname = lnameEl.value.trim();
    const phone = phoneEl.value.trim();
    const email = emailEl.value.trim();
    const pass  = passEl.value;
    const pass2 = pass2El ? pass2El.value : '';
    const terms = termsEl ? termsEl.checked : false;
    const specialtyOpt = specEl?.selectedOptions?.[0];
    const specialty = specialtyOpt?.textContent?.trim() || '';
    const category_id = specEl?.value || '';
    const governorate = govEl ? govEl.value : '';
    const bio = bioEl ? bioEl.value.trim() : '';
    const service_areas = areasEl ? areasEl.value.trim() : '';

    let valid = true;
    if (!fname) { _markInput('p-fname', true); valid = false; }
    if (!lname) { _markInput('p-lname', true); valid = false; }
    const phoneOk = /^07\d{8}$/.test(phone);
    _markInput('p-phone', !phoneOk);
    if (!phoneOk) { alert('رقم الهاتف غير صحيح'); valid = false; }
    if (!specialty || !category_id) { alert('اختر تخصصك'); valid = false; }
    if (!governorate) { alert('اختر المحافظة'); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { valid = false; }
    const passErr = pass.length < 8;
    _markInput('p-pass', passErr);
    _showErr('err-p-pass', passErr);
    if (passErr) { alert('كلمة السر قصيرة جداً'); valid = false; }

    const pass2Err = pass !== pass2 || !pass2;
    _markInput('p-pass2', pass2Err);
    _showErr('err-p-pass2', pass2Err);
    if (pass2Err) { alert('كلمتا المرور غير متطابقتين'); valid = false; }

    if (!terms) { alert('يجب الموافقة على الشروط'); valid = false; }
    if (!valid) return;

    try {
      const reg = await api.register({
          first_name: fname,
          last_name: lname,
          phone,
          governorate,
          email,
          password: pass,
          role: 'provider',
          specialty,
          category_id: parseInt(category_id, 10) || undefined,
          bio,
          service_areas: service_areas || undefined
        });

      const loginRes = await api.login({ email, password: pass });
      if (loginRes.token) {
        localStorage.setItem('token', loginRes.token);
        localStorage.setItem('userId', loginRes.user?.id || reg.userId || '');
        localStorage.setItem('userRole', loginRes.user?.role || 'provider');
        localStorage.setItem('userName', loginRes.user?.name || fname);
      }

      try {
        await uploadProviderRegistrationAssets();
      } catch (uploadErr) {
        console.warn('Portfolio/docs upload:', uploadErr.message);
      }

      window.location.href = 'provider-pending.html';
    } catch (error) {
      alert(error.message === 'Failed to fetch' ? api.networkHint : ('خطأ: ' + error.message));
    }
  }

  /* ══════════════════════════════════════
     Helpers داخلية
  ══════════════════════════════════════ */
  function _show(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
  }
  function _hide(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  /* ══════════════════════════════════════
     Public API
  ══════════════════════════════════════ */
  return {
    selectRole,
    goToForm,
    goBack,
    switchPage,
    goHome,
    nextStep,
    showFileName,
    togglePass,
    checkStrength,
    submitUser,
    submitProvider,
  };

})();

window.FXR = FXR;

// دوال مساعدة للتحقق من الحقول
function _markInput(id, isError) {
    const el = document.getElementById(id);
    if (el) {
        if (isError) el.style.borderColor = 'red';
        else el.style.borderColor = '';
    }
}

function _showErr(id, isShow) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = isShow ? 'block' : 'none';
    }
}