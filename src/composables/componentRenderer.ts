import { cloneAsset } from '@/composables/useAssets'
import { renderTemplate } from '@/composables/templateRenderer'
import type { ComponentConfig, AssetTemplates, ComponentTemplate } from '@/types/game'

// 递归渲染组件配置到DOM元素
export async function renderComponent(
  container: HTMLElement,
  component: ComponentConfig,
  override: boolean = true
): Promise<void> {
  if (!container) return

  if (override) {
    container.innerHTML = ''
  }

  if (component.type === 'container' && Array.isArray(component.value)) {
    const subContainer = document.createElement('div')
    subContainer.className = 'component-container'

    if (component.style) {
      subContainer.style.cssText = component.style
    }

    for (const subComponent of component.value) {
      await renderComponent(subContainer, subComponent, false)
    }

    container.appendChild(subContainer)
  } else if (component.type === 'text') {
    const textSpan = document.createElement('span')
    textSpan.className = 'component-text'
    textSpan.textContent = component.value as string
    if (component.style) {
      textSpan.style.cssText = component.style
    }
    container.appendChild(textSpan)
  } else if (component.type === 'template') {
    // 渲染模板类型
    const templateComponent = renderTemplate(component.value as ComponentTemplate)
    await renderComponent(container, templateComponent, false)
  } else if (component.type === 'assets') {
    try {
      const iconSvg = await cloneAsset(component.value as keyof AssetTemplates)

      if (iconSvg) {
        iconSvg.style.width = 'calc(0.9 * var(--cell-size))'
        iconSvg.style.height = 'calc(0.9 * var(--cell-size))'
        iconSvg.style.display = 'block'
        iconSvg.style.maxWidth = '100%'
        iconSvg.style.maxHeight = '100%'

        const innerElements = iconSvg.querySelectorAll('.inner')
        innerElements.forEach((innerElement: Element) => {
          ;(innerElement as HTMLElement).style.fill = 'var(--foreground-color)'
        })

        // 应用自定义样式
        if (component.style) {
          iconSvg.style.cssText += `; ${component.style}`
        }
        innerElements.forEach((innerElement: Element) => {
          ;(innerElement as HTMLElement).style.cssText += `; ${component.style}`
        })

        container.appendChild(iconSvg)
      }
    } catch (error) {
      console.error(`Failed to render asset ${component.value}:`, error)

      // 渲染失败时显示占位符
      const placeholder = document.createElement('span')
      placeholder.className = 'asset-placeholder'
      placeholder.textContent = `[${component.value}]`
      container.appendChild(placeholder)
    }
  }

  // 只有根容器且没有子容器时才应用样式到根容器
  if (override && component.type !== 'container' && component.style) {
    container.style.cssText += `; ${component.style}`
  }
}
