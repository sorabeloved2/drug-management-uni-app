import { createSSRApp } from 'vue'
import App from './App.vue'
import * as Store from './utils/medicine-store.js'

export function createApp() {
  const app = createSSRApp(App)

  // 全局挂载统一数据层
  app.config.globalProperties.$store = Store

  // 全局方法
  app.config.globalProperties.$toast = (title, icon = 'none') => {
    uni.showToast({ title, icon, duration: 2000 })
  }

  app.config.globalProperties.$goTo = (url, type = 'navigate') => {
    switch(type) {
      case 'switchTab':
        uni.switchTab({ url })
        break
      case 'redirect':
        uni.redirectTo({ url })
        break
      case 'back':
        uni.navigateBack({ delta: 1 })
        break
      default:
        uni.navigateTo({ url })
    }
  }

  return { app }
}