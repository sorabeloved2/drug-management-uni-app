<template>
  <view class="afu-container">
    <!-- ═══════════ 开屏免责声明 ═══════════ -->
    <view v-if="showDisclaimer" class="afu-overlay" @click.stop>
      <view class="afu-disclaimer-modal" @click.stop>
        <view class="afu-disclaimer-icon">🦊</view>
        <view class="afu-disclaimer-title">药小福 · 药管家</view>
        <view class="afu-disclaimer-body">
          <view class="afu-disclaimer-text">
            本应用由<text class="afu-highlight">中央财经大学信息管理24</text>
          </view>
          <view class="afu-disclaimer-text">
            <text class="afu-highlight">李禹成团队</text>制作
          </view>
          <view class="afu-disclaimer-divider"></view>
          <view class="afu-disclaimer-text afu-disclaimer-sub">
            供团队学术交流使用
          </view>
          <view class="afu-disclaimer-divider"></view>
          <view class="afu-disclaimer-warning">⚠️ 重要提醒</view>
          <view class="afu-disclaimer-legal">
            本应用提供的所有医学建议<text class="afu-bold">仅供参考</text>，不构成专业医疗诊断。如有健康问题，请及时咨询专业医生。紧急情况请拨打 <text class="afu-emergency">120</text>。
          </view>
        </view>
        <button class="afu-disclaimer-btn" @click="closeDisclaimer">已知晓并同意</button>
        <view class="afu-disclaimer-version">26.06.1 · 学术交流项目</view>
      </view>
    </view>

    <!-- ═══════════ 头部 ═══════════ -->
    <view class="afu-header">
      <view class="afu-header-left">
        <view class="afu-mascot">🦊</view>
        <view>
          <view class="afu-greeting">{{ greetingText }}</view>
          <view class="afu-date">{{ currentDate }}</view>
        </view>
      </view>
      <view class="afu-avatar" @click="goToProfile">
        <text>{{ userInitial }}</text>
      </view>
    </view>

    <!-- ═══════════ 进度卡片 ═══════════ -->
    <view class="afu-progress" :class="{ done: takenCount === medicines.length && medicines.length > 0 }">
      <view class="afu-progress-top">
        <view class="afu-progress-label">
          <text class="afu-progress-icon">{{ takenCount === medicines.length && medicines.length > 0 ? '🎉' : '💊' }}</text>
          <text class="afu-progress-title">今日服药</text>
        </view>
        <text class="afu-progress-count">{{ progressText }}</text>
      </view>
      <view class="afu-progress-bar">
        <view class="afu-progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
      <view class="afu-progress-tip">{{ progressDetail }}</view>
    </view>

    <!-- ═══════════ 药小福 AI 助手 ═══════════ -->
    <view class="afu-ai-card" @click="goToAI">
      <view class="afu-ai-avatar">🦊</view>
      <view class="afu-ai-info">
        <text class="afu-ai-title">药小福 · AI 健康伙伴</text>
        <text class="afu-ai-desc">药物咨询 · 相互作用分析 · 用药提醒</text>
      </view>
      <text class="afu-ai-arrow">→</text>
    </view>

    <!-- ═══════════ 药物列表 ═══════════ -->
    <view v-if="medicines.length > 0" class="afu-drugs">
      <template v-for="(group, period) in groupedMedicines">
        <view v-if="group.length > 0" :key="period" class="afu-period">
          <view class="afu-period-head">
            <text class="afu-period-icon">{{ periodIcons[period] }}</text>
            <text class="afu-period-name">{{ periodName(period) }}</text>
            <view class="afu-period-badge" :class="getGroupStatus(group)">
              {{ getGroupStatus(group) === 'completed' ? '✓' : '🕐' }}
              {{ getTakenCount(group) }}/{{ group.length }}
            </view>
          </view>

          <view
            v-for="med in group"
            :key="med.id"
            class="afu-drug-card"
            :class="{
              'is-due': !isTaken(med.id) && !isOverdue(med.id, med.period) && !isFuture(med.period),
              'is-overdue': isOverdue(med.id, med.period),
              'is-done': isTaken(med.id),
              'is-future': isFuture(med.period) && !isTaken(med.id)
            }"
          >
            <view class="afu-drug-icon" :style="{ background: iconBg(med) }">{{ med.icon }}</view>
            <view class="afu-drug-info">
              <view class="afu-drug-name">
                {{ med.name }}
                <text v-if="isOverdue(med.id, med.period)" class="afu-tag tag-red">⚠️ 已过期</text>
                <text v-else-if="isTaken(med.id)" class="afu-tag tag-green">✓ 已服用</text>
                <text v-else-if="isFuture(med.period)" class="afu-tag tag-gray">🔜 {{ med.time }}</text>
              </view>
              <view class="afu-drug-meta">{{ med.dosage }} · {{ med.note }}</view>
            </view>
            <view class="afu-drug-actions">
              <view v-if="isTaken(med.id)" class="afu-done-btn">✓</view>
              <button v-else-if="isFuture(med.period)" class="afu-take-btn future" @click="showModal(med)">提前服用</button>
              <button v-else class="afu-take-btn" @click="showModal(med)">💊 服用</button>
              <button class="afu-del-btn" @click.stop="deleteDrug(med)">🗑️</button>
            </view>
          </view>
        </view>
      </template>
    </view>

    <!-- ═══════════ 空状态 ═══════════ -->
    <view v-else class="afu-empty">
      <view class="afu-empty-icon">💊</view>
      <view class="afu-empty-title">还没有添加药物</view>
      <view class="afu-empty-desc">添加您的第一种药物，药小福会按时提醒您</view>
      <button class="afu-empty-btn" @click="goToAdd">+ 添加药物</button>
    </view>

    <!-- ═══════════ 服药弹窗 ═══════════ -->
    <view v-if="showModalFlag" class="afu-modal-overlay" @click="closeModal">
      <view class="afu-modal" @click.stop>
        <view class="afu-modal-icon">🔔</view>
        <view class="afu-modal-title">确认服药</view>
        <view class="afu-modal-med">
          <view class="afu-modal-med-name">{{ selectedMedicine?.name }}</view>
          <view class="afu-modal-med-detail">{{ selectedMedicine?.dosage }} · {{ selectedMedicine?.note }}</view>
        </view>
        <button class="afu-modal-btn primary" @click="confirmTaken">✓ 我已服用</button>
        <button class="afu-modal-btn" @click="closeModal">⏰ 稍后提醒</button>
      </view>
    </view>

    <!-- ═══════════ Toast ═══════════ -->
    <view v-if="showToast" class="afu-toast">
      <text>✓ 已记录</text>
      <text class="afu-toast-undo" @click="undoAction">撤销</text>
    </view>

    <!-- 水印 -->
    <view class="afu-watermark">CUFE李禹成团队</view>
  </view>
</template>

<script>
import * as Store from '@/utils/medicine-store.js';
import Storage from '@/utils/storage/index.js';

export default {
  data() {
    return {
      medicines: [],
      records: {},
      currentDate: '',
      showDisclaimer: true,
      showModalFlag: false,
      selectedMedicine: null,
      showToast: false,
      lastAction: null,
      userInfo: { name: '王淑芬' },
      periodIcons: { morning: '🌅', afternoon: '☀️', evening: '🌙' }
    };
  },
  computed: {
    greetingText() {
      const h = new Date().getHours();
      if (h < 9) return '早上好';
      if (h < 12) return '上午好';
      if (h < 14) return '中午好';
      if (h < 18) return '下午好';
      return '晚上好';
    },
    userInitial() {
      return (this.userInfo.name || '王')[0];
    },
    groupedMedicines() {
      return Store.groupByPeriod(this.medicines);
    },
    todayKey() {
      return Store.getDateKey(new Date());
    },
    todayRecords() {
      return this.records[this.todayKey] || {};
    },
    takenCount() {
      const medIds = new Set(this.medicines.map(m => m.id));
      return Object.keys(this.todayRecords).filter(id => medIds.has(id)).length;
    },
    progressText() {
      return `${this.takenCount}/${this.medicines.length}`;
    },
    progressDetail() {
      if (this.medicines.length === 0) return '还没有添加药物';
      if (this.takenCount === 0) return '记得按时吃药哦 💪';
      if (this.takenCount === this.medicines.length) return '今日服药全部完成，太棒了！🎉';
      return `还有 ${this.medicines.length - this.takenCount} 种药物待服用`;
    },
    progressPercent() {
      return this.medicines.length > 0 ? (this.takenCount / this.medicines.length) * 100 : 0;
    }
  },
  onShow() {
    this.loadData();
    this.loadUser();
    this.updateDate();
  },
  methods: {
    closeDisclaimer() { this.showDisclaimer = false; },
    loadData() {
      this.medicines = Store.getMedicines();
      this.records = Store.getRecords();
    },
    loadUser() {
      const saved = Storage.get('userInfo');
      if (saved) this.userInfo = { ...this.userInfo, ...saved };
    },
    updateDate() {
      const now = new Date();
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      this.currentDate = `${now.getMonth() + 1}月${now.getDate()}日 ${days[now.getDay()]}`;
    },
    periodName(p) { return Store.PERIOD_NAMES[p] || p; },
    isTaken(id) { return !!this.todayRecords[id]; },
    isOverdue(id, period) { return Store.isOverdue(id, this.todayKey, period); },
    isFuture(period) {
      const order = ['morning', 'afternoon', 'evening'];
      return order.indexOf(period) > order.indexOf(Store.getCurrentPeriod());
    },
    getTakenCount(g) { return g.filter(m => this.isTaken(m.id)).length; },
    getGroupStatus(g) { return this.getTakenCount(g) === g.length ? 'completed' : 'pending'; },
    iconBg(med) {
      if (this.isTaken(med.id)) return '#E8F5E9';
      if (this.isOverdue(med.id, med.period)) return '#FFEBEE';
      if (med.period === 'morning') return '#E3F2FD';
      if (med.period === 'afternoon') return '#FFF3E0';
      return '#F3E5F5';
    },
    showModal(med) { this.selectedMedicine = med; this.showModalFlag = true; },
    closeModal() { this.showModalFlag = false; this.selectedMedicine = null; },
    confirmTaken() {
      if (!this.selectedMedicine) return;
      const result = Store.markTaken(this.selectedMedicine.id);
      this.records = Store.getRecords();
      this.lastAction = { medicineId: result.medicineId, date: result.dateKey };
      this.showToast = true;
      setTimeout(() => { this.showToast = false; }, 3000);
      this.closeModal();
    },
    undoAction() {
      if (!this.lastAction) return;
      Store.undoTaken(this.lastAction.medicineId, this.lastAction.date);
      this.records = Store.getRecords();
      this.showToast = false;
      this.lastAction = null;
    },
    deleteDrug(med) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除"${med.name}"吗？`,
        confirmColor: '#C62828',
        success: res => {
          if (res.confirm) {
            this.medicines = Store.deleteMedicine(med.id);
            this.records = Store.getRecords();
            uni.showToast({ title: '已删除', icon: 'success' });
          }
        }
      });
    },
    goToProfile() { uni.switchTab({ url: '/pages/profile/profile' }); },
    goToAdd() { uni.switchTab({ url: '/pages/add/add' }); },
    goToAI() { uni.switchTab({ url: '/pages/ai/ai' }); }
  }
};
</script>

<style scoped>
/* ══════════════════════════════════════
   药小福 · 首页
   ══════════════════════════════════════ */
.afu-container {
  min-height: 100vh;
  background: #FFF9F5;
  padding-bottom: 160rpx;
}

/* ── 头部 ── */
.afu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 28rpx;
  padding-top: calc(32rpx + var(--status-bar-height));
  background: rgba(255,249,245,0.95);
  backdrop-filter: blur(20rpx);
}
.afu-header-left { display: flex; align-items: center; gap: 16rpx; }
.afu-mascot {
  width: 80rpx; height: 80rpx; border-radius: 50%;
  background: linear-gradient(135deg, #FFE0D0, #FFC4A8);
  display: flex; align-items: center; justify-content: center;
  font-size: 44rpx;
}
.afu-greeting { font-size: 32rpx; font-weight: 700; color: #333; }
.afu-date { font-size: 26rpx; color: #999; margin-top: 2rpx; }
.afu-avatar {
  width: 80rpx; height: 80rpx; border-radius: 50%;
  background: linear-gradient(135deg, #43A047, #1B5E20);
  display: flex; align-items: center; justify-content: center;
  color: #FFF; font-size: 36rpx; font-weight: 700;
  box-shadow: 0 4rpx 16rpx rgba(46,125,50,0.25);
}

/* ── 进度卡片 ── */
.afu-progress {
  margin: 24rpx 28rpx; padding: 36rpx 32rpx;
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
  border-radius: 28rpx;
  box-shadow: 0 4rpx 24rpx rgba(46,125,50,0.10);
}
.afu-progress.done {
  background: linear-gradient(135deg, #C8E6C9, #A5D6A7);
}
.afu-progress-top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20rpx;
}
.afu-progress-label { display: flex; align-items: center; gap: 10rpx; }
.afu-progress-icon { font-size: 36rpx; }
.afu-progress-title { font-size: 34rpx; font-weight: 700; color: #1A1A1A; }
.afu-progress-count { font-size: 40rpx; font-weight: 800; color: #2E7D32; }
.afu-progress-bar {
  height: 16rpx; background: rgba(255,255,255,0.7);
  border-radius: 8rpx; overflow: hidden;
}
.afu-progress-fill {
  height: 100%; background: #2E7D32; border-radius: 8rpx;
  transition: width 0.4s ease;
}
.afu-progress-tip { font-size: 26rpx; color: #555; margin-top: 16rpx; }

/* ── AI 入口 ── */
.afu-ai-card {
  margin: 0 28rpx 20rpx; padding: 24rpx;
  background: linear-gradient(135deg, #FFF5F0, #FFEDE3);
  border-radius: 24rpx; display: flex; align-items: center; gap: 18rpx;
  border: 2rpx solid rgba(255,111,60,0.10);
  transition: all 0.2s;
}
.afu-ai-card:active { transform: scale(0.98); }
.afu-ai-avatar {
  width: 80rpx; height: 80rpx; border-radius: 20rpx;
  background: linear-gradient(135deg, #FFE0D0, #FFC4A8);
  display: flex; align-items: center; justify-content: center;
  font-size: 40rpx; flex-shrink: 0;
}
.afu-ai-info { flex: 1; min-width: 0; }
.afu-ai-title { font-size: 32rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 2rpx; }
.afu-ai-desc { font-size: 24rpx; color: #888; }
.afu-ai-arrow { font-size: 32rpx; color: #FF6F3C; font-weight: 500; }

/* ── 药物列表 ── */
.afu-drugs { padding: 0 28rpx; }
.afu-period { margin-bottom: 32rpx; }
.afu-period-head {
  display: flex; align-items: center; gap: 10rpx;
  margin-bottom: 20rpx;
}
.afu-period-icon { font-size: 32rpx; }
.afu-period-name { font-size: 32rpx; font-weight: 700; color: #333; flex: 1; }
.afu-period-badge {
  padding: 6rpx 18rpx; border-radius: 14rpx;
  font-size: 24rpx; font-weight: 600;
}
.afu-period-badge.completed { background: #E8F5E9; color: #2E7D32; }
.afu-period-badge.pending { background: #FFF3E0; color: #E65100; }

.afu-drug-card {
  background: #FFF; border-radius: 24rpx; padding: 28rpx 24rpx;
  margin-bottom: 16rpx; display: flex; align-items: center;
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
  position: relative; overflow: hidden;
}
.afu-drug-card.is-due { box-shadow: 0 4rpx 20rpx rgba(230,81,0,0.12); }
.afu-drug-card.is-overdue { opacity: 0.8; }
.afu-drug-card.is-done { box-shadow: 0 2rpx 16rpx rgba(46,125,50,0.08); }
.afu-drug-card.is-future { opacity: 0.7; }
.afu-drug-card::before {
  content: ''; position: absolute; left: 0; top: 22rpx; bottom: 22rpx;
  width: 6rpx; border-radius: 0 4rpx 4rpx 0;
}
.afu-drug-card.is-due::before { background: #E65100; }
.afu-drug-card.is-overdue::before { background: #C62828; }
.afu-drug-card.is-done::before { background: #2E7D32; }
.afu-drug-card.is-future::before { background: #90A4AE; }

.afu-drug-icon {
  width: 96rpx; height: 96rpx; border-radius: 22rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 46rpx; margin-right: 22rpx; flex-shrink: 0;
}
.afu-drug-info { flex: 1; min-width: 0; }
.afu-drug-name {
  font-size: 34rpx; font-weight: 700; color: #1A1A1A;
  display: flex; align-items: center; gap: 10rpx; flex-wrap: wrap;
}
.afu-drug-meta { font-size: 26rpx; color: #888; margin-top: 6rpx; }

.afu-tag {
  padding: 4rpx 14rpx; border-radius: 10rpx;
  font-size: 22rpx; font-weight: 600; line-height: 1.6;
}
.afu-tag.tag-red { background: #FFEBEE; color: #C62828; }
.afu-tag.tag-green { background: #E8F5E9; color: #2E7D32; }
.afu-tag.tag-gray { background: #F5F5F5; color: #78909C; }

.afu-drug-actions { display: flex; align-items: center; gap: 12rpx; flex-shrink: 0; }
.afu-done-btn {
  width: 72rpx; height: 72rpx; border-radius: 50%; background: #2E7D32;
  display: flex; align-items: center; justify-content: center;
  color: #FFF; font-size: 36rpx; font-weight: 700;
}
.afu-take-btn {
  padding: 0 28rpx; height: 72rpx; background: #E65100; color: #FFF;
  border: none; border-radius: 20rpx; font-size: 28rpx; font-weight: 700;
  box-shadow: 0 4rpx 14rpx rgba(230,81,0,0.2);
}
.afu-take-btn:active { transform: scale(0.95); }
.afu-take-btn.future { background: #78909C; box-shadow: 0 4rpx 14rpx rgba(120,144,156,0.2); }
.afu-del-btn {
  width: 64rpx; height: 64rpx; border-radius: 50%; border: none;
  background: #F5F5F5; font-size: 28rpx; display: flex;
  align-items: center; justify-content: center;
}
.afu-del-btn:active { background: #FFEBEE; }

/* ── 空状态 ── */
.afu-empty { text-align: center; padding: 120rpx 48rpx; }
.afu-empty-icon {
  width: 180rpx; height: 180rpx; border-radius: 50%;
  background: linear-gradient(135deg, #FFF5F0, #FFEDE3);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 36rpx; font-size: 88rpx;
}
.afu-empty-title { font-size: 38rpx; font-weight: 700; color: #333; margin-bottom: 12rpx; }
.afu-empty-desc { font-size: 30rpx; color: #999; margin-bottom: 44rpx; }
.afu-empty-btn {
  padding: 0 56rpx; height: 96rpx;
  background: linear-gradient(135deg, #FF6F3C, #FF8C5A); color: #FFF;
  border: none; border-radius: 28rpx; font-size: 34rpx; font-weight: 700;
  box-shadow: 0 8rpx 28rpx rgba(255,111,60,0.3);
  display: inline-flex; align-items: center; gap: 10rpx;
}
.afu-empty-btn:active { transform: scale(0.96); }

/* ── 弹窗 ── */
.afu-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  z-index: 200; display: flex; align-items: center; justify-content: center;
  padding: 48rpx; backdrop-filter: blur(4rpx);
}
.afu-modal {
  background: #FFF; border-radius: 36rpx; padding: 52rpx 40rpx;
  width: 100%; max-width: 640rpx; text-align: center;
  box-shadow: 0 24rpx 64rpx rgba(0,0,0,0.15);
}
.afu-modal-icon {
  width: 120rpx; height: 120rpx; border-radius: 50%;
  background: #FFF3E0; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 28rpx; font-size: 60rpx;
}
.afu-modal-title { font-size: 38rpx; font-weight: 700; color: #333; margin-bottom: 8rpx; }
.afu-modal-med {
  background: #FFF8E1; border-radius: 22rpx; padding: 28rpx; margin: 28rpx 0;
}
.afu-modal-med-name { font-size: 36rpx; font-weight: 700; color: #1A1A1A; }
.afu-modal-med-detail { font-size: 28rpx; color: #888; margin-top: 6rpx; }
.afu-modal-btn {
  width: 100%; height: 88rpx; border: none; border-radius: 22rpx;
  font-size: 32rpx; font-weight: 600; margin-bottom: 16rpx;
  background: #F5F5F5; color: #666;
}
.afu-modal-btn.primary {
  background: #2E7D32; color: #FFF;
  box-shadow: 0 6rpx 20rpx rgba(46,125,50,0.2);
}
.afu-modal-btn:active { transform: scale(0.97); }

/* ── Toast ── */
.afu-toast {
  position: fixed; top: 160rpx; left: 50%; transform: translateX(-50%);
  background: #333; color: #FFF; padding: 24rpx 36rpx; border-radius: 20rpx;
  display: flex; align-items: center; gap: 28rpx; z-index: 150;
  font-size: 28rpx; box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.2);
}
.afu-toast-undo { color: #FF9800; font-weight: 700; text-decoration: underline; }

/* ── 免责声明（与 App.vue 一致） ── */
.afu-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  z-index: 9999; display: flex; align-items: center; justify-content: center;
  padding: 64rpx 48rpx; backdrop-filter: blur(8rpx);
}
.afu-disclaimer-modal {
  background: #FFF; border-radius: 36rpx; padding: 56rpx 40rpx 44rpx;
  width: 100%; max-width: 640rpx; text-align: center;
  box-shadow: 0 32rpx 64rpx rgba(0,0,0,0.25);
  animation: afu-modal-in 0.35s ease-out;
}
@keyframes afu-modal-in {
  from { opacity: 0; transform: translateY(40rpx) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.afu-disclaimer-icon {
  width: 120rpx; height: 120rpx; border-radius: 50%;
  background: linear-gradient(135deg, #FFE0D0, #FFC4A8);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 28rpx; font-size: 64rpx;
}
.afu-disclaimer-title {
  font-size: 40rpx; font-weight: 800; color: #333; margin-bottom: 32rpx;
  background: linear-gradient(135deg, #FF6F3C, #FF8C5A);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.afu-disclaimer-body { text-align: center; margin-bottom: 36rpx; }
.afu-disclaimer-text { font-size: 29rpx; color: #666; line-height: 1.8; }
.afu-highlight { color: #FF6F3C; font-weight: 700; }
.afu-disclaimer-divider { width: 80rpx; height: 2rpx; background: #EEE; margin: 20rpx auto; }
.afu-disclaimer-sub { color: #999; font-size: 27rpx; }
.afu-disclaimer-warning { font-size: 30rpx; font-weight: 700; color: #E65100; margin-bottom: 12rpx; }
.afu-disclaimer-legal { font-size: 26rpx; color: #999; line-height: 1.7; text-align: left; }
.afu-bold { color: #E65100; font-weight: 600; }
.afu-emergency { color: #C62828; font-weight: 800; font-size: 30rpx; }
.afu-disclaimer-btn {
  width: 100%; height: 96rpx;
  background: linear-gradient(135deg, #FF6F3C, #FF8C5A); color: #FFF;
  border: none; border-radius: 24rpx; font-size: 34rpx; font-weight: 700;
  box-shadow: 0 8rpx 28rpx rgba(255,111,60,0.3);
  letter-spacing: 2rpx;
}
.afu-disclaimer-btn:active { transform: scale(0.97); }
.afu-disclaimer-version { margin-top: 24rpx; font-size: 24rpx; color: #CCC; }

/* ── 水印 ── */
.afu-watermark {
  position: fixed; bottom: 24rpx; right: 24rpx;
  font-size: 18rpx; color: rgba(0,0,0,0.06);
  z-index: 10; pointer-events: none;
  letter-spacing: 2rpx;
}
</style>
