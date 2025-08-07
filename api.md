# API 文档

## 1. /reset

- 方法：POST
- 返回类型：无

## 2. /metadata

- 方法：GET
- 返回类型：`BoardMetadata`
  - 主要字段：
    - `rules: string[]`
    - `boards: Record<string, Board>`
    - `cells: CellConfig[]`
    - `count?: CountInfo`
    - `seed?: string`
    - `mode: 'NORMAL' | 'EXPERT' | 'ULTIMATE'`
    - `u_mode?: string[]`

## 3. /click

- 方法：POST
- 请求体：
  - `boardName: string`
  - `x: number`
  - `y: number`
  - `button: string`
- 返回类型：`ClickResponse`
  - 主要字段：
    - `success: boolean`
    - `gameover: boolean`
    - `reason: string`
    - `cells: CellConfig[]`
    - `count?: CountInfo`
    - `mines?: Cell[]`
    - `win?: boolean`

## 4. /new

- 方法：GET
- 参数（Query）：
  - `size: string`
  - `rules: string`
  - `mode: string`
  - `total: string`
  - `u_mode?: string`
  - `dye?: string`
  - `seed?: string`
- 返回类型：`NewGameResult`
  - `success: boolean`
  - `reason?: string`

## 5. /hint

- 方法：GET
- 返回类型：`{hints: Hint[]}`，
  - `Hint` 类型：
    - `condition: (Cell | rullHint)[]`
    - `conclusion: Cell[]`

## 6. /rules

- 方法：GET
- 返回类型：`RuleData`
  - `rules?: Record<string, unknown[]>`
  - `dye?: Record<string, string>`

---

## 主要类型定义

### Board

```typescript
export interface Board {
  name?: string;
  position: [number, number];
  showLabel: boolean;
  size: [number, number];
}
```

### CellConfig

```typescript
export interface CellConfig {
  type: string;
  position: Cell;
  component: ComponentConfig;
  highlight?: Record<string, [number, number][]>;
  rule?: string;
}
```

### Cell

```typescript
export interface CellType {
  boardname: string;
  x: number;
  y: number;
}

export class Cell implements CellType {
  boardname: string;
  x: number;
  y: number;
  constructor(boardname: string, x: number, y: number) {
    this.boardname = boardname;
    this.x = x;
    this.y = y;
  }
  // ...部分方法省略...
}
```

### ComponentConfig

```typescript
export interface ComponentConfig {
  type: 'container' | 'text' | 'assets' | 'template';
  value: ComponentConfig[] | string | ComponentTemplate;
  style: string;
}
```

### ComponentTemplate

```typescript
export interface ComponentTemplate {
  name: string;
  value: unknown;
}
```
