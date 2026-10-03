// إدارة الحالة والتخزين المحلي
let radios = JSON.parse(localStorage.getItem('saved_radios')) || [];
let activeRadioId = null;

// عناصر الواجهة
const homeView = document.getElementById('homeView');
const createView = document.getElementById('createView');
const detailView = document.getElementById('detailView');
const radiosList = document.getElementById('radiosList');
const segmentsContainer = document.getElementById('segmentsContainer');

// إدارة مفتاح API في المتصفح
function getApiKey() {
  let key = localStorage.getItem('gemini_api_key');
  if (!key) {
    key = prompt('يرجى لصق مفتاح Google AI Studio API الخاص بك:');
    if (key) localStorage.setItem('gemini_api_key', key.trim());
  }
  return key;
}

document.getElementById('openKeyModal').addEventListener('click', () => {
  const currentKey = localStorage.getItem('gemini_api_key') || '';
  const newKey = prompt('تحديث مفتاح Google AI Studio API:', currentKey);
  if (newKey !== null) {
    localStorage.setItem('gemini_api_key', newKey.trim());
    alert('تم حفظ المفتاح بنجاح.');
  }
});

// التنقل بين الشاشات
function showView(view) {
  [homeView, createView, detailView].forEach(v => v.classList.add('hidden'));
  view.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.btnBack').forEach(btn => {
  btn.addEventListener('click', () => {
    renderHome();
    showView(homeView);
  });
});

document.getElementById('btnNewRadio').addEventListener('click', () => {
  document.getElementById('topicInput').value = '';
  segmentsContainer.innerHTML = '';
  
  // وضع فقرات نموذجية مبدئية لتسهيل الإدخال بالجوال
  addSegmentRow('مقدمة', 'عريف الحفل');
  addSegmentRow('القرآن الكريم', 'طالب 1');
  addSegmentRow('الحديث الشريف', 'طالب 2');
  addSegmentRow('كلمة الصباح', 'طالب 3');
  addSegmentRow('خاتمة', 'عريف الحفل');
  
  showView(createView);
});

// توليد صفوف الفقرات بتصميم يدعم الهواتف (Stack على الشاشات الصغيرة جداً)
function addSegmentRow(segment = '', student = '') {
  const div = document.createElement('div');
  div.className = 'flex flex-row gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200';
  div.innerHTML = `
    <input type="text" placeholder="اسم الفقرة (مثال: حكمة اليوم)" value="${segment}" class="seg-name border border-slate-300 rounded-lg p-2 text-xs sm:text-sm flex-1 bg-white outline-none focus:border-indigo-500">
    <input type="text" placeholder="اسم الطالب" value="${student}" class="seg-student border border-slate-300 rounded-lg p-2 text-xs sm:text-sm flex-1 bg-white outline-none focus:border-indigo-500">
    <button type="button" class="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 text-sm" onclick="this.parentElement.remove()">✕</button>
  `;
  segmentsContainer.appendChild(div);
}
document.getElementById('addSegmentBtn').addEventListener('click', () => addSegmentRow());

// عرض كروت الإذاعات
function renderHome() {
  radiosList.innerHTML = '';
  if (radios.length === 0) {
    radiosList.innerHTML = `
      <div class="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
        <p class="text-slate-400 text-sm">لا توجد إذاعات مسجلة بعد.</p>
        <p class="text-xs text-slate-400 mt-1">اضغط على زر "+ إنشاء إذاعة جديدة" للبدء.</p>
      </div>`;
    return;
  }

  radios.forEach(radio => {
    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition flex flex-col justify-between';
    card.innerHTML = `
      <div>
        <div class="flex justify-between items-start">
          <h3 class="font-bold text-base text-slate-800 line-clamp-1">${radio.topic}</h3>
          <span class="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">${radio.date}</span>
        </div>
        <p class="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">${radio.content.replace(/[\#\*]/g, '')}</p>
      </div>
      <div class="mt-4 flex gap-2 justify-end border-t border-slate-100 pt-3">
        <button onclick="deleteRadio('${radio.id}')" class="text-xs text-rose-500 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition">حذف</button>
        <button onclick="openRadio('${radio.id}')" class="text-xs bg-indigo-50 text-indigo-700 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition">فتح وتعديل</button>
      </div>
    `;
    radiosList.appendChild(card);
  });
}

// فتح إذاعة للتعديل
window.openRadio = function(id) {
  const radio = radios.find(r => r.id === id);
  if (!radio) return;
  activeRadioId = id;
  document.getElementById('radioTitleView').value = radio.topic;
  document.getElementById('radioContentView').value = radio.content;
  showView(detailView);
};

// حذف إذاعة
window.deleteRadio = function(id) {
  if (confirm('هل أنت متأكد من حذف هذه الإذاعة؟')) {
    radios = radios.filter(r => r.id !== id);
    localStorage.setItem('saved_radios', JSON.stringify(radios));
    renderHome();
  }
};

// حفظ التعديلات اليدوية
document.getElementById('saveEditBtn').addEventListener('click', () => {
  const radio = radios.find(r => r.id === activeRadioId);
  if (radio) {
    radio.topic = document.getElementById('radioTitleView').value.trim();
    radio.content = document.getElementById('radioContentView').value;
    localStorage.setItem('saved_radios', JSON.stringify(radios));
    alert('تم حفظ التعديلات.');
  }
});

// تنزيل كملف PDF
document.getElementById('exportPdfBtn').addEventListener('click', () => {
  const title = document.getElementById('radioTitleView').value.trim() || 'إذاعة مدرسية';
  const content = document.getElementById('radioContentView').value;

  const exportElement = document.createElement('div');
  exportElement.dir = 'rtl';
  exportElement.style.padding = '25px';
  exportElement.style.fontFamily = 'Tajawal, sans-serif';
  exportElement.innerHTML = `
    <h2 style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #4f46e5; padding-bottom: 8px;">
      إذاعة مدرسية بعنوان: ${title}
    </h2>
    <div style="font-size: 13px; line-height: 2; white-space: pre-wrap; color: #1e293b;">
      ${content}
    </div>
  `;

  const opt = {
    margin: 10,
    filename: `${title}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(exportElement).save();
});

// الاتصال بنموذج gemini-3.5-flash-lite
document.getElementById('generateBtn').addEventListener('click', async () => {
  const apiKey = getApiKey();
  if (!apiKey) return alert('يجب توفير مفتاح API للمتابعة.');

  const topic = document.getElementById('topicInput').value.trim();
  if (!topic) return alert('الرجاء كتابة موضوع الإذاعة.');

  const segmentRows = document.querySelectorAll('#segmentsContainer > div');
  const plan = [];
  segmentRows.forEach(row => {
    const name = row.querySelector('.seg-name').value.trim();
    const student = row.querySelector('.seg-student').value.trim();
    if (name) plan.push(`- فقرة "${name}" ويقدمها الطالب: "${student || 'زميلكم'}"`);
  });

  if (plan.length === 0) return alert('الرجاء كتابة فقرة واحدة على الأقل.');

  const loader = document.getElementById('loader');
  const generateBtn = document.getElementById('generateBtn');
  loader.classList.remove('hidden');
  generateBtn.disabled = true;

  const promptText = `
أنت معد برامج إذاعية مدرسية ومسؤول ثقافي مدرسي.
اكتب نصاً كاملاً متكاملاً لإذاعة مدرسية صباحية متناسقة حول موضوع: "${topic}".
الفقرات المحددة والمشاركون فيها:
${plan.join('\n')}

المعايير المطلوبة:
1. صياغة النص لكل فقرة بصورة كاملة وواضحة، مع تقديم عريف الحفل لكل طالب وفقرته بسلاسة.
2. النص مكتوب بلغة عربية فصحى مشوقة ومناسبة للإلقاء الصباحي.
3. ابدأ مباشرة بمحتوى الإذاعة دون مقدمات موجهة للمبرمج أو شروحات جانبية.
`;

  try {
    // استدعاء gemini-3.5-flash-lite مباشرة
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const generatedText = data.candidates[0].content.parts[0].text;
    const newRadio = {
      id: Date.now().toString(),
      topic: topic,
      content: generatedText,
      date: new Date().toLocaleDateString('ar-SA')
    };

    radios.unshift(newRadio);
    localStorage.setItem('saved_radios', JSON.stringify(radios));

    openRadio(newRadio.id);
  } catch (err) {
    alert('خطأ أثناء التوليد: ' + err.message);
  } finally {
    loader.classList.add('hidden');
    generateBtn.disabled = false;
  }
});

// بدء التشغيل عند تحميل الصفحة
renderHome();
