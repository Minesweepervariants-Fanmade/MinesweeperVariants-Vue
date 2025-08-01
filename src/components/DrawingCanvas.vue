<template>
  <div class="drawing-canvas-container">
    <!-- 主画布 -->
    <canvas
      ref="canvasRef"
      class="drawing-canvas"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDrawing } from '@/composables/useDrawing'

const drawing = useDrawing()

const canvasRef = ref<globalThis.HTMLCanvasElement | null>(null)

onMounted(() => {
  if (canvasRef.value) {
    drawing.initCanvas(canvasRef.value)
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  if (canvasRef.value) {
    // 通知绘图系统进行尺寸调整
    drawing.handleCanvasResize(1, 1, window.innerWidth, window.innerHeight)
  }
}// 鼠标事件处理
const handleMouseDown = (event: globalThis.MouseEvent) => {
  event.preventDefault()
  drawing.startDrawing(event)
}

const handleMouseMove = (event: globalThis.MouseEvent) => {
  event.preventDefault()
  drawing.continueDrawing(event)
}

const handleMouseUp = (event: globalThis.MouseEvent) => {
  event.preventDefault()
  drawing.stopDrawing()
}

const handleMouseLeave = (event: globalThis.MouseEvent) => {
  event.preventDefault()
  drawing.stopDrawing()
}

// 触摸事件处理
const handleTouchStart = (event: globalThis.TouchEvent) => {
  event.preventDefault()
  drawing.startDrawing(event)
}

const handleTouchMove = (event: globalThis.TouchEvent) => {
  event.preventDefault()
  drawing.continueDrawing(event)
}

const handleTouchEnd = (event: globalThis.TouchEvent) => {
  event.preventDefault()
  drawing.stopDrawing()
}
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
  image-rendering: crisp-edges;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: pixelated;
}
</style>
