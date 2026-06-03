# 🦊 药小福 · 药管家

> 基于 **Uni-App + Vue 3** 的智能药物管理系统，为中老年人提供用药提醒、AI 健康咨询和家庭联动服务。

[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Uni-App](https://img.shields.io/badge/uni--app-3.0-2E7D32)](https://uniapp.dcloud.io/)
[![Vue](https://img.shields.io/badge/vue-3.x-4FC08D)](https://vuejs.org/)
[![DeepSeek](https://img.shields.io/badge/AI-DeepSeek-FF6F3C)](https://www.deepseek.com/)

---

## 📖 目录

- [项目简介](#项目简介)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [一键部署](#一键部署)
- [配置说明](#配置说明)
- [设计理念](#设计理念)
- [团队](#团队)

---

## 项目简介

**药小福（药管家）** 是一个面向中老年用户的智能药物管理应用，由中央财经大学信息管理 24 李禹成团队开发，用于课堂展示及科研项目。

应用整合了 **药物管理**、**服药提醒**、**AI 健康助手** 和 **家属联动** 四大模块，旨在解决中老年人"忘记吃药、吃错药、药物冲突"等核心痛点。

### 🎯 目标用户

- **核心用户**：长期服药的中老年人
- **辅助用户**：关心家人用药情况的子女/家属

---

## 核心功能

### 💊 药物管理
- 添加/编辑/删除药物信息（名称、剂量、频次、时段）
- 按「早/中/晚」时段自动分组展示
- 药物过期自动标记提醒
- 服药进度实时追踪（今日已完成 / 总药物数）

### ⏰ 智能提醒
- 按时段（早晨 / 下午 / 晚上）分组展示药物
- 服药状态可视化：待服用（橙色高亮）/ 已服用（绿色）/ 已过期（红色）
- 一键标记"已服用"，支持 3 秒内撤销

### 🦊 药小福 AI 健康助手
- 集成 **DeepSeek** 大语言模型，通过 uniCloud 云函数安全调用
- 6 大智能服务卡片：
  - 🔍 药物冲突检查
  - ⏰ 用药提醒建议
  - ⚠️ 副作用查询
  - 🥗 饮食禁忌
  - 📖 药品说明书
  - 🩺 健康问答
- 紧急症状检测（自动提示拨打 120）
- 对话式交互 + 追问标签

### 👨‍👩‍👧 家属联动
- 绑定家属账号，远程查看家人用药状态
- 服药完成情况实时同步
- 异常提醒通知

### 📊 服药记录
- 日历视图查看历史服药情况
- 每日完成状态一目了然
- 统计面板（周/月完成率）

### 👤 个人中心
- 用户健康信息管理
- 头像/姓名/年龄/健康备注
- 用药设置与偏好

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Uni-App (Vue 3) | 跨端开发，支持 H5 / 小程序 / App |
| 样式方案 | SCSS + rpx | 响应式适配，老年友好大字号 |
| 状态管理 | 自定义 Store | 轻量响应式数据层 |
| 本地存储 | uni.storage API | 本地优先，离线可用 |
| 云服务 | uniCloud (阿里云) | 云函数 + 云数据库 |
| AI 引擎 | DeepSeek Chat | 健康咨询与药物分析 |
| 部署工具 | Python 脚本 | 一键多平台构建与部署 |

### 平台支持

| 平台 | 状态 |
|------|------|
| H5 网页 | ✅ 已支持 |
| 微信小程序 | ✅ 已配置 |
| 支付宝小程序 | ✅ 已配置 |
| Android App | ✅ 已配置 |
| 百度/头条小程序 | ✅ 已配置 |

---

## 项目结构

```
药物管理系统UNI-APP版/
├── pages/                          # 页面
│   ├── index/index.vue             # 🏠 首页 — 药物列表 + 进度
│   ├── record/record.vue           # 📊 服药记录 — 日历 + 统计
│   ├── ai/ai.vue                   # 🦊 药小福 — AI 健康助手
│   ├── add/add.vue                 # ➕ 添加药物
│   ├── drugs/drugs.vue             # 💊 药物管理 — 编辑/删除
│   ├── family/family.vue           # 👨‍👩‍👧 家属联动
│   └── profile/profile.vue         # 👤 个人中心
├── utils/                          # 工具模块
│   ├── medicine-store.js           # 统一数据访问层（本地 + 云端）
│   ├── ai-service.js               # AI 服务封装（云函数 / 直连）
│   ├── cloud-db.js                 # uniCloud 数据库适配器
│   ├── storage/index.js            # 本地存储封装
│   └── constants/defaults.js       # 默认配置与常量
├── uniCloud-aliyun/                # uniCloud 云端
│   ├── cloudfunctions/
│   │   └── health-ai/              # 健康 AI 云函数
│   │       ├── index.js            # 主逻辑（DeepSeek 代理）
│   │       ├── config.example.js   # 配置模板
│   │       └── package.json
│   └── database/                   # 数据库 Schema
│       ├── medicines.schema.json
│       ├── records.schema.json
│       └── users.schema.json
├── uni_modules/                    # uni-app 插件
├── static/                         # 静态资源
│   ├── logo.png
│   └── tabbar/                     # 底部导航图标
├── scripts/                        # 辅助脚本
├── deploy.py                       # 🚀 一键部署脚本
├── App.vue                         # 全局样式（900+ 行设计系统）
├── pages.json                      # 页面路由与 TabBar 配置
├── manifest.json                   # 应用配置
├── uni.scss                        # 全局 SCSS 变量
└── package.json
```

---

## 快速开始

### 环境要求

- **Node.js** >= 16
- **npm** >= 8
- **HBuilderX**（[下载地址](https://www.dcloud.io/hbuilderx.html)）
- 微信开发者工具（构建小程序时需要）

### 安装与运行

```bash
# 1. 克隆项目
git clone git@github.com:sorabeloved2/drug-management-uni-app.git
cd 药物管理系统UNI-APP版

# 2. 安装依赖
npm install

# 3. 配置 AI 云函数
cp uniCloud-aliyun/cloudfunctions/health-ai/config.example.js \
   uniCloud-aliyun/cloudfunctions/health-ai/config.js
# 编辑 config.js，填入你的 DeepSeek API Key
# 获取 Key：https://platform.deepseek.com/api_keys

# 4. 用 HBuilderX 打开项目
# 菜单 → 运行 → 运行到浏览器 / 运行到微信小程序
```

### DeepSeek API Key 获取

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册/登录后进入「API Keys」页面
3. 创建新的 API Key 并复制
4. 粘贴到 `uniCloud-aliyun/cloudfunctions/health-ai/config.js` 中

---

## 一键部署

项目提供了 Python 部署脚本，支持多平台一键构建：

```bash
# 交互式菜单
python deploy.py

# 指定构建目标
python deploy.py h5            # 构建 H5 网页版
python deploy.py mp-weixin     # 构建微信小程序
python deploy.py mp-alipay     # 构建支付宝小程序
python deploy.py app-android   # 构建 Android App
python deploy.py cloud         # 部署 uniCloud 云函数
python deploy.py all           # 完整部署（H5 + 云函数）
python deploy.py check         # 仅环境检查

# 指定 HBuilderX 路径
python deploy.py h5 --hbuilderx "D:\HBuilderX\HBuilderX.exe"
```

部署脚本功能：
- 环境检测（Node.js / npm / HBuilderX / 云函数配置）
- 依赖安装
- 多平台构建
- uniCloud 云函数上传
- 发布前安全检查

---

## 配置说明

### uniCloud 服务空间

1. 在 HBuilderX 中右键 `uniCloud-aliyun` 目录
2. 选择「关联服务空间」
3. 登录阿里云账号，创建/选择服务空间
4. 右键云函数 → 「上传部署」
5. 右键 database → 「上传 schema」

### AI 调用模式

在 `utils/ai-service.js` 中可切换两种模式：

```js
const CONFIG = {
  mode: 'cloud',   // 'cloud' = 云函数代理（生产推荐）
                    // 'direct' = 直连 API（开发测试用）
  apiKey: '',       // mode='direct' 时需要填写
}
```

| 模式 | API Key 位置 | 安全性 | 适用场景 |
|------|-------------|--------|---------|
| `cloud` | 云函数环境变量 | 高（不暴露客户端） | 生产环境 |
| `direct` | 客户端代码 | 低（暴露给用户） | 开发测试 |

---

## 设计理念

### 🎨 视觉设计

- **暖橙色品牌色**（#FF6F3C）：传递温暖、关怀的品牌情感
- **老年友好**：大字号（32rpx+）、大触控区域（≥ 88rpx）、高对比度
- **色盲友好**：颜色 + 图标 + 文字三重状态编码，不完全依赖颜色传达信息
- **极简卡片式布局**：阴影替代边框，减少视觉噪音

### 🤖 AI 人格化

药小福的设计参考了蚂蚁阿福「从管家迈向家人」的理念：
- 🦊 狐狸 IP 形象，温暖可信赖
- 智能体服务卡片降低 AI 使用门槛
- 招呼气泡根据时间段自动变化

### 🔒 安全设计

- AI 回答强制包含免责声明
- 紧急症状（胸痛、呼吸困难等）自动触发 120 提醒
- 医疗建议边界明确：不提供诊断、不推荐处方剂量
- API Key 仅存储在云函数服务端

---

## 团队

| 角色 | 姓名 |
|------|------|
| 项目负责人 | 李禹成 |
| 所属院校 | 中央财经大学 |
| 专业班级 | 信息管理 24 |
| 联系邮箱 | sorabeloved2@gmail.com |

> 本项目为学术交流项目，仅供课堂展示和科研使用。

---

## 📄 许可证

本项目仅供学术交流使用。所有代码版权归原作者所有。

---

<p align="center">
  <b>🦊 药小福 — 让每一次用药都安心</b><br>
  <sub>Made with ❤️ by CUFE 李禹成团队</sub>
</p>
