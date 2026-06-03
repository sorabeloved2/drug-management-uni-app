/**
 * 应用默认常量——所有硬编码数据的单一声源
 * 修改此处即可同步到 App.vue、首页、添加页等所有引用点
 */

/** 首次使用时初始化的示例药物 */
export const DEFAULT_MEDICINES = [
  { id: '1', name: '降压药', dosage: '1片', time: '07:30', period: 'morning', icon: '💊', note: '饭后服用' },
  { id: '2', name: '降糖药', dosage: '1片', time: '07:35', period: 'morning', icon: '💉', note: '饭后服用' },
  { id: '3', name: '阿司匹林', dosage: '1片', time: '14:00', period: 'afternoon', icon: '💊', note: '饭后服用' }
];

/** 药物图标候选池 */
export const MEDICINE_ICONS = ['💊', '💉', '🧬', '🩹'];

/** 时段中文映射 */
export const PERIOD_NAMES = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上'
};

/** 时段顺序（用于过期判断） */
export const PERIOD_ORDER = ['morning', 'afternoon', 'evening'];

/** 时段选项（用于 picker） */
export const PERIOD_OPTIONS = [
  { value: 'morning', label: '上午' },
  { value: 'afternoon', label: '下午' },
  { value: 'evening', label: '晚上' }
];

/** 扫码模拟数据（接入真实 API 后可删除） */
export const SCAN_MOCK_DRUGS = [
  { name: '阿莫西林', dose: '0.5g/片，每次1片' },
  { name: '维生素C', dose: '100mg/片，每次2片' },
  { name: '钙片', dose: '600mg/片，每次1片' }
];
