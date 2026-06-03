<template>
  <view class="afu-container">
    <!-- 头部 — 简洁暖色 -->
    <view class="afu-header">
      <view class="afu-back" @click="goBack">
        <text>←</text>
      </view>
      <view class="afu-header-center">
        <view class="afu-mascot-small">🦊</view>
        <text class="afu-header-title">药小福</text>
        <view class="afu-status-dot"></view>
      </view>
      <view class="afu-header-right" @click="clearChat">
        <text class="afu-new-chat">+ 新对话</text>
      </view>
    </view>

    <!-- 主内容区（可滚动） -->
    <scroll-view
      class="afu-body"
      scroll-y
      :scroll-into-view="scrollIntoViewId"
      :scroll-with-animation="true"
    >
      <!-- ===== 首页态：人格化 IP + 智能体卡片 ===== -->
      <view v-if="messages.length === 0" class="afu-home">
        <!-- AI 人格形象 -->
        <view class="afu-hero">
          <view class="afu-hero-avatar">
            <text class="afu-hero-emoji">🦊</text>
            <view class="afu-hero-ring"></view>
          </view>
          <view class="afu-hero-name">药小福</view>
          <view class="afu-hero-subtitle">您的 AI 健康伙伴 · 随时解答用药疑问</view>
          <!-- 招呼气泡 -->
          <view class="afu-greet-bubble">
            <text class="afu-greet-text">{{ greetText }}</text>
          </view>
        </view>

        <!-- 药物感知提示 -->
        <view v-if="drugCount > 0" class="afu-aware-bar">
          <text class="afu-aware-icon">💊</text>
          <text>我已了解您的 <text class="afu-aware-highlight">{{ drugCount }} 种药物</text>，可以直接问我相互作用哦～</text>
        </view>
        <view v-else class="afu-aware-bar afu-aware-empty">
          <text class="afu-aware-icon">📋</text>
          <text>添加药物后，我可以帮您分析药物冲突和注意事项</text>
        </view>

        <!-- 智能体服务卡片（蚂蚁阿福核心设计） -->
        <view class="afu-section-label">智能服务</view>
        <view class="afu-agent-grid">
          <view
            v-for="agent in agentCards"
            :key="agent.id"
            class="afu-agent-card"
            :style="{ background: agent.bg }"
            @click="sendQuick(agent.question)"
          >
            <view class="afu-agent-icon-wrap" :style="{ background: agent.iconBg }">
              <text class="afu-agent-icon">{{ agent.icon }}</text>
            </view>
            <view class="afu-agent-info">
              <text class="afu-agent-title">{{ agent.title }}</text>
              <text class="afu-agent-desc">{{ agent.desc }}</text>
            </view>
            <text class="afu-agent-arrow">→</text>
          </view>
        </view>

        <!-- 快捷提问标签流 -->
        <view class="afu-section-label">试试这样问我</view>
        <view class="afu-tag-flow">
          <view
            v-for="(q, idx) in quickTags"
            :key="idx"
            class="afu-tag"
            @click="sendQuick(q)"
          >
            {{ q }}
          </view>
        </view>

        <!-- 底部安全提示 -->
        <view class="afu-disclaimer">
          <text>⚠️ 药小福的建议仅供参考，紧急情况请拨打 120</text>
        </view>
      </view>

      <!-- ===== 对话态：聊天消息流 ===== -->
      <view v-else class="afu-chat">
        <!-- 上下文感知条 -->
        <view class="afu-chat-context">
          <text>💊 已关联 {{ drugCount }} 种药物</text>
        </view>

        <view
          v-for="(msg, index) in messages"
          :key="index"
          class="afu-msg-row"
          :class="msg.role"
        >
          <!-- AI 头像 -->
          <view v-if="msg.role === 'assistant'" class="afu-msg-avatar">
            <text>🦊</text>
          </view>

          <view class="afu-msg-body">
            <!-- 消息气泡 -->
            <view class="afu-bubble" :class="[msg.role, { error: msg.isError }]">
              <!-- 思考动画 -->
              <view v-if="msg.loading" class="afu-thinking">
                <text class="afu-thinking-text">思考中</text>
                <view class="afu-thinking-dots">
                  <view class="afu-dot"></view>
                  <view class="afu-dot"></view>
                  <view class="afu-dot"></view>
                </view>
              </view>
              <!-- 消息内容 -->
              <text v-else class="afu-bubble-text" selectable>{{ msg.content }}</text>
            </view>

            <!-- 错误重试 -->
            <view v-if="msg.isError" class="afu-retry" @click="retryMessage(index)">
              <text>🔄 点击重试</text>
            </view>

            <!-- AI 消息的快捷追问 -->
            <view
              v-if="msg.role === 'assistant' && !msg.loading && !msg.isError && msg.followUp"
              class="afu-followup"
            >
              <view
                v-for="(fu, fi) in msg.followUp"
                :key="fi"
                class="afu-followup-tag"
                @click="sendQuick(fu)"
              >
                {{ fu }}
              </view>
            </view>
          </view>

          <!-- 用户头像 -->
          <view v-if="msg.role === 'user'" class="afu-msg-avatar user">
            <text>👤</text>
          </view>
        </view>

        <view class="afu-chat-spacer"></view>
        <!-- 底部锚点：自动滚动目标 -->
        <view id="afu-bottom-anchor" style="height: 2rpx;"></view>
      </view>
    </scroll-view>

    <!-- 底部输入区 — 黄金位置留给 AI -->
    <view class="afu-input-bar">
      <view class="afu-input-inner">
        <!-- 语音切换按钮 -->
        <view class="afu-voice-btn" @click="toggleVoiceMode">
          <text>{{ voiceMode ? '⌨️' : '🎤' }}</text>
        </view>
        <!-- 输入框 -->
        <view class="afu-input-wrap">
          <input
            v-if="!voiceMode"
            class="afu-input"
            v-model="inputText"
            :placeholder="isStreaming ? '药小福正在回答...' : '说点什么...'"
            :disabled="isStreaming"
            confirm-type="send"
            @confirm="sendMessage"
          />
          <view v-else class="afu-voice-holder" @click="startVoice">
            <text class="afu-voice-text">按住说话</text>
          </view>
        </view>
        <!-- 发送按钮 -->
        <view
          class="afu-send-btn"
          :class="{ active: inputText.trim() && !isStreaming }"
          @click="sendMessage"
        >
          <text>{{ isStreaming ? '⏳' : '↑' }}</text>
        </view>
      </view>
    </view>

    <view class="afu-watermark">CUFE李禹成团队</view>
  </view>
</template>

<script>
import * as aiService from '@/utils/ai-service.js'
import { QUICK_QUESTIONS } from '@/utils/ai-service.js'
import * as Store from '@/utils/medicine-store.js'
import Storage from '@/utils/storage/index.js'

export default {
  data() {
    return {
      messages: [],
      inputText: '',
      isStreaming: false,
      scrollIntoViewId: '',
      drugCount: 0,
      voiceMode: false,

      // 智能体服务卡片
      agentCards: [
        {
          id: 'interaction',
          icon: '🔍',
          title: '药物冲突检查',
          desc: '检查多种药物能否同服',
          question: '请帮我检查一下我现在吃的这些药，有没有不能一起吃的？',
          bg: 'linear-gradient(135deg, #FFF5F0, #FFEDE3)',
          iconBg: 'rgba(255,111,60,0.15)'
        },
        {
          id: 'reminder',
          icon: '⏰',
          title: '用药提醒建议',
          desc: '智能生成服药提醒文案',
          question: '帮我为我的药物生成个性化的服药提醒文案',
          bg: 'linear-gradient(135deg, #FFF8E1, #FFECB3)',
          iconBg: 'rgba(255,160,0,0.15)'
        },
        {
          id: 'side-effect',
          icon: '⚠️',
          title: '副作用查询',
          desc: '了解药物不良反应',
          question: '我正在吃的这些药分别有什么副作用？出现副作用该怎么办？',
          bg: 'linear-gradient(135deg, #FCE4EC, #F8BBD9)',
          iconBg: 'rgba(233,30,99,0.12)'
        },
        {
          id: 'diet',
          icon: '🥗',
          title: '饮食禁忌',
          desc: '服药期间饮食注意事项',
          question: '吃这些药期间，饮食上有什么禁忌？比如哪些食物不能吃？',
          bg: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
          iconBg: 'rgba(46,125,50,0.12)'
        },
        {
          id: 'knowledge',
          icon: '📖',
          title: '药品说明书',
          desc: '查询药物详细说明',
          question: '请帮我详细解释一下我药单里各种药物的功效、用法和注意事项',
          bg: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
          iconBg: 'rgba(21,101,192,0.12)'
        },
        {
          id: 'health',
          icon: '🩺',
          title: '健康问答',
          desc: '慢性病日常管理建议',
          question: '我有高血压，日常除了按时吃药，还应该注意哪些方面？',
          bg: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
          iconBg: 'rgba(156,39,176,0.12)'
        }
      ],

      // 快捷提问标签
      quickTags: [
        '降压药能和感冒药一起吃吗？',
        '忘记吃药了怎么办？',
        '阿司匹林应该饭前还是饭后吃？',
        '血压多少算正常？',
        '老年人用药注意事项'
      ]
    }
  },

  computed: {
    greetText() {
      const hour = new Date().getHours()
      if (hour < 9) return '早上好～今天也要按时吃药哦 ☀️'
      if (hour < 12) return '上午好！有什么用药问题随时问我～'
      if (hour < 14) return '中午好，别忘了饭后吃药 💊'
      if (hour < 18) return '下午好～需要帮您看看药物的注意事项吗？'
      return '晚上好！睡前记得检查一下明天的药 🌙'
    }
  },

  onShow() {
    this.updateDrugCount()
  },

  methods: {
    goBack() {
      uni.switchTab({ url: '/pages/index/index' })
    },

    updateDrugCount() {
      this.drugCount = Store.getMedicines().length
    },

    // ========== 消息发送 ==========
    async sendMessage() {
      const text = this.inputText.trim()
      if (!text || this.isStreaming) return

      this.messages.push({ role: 'user', content: text })
      this.inputText = ''

      const aiMsg = { role: 'assistant', content: '', loading: true }
      this.messages.push(aiMsg)
      this.isStreaming = true
      this.scrollToBottom()

      const history = this.messages
        .filter(m => !m.loading && !m.isError)
        .map(m => ({ role: m.role, content: m.content }))

      try {
        const result = await aiService.chat(history)
        const idx = this.messages.indexOf(aiMsg)

        if (result.success) {
          this.messages.splice(idx, 1, {
            role: 'assistant',
            content: result.content,
            followUp: this.generateFollowUp(text)
          })
        } else {
          this.messages.splice(idx, 1, {
            role: 'assistant',
            content: result.error || '抱歉，回答出错了，请稍后重试',
            isError: true
          })
        }
      } catch (e) {
        const idx = this.messages.indexOf(aiMsg)
        this.messages.splice(idx, 1, {
          role: 'assistant',
          content: '网络异常，请检查网络后重试',
          isError: true
        })
      } finally {
        this.isStreaming = false
        this.$nextTick(() => this.scrollToBottom())
      }
    },

    /** 快捷发送 */
    sendQuick(question) {
      this.inputText = question
      this.sendMessage()
    },

    /** 根据用户问题生成追问标签 */
    generateFollowUp(userText) {
      if (userText.includes('相互作用') || userText.includes('一起吃')) {
        return ['这些药有什么副作用？', '饮食上需要注意什么？']
      }
      if (userText.includes('副作用')) {
        return ['出现副作用怎么办？', '可以停药吗？']
      }
      if (userText.includes('忘') || userText.includes('漏')) {
        return ['可以一次吃两顿的量吗？', '如何设置提醒？']
      }
      return ['如何减少副作用？', '饮食方面有什么建议？']
    },

    /** 重试消息 */
    retryMessage(aiIndex) {
      const userMsg = this.messages[aiIndex - 1]
      if (!userMsg || userMsg.role !== 'user') return
      this.messages.splice(aiIndex, 1)
      this.inputText = userMsg.content
      this.sendMessage()
    },

    // ========== 语音（预留） ==========
    toggleVoiceMode() {
      this.voiceMode = !this.voiceMode
      if (this.voiceMode) {
        uni.showToast({ title: '语音功能开发中，敬请期待', icon: 'none', duration: 1500 })
        this.voiceMode = false
      }
    },

    startVoice() {
      uni.showToast({ title: '语音功能开发中', icon: 'none' })
    },

    // ========== 对话管理 ==========
    clearChat() {
      uni.showModal({
        title: '开启新对话',
        content: '确定要清空当前对话吗？',
        confirmColor: '#FF6F3C',
        success: (res) => {
          if (res.confirm) {
            this.messages = []
            this.inputText = ''
            this.scrollIntoViewId = ''
            uni.showToast({ title: '已开启新对话', icon: 'success' })
          }
        }
      })
    },

    // ========== 滚动 ==========
    scrollToBottom() {
      // 使用 scroll-into-view，比 scroll-top 更可靠
      // 先清空再设置，确保每次都能触发滚动（即使目标相同）
      this.scrollIntoViewId = ''
      this.$nextTick(() => {
        this.scrollIntoViewId = 'afu-bottom-anchor'
      })
    }
  }
}
</script>

<style scoped>
/* ==========================================
   药小福 — 蚂蚁阿福风格 AI 健康助手
   设计关键词：暖橙色 · 人格化IP · 智能体卡片 · 对话即入口
   核心参考：蚂蚁阿福 —「从管家迈向家人」
   ========================================== */

/* ── 基础容器 ── */
.afu-container {
  height: 100vh;
  background: #FFF9F5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ══════════════════════════════════════
   头部 — 轻量温暖
   ══════════════════════════════════════ */
.afu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  padding-top: calc(24rpx + var(--status-bar-height));
  background: rgba(255, 249, 245, 0.95);
  backdrop-filter: blur(20rpx);
  z-index: 100;
  flex-shrink: 0;
}

.afu-back {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #555;
}

.afu-header-center {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.afu-mascot-small {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFE0D0, #FFC4A8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.afu-header-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
}

.afu-status-dot {
  width: 14rpx;
  height: 14rpx;
  background: #4CAF50;
  border-radius: 50%;
  box-shadow: 0 0 8rpx rgba(76, 175, 80, 0.4);
  animation: afu-pulse 2s ease-in-out infinite;
}

@keyframes afu-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.afu-header-right {
  padding: 8rpx 20rpx;
}

.afu-new-chat {
  font-size: 28rpx;
  color: #FF6F3C;
  font-weight: 600;
}

/* ══════════════════════════════════════
   滚动内容区
   ══════════════════════════════════════ */
.afu-body {
  flex: 1;
  height: 0;
}

/* ══════════════════════════════════════
   首页态 — AI 人格 + 智能体卡片
   ══════════════════════════════════════ */
.afu-home {
  padding: 0 28rpx 40rpx;
}

/* ── 英雄区：IP 形象 ── */
.afu-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0 32rpx;
}

.afu-hero-avatar {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  margin-bottom: 24rpx;
}

.afu-hero-emoji {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFE0D0, #FFC4A8, #FFAB80);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 88rpx;
  box-shadow: 0 12rpx 48rpx rgba(255, 111, 60, 0.25);
  position: relative;
  z-index: 1;
}

.afu-hero-ring {
  position: absolute;
  top: -16rpx;
  left: -16rpx;
  right: -16rpx;
  bottom: -16rpx;
  border-radius: 50%;
  border: 4rpx dashed rgba(255, 111, 60, 0.2);
  animation: afu-ring-spin 20s linear infinite;
}

@keyframes afu-ring-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.afu-hero-name {
  font-size: 48rpx;
  font-weight: 800;
  color: #333;
  margin-bottom: 8rpx;
  background: linear-gradient(135deg, #FF6F3C, #FF8C5A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.afu-hero-subtitle {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 28rpx;
}

/* ── 招呼气泡 ── */
.afu-greet-bubble {
  background: #FFFFFF;
  border-radius: 32rpx;
  border-bottom-left-radius: 8rpx;
  padding: 24rpx 36rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
  position: relative;
  max-width: 80%;
}

.afu-greet-bubble::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 36rpx;
  width: 0;
  height: 0;
  border: 14rpx solid transparent;
  border-bottom-color: #FFFFFF;
  border-left: 0;
  border-right: 14rpx solid transparent;
  transform: translateY(100%);
}

.afu-greet-text {
  font-size: 30rpx;
  color: #555;
  line-height: 1.6;
}

/* ── 药物感知条 ── */
.afu-aware-bar {
  margin: 16rpx 0 28rpx;
  padding: 20rpx 28rpx;
  background: #FFF5F0;
  border-radius: 20rpx;
  font-size: 27rpx;
  color: #8B4513;
  display: flex;
  align-items: center;
  gap: 14rpx;
  border: 2rpx solid rgba(255, 111, 60, 0.1);
}

.afu-aware-empty {
  background: #FFFDE7;
  color: #8D6E00;
  border-color: rgba(255, 160, 0, 0.1);
}

.afu-aware-icon {
  font-size: 34rpx;
  flex-shrink: 0;
}

.afu-aware-highlight {
  color: #FF6F3C;
  font-weight: 700;
}

/* ── 分区标签 ── */
.afu-section-label {
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
  margin: 32rpx 0 20rpx;
  padding-left: 8rpx;
}

/* ── 智能体服务卡片网格 ── */
.afu-agent-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.afu-agent-card {
  border-radius: 28rpx;
  padding: 28rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.afu-agent-card:active {
  transform: scale(0.96);
  opacity: 0.9;
}

.afu-agent-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
}

.afu-agent-info {
  flex: 1;
  min-width: 0;
}

.afu-agent-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 4rpx;
}

.afu-agent-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.afu-agent-arrow {
  font-size: 32rpx;
  color: #CCC;
  flex-shrink: 0;
}

/* ── 快捷标签流 ── */
.afu-tag-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.afu-tag {
  padding: 18rpx 28rpx;
  background: #FFFFFF;
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #555;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
  border: 2rpx solid transparent;
}

.afu-tag:active {
  border-color: #FF6F3C;
  color: #FF6F3C;
  background: #FFF5F0;
  transform: scale(0.96);
}

/* ── 免责声明 ── */
.afu-disclaimer {
  text-align: center;
  margin-top: 48rpx;
  padding: 20rpx;
  font-size: 24rpx;
  color: #CCC;
}

/* ══════════════════════════════════════
   对话态 — 聊天消息
   ══════════════════════════════════════ */
.afu-chat {
  padding: 0 24rpx;
}

.afu-chat-context {
  text-align: center;
  padding: 16rpx 0;
  font-size: 24rpx;
  color: #BBB;
}

/* ── 消息行 ── */
.afu-msg-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 28rpx;
  gap: 16rpx;
}

.afu-msg-row.user {
  flex-direction: row-reverse;
}

/* ── 头像 ── */
.afu-msg-avatar {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFE0D0, #FFC4A8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  flex-shrink: 0;
  box-shadow: 0 4rpx 16rpx rgba(255, 111, 60, 0.15);
}

.afu-msg-avatar.user {
  background: #F5F5F5;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

/* ── 消息体 ── */
.afu-msg-body {
  max-width: 72%;
  display: flex;
  flex-direction: column;
}

/* ── 气泡 ── */
.afu-bubble {
  padding: 24rpx 28rpx;
  border-radius: 24rpx;
  position: relative;
}

.afu-bubble.assistant {
  background: #FFFFFF;
  border-bottom-left-radius: 8rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
}

.afu-bubble.user {
  background: linear-gradient(135deg, #FF6F3C, #FF8C5A);
  border-bottom-right-radius: 8rpx;
  box-shadow: 0 4rpx 20rpx rgba(255, 111, 60, 0.25);
}

.afu-bubble.user .afu-bubble-text {
  color: #FFFFFF;
}

.afu-bubble.error {
  background: #FFF5F5;
  box-shadow: 0 4rpx 20rpx rgba(255, 0, 0, 0.08);
}

.afu-bubble-text {
  font-size: 31rpx;
  line-height: 1.7;
  color: #333;
  word-break: break-word;
  white-space: pre-wrap;
}

/* ── 思考动画 ── */
.afu-thinking {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 8rpx 0;
}

.afu-thinking-text {
  font-size: 28rpx;
  color: #AAA;
}

.afu-thinking-dots {
  display: flex;
  gap: 8rpx;
}

.afu-dot {
  width: 10rpx;
  height: 10rpx;
  background: #FF6F3C;
  border-radius: 50%;
  animation: afu-dot-bounce 1.2s ease-in-out infinite both;
}

.afu-dot:nth-child(1) { animation-delay: 0s; }
.afu-dot:nth-child(2) { animation-delay: 0.15s; }
.afu-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes afu-dot-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-8rpx); opacity: 1; }
}

/* ── 重试按钮 ── */
.afu-retry {
  margin-top: 10rpx;
  padding: 12rpx 20rpx;
  font-size: 26rpx;
  color: #FF6F3C;
  font-weight: 600;
}

/* ── 追问标签 ── */
.afu-followup {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.afu-followup-tag {
  padding: 14rpx 22rpx;
  background: #FFFFFF;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #FF6F3C;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
  border: 2rpx solid rgba(255, 111, 60, 0.15);
  transition: all 0.2s;
}

.afu-followup-tag:active {
  background: #FFF5F0;
  border-color: #FF6F3C;
}

.afu-chat-spacer {
  height: 32rpx;
}

/* ══════════════════════════════════════
   底部输入区 — 黄金位置
   ══════════════════════════════════════ */
.afu-input-bar {
  background: #FFFFFF;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.06);
  z-index: 100;
  flex-shrink: 0;
}

.afu-input-inner {
  display: flex;
  align-items: center;
  gap: 14rpx;
  background: #F8F8F8;
  border-radius: 48rpx;
  padding: 10rpx 14rpx;
  border: 2rpx solid transparent;
  transition: border-color 0.25s;
}

.afu-input-inner:focus-within {
  border-color: rgba(255, 111, 60, 0.3);
  background: #FFFFFF;
}

/* 语音切换按钮 */
.afu-voice-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  flex-shrink: 0;
  transition: background 0.2s;
}

.afu-voice-btn:active {
  background: #F0F0F0;
}

/* 输入框 */
.afu-input-wrap {
  flex: 1;
  min-width: 0;
}

.afu-input {
  width: 100%;
  height: 68rpx;
  font-size: 31rpx;
  color: #333;
  background: transparent;
  border: none;
  outline: none;
}

.afu-input::placeholder {
  color: #C0C0C0;
}

.afu-voice-holder {
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.afu-voice-text {
  font-size: 31rpx;
  color: #C0C0C0;
}

/* 发送按钮 */
.afu-send-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #E8E8E8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 28rpx;
  font-weight: 700;
  color: #FFFFFF;
  transition: all 0.25s ease;
}

.afu-send-btn.active {
  background: linear-gradient(135deg, #FF6F3C, #FF8C5A);
  box-shadow: 0 6rpx 20rpx rgba(255, 111, 60, 0.3);
  transform: scale(1.04);
}

.afu-send-btn:active {
  transform: scale(0.92);
}

.afu-watermark {
  position: fixed; bottom: 24rpx; right: 24rpx;
  font-size: 18rpx; color: rgba(0,0,0,0.06);
  z-index: 10; pointer-events: none; letter-spacing: 2rpx;
}
</style>
