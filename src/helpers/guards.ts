// 节点最小公共结构
export interface NodeBase {
    // 节点类型名称
    type: string
}

// 语句序列所在容器（Program 或 BlockStatement）
export interface StatementContainer extends NodeBase {
    // 语句列表
    body: NodeBase[]
}

// 变量声明（用于检测对象/数组字面量）
export interface VariableDeclaratorNode extends NodeBase {
    id: NodeBase
    // 这里只关心 init，最小化定义
    init?: NodeBase
}

export interface VariableDeclarationNode extends NodeBase {
    declarations: VariableDeclaratorNode[]
}

// 表达式语句（用于检测对象/数组字面量）
export interface ExpressionStatementNode extends NodeBase {
    expression: NodeBase
}

// 判断是否块状语句（会形成作用域或代码块）
export function isBlockLikeStatement(node: NodeBase): boolean {
    if (!node || typeof node.type !== "string") return false

    // 覆盖常见会形成块或作用域的语句/声明
    switch (node.type) {
        case "BlockStatement":
        case "IfStatement":
        case "ForStatement":
        case "ForInStatement":
        case "ForOfStatement":
        case "WhileStatement":
        case "DoWhileStatement":
        case "TryStatement":
        case "SwitchStatement":
        case "FunctionDeclaration":
        case "ClassDeclaration":
        // TypeScript: 命名空间/模块声明也视作"块状语句"
        case "TSModuleDeclaration":
        // 类成员中的方法
        case "MethodDefinition":
        case "ClassMethod":
            return true
        default:
            return false
    }
}

// 判断是否类成员（属性或方法）
export function isClassMember(node: NodeBase): boolean {
    if (!node || typeof node.type !== "string") return false

    // 类成员的节点类型
    switch (node.type) {
        // 类属性
        case "PropertyDefinition":
        case "ClassProperty":
        // 类方法
        case "MethodDefinition":
        case "ClassMethod":
        // 访问器
        case "TSAbstractMethodDefinition":
        case "TSAbstractPropertyDefinition":
            return true
        default:
            return false
    }
}

// 判断是否类方法（不包括属性）
export function isClassMethod(node: NodeBase): boolean {
    if (!node || typeof node.type !== "string") return false

    switch (node.type) {
        case "MethodDefinition":
        case "ClassMethod":
        case "TSAbstractMethodDefinition":
            return true
        default:
            return false
    }
}

// 判断是否类属性（不包括方法）
export function isClassProperty(node: NodeBase): boolean {
    if (!node || typeof node.type !== "string") return false

    switch (node.type) {
        case "PropertyDefinition":
        case "ClassProperty":
        case "TSAbstractPropertyDefinition":
            return true
        default:
            return false
    }
}

// 判断是否 TypeScript 的类型声明（interface/type/enum）
export function isTsTypeDeclaration(node: NodeBase): boolean {
    if (!node || typeof node.type !== "string") return false

    // 直接的 TS 类型声明
    if (
        node.type === "TSInterfaceDeclaration" ||
        node.type === "TSTypeAliasDeclaration" ||
        node.type === "TSEnumDeclaration"
    )
        return true

    // export 包裹的 TS 类型声明（export interface/type/enum）
    if (node.type === "ExportNamedDeclaration") {
        const anyNode = node as unknown as { declaration?: NodeBase }
        const decl = anyNode.declaration
        if (!decl) return false
        return (
            decl.type === "TSInterfaceDeclaration" ||
            decl.type === "TSTypeAliasDeclaration" ||
            decl.type === "TSEnumDeclaration"
        )
    }

    return false
}

// 判断表达式是否为对象或数组字面量（无条件留空）
function isObjectOrArrayLiteral(expr: NodeBase | undefined): boolean {
    if (!expr) return false
    return expr.type === "ObjectExpression" || expr.type === "ArrayExpression"
}

// 判断表达式是否为其他块类型（只在多行时留空）
// 包括：模板字符串、函数表达式、类表达式等
function isOtherBlockExpression(expr: NodeBase | undefined): boolean {
    if (!expr) return false

    // 模板字符串（包括普通模板和标签模板）
    if (
        expr.type === "TemplateLiteral" ||
        expr.type === "TaggedTemplateExpression"
    ) {
        return true
    }

    // 函数表达式（箭头函数和普通函数）
    if (
        expr.type === "ArrowFunctionExpression" ||
        expr.type === "FunctionExpression"
    ) {
        return true
    }

    // 类表达式
    if (expr.type === "ClassExpression") {
        return true
    }

    // JSX 元素和片段
    if (expr.type === "JSXElement" || expr.type === "JSXFragment") {
        return true
    }

    // 函数调用和 new 表达式（可能包含多行参数）
    if (expr.type === "CallExpression" || expr.type === "NewExpression") {
        return true
    }

    return false
}

// 判断语句是否包含"顶层对象/数组字面量"（无条件留空）
// - VariableDeclaration: 任一 declarator.init 为 ObjectExpression/ArrayExpression
// - ExpressionStatement: expression 为 ObjectExpression/ArrayExpression
export function hasTopLevelObjectOrArrayLiteral(node: NodeBase): boolean {
    if (!node) return false

    if (node.type === "VariableDeclaration") {
        const v = node as unknown as VariableDeclarationNode

        for (const d of v.declarations || []) {
            const init = d && d.init

            if (isObjectOrArrayLiteral(init)) {
                return true
            }
        }

        return false
    }

    if (node.type === "ExpressionStatement") {
        const e = node as unknown as ExpressionStatementNode
        if (!e.expression) return false
        return isObjectOrArrayLiteral(e.expression)
    }

    return false
}

// 判断语句是否包含其他块类型表达式（只在多行时留空）
export function hasOtherBlockExpression(node: NodeBase): boolean {
    if (!node) return false

    if (node.type === "VariableDeclaration") {
        const v = node as unknown as VariableDeclarationNode

        for (const d of v.declarations || []) {
            const init = d && d.init

            if (isOtherBlockExpression(init)) {
                return true
            }
        }

        return false
    }

    if (node.type === "ExpressionStatement") {
        const e = node as unknown as ExpressionStatementNode
        if (!e.expression) return false
        return isOtherBlockExpression(e.expression)
    }

    return false
}
