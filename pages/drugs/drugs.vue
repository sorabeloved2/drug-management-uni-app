<template>
  <view class="container">
    <view class="header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <view class="header-title">药物管理</view>
      <view style="width:88rpx;"></view>
    </view>

    <view class="hint-bar info">
      <text>💡 点击编辑按钮修改药物信息，或添加新药物</text>
    </view>

    <!-- 药物列表 -->
    <view class="drug-list">
      <view v-if="medicines.length === 0" class="empty-state">
        <view class="empty-icon">💊</view>
        <view class="empty-title">还没有添加药物</view>
        <view class="empty-desc">点击下方按钮添加您的第一种药物</view>
      </view>

      <view v-for="med in medicines" :key="med.id" class="drug-card">
        <view class="medicine-icon" :class="iconClass(med)">
          {{ med.icon }}
        </view>
        <view class="drug-info">
          <view class="drug-name">{{ med.name }}</view>
          <view class="drug-meta">
            <text>{{ med.dosage }}</text>
            <text class="meta-sep">·</text>
            <text>{{ med.time }}</text>
            <text class="meta-sep">·</text>
            <text>{{ periodLabel(med.period) }}</text>
          </view>
          <view v-if="med.note" class="drug-note">{{ med.note }}</view>
        </view>
        <view class="drug-actions">
          <button class="btn-icon" @click="editMedicine(med.id)">✏️</button>
          <button class="btn-icon danger" @click="deleteMedicine(med.id)">🗑️</button>
        </view>
      </view>
    </view>

    <button class="btn-primary" @click="addMedicine">+ 添加新药物</button>

    <view class="afu-watermark">CUFE李禹成团队</view>
  </view>
</template>

<script>
import * as Store from '@/utils/medicine-store.js';

export default {
  data() {
    return {
      medicines: []
    };
  },
  onShow() {
    this.medicines = Store.getMedicines();
  },
  methods: {
    iconClass(med) {
      if (med.period === 'morning') return 'blue';
      if (med.period === 'afternoon') return 'orange';
      return 'green';
    },
    periodLabel(p) {
      const map = { morning: '上午', afternoon: '下午', evening: '晚上' };
      return map[p] || p;
    },
    addMedicine() {
      uni.navigateTo({ url: '/pages/add/add' });
    },
    editMedicine(id) {
      uni.navigateTo({ url: `/pages/add/add?id=${id}` });
    },
    deleteMedicine(id) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个药物吗？此操作不可恢复。',
        confirmColor: '#C62828',
        success: res => {
          if (res.confirm) {
            this.medicines = Store.deleteMedicine(id);
            uni.showToast({ title: '已删除', icon: 'success' });
          }
        }
      });
    },
    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #F0F2F5;
  padding-bottom: 40rpx;
}

.drug-list {
  padding: 0 32rpx;
}

.drug-card {
  background: #FFFFFF;
  border-radius: 28rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.drug-info {
  flex: 1;
  min-width: 0;
  margin-right: 16rpx;
}

.drug-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 6rpx;
}

.drug-meta {
  font-size: 28rpx;
  color: #666;
}

.meta-sep {
  margin: 0 8rpx;
  color: #DDD;
}

.drug-note {
  font-size: 26rpx;
  color: #999;
  margin-top: 4rpx;
}

.drug-actions {
  display: flex;
  gap: 16rpx;
  flex-shrink: 0;
}

/* 复用全局 medicine-icon */
.medicine-icon {
  width: 104rpx;
  height: 104rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  font-size: 52rpx;
  flex-shrink: 0;
}

.medicine-icon.blue   { background: #E3F2FD; }
.medicine-icon.orange { background: #FFF3E0; }
.medicine-icon.green  { background: #E8F5E9; }

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
}

.empty-icon {
  width: 180rpx;
  height: 180rpx;
  background: #F0F2F5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32rpx;
  font-size: 88rpx;
}

.empty-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 30rpx;
  color: #999;
}

.afu-watermark {
  position: fixed; bottom: 24rpx; right: 24rpx;
  font-size: 18rpx; color: rgba(0,0,0,0.06);
  z-index: 10; pointer-events: none; letter-spacing: 2rpx;
}
</style>
