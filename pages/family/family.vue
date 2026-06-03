<template>
  <view class="afu-container">
    <!-- ═══════════ 头部 ═══════════ -->
    <view class="afu-header">
      <view class="afu-back" @click="goBack"><text>←</text></view>
      <view class="afu-header-center">
        <view class="afu-mascot">🦊</view>
        <text class="afu-title">家属联动</text>
      </view>
      <view style="width:80rpx;"></view>
    </view>

    <!-- ═══════════ 今日状态 ═══════════ -->
    <view class="afu-status" :class="{ ok: todayDone >= totalMeds && totalMeds > 0 }">
      <view class="afu-status-icon">{{ todayDone >= totalMeds && totalMeds > 0 ? '🎉' : '💊' }}</view>
      <view class="afu-status-info">
        <text class="afu-status-title">{{ statusTitle }}</text>
        <text class="afu-status-detail">已完成 {{ todayDone }}/{{ totalMeds }} 次服药</text>
      </view>
    </view>

    <!-- ═══════════ 已绑定家属 ═══════════ -->
    <view class="afu-section-label">已绑定的家属</view>
    <view class="afu-family-list">
      <view v-for="(member, index) in familyMembers" :key="index" class="afu-family-card">
        <view class="afu-family-avatar">
          <text>{{ member.name[0] }}</text>
        </view>
        <view class="afu-family-info">
          <text class="afu-family-name">{{ member.name }}</text>
          <text class="afu-family-meta">{{ member.relation }} · {{ member.phone || '未留电话' }}</text>
        </view>
        <button class="afu-unbind-btn" @click="unbindFamily(index)">解除</button>
      </view>

      <!-- ═══════════ 添加家属表单 ═══════════ -->
      <view v-if="showAddForm" class="afu-add-form">
        <view class="afu-add-form-title">添加家属</view>

        <view class="afu-form-item">
          <text class="afu-form-label">👤 姓名</text>
          <input
            class="afu-form-input"
            v-model="newMember.name"
            placeholder="请输入家属姓名"
            placeholder-style="color:#C0C0C0;"
            maxlength="20"
          />
        </view>

        <view class="afu-form-item">
          <text class="afu-form-label">💝 关系</text>
          <view class="afu-chip-row">
            <view
              v-for="rel in relationOptions"
              :key="rel"
              class="afu-chip"
              :class="{ active: newMember.relation === rel }"
              @click="newMember.relation = rel"
            >
              {{ rel }}
            </view>
          </view>
        </view>

        <view class="afu-form-item">
          <text class="afu-form-label">📱 电话（选填）</text>
          <input
            class="afu-form-input"
            v-model="newMember.phone"
            type="number"
            placeholder="方便紧急联系"
            placeholder-style="color:#C0C0C0;"
            maxlength="11"
          />
        </view>

        <view class="afu-form-actions">
          <button class="afu-btn-cancel" @click="cancelAdd">取消</button>
          <button class="afu-btn-confirm" @click="confirmAdd">✓ 确认添加</button>
        </view>
      </view>

      <!-- ═══════════ 添加入口 ═══════════ -->
      <view v-else class="afu-add-card" @click="showAddForm = true">
        <view class="afu-add-icon">+</view>
        <text class="afu-add-text">添加家属</text>
      </view>
    </view>

    <!-- ═══════════ 同步设置 ═══════════ -->
    <view class="afu-section-label">同步设置</view>
    <view class="afu-settings">
      <view class="afu-setting-card">
        <view class="afu-setting-left">
          <text class="afu-setting-icon">🔔</text>
          <view>
            <text class="afu-setting-label">服药完成通知</text>
            <text class="afu-setting-desc">家人服药后通知我</text>
          </view>
        </view>
        <switch checked color="#FF6F3C" />
      </view>
      <view class="afu-setting-card">
        <view class="afu-setting-left">
          <text class="afu-setting-icon">⚠️</text>
          <view>
            <text class="afu-setting-label">漏服提醒</text>
            <text class="afu-setting-desc">漏服时立即通知</text>
          </view>
        </view>
        <switch checked color="#FF6F3C" />
      </view>
      <view class="afu-setting-card">
        <view class="afu-setting-left">
          <text class="afu-setting-icon">📋</text>
          <view>
            <text class="afu-setting-label">每日汇总</text>
            <text class="afu-setting-desc">每晚发送服药汇总</text>
          </view>
        </view>
        <switch color="#FF6F3C" />
      </view>
    </view>

    <!-- ═══════════ 底部提示 ═══════════ -->
    <view class="afu-tip">
      <text>💡 药小福可以帮助您同时管理多位家人的用药情况</text>
    </view>

    <view class="afu-watermark">CUFE李禹成团队</view>
  </view>
</template>

<script>
import * as Store from '@/utils/medicine-store.js';

export default {
  data() {
    return {
      familyMembers: [
        { name: '李雪梅', relation: '女儿', phone: '138****6789' }
      ],
      medicines: [],
      records: {},
      showAddForm: false,
      newMember: { name: '', relation: '', phone: '' },
      relationOptions: ['女儿', '儿子', '配偶', '父亲', '母亲', '其他']
    };
  },
  computed: {
    todayDone() { return Store.getTodayStats().taken; },
    totalMeds() { return this.medicines.length; },
    statusTitle() {
      if (this.totalMeds === 0) return '暂无药物数据';
      if (this.todayDone >= this.totalMeds) return '今日服药全部完成';
      return '今日服药进行中';
    }
  },
  onShow() {
    this.medicines = Store.getMedicines();
    this.records = Store.getRecords();
  },
  methods: {
    confirmAdd() {
      const name = this.newMember.name.trim();
      const relation = this.newMember.relation.trim();
      if (!name) {
        uni.showToast({ title: '请输入家属姓名', icon: 'none' });
        return;
      }
      if (!relation) {
        uni.showToast({ title: '请选择关系', icon: 'none' });
        return;
      }
      this.familyMembers.push({
        name,
        relation,
        phone: this.newMember.phone.trim() || '',
        time: '刚刚绑定'
      });
      this.newMember = { name: '', relation: '', phone: '' };
      this.showAddForm = false;
      uni.showToast({ title: '已添加 ' + name, icon: 'success' });
    },
    cancelAdd() {
      this.showAddForm = false;
      this.newMember = { name: '', relation: '', phone: '' };
    },
    unbindFamily(index) {
      const member = this.familyMembers[index];
      uni.showModal({
        title: '确认解除',
        content: '确定要解除与 ' + member.name + ' 的绑定吗？',
        confirmColor: '#C62828',
        success: res => {
          if (res.confirm) {
            this.familyMembers.splice(index, 1);
            uni.showToast({ title: '已解除绑定', icon: 'success' });
          }
        }
      });
    },
    goBack() { uni.navigateBack(); }
  }
};
</script>

<style scoped>
/* ══════════════════════════════════════
   药小福 · 家属联动
   ══════════════════════════════════════ */
.afu-container {
  min-height: 100vh;
  background: #FFF9F5;
  padding-bottom: 60rpx;
}

/* ── 头部 ── */
.afu-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24rpx 28rpx;
  padding-top: calc(24rpx + var(--status-bar-height));
  background: rgba(255,249,245,0.95);
  backdrop-filter: blur(20rpx);
}
.afu-back {
  width: 80rpx; height: 80rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx; color: #555;
}
.afu-header-center { display: flex; align-items: center; gap: 12rpx; }
.afu-mascot {
  width: 52rpx; height: 52rpx; border-radius: 50%;
  background: linear-gradient(135deg, #FFE0D0, #FFC4A8);
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx;
}
.afu-title { font-size: 36rpx; font-weight: 700; color: #333; }

/* ── 今日状态 ── */
.afu-status {
  margin: 24rpx 28rpx; padding: 28rpx 32rpx;
  background: #FFF3E0; border-radius: 24rpx;
  display: flex; align-items: center; gap: 20rpx;
  border: 2rpx solid rgba(255,111,60,0.08);
}
.afu-status.ok { background: #E8F5E9; border-color: rgba(46,125,50,0.08); }
.afu-status-icon { font-size: 52rpx; flex-shrink: 0; }
.afu-status-info { flex: 1; min-width: 0; }
.afu-status-title { display: block; font-size: 30rpx; font-weight: 700; color: #E65100; }
.afu-status.ok .afu-status-title { color: #2E7D32; }
.afu-status-detail { font-size: 26rpx; color: #888; margin-top: 4rpx; display: block; }

/* ── 分区标签 ── */
.afu-section-label {
  font-size: 28rpx; font-weight: 600; color: #AAA;
  margin: 28rpx 32rpx 16rpx;
  letter-spacing: 4rpx;
}

/* ── 家属列表 ── */
.afu-family-list { padding: 0 28rpx; }

.afu-family-card {
  background: #FFF; border-radius: 24rpx; padding: 28rpx 24rpx;
  margin-bottom: 16rpx; display: flex; align-items: center;
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
}
.afu-family-avatar {
  width: 96rpx; height: 96rpx; border-radius: 50%;
  background: linear-gradient(135deg, #43A047, #1B5E20);
  display: flex; align-items: center; justify-content: center;
  color: #FFF; font-size: 40rpx; font-weight: 700;
  margin-right: 24rpx; flex-shrink: 0;
  box-shadow: 0 4rpx 16rpx rgba(46,125,50,0.2);
}
.afu-family-info { flex: 1; min-width: 0; }
.afu-family-name { display: block; font-size: 34rpx; font-weight: 700; color: #333; }
.afu-family-meta { font-size: 26rpx; color: #999; margin-top: 4rpx; display: block; }
.afu-unbind-btn {
  background: none; border: none; color: #C62828;
  font-size: 26rpx; padding: 12rpx 20rpx;
  min-height: 72rpx; display: flex; align-items: center;
}
.afu-unbind-btn:active { opacity: 0.7; }

/* ── 添加入口卡片 ── */
.afu-add-card {
  background: #FFF; border: 3rpx dashed #DDD; border-radius: 24rpx;
  padding: 32rpx; display: flex; align-items: center; justify-content: center;
  gap: 14rpx; color: #AAA; font-size: 30rpx;
  transition: all 0.2s;
}
.afu-add-card:active {
  background: #FFF9F5; border-color: #FF6F3C; color: #FF6F3C;
}
.afu-add-icon {
  width: 52rpx; height: 52rpx; border-radius: 50%;
  background: #F5F5F5; display: flex; align-items: center;
  justify-content: center; font-size: 32rpx; font-weight: 300;
  transition: all 0.2s;
}
.afu-add-card:active .afu-add-icon {
  background: #FFF5F0; color: #FF6F3C;
}

/* ── 添加表单 ── */
.afu-add-form {
  background: #FFF; border-radius: 24rpx; padding: 32rpx 28rpx;
  margin-bottom: 16rpx; box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.06);
}
.afu-add-form-title {
  font-size: 34rpx; font-weight: 700; color: #333;
  margin-bottom: 28rpx; text-align: center;
}

.afu-form-item { margin-bottom: 24rpx; }
.afu-form-label {
  display: block; font-size: 28rpx; font-weight: 600;
  color: #555; margin-bottom: 12rpx;
}
.afu-form-input {
  width: 100%; height: 88rpx; padding: 0 24rpx;
  background: #F8F7F5; border: 2rpx solid transparent;
  border-radius: 18rpx; font-size: 32rpx; color: #1A1A1A;
  box-sizing: border-box; transition: all 0.2s;
}
.afu-form-input:focus {
  border-color: rgba(255,111,60,0.3); background: #FFF;
}

/* 关系快捷选择 */
.afu-chip-row {
  display: flex; flex-wrap: wrap; gap: 14rpx;
}
.afu-chip {
  padding: 16rpx 28rpx; background: #F8F7F5;
  border-radius: 32rpx; font-size: 28rpx; color: #777;
  border: 2rpx solid transparent; transition: all 0.2s;
}
.afu-chip:active { transform: scale(0.95); }
.afu-chip.active {
  background: #FFF5F0; color: #FF6F3C;
  border-color: rgba(255,111,60,0.3); font-weight: 600;
}

/* 表单按钮 */
.afu-form-actions {
  display: flex; gap: 16rpx; margin-top: 28rpx;
}
.afu-btn-cancel {
  flex: 1; height: 88rpx; background: #F5F5F5; color: #888;
  border: none; border-radius: 22rpx; font-size: 30rpx; font-weight: 600;
}
.afu-btn-cancel:active { background: #EEE; }
.afu-btn-confirm {
  flex: 1; height: 88rpx;
  background: linear-gradient(135deg, #FF6F3C, #FF8C5A); color: #FFF;
  border: none; border-radius: 22rpx; font-size: 30rpx; font-weight: 700;
  box-shadow: 0 6rpx 20rpx rgba(255,111,60,0.25);
}
.afu-btn-confirm:active { transform: scale(0.97); }

/* ── 设置 ── */
.afu-settings { padding: 0 28rpx; }
.afu-setting-card {
  background: #FFF; border-radius: 22rpx; padding: 28rpx 24rpx;
  margin-bottom: 14rpx; display: flex;
  justify-content: space-between; align-items: center;
  box-shadow: 0 2rpx 14rpx rgba(0,0,0,0.04);
}
.afu-setting-left { display: flex; align-items: center; gap: 18rpx; }
.afu-setting-icon { font-size: 34rpx; flex-shrink: 0; }
.afu-setting-label { font-size: 30rpx; font-weight: 500; color: #333; display: block; }
.afu-setting-desc { font-size: 24rpx; color: #999; margin-top: 2rpx; display: block; }

/* ── 底部提示 ── */
.afu-tip {
  text-align: center; padding: 40rpx 48rpx;
  font-size: 26rpx; color: #CCC;
}

.afu-watermark {
  position: fixed; bottom: 24rpx; right: 24rpx;
  font-size: 18rpx; color: rgba(0,0,0,0.06);
  z-index: 10; pointer-events: none; letter-spacing: 2rpx;
}
</style>
