/**
 * FIXORA — دردشة مرتبطة بحجز أو استفسار (API + Socket)
 */
'use strict';

const api = window.FixoraAPI;
let messages = [];
let bookingId = null;
let inquiryId = null;
let socket = null;
let userRole = null;

const messagesContainer = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const backBtn = document.getElementById('backBtn');

function renderMessages() {
  if (!messagesContainer) return;
  messagesContainer.innerHTML = '';
  const myId = localStorage.getItem('userId');
  messages.forEach((msg) => {
    const isSent = String(msg.sender_id) === String(myId);
    const div = document.createElement('div');
    div.className = `message ${isSent ? 'sent' : 'received'}`;
    div.innerHTML = `
      <div class="message-bubble">${msg.content || msg.message_text || ''}</div>
      <div class="message-time">${new Date(msg.created_at || Date.now()).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}</div>`;
    messagesContainer.appendChild(div);
  });
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function loadHistory() {
  try {
    let res;
    if (inquiryId) {
      res = await api.getInquiryChat(inquiryId);
    } else if (bookingId) {
      res = await api.getChat(bookingId);
    } else {
      return;
    }
    messages = res.messages || [];
    renderMessages();
  } catch (e) {
    console.warn(e);
  }
}

async function sendMessage() {
  const text = messageInput?.value.trim();
  if (!text) return;

  try {
    if (inquiryId) {
      await api.sendInquiryChat(inquiryId, text);
    } else if (bookingId) {
      await api.sendChat(bookingId, text);
    } else {
      return;
    }
    messageInput.value = '';
    await loadHistory();
  } catch (e) {
    alert(e.message);
  }
}

function handleKeyPress(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
}

function goBack() {
  if (userRole === 'provider') {
    window.location.href = 'provider-dashboard.html#messages';
    return;
  }
  if (history.length > 1) {
    history.back();
    return;
  }
  window.location.href = 'user-dashboard.html?tab=tab-messages';
}

function initSocket() {
  if (typeof io === 'undefined') return;
  const origin = window.FIXORA_API || location.origin;
  socket = io(origin);
  const roomId = inquiryId || bookingId;
  if (!roomId) return;
  if (inquiryId) {
    socket.emit('join_inquiry_chat', inquiryId);
  } else {
    socket.emit('join_booking_chat', bookingId);
  }
  socket.on('receive_message', () => loadHistory());
}

async function loadChatHeader() {
  const statusEl = document.getElementById('chatProviderStatus');
  const statusWrap = document.querySelector('.provider-status');
  if (statusWrap) statusWrap.style.display = 'none';

  try {
    const nameEl = document.getElementById('chatProviderName');
    if (inquiryId) {
      const threads = await api.getInquiryThreads();
      const list = threads.data || [];
      const t = list.find((x) => String(x.id) === String(inquiryId));
      if (t && nameEl) {
        nameEl.textContent = (t.other_name || 'محادثة').trim();
      }
      return;
    }

    if (!bookingId) return;
    const bookings = await api.getMyBookings();
    const list = bookings.data || [];
    const b = list.find((x) => String(x.id) === String(bookingId));
    if (!b) return;
    const other = userRole === 'provider'
      ? (b.client_name || 'عميل')
      : (b.provider_name || 'حرفي');
    if (nameEl) nameEl.textContent = other.trim();

    const avatarEl = document.getElementById('chatProviderAvatar');
    if (avatarEl) avatarEl.textContent = '💬';
  } catch (_) { /* optional */ }
}

async function resolveInquiryFromProvider(providerId) {
  const res = await api.startInquiryChat(providerId);
  return res.inquiryId || res.bookingId;
}

async function init() {
  const access = window.FixoraAccess;
  userRole = access?.getRole?.() || null;

  if (!localStorage.getItem('token')) {
    localStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    window.location.href = 'login.html';
    return;
  }

  if (userRole !== 'client' && userRole !== 'provider') {
    window.location.href = 'unauthorized.html';
    return;
  }

  const params = new URLSearchParams(location.search);
  bookingId = params.get('bookingId');
  inquiryId = params.get('inquiryId');
  const providerId = params.get('providerId');

  if (!bookingId && !inquiryId && providerId) {
    if (userRole !== 'client') {
      alert('المراسلة المباشرة متاحة للعملاء فقط');
      window.location.href = 'provider-dashboard.html#messages';
      return;
    }
    try {
      const id = await resolveInquiryFromProvider(providerId);
      if (id && !params.get('bookingId')) {
        inquiryId = id;
        history.replaceState(null, '', `chat.html?inquiryId=${encodeURIComponent(inquiryId)}`);
      } else {
        bookingId = id;
      }
    } catch (e) {
      alert(e.message || 'تعذر بدء المحادثة');
      window.location.href = `privider.html?id=${encodeURIComponent(providerId)}`;
      return;
    }
  }

  if (!bookingId && !inquiryId) {
    alert('افتح المحادثة من بروفايل الحرفي أو من طلب حجز نشط');
    if (userRole === 'provider') {
      window.location.href = 'provider-dashboard.html#messages';
    } else {
      window.location.href = 'user-dashboard.html?tab=tab-messages';
    }
    return;
  }

  await loadChatHeader();
  await loadHistory();
  initSocket();
  messageInput?.focus();
  sendBtn?.addEventListener('click', sendMessage);
  messageInput?.addEventListener('keypress', handleKeyPress);
  backBtn?.addEventListener('click', goBack);
}

document.addEventListener('DOMContentLoaded', init);
