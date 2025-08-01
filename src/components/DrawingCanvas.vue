<template>
  <div class="drawing-canvas-container">
    <!-- 主画布 - 使用SVG -->
    <svg
      ref="svgRef"
      class="drawing-canvas"
      :viewBox="viewBox"
      preserveAspectRatio="none"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      @contextmenu="handleContextMenu"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- 渲染所有完成的路径 -->
      <g v-for="(path, index) in visiblePaths" :key="`path-${index}-${path.timestamp}`">
        <!-- 画笔路径 -->
        <path
          v-if="path.tool === 'brush'"
          :d="generatePathData(path)"
          fill="none"
          :stroke="path.color"
          :stroke-width="getActualStrokeWidth(path.size)"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="drawing-path"
        />

        <!-- 圆形标记 -->
        <circle
          v-else-if="path.tool === 'circle-marker' && path.points.length >= 2"
          :cx="path.points[0].x"
          :cy="path.points[0].y"
          :r="getCircleRadius(path)"
          :fill="'none'"
          :stroke="path.color"
          :stroke-width="getActualStrokeWidth(path.size)"
          class="drawing-circle"
        />
      </g>

      <!-- 当前正在绘制的路径 -->
      <g v-if="currentPathData && drawing.state.isDrawing">
        <!-- 当前画笔路径 -->
        <path
          v-if="drawing.state.currentTool === 'brush'"
          :d="currentPathData"
          fill="none"
          :stroke="drawing.state.currentColor"
          :stroke-width="getActualStrokeWidth(drawing.state.currentSize)"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="drawing-path current-path"
        />

        <!-- 当前圆形标记预览 -->
        <circle
          v-else-if="drawing.state.currentTool === 'circle-marker' && currentPoints.length >= 1"
          :cx="currentPoints[0].x"
          :cy="currentPoints[0].y"
          :r="getCurrentCircleRadius()"
          fill="none"
          :stroke="drawing.state.currentColor"
          :stroke-width="getActualStrokeWidth(drawing.state.currentSize)"
          stroke-dasharray="5,5"
          class="drawing-circle current-circle"
        />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { DrawingPoint, DrawingPath, DrawingTool } from '@/types/drawing'
import { useDrawing } from '@/composables/useDrawing'

const drawing = useDrawing()

const svgRef = ref<SVGSVGElement | null>(null)
const currentPoints = ref<DrawingPoint[]>([])
const lastMousePosition = ref<DrawingPoint | null>(null)
const hoverPosition = ref<DrawingPoint | null>(null)

// 右键临时魔术橡皮状态
const isRightClickErasing = ref(false)
const originalTool = ref<DrawingTool>('brush')

// 画布尺寸状态
const canvasWidth = ref(window.innerWidth)
const canvasHeight = ref(window.innerHeight)

// 存储第一个题板的初始位置信息
const initialBoardRect = ref<DOMRect | null>(null)

// SVG视窗配置 - 使用实际的窗口尺寸
const viewBox = computed(() => {
  return `0 0 ${canvasWidth.value} ${canvasHeight.value}`
})

// 获取要删除的路径（仅魔术橡皮）
const pathsToDelete = ref<Set<number>>(new Set())

// 计算可见路径（处理魔术橡皮擦除逻辑）
const visiblePaths = computed(() => {
  const allPaths = drawing.state.paths

  // 过滤掉要删除的路径和橡皮工具路径
  return allPaths.filter((path, index) => {
    // 排除魔术橡皮工具本身的路径
    if (path.tool === 'magic-eraser') {
      return false
    }

    // 检查路径的可见性 (默认为 true)
    if (path.visible === false) {
      return false
    }

    // 排除被标记为删除的路径（仅用于当前操作预览）
    if (pathsToDelete.value.has(index)) {
      return false
    }

    // 只显示画笔和圆形标记路径
    return path.tool === 'brush' || path.tool === 'circle-marker'
  })
})

// 当前正在绘制的路径数据
const currentPathData = computed(() => {
  if (currentPoints.value.length < 2) return ''
  return generatePathData({
    points: currentPoints.value,
    tool: drawing.state.currentTool,
    color: drawing.state.currentColor,
    size: drawing.state.currentSize,
    timestamp: Date.now()
  } as DrawingPath)
})

// 检查两个路径是否相交（用于魔术橡皮）
const pathsIntersect = (path1: DrawingPath, path2: DrawingPath): boolean => {
  const threshold = Math.max(path1.size, path2.size) * 2

  // 如果path1只有一个点（初始点击），使用点到路径的距离检测
  if (path1.points.length === 1) {
    const point = path1.points[0]
    for (let i = 0; i < path2.points.length - 1; i++) {
      const segmentStart = path2.points[i]
      const segmentEnd = path2.points[i + 1]
      const distance = pointToLineSegmentDistance(point, segmentStart, segmentEnd)
      if (distance < threshold) {
        return true
      }
    }
    return false
  }

  // 如果path1有两个点（线段），使用线段到路径的相交检测
  if (path1.points.length === 2) {
    const lineStart = path1.points[0]
    const lineEnd = path1.points[1]

    // 检查线段与路径中每个线段的相交
    for (let i = 0; i < path2.points.length - 1; i++) {
      const segmentStart = path2.points[i]
      const segmentEnd = path2.points[i + 1]

      if (lineSegmentsIntersect(lineStart, lineEnd, segmentStart, segmentEnd, threshold)) {
        return true
      }
    }

    // 额外检查线段上的点到路径的距离
    const steps = Math.max(10, Math.ceil(distanceBetweenPoints(lineStart, lineEnd) / 5))
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const checkPoint = {
        x: lineStart.x + (lineEnd.x - lineStart.x) * t,
        y: lineStart.y + (lineEnd.y - lineStart.y) * t
      }

      for (let j = 0; j < path2.points.length - 1; j++) {
        const segmentStart = path2.points[j]
        const segmentEnd = path2.points[j + 1]
        const distance = pointToLineSegmentDistance(checkPoint, segmentStart, segmentEnd)
        if (distance < threshold) {
          return true
        }
      }
    }

    return false
  }

  // 原有的逻辑作为后备
  for (const point1 of path1.points) {
    for (const point2 of path2.points) {
      const distance = distanceBetweenPoints(point1, point2)
      if (distance < threshold) {
        return true
      }
    }
  }
  return false
}

// 计算两点之间的距离
const distanceBetweenPoints = (p1: DrawingPoint, p2: DrawingPoint): number => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

// 计算点到线段的距离
const pointToLineSegmentDistance = (point: DrawingPoint, lineStart: DrawingPoint, lineEnd: DrawingPoint): number => {
  const A = lineEnd.x - lineStart.x
  const B = lineEnd.y - lineStart.y
  const C = point.x - lineStart.x
  const D = point.y - lineStart.y

  const dot = A * C + B * D
  const lenSq = A * A + B * B

  if (lenSq === 0) return Math.sqrt(C * C + D * D)

  const param = Math.max(0, Math.min(1, dot / lenSq))
  const xx = lineStart.x + param * A
  const yy = lineStart.y + param * B

  const dx = point.x - xx
  const dy = point.y - yy
  return Math.sqrt(dx * dx + dy * dy)
}

// 检查两个线段是否相交（考虑笔刷宽度）
const lineSegmentsIntersect = (
  line1Start: DrawingPoint,
  line1End: DrawingPoint,
  line2Start: DrawingPoint,
  line2End: DrawingPoint,
  threshold: number
): boolean => {
  // 计算两线段的最近距离
  const minDistance = Math.min(
    pointToLineSegmentDistance(line1Start, line2Start, line2End),
    pointToLineSegmentDistance(line1End, line2Start, line2End),
    pointToLineSegmentDistance(line2Start, line1Start, line1End),
    pointToLineSegmentDistance(line2End, line1Start, line1End)
  )

  return minDistance < threshold
}

// 应用路径删除操作（通过设置可见性）
const applyPathDeletions = () => {
  if (pathsToDelete.value.size === 0) return

  // 记录被删除路径的索引，用于历史记录
  const deletedIndices: number[] = []

  // 设置路径为不可见，而不是真正删除
  pathsToDelete.value.forEach(index => {
    if (index < drawing.state.paths.length) {
      drawing.state.paths[index].visible = false
      deletedIndices.push(index)
    }
  })

  // 如果有路径被"删除"，保存到历史记录
  if (deletedIndices.length > 0) {
    saveToHistory()
  }

  // 清除删除标记
  pathsToDelete.value.clear()
}

// 保存到历史记录的辅助函数
const saveToHistory = () => {
  // 直接调用 useDrawing 的 saveToHistory 方法
  drawing.saveToHistory()
}

// 简化路径点（Douglas-Peucker算法的简化版本）
const simplifyPath = (points: DrawingPoint[], tolerance: number = 0.1): DrawingPoint[] => {
  if (points.length <= 2) return points

  const simplified: DrawingPoint[] = [points[0]]
  let lastAdded = 0

  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i]
    const last = points[lastAdded]
    const next = points[i + 1]

    // 计算当前点到直线的距离
    const distance = pointToLineDistance(current, last, next)

    if (distance > tolerance) {
      simplified.push(current)
      lastAdded = simplified.length - 1
    }
  }

  simplified.push(points[points.length - 1])
  return simplified
}

// 计算点到直线的距离（用于路径简化）
const pointToLineDistance = (point: DrawingPoint, lineStart: DrawingPoint, lineEnd: DrawingPoint): number => {
  const A = lineEnd.x - lineStart.x
  const B = lineEnd.y - lineStart.y
  const C = point.x - lineStart.x
  const D = point.y - lineStart.y

  const dot = A * C + B * D
  const lenSq = A * A + B * B

  if (lenSq === 0) return Math.sqrt(C * C + D * D)

  const param = dot / lenSq
  let xx, yy

  if (param < 0) {
    xx = lineStart.x
    yy = lineStart.y
  } else if (param > 1) {
    xx = lineEnd.x
    yy = lineEnd.y
  } else {
    xx = lineStart.x + param * A
    yy = lineStart.y + param * B
  }

  const dx = point.x - xx
  const dy = point.y - yy
  return Math.sqrt(dx * dx + dy * dy)
}

// 生成SVG路径数据
const generatePathData = (path: DrawingPath): string => {
  if (path.points.length === 0) return ''

  // 简化路径点以提高性能 - 降低简化程度以保留更多细节
  const simplifiedPoints = simplifyPath(path.points, 0.2)

  if (simplifiedPoints.length === 1) {
    // 单点 - 绘制一个小圆形路径用于描边
    const point = simplifiedPoints[0]
    const radius = Math.max(0.5, path.size / 8)
    return `M ${point.x} ${point.y} m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`
  }

  if (simplifiedPoints.length === 2) {
    // 两点 - 直线
    return `M ${simplifiedPoints[0].x} ${simplifiedPoints[0].y} L ${simplifiedPoints[1].x} ${simplifiedPoints[1].y}`
  }

  // 多点 - 生成更平滑的贝塞尔曲线
  let pathData = `M ${simplifiedPoints[0].x} ${simplifiedPoints[0].y}`

  // 使用卡曼-罗姆曲线算法生成平滑路径
  for (let i = 0; i < simplifiedPoints.length - 1; i++) {
    const current = simplifiedPoints[i]
    const next = simplifiedPoints[i + 1]

    if (i === 0) {
      // 第一段：从起点到第二个点
      const nextNext = simplifiedPoints[Math.min(i + 2, simplifiedPoints.length - 1)]
      const cp1x = current.x + (next.x - current.x) * 0.5
      const cp1y = current.y + (next.y - current.y) * 0.5
      const cp2x = next.x - (nextNext.x - current.x) * 0.1
      const cp2y = next.y - (nextNext.y - current.y) * 0.1

      pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`
    } else {
      // 中间段：使用前一个点作为参考
      const prev = simplifiedPoints[i - 1]
      const nextNext = simplifiedPoints[Math.min(i + 2, simplifiedPoints.length - 1)]

      const cp1x = current.x + (next.x - prev.x) * 0.16
      const cp1y = current.y + (next.y - prev.y) * 0.16
      const cp2x = next.x - (nextNext.x - current.x) * 0.16
      const cp2y = next.y - (nextNext.y - current.y) * 0.16

      pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`
    }
  }

  return pathData
}

// 获取实际笔画宽度（用于预览和碰撞检测）
const getActualStrokeWidth = (size: number): number => {
  // 直接使用像素尺寸，确保预览和实际笔刷大小一致
  return Math.max(1, size)
}

// 获取圆形标记的半径
const getCircleRadius = (path: DrawingPath): number => {
  if (path.points.length < 2) return 0

  const firstPoint = path.points[0]
  const lastPoint = path.points[path.points.length - 1]

  const distance = Math.sqrt(
    Math.pow(lastPoint.x - firstPoint.x, 2) +
    Math.pow(lastPoint.y - firstPoint.y, 2)
  )

  return Math.max(1, distance)
}

// 获取当前圆形标记的半径
const getCurrentCircleRadius = (): number => {
  if (currentPoints.value.length < 2) return 5

  const firstPoint = currentPoints.value[0]
  const lastPoint = currentPoints.value[currentPoints.value.length - 1]

  const distance = Math.sqrt(
    Math.pow(lastPoint.x - firstPoint.x, 2) +
    Math.pow(lastPoint.y - firstPoint.y, 2)
  )

  return Math.max(1, distance)
}

// 将屏幕坐标转换为SVG逻辑坐标
const screenToSVG = (clientX: number, clientY: number): DrawingPoint => {
  if (!svgRef.value) return { x: 0, y: 0 }

  const rect = svgRef.value.getBoundingClientRect()

  // 直接使用像素坐标，不进行缩放转换
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

// 获取触摸或鼠标位置
const getEventPosition = (event: MouseEvent | TouchEvent): DrawingPoint => {
  if ('touches' in event) {
    // 触摸事件
    if (event.touches.length > 0) {
      return screenToSVG(event.touches[0].clientX, event.touches[0].clientY)
    }
    return { x: 0, y: 0 }
  } else {
    // 鼠标事件
    return screenToSVG(event.clientX, event.clientY)
  }
}

// 开始绘制
const startDrawing = (position: DrawingPoint) => {
  drawing.state.isDrawing = true
  currentPoints.value = [position]
  lastMousePosition.value = position

  // 对于魔术橡皮，清除之前标记的删除
  if (drawing.state.currentTool === 'magic-eraser') {
    pathsToDelete.value.clear()
  }
}

// 继续绘制
const continueDrawing = (position: DrawingPoint) => {
  if (!drawing.state.isDrawing) return

  // 魔术橡皮：检查是否碰到其他路径并标记删除
  if (drawing.state.currentTool === 'magic-eraser') {
    // 创建从上一个位置到当前位置的线段路径
    const segmentPoints = lastMousePosition.value ? [lastMousePosition.value, position] : [position]

    const currentPath: DrawingPath = {
      points: segmentPoints,
      tool: drawing.state.currentTool,
      color: drawing.state.currentColor,
      size: drawing.state.currentSize,
      timestamp: Date.now()
    }

    // 检查与现有路径的碰撞
    drawing.state.paths.forEach((path, index) => {
      // 只检查可见的画笔和圆形标记路径
      if ((path.tool === 'brush' || path.tool === 'circle-marker') && path.visible !== false) {
        if (pathsIntersect(currentPath, path)) {
          pathsToDelete.value.add(index)
        }
      }
    })

    // 更新最后鼠标位置
    lastMousePosition.value = position
    return
  }

  // 添加点到当前路径，但避免添加重复的点
  if (lastMousePosition.value) {
    const distance = Math.sqrt(
      Math.pow(position.x - lastMousePosition.value.x, 2) +
      Math.pow(position.y - lastMousePosition.value.y, 2)
    )

    // 根据当前工具调整采样密度
    const minDistance = 1


    // 如果移动距离过大，插入中间点以保证连续性
    if (distance > minDistance * 5) {
      const steps = Math.ceil(distance / minDistance)
      const lastPos = lastMousePosition.value

      for (let i = 1; i <= steps; i++) {
        const t = i / steps
        const interpolatedPoint: DrawingPoint = {
          x: lastPos.x + (position.x - lastPos.x) * t,
          y: lastPos.y + (position.y - lastPos.y) * t
        }
        currentPoints.value.push(interpolatedPoint)
      }
      lastMousePosition.value = position
    } else if (distance > minDistance) {
      // 正常添加点
      currentPoints.value.push(position)
      lastMousePosition.value = position
    }
  }
}

// 结束绘制
const stopDrawing = () => {
  if (!drawing.state.isDrawing) return

  drawing.state.isDrawing = false

  // 魔术橡皮：直接清理状态，已经在continueDrawing中处理了删除
  if (drawing.state.currentTool === 'magic-eraser') {
    // 实际删除标记的路径
    applyPathDeletions()

    currentPoints.value = []
    lastMousePosition.value = null
    return
  }

  if (currentPoints.value.length > 0) {
    // 简化路径点以优化性能 - 降低简化程度以保留更多细节
    const simplifiedPoints = simplifyPath(currentPoints.value, 0.2)

    // 创建新的路径对象
    const newPath: DrawingPath = {
      points: simplifiedPoints,
      color: drawing.state.currentColor,
      size: drawing.state.currentSize,
      tool: drawing.state.currentTool,
      timestamp: Date.now(),
      visible: true  // 新路径默认可见
    }

    // 添加到绘图状态
    drawing.state.paths.push(newPath)

    // 保存到历史记录
    saveToHistory()
  }

  // 清理临时状态
  currentPoints.value = []
  lastMousePosition.value = null
}

// 鼠标事件处理
const handleMouseDown = (event: MouseEvent) => {
  event.preventDefault()
  const position = getEventPosition(event)

  // 检查是否是右键点击
  if (event.button === 2) {
    // 右键：临时切换到魔术橡皮
    if (!isRightClickErasing.value) {
      originalTool.value = drawing.state.currentTool
      drawing.state.currentTool = 'magic-eraser'
      isRightClickErasing.value = true
    }
  }

  startDrawing(position)
}

const handleMouseMove = (event: MouseEvent) => {
  event.preventDefault()
  const position = getEventPosition(event)

  // 更新悬停位置（用于魔术橡皮预览）
  hoverPosition.value = position

  if (drawing.state.isDrawing) {
    continueDrawing(position)
  }
}

const handleMouseUp = (event: MouseEvent) => {
  event.preventDefault()

  stopDrawing()

  // 如果是右键释放，恢复原来的工具
  if (event.button === 2 && isRightClickErasing.value) {
    drawing.state.currentTool = originalTool.value
    isRightClickErasing.value = false
  }
}

const handleMouseLeave = (event: MouseEvent) => {
  event.preventDefault()
  hoverPosition.value = null
  stopDrawing()

  // 如果正在右键擦除，恢复原来的工具
  if (isRightClickErasing.value) {
    drawing.state.currentTool = originalTool.value
    isRightClickErasing.value = false
  }
}

// 阻止右键菜单
const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  return false
}

// 触摸事件处理
const handleTouchStart = (event: TouchEvent) => {
  event.preventDefault()
  const position = getEventPosition(event)
  startDrawing(position)
}

const handleTouchMove = (event: TouchEvent) => {
  event.preventDefault()
  if (drawing.state.isDrawing) {
    const position = getEventPosition(event)
    continueDrawing(position)
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  event.preventDefault()
  stopDrawing()
}

// 处理窗口大小调整
const handleResize = () => {
  const newWidth = window.innerWidth
  const newHeight = window.innerHeight

  // 获取第一个题板的当前位置
  const firstGameTable = document.querySelector('.game-table') as HTMLElement
  if (!firstGameTable || !initialBoardRect.value) {
    // 如果没有找到题板或没有初始位置信息，只更新画布尺寸，不变换路径
    canvasWidth.value = newWidth
    canvasHeight.value = newHeight
    return
  }

  // 获取当前题板位置
  const currentBoardRect = firstGameTable.getBoundingClientRect()

  // 只在题板位置真正发生变化时才变换路径坐标
  const positionChanged =
    Math.abs(currentBoardRect.left - initialBoardRect.value.left) > 1 ||
    Math.abs(currentBoardRect.top - initialBoardRect.value.top) > 1 ||
    Math.abs(currentBoardRect.width - initialBoardRect.value.width) > 1 ||
    Math.abs(currentBoardRect.height - initialBoardRect.value.height) > 1

  if (positionChanged) {
    // 计算相对于初始题板位置的变换
    const scaleX = currentBoardRect.width / initialBoardRect.value.width
    const scaleY = currentBoardRect.height / initialBoardRect.value.height

    // 变换所有路径的坐标
    drawing.state.paths.forEach(path => {
      path.points.forEach(point => {
        // 相对于初始题板位置进行变换
        const relativeX = point.x - initialBoardRect.value!.left
        const relativeY = point.y - initialBoardRect.value!.top

        // 缩放后再加上新的偏移
        point.x = currentBoardRect.left + relativeX * scaleX
        point.y = currentBoardRect.top + relativeY * scaleY
      })
    })

    // 更新初始位置为当前位置
    initialBoardRect.value = currentBoardRect
  }

  // 更新画布尺寸
  canvasWidth.value = newWidth
  canvasHeight.value = newHeight
}

onMounted(() => {
  if (svgRef.value) {
    // SVG组件已初始化，不需要调用原来的Canvas初始化
    window.addEventListener('resize', handleResize)

    // 记录第一个题板的初始位置
    setTimeout(() => {
      const firstGameTable = document.querySelector('.game-table') as HTMLElement
      if (firstGameTable) {
        initialBoardRect.value = firstGameTable.getBoundingClientRect()
      }
    }, 100) // 延迟一点时间确保DOM已经渲染完成
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
@use '@/styles/variables';

.drawing-canvas-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}

.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw !important;
  height: 100vh !important;
  pointer-events: auto;
  background: transparent;
  cursor: crosshair;
}

.drawing-path {
  vector-effect: non-scaling-stroke;
}

.current-path {
  opacity: 0.8;
}

.eraser-preview {
  opacity: 0.5;
  mix-blend-mode: multiply;
}

.magic-eraser-cursor {
  opacity: 0.8;
  animation: magic-pulse 0.8s infinite ease-in-out;
}

.drawing-circle {
  vector-effect: non-scaling-stroke;
}

.debug-board-path {
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}

.current-circle {
  opacity: 0.7;
  animation: pulse 1s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 0.3;
  }
}

@keyframes magic-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.5;
  }
}
</style>
