/**
 * 健康 AI 服务 — 统一入口
 *
 * 支持两种调用模式：
 *   1. uniCloud 云函数模式（推荐生产使用，API Key 安全）
 *   2. 直连 DeepSeek 模式（开发测试用，无需部署云函数）
 *
 * 配置方式：在下方 CONFIG 中设置 apiKey 即可使用直连模式
 *
 *   如需切换到云函数模式，设置 CONFIG.mode = 'cloud'
 *   并在 uniCloud 控制台配置 DEEPSEEK_API_KEY 环境变量
 */

import * as Store from '@/utils/medicine-store.js'
import Storage from '@/utils/storage/index.js'
import { PERIOD_NAMES } from '@/utils/constants/defaults.js'

// ======================== 配置 ========================

const CONFIG = {
  /**
   * 调用模式：
   *   'cloud'  — 通过 uniCloud 云函数代理（生产推荐）
   *   'direct' — 直连 DeepSeek API（开发测试用，apiKey 会暴露在客户端）
   */
  mode: 'cloud',

  /**
   * DeepSeek API Key（mode='direct' 时需要）
   * mode='cloud' 时不需要填写，Key 存在 uniCloud 云函数环境变量中
   */
  apiKey: '',

  /** API 地址 */
  apiUrl: 'https://api.deepseek.com/v1/chat/completions',

  /** 默认模型 */
  model: 'deepseek-chat',

  /** 请求超时（毫秒） */
  timeout: 30000
}

// ======================== 上下文构建 ========================

/**
 * 构建发送给 AI 的用户上下文
 * 包含当前用户的药物列表、年龄等信息
 */
function buildUserContext() {
  const userInfo = Storage.get('userInfo') || {}
  const medicines = Store.getMedicines()

  return {
    name: userInfo.name || '未知',
    age: userInfo.age || '',
    healthNotes: userInfo.healthNotes || '',
    medicines: medicines.map(m => ({
      name: m.name,
      dosage: m.dosage,
      period: m.period,
      periodLabel: PERIOD_NAMES[m.period] || m.period,
      note: m.note || ''
    }))
  }
}

// ======================== 快捷提问模板 ========================

/** 预设的快捷提问 */
export const QUICK_QUESTIONS = [
  {
    label: '🔍 药物冲突检查',
    question: '请帮我检查一下我现在吃的这些药，有没有不能一起吃的？'
  },
  {
    label: '💊 服药注意事项',
    question: '这些药应该饭前吃还是饭后吃？有什么饮食禁忌吗？'
  },
  {
    label: '😷 感冒用药建议',
    question: '感冒了应该吃什么药？需要注意什么？'
  },
  {
    label: '🥗 健康饮食',
    question: '有高血压的话，日常饮食应该注意哪些？'
  },
  {
    label: '⏰ 忘记吃药怎么办',
    question: '如果忘记吃药了，是马上补服还是等下一次？'
  },
  {
    label: '💡 药物基础知识',
    question: '什么是处方药和非处方药？怎么区分？'
  }
]

// ======================== 核心 API ========================

/**
 * 发送消息给健康 AI
 *
 * @param {Array} messages  — 对话历史 [{role: 'user'|'assistant', content: '...'}]
 * @param {Object} options  — { onStream, signal }（暂不支持流式）
 * @returns {Promise<{success: boolean, content: string, error?: string}>}
 */
export async function chat(messages, options = {}) {
  const userContext = buildUserContext()

  if (CONFIG.mode === 'cloud') {
    return chatViaCloud(messages, userContext, options)
  }
  return chatViaDirect(messages, userContext, options)
}

/**
 * 快捷：检查药物相互作用
 * 自动带入用户药物列表
 */
export async function checkInteractions() {
  const ctx = buildUserContext()
  if (ctx.medicines.length === 0) {
    return { success: true, content: '您还没有添加任何药物，无法检查相互作用。请先在「添加药物」页面添加您的药品。' }
  }
  if (ctx.medicines.length === 1) {
    return { success: true, content: '您目前只有一种药物，无法检查相互作用。当您添加多种药物时，我可以帮您分析它们之间是否存在冲突。' }
  }

  const medNames = ctx.medicines.map(m => `${m.name}（${m.dosage}）`).join('、')
  const messages = [
    {
      role: 'user',
      content: `请帮我检查以下药物的相互作用和注意事项：${medNames}。请逐一分析可能的相互作用，并给出风险等级。`
    }
  ]
  return chat(messages)
}

/**
 * 快捷：生成个性化服药提醒文案
 *
 * @param {Object} medicine — 单个药物对象
 * @returns {Promise<{success: boolean, content: string}>}
 */
export async function generateReminder(medicine) {
  const ctx = buildUserContext()
  const messages = [
    {
      role: 'user',
      content: `请帮我想一句温馨的服药提醒文案，用于提醒${ctx.name || '用户'}服用「${medicine.name}」（${medicine.dosage}，${medicine.note || ''}）。要求：温暖、简洁、不超过50字，不要用"亲爱的"之类的称呼。`
    }
  ]
  return chat(messages)
}

/**
 * 快捷：健康知识问答（无上下文）
 */
export async function askHealth(question) {
  return chat([{ role: 'user', content: question }])
}

// ======================== 内部实现 ========================

/** 通过 uniCloud 云函数调用 */
async function chatViaCloud(messages, userContext, options) {
  try {
    // 检查 uniCloud 是否已初始化
    if (!uniCloud || !uniCloud.callFunction) {
      return {
        success: false,
        error: 'uniCloud 未初始化，请在 HBuilderX 中右键 uniCloud-aliyun 目录 → 关联服务空间'
      }
    }

    const result = await uniCloud.callFunction({
      name: 'health-ai',
      data: {
        action: 'chat',
        messages,
        userContext
      }
    })

    if (result.result && result.result.code === 0) {
      const choice = result.result.data.choices[0]
      return {
        success: true,
        content: choice.message.content,
        emergency: result.result.data.emergency || false
      }
    }

    return {
      success: false,
      error: result.result?.message || '云函数调用失败'
    }
  } catch (e) {
    console.error('[AIService] 云函数调用异常:', e)
    // 微信小程序中把真实错误暴出来，方便排查
    const errMsg = e.message || e.errMsg || JSON.stringify(e)
    return {
      success: false,
      error: '云函数调用失败：' + errMsg
    }
  }
}

/** 直连 DeepSeek API */
async function chatViaDirect(messages, userContext, options) {
  if (!CONFIG.apiKey) {
    return {
      success: false,
      error: '未配置 API Key。请在 utils/ai-service.js 的 CONFIG.apiKey 中填入你的 DeepSeek API Key，或切换到 cloud 模式。'
    }
  }

  // 构建系统提示词（简化版，完整版在云函数中）
  const systemPrompt = buildDirectSystemPrompt(userContext)
  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ]

  try {
    const [err, res] = await uniRequest({
      url: CONFIG.apiUrl,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: CONFIG.model,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 0.9
      },
      timeout: CONFIG.timeout
    })

    if (err) {
      return { success: false, error: `网络请求失败：${err.errMsg || err}` }
    }

    const body = res.data
    if (body.choices && body.choices[0]) {
      return {
        success: true,
        content: body.choices[0].message.content,
        usage: body.usage
      }
    }

    return {
      success: false,
      error: body.error?.message || 'AI 返回格式异常'
    }
  } catch (e) {
    console.error('[AIService] 直连调用失败:', e)
    return {
      success: false,
      error: 'AI 服务调用失败，请稍后重试'
    }
  }
}

/** 直连模式的系统提示词 */
function buildDirectSystemPrompt(ctx) {
  const medList = ctx.medicines.length > 0
    ? ctx.medicines.map(m => `- ${m.name} ${m.dosage}（${m.periodLabel}·${m.note}）`).join('\n')
    : '暂无药物'

  return `你是「药管家」健康 AI 助手，专为中老年用户提供用药指导。

用户：${ctx.name}，${ctx.age ? ctx.age + '岁' : '未知年龄'}
药物列表：
${medList}

安全规则：
1. 不提供诊断结论，只说"建议咨询医生"
2. 遇到胸痛、呼吸困难等紧急症状，立即建议拨打 120
3. 所有回答结尾加"⚠️ 以上建议仅供参考，不能替代专业医疗诊断"
4. 用通俗易懂的中文，对老年人友好`
}

// ======================== 工具 ========================

/** Promise 化的 uni.request */
function uniRequest(options) {
  return new Promise((resolve) => {
    uni.request({
      ...options,
      success: (res) => resolve([null, res]),
      fail: (err) => resolve([err, null])
    })
  })
}

// ======================== 导出配置（供页面读取状态） ========================

export function getConfig() {
  return { mode: CONFIG.mode, hasApiKey: !!CONFIG.apiKey }
}
