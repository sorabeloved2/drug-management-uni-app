<template>
  <view class="afu-container">
    <!-- ═══════════ 头部 ═══════════ -->
    <view class="afu-header">
      <view></view>
      <view class="afu-header-center">
        <view class="afu-mascot">🦊</view>
        <text class="afu-title">我的</text>
      </view>
      <view style="width:80rpx;"></view>
    </view>

    <!-- ═══════════ 用户卡片 ═══════════ -->
    <view class="afu-user-card">
      <view class="afu-avatar-wrap" @click="changeAvatar">
        <image v-if="userInfo.avatar" class="afu-avatar-img" :src="userInfo.avatar" mode="aspectFill" />
        <view v-else class="afu-avatar-text">{{ userInfo.name[0] }}</view>
        <view class="afu-avatar-badge">📷</view>
      </view>
      <view class="afu-user-info">
        <text class="afu-user-name">{{ userInfo.name }}</text>
        <text class="afu-user-desc">{{ userInfo.age }}岁 · 已用药管家 {{ userInfo.days }} 天</text>
      </view>
      <text class="afu-user-arrow">›</text>
    </view>

    <!-- ═══════════ 功能菜单 ═══════════ -->
    <view class="afu-menu">
      <view class="afu-menu-item" @click="goToFamily">
        <view class="afu-menu-icon" style="background:#E3F2FD;">👨‍👩‍👧</view>
        <text class="afu-menu-text">家属联动</text>
        <text class="afu-menu-arrow">›</text>
      </view>
      <view class="afu-menu-item" @click="goToAI">
        <view class="afu-menu-icon" style="background:linear-gradient(135deg, #FFE0D0, #FFC4A8);">🦊</view>
        <text class="afu-menu-text">药小福 · AI 健康伙伴</text>
        <view class="afu-menu-badge">AI</view>
        <text class="afu-menu-arrow">›</text>
      </view>
    </view>

    <!-- ═══════════ 提醒设置 ═══════════ -->
    <view class="afu-section-label">提醒设置</view>
    <view class="afu-settings">
      <view class="afu-setting-card">
        <view>
          <text class="afu-setting-label">语音提醒</text>
          <text class="afu-setting-desc">服药时语音播报</text>
        </view>
        <switch checked color="#FF6F3C" />
      </view>
      <view class="afu-setting-card">
        <view>
          <text class="afu-setting-label">震动提醒</text>
          <text class="afu-setting-desc">提醒时震动</text>
        </view>
        <switch checked color="#FF6F3C" />
      </view>
    </view>

    <!-- ═══════════ 其他 ═══════════ -->
    <view class="afu-menu">
      <view class="afu-menu-item" @click="showHelp">
        <view class="afu-menu-icon" style="background:#FFF3E0;">❓</view>
        <text class="afu-menu-text">使用帮助</text>
        <text class="afu-menu-arrow">›</text>
      </view>
      <view class="afu-menu-item" @click="showAbout">
        <view class="afu-menu-icon" style="background:#F3E5F5;">ℹ️</view>
        <text class="afu-menu-text">关于我们</text>
        <text class="afu-menu-arrow">›</text>
      </view>
    </view>

    <view class="afu-version">药小福 26.06.1</view>

    <view class="afu-watermark">CUFE李禹成团队</view>
  </view>
</template>

<script>
import Storage from '@/utils/storage/index.js';

export default {
  data() {
    return {
      userInfo: {
        name: '王淑芬',
        age: 68,
        days: 30,
        avatar: ''
      }
    };
  },
  onShow() {
    this.loadUserInfo();
  },
  methods: {
    loadUserInfo() {
      const saved = Storage.get('userInfo');
      if (saved) this.userInfo = { ...this.userInfo, ...saved };
    },
    saveUserInfo() {
      Storage.set('userInfo', this.userInfo);
    },
    changeAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: res => {
          this.userInfo.avatar = res.tempFilePaths[0];
          this.saveUserInfo();
          uni.showToast({ title: '头像已更新', icon: 'success' });
        }
      });
    },
    goToFamily() { uni.navigateTo({ url: '/pages/family/family' }); },
    goToAI() { uni.switchTab({ url: '/pages/ai/ai' }); },
    showHelp() {
      uni.showModal({
        title: '使用帮助',
        content: '1. 首页查看今日需服用的药物\n2. 点击"服用"记录服药\n3. 在"记录"页面查看历史\n4. 在"添加"页面添加新药物\n5. 扫码可快速添加\n\n如有问题请联系：400-123-4567',
        showCancel: false
      });
    },
    showAbout() {
      uni.showModal({
        title: '关于药小福',
        content: '药小福 v1.0\n\n专为老年人设计的智能药物管家\n\n🦊 AI 药物咨询\n💊 智能服药提醒\n📊 服药记录追踪\n👨‍👩‍👧 家属联动通知\n📷 扫码快速添加\n\n让用药更安全，让家人更放心！',
        showCancel: false
      });
    }
  }
};
</script>

<style scoped>
/* ══════════════════════════════════════
   药小福 · 个人中心
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
}
.afu-header-center { display: flex; align-items: center; gap: 12rpx; }
.afu-mascot {
  width: 52rpx; height: 52rpx; border-radius: 50%;
  background: linear-gradient(135deg, #FFE0D0, #FFC4A8);
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx;
}
.afu-title { font-size: 36rpx; font-weight: 700; color: #333; }

/* ── 用户卡片 ── */
.afu-user-card {
  margin: 28rpx; padding: 36rpx 28rpx;
  background: #FFF; border-radius: 28rpx;
  display: flex; align-items: center;
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
}
.afu-avatar-wrap {
  position: relative; width: 128rpx; height: 128rpx; margin-right: 28rpx; flex-shrink: 0;
}
.afu-avatar-img {
  width: 100%; height: 100%; border-radius: 50%;
}
.afu-avatar-text {
  width: 100%; height: 100%; border-radius: 50%;
  background: linear-gradient(135deg, #43A047, #1B5E20);
  display: flex; align-items: center; justify-content: center;
  color: #FFF; font-size: 56rpx; font-weight: 700;
  box-shadow: 0 8rpx 24rpx rgba(46,125,50,0.25);
}
.afu-avatar-badge {
  position: absolute; bottom: 0; right: 0;
  width: 44rpx; height: 44rpx; border-radius: 50%;
  background: #FFF; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 22rpx;
}
.afu-user-info { flex: 1; min-width: 0; }
.afu-user-name {
  display: block; font-size: 38rpx; font-weight: 700; color: #333;
  margin-bottom: 6rpx;
}
.afu-user-desc { font-size: 28rpx; color: #999; }
.afu-user-arrow { font-size: 40rpx; color: #CCC; flex-shrink: 0; }

/* ── 菜单 ── */
.afu-menu {
  margin: 0 28rpx; background: #FFF; border-radius: 28rpx;
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04); overflow: hidden;
}
.afu-menu-item {
  display: flex; align-items: center; padding: 32rpx 28rpx;
  border-bottom: 1rpx solid #F5F5F5; transition: background 0.15s;
}
.afu-menu-item:last-child { border-bottom: none; }
.afu-menu-item:active { background: #FAFAFA; }
.afu-menu-icon {
  width: 76rpx; height: 76rpx; border-radius: 18rpx;
  display: flex; align-items: center; justify-content: center;
  margin-right: 24rpx; font-size: 36rpx; flex-shrink: 0;
}
.afu-menu-text { flex: 1; font-size: 32rpx; font-weight: 500; color: #333; }
.afu-menu-badge {
  background: #FFF5F0; color: #FF6F3C; font-size: 22rpx;
  font-weight: 700; padding: 4rpx 14rpx; border-radius: 10rpx;
  margin-right: 12rpx;
}
.afu-menu-arrow { font-size: 36rpx; color: #CCC; flex-shrink: 0; }

/* ── 分区标签 ── */
.afu-section-label {
  font-size: 28rpx; font-weight: 600; color: #AAA;
  margin: 32rpx 32rpx 16rpx;
  letter-spacing: 4rpx;
}

/* ── 设置卡片 ── */
.afu-settings { padding: 0 28rpx; }
.afu-setting-card {
  background: #FFF; border-radius: 24rpx; padding: 28rpx;
  margin-bottom: 16rpx; display: flex;
  justify-content: space-between; align-items: center;
  box-shadow: 0 2rpx 14rpx rgba(0,0,0,0.04);
}
.afu-setting-label { font-size: 32rpx; font-weight: 500; color: #333; display: block; }
.afu-setting-desc { font-size: 26rpx; color: #999; margin-top: 4rpx; display: block; }

/* ── 版本号 ── */
.afu-version { text-align: center; color: #CCC; font-size: 26rpx; padding: 48rpx 0 32rpx; }

.afu-watermark {
  position: fixed; bottom: 24rpx; right: 24rpx;
  font-size: 18rpx; color: rgba(0,0,0,0.06);
  z-index: 10; pointer-events: none; letter-spacing: 2rpx;
}
</style>
