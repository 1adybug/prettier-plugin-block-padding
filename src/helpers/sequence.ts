import { doc, type Doc } from "prettier"
import {
    NodeBase,
    StatementContainer,
    hasTopLevelObjectOrArrayLiteral,
    hasOtherBlockExpression,
    isBlockLikeStatement,
    isTsTypeDeclaration,
    isClassMember,
    isClassMethod,
    isClassProperty,
} from "./guards.js"
const { builders, utils } = doc
const { hardline } = builders

// 用于路径感知打印函数类型定义
export interface PrettierPathLike {
    getValue(): NodeBase
    call<T>(
        fn: (path: PrettierPathLike) => T,
        ...property: (string | number)[]
    ): T
}

export interface PrintFn {
    (path: PrettierPathLike): Doc
}

// 判断当前语句是否需要在前后添加空行（根据 README 规则）
function shouldPadAroundStatement(stmt: NodeBase, childDoc: Doc): boolean {
    // TypeScript 类型声明：无条件留空
    if (isTsTypeDeclaration(stmt)) return true

    // 对象/数组字面量：无条件留空
    if (hasTopLevelObjectOrArrayLiteral(stmt)) return true

    // 类成员：多行时才留空（如多行方法）
    if (isClassMember(stmt)) {
        // 只有多行的类成员才添加空行
        if (!utils.willBreak(childDoc)) return false

        return true
    }

    // 多行块状语句：需为多行时才留空，避免一行 {} 的情况
    if (!utils.willBreak(childDoc)) return false

    if (isBlockLikeStatement(stmt)) return true

    // 其他块类型表达式（模板字符串、函数表达式等）：多行时才留空
    if (hasOtherBlockExpression(stmt)) return true

    return false
}

// 计算两个节点之间原始代码中的空行数
function getOriginalEmptyLinesBetween(
    prevNode: NodeBase,
    currNode: NodeBase,
): number {
    const anyPrev = prevNode as unknown as { loc?: { end?: { line?: number } } }
    const anyCurr = currNode as unknown as {
        loc?: { start?: { line?: number } }
        comments?: Array<{ loc?: { start?: { line?: number } } }>
    }

    const prevEndLine = anyPrev.loc?.end?.line
    let currStartLine = anyCurr.loc?.start?.line

    // 如果当前节点有前置注释，使用第一个前置注释的起始行
    const comments = anyCurr.comments

    if (comments && comments.length > 0) {
        const firstCommentLine = comments[0]?.loc?.start?.line

        if (typeof firstCommentLine === "number") {
            currStartLine = firstCommentLine
        }
    }

    if (typeof prevEndLine !== "number" || typeof currStartLine !== "number") {
        return 0
    }

    // 行差减 1 就是空行数（例如：第 2 行结束，第 4 行开始，中间有 1 个空行）
    const emptyLines = currStartLine - prevEndLine - 1
    return Math.max(0, emptyLines)
}

// 将容器的语句序列打印并插入空行
export function printStatementSequence(
    path: PrettierPathLike,
    print: PrintFn,
): Doc {
    const node = path.getValue() as StatementContainer

    const parts: Doc[] = []

    const body = Array.isArray(node.body) ? node.body : []

    // 先收集每个语句的 Doc 以及其是否需要留空
    const children: { doc: Doc; needPad: boolean }[] = body.map((_, i) => {
        const childDoc = path.call(p => print(p), "body", i) as unknown as Doc
        const needPad = shouldPadAroundStatement(body[i], childDoc)
        return { doc: childDoc, needPad }
    })

    for (let i = 0; i < children.length; i++) {
        const { doc: childDoc, needPad } = children[i]
        const prev = children[i - 1]

        if (i > 0) {
            // 计算原始代码中的空行数
            const originalEmptyLines = getOriginalEmptyLinesBetween(
                body[i - 1],
                body[i],
            )

            // 计算插件规则要求的空行数（0 或 1）
            let requiredEmptyLines = needPad || (prev && prev.needPad) ? 1 : 0

            // 特殊处理：类属性和类方法之间应该添加空行（用于分隔不同类型的成员）
            if (
                (isClassProperty(body[i - 1]) && isClassMethod(body[i])) ||
                (isClassMethod(body[i - 1]) && isClassProperty(body[i]))
            ) {
                requiredEmptyLines = 1
            }

            // 取两者的最大值，保留原有空行的同时满足插件规则
            // 但限制最多 1 个空行，与 prettier 默认行为保持一致
            const emptyLinesToAdd = Math.min(
                1,
                Math.max(originalEmptyLines, requiredEmptyLines),
            )

            // 插入换行：1 个 hardline 用于分隔语句，额外的 hardline 形成空行
            parts.push(hardline)

            for (let j = 0; j < emptyLinesToAdd; j++) {
                parts.push(hardline)
            }
        }

        parts.push(childDoc)
    }

    return parts as unknown as Doc
}
