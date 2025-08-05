import type { ComponentConfig, ComponentTemplate } from '@/types/game'

// 模板渲染函数
export function renderTemplate(template: ComponentTemplate): ComponentConfig {
  const templateName = template.name
  const templateValue = template.value

  switch (templateName) {
    case 'number':
      return renderNumber(templateValue as number)
    case 'latex':
      return renderLatex(templateValue as string)
    case 'multiNumber':
      return renderMultiNumber(templateValue as number[])
  }
  return {
    type: 'text',
    value: '???',
    style: ''
  }
}

function renderNumber(value: number): ComponentConfig {
  return {
    type: 'text',
    value: value.toString(),
    style: ''
  }
}
function renderLatex(value: string): ComponentConfig {
  console.log(`Rendering LaTeX: ${value}`)
  return {
    type: 'text',
    value: `???`,
    style: ''
  }
}

function renderMultiNumber(values: number[]): ComponentConfig {
  return {
    type: 'text',
    value: values.join(' '),
    style: 'color: #FF9800; font-weight: bold;'
  }
}