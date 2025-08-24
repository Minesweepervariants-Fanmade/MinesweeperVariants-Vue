import { ref } from 'vue'

// 主题映射（key 为主题名，value 为 body 上使用的 CSS 类名）
const THEME_MAPPING: Record<string, string> = {
  'dark': '',                // 默认深色主题
  'blue': 'theme-blue',      // 蓝色主题
  'amber': 'theme-amber',    // 琥珀色主题
  'forest': 'theme-forest',
  'ocean': 'theme-ocean',
  'sunset': 'theme-sunset',
  'lavender': 'theme-lavender',
  'emerald': 'theme-emerald',
  'slate': 'theme-slate',
  'rose': 'theme-rose',
  'midnight': 'theme-midnight',
  'solar': 'theme-solar',
  'raspberry': 'theme-raspberry',
  'sky': 'theme-sky',
  'cafe': 'theme-cafe',
  'trans': 'theme-trans',
  'image': 'theme-image',
  'custom': 'theme-custom'
}

// 导出可供 UI 使用的主题选项（label 为显示名，value 为设置中使用的 key）
export const THEME_OPTIONS: { label: string; value: string }[] = Object.entries(THEME_MAPPING).map(([key]) => {
  // 简单将 key 转为首字母大写的中文/英文显示名映射（可按需国际化）
  const labelMap: Record<string, string> = {
    dark: '深色',
    blue: '蓝色',
    amber: '琥珀色',
    forest: '森林',
    ocean: '海洋',
    sunset: '夕阳',
    lavender: '薰衣草',
    emerald: '翡翠',
    slate: '岩板',
    rose: '玫瑰',
    midnight: '午夜',
    solar: '日光',
    raspberry: '覆盆子',
    sky: '天空',
    cafe: '咖啡',
    trans: '🏳️‍⚧️跨性别',
    image: '背景图片测试',
    custom: '自定义'
  }

  return {
    label: labelMap[key] || key,
    value: key
  }
})

export function useTheme() {
  function setCustomTheme(customTheme: {
    backgroundColor: string;
    foregroundColor: string;
    errorColor: string;
    hintColor: string;
    hint2Color: string;
    flagColor: string;
    pointerColor: string;
  }) {
    document.body.style.setProperty('--custom-background-color', customTheme.backgroundColor)
    document.body.style.setProperty('--custom-foreground-color', customTheme.foregroundColor)
    document.body.style.setProperty('--custom-error-color', customTheme.errorColor)
    document.body.style.setProperty('--custom-hint-color', customTheme.hintColor)
    document.body.style.setProperty('--custom-hint2-color', customTheme.hint2Color)
    document.body.style.setProperty('--custom-flag-color', customTheme.flagColor)
    document.body.style.setProperty('--custom-pointer-color', customTheme.pointerColor)
  }
  const currentTheme = ref<string>('')
  const themes: string[] = Object.values(THEME_MAPPING)
  let currentThemeIndex = 0

  // 设置主题
  const setTheme = (themeName: string) => {
    const themeClass = THEME_MAPPING[themeName] || ''
    currentTheme.value = themeClass
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
    setCustomTheme,
    toggleTheme,
    getCurrentThemeName,
    setupThemeToggle,
    themeOptions: THEME_OPTIONS
  }
}
