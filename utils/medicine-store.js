/**
 * 药物管理系统—统一数据访问层
 *
 * 存储策略：
 *   ✅ uniCloud 可用 → 云端为主 + 本地缓存
 *   ❌ uniCloud 不可用 → 纯本地存储（与之前完全一致）
 *
 * 所有药品 / 服药记录的读写必须通过本模块。
 * 页面层代码无需改动 — API 签名保持不变。
 */
import Storage from './storage/index.js'
import CloudDB from './cloud-db.js'
import {
  DEFAULT_MEDICINES,
  MEDICINE_ICONS,
  PERIOD_NAMES,
  PERIOD_ORDER
} from './constants/defaults.js'

// ---------- 云端连接 ----------

const db = CloudDB.collection('medicines', 'medicines')
const recordsDB = CloudDB.collection('records', 'records')
const usersDB = CloudDB.collection('users', 'userInfo')

// 标记云端是否可用（由 cloud-db 自动检测）
let _cloudAvailable = false
function updateCloudStatus() {
  _cloudAvailable = CloudDB.checkCloud()
}
updateCloudStatus()

// ---------- 内部工具 ----------

let _idCounter = 0
function generateId() {
  _idCounter++
  return `med_${Date.now()}_${_idCounter}`
}

function pickIcon() {
  return MEDICINE_ICONS[Math.floor(Math.random() * MEDICINE_ICONS.length)]
}

function safeRead(key, fallback) {
  try {
    const data = uni.getStorageSync(key)
    if (data === '' || data === undefined || data === null) return fallback
    return data
  } catch (e) {
    console.error(`[Store] 读取 "${key}" 失败:`, e)
    uni.showToast({ title: '数据读取异常，已恢复默认', icon: 'none' })
    return fallback
  }
}

function safeWrite(key, value) {
  try {
    uni.setStorageSync(key, value)
  } catch (e) {
    console.error(`[Store] 写入 "${key}" 失败:`, e)
  }
}

// ---------- 云端同步辅助 ----------

/**
 * 后台写入云端（不阻塞、不报错）
 * @param {string} collection — 集合名
 * @param {string} method    — 'add' | 'update' | 'remove'
 * @param {*} args           — 方法参数
 */
function _cloudWrite(collection, method, ...args) {
  if (!_cloudAvailable) return
  // 延迟执行，不阻塞 UI
  setTimeout(async () => {
    try {
      await CloudDB.collection(collection)[method](...args)
    } catch (e) {
      console.warn(`[Store] 云端${method}失败（本地数据不受影响）:`, e.message)
    }
  }, 0)
}

/**
 * 首次使用 uniCloud 时，从云端同步数据到本地
 * 在 App.vue onLaunch 或首页 onShow 中调用
 */
export async function syncFromCloud() {
  updateCloudStatus()
  if (!_cloudAvailable) {
    console.log('[Store] uniCloud 不可用，使用本地数据')
    return { synced: false, reason: 'uniCloud 不可用' }
  }

  try {
    // 拉取药物列表
    const cloudMeds = await db.getAll()
    if (cloudMeds.length > 0) {
      // 将云端数据映射为本地格式
      const localMeds = cloudMeds.map(m => ({
        id: m._id || m.id,
        name: m.name,
        dosage: m.dosage,
        time: m.time || '08:00',
        period: m.period || 'morning',
        note: m.note || '饭后服用',
        icon: m.icon || pickIcon()
      }))
      safeWrite('medicines', localMeds)
      console.log(`[Store] ✅ 从云端同步了 ${localMeds.length} 种药物`)
    }

    // 拉取服药记录
    const cloudRecords = await recordsDB.getAll()
    if (cloudRecords.length > 0) {
      const records = {}
      cloudRecords.forEach(r => {
        const date = r.date
        if (!records[date]) records[date] = {}
        records[date][r.medicine_id] = { time: r.time }
      })
      safeWrite('records', records)
      console.log(`[Store] ✅ 从云端同步了 ${cloudRecords.length} 条服药记录`)
    }

    // 拉取用户信息
    const cloudUsers = await usersDB.getAll()
    if (cloudUsers.length > 0) {
      const user = cloudUsers[0]
      safeWrite('userInfo', {
        name: user.name,
        age: user.age,
        avatar: user.avatar || '',
        healthNotes: user.health_notes || ''
      })
      console.log(`[Store] ✅ 从云端同步了用户信息`)
    }

    return { synced: true, medicines: cloudMeds.length, records: cloudRecords.length }
  } catch (e) {
    console.error('[Store] 云端同步失败，继续使用本地数据:', e.message)
    return { synced: false, reason: e.message }
  }
}

// ---------- 日期工具 ----------

/** 返回 "YYYY-MM-DD" 格式的日期键 */
export function getDateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 返回 "HH:MM" 格式的当前时间 */
export function getNowTime() {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

/** 根据当前小时返回时段键 */
export function getCurrentPeriod() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

/** 返回当前时间应展示的时段列表 */
export function getVisiblePeriods() {
  const current = getCurrentPeriod()
  const idx = PERIOD_ORDER.indexOf(current)
  return PERIOD_ORDER.slice(0, idx + 1)
}

// ---------- 初始化 ----------

/** 确保 Storage 中存在药物数据，若为空则写入默认值 */
export function initMedicines() {
  const stored = safeRead('medicines', null)
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    safeWrite('medicines', [...DEFAULT_MEDICINES])
    // 同步写入云端
    _cloudWrite('medicines', 'add', { ...DEFAULT_MEDICINES[0], id: '1' })
    return [...DEFAULT_MEDICINES]
  }
  return stored
}

// ---------- 药物 CRUD ----------

/** 获取全部药物列表（同步，读本地缓存） */
export function getMedicines() {
  const stored = safeRead('medicines', null)
  if (stored && Array.isArray(stored) && stored.length > 0) return stored
  safeWrite('medicines', [...DEFAULT_MEDICINES])
  return [...DEFAULT_MEDICINES]
}

/** 按 ID 查找单个药物 */
export function getMedicineById(id) {
  return getMedicines().find(m => m.id === id) || null
}

// ★ localStorage 写入锁——H5 下唯一不受模块重载/生命周期影响的方案
const LOCK_KEY = '__med_store_lock';
const LOCK_TTL = 2000; // 2 秒后自动过期

function isLocked() {
  try {
    const raw = uni.getStorageSync(LOCK_KEY);
    if (!raw) return false;
    return (Date.now() - raw) < LOCK_TTL;
  } catch (_) { return false; }
}
function setLock() {
  try { uni.setStorageSync(LOCK_KEY, Date.now()); } catch (_) {}
}

/** 新增药物 */
export function addMedicine(formData) {
  // 第一层：localStorage 写入锁
  if (isLocked()) {
    console.warn('[Store] 写入锁拦截重复调用')
    return null
  }
  setLock();

  const medicines = getMedicines()
  const now = Date.now()

  // 第二层：内容去重
  const duplicate = medicines.find(m =>
    m.name === (formData.name || '') &&
    m.dosage === (formData.dosage || '') &&
    m.time === (formData.time || '08:00') &&
    m.period === (formData.period || 'morning') &&
    (now - (m._createdAt || 0) < LOCK_TTL)
  )
  if (duplicate) {
    console.warn('[Store] 内容去重拦截:', formData.name)
    return duplicate
  }

  const newId = generateId()
  const newMed = {
    id: newId,
    name: formData.name || '',
    dosage: formData.dosage || '',
    time: formData.time || '08:00',
    period: formData.period || 'morning',
    note: formData.note || '饭后服用',
    icon: formData.icon || pickIcon(),
    _createdAt: now
  }
  medicines.push(newMed)
  safeWrite('medicines', medicines)

  _cloudWrite('medicines', 'add', { ...newMed, _id: newId })

  return newMed
}

/** 更新药物 */
export function updateMedicine(id, formData) {
  const medicines = getMedicines()
  const idx = medicines.findIndex(m => m.id === id)
  if (idx === -1) return null

  medicines[idx] = {
    ...medicines[idx],
    name: formData.name ?? medicines[idx].name,
    dosage: formData.dosage ?? medicines[idx].dosage,
    time: formData.time ?? medicines[idx].time,
    period: formData.period ?? medicines[idx].period,
    note: formData.note ?? medicines[idx].note,
    icon: formData.icon || medicines[idx].icon || pickIcon()
  }
  safeWrite('medicines', medicines)

  // 后台写入云端
  _cloudWrite('medicines', 'update', id, medicines[idx])

  return medicines[idx]
}

/** 删除药物 */
export function deleteMedicine(id) {
  const medicines = getMedicines().filter(m => m.id !== id)
  safeWrite('medicines', medicines)

  // 后台从云端删除
  _cloudWrite('medicines', 'remove', id)

  return medicines
}

// ---------- 服药记录 ----------

/** 获取全部服药记录（同步，读本地） */
export function getRecords() {
  return safeRead('records', {})
}

/** 获取指定日期的服药记录 */
export function getRecordsForDate(dateKey) {
  const records = getRecords()
  return records[dateKey] || {}
}

/** 标记某药物今日已服用 */
export function markTaken(medicineId) {
  const records = getRecords()
  const todayKey = getDateKey(new Date())
  if (!records[todayKey]) {
    records[todayKey] = {}
  }
  const time = getNowTime()
  records[todayKey][medicineId] = { time }
  safeWrite('records', records)

  // 后台写入云端
  const medicine = getMedicineById(medicineId)
  _cloudWrite('records', 'add', {
    medicine_id: medicineId,
    medicine_name: medicine ? medicine.name : '',
    date: todayKey,
    time,
    period: getCurrentPeriod()
  })

  return { dateKey: todayKey, medicineId, time }
}

/** 撤销服药记录 */
export function undoTaken(medicineId, dateKey) {
  const records = getRecords()
  const key = dateKey || getDateKey(new Date())
  if (!records[key] || !records[key][medicineId]) return false

  delete records[key][medicineId]
  if (Object.keys(records[key]).length === 0) {
    delete records[key]
  }
  safeWrite('records', records)

  // 后台从云端删除（需要找到对应的 _id，简化处理）
  console.log('[Store] 云端撤销：', medicineId, key)

  return true
}

/** 判断某药物今日是否已服用 */
export function isTaken(medicineId, dateKey) {
  const key = dateKey || getDateKey(new Date())
  const records = getRecords()
  return !!(records[key] && records[key][medicineId])
}

/** 判断某药物在指定日期是否已服用（批量） */
export function isTakenMap(dateKey) {
  const records = getRecords()
  const dayRecords = records[dateKey] || {}
  const map = {}
  Object.keys(dayRecords).forEach(id => { map[id] = true })
  return map
}

// ---------- 统计 ----------

/** 今日服药统计 */
export function getTodayStats() {
  const medicines = getMedicines()
  const todayKey = getDateKey(new Date())
  const records = getRecords()
  const todayRecords = records[todayKey] || {}
  const total = medicines.length
  const taken = medicines.filter(m => todayRecords[m.id]).length

  return {
    total,
    taken,
    rate: total > 0 ? Math.round((taken / total) * 100) : 0,
    percent: total > 0 ? (taken / total) * 100 : 0,
    text: `${taken}/${total}`,
    detail: _progressDetail(taken, total)
  }
}

/** 本周服药总次数 */
export function getWeekStats() {
  const records = getRecords()
  const medicines = getMedicines()
  let count = 0
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = getDateKey(d)
    const dayRecords = records[key] || {}
    const medIds = new Set(medicines.map(m => m.id))
    count += Object.keys(dayRecords).filter(id => medIds.has(id)).length
  }
  return count
}

/** 指定月份服药总次数 */
export function getMonthStats(year, month) {
  const records = getRecords()
  const medicines = getMedicines()
  const medIds = new Set(medicines.map(m => m.id))
  let count = 0
  const days = new Date(year, month + 1, 0).getDate()
  for (let i = 1; i <= days; i++) {
    const d = new Date(year, month, i)
    const key = getDateKey(d)
    const dayRecords = records[key] || {}
    count += Object.keys(dayRecords).filter(id => medIds.has(id)).length
  }
  return count
}

/** 指定日期服药统计 */
export function getDateStats(dateKey, medicines) {
  const records = getRecords()
  const dayRecords = records[dateKey] || {}
  const total = medicines.length
  const taken = medicines.filter(m => dayRecords[m.id]).length
  return {
    total,
    taken,
    allDone: total > 0 && taken >= total,
    hasRecord: taken > 0,
    records: dayRecords
  }
}

// ---------- 分组工具 ----------

/** 将药物按上午/下午/晚上分组 */
export function groupByPeriod(medicines) {
  const groups = { morning: [], afternoon: [], evening: [] }
  const meds = Array.isArray(medicines) ? medicines : []
  meds.forEach(m => {
    if (m && m.period && groups[m.period]) {
      groups[m.period].push(m)
    }
  })
  return groups
}

/** 判断药物在指定日期是否过期未服 */
export function isOverdue(medicineId, dateKey, medPeriod) {
  if (isTaken(medicineId, dateKey)) return false
  const current = getCurrentPeriod()
  const medIdx = PERIOD_ORDER.indexOf(medPeriod)
  const curIdx = PERIOD_ORDER.indexOf(current)
  return medIdx < curIdx
}

// ---------- 内部辅助 ----------

function _progressDetail(taken, total) {
  if (total === 0) return '还没有添加药物'
  if (taken === 0) return '还没有服药'
  if (taken === total) return '今日服药已完成，真棒！'
  return `已完成 ${taken} 种药物`
}

// 重新导出常量
export { PERIOD_NAMES, PERIOD_ORDER, PERIOD_OPTIONS } from './constants/defaults.js'
