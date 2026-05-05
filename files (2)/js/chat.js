/**
 * FIXORA Chat - راسل الحرفي
 * ملف JavaScript منفصل
 */

// بيانات الحرفي
const PROVIDER = {
  id: 1,
  name: "محمد أبو خالد",
  avatar: "👨‍🔧",
  status: "online"
};

// المستخدم الحالي (تم تسجيل دخوله كـ أحمد)
const CURRENT_USER = {
  id: 100,
  name: "أحمد الكيلاني",
  role: "customer"
};

// تخزين الرسائل في مصفوفة
let messages = [];

let messageIdCounter = messages.length + 1;
let typingTimeout = null;
const typingIndicatorId = "typingIndicator";

// الحصول على العناصر
const messagesContainer = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const backBtn = document.getElementById("backBtn");

/**
 * عرض جميع الرسائل في الواجهة
 */
function renderMessages() {
  messagesContainer.innerHTML = "";
  messages.forEach(msg => {
    const isSent = msg.senderId === CURRENT_USER.id;
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "message-bubble";
    bubbleDiv.innerText = msg.text;
    
    const timeSpan = document.createElement("div");
    timeSpan.className = "message-time";
    timeSpan.innerText = msg.time;
    
    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(timeSpan);
    messagesContainer.appendChild(messageDiv);
  });
  // تمرير إلى أسفل المحادثة
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * إضافة رسالة جديدة إلى المحادثة
 */
function addMessage(senderId, senderName, text) {
  const now = new Date();
  const timeString = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const newMsg = {
    id: messageIdCounter++,
    senderId: senderId,
    senderName: senderName,
    text: text.trim(),
    time: timeString,
    timestamp: Date.now()
  };
  messages.push(newMsg);
  renderMessages();
}

/**
 * إظهار مؤشر الكتابة
 */
function showTypingIndicator() {
  if (document.getElementById(typingIndicatorId)) return;
  const typingDiv = document.createElement("div");
  typingDiv.id = typingIndicatorId;
  typingDiv.className = "typing-indicator";
  typingDiv.innerHTML = `<span>●</span><span>●</span><span>●</span> يكتب ...`;
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * إخفاء مؤشر الكتابة
 */
function removeTypingIndicator() {
  const indicator = document.getElementById(typingIndicatorId);
  if (indicator) indicator.remove();
}

/**
 * محاكاة الرد التلقائي من الحرفي
 */
function simulateProviderReply(userMessage) {
  removeTypingIndicator();
  showTypingIndicator();
  
  setTimeout(() => {
    removeTypingIndicator();
    const replyText = "شكرا لتواصلك سيتم الرد عليك في اقرب وقت ممكن";
    
    addMessage(PROVIDER.id, PROVIDER.name, replyText);
  }, 1300);
}

/**
 * إرسال الرسالة
 */
function sendMessage() {
  const text = messageInput.value.trim();
  if (text === "") return;
  
  addMessage(CURRENT_USER.id, CURRENT_USER.name, text);
  messageInput.value = "";
  messageInput.focus();
  
  if (typingTimeout) clearTimeout(typingTimeout);
  
  typingTimeout = setTimeout(() => {
    simulateProviderReply(text);
  }, 700);
}

/**
 * معالجة الضغط على Enter
 */
function handleKeyPress(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
}

/**
 * العودة لصفحة البروفايل
 */
function goBackToProfile() {
  // العودة إلى صفحة الحرفي
  window.location.href = "privider.html";
}

/**
 * تهيئة الصفحة وربط الأحداث
 */
function init() {
  renderMessages();
  messageInput.focus();
  
  sendBtn.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", handleKeyPress);
  backBtn.addEventListener("click", goBackToProfile);
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", init);