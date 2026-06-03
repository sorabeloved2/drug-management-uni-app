// 将 localStorage 替换为 uni-app 的 storage API
const Storage = {
  get(key, defaultValue = null) {
    try {
      const data = uni.getStorageSync(key);
      return data !== '' ? data : defaultValue;
    } catch(e) {
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      uni.setStorageSync(key, value);
    } catch(e) {
      console.error('Storage set error:', e);
    }
  },
  remove(key) {
    try {
      uni.removeStorageSync(key);
    } catch(e) {
      console.error('Storage remove error:', e);
    }
  }
};

export default Storage;