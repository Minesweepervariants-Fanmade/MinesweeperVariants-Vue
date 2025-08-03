import { ref } from 'vue'
import type { KeyboardShortcuts, MouseShortcuts } from '@/composables/useSettings'

// 快捷键回调函数类型 - 返回布尔值表示是否处理成功
export type KeyboardShortcutCallback = (_event: KeyboardEvent) => boolean
export type MouseShortcutCallback = (_event: MouseEvent | WheelEvent) => boolean

// 回调函数接口，包含优先级
interface KeyboardCallbackEntry {
  callback: KeyboardShortcutCallback
  priority: number // 数字越大优先级越高
}

interface MouseCallbackEntry {
  callback: MouseShortcutCallback
  priority: number // 数字越大优先级越高
}

// 快捷键回调注册 - 每个操作可以有多个回调，按优先级排序
const keyboardCallbacks = ref<Record<string, KeyboardCallbackEntry[]>>({})
const mouseCallbacks = ref<Record<string, MouseCallbackEntry[]>>({})

let keyboardShortcuts: KeyboardShortcuts = {} as KeyboardShortcuts
let mouseShortcuts: MouseShortcuts = {} as MouseShortcuts

export function setShortcuts(kb: KeyboardShortcuts, mouse: MouseShortcuts) {
  keyboardShortcuts = kb
  mouseShortcuts = mouse
}

export function registerKeyboardShortcut(action: string, callback: KeyboardShortcutCallback, priority = 0) {
  if (!keyboardCallbacks.value[action]) keyboardCallbacks.value[action] = []
  keyboardCallbacks.value[action].push({ callback, priority })
  keyboardCallbacks.value[action].sort((a, b) => b.priority - a.priority)
}

export function registerMouseShortcut(action: string, callback: MouseShortcutCallback, priority = 0) {
  if (!mouseCallbacks.value[action]) mouseCallbacks.value[action] = []
  mouseCallbacks.value[action].push({ callback, priority })
  mouseCallbacks.value[action].sort((a, b) => b.priority - a.priority)
}

export function unregisterKeyboardShortcut(action: string, callback?: KeyboardShortcutCallback) {
  if (!keyboardCallbacks.value[action]) return
  if (callback) {
    keyboardCallbacks.value[action] = keyboardCallbacks.value[action].filter(entry => entry.callback !== callback)
    if (keyboardCallbacks.value[action].length === 0) delete keyboardCallbacks.value[action]
  } else {
    delete keyboardCallbacks.value[action]
  }
}

export function unregisterMouseShortcut(action: string, callback?: MouseShortcutCallback) {
  if (!mouseCallbacks.value[action]) return
  if (callback) {
    mouseCallbacks.value[action] = mouseCallbacks.value[action].filter(entry => entry.callback !== callback)
    if (mouseCallbacks.value[action].length === 0) delete mouseCallbacks.value[action]
  } else {
    delete mouseCallbacks.value[action]
  }
}

export function isKeyboardShortcutMatch(event: KeyboardEvent, shortcut: string): boolean {
  if (!shortcut || shortcut.trim() === '') return false
  const eventKeys = []
  if (event.ctrlKey) eventKeys.push('ctrl')
  if (event.shiftKey) eventKeys.push('shift')
  if (event.altKey) eventKeys.push('alt')
  if (event.metaKey) eventKeys.push('meta')
  eventKeys.push(event.key.toLowerCase())
  const eventShortcut = eventKeys.join('+')
  return eventShortcut === shortcut.toLowerCase()
}

export function isMouseShortcutMatch(event: MouseEvent | WheelEvent, shortcut: string): boolean {
  if (!shortcut || shortcut.trim() === '') return false
  const normalizedShortcut = shortcut.toLowerCase().trim()
  if (event instanceof WheelEvent) {
    const parts: string[] = []
    if (event.ctrlKey) parts.push('ctrl')
    if (event.altKey) parts.push('alt')
    if (event.shiftKey) parts.push('shift')
    if (event.metaKey) parts.push('meta')
    parts.push('wheel')
    const eventShortcut = parts.join('+')
    return eventShortcut === normalizedShortcut
  }
  if (event instanceof MouseEvent) {
    const parts: string[] = []
    if (event.ctrlKey) parts.push('ctrl')
    if (event.altKey) parts.push('alt')
    if (event.shiftKey) parts.push('shift')
    if (event.metaKey) parts.push('meta')
    let mouseKey = ''
    if (event.button === 0) mouseKey = 'left'
    else if (event.button === 1) mouseKey = 'middle'
    else if (event.button === 2) mouseKey = 'right'
    else if (event.button === 3) mouseKey = 'mb4'
    else if (event.button === 4) mouseKey = 'mb5'
    if (mouseKey) {
      parts.push(mouseKey)
      const eventShortcut = parts.join('+')
      return eventShortcut === normalizedShortcut
    }
  }
  return false
}

function getMatchedShortcuts<T extends { action: string; shortcut: string; complexity: number }>(allShortcuts: Record<string, string>, matchFn: (_shortcut: string) => boolean): T[] {
  const matched: T[] = []
  Object.entries(allShortcuts).forEach(([action, shortcut]) => {
    if (matchFn(shortcut)) {
      const complexity = shortcut.split('+').length
      matched.push({ action, shortcut, complexity } as T)
    }
  })
  matched.sort((a, b) => b.complexity - a.complexity)
  return matched
}

export function handleGlobalKeyUp(event: KeyboardEvent) {
  if (event.target && (event.target as HTMLElement).tagName === 'INPUT') return
  const matchedShortcuts = getMatchedShortcuts<{ action: string; shortcut: string; complexity: number }>(keyboardShortcuts, s => isKeyboardShortcutMatch(event, s))
  for (const { action } of matchedShortcuts) {
    const callbackEntries = keyboardCallbacks.value[action]
    if (callbackEntries && callbackEntries.length > 0) {
      for (const entry of callbackEntries) {
        try {
          const handled = entry.callback(event)
          if (handled) {
            event.preventDefault()
            return
          }
        } catch (error) {
          console.error(`Error in keyboard shortcut callback for action "${action}":`, error)
        }
      }
    }
  }
}

export function handleGlobalMouse(event: MouseEvent) {
  const matchedShortcuts = getMatchedShortcuts<{ action: string; shortcut: string; complexity: number }>(mouseShortcuts, s => isMouseShortcutMatch(event, s))
  for (const { action } of matchedShortcuts) {
    const callbackEntries = mouseCallbacks.value[action]
    if (callbackEntries && callbackEntries.length > 0) {
      for (const entry of callbackEntries) {
        try {
          const handled = entry.callback(event)
          if (handled) {
            event.preventDefault()
            return
          }
        } catch (error) {
          console.error(`Error in mouse shortcut callback for action "${action}":`, error)
        }
      }
    }
  }
}

export function handleGlobalWheel(event: WheelEvent) {
  const matchedShortcuts = getMatchedShortcuts<{ action: string; shortcut: string; complexity: number }>(mouseShortcuts, s => isMouseShortcutMatch(event, s))
  for (const { action } of matchedShortcuts) {
    const callbackEntries = mouseCallbacks.value[action]
    if (callbackEntries && callbackEntries.length > 0) {
      for (const entry of callbackEntries) {
        try {
          const handled = entry.callback(event)
          if (handled) {
            event.preventDefault()
            return
          }
        } catch (error) {
          console.error(`Error in wheel shortcut callback for action "${action}":`, error)
        }
      }
    }
  }
}

export function clearAllShortcuts() {
  keyboardCallbacks.value = {}
  mouseCallbacks.value = {}
}
