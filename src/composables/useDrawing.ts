import { ref, reactive } from 'vue'
import type { DrawingState, DrawingTool, DrawingPath } from '@/types/drawing'

// 创建全局绘图状态实例
let drawingInstance: ReturnType<typeof createDrawingInstance> | null = null

function createDrawingInstance() {
  const state = reactive<DrawingState>({
    currentTool: 'brush',
    currentColor: '#FF0000',
    currentSize: 5,
    isDrawing: false,
    paths: [],
    historyIndex: -1
  })

  const history = ref<DrawingPath[][]>([])
  const maxHistorySize = 25

  // 保存到历史记录
  const saveToHistory = () => {
    // 移除当前位置之后的历史记录
    history.value = history.value.slice(0, state.historyIndex + 1)

    // 深拷贝当前状态，保留可见性信息
    const pathsCopy = state.paths.map(path => ({
      ...path,
      points: [...path.points],
      visible: path.visible !== undefined ? path.visible : true
    }))

    // 添加当前状态
    history.value.push(pathsCopy)
    state.historyIndex++

    // 限制历史记录大小
    if (history.value.length > maxHistorySize) {
      history.value.shift()
      state.historyIndex-- // 调整索引以保持正确的位置
    }
  }

  // 撤销
  const undo = () => {
    if (state.historyIndex > 0) {
      state.historyIndex--
      // 深拷贝历史状态以避免引用问题
      state.paths = history.value[state.historyIndex].map(path => ({
        ...path,
        points: [...path.points],
        visible: path.visible !== undefined ? path.visible : true
      }))
    } else if (state.historyIndex === 0) {
      state.historyIndex = -1
      state.paths = []
    }
  }

  // 重做
  const redo = () => {
    if (state.historyIndex < history.value.length - 1) {
      state.historyIndex++
      // 深拷贝历史状态以避免引用问题
      state.paths = history.value[state.historyIndex].map(path => ({
        ...path,
        points: [...path.points],
        visible: path.visible !== undefined ? path.visible : true
      }))
    }
  }

  // 清空画板
  const clear = () => {
    if (!clearCurrentColor()) {
      clearAll()
    }
  }

  // 清空当前颜色
  const clearCurrentColor = () => {
    let anyCleared = false
    state.paths.forEach(path => {
      if (path.color === state.currentColor) {
        path.visible = false
        anyCleared = true
      }
    })
    if (anyCleared) {
      saveToHistory()
      return true
    }
  }

  // 清空整个画板
  const clearAll = () => {
    let anyCleared = false
    state.paths.forEach(path => {
      path.visible = false
      anyCleared = true
    })
    if (anyCleared) {
      saveToHistory()
      return true
    }
  }

  // 切换工具
  const setTool = (tool: DrawingTool) => {
    state.currentTool = tool
  }

  // 设置颜色
  const setColor = (color: string) => {
    state.currentColor = color
  }

  // 设置画笔大小
  const setSize = (size: number) => {
    const clampedSize = Math.max(1, Math.min(50, size))

    // 只对画笔和圆形标记工具设置尺寸
    if (state.currentTool === 'brush' || state.currentTool === 'circle-marker') {
      state.currentSize = clampedSize
    }
  }

  return {
    // 状态
    state,

    // 方法
    undo,
    redo,
    clear,
    setTool,
    setColor,
    setSize,
    saveToHistory  // 暴露 saveToHistory 方法
  }
}

export function useDrawing() {
  if (!drawingInstance) {
    drawingInstance = createDrawingInstance()
  }
  return drawingInstance
}
