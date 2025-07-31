import { ref } from 'vue'
import type { Theme } from '@/types/game'

export function useTheme() {
  const currentTheme = ref<Theme>('')
  const themes: Theme[] = ['', 'theme-blue', 'theme-amber']
  let currentThemeIndex = 0

  // 切换主题
  const toggleTheme = () => {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length
    currentTheme.value = themes[currentThemeIndex]

    // 应用主题到 body
    document.body.className = currentTheme.value
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
    toggleTheme,
    setupThemeToggle
  }
}
