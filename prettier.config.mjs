// @ts-check
import plugin from "./dist/index.js"

/**
 * @type {import("prettier").Options}
 */
const config = {
    semi: false,
    tabWidth: 4,
    arrowParens: "avoid",
    endOfLine: "lf",
    plugins: [plugin],
}

export default config
