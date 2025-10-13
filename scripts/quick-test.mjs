import prettier from "prettier"
import plugin from "../dist/index.js"

async function run() {
    const jsInput = `const a = 1
const b = {
  name: "Tom",
  age: 18,
}
const c = 1

if (a) {
  const d = 1
}
const e = 1`

    const tsInput = `type A = number
type B = {
  name: string
}
type C = string`

    const jsOut = await prettier.format(jsInput, {
        parser: "babel",
        plugins: [plugin],
    })
    const tsOut = await prettier.format(tsInput, {
        parser: "typescript",
        plugins: [plugin],
    })
    console.log("=== JS ===\n" + jsOut)
    console.log("=== TS ===\n" + tsOut)
}

run()
