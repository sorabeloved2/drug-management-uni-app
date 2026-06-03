<template>
  <view class="afu-container">
    <!-- ═══════════ 头部 ═══════════ -->
    <view class="afu-header">
      <view class="afu-back" @click="goHome"><text>←</text></view>
      <view class="afu-header-center">
        <view class="afu-mascot">🦊</view>
        <text class="afu-title">服药记录</text>
      </view>
      <view style="width:80rpx;"></view>
    </view>

    <!-- ═══════════ 统计卡片 ═══════════ -->
    <view class="afu-stats">
      <view class="afu-stat">
        <text class="afu-stat-val">{{ weekCount }}</text>
        <text class="afu-stat-label">本周完成</text>
      </view>
      <view class="afu-stat">
        <text class="afu-stat-val">{{ monthCount }}</text>
        <text class="afu-stat-label">本月完成</text>
      </view>
      <view class="afu-stat">
        <text class="afu-stat-val">{{ todayRate }}%</text>
        <text class="afu-stat-label">今日完成率</text>
      </view>
    </view>

    <!-- ═══════════ 日历 ═══════════ -->
    <view class="afu-calendar">
      <view class="afu-cal-head">
        <view class="afu-cal-btn" @click="changeMonth(-1)"><text>◀</text></view>
        <text class="afu-cal-month">{{ currentYear }}年 {{ currentMonth + 1 }}月</text>
        <view class="afu-cal-btn" @click="changeMonth(1)"><text>▶</text></view>
      </view>

      <view class="afu-weekdays">
        <text v-for="d in weekDays" :key="d" class="afu-weekday">{{ d }}</text>
      </view>

      <view class="afu-days">
        <view
          v-for="(day, i) in calendarDays"
          :key="i"
          class="afu-day"
          :class="{
            'is-today': day.isToday,
            'is-done': day.allDone,
            'is-partial': day.hasRecord && !day.allDone,
            'is-other': day.otherMonth,
            'is-selected': day.isSelected
          }"
          @click="selectDate(day)"
        >
          <text class="afu-day-num">{{ day.date }}</text>
          <view v-if="day.allDone" class="afu-day-dot green"></view>
          <view v-else-if="day.hasRecord" class="afu-day-dot orange"></view>
        </view>
      </view>
    </view>

    <!-- ═══════════ 选中日期详情 ═══════════ -->
    <view class="afu-section-label">{{ selectedDateText }}</view>

    <view v-if="medicines.length > 0" class="afu-records">
      <view
        v-for="med in medicines"
        :key="med.id"
        class="afu-record-card"
        :class="{ done: hasRecord(med.id) }"
      >
        <view class="afu-record-icon" :style="{ background: hasRecord(med.id) ? '#E8F5E9' : '#F5F5F5' }">
          {{ med.icon }}
        </view>
        <view class="afu-record-info">
          <text class="afu-record-name">{{ med.name }}</text>
          <text class="afu-record-meta">
            {{ med.dosage }} · {{ getRecordTime(med.id) || med.time }}
          </text>
        </view>
        <view class="afu-record-status" :class="hasRecord(med.id) ? 'done' : 'pending'">
          <text>{{ hasRecord(med.id) ? '✓ 已完成' : '○ 待服用' }}</text>
        </view>
      </view>
    </view>
    <view v-else class="afu-empty-tip">暂无药物数据，请先添加药物 💊</view>

    <view class="afu-watermark">CUFE李禹成团队</view>
  </view>
</template>

<script>
import * as Store from '@/utils/medicine-store.js';

export default {
  data() {
    const now = new Date();
    return {
      medicines: [],
      records: {},
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth(),
      selectedDate: new Date(),
      calendarDays: [],
      weekDays: ['日', '一', '二', '三', '四', '五', '六']
    };
  },
  computed: {
    selectedDateText() {
      const m = this.selectedDate.getMonth() + 1;
      const d = this.selectedDate.getDate();
      const isToday = Store.getDateKey(this.selectedDate) === Store.getDateKey(new Date());
      return `${m}月${d}日${isToday ? ' · 今天' : ''}`;
    },
    selectedKey() { return Store.getDateKey(this.selectedDate); },
    weekCount() { return Store.getWeekStats(); },
    monthCount() { return Store.getMonthStats(this.currentYear, this.currentMonth); },
    todayRate() { return Store.getTodayStats().rate; }
  },
  onShow() {
    this.loadData();
    this.renderCalendar();
  },
  methods: {
    loadData() {
      this.medicines = Store.getMedicines();
      this.records = Store.getRecords();
    },
    renderCalendar() {
      const y = this.currentYear;
      const m = this.currentMonth;
      const first = new Date(y, m, 1).getDay();
      const days = new Date(y, m + 1, 0).getDate();
      const prevDays = new Date(y, m, 0).getDate();
      const today = new Date();
      const result = [];

      for (let i = first - 1; i >= 0; i--) {
        result.push({ date: prevDays - i, otherMonth: true, fullDate: new Date(y, m - 1, prevDays - i) });
      }

      for (let d = 1; d <= days; d++) {
        const date = new Date(y, m, d);
        const key = Store.getDateKey(date);
        const record = this.records[key];
        const hasRecord = record && Object.keys(record).length > 0;
        const allDone = hasRecord && this.medicines.length > 0 && Object.keys(record).length >= this.medicines.length;

        result.push({
          date: d,
          isToday: d === today.getDate() && m === today.getMonth() && y === today.getFullYear(),
          hasRecord,
          allDone,
          fullDate: date,
          isSelected: Store.getDateKey(date) === Store.getDateKey(this.selectedDate)
        });
      }

      const rem = (7 - ((first + days) % 7)) % 7;
      for (let i = 1; i <= rem; i++) {
        result.push({ date: i, otherMonth: true, fullDate: new Date(y, m + 1, i) });
      }

      this.calendarDays = result;
    },
    changeMonth(d) {
      let nm = this.currentMonth + d;
      let ny = this.currentYear;
      if (nm < 0) { nm = 11; ny--; }
      else if (nm > 11) { nm = 0; ny++; }
      this.currentMonth = nm;
      this.currentYear = ny;
      this.renderCalendar();
    },
    selectDate(day) {
      if (day.otherMonth) return;
      this.selectedDate = day.fullDate;
      this.renderCalendar();
    },
    hasRecord(id) { return !!(this.records[this.selectedKey] || {})[id]; },
    getRecordTime(id) { return ((this.records[this.selectedKey] || {})[id] || {}).time; },
    goHome() { uni.switchTab({ url: '/pages/index/index' }); }
  }
};
</script>

<style scoped>
/* ══════════════════════════════════════
   药小福 · 服药记录
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

/* ── 统计卡片 ── */
.afu-stats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 16rpx; margin: 24rpx 28rpx;
}
.afu-stat {
  background: #FFF; border-radius: 24rpx; padding: 28rpx 16rpx;
  text-align: center; box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
}
.afu-stat-val {
  display: block; font-size: 44rpx; font-weight: 800;
  background: linear-gradient(135deg, #FF6F3C, #FF8C5A);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.afu-stat-label { font-size: 24rpx; color: #999; margin-top: 6rpx; display: block; }

/* ── 日历 ── */
.afu-calendar {
  margin: 0 28rpx; background: #FFF; border-radius: 28rpx;
  padding: 32rpx 24rpx; box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
}
.afu-cal-head {
  display: flex; align-items: center; justify-content: center;
  gap: 36rpx; margin-bottom: 28rpx;
}
.afu-cal-btn {
  width: 64rpx; height: 64rpx; border-radius: 50%;
  background: #F8F7F5; display: flex; align-items: center; justify-content: center;
  font-size: 24rpx; color: #888;
}
.afu-cal-btn:active { background: #EEE; }
.afu-cal-month { font-size: 34rpx; font-weight: 700; color: #333; }

.afu-weekdays {
  display: grid; grid-template-columns: repeat(7, 1fr);
  text-align: center; margin-bottom: 12rpx;
}
.afu-weekday { font-size: 26rpx; color: #AAA; font-weight: 600; }

.afu-days {
  display: grid; grid-template-columns: repeat(7, 1fr);
  text-align: center; gap: 6rpx;
}
.afu-day {
  aspect-ratio: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; border-radius: 50%;
  position: relative; font-size: 30rpx; transition: all 0.2s;
}
.afu-day-num { position: relative; z-index: 1; }
.afu-day.is-today { background: #FF6F3C; }
.afu-day.is-today .afu-day-num { color: #FFF; font-weight: 700; }
.afu-day.is-selected { background: #FFF5F0; }
.afu-day.is-selected .afu-day-num { color: #FF6F3C; font-weight: 700; }
.afu-day.is-other .afu-day-num { color: #DDD; }
.afu-day:active { transform: scale(0.9); }
.afu-day-dot {
  width: 8rpx; height: 8rpx; border-radius: 50%;
  margin-top: 4rpx; position: relative; z-index: 1;
}
.afu-day-dot.green { background: #2E7D32; }
.afu-day-dot.orange { background: #FF6F3C; }

/* ── 选中日期 ── */
.afu-section-label {
  font-size: 32rpx; font-weight: 700; color: #333;
  margin: 32rpx 28rpx 16rpx;
}

/* ── 记录列表 ── */
.afu-records { padding: 0 28rpx; }
.afu-record-card {
  background: #FFF; border-radius: 22rpx; padding: 28rpx 24rpx;
  margin-bottom: 14rpx; display: flex; align-items: center;
  box-shadow: 0 2rpx 14rpx rgba(0,0,0,0.04);
}
.afu-record-card.done { box-shadow: 0 2rpx 14rpx rgba(46,125,50,0.06); }
.afu-record-icon {
  width: 80rpx; height: 80rpx; border-radius: 20rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 38rpx; margin-right: 20rpx; flex-shrink: 0;
}
.afu-record-info { flex: 1; min-width: 0; }
.afu-record-name { font-size: 32rpx; font-weight: 600; color: #333; display: block; }
.afu-record-meta { font-size: 26rpx; color: #999; margin-top: 4rpx; display: block; }
.afu-record-status { flex-shrink: 0; margin-left: 16rpx; }
.afu-record-status.done { color: #2E7D32; font-weight: 600; font-size: 28rpx; }
.afu-record-status.pending { color: #CCC; font-size: 28rpx; }

.afu-empty-tip { text-align: center; color: #BBB; padding: 80rpx 40rpx; font-size: 30rpx; }

.afu-watermark {
  position: fixed; bottom: 24rpx; right: 24rpx;
  font-size: 18rpx; color: rgba(0,0,0,0.06);
  z-index: 10; pointer-events: none; letter-spacing: 2rpx;
}
</style>
