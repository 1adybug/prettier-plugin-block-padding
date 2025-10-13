// @ts-check
import plugin from "./dist/index.js"

/**
 * @type {import("prettier").Options}
 */
const config = {
    semi: false,
    tabWidth: 4,
    arrowParens: "avoid",
    printWidth: 80,
    endOfLine: "lf",
    plugins: ["prettier-plugin-organize-imports", plugin],
}

export default config
