import { ref, onMounted } from 'vue'
import type { AssetTemplates } from '@/types/game'

// 静态导入SVG文件，这样Vite可以自动内联
import flagSvg from '@/assets/icons/flag.svg'
import starSvg from '@/assets/icons/star.svg'
import circleSvg from '@/assets/icons/circle.svg'
import crossSvg from '@/assets/icons/cross.svg'
import arrowSvg from '@/assets/icons/arrow.svg'
import doubleArrowSvg from '@/assets/icons/double_arrow.svg'
import brushSvg from '@/assets/icons/brush.svg'
import hintSvg from '@/assets/icons/hint.svg'
import checkSvg from '@/assets/icons/check.svg'
import resetSvg from '@/assets/icons/reset.svg'
import menuSvg from '@/assets/icons/menu.svg'

export function useAssets() {
  const assetTemplates = ref<AssetTemplates>({})

  const assetsLoaded = ref(false)
  const assetsLoadingPromise = ref<Promise<AssetTemplates> | null>(null)

  // 预加载素材
  const preloadAssets = async (): Promise<AssetTemplates> => {
    // 使用静态导入的SVG URLs
    const svgUrls = {
      flag: flagSvg,
      star: starSvg,
      circle: circleSvg,
      cross: crossSvg,
      arrow: arrowSvg,
      double_arrow: doubleArrowSvg,
      brush: brushSvg,
      hint: hintSvg,
      check: checkSvg,
      reset: resetSvg,
      menu: menuSvg,
    }

    const loadPromises = Object.entries(svgUrls).map(async ([name, url]) => {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to load ${url}: ${response.status}`)
        }

        const svgText = await response.text()
        const parser = new DOMParser()
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
        const svgElement = svgDoc.documentElement

        if (svgElement.tagName === 'svg') {
          // 为 .inner 元素添加颜色样式
          const innerElements = svgElement.querySelectorAll('.inner')
          innerElements.forEach(element => {
            // 设置 fill 颜色为 currentColor，继承父元素的颜色
            element.setAttribute('style', 'fill: currentColor;')
          })

          // 为 .outer 元素设置透明样式
          const outerElements = svgElement.querySelectorAll('.outer')
          outerElements.forEach(element => {
            // 设置 fill 为 transparent
            element.setAttribute('style', 'fill: transparent;')
          })

          assetTemplates.value[name as keyof AssetTemplates] = svgElement as unknown as SVGElement
          return { name, success: true }
        } else {
          throw new Error(`Invalid SVG format in ${url}`)
        }
      } catch (err) {
        console.warn(`Failed to load ${name} SVG:`, err)
        delete assetTemplates.value[name as keyof AssetTemplates]
        return { name, success: false, error: err }
      }
    })

    await Promise.all(loadPromises)
    assetsLoaded.value = true

    return assetTemplates.value
  }

  // 等待资源加载完成
  const waitForAssets = async (): Promise<AssetTemplates> => {
    if (assetsLoaded.value) {
      return assetTemplates.value
    }
    if (assetsLoadingPromise.value) {
      return assetsLoadingPromise.value
    }
    // 如果还没开始加载，则启动加载
    assetsLoadingPromise.value = preloadAssets()
    return assetsLoadingPromise.value
  }

  // 复制素材
  const cloneAsset = async (assetName: keyof AssetTemplates): Promise<SVGElement | undefined> => {
    await waitForAssets()
    const template = assetTemplates.value[assetName]
    if (template) {
      return template.cloneNode(true) as SVGElement
    }
    return undefined
  }

  // 获取SVG URLs
  const getSvgUrls = () => ({
    flag: flagSvg,
    star: starSvg,
    circle: circleSvg,
    cross: crossSvg,
    arrow: arrowSvg,
    double_arrow: doubleArrowSvg,
    brush: brushSvg,
    hint: hintSvg,
    check: checkSvg,
    reset: resetSvg,
    menu: menuSvg,
  })

  onMounted(() => {
    preloadAssets()
  })

  return {
    assetTemplates,
    assetsLoaded,
    cloneAsset,
    waitForAssets,
    getSvgUrls,
  }
}
