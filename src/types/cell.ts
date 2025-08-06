
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

  /**
   * 获取列字母
   */
  get col(): string {
    return Cell.indexToColumn(this.y)
  }

  /**
   * 获取1-based行号
   */
  get row(): number {
    return this.x + 1
  }

  /**
   * 获取单元格键（row-col，0-based）
   */
  get key(): string {
    return `${this.x}-${this.y}`
  }

  get boardKey(): string {
    return `${this.boardname}-${this.x}-${this.y}`
  }

  /**
   * 转为显示坐标对象
   */
  toDisplayCoord(): { row: number; col: string } {
    return { row: this.row, col: this.col }
  }

  /**
   * 静态：将数字索引转换为列字母标识（0-based索引）
   */
  static indexToColumn(index: number): string {
    if (index < 0) throw new Error('Index cannot be negative')
    let result = ''
    let num = index
    do {
      result = String.fromCharCode(65 + (num % 26)) + result
      num = Math.floor(num / 26) - 1
    } while (num >= 0)
    return result
  }

  /**
   * 静态：将列字母标识转换为数字索引（0-based索引）
   */
  static columnToIndex(column: string): number {
    if (!column || typeof column !== 'string') throw new Error('Column must be a non-empty string')
    const upperColumn = column.toUpperCase()
    let result = 0
    for (let i = 0; i < upperColumn.length; i++) {
      const char = upperColumn.charCodeAt(i)
      if (char < 65 || char > 90) throw new Error(`Invalid character in column: ${column}`)
      result = result * 26 + (char - 65 + 1)
    }
    return result - 1
  }

  /**
   * 静态：根据游戏板大小生成列标签数组
   */
  static generateColumnLabels(columnCount: number): string[] {
    return Array.from({ length: columnCount }, (_, i) => this.indexToColumn(i))
  }

  /**
   * 静态：根据游戏板大小生成行标签数组
   */
  static generateRowLabels(rowCount: number): number[] {
    return Array.from({ length: rowCount }, (_, i) => i + 1)
  }

  /**
   * 静态：将行列坐标转换为单元格键（用于内部存储）
   */
  static CellCoordToKey(row: number, col: string): string {
    const rowIndex = row - 1
    const colIndex = this.columnToIndex(col)
    return `${rowIndex}-${colIndex}`
  }

  /**
   * 静态：将单元格键转换为行列坐标
   */
  static keyToCellCoord(key: string): { row: number; col: string } {
    const [rowStr, colStr] = key.split('-')
    const rowIndex = parseInt(rowStr, 10)
    const colIndex = parseInt(colStr, 10)
    if (isNaN(rowIndex) || isNaN(colIndex)) throw new Error(`Invalid Cell key format: ${key}`)
    return {
      row: rowIndex + 1,
      col: this.indexToColumn(colIndex)
    }
  }

  /**
   * 静态：将1-based行号和列字母转换为0-based坐标
   */
  static displayCoordToIndex(row: number, col: string): { x: number; y: number } {
    return {
      x: row - 1,
      y: this.columnToIndex(col)
    }
  }

  /**
   * 静态：将0-based坐标转换为1-based行号和列字母
   */
  static indexToDisplayCoord(x: number, y: number): { row: number; col: string } {
    return {
      row: x + 1,
      col: this.indexToColumn(y)
    }
  }

  /**
   * 静态：由1-based行号和列字母生成Slot
   */
  static fromDisplay(boardname: string, row: number, col: string): Cell {
    const { x, y } = this.displayCoordToIndex(row, col)
    return new Cell(boardname, x, y)
  }

  /**
   * 静态：由0-based坐标生成Slot
   */
  static fromIndex(boardname: string, x: number, y: number): Cell {
    return new Cell(boardname, x, y)
  }

  /**
   * 静态：由单元格键生成Slot
   */
  static fromKey(boardname: string, key: string): Cell {
    const { row, col } = this.keyToCellCoord(key)
    return this.fromDisplay(boardname, row, col)
  }
}
