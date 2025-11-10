import {
    AstPath,
    doc,
    type Doc,
    ParserOptions,
    Plugin as PrettierPlugin,
    Printer,
} from "prettier"
import * as babelPlugin from "prettier/plugins/babel"
import * as estreePlugin from "prettier/plugins/estree"
import * as typescriptPlugin from "prettier/plugins/typescript"
import { printStatementSequence } from "./helpers/sequence"
const { builders } = doc
const { hardline, indent } = builders

function createPatchedEstreePrinter(base: Printer): Printer {
    function print(
        path: AstPath,
        options: ParserOptions,
        print: (path: AstPath) => Doc,
        args?: unknown,
    ): Doc {
        const node = path.node
        if (!node) return ""

        // 在 Program、TSModuleBlock 和 BlockStatement 级别改写"语句序列"的拼接逻辑
        if (node.type === "Program") {
            const hasBody = Array.isArray(node.body) && node.body.length > 0
            const anyNode = node as any
            const hasComments = anyNode.comments && anyNode.comments.length > 0

            // 如果 Program 为空但有注释（如只有三斜线指令），使用基础打印机处理
            if (!hasBody && hasComments) {
                return base.print(path, options, print)
            }

            // Program 没有包裹符号，直接打印语句序列，并确保以换行结束文件
            const seq = printStatementSequence(
                path as unknown as any,
                p => print(p as AstPath) as unknown as Doc,
            )

            return [seq, hardline]
        }

        // namespace/module 的块体，形如: namespace A { ... }
        if (node.type === "TSModuleBlock") {
            const printed = printStatementSequence(
                path as unknown as any,
                p => print(p as AstPath) as unknown as Doc,
            )

            const hasBody = Array.isArray(node.body) && node.body.length > 0
            if (!hasBody) return ["{", "}"]
            // 注意：将 hardline 放入 indent 内部，确保首行也会被缩进
            return ["{", indent([hardline, printed]), hardline, "}"]
        }

        // 处理所有的 BlockStatement（函数体、if/for/while 等语句块）
        if (node.type === "BlockStatement") {
            const hasBody = Array.isArray(node.body) && node.body.length > 0
            const anyNode = node as any
            const hasComments = anyNode.comments && anyNode.comments.length > 0

            // 如果块为空但有注释（如 catch { /* empty */ }），使用基础打印机处理
            if (!hasBody && hasComments) {
                return base.print(path, options, print)
            }

            // 如果块完全为空（没有语句也没有注释）
            if (!hasBody) return ["{", "}"]

            // 打印语句序列
            const printed = printStatementSequence(
                path as unknown as any,
                p => print(p as AstPath) as unknown as Doc,
            )

            // 将 hardline 放入 indent 内部，确保首行也会被缩进
            return ["{", indent([hardline, printed]), hardline, "}"]
        }

        // 处理类的主体（ClassBody）
        if (node.type === "ClassBody") {
            const hasBody = Array.isArray(node.body) && node.body.length > 0
            const anyNode = node as any
            const hasComments = anyNode.comments && anyNode.comments.length > 0

            // 如果类主体为空但有注释，使用基础打印机处理
            if (!hasBody && hasComments) {
                return base.print(path, options, print)
            }

            // 如果类主体完全为空（没有成员也没有注释）
            if (!hasBody) return ["{", "}"]

            // 打印类成员序列
            const printed = printStatementSequence(
                path as unknown as any,
                p => print(p as AstPath) as unknown as Doc,
            )

            // 将 hardline 放入 indent 内部，确保首行也会被缩进
            return ["{", indent([hardline, printed]), hardline, "}"]
        }

        return base.print(path, options, print)
    }

    function willPrintOwnComments(path: AstPath): boolean {
        const node = path.node as { type?: string } | null

        if (
            node &&
            (node.type === "Program" ||
                node.type === "TSModuleBlock" ||
                node.type === "BlockStatement" ||
                node.type === "ClassBody")
        ) {
            // 将 Program、TSModuleBlock、BlockStatement 和 ClassBody 的注释交回给通用注释打印逻辑，避免遗漏
            return false
        }

        return typeof base.willPrintOwnComments === "function"
            ? base.willPrintOwnComments(path)
            : false
    }

    return { ...base, print, willPrintOwnComments }
}

// 复用官方 parser，并保持命名（babel、babel-ts、typescript）
const parsers = {
    ...(babelPlugin as unknown as PrettierPlugin).parsers,
    ...(typescriptPlugin as unknown as PrettierPlugin).parsers,
}

// 基于 estree 打印机，覆写 Program/BlockStatement 的打印
const baseEstree = (estreePlugin as unknown as PrettierPlugin).printers?.estree!

const printers = {
    estree: createPatchedEstreePrinter(baseEstree),
}

const plugin: PrettierPlugin = {
    printers,
    parsers,
}

export default plugin
