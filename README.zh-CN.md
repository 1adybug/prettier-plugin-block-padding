# prettier-plugin-block-padding

[English](https://github.com/1adybug/prettier-plugin-block-padding/blob/main/README.md)

**重要声明：本项目完全由 Cursor + Claude 4.5 Sonnet Thinking 生成**

在不改变 Prettier 原有风格与换行决策的前提下，为特定语句在"语句之间"智能插入一个额外的空行，从而提升模块与语义块之间的视觉分组效果。插件基于 Prettier 3 的 estree 打印器按"语句序列"工作，不会改写表达式内部的格式与缩进。

## 主要能力

- **顶层语句的分组留白**：在文件最外层为特定语句前后插入一个额外空行（即两条换行分隔相邻语句），增强结构分隔。
- **多行表达式块智能识别**：自动识别并为模板字符串、函数表达式、类表达式、JSX 元素等跨多行的表达式块添加空行，提升代码可读性。
- **TypeScript 命名空间支持**：在 `namespace`/`module`（`TSModuleBlock`）内部同样按上述规则处理成员语句，并保证花括号与首末行的换行正确。
- **智能单行检测**：单行的对象、函数、模板字符串等不会触发额外空行（对象/数组字面量除外），避免过度分隔。
- **与官方解析器协作**：复用官方 `babel`、`babel-ts`、`typescript` 解析器，仅覆盖 estree 打印阶段的"语句拼接"，其它格式化交由 Prettier 负责。

## 行为细节

在"顶层（Program）"与 "TypeScript 命名空间块（TSModuleBlock）"中，插件会在以下情况为相邻语句之间增加一个额外空行：

### 无条件添加空行（即使单行也添加）

- **TypeScript 类型声明**：`interface`、`type`、`enum`（含 `export` 包裹）
- **对象/数组字面量的顶层出现**：
    - 变量声明的初始化为对象/数组字面量
    - 以字面量为主体的表达式语句

### 多行时才添加空行

- **多行块状语句**：当语句打印结果为多行时（例如 `if`、`for`、`while`、`do/while`、`try/catch/finally`、`switch`、`function`、`class`、`TSModuleDeclaration` 等），在其与相邻语句之间增加一个额外空行

- **多行表达式块**（新增）：当以下表达式跨多行时，在其与相邻语句之间增加一个额外空行
    - 模板字符串：`` `...` ``
    - 标签模板：``styled`...` ``
    - 箭头函数表达式：`() => {}`
    - 函数表达式：`function() {}`
    - 类表达式：`class {}`
    - 多行函数调用：`fn(...)`
    - 多行 new 表达式：`new Class(...)`
    - JSX 元素：`<div>...</div>`
    - JSX 片段：`<>...</>`

### 严格遵循的约束

- **不在容器边界外生成空行**：不会在文件首行之前或文件末尾之后额外添加空行。但是，如果文件首行或末行的语句符合上述规则（如对象字面量、类型声明、多行块状语句），它仍然会与相邻语句之间添加空行。
- **仅在语句间加空行**：从不在单个语句内部改写格式，表达式、对象属性、函数体内的具体排版仍由 Prettier 决定。
- **单行不触发空行**：当一个块/表达式最终被打印为单行（无换行）时，不会触发额外留白。

> 小结：插件始终保证"相邻语句之间至少一条换行"，当命中规则时再加一条换行形成一个视觉空行。

## 示例

### 基础示例

对象/数组字面量、TS 类型声明、以及多行块状语句会触发额外留白：

```typescript
const a = 1

const b = {
    name: "Tom",
    age: 18,
}

if (a) {
    const d = 1
}

interface User {
    name: string
}

const c = [1, 2, 3]
```

### 多行表达式块示例

模板字符串、函数表达式等跨多行时也会添加空行：

```typescript
const a = 1

const template = `
    hello, world!
    this is a multiline template
`

const fn = () => {
    console.log("test")
}

const b = 2

const styled = css`
    color: red;
    font-size: 14px;
`

const c = 3
```

### 单行不触发空行

单行的模板字符串、函数表达式等不会添加空行：

```typescript
const singleTemplate = `hello`
const singleFn = () => console.log("test")
const d = 4
```

注意：单行对象/数组字面量仍然会添加空行（无条件规则）：

```typescript
const a = 1

const singleObj = { a: 1 }

const b = 2
```

## 安装

```bash
npm i -D prettier-plugin-block-padding
```

## 使用

将插件加入 Prettier 配置（**建议置于 `plugins` 数组靠后位置**，以确保自定义 estree 打印器生效）：

```json
{
    "plugins": ["other-plugins", "prettier-plugin-block-padding"]
}
```

## 兼容性

- **Prettier**：v3 及以上（作为插件装载）
- **解析器**：`babel`、`babel-ts`、`typescript`
- **模块**：ESM

## 作用范围与限制

- 只在顶层与 TS 命名空间块内的"语句之间"插入额外空行；函数体、任意普通 `{}` 块内部的语句拼接由 Prettier 默认行为决定。
- 支持的表达式块类型：模板字符串、标签模板（如 styled-components）、箭头函数、函数表达式、类表达式、多行函数调用、new 表达式、JSX 元素和片段。
- 不改写表达式内部与对象属性内部的格式，不影响注释位置与换行决策（由 Prettier 处理）。
- 不会擅自在文件/块的首尾位置添加多余空行。
- 单行表达式（除对象/数组字面量外）不会触发空行，避免过度分隔。

## 本地快速体验

```bash
npx prettier --plugin prettier-plugin-block-padding --parser typescript --write "src/**/*.{ts,tsx,js,jsx}"
```

或使用项目脚本（如存在）：

```bash
npm run test:quick
```

---

如果你在边界条件或特定语法上遇到与预期不一致的留白行为，欢迎提交最小可复现示例以便改进。
