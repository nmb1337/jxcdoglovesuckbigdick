const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

// ==================== 端口配置 ====================
const API_PORT = 14514;   // 后端 API 端口
const WEB_PORT = 9527;     // 前端静态页面端口

// ==================== 数据文件路径 ====================
const DATA_DIR = path.join(__dirname, 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const RESULT_FILE = path.join(DATA_DIR, 'result.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// 确保目录存在
[DATA_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ==================== 数据读写工具 ====================
function readJSON(filePath, defaultVal) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return defaultVal;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadQuestions() {
  return readJSON(QUESTIONS_FILE, []);
}

function saveQuestions(questions) {
  writeJSON(QUESTIONS_FILE, questions);
}

function loadResult() {
  return readJSON(RESULT_FILE, { image: '', text: '🎉 恭喜完成答题！' });
}

function saveResult(result) {
  writeJSON(RESULT_FILE, result);
}

// 初始化默认数据
if (!fs.existsSync(RESULT_FILE)) {
  saveResult({ image: '', text: '🎉 恭喜完成答题！\n感谢你的参与~' });
}

// ==================== 文件上传配置 ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ==================== 后端 API 服务器 (端口 114514) ====================
const apiApp = express();
apiApp.use(cors());
apiApp.use(express.json());
apiApp.use('/uploads', express.static(UPLOADS_DIR));

// ---- 题目 API ----

// 获取所有题目（前端答题用，不返回答案）
apiApp.get('/api/questions', (req, res) => {
  const questions = loadQuestions();
  // 返回时不带正确答案
  const safe = questions.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options,
    image: q.image
  }));
  res.json(safe);
});

// 获取所有题目（管理端用，包含答案）
apiApp.get('/api/questions/admin', (req, res) => {
  const questions = loadQuestions();
  res.json(questions);
});

// 获取单个题目
apiApp.get('/api/questions/:id', (req, res) => {
  const questions = loadQuestions();
  const q = questions.find(q => q.id === parseInt(req.params.id));
  if (!q) return res.status(404).json({ error: '题目不存在' });
  res.json(q);
});

// 新增题目
apiApp.post('/api/questions', (req, res) => {
  const questions = loadQuestions();
  const { question, options, answer, image } = req.body;
  const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
  const newQ = {
    id: newId,
    question: question || '',
    options: options || ['', '', '', ''],
    answer: answer !== undefined ? answer : 0,
    image: image || ''
  };
  questions.push(newQ);
  saveQuestions(questions);
  res.json({ success: true, question: newQ });
});

// 更新题目
apiApp.put('/api/questions/:id', (req, res) => {
  const questions = loadQuestions();
  const idx = questions.findIndex(q => q.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '题目不存在' });
  const { question, options, answer, image } = req.body;
  if (question !== undefined) questions[idx].question = question;
  if (options !== undefined) questions[idx].options = options;
  if (answer !== undefined) questions[idx].answer = answer;
  if (image !== undefined) questions[idx].image = image;
  saveQuestions(questions);
  res.json({ success: true, question: questions[idx] });
});

// 删除题目
apiApp.delete('/api/questions/:id', (req, res) => {
  let questions = loadQuestions();
  const before = questions.length;
  questions = questions.filter(q => q.id !== parseInt(req.params.id));
  if (questions.length === before) return res.status(404).json({ error: '题目不存在' });
  saveQuestions(questions);
  res.json({ success: true });
});

// 上传图片（为某个题目设置图片）
apiApp.post('/api/upload/:id', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '没有上传文件' });
  const questions = loadQuestions();
  const idx = questions.findIndex(q => q.id === parseInt(req.params.id));
  if (idx === -1) {
    // 删除刚上传的文件
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: '题目不存在' });
  }
  const imageUrl = '/uploads/' + req.file.filename;
  questions[idx].image = imageUrl;
  saveQuestions(questions);
  res.json({ success: true, image: imageUrl });
});

// 提交单个题目答案
apiApp.post('/api/check/:id', (req, res) => {
  const questions = loadQuestions();
  const q = questions.find(q => q.id === parseInt(req.params.id));
  if (!q) return res.status(404).json({ error: '题目不存在' });
  const userAnswer = req.body.answer;
  const isCorrect = userAnswer === q.answer;
  res.json({
    id: q.id,
    isCorrect,
    correctAnswer: q.answer,
    image: q.image || null
  });
});

// ---- 结果页 API ----

// 获取结果页配置（前端用）
apiApp.get('/api/result', (req, res) => {
  res.json(loadResult());
});

// 更新结果页配置（管理端用）
apiApp.put('/api/result', (req, res) => {
  const { image, text } = req.body;
  const result = loadResult();
  if (image !== undefined) result.image = image;
  if (text !== undefined) result.text = text;
  saveResult(result);
  res.json({ success: true, result });
});

// 上传结果页图片
apiApp.post('/api/result/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '没有上传文件' });
  const imageUrl = '/uploads/' + req.file.filename;
  const result = loadResult();
  result.image = imageUrl;
  saveResult(result);
  res.json({ success: true, image: imageUrl });
});

// 启动 API 服务器
apiApp.listen(API_PORT, () => {
  console.log(`🔧 后端 API 服务器已启动: http://localhost:${API_PORT}`);
});

// ==================== 前端静态服务器 (端口 9527) ====================
const webApp = express();

// 代理：将 /api/* 和 /uploads/* 请求转发到后端 API 服务器（保留完整路径）
webApp.use(createProxyMiddleware({
  target: `http://localhost:${API_PORT}`,
  changeOrigin: true,
  pathFilter: ['/api/**', '/uploads/**']
}));

// 静态文件
webApp.use(express.static(path.join(__dirname, 'public')));

webApp.listen(WEB_PORT, () => {
  console.log(`🌸 前端页面服务器已启动: http://localhost:${WEB_PORT}`);
  console.log(`   答题页面: http://localhost:${WEB_PORT}`);
  console.log(`   管理后台: http://localhost:${WEB_PORT}/admin.html`);
  console.log(`   📡 API 代理已启用: /api/* → http://localhost:${API_PORT}`);
});
