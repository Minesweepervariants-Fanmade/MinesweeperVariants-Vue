# 扫雷变体 - Vue 版本

一个使用 Vue 3、TypeScript 和 Vite 构建的现代扫雷游戏，具有多种变体和主题。

## 功能特性

- 🎮 经典扫雷游戏玩法
- 🎨 多种主题
- 📱 响应式设计，支持缩放
- ⌨️ 键盘快捷键支持
- 🎯 可配置的网格大小和地雷布置
- 🖼️ SVG 图标，呈现清晰视觉效果
- ♿ 无障碍功能

## 技术栈

- **框架**: Vue 3 with Composition API
- **编程语言**: TypeScript
- **构建工具**: Vite
- **样式**: SCSS with CSS modules
- **代码检查**: ESLint + Prettier

## 开始使用

### 前置要求

- Node.js（版本 16 或更高）
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone <repository-url>
cd MinesweeperVariants-Vue

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产构建
- `npm run lint` - 运行 ESLint 并自动修复
- `npm run lint:check` - 检查代码规范但不自动修复
- `npm run format` - 使用 Prettier 格式化代码

## 项目结构

```
src/
├── components/     # 游戏界面的 Vue 组件
├── composables/    # 可复用的组合式函数
├── types/         # TypeScript 类型定义
├── assets/        # 静态资源（字体、图标）
├── styles/        # 全局样式和主题
└── utils/         # 工具函数
```

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 资源许可证

### 字体

#### Copperplate CC Bold (`copperplate-cc.bold.ttf`)
- **许可证**: SIL Open Font License 1.1 (OFL-1.1)
- **来源**: [CowboyCollective/CopperplateCC](https://github.com/CowboyCollective/CopperplateCC)
- **版权**: Copyright 2014-2024 Cowboy Collective
- **用途**: 免费用于商业和非商业用途
- **许可证链接**: https://scripts.sil.org/OFL

#### 思源黑体 CN Heavy (`SourceHanSansCN-Heavy.ttf`)
- **许可证**: SIL Open Font License 1.1 (OFL-1.1)
- **来源**: [Adobe Fonts / Source Han Sans](https://github.com/adobe-fonts/source-han-sans)
- **版权**: Copyright 2014-2021 Adobe Systems Incorporated
- **用途**: 免费用于商业和非商业用途
- **许可证链接**: https://scripts.sil.org/OFL

### 图标和图形

`src/assets/icons/` 目录下的所有 SVG 图标均由 KoolShow 创作，采用以下许可证：
- **许可证**: Creative Commons CC0 1.0 Universal（公共域）
- **用途**: 可自由用于任何目的，无需署名

### 网站图标
- **许可证**: Creative Commons CC0 1.0 Universal（公共域）
- **创作者**: KoolShow

## 贡献

1. Fork 此仓库
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 致谢

- Vue.js 团队提供的出色框架
- [Cowboy Collective](https://github.com/CowboyCollective) 提供的 Copperplate CC 字体
- [Adobe Systems](https://github.com/adobe-fonts/source-han-sans) 提供的思源字体系列
- 开源社区的灵感和工具支持
