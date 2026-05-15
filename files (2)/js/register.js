/* ═══════════════════════════════════════════════════════
   FIXORA — script.js
   Namespace: window.FXR
   يتوافق مع هيكل 3 صفحات:
     1. fxr-page-select  — اختيار الدور
     2. fxr-page-user    — تسجيل مستخدم
     3. fxr-page-provider — تسجيل حرفي (3 خطوات)
═══════════════════════════════════════════════════════ */

const FXR = (() => {

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
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
     أيام العمل
  ══════════════════════════════════════ */
  function toggleDay(btn) {
    if (btn.classList.contains('fxr-day-on')) {
      btn.classList.replace('fxr-day-on', 'fxr-day-off');
    } else {
      btn.classList.replace('fxr-day-off', 'fxr-day-on');
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
  function submitUser() {
    const fname = document.getElementById('u-fname').value.trim();
    const lname = document.getElementById('u-lname').value.trim();
    const phone = document.getElementById('u-phone').value.trim();
    const gov   = document.getElementById('u-gov').value;
    const email = document.getElementById('u-email').value.trim();
    const pass  = document.getElementById('u-pass').value;
    const pass2 = document.getElementById('u-pass2').value;
    const terms = document.getElementById('u-terms').checked;

    let valid = true;

    const fErr = !fname;
    _markInput('u-fname', fErr); _showErr('err-fname', fErr);
    if (fErr) valid = false;

    const lErr = !lname;
    _markInput('u-lname', lErr); _showErr('err-lname', lErr);
    if (lErr) valid = false;

    const phoneOk = /^07\d{8}$/.test(phone);
    _markInput('u-phone', !phoneOk); _showErr('err-phone', !phoneOk);
    if (!phoneOk) valid = false;

    const govErr = !gov;
    _markInput('u-gov', govErr); _showErr('err-gov', govErr);
    if (govErr) valid = false;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    _markInput('u-email', !emailOk); _showErr('err-email', !emailOk);
    if (!emailOk) valid = false;

    const passErr = pass.length < 8;
    _markInput('u-pass', passErr); _showErr('err-pass', passErr);
    if (passErr) valid = false;

    const p2Err = pass !== pass2 || pass2 === '';
    _markInput('u-pass2', p2Err); _showErr('err-pass2', p2Err);
    if (p2Err) valid = false;

    if (!terms) {
      alert('يجب الموافقة على شروط الاستخدام للمتابعة');
      valid = false;
    }

    if (!valid) return;

    /* ← fetch('/api/register/user', { method:'POST', ... }) */

    const formBody = document.getElementById('user-form-body');
    const success  = document.getElementById('user-success');
    if (formBody) formBody.style.display = 'none';
    if (success) {
      success.classList.add('fxr-visible');
      success.style.display = 'block';
    }
  }

 
  /* ══════════════════════════════════════
     إرسال — حرفي
  ══════════════════════════════════════ */
  function submitProvider() {
    /* ← fetch('/api/register/provider', { method:'POST', body: FormData }) */

    const card = document.getElementById('fxr-page-provider');
    if (!card) return;
    Array.from(card.children).forEach(child => {
      if (child.id !== 'prov-success') child.style.display = 'none';
    });
    const success = document.getElementById('prov-success');
    if (success) {
      success.classList.add('fxr-visible');
      success.style.display = 'block';
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
    toggleDay,
    togglePass,
    checkStrength,
    submitUser,
    submitProvider,
  };

})();
