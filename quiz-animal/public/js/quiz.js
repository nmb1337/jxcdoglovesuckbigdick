// ============================================
// 🌸 二次元答题网站 - 前端核心逻辑
// ============================================

// ==================== 樱花粒子系统 ====================
(function initSakuraParticles() {
  const canvas = document.getElementById('sakura-canvas');
  const ctx = canvas.getContext('2d');

  let petals = [];
  const MAX_PETALS = 40;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // 樱花花瓣形状
  function drawPetal(ctx, x, y, size, rotation, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    const w = size * 0.6;
    const h = size;
    // 画花瓣形状
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
      size: 6 + Math.random() * 14,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.04,
      fallSpeed: 0.5 + Math.random() * 1.5,
      swaySpeed: 0.3 + Math.random() * 0.7,
      swayAmount: 20 + Math.random() * 40,
      swayOffset: Math.random() * Math.PI * 2,
      color: Math.random() > 0.3
        ? `rgba(255, ${150 + Math.random() * 80}, ${180 + Math.random() * 60}, ${0.4 + Math.random() * 0.4})`
        : `rgba(255, ${200 + Math.random() * 55}, ${200 + Math.random() * 55}, ${0.3 + Math.random() * 0.3})`
    };
  }

  // 初始化花瓣
  for (let i = 0; i < MAX_PETALS; i++) {
    const p = createPetal();
    p.y = Math.random() * canvas.height;
    petals.push(p);
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    petals.forEach((p, idx) => {
      // 下落
      p.y += p.fallSpeed;
      // 左右摆动
      p.x += Math.sin(Date.now() * 0.001 * p.swaySpeed + p.swayOffset) * 0.5;
      p.rotation += p.rotationSpeed;

      drawPetal(ctx, p.x, p.y, p.size, p.rotation, p.color);

      // 重置到顶部
      if (p.y > canvas.height + 30) {
        petals[idx] = createPetal();
      }
    });

    requestAnimationFrame(animate);
  }

  animate();
})();

// ==================== 状态管理 ====================
const state = {
  questions: [],
  currentIndex: 0,
  answers: {},        // { questionId: selectedOptionIndex }
  answered: {},       // { questionId: true } 标记已答
  phase: 'start'      // 'start' | 'quiz' | 'finished'
};

// ==================== DOM 工具 ====================
const mainContainer = document.getElementById('main-container');
const imageOverlay = document.getElementById('image-overlay');
const overlayImg = document.getElementById('overlay-img');

// ==================== 图片弹出 ====================
function showImage(imageUrl, callback) {
  if (!imageUrl) {
    if (callback) callback();
    return;
  }
  overlayImg.src = imageUrl;
  imageOverlay.style.display = 'flex';
  imageOverlay.classList.remove('fade-out');

  // 1秒后自动消失
  setTimeout(() => {
    imageOverlay.classList.add('fade-out');
    setTimeout(() => {
      imageOverlay.style.display = 'none';
      if (callback) callback();
    }, 500);
  }, 1000);
}

// ==================== 渲染函数 ====================

// 开始页面
function renderStartPage() {
  state.phase = 'start';
  mainContainer.innerHTML = `
    <div class="glass-card" style="text-align:center;">
      <div class="hero-section">
        <span class="hero-icon">🌸</span>
        <h1 class="hero-title">二 次 元 答 题 挑 战</h1>
        <p class="hero-subtitle">✨ アニメクイズに挑戦しよう！ ✨</p>
      </div>
      <p style="color: var(--text-light); margin-bottom: 24px; line-height: 1.8;">
        🎀 共 <strong>10</strong> 道精选动漫题目<br>
        ⏱️ 不限时间，慢慢思考<br>
        🖼️ 答完可能会触发神秘图片哦~
      </p>
      <button class="btn-primary" onclick="loadAndStartQuiz()">
        <span class="btn-icon">🎮</span> 开始答题
      </button>
      <div class="footer-decor" style="margin-top:20px;">
        🩷 你指尖跃动的电光，是我此生不灭的信仰 🩷
      </div>
    </div>
  `;
}

// 加载题目并开始
async function loadAndStartQuiz() {
  try {
    const resp = await fetch('/api/questions');
    if (!resp.ok) throw new Error('加载题目失败');
    state.questions = await resp.json();
    state.currentIndex = 0;
    state.answers = {};
    state.answered = {};
    state.phase = 'quiz';
    renderQuizQuestion();
  } catch (err) {
    alert('⚠️ 加载题目失败，请确保服务器已启动！\n' + err.message);
  }
}

// 渲染答题页面
function renderQuizQuestion() {
  const q = state.questions[state.currentIndex];
  if (!q) {
    finishQuiz();
    return;
  }

  const total = state.questions.length;
  const current = state.currentIndex + 1;
  const progress = ((current - 1) / total) * 100;
  const isAnswered = state.answered[q.id];
  const selectedAns = state.answers[q.id];

  const optionLabels = ['A', 'B', 'C', 'D'];

  let optionsHTML = q.options.map((opt, idx) => {
    let btnClass = 'option-btn';
    if (isAnswered) {
      if (selectedAns === idx) btnClass += ' selected';
    } else if (selectedAns === idx) {
      btnClass += ' selected';
    }
    return `
      <button class="${btnClass}"
              onclick="selectAnswer(${q.id}, ${idx})"
              ${isAnswered ? 'disabled' : ''}>
        <span class="option-letter">${optionLabels[idx]}</span>
        <span class="option-text">${opt}</span>
      </button>
    `;
  }).join('');

  mainContainer.innerHTML = `
    <div class="glass-card">
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${progress}%"></div>
      </div>
      <span class="question-number">第 ${current} / ${total} 题</span>
      <div class="question-text">${q.question}</div>
      <div class="options-list">
        ${optionsHTML}
      </div>
      <button class="next-btn ${isAnswered ? 'active' : ''}"
              id="next-btn"
              onclick="handleNext()">
        ${current >= total ? '🏁 查看结果' : '▶ 下一题'}
      </button>
    </div>
  `;
}

// 选择答案
async function selectAnswer(questionId, optionIndex) {
  if (state.answered[questionId]) return;

  state.answers[questionId] = optionIndex;
  state.answered[questionId] = true;

  // 重新渲染显示选中状态
  renderQuizQuestion();

  // 检查答案并获取可能的图片
  try {
    const resp = await fetch(`/api/check/${questionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: optionIndex })
    });
    const result = await resp.json();

    // 如果有图片，弹出显示1秒
    if (result.image) {
      showImage(result.image, () => {
        // 图片消失后的回调
      });
    }
  } catch (err) {
    console.error('检查答案失败:', err);
  }
}

// 下一题
function handleNext() {
  if (!state.answered[state.questions[state.currentIndex].id]) return;

  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex++;
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
}

// 完成答题
async function finishQuiz() {
  state.phase = 'finished';

  // 提交所有答案获取结果
  let result;
  try {
    const resp = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: state.answers })
    });
    result = await resp.json();
  } catch (err) {
    console.error('提交失败:', err);
    result = { total: state.questions.length, correct: 0, score: 0, details: [] };
  }

  renderResultPage(result);
}

// 渲染结果页面
function renderResultPage(result) {
  const { total, correct, score, details } = result;
  const circumference = 2 * Math.PI * 75;
  const dashOffset = circumference - (circumference * score / 100);

  // 徽章判定
  let badges = '';
  if (score === 100) {
    badges += '<span class="result-badge badge-gold">🏆 完美满分！二次元之王！</span>';
  } else if (score >= 80) {
    badges += '<span class="result-badge badge-silver">⭐ 优秀！资深动漫迷！</span>';
  } else if (score >= 60) {
    badges += '<span class="result-badge badge-bronze">🎯 不错哦！继续加油！</span>';
  } else {
    badges += '<span class="result-badge badge-cute">💪 萌新也要努力呀~</span>';
  }

  // 结果表情
  let resultEmoji = '🌸';
  if (score === 100) resultEmoji = '👑';
  else if (score >= 80) resultEmoji = '🌟';
  else if (score >= 60) resultEmoji = '🎀';
  else if (score >= 40) resultEmoji = '💪';
  else resultEmoji = '🥺';

  // 回顾
  const optionLabels = ['A', 'B', 'C', 'D'];
  let reviewHTML = details.map(d => {
    const isCorrect = d.isCorrect;
    const cls = isCorrect ? 'correct-review' : 'wrong-review';
    return `
      <div class="review-item ${cls}">
        <strong>${isCorrect ? '✅' : '❌'} Q${d.id}:</strong> ${d.question}
        <br><small style="color:${isCorrect ? 'var(--success-color)' : 'var(--error-color)'}">
          你的答案: ${d.userAnswer >= 0 ? optionLabels[d.userAnswer] : '未答'}
          ${!isCorrect ? ' | 正确答案: ' + optionLabels[d.correctAnswer] : ''}
        </small>
      </div>
    `;
  }).join('');

  mainContainer.innerHTML = `
    <div class="glass-card result-section">
      <span class="result-emoji">${resultEmoji}</span>
      <h2 style="margin:12px 0; font-weight:900; font-size:1.6em;">答题结束！</h2>

      <div class="score-circle">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff6b9d"/>
              <stop offset="100%" stop-color="#c77dff"/>
            </linearGradient>
          </defs>
          <circle class="bg-circle" cx="90" cy="90" r="75"/>
          <circle class="fg-circle" cx="90" cy="90" r="75"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${circumference}"
                  id="score-circle-anim"/>
        </svg>
        <div class="score-text" id="score-num">0</div>
      </div>

      <p class="score-label">正确率</p>
      <p class="score-correct">答对 <strong style="font-size:1.3em;color:var(--pink-primary);">${correct}</strong> / ${total} 题</p>

      <div style="margin-bottom:20px;">
        ${badges}
      </div>

      <div class="answer-review">
        <h3 style="margin-bottom:14px;">📋 答题回顾</h3>
        ${reviewHTML}
      </div>

      <button class="btn-primary" style="margin-top:24px;" onclick="restartQuiz()">
        <span class="btn-icon">🔄</span> 再来一次
      </button>
      <div class="footer-decor" style="margin-top:16px;">
        💖 谢谢参与！期待下次再见~ 💖
      </div>
    </div>
  `;

  // 分数动画
  setTimeout(() => {
    const circle = document.getElementById('score-circle-anim');
    const numEl = document.getElementById('score-num');
    if (circle) circle.style.strokeDashoffset = dashOffset;
    if (numEl) {
      let current = 0;
      const step = Math.max(1, Math.floor(score / 40));
      const timer = setInterval(() => {
        current += step;
        if (current >= score) {
          current = score;
          clearInterval(timer);
        }
        numEl.textContent = current + '%';
      }, 30);
    }
  }, 300);
}

// 重新开始
function restartQuiz() {
  state.currentIndex = 0;
  state.answers = {};
  state.answered = {};
  state.phase = 'start';
  renderStartPage();
}

// ==================== 键盘支持 ====================
document.addEventListener('keydown', (e) => {
  if (state.phase !== 'quiz') return;

  const q = state.questions[state.currentIndex];
  if (!q) return;

  // 数字键1-4选择选项
  if (e.key >= '1' && e.key <= '4') {
    const idx = parseInt(e.key) - 1;
    if (idx < q.options.length && !state.answered[q.id]) {
      selectAnswer(q.id, idx);
    }
  }

  // Enter 下一题
  if (e.key === 'Enter') {
    if (state.answered[q.id]) {
      handleNext();
    }
  }
});

// ==================== 初始化 ====================
renderStartPage();
