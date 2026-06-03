'use strict'

// ======================== 配置 ========================

const CONFIG = {
  apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
  defaults: {
    temperature: 0.7,
    max_tokens: 1500,
    top_p: 0.9
  }
}

// 从本地配置文件读取 API Key（uniCloud 阿里云版最可靠的方式）
let apiKeyFromConfig = ''
try {
  apiKeyFromConfig = require('./config.js').DEEPSEEK_API_KEY || ''
} catch (e) {
  console.log('[HealthAI] 未找到 config.js 或读取失败')
}

// ======================== 系统提示词 ========================

function buildSystemPrompt(userContext = {}) {
  const { name, age, medicines = [], healthNotes = '' } = userContext
  const medicineList = medicines.length > 0
    ? medicines.map(m => `  - ${m.name} ${m.dosage}（${m.periodLabel || m.period}·${m.note || ''}）`).join('\n')
    : '  暂无药物记录'

  return `你是「药管家」App 内置的健康 AI 助手，专为中老年用户提供用药指导和健康建议。

## 用户信息
- 姓名：${name || '未知'}
- 年龄：${age ? age + '岁' : '未知'}
${healthNotes ? '- 健康备注：' + healthNotes : ''}

## 用户当前药物列表
${medicineList}

## 你的能力范围
1. ✅ 解释药物功效、用法用量、常见副作用
2. ✅ 检查用户药物列表中可能的相互作用
3. ✅ 提供慢性病（高血压、糖尿病等）的饮食和生活方式建议
4. ✅ 生成个性化的服药提醒文案
5. ✅ 解答常见家庭用药疑问

## 安全规则（必须严格遵守！）
1. 🚫 绝对不提供诊断结论 —— 只说「可能」「建议咨询医生」
2. 🚫 绝对不推荐具体处方药剂量 —— 只说「请遵医嘱」
3. 🚫 遇到胸痛、呼吸困难、意识模糊、大出血等紧急症状 —— 立即建议「请马上拨打 120 急救电话」
4. 🚫 遇到「某某药吃多少」类问题 —— 强调「请按医嘱或药品说明书服用」
5. ✅ 所有回答结尾加上「⚠️ 以上建议仅供参考，不能替代专业医疗诊断，如有不适请及时就医。」
6. ✅ 用通俗易懂的中文回答，避免过于专业的医学术语

## 回答风格
- 温暖、耐心，像一位贴心的家庭医生
- 对老年人友好，用词简单清晰
- 先给出最关键的结论，再展开解释
- 涉及药物相互作用时，用 ⚠️ 标记风险等级`
}

// ======================== 安全过滤 ========================

const EMERGENCY_KEYWORDS = [
  '胸痛', '胸闷剧烈', '呼吸困难', '喘不上气', '意识模糊',
  '大出血', '大量出血', '昏迷', '晕倒', '抽搐',
  '自杀', '安眠药过量', '吞药自杀'
]

function checkEmergency(userMessage) {
  const text = typeof userMessage === 'string' ? userMessage : ''
  for (const kw of EMERGENCY_KEYWORDS) {
    if (text.includes(kw)) return true
  }
  return false
}

const EMERGENCY_RESPONSE = {
  role: 'assistant',
  content: `🚨 **紧急提醒！**

您描述的症状可能属于**紧急情况**，请立即采取以下行动：

1. 📞 **马上拨打 120 急救电话**
2. 🏥 保持镇静，不要自行移动
3. 👨‍👩‍👧 同时通知家属或身边的人

⚠️ 我不是医生，无法提供紧急医疗指导。请以最快的速度寻求专业急救帮助！`
}

// ======================== 主函数 ========================

exports.main = async (event, context) => {
  const { messages, userContext = {} } = event

  if (!messages || !Array.isArray(messages)) {
    return { code: 400, message: '缺少 messages 参数' }
  }

  // 紧急症状检测
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  if (lastUserMsg && checkEmergency(lastUserMsg.content)) {
    return {
      code: 0,
      data: {
        choices: [{ message: EMERGENCY_RESPONSE }],
        emergency: true
      }
    }
  }

  // 构建消息列表
  const fullMessages = [
    { role: 'system', content: buildSystemPrompt(userContext) },
    ...messages
  ]

  // 调用 DeepSeek API
  try {
    // 优先读取配置文件，其次环境变量
    // 自动 .trim() 并过滤占位符/中文等非法字符
    const rawKey = (apiKeyFromConfig || process.env.DEEPSEEK_API_KEY || '').trim()
    // DeepSeek Key 以 sk- 开头，且必须是纯 ASCII 可打印字符
    const isValidKey = (k) => k && k.startsWith('sk-') && /^[\x20-\x7e]+$/.test(k)
    const apiKey = isValidKey(rawKey) ? rawKey : ''

    if (!apiKey) {
      return {
        code: 500,
        message: '服务未配置 API Key，请在 health-ai/config.js 中填入真实的 DeepSeek API Key 后重新上传部署'
      }
    }

    const response = await uniCloud.httpclient.request(CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: CONFIG.model,
        messages: fullMessages,
        temperature: CONFIG.defaults.temperature,
        max_tokens: CONFIG.defaults.max_tokens,
        top_p: CONFIG.defaults.top_p
      },
      dataType: 'json',
      timeout: 30000
    })

    const result = response.data
    console.log('[HealthAI] 请求成功, tokens:', result.usage)

    return {
      code: 0,
      data: result
    }

  } catch (error) {
    console.error('[HealthAI] API 调用失败:', error.message)
    return {
      code: 500,
      message: 'AI 服务暂时不可用，请稍后重试',
      error: error.message
    }
  }
}
