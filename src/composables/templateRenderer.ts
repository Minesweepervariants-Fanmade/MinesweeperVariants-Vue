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
  values.push(10)
  const count = values.length;
  return {
    type: 'container',
    value: values.map((value, i) => {
      const phi = Math.PI / [1, 1, 1, 6, 4, -10, 1, 1, 1, 1][count];
      const r = [0, 0, 18, 25, 30, 30, 20, 20, 20, 20][count];
      const dy = [0, 0, 0, 10, 0, 5, 0, 0, 0, 0][count];
      const angle = (2 * Math.PI / count) * i + phi;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle) + dy;

      const target = renderNumber(value);
      target.style = `
          position: absolute;
          left: calc(${x}% + 50%);
          top:  calc(${y}% + 50%);
          color: #FF9800;
          text-align: center;
          transform: translate(-50%, -50%);
        `
      return target;
    }),
    style: `
      position: relative;
      width: 100%;
      height: 100%;
    `
  };
}