import type { AssetTemplates } from '@/types/game'

// 静态导入SVG文件，这样Vite可以自动内联
import flagSvg from '@/assets/icons/flag.svg?url'
import starSvg from '@/assets/icons/star.svg?url'
import circleSvg from '@/assets/icons/circle.svg?url'
import crossSvg from '@/assets/icons/cross.svg?url'
import arrowSvg from '@/assets/icons/arrow.svg?url'
import doubleArrowSvg from '@/assets/icons/double_arrow.svg?url'
import brushSvg from '@/assets/icons/brush.svg?url'
import hintSvg from '@/assets/icons/hint.svg?url'
import checkSvg from '@/assets/icons/check.svg?url'
import resetSvg from '@/assets/icons/reset.svg?url'
import menuSvg from '@/assets/icons/menu.svg?url'

const assetTemplates: AssetTemplates = {}
let assetsLoaded: boolean = false
let assetsLoadingPromise: Promise<AssetTemplates> | null = null

// 预加载素材
async function preloadAssets(): Promise<AssetTemplates> {
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

        assetTemplates[name as keyof AssetTemplates] = svgElement as unknown as SVGElement
        return { name, success: true }
      } else {
        throw new Error(`Invalid SVG format in ${url}`)
      }
    } catch (err) {
      console.warn(`Failed to load ${name} SVG:`, err)
      delete assetTemplates[name as keyof AssetTemplates]
      return { name, success: false, error: err }
    }
  })

  await Promise.all(loadPromises)
  assetsLoaded = true

  return assetTemplates
}

// 等待资源加载完成
export async function waitForAssets(): Promise<AssetTemplates> {
  if (assetsLoaded) {
    return assetTemplates
  }
  if (assetsLoadingPromise) {
    return assetsLoadingPromise
  }
  // 如果还没开始加载，则启动加载
  assetsLoadingPromise = preloadAssets()
  return assetsLoadingPromise
}

// 复制素材
export async function cloneAsset(assetName: keyof AssetTemplates): Promise<SVGElement | undefined> {
  await waitForAssets()
  const template = assetTemplates[assetName]
  if (template) {
    return template.cloneNode(true) as SVGElement
  }
  return undefined
}

// 获取SVG URLs
export function getSvgUrls() {
  return {
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
}

// 获取资源模板
export function getAssetTemplates(): AssetTemplates {
  return assetTemplates
}

// 检查资源是否已加载
export function isAssetsLoaded(): boolean {
  return assetsLoaded
}