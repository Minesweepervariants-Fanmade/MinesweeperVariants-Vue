import type { ComponentConfig, ComponentTemplate } from '@/types/game'

type Arrow = 'up' | 'down' | 'left' | 'right' | 'up_down' | 'left_right'

// 模板渲染函数
export function renderTemplate(template: ComponentTemplate): ComponentConfig {
  const templateName = template.name
  const templateValue = template.value

  switch (templateName) {
    case 'str':
      return renderStr(templateValue as string)
    case 'latex':
      return renderLatex(templateValue as string)
    case 'multiStr':
      return renderMultiStr(templateValue as string[])
    case 'backgroundStr':
      return renderBackgroundStr(templateValue as string)
    case 'strWithArrow':
      return renderStrWithArrow(templateValue as { text: string, arrow: Arrow })
  }
  return {
    type: 'text',
    value: '???',
    style: ''
  }
}

function renderStr(value: string): ComponentConfig {
  return {
    type: 'text',
    value,
    class: 'str fitting'
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

function renderMultiStr(values: string[]): ComponentConfig {
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

      const target = renderStr(value);
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

function renderBackgroundStr(value: string): ComponentConfig {
  return {
    type: 'text',
    value,
    class: 'background-str fitting',
    style: `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    `
  };
}



function renderStrWithArrow(templateValue: { text: string, arrow: Arrow }): ComponentConfig {
  const { text, arrow } = templateValue;
  const arrowMap: Record<Arrow, string> = {
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
    up_down: '↕',
    left_right: '↔'
  };
  const arrowSymbol = arrowMap[arrow] || '';

  const arrowComp: ComponentConfig = {
    type: 'text',
    value: arrowSymbol,
    class: 'arrow',
    style: `
      position: absolute;
      `
  };

  const textComp: ComponentConfig = {
    type: 'container',
    value: [
      {
        type: 'text',
        value: text,
        class: 'fitting',
        style: ''
      }
    ],
    style: `
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: left;
      line-height: 1;
      `
  };

  if (arrow === 'left' || arrow === 'right' || arrow === 'left_right') {
    arrowComp.style += `
      top: 5%;
      left: 50%;
      transform: translate(-50%, 0);
      `;
    textComp.style += `
      top: 30%;
      left: 0;
      width: 100%;
      height: 70%;
    `;
    (textComp.value as ComponentConfig[])[0].style = `
      padding: 0% 5% 0 5% ;
    `;
  } else {
    arrowComp.style += `
      right: 0;
      top: 30%;
      transform: translate(20%, 0);
    `;
    textComp.style += `
      left: 0;
      top: 0;
      width: 85%;
      height: 100%;
    `;
    (textComp.value as ComponentConfig[])[0].style = `
      padding: 5% 5% 0% 5%;
    `;
  }

  return {
    type: 'container',
    value: [arrowComp, textComp],
    style: ''
  };
}