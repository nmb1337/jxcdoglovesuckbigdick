# 🌸 二次元答题挑战 — Anime Quiz

一个前后端分离的二次元风格答题网站，前端答题，后端管理题目与结果页。

## 🎯 功能特性

- 🎮 **答题页面**：樱花飘落粒子动画 + 玻璃拟态 UI
- ⚙️ **管理后台**：可视化增删改查题目、上传图片
- 🖼️ **答题图片弹窗**：每道题答完后可弹出图片（1秒后自动消失）
- 🏁 **自定义结果页**：无论答题对错，最终统一跳转到自定义图片+文字的结果页
- ⌨️ **键盘支持**：数字键 1-4 选选项，Enter 下一题
- 🔌 **前后端分离**：前端静态服务（9527）+ 后端 API（14514）

## 📂 项目结构

```
quiz-animal/
├── server.js              # 后端 API + 前端静态服务
├── package.json           # 依赖配置
├── README.md              # 本文件
├── data/
│   ├── questions.json     # 题目数据（可自由编辑）
│   └── result.json        # 结果页配置（图片+文字）
├── uploads/               # 上传的图片存放目录
└── public/
    ├── index.html         # 答题页面
    ├── admin.html         # 管理后台
    ├── css/
    │   └── style.css      # 樱花二次元主题样式
    └── js/
        ├── quiz.js        # 前端答题逻辑
        └── admin.js       # 管理后台逻辑
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd quiz-animal
npm install
```

### 2. 启动服务

```bash
node server.js
```

### 3. 访问页面

| 页面 | 地址 |
|------|------|
| 🎮 答题页面 | http://localhost:9527 |
| ⚙️ 管理后台 | http://localhost:9527/admin.html |
| 🔧 API 地址 | http://localhost:14514/api/questions |

## 🛠️ 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端页面 | **9527** | 静态 HTML/CSS/JS 页面 |
| 后端 API | **14514** | 题目/结果 CRUD + 图片上传 |

> 💡 如需修改端口，编辑 `server.js` 顶部的 `WEB_PORT` 和 `API_PORT` 常量，同时更新 `public/js/quiz.js` 和 `public/js/admin.js` 中的 `API_BASE`。

## 📋 管理后台使用

1. 打开 `http://localhost:9527/admin.html`
2. **题目管理**：
   - ➕ 新增：填写题目、四个选项、勾选正确答案
   - ✏️ 编辑：修改已有题目
   - 🖼️ 上传图片：为题目上传配图（答完该题后弹出1秒）
   - 🗑️ 删除：删除题目或图片
3. **结果页设置**（页面底部）：
   - 📤 上传结果页图片
   - 📝 编辑结果页文字（支持换行）
   - 💾 点击「保存结果设置」生效

## 🔌 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/questions` | 获取题目（不含答案） |
| GET | `/api/questions/admin` | 获取题目（含答案） |
| POST | `/api/questions` | 新增题目 |
| PUT | `/api/questions/:id` | 更新题目 |
| DELETE | `/api/questions/:id` | 删除题目 |
| POST | `/api/upload/:id` | 上传题目图片 |
| POST | `/api/check/:id` | 检查单个答案 |
| GET | `/api/result` | 获取结果页配置 |
| PUT | `/api/result` | 更新结果页配置 |
| POST | `/api/result/upload` | 上传结果页图片 |

## 🎨 二次元 UI 特色

- 🌸 Canvas 樱花飘落粒子（40+ 花瓣实时渲染）
- 🫧 玻璃拟态（Glassmorphism）卡片设计
- 🎀 粉色渐变 + 紫色点缀配色
- ✨ 浮动装饰元素
- 📱 响应式适配（支持手机/平板/桌面）
- 🎬 按钮悬停动画、选项选中动效

## 📝 许可

MIT License — 仅供本地学习与娱乐使用。
