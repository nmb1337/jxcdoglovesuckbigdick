// ============================================
// ⚙️ 管理后台 JS - 题目增删改查
// ============================================

// ==================== 樱花粒子（复用） ====================
(function initSakuraParticles() {
  const canvas = document.getElementById('sakura-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let petals = [];
  const MAX_PETALS = 30;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawPetal(ctx, x, y, size, rotation, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    const w = size * 0.6;
    const h = size;
    ctx.moveTo(0, -h);
    ctx.bezierCurveTo(w, -h * 0.6, w, h * 0.3, 0, h * 0.8);
    ctx.bezierCurveTo(-w, h * 0.3, -w, -h * 0.6, 0, -h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function createPetal() {
    return {
      x: Math.random() * canvas.width,
      y: -30,
      size: 5 + Math.random() * 10,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      fallSpeed: 0.3 + Math.random() * 1.2,
      swaySpeed: 0.2 + Math.random() * 0.5,
      swayAmount: 15 + Math.random() * 30,
      swayOffset: Math.random() * Math.PI * 2,
      color: `rgba(255, ${160 + Math.random() * 70}, ${190 + Math.random() * 50}, ${0.3 + Math.random() * 0.3})`
    };
  }

  for (let i = 0; i < MAX_PETALS; i++) {
    const p = createPetal();
    p.y = Math.random() * canvas.height;
    petals.push(p);
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    petals.forEach((p, idx) => {
      p.y += p.fallSpeed;
      p.x += Math.sin(Date.now() * 0.001 * p.swaySpeed + p.swayOffset) * 0.4;
      p.rotation += p.rotationSpeed;
      drawPetal(ctx, p.x, p.y, p.size, p.rotation, p.color);
      if (p.y > canvas.height + 30) petals[idx] = createPetal();
    });
    requestAnimationFrame(animate);
  }
  animate();
})();

// ==================== API 地址 ====================
const API_BASE = 'http://localhost:14514';

// ==================== 全局状态 ====================
let questions = [];
let resultConfig = { image: '', text: '' };
const container = document.getElementById('admin-container');

// ==================== 加载题目 ====================
async function loadQuestions() {
  try {
    const resp = await fetch(API_BASE + '/api/questions/admin');
    questions = await resp.json();
    renderList();
  } catch (err) {
    container.innerHTML = `<div class="glass-card"><p>❌ 加载失败: ${err.message}</p></div>`;
  }
}

// ==================== 加载结果配置 ====================
async function loadResultConfig() {
  try {
    const resp = await fetch(API_BASE + '/api/result');
    resultConfig = await resp.json();
  } catch (err) {
    resultConfig = { image: '', text: '' };
  }
}

// ==================== 渲染题目列表 ====================
function renderList() {
  const optionLabels = ['A', 'B', 'C', 'D'];

  const cardsHTML = questions.map((q, idx) => {
    const correctLabel = optionLabels[q.answer] || '?';
    const hasImg = q.image && q.image.trim() !== '';
    return `
      <div class="question-card">
        <div class="question-card-header">
          <span class="question-card-num">#${idx + 1}</span>
          <span class="question-card-text">${q.question}</span>
        </div>
        <div class="question-card-meta">
          <span>✅ 正确答案: <strong>${correctLabel}</strong></span>
          <span class="${hasImg ? 'has-image' : 'no-image'}">
            ${hasImg ? '🖼️ 有图片' : '📷 无图片'}
          </span>
        </div>
        <div style="font-size:0.85em; color:var(--text-light); margin-top:4px;">
          ${q.options.map((o, i) => `${optionLabels[i]}. ${o}`).join(' &nbsp;|&nbsp; ')}
        </div>
        <div class="question-card-actions">
          <button class="btn-sm btn-edit" onclick="editQuestion(${q.id})">✏️ 编辑</button>
          <button class="btn-sm btn-img" onclick="uploadImage(${q.id})">🖼️ ${hasImg ? '更换图片' : '上传图片'}</button>
          ${hasImg ? `<button class="btn-sm btn-delete" onclick="removeImage(${q.id})">🗑️ 删除图片</button>` : ''}
          <button class="btn-sm btn-delete" onclick="deleteQuestion(${q.id})">🗑️ 删除题目</button>
        </div>
      </div>
    `;
  }).join('');

  const hasResultImg = resultConfig.image && resultConfig.image.trim() !== '';

  container.innerHTML = `
    <div class="glass-card" style="margin-bottom:20px;">
      <div class="admin-header">
        <span class="admin-title">⚙️ 题目管理后台</span>
        <div style="display:flex; gap:8px;">
          <button class="btn-sm btn-back" onclick="window.open('/admin.html','_self')">🔄 刷新</button>
          <a href="/" class="btn-sm btn-back" style="text-decoration:none;">🏠 返回首页</a>
        </div>
      </div>
      <p style="color:var(--text-light); margin-bottom:16px;">
        共 <strong>${questions.length}</strong> 道题目
        <button class="btn-sm btn-add" style="margin-left:12px;" onclick="showAddForm()">➕ 新增题目</button>
      </p>
      ${questions.length === 0 ? '<p style="text-align:center; color:var(--text-light); padding:40px;">还没有题目，点击"新增题目"添加吧~</p>' : cardsHTML}
    </div>

    <!-- 结果页配置 -->
    <div class="glass-card">
      <div class="admin-header">
        <span class="admin-title">🏁 答题结果页设置</span>
      </div>
      <p style="color:var(--text-light); margin-bottom:14px; font-size:0.9em;">
        无论答题结果如何，完成所有题目后都会跳转到此页面。可自定义显示图片和文字。
      </p>
      <div class="form-group">
        <label>🖼️ 结果页图片</label>
        <div style="display:flex; gap:8px; align-items:center;">
          <input type="text" id="result-image" value="${escapeHtml(resultConfig.image)}"
                 placeholder="图片路径（可点击右侧按钮上传）" style="flex:1;">
          <button class="btn-sm btn-img" onclick="uploadResultImage()">📤 上传</button>
          ${hasResultImg ? `<button class="btn-sm btn-delete" onclick="clearResultImage()">🗑️</button>` : ''}
        </div>
        ${hasResultImg ? `<img src="${API_BASE}${resultConfig.image}" class="current-image-preview" alt="preview" style="margin-top:8px;">` : ''}
      </div>
      <div class="form-group">
        <label>📝 结果页文字</label>
        <textarea id="result-text" placeholder="输入结果页文字（支持换行）...">${escapeHtml(resultConfig.text)}</textarea>
      </div>
      <button class="btn-sm btn-save" onclick="saveResultConfig()">💾 保存结果设置</button>
    </div>
  `;
}

// ==================== 新增 / 编辑表单 ====================
function showAddForm() {
  showFormModal('新增题目', {
    question: '',
    options: ['', '', '', ''],
    answer: 0,
    image: ''
  }, null);
}

function editQuestion(id) {
  const q = questions.find(q => q.id === id);
  if (!q) return;
  showFormModal('编辑题目', {
    question: q.question,
    options: [...q.options],
    answer: q.answer,
    image: q.image
  }, id);
}

function showFormModal(title, data, editId) {
  const optionLabels = ['A', 'B', 'C', 'D'];

  // 移除旧模态框
  const old = document.querySelector('.modal-mask');
  if (old) old.remove();

  const optionsInputs = data.options.map((opt, i) => `
    <div class="option-row">
      <span style="font-weight:700; width:24px;">${optionLabels[i]}</span>
      <input type="text" id="opt-${i}" value="${escapeHtml(opt)}" placeholder="选项 ${optionLabels[i]}">
      <label class="radio-label">
        <input type="radio" name="correct-answer" value="${i}" ${data.answer === i ? 'checked' : ''}>
        正确
      </label>
    </div>
  `).join('');

  const modalHTML = `
    <div class="modal-mask" onclick="if(event.target===this) closeModal()">
      <div class="modal-content">
        <h3>${title}</h3>
        <div class="form-group">
          <label>📝 题目内容</label>
          <textarea id="q-text" placeholder="输入题目...">${escapeHtml(data.question)}</textarea>
        </div>
        <div class="form-group">
          <label>📋 选项（单选正确答案）</label>
          ${optionsInputs}
        </div>
        <div class="form-group">
          <label>🖼️ 图片 (URL 或路径，可选)</label>
          <input type="text" id="q-image" value="${escapeHtml(data.image)}" placeholder="例如: /uploads/xxx.jpg（上传图片请点取消后在列表页操作）">
          ${data.image ? `<img src="${data.image}" class="current-image-preview" alt="preview">` : ''}
        </div>
        <button class="btn-sm btn-save" onclick="saveQuestion(${editId || 'null'})">💾 保存</button>
        <button class="btn-sm btn-cancel" onclick="closeModal()">取消</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeModal() {
  const modal = document.querySelector('.modal-mask');
  if (modal) modal.remove();
}

async function saveQuestion(editId) {
  const question = document.getElementById('q-text').value.trim();
  if (!question) { alert('请输入题目内容！'); return; }

  const options = [];
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById('opt-' + i);
    options.push(el ? el.value.trim() : '');
  }

  const answerRadio = document.querySelector('input[name="correct-answer"]:checked');
  const answer = answerRadio ? parseInt(answerRadio.value) : 0;

  const image = document.getElementById('q-image').value.trim();

  const body = { question, options, answer, image };

  try {
    let resp;
    if (editId) {
      resp = await fetch(API_BASE + `/api/questions/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } else {
      resp = await fetch(API_BASE + '/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }
    if (!resp.ok) throw new Error('保存失败');
    closeModal();
    await loadQuestions();
  } catch (err) {
    alert('❌ 保存失败: ' + err.message);
  }
}

// ==================== 删除题目 ====================
async function deleteQuestion(id) {
  if (!confirm('确定要删除这道题目吗？此操作不可撤销！')) return;
  try {
    const resp = await fetch(API_BASE + `/api/questions/${id}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error('删除失败');
    await loadQuestions();
  } catch (err) {
    alert('❌ 删除失败: ' + err.message);
  }
}

// ==================== 上传图片 ====================
function uploadImage(id) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('image', file);

    try {
      const resp = await fetch(API_BASE + `/api/upload/${id}`, {
        method: 'POST',
        body: formData
      });
      if (!resp.ok) throw new Error('上传失败');
      const result = await resp.json();
      alert('✅ 图片上传成功！\n路径: ' + result.image);
      await loadQuestions();
    } catch (err) {
      alert('❌ 上传失败: ' + err.message);
    }
  };
  input.click();
}

// ==================== 删除图片 ====================
async function removeImage(id) {
  if (!confirm('确定要删除该题目的图片吗？')) return;
  try {
    const resp = await fetch(API_BASE + `/api/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: '' })
    });
    if (!resp.ok) throw new Error('操作失败');
    await loadQuestions();
  } catch (err) {
    alert('❌ 失败: ' + err.message);
  }
}

// ==================== 结果页配置操作 ====================
async function saveResultConfig() {
  const image = document.getElementById('result-image').value.trim();
  const text = document.getElementById('result-text').value.trim();
  try {
    const resp = await fetch(API_BASE + '/api/result', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, text })
    });
    if (!resp.ok) throw new Error('保存失败');
    alert('✅ 结果页设置已保存！');
    await loadResultConfig();
    await loadQuestions();
  } catch (err) {
    alert('❌ 保存失败: ' + err.message);
  }
}

function uploadResultImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    if (!input.files || !input.files[0]) return;
    const formData = new FormData();
    formData.append('image', input.files[0]);
    try {
      const resp = await fetch(API_BASE + '/api/result/upload', {
        method: 'POST',
        body: formData
      });
      if (!resp.ok) throw new Error('上传失败');
      const result = await resp.json();
      document.getElementById('result-image').value = result.image;
      alert('✅ 图片上传成功！请点击"保存结果设置"生效。');
      await loadResultConfig();
      await loadQuestions();
    } catch (err) {
      alert('❌ 上传失败: ' + err.message);
    }
  };
  input.click();
}

async function clearResultImage() {
  if (!confirm('确定要清除结果页图片吗？')) return;
  document.getElementById('result-image').value = '';
  await saveResultConfig();
}

// ==================== 工具函数 ====================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==================== 初始化 ====================
(async function init() {
  await loadResultConfig();
  await loadQuestions();
})();
