/**
 * 云数据库封装层
 *
 * 自动检测 uniCloud 是否可用：
 *   ✅ 可用 → 读写 uniCloud 数据库
 *   ❌ 不可用 → 降级到本地 Storage（现有逻辑零改动）
 *
 * 用法：
 *   import CloudDB from '@/utils/cloud-db.js'
 *   const db = CloudDB.collection('medicines')
 *   const list = await db.getAll()
 */

import Storage from './storage/index.js'

// ======================== uniCloud 检测 ========================

let _cloudReady = null

function checkCloud() {
  if (_cloudReady !== null) return _cloudReady
  try {
    if (typeof uniCloud !== 'undefined' && uniCloud.database) {
      uniCloud.database() // 尝试获取数据库实例
      _cloudReady = true
      console.log('[CloudDB] ✅ uniCloud 数据库已就绪')
    } else {
      _cloudReady = false
      console.log('[CloudDB] ⚠️ uniCloud 不可用，使用本地存储')
    }
  } catch (e) {
    _cloudReady = false
    console.log('[CloudDB] ⚠️ uniCloud 初始化失败:', e.message, '→ 使用本地存储')
  }
  return _cloudReady
}

// ======================== 本地存储操作 ========================

const localOps = {
  getAll(key) {
    const data = Storage.get(key)
    if (Array.isArray(data)) return data
    if (data && typeof data === 'object') {
      // 转为数组格式（records 是对象）
      return Object.entries(data).map(([id, val]) => ({ _id: id, ...val }))
    }
    return []
  },

  getById(key, id) {
    const all = this.getAll(key)
    return all.find(item => item._id === id) || null
  },

  add(key, data) {
    const all = Storage.get(key) || (key === 'records' ? {} : [])
    const _id = `${key}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const item = { _id, ...data, created_at: new Date().toISOString() }

    if (Array.isArray(all)) {
      all.push(item)
    } else {
      all[_id] = data
    }
    Storage.set(key, all)
    return item
  },

  update(key, id, data) {
    const all = Storage.get(key) || (key === 'records' ? {} : [])
    if (Array.isArray(all)) {
      const idx = all.findIndex(item => item._id === id || item.id === id)
      if (idx === -1) return null
      all[idx] = { ...all[idx], ...data, updated_at: new Date().toISOString() }
    } else {
      if (!all[id]) return null
      all[id] = { ...all[id], ...data, updated_at: new Date().toISOString() }
    }
    Storage.set(key, all)
    return { _id: id, ...data }
  },

  remove(key, id) {
    const all = Storage.get(key) || (key === 'records' ? {} : [])
    if (Array.isArray(all)) {
      Storage.set(key, all.filter(item => item._id !== id && item.id !== id))
    } else {
      delete all[id]
      Storage.set(key, all)
    }
    return true
  },

  setAll(key, data) {
    Storage.set(key, data)
  }
}

// ======================== 云端操作 ========================

const cloudOps = {
  _db() {
    return uniCloud.database()
  },

  async getAll(collectionName) {
    const res = await this._db().collection(collectionName).get()
    return res.result?.data || []
  },

  async getById(collectionName, id) {
    const res = await this._db().collection(collectionName).doc(id).get()
    return res.result?.data?.[0] || null
  },

  async add(collectionName, data) {
    const res = await this._db().collection(collectionName).add(data)
    return { _id: res.result?.id || res.id, ...data }
  },

  async update(collectionName, id, data) {
    await this._db().collection(collectionName).doc(id).update({
      ...data,
      updated_at: new Date()
    })
    return { _id: id, ...data }
  },

  async remove(collectionName, id) {
    await this._db().collection(collectionName).doc(id).remove()
    return true
  },

  async where(collectionName, query) {
    let coll = this._db().collection(collectionName)
    Object.entries(query).forEach(([key, val]) => {
      coll = coll.where({ [key]: val })
    })
    const res = await coll.get()
    return res.result?.data || []
  }
}

// ======================== 统一接口 ========================

/**
 * 获取集合引用
 * @param {string} name — 集合名称
 * @param {string} storageKey — 本地存储键名（降级时使用）
 */
export function collection(name, storageKey) {
  const localKey = storageKey || name
  const useCloud = checkCloud()

  return {
    /** 获取全部数据 */
    async getAll() {
      if (useCloud) {
        try { return await cloudOps.getAll(name) } catch (e) {
          console.error(`[CloudDB] 云端读取 ${name} 失败，降级本地:`, e.message)
        }
      }
      return localOps.getAll(localKey)
    },

    /** 按 ID 获取单条 */
    async getById(id) {
      if (useCloud) {
        try { return await cloudOps.getById(name, id) } catch (e) {
          console.error(`[CloudDB] 云端读取 ${name}/${id} 失败:`, e.message)
        }
      }
      return localOps.getById(localKey, id)
    },

    /** 新增一条 */
    async add(data) {
      if (useCloud) {
        try { return await cloudOps.add(name, data) } catch (e) {
          console.error(`[CloudDB] 云端写入 ${name} 失败，降级本地:`, e.message)
        }
      }
      return localOps.add(localKey, data)
    },

    /** 更新一条 */
    async update(id, data) {
      if (useCloud) {
        try { return await cloudOps.update(name, id, data) } catch (e) {
          console.error(`[CloudDB] 云端更新 ${name}/${id} 失败:`, e.message)
        }
      }
      return localOps.update(localKey, id, data)
    },

    /** 删除一条 */
    async remove(id) {
      if (useCloud) {
        try { return await cloudOps.remove(name, id) } catch (e) {
          console.error(`[CloudDB] 云端删除 ${name}/${id} 失败:`, e.message)
        }
      }
      return localOps.remove(localKey, id)
    },

    /** 条件查询 */
    async where(query) {
      if (useCloud) {
        try { return await cloudOps.where(name, query) } catch (e) {
          console.error(`[CloudDB] 云端查询 ${name} 失败:`, e.message)
        }
      }
      // 本地简易过滤
      const all = localOps.getAll(localKey)
      return all.filter(item =>
        Object.entries(query).every(([k, v]) => item[k] === v)
      )
    },

    /** 检查是否在云端 */
    get isCloud() { return useCloud }
  }
}

// ======================== 数据迁移 ========================

/**
 * 将本地数据迁移到云端（首次连接 uniCloud 时调用）
 */
export async function migrateToCloud() {
  if (!checkCloud()) {
    console.log('[CloudDB] uniCloud 不可用，跳过迁移')
    return { migrated: false, reason: 'uniCloud 不可用' }
  }

  const results = { medicines: 0, records: 0, users: 0 }
  const migrations = [
    { name: 'medicines', localKey: 'medicines' },
    { name: 'records', localKey: 'records' },
    { name: 'users', localKey: 'userInfo' }
  ]

  for (const { name, localKey } of migrations) {
    try {
      const localData = Storage.get(localKey)
      if (!localData) continue

      // 检查云端是否已有数据（简单判断：有数据就跳过）
      const cloudData = await cloudOps.getAll(name)
      if (cloudData.length > 0) {
        console.log(`[CloudDB] ${name} 云端已有 ${cloudData.length} 条，跳过迁移`)
        continue
      }

      // 执行迁移
      if (Array.isArray(localData)) {
        for (const item of localData) {
          await cloudOps.add(name, item)
          results[name]++
        }
      } else if (typeof localData === 'object') {
        // records 是对象格式
        for (const [key, value] of Object.entries(localData)) {
          if (typeof value === 'object') {
            await cloudOps.add(name, { ...value, date: key })
            results[name]++
          } else {
            await cloudOps.add(name, { key, value })
            results[name]++
          }
        }
      }

      console.log(`[CloudDB] ✅ ${name} 迁移完成：${results[name]} 条`)
    } catch (e) {
      console.error(`[CloudDB] ❌ ${name} 迁移失败:`, e.message)
    }
  }

  return { migrated: true, ...results }
}

export default { collection, migrateToCloud, checkCloud }
