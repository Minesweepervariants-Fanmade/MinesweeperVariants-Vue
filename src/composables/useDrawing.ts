import { ref, reactive } from 'vue'
import type { DrawingState, DrawingTool, DrawingPath, DrawingPoint, CanvasSize } from '@/types/drawing'

// 创建全局绘图状态实例
let drawingInstance: ReturnType<typeof createDrawingInstance> | null = null

function createDrawingInstance() {
  const canvas = ref<HTMLCanvasElement | null>(null)
  const ctx = ref<CanvasRenderingContext2D | null>(null)

  // 固定逻辑尺寸比例 (4:3)
  const LOGICAL_MAX_WIDTH = 320
  const LOGICAL_MAX_HEIGHT = 240

  const state = reactive<DrawingState>({
    currentTool: 'brush',
    currentColor: '#000000',
    currentSize: 5,
    brushSize: 5,     // 画笔默认尺寸
    eraserSize: 10,   // 橡皮默认尺寸（通常比画笔大一些）
    isDrawing: false,
    paths: [],
    historyIndex: -1
  })

  const currentPath = ref<DrawingPoint[]>([])
  const history = ref<DrawingPath[][]>([])
  const maxHistorySize = 25
  const clearClickCount = ref(0)
  let clearTimeout: number | null = null

  // 画布尺寸管理
  const canvasSize = ref<CanvasSize>({
    logical: { width: LOGICAL_MAX_WIDTH, height: LOGICAL_MAX_HEIGHT },
    display: { width: 0, height: 0 },
    scale: { x: 1, y: 1 }
  })

  // 计算适合的画布尺寸
  const calculateCanvasSize = (containerWidth: number, containerHeight: number): CanvasSize => {
    // 画布充满整个容器，不保持固定比例
    const displayWidth = containerWidth
    const displayHeight = containerHeight

    return {
      logical: { width: LOGICAL_MAX_WIDTH, height: LOGICAL_MAX_HEIGHT },
      display: { width: displayWidth, height: displayHeight },
      scale: {
        x: displayWidth / LOGICAL_MAX_WIDTH,
        y: displayHeight / LOGICAL_MAX_HEIGHT
      }
    }
  }

  const drawCircleBrush = (point: DrawingPoint) => {
    if (!ctx.value) return

    // 计算用户视角圆形在逻辑坐标系中的椭圆半径
    const userRadius = state.currentSize / 2
    const radiusX = userRadius / canvasSize.value.scale.x
    const radiusY = userRadius / canvasSize.value.scale.y

    ctx.value.beginPath()
    ctx.value.ellipse(point.x, point.y, radiusX, radiusY, 0, 0, 2 * Math.PI)
    ctx.value.fill()
  }

  // 绘制圆形橡皮（用户视角圆形 -> 逻辑画布椭圆）
  const drawCircleEraser = (point: DrawingPoint) => {
    if (!ctx.value) return

    // 计算用户视角圆形在逻辑坐标系中的椭圆半径
    const userRadius = state.currentSize / 2
    const radiusX = userRadius / canvasSize.value.scale.x
    const radiusY = userRadius / canvasSize.value.scale.y

    ctx.value.beginPath()
    ctx.value.ellipse(point.x, point.y, radiusX, radiusY, 0, 0, 2 * Math.PI)
    ctx.value.fill()
  }

  // 在两点之间绘制连续的圆形
  const drawCircleLine = (from: DrawingPoint, to: DrawingPoint, isEraser: boolean = false) => {
    if (!ctx.value) return

    const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2))
    const steps = Math.ceil(distance / (state.currentSize / 4)) // 密集绘制以保证连续性

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = from.x + (to.x - from.x) * t
      const y = from.y + (to.y - from.y) * t

      if (isEraser) {
        drawCircleEraser({ x, y })
      } else {
        drawCircleBrush({ x, y })
      }
    }
  }

  // 初始化Canvas
  const initCanvas = (canvasElement: HTMLCanvasElement, _initialSize?: { width: number; height: number }) => {
    canvas.value = canvasElement
    ctx.value = canvasElement.getContext('2d', { willReadFrequently: true })

    if (ctx.value) {
      ctx.value.lineCap = 'round'
      ctx.value.lineJoin = 'round'

      // 使用整个屏幕尺寸，不考虑initialSize参数
      const containerWidth = window.innerWidth
      const containerHeight = window.innerHeight

      canvasSize.value = calculateCanvasSize(containerWidth, containerHeight)

      // 设置Canvas的内部分辨率为逻辑尺寸
      canvasElement.width = canvasSize.value.logical.width
      canvasElement.height = canvasSize.value.logical.height

      // 设置Canvas的CSS显示尺寸为整个屏幕
      canvasElement.style.width = `${canvasSize.value.display.width}px`
      canvasElement.style.height = `${canvasSize.value.display.height}px`

      // 设置CSS样式以实现锐利边缘缩放
      canvasElement.style.imageRendering = 'crisp-edges'
      canvasElement.style.imageRendering = '-webkit-optimize-contrast'
      canvasElement.style.imageRendering = 'pixelated'
    } else {
      console.error('useDrawing: 无法获取Canvas Context')
    }
  }  // 开始绘画
  const startDrawing = (event: MouseEvent | TouchEvent) => {
    if (!canvas.value || !ctx.value) return

    const logicalPoint = getEventPoint(event)  // 直接获取逻辑坐标

    if (state.currentTool === 'magic-eraser') {
      state.isDrawing = true
      return
    }

    state.isDrawing = true
    currentPath.value = [logicalPoint]

    if (state.currentTool === 'brush' || state.currentTool === 'circle-marker') {
      ctx.value.strokeStyle = state.currentColor
      ctx.value.fillStyle = state.currentColor
      ctx.value.globalCompositeOperation = 'source-over'
    }

    // 绘制起始点的圆形
    if (state.currentTool === 'brush') {
      drawCircleBrush(logicalPoint)
    } else if (state.currentTool === 'circle-marker') {
      // 圆形标记不在开始时绘制
    }
  }

  // 继续绘画
  const continueDrawing = (event: MouseEvent | TouchEvent) => {
    if (!state.isDrawing || !ctx.value) return

    const logicalPoint = getEventPoint(event)  // 直接获取逻辑坐标

    if (state.currentTool === 'magic-eraser') {
      return
    }

    const lastPoint = currentPath.value[currentPath.value.length - 1]
    currentPath.value.push(logicalPoint)

    if (state.currentTool === 'circle-marker') {
      // 圆形标记模式 - 不绘制路径，只在结束时绘制圆形
      return
    }

    // 在上一个点和当前点之间绘制连续的圆形
    if (state.currentTool === 'brush') {
      drawCircleLine(lastPoint, logicalPoint, false)
    } else if (state.currentTool === 'eraser') {
      drawCircleLine(lastPoint, logicalPoint, true)
    }
  }

  // 结束绘画
  const stopDrawing = () => {
    if (!state.isDrawing || !ctx.value) return

    if (state.currentTool === 'magic-eraser') {
      state.isDrawing = false
      return
    }

    state.isDrawing = false

    if (state.currentTool === 'circle-marker' && currentPath.value.length > 0) {
      // 绘制圆形标记 - 用户视角圆形转换为逻辑画布椭圆
      const firstLogical = currentPath.value[0]
      const lastLogical = currentPath.value[currentPath.value.length - 1]
      const logicalRadius = Math.sqrt(
        Math.pow(lastLogical.x - firstLogical.x, 2) + Math.pow(lastLogical.y - firstLogical.y, 2)
      ) || state.currentSize

      // 将逻辑半径转换为用户视角半径，然后再转换回椭圆
      const userRadiusX = logicalRadius * canvasSize.value.scale.x
      const userRadiusY = logicalRadius * canvasSize.value.scale.y
      const userRadius = Math.sqrt(userRadiusX * userRadiusY) // 取几何平均值作为用户视角半径

      // 转换为逻辑椭圆半径
      const ellipseRadiusX = userRadius / canvasSize.value.scale.x
      const ellipseRadiusY = userRadius / canvasSize.value.scale.y

      ctx.value.strokeStyle = state.currentColor
      ctx.value.lineWidth = state.currentSize / Math.min(canvasSize.value.scale.x, canvasSize.value.scale.y)
      ctx.value.globalCompositeOperation = 'source-over'
      ctx.value.beginPath()
      ctx.value.ellipse(firstLogical.x, firstLogical.y, ellipseRadiusX, ellipseRadiusY, 0, 0, 2 * Math.PI)
      ctx.value.stroke()
    }

    // 保存路径到历史记录
    if (currentPath.value.length > 0) {
      const path: DrawingPath = {
        points: [...currentPath.value],
        color: state.currentColor,
        size: state.currentSize,
        tool: state.currentTool,
        timestamp: Date.now()
      }

      state.paths.push(path)
      saveToHistory()
    }

    currentPath.value = []
  }

  // 获取事件坐标（直接返回逻辑坐标）
  const getEventPoint = (event: MouseEvent | TouchEvent): DrawingPoint => {
    if (!canvas.value) return { x: 0, y: 0 }

    const rect = canvas.value.getBoundingClientRect()
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

    // 获取相对于Canvas的显示坐标
    const displayX = clientX - rect.left
    const displayY = clientY - rect.top

    // 转换为逻辑坐标
    const logicalX = (displayX / rect.width) * canvasSize.value.logical.width
    const logicalY = (displayY / rect.height) * canvasSize.value.logical.height

    return {
      x: logicalX,
      y: logicalY
    }
  }



  // 处理画布尺寸变化和缩放
  const handleCanvasResize = (_scaleX: number, _scaleY: number, _newWidth: number, _newHeight: number) => {
    if (!canvas.value) return

    // 重新计算画布尺寸，使用当前窗口尺寸
    const containerWidth = window.innerWidth
    const containerHeight = window.innerHeight
    canvasSize.value = calculateCanvasSize(containerWidth, containerHeight)

    // Canvas内部分辨率保持逻辑尺寸不变
    canvas.value.width = canvasSize.value.logical.width
    canvas.value.height = canvasSize.value.logical.height

    // 更新CSS显示尺寸为整个屏幕
    canvas.value.style.width = `${canvasSize.value.display.width}px`
    canvas.value.style.height = `${canvasSize.value.display.height}px`

    // 重绘画布
    redrawCanvas()
  }  // 保存到历史记录
  const saveToHistory = () => {
    // 移除当前位置之后的历史记录
    history.value = history.value.slice(0, state.historyIndex + 1)

    // 添加当前状态
    history.value.push([...state.paths])
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
      state.paths = [...history.value[state.historyIndex]]
      redrawCanvas()
    } else if (state.historyIndex === 0) {
      state.historyIndex = -1
      state.paths = []
      clearCanvas()
    }
  }

  // 重做
  const redo = () => {
    if (state.historyIndex < history.value.length - 1) {
      state.historyIndex++
      state.paths = [...history.value[state.historyIndex]]
      redrawCanvas()
    }
  }

  // 清空画板
  const clear = () => {
    clearClickCount.value++

    if (clearTimeout) {
      window.clearTimeout(clearTimeout)
    }

    clearTimeout = window.setTimeout(() => {
      if (clearClickCount.value === 1) {
        // 第一次点击：清空当前颜色
        clearCurrentColor()
      } else {
        // 第二次点击：清空整个画板
        clearAll()
      }
      clearClickCount.value = 0
    }, 300)
  }

  // 清空当前颜色
  const clearCurrentColor = () => {
    state.paths = state.paths.filter(path => path.color !== state.currentColor)
    redrawCanvas()
    saveToHistory()
  }

  // 清空整个画板
  const clearAll = () => {
    state.paths = []
    clearCanvas()
    saveToHistory()
  }

  // 清空Canvas
  const clearCanvas = () => {
    if (!canvas.value || !ctx.value) return
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
  }

  // 重绘Canvas
  const redrawCanvas = () => {
    if (!canvas.value || !ctx.value) {
      return
    }

    clearCanvas()

    for (const path of state.paths) {
      if (path.points.length === 0) continue

      if (path.tool === 'magic-eraser') {
        continue
      }

      ctx.value.globalCompositeOperation = 'source-over'
      ctx.value.fillStyle = path.color
      ctx.value.strokeStyle = path.color

      if (path.tool === 'circle-marker' && path.points.length >= 2) {
        // 绘制圆形标记
        const firstLogical = path.points[0]
        const lastLogical = path.points[path.points.length - 1]
        const logicalRadius = Math.sqrt(
          Math.pow(lastLogical.x - firstLogical.x, 2) + Math.pow(lastLogical.y - firstLogical.y, 2)
        )

        // 将逻辑半径转换为用户视角半径，然后再转换回椭圆
        const userRadiusX = logicalRadius * canvasSize.value.scale.x
        const userRadiusY = logicalRadius * canvasSize.value.scale.y
        const userRadius = Math.sqrt(userRadiusX * userRadiusY) // 取几何平均值作为用户视角半径

        // 转换为逻辑椭圆半径
        const ellipseRadiusX = userRadius / canvasSize.value.scale.x
        const ellipseRadiusY = userRadius / canvasSize.value.scale.y

        ctx.value.lineWidth = path.size / Math.min(canvasSize.value.scale.x, canvasSize.value.scale.y)
        ctx.value.beginPath()
        ctx.value.ellipse(firstLogical.x, firstLogical.y, ellipseRadiusX, ellipseRadiusY, 0, 0, 2 * Math.PI)
        ctx.value.stroke()
      } else if (path.tool === 'brush') {
        // 绘制椭圆画笔路径
        const userRadius = path.size / 2
        const radiusX = userRadius / canvasSize.value.scale.x
        const radiusY = userRadius / canvasSize.value.scale.y

        if (path.points.length === 1) {
          // 单点
          const point = path.points[0]
          ctx.value.beginPath()
          ctx.value.ellipse(point.x, point.y, radiusX, radiusY, 0, 0, 2 * Math.PI)
          ctx.value.fill()
        } else {
          // 多点路径 - 在每两个点之间绘制连续椭圆
          for (let i = 0; i < path.points.length; i++) {
            const point = path.points[i]
            ctx.value.beginPath()
            ctx.value.ellipse(point.x, point.y, radiusX, radiusY, 0, 0, 2 * Math.PI)
            ctx.value.fill()

            // 在相邻点之间填充
            if (i > 0) {
              const prevPoint = path.points[i - 1]
              const distance = Math.sqrt(Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2))
              const steps = Math.ceil(distance / (Math.min(radiusX, radiusY) / 2))

              for (let j = 1; j < steps; j++) {
                const t = j / steps
                const x = prevPoint.x + (point.x - prevPoint.x) * t
                const y = prevPoint.y + (point.y - prevPoint.y) * t

                ctx.value.beginPath()
                ctx.value.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI)
                ctx.value.fill()
              }
            }
          }
        }
      }
    }
  }

  // 更新当前尺寸（根据工具类型）
  const updateCurrentSize = () => {
    if (state.currentTool === 'brush' || state.currentTool === 'circle-marker') {
      state.currentSize = state.brushSize
    } else if (state.currentTool === 'magic-eraser') {
      state.currentSize = state.eraserSize
    }
  }

  // 切换工具
  const setTool = (tool: DrawingTool) => {
    state.currentTool = tool
    updateCurrentSize()
  }

  // 设置颜色
  const setColor = (color: string) => {
    state.currentColor = color
  }

  // 设置画笔大小
  const setSize = (size: number) => {
    const clampedSize = Math.max(1, Math.min(50, size))

    // 根据当前工具类型存储到相应的尺寸变量
    if (state.currentTool === 'brush' || state.currentTool === 'circle-marker') {
      state.brushSize = clampedSize
    } else if (state.currentTool === 'magic-eraser') {
      state.eraserSize = clampedSize
    }

    // 更新当前尺寸
    state.currentSize = clampedSize
  }

  // 直接设置画笔尺寸
  const setBrushSize = (size: number) => {
    state.brushSize = Math.max(1, Math.min(50, size))
    // 如果当前是画笔工具，同时更新当前尺寸
    if (state.currentTool === 'brush' || state.currentTool === 'circle-marker') {
      state.currentSize = state.brushSize
    }
  }

  // 直接设置橡皮尺寸
  const setEraserSize = (size: number) => {
    state.eraserSize = Math.max(1, Math.min(50, size))
    // 如果当前是魔术橡皮工具，同时更新当前尺寸
    if (state.currentTool === 'magic-eraser') {
      state.currentSize = state.eraserSize
    }
  }

  return {
    // 状态
    state,
    canvas,
    canvasSize,

    // 方法
    initCanvas,
    startDrawing,
    continueDrawing,
    stopDrawing,
    undo,
    redo,
    clear,
    setTool,
    setColor,
    setSize,
    setBrushSize,
    setEraserSize,
    redrawCanvas,
    handleCanvasResize
  }
}

export function useDrawing() {
  if (!drawingInstance) {
    drawingInstance = createDrawingInstance()
  }
  return drawingInstance
}
