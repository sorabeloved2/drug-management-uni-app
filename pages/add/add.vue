<template>
  <view class="afu-container">
    <!-- ═══════════ 头部 ═══════════ -->
    <view class="afu-header">
      <view class="afu-back" @click="goBack">
        <text>←</text>
      </view>
      <view class="afu-header-center">
        <view class="afu-mascot-small">🦊</view>
        <text class="afu-header-title">{{ isEdit ? '编辑药物' : '添加药物' }}</text>
      </view>
      <view class="afu-header-right" @click="resetForm">
        <text class="afu-reset-btn">{{ isEdit ? '' : '🔄 重置' }}</text>
      </view>
    </view>

    <scroll-view class="afu-body" scroll-y>
      <!-- ═══════════ 欢迎提示 ═══════════ -->
      <view class="afu-hero">
        <view class="afu-hero-icon">💊</view>
        <view class="afu-hero-text">
          {{ isEdit ? '修改药物信息，保持用药记录准确' : '添加您的药物，药小福会按时提醒您服用' }}
        </view>
      </view>

      <!-- ═══════════ 药物感知条 ═══════════ -->
      <view v-if="medicines.length > 0 && !isEdit" class="afu-aware-bar">
        <text class="afu-aware-icon">📋</text>
        <text>您已添加了 <text class="afu-aware-highlight">{{ medicines.length }} 种药物</text>，药小福正在帮您管理</text>
      </view>

      <!-- ═══════════ 扫码卡片 ═══════════ -->
      <view class="afu-scan-card" @click="scanCode">
        <view class="afu-scan-left">
          <view class="afu-scan-icon-wrap">
            <text class="afu-scan-icon">📷</text>
          </view>
          <view class="afu-scan-info">
            <text class="afu-scan-title">扫码添加</text>
            <text class="afu-scan-tip">扫描药品包装条码自动填充</text>
          </view>
        </view>
        <text class="afu-scan-arrow">→</text>
      </view>

      <view class="afu-divider">
        <view class="afu-divider-line"></view>
        <text class="afu-divider-text">或手动填写以下信息</text>
        <view class="afu-divider-line"></view>
      </view>

      <!-- ═══════════ 表单 ═══════════ -->
      <view class="afu-form">

        <!-- 药物名称 -->
        <view class="afu-form-card">
          <view class="afu-form-label">
            <text class="afu-label-icon">💊</text>
            <text class="afu-label-text">药物名称</text>
            <text class="afu-label-required">*</text>
          </view>
          <input
            class="afu-input"
            v-model="form.name"
            placeholder="如：阿莫西林、降压药..."
            placeholder-style="color:#C0C0C0;"
            maxlength="30"
          />
          <view v-if="!isEdit" class="afu-chip-row">
            <text class="afu-chip-label">常用：</text>
            <view
              v-for="name in commonDrugNames"
              :key="name"
              class="afu-chip"
              :class="{ active: form.name === name }"
              @click="form.name = name"
            >
              {{ name }}
            </view>
          </view>
        </view>

        <!-- 规格剂量 -->
        <view class="afu-form-card">
          <view class="afu-form-label">
            <text class="afu-label-icon">📏</text>
            <text class="afu-label-text">规格剂量</text>
            <text class="afu-label-required">*</text>
          </view>
          <input
            class="afu-input"
            v-model="form.dosage"
            placeholder="如：50mg/片，每次1片"
            placeholder-style="color:#C0C0C0;"
            maxlength="30"
          />
          <view v-if="!isEdit" class="afu-chip-row">
            <text class="afu-chip-label">常用：</text>
            <view
              v-for="dose in commonDosages"
              :key="dose"
              class="afu-chip"
              :class="{ active: form.dosage === dose }"
              @click="form.dosage = dose"
            >
              {{ dose }}
            </view>
          </view>
        </view>

        <!-- 服用时间 -->
        <view class="afu-form-card">
          <view class="afu-form-label">
            <text class="afu-label-icon">🕐</text>
            <text class="afu-label-text">服用时间</text>
            <text class="afu-label-required">*</text>
          </view>
          <picker mode="time" :value="form.time" @change="onTimeChange">
            <view class="afu-input afu-picker-input">
              <text class="afu-time-display">{{ form.time }}</text>
              <text class="afu-picker-arrow">▼</text>
            </view>
          </picker>
        </view>

        <!-- 服用时段 -->
        <view class="afu-form-card">
          <view class="afu-form-label">
            <text class="afu-label-icon">⏰</text>
            <text class="afu-label-text">服用时段</text>
          </view>
          <view class="afu-segment">
            <view
              v-for="p in periodSegments"
              :key="p.value"
              class="afu-segment-item"
              :class="{ active: form.period === p.value }"
              @click="form.period = p.value"
            >
              <text class="afu-segment-icon">{{ p.icon }}</text>
              <text class="afu-segment-label">{{ p.label }}</text>
            </view>
          </view>
        </view>

        <!-- 药品图标 -->
        <view class="afu-form-card">
          <view class="afu-form-label">
            <text class="afu-label-icon">🎨</text>
            <text class="afu-label-text">药品图标</text>
          </view>
          <view class="afu-icon-picker">
            <view
              v-for="icon in medicineIcons"
              :key="icon"
              class="afu-icon-option"
              :class="{ active: form.icon === icon }"
              @click="form.icon = icon"
            >
              <text>{{ icon }}</text>
            </view>
          </view>
        </view>

        <!-- 备注 -->
        <view class="afu-form-card">
          <view class="afu-form-label">
            <text class="afu-label-icon">📝</text>
            <text class="afu-label-text">备注说明</text>
          </view>
          <input
            class="afu-input"
            v-model="form.note"
            placeholder="如：饭后服用、空腹服用..."
            placeholder-style="color:#C0C0C0;"
            maxlength="50"
          />
          <view v-if="!isEdit" class="afu-chip-row">
            <view
              v-for="note in commonNotes"
              :key="note"
              class="afu-chip"
              :class="{ active: form.note === note }"
              @click="form.note = note"
            >
              {{ note }}
            </view>
          </view>
        </view>

      </view>

      <!-- ═══════════ 操作按钮 ═══════════ -->
      <view class="afu-actions">
        <button
          class="afu-btn-save"
          :class="{ loading: submitting }"
          :disabled="submitting"
          @click="saveMedicine"
        >
          <text v-if="submitting" class="afu-btn-loading">
            <text class="afu-spinner">⏳</text> 保存中...
          </text>
          <text v-else>{{ isEdit ? '✓ 保存修改' : '🦊 药小福，帮我记住这个药' }}</text>
        </button>
        <button class="afu-btn-cancel" @click="goBack">
          <text>取消</text>
        </button>
      </view>

      <!-- ═══════════ 底部安全提示 ═══════════ -->
      <view class="afu-disclaimer">
        <text>⚠️ 请按医嘱或药品说明书填写，药小福的建议仅供参考</text>
      </view>

      <view class="afu-spacer"></view>
    </scroll-view>

    <view class="afu-watermark">CUFE李禹成团队</view>
  </view>
</template>

<script>
import * as Store from '@/utils/medicine-store.js';

// ── 常量 ──
const EMPTY_FORM = {
  name: '',
  dosage: '',
  time: '08:00',
  period: 'morning',
  note: '饭后服用',
  icon: '💊'
};

const COMMON_DRUG_NAMES = [
  '降压药', '降糖药', '阿司匹林', '维生素', '钙片'
];

const COMMON_DOSAGES = [
  '1片', '2片', '1粒', '1包', '5mL'
];

const COMMON_NOTES = [
  '饭后服用', '饭前服用', '空腹服用', '睡前服用', '随餐服用'
];

const MEDICINE_ICONS = ['💊', '💉', '🧬', '🩹', '🫀', '🫁', '🌿', '🔵'];

const PERIOD_SEGMENTS = [
  { value: 'morning', label: '上午', icon: '🌅' },
  { value: 'afternoon', label: '下午', icon: '☀️' },
  { value: 'evening', label: '晚上', icon: '🌙' }
];

// ★ 模块级锁——用 setTimeout 自动解锁，绝不允许外部重置
let _locked = false;
let _lockTimer = null;

function acquireLock() {
  if (_locked) return false;
  _locked = true;
  if (_lockTimer) clearTimeout(_lockTimer);
  _lockTimer = setTimeout(() => { _locked = false; _lockTimer = null; }, 1500);
  return true;
}
function releaseLock() {
  _locked = false;
  if (_lockTimer) { clearTimeout(_lockTimer); _lockTimer = null; }
}

export default {
  data() {
    return {
      form: { ...EMPTY_FORM },
      isEdit: false,
      editingId: null,
      medicines: [],
      submitting: false,
      commonDrugNames: COMMON_DRUG_NAMES,
      commonDosages: COMMON_DOSAGES,
      commonNotes: COMMON_NOTES,
      medicineIcons: MEDICINE_ICONS,
      periodSegments: PERIOD_SEGMENTS
    };
  },
  onLoad(options) {
    this.medicines = Store.getMedicines();
    if (options && options.id) {
      const med = Store.getMedicineById(options.id);
      if (med) {
        this.isEdit = true;
        this.editingId = options.id;
        this.form = {
          name: med.name || '',
          dosage: med.dosage || '',
          time: med.time || '08:00',
          period: med.period || 'morning',
          note: med.note || '',
          icon: med.icon || '💊'
        };
      }
    } else {
      this.resetForm();
    }
  },
  // ★ H5 Tab 页面切换回来时只触发 onShow
  onShow() {
    // 只清理 UI 状态，不碰模块锁（锁由定时器自动管理）
    if (!this.isEdit && this.submitting) {
      this.submitting = false;
    }
  },
  methods: {
    resetForm() {
      if (this.isEdit) return;
      this.form = { ...EMPTY_FORM };
      this.submitting = false;
      // ★ 绝不碰锁！锁只由 acquireLock() 的超时自动管理
    },
    onTimeChange(e) {
      this.form.time = e.detail.value;
    },
    scanCode() {
      uni.scanCode({
        scanType: ['barCode'],
        onlyFromCamera: true,
        success: res => {
          const barcode = res.result;
          console.log('[药小福] 扫码结果:', barcode);
          this.form.name = barcode;
          this.form.dosage = '';
          uni.showToast({
            title: '已识别条码：' + barcode,
            icon: 'success',
            duration: 2500
          });
        },
        fail: err => {
          console.error('[药小福] 扫码失败:', err);
          uni.showToast({ title: '扫码取消或识别失败', icon: 'none' });
        }
      });
    },
    saveMedicine() {
      // ★ 获取模块锁——1.5s 内自动过期，此间任何重复调用都会被拒绝
      if (!acquireLock()) return;

      // 响应式 UI 锁
      if (this.submitting) return;

      // 表单校验
      if (!this.form.name.trim() || !this.form.dosage.trim()) {
        releaseLock();
        uni.showToast({ title: '请填写药物名称和规格剂量', icon: 'none' });
        return;
      }

      this.submitting = true;

      if (this.isEdit) {
        Store.updateMedicine(this.editingId, this.form);
      } else {
        Store.addMedicine(this.form);
      }

      uni.showToast({
        title: this.isEdit ? '修改成功！' : '添加成功！',
        icon: 'success',
        duration: 1500
      });

      this.goBack();
    },
    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
      } else {
        uni.switchTab({ url: '/pages/index/index' });
      }
    }
  }
};
</script>

<style scoped>
/* ══════════════════════════════════════
   药小福 · 添加药物页面
   设计语言：暖橙品牌 · 卡片式 · 大触控 · 人格化
   ══════════════════════════════════════ */

.afu-container {
  height: 100vh;
  background: #FFF9F5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── 头部 ── */
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

.afu-header-right {
  padding: 8rpx 16rpx;
}

.afu-reset-btn {
  font-size: 26rpx;
  color: #FF6F3C;
  font-weight: 600;
}

/* ── 滚动区 ── */
.afu-body {
  flex: 1;
  height: 0;
}

/* ── 欢迎提示 ── */
.afu-hero {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin: 28rpx 28rpx 0;
  padding: 32rpx 28rpx;
  background: linear-gradient(135deg, #FFF5F0, #FFEDE3);
  border-radius: 28rpx;
  border: 2rpx solid rgba(255, 111, 60, 0.08);
}

.afu-hero-icon {
  font-size: 52rpx;
  flex-shrink: 0;
}

.afu-hero-text {
  font-size: 28rpx;
  color: #8B4513;
  line-height: 1.6;
}

/* ── 药物感知条 ── */
.afu-aware-bar {
  margin: 20rpx 28rpx 0;
  padding: 18rpx 24rpx;
  background: #E8F5E9;
  border-radius: 20rpx;
  font-size: 26rpx;
  color: #2E7D32;
  display: flex;
  align-items: center;
  gap: 12rpx;
  border: 2rpx solid rgba(46, 125, 50, 0.08);
}

.afu-aware-icon {
  font-size: 30rpx;
  flex-shrink: 0;
}

.afu-aware-highlight {
  font-weight: 700;
  color: #1B5E20;
}

/* ── 扫码卡片 ── */
.afu-scan-card {
  margin: 28rpx 28rpx 0;
  padding: 32rpx 28rpx;
  background: #FFFFFF;
  border-radius: 28rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
}

.afu-scan-card:active {
  transform: scale(0.98);
  box-shadow: 0 8rpx 32rpx rgba(255, 111, 60, 0.12);
}

.afu-scan-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.afu-scan-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

.afu-scan-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.afu-scan-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.afu-scan-tip {
  font-size: 26rpx;
  color: #999;
}

.afu-scan-arrow {
  font-size: 36rpx;
  color: #1565C0;
  font-weight: 500;
}

/* ── 分隔线 ── */
.afu-divider {
  display: flex;
  align-items: center;
  padding: 36rpx 28rpx 12rpx;
  gap: 16rpx;
}

.afu-divider-line {
  flex: 1;
  height: 1rpx;
  background: #E0D5CC;
}

.afu-divider-text {
  font-size: 26rpx;
  color: #B0A090;
  white-space: nowrap;
}

/* ── 表单 ── */
.afu-form {
  padding: 0 28rpx;
}

.afu-form-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.25s;
}

.afu-form-card:focus-within {
  box-shadow: 0 4rpx 24rpx rgba(255, 111, 60, 0.10);
}

.afu-form-label {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 16rpx;
}

.afu-label-icon {
  font-size: 30rpx;
}

.afu-label-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
}

.afu-label-required {
  font-size: 30rpx;
  color: #FF6F3C;
  font-weight: 700;
}

.afu-input {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  background: #F8F7F5;
  border: 2rpx solid transparent;
  border-radius: 18rpx;
  font-size: 32rpx;
  color: #1A1A1A;
  box-sizing: border-box;
  transition: all 0.2s;
}

.afu-input:focus {
  border-color: rgba(255, 111, 60, 0.3);
  background: #FFFFFF;
}

.afu-picker-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.afu-time-display {
  font-size: 38rpx;
  font-weight: 600;
  color: #1A1A1A;
}

.afu-picker-arrow {
  font-size: 24rpx;
  color: #CCC;
}

/* ── 快捷标签 ── */
.afu-chip-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.afu-chip-label {
  font-size: 24rpx;
  color: #B0A090;
  flex-shrink: 0;
}

.afu-chip {
  padding: 12rpx 22rpx;
  background: #F5F3F0;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #777;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.afu-chip:active {
  transform: scale(0.95);
}

.afu-chip.active {
  background: #FFF5F0;
  color: #FF6F3C;
  border-color: rgba(255, 111, 60, 0.3);
  font-weight: 600;
}

/* ── 分段选择器 ── */
.afu-segment {
  display: flex;
  gap: 12rpx;
}

.afu-segment-item {
  flex: 1;
  height: 88rpx;
  border-radius: 18rpx;
  background: #F8F7F5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border: 2rpx solid transparent;
  transition: all 0.25s;
}

.afu-segment-item.active {
  background: linear-gradient(135deg, #FFF5F0, #FFEDE3);
  border-color: #FF6F3C;
  box-shadow: 0 4rpx 16rpx rgba(255, 111, 60, 0.15);
}

.afu-segment-icon {
  font-size: 28rpx;
}

.afu-segment-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #777;
}

.afu-segment-item.active .afu-segment-label {
  color: #FF6F3C;
}

/* ── 图标选择器 ── */
.afu-icon-picker {
  display: flex;
  gap: 14rpx;
  flex-wrap: wrap;
}

.afu-icon-option {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: #F8F7F5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.afu-icon-option:active {
  transform: scale(0.92);
}

.afu-icon-option.active {
  background: #FFF5F0;
  border-color: #FF6F3C;
  box-shadow: 0 4rpx 16rpx rgba(255, 111, 60, 0.2);
  transform: scale(1.1);
}

/* ── 操作按钮 ── */
.afu-actions {
  padding: 32rpx 28rpx 0;
}

.afu-btn-save {
  width: 100%;
  height: 104rpx;
  background: linear-gradient(135deg, #FF6F3C, #FF8C5A);
  color: #FFFFFF;
  border: none;
  border-radius: 28rpx;
  font-size: 34rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(255, 111, 60, 0.3);
  transition: all 0.2s;
  letter-spacing: 2rpx;
  gap: 10rpx;
}

.afu-btn-save:active {
  transform: scale(0.97);
  box-shadow: 0 4rpx 16rpx rgba(255, 111, 60, 0.2);
}

.afu-btn-save.loading {
  opacity: 0.75;
  pointer-events: none;
}

.afu-btn-save[disabled] {
  opacity: 0.6;
  pointer-events: none;
}

.afu-spinner {
  display: inline-block;
  animation: afu-spin 1s linear infinite;
}

@keyframes afu-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.afu-btn-cancel {
  width: 100%;
  height: 88rpx;
  background: transparent;
  border: none;
  color: #999;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12rpx;
  transition: all 0.2s;
}

.afu-btn-cancel:active {
  color: #666;
}

/* ── 安全提示 ── */
.afu-disclaimer {
  text-align: center;
  padding: 36rpx 48rpx;
  font-size: 24rpx;
  color: #CCC;
  line-height: 1.6;
}

.afu-spacer {
  height: 60rpx;
}

.afu-watermark {
  position: fixed; bottom: 24rpx; right: 24rpx;
  font-size: 18rpx; color: rgba(0,0,0,0.06);
  z-index: 10; pointer-events: none; letter-spacing: 2rpx;
}
</style>
