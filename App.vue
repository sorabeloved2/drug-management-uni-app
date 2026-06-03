<script>
import { initMedicines, syncFromCloud } from './utils/medicine-store.js';

export default {
  globalData: {
    disclaimerShown: false
  },
  onLaunch() {
    // 初始化本地数据
    initMedicines();

    // 尝试从云端同步数据（后台执行，不阻塞启动）
    syncFromCloud().then(result => {
      if (result.synced) {
        console.log(`[App] 云端数据已同步：${result.medicines || 0} 种药物，${result.records || 0} 条记录`);
      }
    });
  }
}
</script>

<style>
/* ========================================
   药管家 — 全局基础样式（现代极简 · 老年友好）
   卡片阴影 · 大字号 · 大触控 · 色盲适配
   ======================================== */

/* ── 根级重置 ── */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Microsoft YaHei', 'Helvetica Neue', sans-serif;
  background: #F0F2F5;
  font-size: 32rpx;
  color: #1A1A1A;
  line-height: 1.5;
}

/* ── 页面容器 ── */
.container {
  min-height: 100vh;
  padding-bottom: 140rpx;
}

/* ══════════════════════════════════════
   头部导航
   ══════════════════════════════════════ */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 36rpx;
  background: #FFFFFF;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
  padding-top: calc(32rpx + var(--status-bar-height));
  position: relative;
  z-index: 10;
}

.header-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1A1A1A;
  letter-spacing: 2rpx;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 32rpx;
  color: #1565C0;
  background: none;
  border: none;
  padding: 12rpx;
  min-width: 88rpx;
  min-height: 88rpx;
  justify-content: center;
}

/* ══════════════════════════════════════
   卡片系统（阴影替代边框）
   ══════════════════════════════════════ */
.card {
  background: #FFFFFF;
  border-radius: 28rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
  margin: 28rpx 32rpx;
  overflow: hidden;
}

/* 进度卡片 — 特殊强调 */
.progress-card {
  margin: 28rpx 32rpx;
  padding: 40rpx 36rpx;
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  border-radius: 28rpx;
  box-shadow: 0 4rpx 24rpx rgba(46, 125, 50, 0.12);
  text-align: center;
}

.progress-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.progress-detail {
  font-size: 32rpx;
  color: #555;
  margin-top: 12rpx;
}

.progress-bar {
  height: 20rpx;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10rpx;
  margin-top: 28rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2E7D32;
  border-radius: 10rpx;
  transition: width 0.4s ease;
}

/* ══════════════════════════════════════
   药物卡片
   ══════════════════════════════════════ */
.medicine-group {
  padding: 0 32rpx;
  margin-top: 40rpx;
}

.group-title {
  font-size: 34rpx;
  font-weight: 700;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.group-title.completed {
  color: #2E7D32;
}

.group-title.pending {
  color: #E65100;
}

.medicine-card {
  background: #FFFFFF;
  border-radius: 28rpx;
  padding: 36rpx 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

/* 状态左边框 — 色盲友好：颜色 + 图标 + 文字三重编码 */
.medicine-card.highlight {
  box-shadow: 0 4rpx 24rpx rgba(230, 81, 0, 0.15);
}

.medicine-card.highlight::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20rpx;
  bottom: 20rpx;
  width: 8rpx;
  background: #E65100;
  border-radius: 0 6rpx 6rpx 0;
}

.medicine-card.overdue {
  box-shadow: 0 4rpx 24rpx rgba(198, 40, 40, 0.12);
  opacity: 0.85;
}

.medicine-card.overdue::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20rpx;
  bottom: 20rpx;
  width: 8rpx;
  background: #C62828;
  border-radius: 0 6rpx 6rpx 0;
}

.medicine-card.completed {
  box-shadow: 0 4rpx 24rpx rgba(46, 125, 50, 0.10);
}

.medicine-card.completed::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20rpx;
  bottom: 20rpx;
  width: 8rpx;
  background: #2E7D32;
  border-radius: 0 6rpx 6rpx 0;
}

.medicine-icon {
  width: 112rpx;
  height: 112rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 28rpx;
  font-size: 56rpx;
  flex-shrink: 0;
}

.medicine-icon.blue   { background: #E3F2FD; }
.medicine-icon.orange { background: #FFF3E0; }
.medicine-icon.green  { background: #E8F5E9; }
.medicine-icon.red    { background: #FFEBEE; }
.medicine-icon.purple { background: #F3E5F5; }

.medicine-info {
  flex: 1;
  min-width: 0;
}

.medicine-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #1A1A1A;
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.medicine-dose {
  font-size: 30rpx;
  color: #666;
  margin-top: 8rpx;
}

/* ══════════════════════════════════════
   状态徽章（色盲友好：图标 + 文字 + 颜色）
   ══════════════════════════════════════ */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1.4;
}

.status-badge.success {
  background: #E8F5E9;
  color: #2E7D32;
}

.status-badge.warning {
  background: #FFF3E0;
  color: #E65100;
}

.status-badge.error {
  background: #FFEBEE;
  color: #C62828;
}

.status-badge.info {
  background: #E3F2FD;
  color: #1565C0;
}

/* 卡片操作区 */
.card-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

/* ══════════════════════════════════════
   按钮系统（最小触控 88rpx）
   ══════════════════════════════════════ */
.btn-primary {
  margin: 28rpx 32rpx;
  width: calc(100% - 64rpx);
  height: 96rpx;
  background: #2E7D32;
  color: #FFFFFF;
  border: none;
  border-radius: 24rpx;
  font-size: 36rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 24rpx rgba(46, 125, 50, 0.25);
  transition: all 0.2s ease;
  letter-spacing: 2rpx;
}

.btn-primary:active {
  transform: scale(0.97);
  box-shadow: 0 2rpx 12rpx rgba(46, 125, 50, 0.2);
}

.btn-secondary {
  margin: 0 32rpx 28rpx;
  width: calc(100% - 64rpx);
  height: 88rpx;
  background: #FFFFFF;
  border: none;
  border-radius: 24rpx;
  font-size: 32rpx;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.btn-secondary:active {
  background: #F5F5F5;
}

.btn-confirm {
  padding: 0 36rpx;
  height: 88rpx;
  background: #E65100;
  color: #FFFFFF;
  border: none;
  border-radius: 22rpx;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(230, 81, 0, 0.2);
  min-width: 160rpx;
}

.btn-confirm:active {
  transform: scale(0.96);
}

.btn-delete-mini {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  border: none;
  background: #F5F5F5;
  font-size: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  transition: all 0.2s ease;
}

.btn-delete-mini:active {
  background: #FFEBEE;
  transform: scale(0.92);
}

.btn-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 22rpx;
  border: none;
  background: #F5F5F5;
  font-size: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s ease;
}

.btn-icon:active {
  background: #E0E0E0;
  transform: scale(0.92);
}

.btn-icon.danger:active {
  background: #FFEBEE;
}

.btn-taken {
  width: 100%;
  height: 96rpx;
  background: #2E7D32;
  color: #FFFFFF;
  border: none;
  border-radius: 24rpx;
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  box-shadow: 0 6rpx 24rpx rgba(46, 125, 50, 0.25);
  letter-spacing: 2rpx;
}

.btn-taken:active {
  transform: scale(0.97);
}

.btn-later {
  width: 100%;
  height: 88rpx;
  background: #F5F5F5;
  color: #666;
  border: none;
  border-radius: 24rpx;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.btn-later:active {
  background: #E0E0E0;
}

/* ══════════════════════════════════════
   状态图标
   ══════════════════════════════════════ */
.status-check {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #2E7D32;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 44rpx;
  font-weight: 700;
}

/* ══════════════════════════════════════
   表单
   ══════════════════════════════════════ */
.form-group {
  margin: 0 32rpx 28rpx;
}

.form-label {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 104rpx;
  padding: 0 32rpx;
  background: #FFFFFF;
  border: none;
  border-radius: 24rpx;
  font-size: 34rpx;
  color: #1A1A1A;
  box-sizing: border-box;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  transition: box-shadow 0.2s ease;
}

.form-input:focus,
.form-input:active {
  box-shadow: 0 4rpx 20rpx rgba(46, 125, 50, 0.15);
}

/* ══════════════════════════════════════
   空状态
   ══════════════════════════════════════ */
.empty-state {
  text-align: center;
  padding: 120rpx 48rpx;
}

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  background: #F0F2F5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 40rpx;
  font-size: 100rpx;
}

.empty-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 48rpx;
  line-height: 1.6;
}

.btn-add-first {
  padding: 0 64rpx;
  height: 96rpx;
  background: #2E7D32;
  color: #FFFFFF;
  border: none;
  border-radius: 24rpx;
  font-size: 34rpx;
  font-weight: 700;
  box-shadow: 0 6rpx 24rpx rgba(46, 125, 50, 0.25);
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  letter-spacing: 2rpx;
}

/* ══════════════════════════════════════
   弹窗 / 模态框
   ══════════════════════════════════════ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  backdrop-filter: blur(4rpx);
}

.modal {
  background: #FFFFFF;
  border-radius: 36rpx;
  padding: 56rpx 44rpx;
  width: 100%;
  max-width: 680rpx;
  text-align: center;
  box-shadow: 0 24rpx 64rpx rgba(0, 0, 0, 0.2);
}

.modal-icon {
  width: 144rpx;
  height: 144rpx;
  border-radius: 50%;
  background: #FFF3E0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 36rpx;
  font-size: 72rpx;
}

.modal-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 12rpx;
}

.modal-desc {
  font-size: 30rpx;
  color: #999;
  margin-bottom: 32rpx;
}

.modal-medicine {
  background: #FFF8E1;
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 36rpx 0;
}

.modal-medicine .name {
  font-size: 40rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.modal-medicine .detail {
  font-size: 30rpx;
  color: #666;
  margin-top: 8rpx;
}

/* ══════════════════════════════════════
   提示 / Toast
   ══════════════════════════════════════ */
.toast {
  position: fixed;
  top: 180rpx;
  left: 50%;
  transform: translateX(-50%);
  background: #1A1A1A;
  color: #FFFFFF;
  padding: 28rpx 40rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  gap: 32rpx;
  z-index: 150;
  font-size: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.25);
}

.toast-undo {
  color: #FF9800;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

/* ══════════════════════════════════════
   菜单列表
   ══════════════════════════════════════ */
.menu-list {
  background: #FFFFFF;
  border-radius: 28rpx;
  margin: 28rpx 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 36rpx 32rpx;
  min-height: 104rpx;
  box-sizing: border-box;
  border-bottom: 1rpx solid #F5F5F5;
  transition: background 0.15s ease;
  cursor: pointer;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background: #FAFAFA;
}

.menu-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 28rpx;
  font-size: 40rpx;
  flex-shrink: 0;
}

.menu-text {
  flex: 1;
  font-size: 34rpx;
  font-weight: 500;
  color: #1A1A1A;
}

.menu-arrow {
  color: #CCC;
  font-size: 36rpx;
  flex-shrink: 0;
}

/* ══════════════════════════════════════
   设置卡片（开关行）
   ══════════════════════════════════════ */
.setting-card {
  background: #FFFFFF;
  border-radius: 28rpx;
  padding: 32rpx 36rpx;
  margin: 0 32rpx 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
  min-height: 104rpx;
  box-sizing: border-box;
}

.setting-label {
  font-size: 34rpx;
  font-weight: 500;
  color: #1A1A1A;
}

.setting-desc {
  font-size: 28rpx;
  color: #999;
  margin-top: 6rpx;
}

/* ══════════════════════════════════════
   开关（自定义样式）
   ══════════════════════════════════════ */
.switch {
  position: relative;
  width: 104rpx;
  height: 60rpx;
}

.switch checkbox {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #CCC;
  border-radius: 60rpx;
  transition: 0.25s ease;
}

.slider:before {
  position: absolute;
  content: '';
  height: 48rpx;
  width: 48rpx;
  left: 6rpx;
  bottom: 6rpx;
  background: #FFFFFF;
  border-radius: 50%;
  transition: 0.25s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

switch[checked] .slider {
  background: #2E7D32;
}

switch[checked] .slider:before {
  transform: translateX(44rpx);
}

/* ══════════════════════════════════════
   统计卡片组
   ══════════════════════════════════════ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  margin: 0 32rpx 32rpx;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx 16rpx;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #2E7D32;
  line-height: 1.2;
}

.stat-label {
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
}

/* ══════════════════════════════════════
   分割文字
   ══════════════════════════════════════ */
.divider-text {
  text-align: center;
  color: #999;
  margin: 36rpx 0;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 0 32rpx;
}

.divider-text::before,
.divider-text::after {
  content: '';
  flex: 1;
  height: 1rpx;
  background: #E0E0E0;
}

/* ══════════════════════════════════════
   提示条
   ══════════════════════════════════════ */
.hint-bar {
  margin: 0 32rpx 32rpx;
  padding: 24rpx 28rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.hint-bar.info {
  background: #E3F2FD;
  color: #1565C0;
}

.hint-bar.success {
  background: #E8F5E9;
  color: #2E7D32;
}

.hint-bar.warning {
  background: #FFF3E0;
  color: #E65100;
}

/* ══════════════════════════════════════
   未来时段提示
   ══════════════════════════════════════ */
.future-hint {
  margin: 0 32rpx 32rpx;
  padding: 28rpx;
  background: #F5F5F5;
  border-radius: 20rpx;
  text-align: center;
  font-size: 28rpx;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

/* ══════════════════════════════════════
   用户信息卡片
   ══════════════════════════════════════ */
.user-card {
  background: #FFFFFF;
  border-radius: 28rpx;
  padding: 36rpx 32rpx;
  margin: 28rpx 32rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
}

.avatar-wrapper {
  position: relative;
  width: 144rpx;
  height: 144rpx;
  margin-right: 32rpx;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-text {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #43A047, #1B5E20);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 60rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 24rpx rgba(46, 125, 50, 0.3);
}

.avatar-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  line-height: 1;
}

.user-name {
  font-size: 40rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.user-desc {
  font-size: 30rpx;
  color: #999;
  margin-top: 8rpx;
}

/* ══════════════════════════════════════
   分段标题
   ══════════════════════════════════════ */
.section-title {
  font-size: 28rpx;
  color: #999;
  font-weight: 600;
  margin: 32rpx 32rpx 16rpx;
  text-transform: uppercase;
  letter-spacing: 4rpx;
}

/* ══════════════════════════════════════
   日历区域
   ══════════════════════════════════════ */
.calendar-section {
  background: #FFFFFF;
  margin: 28rpx 32rpx;
  border-radius: 28rpx;
  padding: 36rpx 28rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
}

.month-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 36rpx;
  margin-bottom: 32rpx;
}

.month-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  border: none;
  background: #F5F5F5;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.month-btn:active {
  background: #E0E0E0;
}

.month-text {
  font-size: 36rpx;
  font-weight: 700;
  min-width: 240rpx;
  text-align: center;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  gap: 4rpx;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  color: #999;
  font-weight: 600;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  gap: 6rpx;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  border-radius: 50%;
  position: relative;
  min-width: 80rpx;
  min-height: 80rpx;
  transition: all 0.2s;
}

.calendar-day.today {
  background: #2E7D32;
  color: #FFFFFF;
  font-weight: 700;
}

.calendar-day.selected {
  background: #E8F5E9;
  color: #2E7D32;
  font-weight: 700;
  box-shadow: inset 0 0 0 3rpx #2E7D32;
}

.calendar-day.other-month {
  color: #DDD;
}

.calendar-day:active {
  transform: scale(0.9);
}

.dot-orange {
  width: 10rpx;
  height: 10rpx;
  background: #E65100;
  border-radius: 50%;
  margin-top: 4rpx;
}

.dot-green {
  width: 10rpx;
  height: 10rpx;
  background: #2E7D32;
  border-radius: 50%;
  margin-top: 4rpx;
}

/* ══════════════════════════════════════
   记录列表
   ══════════════════════════════════════ */
.record-section {
  margin: 28rpx 32rpx;
}

.record-date {
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 20rpx;
  color: #1A1A1A;
}

.record-item {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  margin-bottom: 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
  min-height: 104rpx;
  box-sizing: border-box;
}

.record-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #1A1A1A;
}

.record-info {
  font-size: 28rpx;
  color: #999;
  margin-top: 6rpx;
}

.status-completed {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 30rpx;
  color: #2E7D32;
  font-weight: 600;
}

.status-pending {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 30rpx;
  color: #E65100;
  font-weight: 600;
}

/* ══════════════════════════════════════
   扫码区域
   ══════════════════════════════════════ */
.scan-area {
  margin: 28rpx 32rpx;
  padding: 60rpx 40rpx;
  background: #E3F2FD;
  border-radius: 28rpx;
  text-align: center;
  box-shadow: 0 4rpx 24rpx rgba(21, 101, 192, 0.08);
  transition: all 0.2s ease;
}

.scan-area:active {
  transform: scale(0.98);
}

.scan-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.scan-title {
  color: #1565C0;
  font-size: 36rpx;
  font-weight: 700;
}

.scan-tip {
  color: #666;
  margin-top: 10rpx;
  font-size: 28rpx;
}

/* ========================================
   开屏免责声明（全局样式，由首页引用）
   ======================================== */
.disclaimer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64rpx 48rpx;
  backdrop-filter: blur(8rpx);
}

.disclaimer-modal {
  background: #FFFFFF;
  border-radius: 36rpx;
  padding: 56rpx 40rpx 44rpx;
  width: 100%;
  max-width: 640rpx;
  text-align: center;
  box-shadow: 0 32rpx 64rpx rgba(0, 0, 0, 0.25);
  animation: disclaimer-in 0.35s ease-out;
}

@keyframes disclaimer-in {
  from {
    opacity: 0;
    transform: translateY(40rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.disclaimer-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFE0D0, #FFC4A8);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 28rpx;
  font-size: 64rpx;
  box-shadow: 0 8rpx 32rpx rgba(255, 111, 60, 0.2);
}

.disclaimer-title {
  font-size: 40rpx;
  font-weight: 800;
  color: #333;
  margin-bottom: 32rpx;
  background: linear-gradient(135deg, #FF6F3C, #FF8C5A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.disclaimer-body {
  text-align: center;
  margin-bottom: 36rpx;
}

.disclaimer-text {
  font-size: 29rpx;
  color: #666;
  line-height: 1.8;
}

.disclaimer-highlight {
  color: #FF6F3C;
  font-weight: 700;
}

.disclaimer-divider {
  width: 80rpx;
  height: 2rpx;
  background: #EEE;
  margin: 20rpx auto;
}

.disclaimer-purpose {
  color: #999;
  font-size: 27rpx;
}

.disclaimer-warning {
  font-size: 30rpx;
  font-weight: 700;
  color: #E65100;
  margin-bottom: 12rpx;
}

.disclaimer-legal {
  font-size: 26rpx;
  color: #999;
  line-height: 1.7;
  text-align: left;
  margin-bottom: 8rpx;
}

.disclaimer-bold {
  color: #E65100;
  font-weight: 600;
}

.disclaimer-emergency {
  color: #C62828;
  font-weight: 800;
  font-size: 30rpx;
}

.disclaimer-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #FF6F3C, #FF8C5A);
  color: #FFFFFF;
  border: none;
  border-radius: 24rpx;
  font-size: 34rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 28rpx rgba(255, 111, 60, 0.3);
  transition: all 0.2s ease;
  letter-spacing: 2rpx;
}

.disclaimer-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.disclaimer-version {
  margin-top: 24rpx;
  font-size: 24rpx;
  color: #CCC;
}
</style>
