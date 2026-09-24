// ============ STATE ============
var state = {
  tabs: [
    {name:'سند جدید', content:''}
  ],
  active: 0,
  format: 'txt'
};

try {
  var savedTabs = localStorage.getItem('txtmaker_tabs');
  if(savedTabs) state.tabs = JSON.parse(savedTabs);
  var savedActive = localStorage.getItem('txtmaker_active');
  if(savedActive !== null) state.active = parseInt(savedActive);
  if(state.active >= state.tabs.length) state.active = 0;
} catch(e) { console.log('load error', e); }

// ============ THEME ============
function toggleTheme(){
  var h = document.documentElement;
  var b = document.getElementById('themeBtn');
  if(h.getAttribute('data-theme') === 'dark'){
    h.removeAttribute('data-theme');
    b.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  } else {
    h.setAttribute('data-theme', 'dark');
    b.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  }
}

if(localStorage.getItem('theme') === 'dark'){
  document.documentElement.setAttribute('data-theme', 'dark');
  document.getElementById('themeBtn').textContent = '☀️';
}

// ============ TABS ============
function renderTabs(){
  var el = document.getElementById('tabs');
  var html = '';
  for(var i = 0; i < state.tabs.length; i++){
    var t = state.tabs[i];
    var cls = i === state.active ? 'tab active' : 'tab';
    html += '<button class="' + cls + '" onclick="switchTab(' + i + ')">';
    html += '<span>📄 ' + escapeHtml(t.name) + '</span>';
    if(state.tabs.length > 1){
      html += '<span class="close-tab" onclick="event.stopPropagation();closeTab(' + i + ')">✕</span>';
    }
    html += '</button>';
  }
  html += '<button class="tab add-tab" onclick="addTab()">＋ سند جدید</button>';
  el.innerHTML = html;
}

function switchTab(i){
  saveCurrentTab();
  state.active = i;
  loadTab(i);
  renderTabs();
  localStorage.setItem('txtmaker_active', i);
}

function addTab(){
  saveCurrentTab();
  state.tabs.push({name:'سند ' + (state.tabs.length + 1), content:''});
  state.active = state.tabs.length - 1;
  loadTab(state.active);
  renderTabs();
  saveAll();
  toast('✅ سند جدید ساخته شد', 'success');
}

function closeTab(i){
  if(state.tabs.length <= 1){
    toast('حداقل یک سند باید باشه', 'warning');
    return;
  }
  if(!confirm('این سند حذف بشه؟')) return;
  state.tabs.splice(i, 1);
  if(i < state.active){
    state.active -= 1;
  } else if(i === state.active && state.active >= state.tabs.length){
    state.active = state.tabs.length - 1;
  }
  loadTab(state.active);
  renderTabs();
  saveAll();
  toast('🗑️ سند حذف شد', 'info');
}

function loadTab(i){
  if(!state.tabs[i]) return;
  document.getElementById('fileName').value = state.tabs[i].name;
  document.getElementById('textInput').value = state.tabs[i].content;
  updateStats();
}

function saveCurrentTab(){
  if(!state.tabs[state.active]) return;
  var name = document.getElementById('fileName').value.trim() || 'بدون عنوان';
  state.tabs[state.active].name = name;
  state.tabs[state.active].content = document.getElementById('textInput').value;
  saveAll();
}

function renameTab(){
  saveCurrentTab();
  renderTabs();
}

var autoSaveFailed = false;
function saveAll(){
  try {
    localStorage.setItem('txtmaker_tabs', JSON.stringify(state.tabs));
    autoSaveFailed = false;
  } catch(e) {
    console.log('save error', e);
    if(!autoSaveFailed){
      autoSaveFailed = true;
      toast('⚠️ ذخیره خودکار انجام نشد (حافظه مرورگر پر یا غیرفعاله)', 'warning');
    }
  }
}

function escapeHtml(s){
  s = String(s || '');
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============ TEXT CHANGE ============
var saveTimer;
function onTextChange(){
  updateStats();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function(){
    saveCurrentTab();
    var tabs = document.querySelectorAll('.tab');
    if(tabs[state.active]){
      var span = tabs[state.active].querySelector('span');
      if(span) span.textContent = '📄 ' + state.tabs[state.active].name;
    }
  }, 800);
}

document.getElementById('textInput').addEventListener('input', onTextChange);

// ============ STATS ============
function updateStats(){
  var text = document.getElementById('textInput').value;
  var chars = text.length;
  var charsNS = text.replace(/\s/g, '').length;
  var words = text.trim() ? text.trim().split(/\s+/).length : 0;
  var sentences = text.trim() ? text.split(/[.!?؟।]+/).filter(function(s){ return s.trim().length > 0; }).length : 0;
  var lines = text ? text.split('\n').length : 0;
  var paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(function(p){ return p.trim(); }).length : 0;
  var readMin = words ? Math.max(1, Math.ceil(words / 200)) : 0;
  var bytes = new Blob([text]).size;
  var size = bytes < 1024 ? bytes + ' B' : (bytes / 1024).toFixed(1) + ' KB';

  document.getElementById('statChars').textContent = toFaNum(chars);
  document.getElementById('statCharsNS').textContent = toFaNum(charsNS);
  document.getElementById('statWords').textContent = toFaNum(words);
  document.getElementById('statSentences').textContent = toFaNum(sentences);
  document.getElementById('statLines').textContent = toFaNum(lines);
  document.getElementById('statParagraphs').textContent = toFaNum(paragraphs);
  document.getElementById('statRead').textContent = toFaNum(readMin);
  document.getElementById('statSize').textContent = size;
}

function toFaNum(n){
  return String(n).replace(/\d/g, function(d){ return '۰۱۲۳۴۵۶۷۸۹'[d]; });
}

// ============ FORMAT ============
function selectFormat(f, el){
  state.format = f;
  var all = document.querySelectorAll('.format-btn');
  for(var i = 0; i < all.length; i++) all[i].classList.remove('active');
  el.classList.add('active');
}

// ============ DOWNLOAD ============
function download(){
  var text = document.getElementById('textInput').value;
  var name = (document.getElementById('fileName').value.trim() || 'متن-من').replace(/[\\/:*?"<>|]/g, '-');

  if(!text.trim()){
    toast('❌ اول متن رو بنویس!', 'error');
    return;
  }

  // اگه خودت توی اسم فایل پسوند نوشتی (مثل afg app.py)، همون اسم دقیق رو نگه می‌داریم
  // و متن رو خام (بدون قالب‌بندی HTML/Word اضافه) توی همون فایل ذخیره می‌کنیم.
  var customExt = name.match(/\.([a-zA-Z0-9]{1,10})$/);
  if(customExt){
    try {
      var blob = new Blob(['\ufeff' + text], {type: 'text/plain;charset=utf-8'});
      triggerDownload(blob, name);
    } catch(e){
      toast('❌ خطا: ' + e.message, 'error');
    }
    return;
  }

  try {
    if(state.format === 'txt') exportTxt(text, name);
    else if(state.format === 'html') exportHtml(text, name);
    else if(state.format === 'doc') exportDoc(text, name);
    else if(state.format === 'md') exportMd(text, name);
    else if(state.format === 'csv') exportCsv(text, name);
    else if(state.format === 'pdf') exportPdf(text, name);
  } catch(e) {
    toast('❌ خطا: ' + e.message, 'error');
    console.log(e);
  }
}

async function triggerDownload(blob, fileName){
  // روی خیلی از مرورگرهای موبایل (به‌خصوص Safari و بعضی Chrome اندروید)، دانلود مستقیم فایل‌های
  // html/text گاهی به‌جای ذخیره، فقط محتوا رو باز/نمایش می‌ده. اول شیت اشتراک‌گذاری امتحان می‌شه
  // (گزینه «ذخیره در فایل‌ها» داره)، اگه پشتیبانی نشد می‌ره سراغ روش معمول دانلود.
  try {
    if(navigator.canShare && navigator.share){
      var file = new File([blob], fileName, {type: blob.type});
      if(navigator.canShare({files:[file]})){
        await navigator.share({files:[file], title: fileName});
        toast('✅ فایل ' + fileName + ' ذخیره شد', 'success');
        return;
      }
    }
  } catch(shareErr){
    // کاربر شیت رو بست یا مرورگر پشتیبانی نکرد؛ می‌ریم سراغ روش معمول (بدون نمایش خطا، چون انصراف کاربر طبیعیه)
  }

  try {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    toast('✅ فایل ' + fileName + ' دانلود شد', 'success');
  } catch(dlErr){
    toast('❌ دانلود انجام نشد: ' + dlErr.message, 'error');
  }
}

function exportTxt(text, name){
  var blob = new Blob(['\ufeff' + text], {type: 'text/plain;charset=utf-8'});
  triggerDownload(blob, name + '.txt');
}

function exportHtml(text, name){
  var bodyText = escapeHtml(text).replace(/\n/g, '<br>');
  var html = '<!DOCTYPE html>\n<html lang="fa" dir="rtl">\n<head>\n<meta charset="UTF-8">\n<title>' + escapeHtml(name) + '</title>\n<style>body{font-family:Vazirmatn,Tahoma,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:2;color:#1e293b}h1{color:#6366f1;border-bottom:2px solid #6366f1;padding-bottom:10px}.meta{color:#94a3b8;font-size:.85rem;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0}</style>\n</head>\n<body>\n<h1>' + escapeHtml(name) + '</h1>\n<p>' + bodyText + '</p>\n<div class="meta">تاریخ: ' + new Date().toLocaleDateString('fa-IR') + ' — ساخته شده با همیار</div>\n</body>\n</html>';
  var blob = new Blob([html], {type: 'text/html;charset=utf-8'});
  triggerDownload(blob, name + '.html');
}

function exportDoc(text, name){
  var bodyText = escapeHtml(text).replace(/\n/g, '<br>');
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">\n<head>\n<meta charset="UTF-8">\n<title>' + escapeHtml(name) + '</title>\n</head>\n<body style="font-family:Tahoma;line-height:2;direction:rtl">\n<h1 style="color:#6366f1">' + escapeHtml(name) + '</h1>\n<p>' + bodyText + '</p>\n</body>\n</html>';
  var blob = new Blob(['\ufeff' + html], {type: 'application/msword;charset=utf-8'});
  triggerDownload(blob, name + '.doc');
}

function exportMd(text, name){
  var md = '# ' + name + '\n\n' + text + '\n\n---\n\n_ساخته شده با همیار — ' + new Date().toLocaleDateString('fa-IR') + '_';
  var blob = new Blob(['\ufeff' + md], {type: 'text/markdown;charset=utf-8'});
  triggerDownload(blob, name + '.md');
}

function exportCsv(text, name){
  var lines = text.split('\n').filter(function(l){ return l.trim(); });
  var csv;
  if(lines.length > 0 && lines[0].indexOf(',') !== -1){
    csv = lines.map(function(line){
      return line.split(',').map(function(cell){
        return '"' + cell.replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\n');
  } else {
    csv = 'ردیف,محتوا\n';
    for(var i = 0; i < lines.length; i++){
      csv += (i + 1) + ',"' + lines[i].replace(/"/g, '""') + '"\n';
    }
  }
  var blob = new Blob(['\ufeff' + csv], {type: 'text/csv;charset=utf-8'});
  triggerDownload(blob, name + '.csv');
}

function exportPdf(text, name){
  var w = window.open('', '_blank', 'width=900,height=700');
  if(!w){ toast('❌ مرورگر پنجره رو بلاک کرد', 'error'); return; }
  var bodyText = escapeHtml(text).replace(/\n/g, '<br>');
  var html = '<!DOCTYPE html>\n<html lang="fa" dir="rtl">\n<head>\n<meta charset="UTF-8">\n<title>' + escapeHtml(name) + '</title>\n<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap" rel="stylesheet">\n<style>@page{size:A4;margin:2cm}body{font-family:Vazirmatn,Tahoma,sans-serif;line-height:2;color:#1e293b;padding:20px}h1{color:#6366f1;border-bottom:3px solid #6366f1;padding-bottom:10px;margin-bottom:20px}p{line-height:2}.meta{margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:.85rem}button.noprint{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#6366f1;color:#fff;padding:14px 28px;border-radius:12px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.2);cursor:pointer;border:none;font-family:inherit;font-size:1rem}@media print{button.noprint{display:none}}</style>\n</head>\n<body>\n<h1>' + escapeHtml(name) + '</h1>\n<p>' + bodyText + '</p>\n<div class="meta">تاریخ: ' + new Date().toLocaleDateString('fa-IR') + ' — ساخته شده با همیار</div>\n<button class="noprint" onclick="window.print()">🖨️ چاپ / ذخیره PDF</button>\n</body>\n</html>';
  w.document.open();
  w.document.write(html);
  w.document.close();
  toast('📕 پنجره چاپ باز شد. Save as PDF کن.', 'info');
}

// ============ PREVIEW ============
function previewFile(){
  var text = document.getElementById('textInput').value;
  var name = document.getElementById('fileName').value;
  if(!text.trim()){ toast('❌ اول متن رو بنویس!', 'error'); return; }

  var formatNames = {txt: 'متن ساده', pdf: 'PDF (چاپ)', doc: 'Word', html: 'صفحه وب', md: 'Markdown', csv: 'جدول CSV'};
  var preview = escapeHtml(text).replace(/\n/g, '<br>');
  var html = '<h2>👁️ پیش‌نمایش — ' + formatNames[state.format] + '</h2>';
  html += '<div style="color:var(--text-light);font-size:.85rem;margin-bottom:10px">';
  var customExt = name.match(/\.([a-zA-Z0-9]{1,10})$/);
  var displayName = customExt ? name : (name + '.' + state.format);
  html += '<strong>نام:</strong> ' + escapeHtml(displayName) + '<br>';
  html += '<strong>حجم:</strong> ' + (new Blob([text]).size / 1024).toFixed(2) + ' KB';
  html += '</div>';
  html += '<div style="max-height:300px;overflow-y:auto;padding:15px;background:var(--bg);border-radius:12px;line-height:2;font-size:.9rem;border:1px solid var(--border)">' + preview + '</div>';
  html += '<button class="btn success" style="margin-top:15px" onclick="closeModal();download()">💾 دانلود کن</button>';

  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').classList.add('active');
}

// ============ TEXT TOOLS ============
function copyText(){
  var text = document.getElementById('textInput').value;
  if(!text.trim()){ toast('❌ متنی نیست!', 'error'); return; }
  if(navigator.clipboard){
    navigator.clipboard.writeText(text).then(function(){
      toast('📋 متن کپی شد!', 'success');
    }).catch(function(){
      toast('❌ کپی نشد', 'error');
    });
  } else {
    var ta = document.getElementById('textInput');
    ta.select();
    document.execCommand('copy');
    toast('📋 متن کپی شد!', 'success');
  }
}

var ttsVoices = [];
function loadTtsVoices(){
  if('speechSynthesis' in window) ttsVoices = window.speechSynthesis.getVoices();
}
if('speechSynthesis' in window){
  loadTtsVoices();
  window.speechSynthesis.onvoiceschanged = loadTtsVoices;
}

function speakText(){
  var text = document.getElementById('textInput').value;
  if(!text.trim()){ toast('❌ متنی نیست!', 'error'); return; }
  if(!('speechSynthesis' in window)){ toast('❌ مرورگر از پخش صدا پشتیبانی نمی‌کنه', 'error'); return; }
  window.speechSynthesis.cancel();
  var faVoice = ttsVoices.filter(function(v){ return v.lang && v.lang.toLowerCase().indexOf('fa') === 0; })[0];
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'fa-IR';
  if(faVoice) u.voice = faVoice;
  u.rate = 1;
  u.onerror = function(e){ toast('❌ پخش صدا انجام نشد: ' + (e && e.error ? e.error : 'خطای نامشخص'), 'error'); };
  window.speechSynthesis.speak(u);
  if(faVoice){
    toast('🔊 در حال پخش...', 'info');
  } else {
    toast('⚠️ صدای فارسی روی این دستگاه نصب نیست؛ با صدای پیش‌فرض پخش می‌شه', 'warning');
  }
}

function clearText(){
  var ta = document.getElementById('textInput');
  if(!ta.value.trim()) return;
  if(!confirm('کل متن پاک بشه؟')) return;
  ta.value = '';
  onTextChange();
  toast('🗑️ متن پاک شد', 'info');
}

function cleanText(){
  var ta = document.getElementById('textInput');
  var t = ta.value
    .split('\n')
    .map(function(line){
      return line.replace(/[ \t]+/g, ' ').replace(/^[ \t]+|[ \t]+$/g, '');
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ي/g, 'ی').replace(/ك/g, 'ک')
    .replace(/\u200c{2,}/g, '\u200c')
    .trim();
  ta.value = t;
  onTextChange();
  toast('✨ متن پاک‌سازی شد (خط‌ها حفظ شدن)', 'success');
}

function reverseText(){
  var ta = document.getElementById('textInput');
  ta.value = ta.value.split('\n').map(function(l){
    return l.split(/(\s+)/).reverse().join('');
  }).join('\n');
  onTextChange();
  toast('🔄 ترتیب کلمات معکوس شد', 'info');
}

var editorFontSize = 16;
function biggerText(){
  var ta = document.getElementById('textInput');
  editorFontSize = Math.min(editorFontSize + 2, 40);
  ta.style.fontSize = editorFontSize + 'px';
  toast('🔠 اندازه نوشته بزرگ‌تر شد', 'info');
}
function smallerText(){
  var ta = document.getElementById('textInput');
  editorFontSize = Math.max(editorFontSize - 2, 10);
  ta.style.fontSize = editorFontSize + 'px';
  toast('🔡 اندازه نوشته کوچک‌تر شد', 'info');
}

// ============ UPLOAD ============
function openUpload(){
  var html = '<h2>📁 آپلود فایل</h2>';
  html += '<p style="color:var(--text-light);font-size:.85rem;margin-bottom:15px">فایل متنی خود را بکش و اینجا رها کن یا کلیک کن</p>';
  html += '<div class="upload-area" id="uploadArea" onclick="document.getElementById(\'fileInput\').click()">';
  html += '<span class="icon">📄</span>';
  html += '<p><strong>کلیک کن</strong> یا فایل رو بکش اینجا<br>پشتیبانی: TXT, MD, HTML, CSV, JSON</p>';
  html += '</div>';
  html += '<input type="file" id="fileInput" style="display:none" accept=".txt,.md,.html,.htm,.csv,.json,text/*" onchange="handleFile(this.files[0])">';

  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').classList.add('active');

  var area = document.getElementById('uploadArea');
  area.addEventListener('dragover', function(e){ e.preventDefault(); area.classList.add('dragover'); });
  area.addEventListener('dragleave', function(){ area.classList.remove('dragover'); });
  area.addEventListener('drop', function(e){
    e.preventDefault();
    area.classList.remove('dragover');
    if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
}

function handleFile(file){
  if(!file) return;
  if(file.size > 5 * 1024 * 1024){ toast('❌ فایل بزرگ‌تر از ۵ مگابایت', 'error'); return; }
  var reader = new FileReader();
  reader.onload = function(e){
    var ta = document.getElementById('textInput');
    ta.value = e.target.result;
    var nameNoExt = file.name.replace(/\.[^.]+$/, '');
    document.getElementById('fileName').value = nameNoExt;
    onTextChange();
    closeModal();
    toast('✅ فایل بارگذاری شد', 'success');
  };
  reader.onerror = function(){ toast('❌ خطا در خواندن فایل', 'error'); };
  reader.readAsText(file, 'UTF-8');
}

// ============ ENCRYPT (AES-256-GCM via Web Crypto — رمزنگاری واقعی) ============
function openEncrypt(){
  var html = '<h2>🔐 رمزگذاری متن</h2>';
  html += '<p style="color:var(--text-light);font-size:.85rem;margin-bottom:15px;line-height:1.8">متن با <strong>AES-256-GCM</strong> (استاندارد رمزنگاری مرورگر، نه یک الگوریتم دست‌ساز) رمزگذاری می‌شه. رمز رو گم نکن — بدون اون امکان بازیابی متن نیست.</p>';
  html += '<div class="input-group"><label>رمز عبور</label><input type="password" id="encPass" placeholder="رمز..."></div>';
  html += '<div class="btn-row"><button class="btn" onclick="doEncrypt()">🔒 رمزگذاری</button><button class="btn warning" onclick="doDecrypt()">🔓 رمزگشایی</button></div>';
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').classList.add('active');
}

function bufToBase64(buf){
  var bytes = new Uint8Array(buf), bin = '';
  for(var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function base64ToBuf(b64){
  var bin = atob(b64), bytes = new Uint8Array(bin.length);
  for(var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function cryptoAvailable(){
  return !!(window.crypto && window.crypto.subtle);
}

async function deriveKey(pass, salt){
  var enc = new TextEncoder();
  var keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pass), {name:'PBKDF2'}, false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {name:'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256'},
    keyMaterial,
    {name:'AES-GCM', length: 256},
    false,
    ['encrypt','decrypt']
  );
}

async function doEncrypt(){
  var pass = document.getElementById('encPass').value;
  if(!pass){ toast('❌ رمز رو وارد کن', 'error'); return; }
  var ta = document.getElementById('textInput');
  if(!ta.value.trim()){ toast('❌ متنی نیست', 'error'); return; }
  if(!cryptoAvailable()){ toast('❌ مرورگر از رمزنگاری امن (Web Crypto) پشتیبانی نمی‌کنه', 'error'); return; }
  try {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var key = await deriveKey(pass, salt);
    var cipherBuf = await crypto.subtle.encrypt({name:'AES-GCM', iv: iv}, key, new TextEncoder().encode(ta.value));
    var payload = { v:1, salt: bufToBase64(salt), iv: bufToBase64(iv), data: bufToBase64(cipherBuf) };
    ta.value = '🔐ENCRYPTED:' + btoa(JSON.stringify(payload));
    onTextChange();
    closeModal();
    toast('🔒 متن با AES-256 رمزگذاری شد', 'success');
  } catch(e){
    toast('❌ خطا در رمزگذاری', 'error');
  }
}

async function doDecrypt(){
  var pass = document.getElementById('encPass').value;
  if(!pass){ toast('❌ رمز رو وارد کن', 'error'); return; }
  var ta = document.getElementById('textInput');
  var text = ta.value.trim();
  if(text.indexOf('🔐ENCRYPTED:') !== 0){ toast('❌ این متن رمزگذاری نشده', 'error'); return; }
  if(!cryptoAvailable()){ toast('❌ مرورگر از رمزنگاری امن (Web Crypto) پشتیبانی نمی‌کنه', 'error'); return; }
  try {
    var payload = JSON.parse(atob(text.replace('🔐ENCRYPTED:', '')));
    var salt = new Uint8Array(base64ToBuf(payload.salt));
    var iv = new Uint8Array(base64ToBuf(payload.iv));
    var key = await deriveKey(pass, salt);
    var plainBuf = await crypto.subtle.decrypt({name:'AES-GCM', iv: iv}, key, base64ToBuf(payload.data));
    ta.value = new TextDecoder().decode(plainBuf);
    onTextChange();
    closeModal();
    toast('🔓 متن رمزگشایی شد', 'success');
  } catch(e){
    toast('❌ رمز اشتباهه یا داده خرابه', 'error');
  }
}

// ============ QR ============
function openQR(){
  var text = document.getElementById('textInput').value;
  if(!text.trim()){ toast('❌ اول متن رو بنویس', 'error'); return; }
  if(text.length > 800){ toast('⚠️ متن طولانیه، QR بخش اول رو نشون می‌ده', 'warning'); }
  var short = text.slice(0, 800);
  var url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(short);

  var html = '<h2>📱 اشتراک با QR</h2>';
  html += '<p style="color:var(--text-light);font-size:.85rem;margin-bottom:15px">با گوشی اسکن کن تا متن رو ببینی</p>';
  html += '<div style="text-align:center;padding:20px;background:var(--bg);border-radius:14px">';
  html += '<img src="' + url + '" style="width:280px;height:280px;border-radius:12px">';
  html += '</div>';
  html += '<p style="font-size:.75rem;color:var(--text-light);margin-top:12px;text-align:center">' + (text.length > 800 ? '⚠️ فقط ۸۰۰ کاراکتر اول' : 'کل متن در QR ذخیره شده') + '</p>';

  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').classList.add('active');
}

// ============ MODAL ============
function closeModal(){
  document.getElementById('modal').classList.remove('active');
}

document.getElementById('modal').addEventListener('click', function(e){
  if(e.target === document.getElementById('modal')) closeModal();
});

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape') closeModal();
  if((e.ctrlKey || e.metaKey) && e.key === 's'){
    e.preventDefault();
    download();
  }
});

// ============ TOAST ============
var toastTimer;
function toast(msg, type){
  type = type || 'success';
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 3000);
}

// ============ AUTO-SAVE ============
setInterval(saveCurrentTab, 5000);
window.addEventListener('beforeunload', saveCurrentTab);

// ============ INIT ============
renderTabs();
loadTab(state.active);
updateStats();
