const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ==================== 中间件 ====================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== 文件上传配置 ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ==================== 题目数据文件路径 ====================
const DATA_FILE = path.join(__dirname, 'data', 'questions.json');

// 读取题目
function loadQuestions() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

// 保存题目
function saveQuestions(questions) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(questions, null, 2), 'utf-8');
}

// ==================== API 路由 ====================

// 获取所有题目（前端答题用，不返回答案）
app.get('/api/questions', (req, res) => {
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
app.get('/api/questions/admin', (req, res) => {
  const questions = loadQuestions();
  res.json(questions);
});

// 获取单个题目
app.get('/api/questions/:id', (req, res) => {
  const questions = loadQuestions();
  const q = questions.find(q => q.id === parseInt(req.params.id));
  if (!q) return res.status(404).json({ error: '题目不存在' });
  res.json(q);
});

// 新增题目
app.post('/api/questions', (req, res) => {
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
app.put('/api/questions/:id', (req, res) => {
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
app.delete('/api/questions/:id', (req, res) => {
  let questions = loadQuestions();
  const before = questions.length;
  questions = questions.filter(q => q.id !== parseInt(req.params.id));
  if (questions.length === before) return res.status(404).json({ error: '题目不存在' });
  saveQuestions(questions);
  res.json({ success: true });
});

// 上传图片（为某个题目设置图片）
app.post('/api/upload/:id', upload.single('image'), (req, res) => {
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

// 批量提交答案（前端提交所有答案，返回得分）
app.post('/api/submit', (req, res) => {
  const { answers } = req.body; // { "1": 0, "2": 1, ... }
  const questions = loadQuestions();
  let correct = 0;
  const total = questions.length;
  const details = questions.map(q => {
    const userAnswer = answers[q.id] !== undefined ? answers[q.id] : -1;
    const isCorrect = userAnswer === q.answer;
    if (isCorrect) correct++;
    return {
      id: q.id,
      question: q.question,
      userAnswer,
      correctAnswer: q.answer,
      isCorrect
    };
  });
  res.json({
    total,
    correct,
    score: total > 0 ? Math.round((correct / total) * 100) : 0,
    details
  });
});

// 提交单个题目答案
app.post('/api/check/:id', (req, res) => {
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

// 启动服务器
app.listen(PORT, () => {
  console.log(`🎌 二次元答题服务器已启动！`);
  console.log(`   前端页面: http://localhost:${PORT}`);
  console.log(`   管理后台: http://localhost:${PORT}/admin.html`);
  console.log(`   API 地址: http://localhost:${PORT}/api/questions`);
});
