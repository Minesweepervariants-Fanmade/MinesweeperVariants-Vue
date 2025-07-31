import { ref } from 'vue'
import type { Theme } from '@/types/game'

// 主题映射
const THEME_MAPPING: Record<string, string> = {
  'dark': '',           // 默认深色主题
  'blue': 'theme-blue', // 蓝色主题
  'amber': 'theme-amber' // 琥珀色主题
}

export function useTheme() {
  const currentTheme = ref<Theme>('')
  const themes: Theme[] = ['', 'theme-blue', 'theme-amber']
  let currentThemeIndex = 0

  // 设置主题
  const setTheme = (themeName: string) => {
    const themeClass = THEME_MAPPING[themeName] || ''
    currentTheme.value = themeClass as Theme
    document.body.className = currentTheme.value

    // 更新当前主题索引
    currentThemeIndex = themes.indexOf(currentTheme.value)
  }

  // 切换主题
  const toggleTheme = () => {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length
    currentTheme.value = themes[currentThemeIndex]

    // 应用主题到 body
    document.body.className = currentTheme.value
  }

  // 获取当前主题名称
  const getCurrentThemeName = (): string => {
    for (const [name, className] of Object.entries(THEME_MAPPING)) {
      if (className === currentTheme.value) {
        return name
      }
    }
    return 'dark' // 默认主题
  }

  // 设置主题切换（用于外部手动注册）
  const setupThemeToggle = () => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'T' || e.key === 't') {
        toggleTheme()
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }

  return {
    currentTheme,
    setTheme,
    toggleTheme,
    getCurrentThemeName,
    setupThemeToggle
  }
}
