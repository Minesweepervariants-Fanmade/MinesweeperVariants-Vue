/**
 * 列标识转换工具函数
 * 处理数字和字母列标识之间的转换，支持Excel风格的列标识（A, B, ..., Z, AA, AB, ...）
 */

/**
 * 将数字索引转换为列字母标识（0-based索引）
 * @param index 0-based 索引
 * @returns 列字母标识 (A, B, ..., Z, AA, AB, ...)
 */
export function indexToColumn(index: number): string {
  if (index < 0) {
    throw new Error('Index cannot be negative')
  }

  let result = ''
  let num = index

  do {
    result = String.fromCharCode(65 + (num % 26)) + result
    num = Math.floor(num / 26) - 1
  } while (num >= 0)

  return result
}

/**
 * 将列字母标识转换为数字索引（0-based索引）
 * @param column 列字母标识 (A, B, ..., Z, AA, AB, ...)
 * @returns 0-based 索引
 */
export function columnToIndex(column: string): number {
  if (!column || typeof column !== 'string') {
    throw new Error('Column must be a non-empty string')
  }

  const upperColumn = column.toUpperCase()
  let result = 0

  for (let i = 0; i < upperColumn.length; i++) {
    const char = upperColumn.charCodeAt(i)
    if (char < 65 || char > 90) {
      throw new Error(`Invalid character in column: ${column}`)
    }
    result = result * 26 + (char - 65 + 1)
  }

  return result - 1
}

/**
 * 根据游戏板大小生成列标签数组
 * @param columnCount 列数
 * @returns 列标签数组
 */
export function generateColumnLabels(columnCount: number): string[] {
  return Array.from({ length: columnCount }, (_, i) => indexToColumn(i))
}

/**
 * 根据游戏板大小生成行标签数组
 * @param rowCount 行数
 * @returns 行标签数组（1-based）
 */
export function generateRowLabels(rowCount: number): number[] {
  return Array.from({ length: rowCount }, (_, i) => i + 1)
}

/**
 * 将行列坐标转换为单元格键（用于内部存储）
 * @param row 行号（1-based）
 * @param col 列标识（字母）
 * @returns 单元格键（格式：row-col，0-based索引）
 */
export function cellCoordToKey(row: number, col: string): string {
  const rowIndex = row - 1 // 转换为0-based
  const colIndex = columnToIndex(col)
  return `${rowIndex}-${colIndex}`
}

/**
 * 将单元格键转换为行列坐标
 * @param key 单元格键（格式：row-col，0-based索引）
 * @returns 行列坐标对象
 */
export function keyToCellCoord(key: string): { row: number; col: string } {
  const [rowStr, colStr] = key.split('-')
  const rowIndex = parseInt(rowStr, 10)
  const colIndex = parseInt(colStr, 10)

  if (isNaN(rowIndex) || isNaN(colIndex)) {
    throw new Error(`Invalid cell key format: ${key}`)
  }

  return {
    row: rowIndex + 1, // 转换为1-based
    col: indexToColumn(colIndex)
  }
}

/**
 * 将1-based行号和列字母转换为0-based坐标
 * @param row 行号（1-based）
 * @param col 列标识（字母）
 * @returns 0-based坐标对象
 */
export function displayCoordToIndex(row: number, col: string): { x: number; y: number } {
  return {
    x: row - 1, // 转换为0-based行索引
    y: columnToIndex(col) // 转换为0-based列索引
  }
}

/**
 * 将0-based坐标转换为1-based行号和列字母
 * @param x 行索引（0-based）
 * @param y 列索引（0-based）
 * @returns 显示坐标对象
 */
export function indexToDisplayCoord(x: number, y: number): { row: number; col: string } {
  return {
    row: x + 1, // 转换为1-based行号
    col: indexToColumn(y) // 转换为列字母
  }
}
