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
    class: 'number fitting'
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
  const count = values.length;
  return {
    type: 'container',
    value: values.map((value, i) => {
      const phi = 2 * Math.PI / [1, 1, 2, 12, 8, -20, 1, 1, 1, 1][count];
      const r = [0, 0, 18, 25, 30, 30, 35, 35, 40, 40][count];
      const dy = [0, 0, 0, 10, 0, 5, 0, 0, 0, 0][count];
      const angle = (2 * Math.PI / count) * i + phi;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle) + dy;
      const size = [100, 75, 45, 35, 35, 30, 30, 25, 25, 20][count];

      const target = renderNumber(value);
      target.style = `
          position: absolute;
          text-align: center;
          left: 50%;
          top:  50%;
          transform: translate(-50%, -50%);
          line-height: 0.8;
        `
      return {
        type: 'container',
        value: [target],
        style: `
          position: absolute;
          left: calc(${x}% + 50%);
          top:  calc(${y}% + 50%);
          transform: translate(-50%, -50%);
          width: ${size}%;
          height: ${size}%;
        `
      } as ComponentConfig;
    }),
    style: `
      position: relative;
      width: 100%;
      height: 100%;
    `
  };
}