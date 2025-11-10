const a = 1

const b = 2

const c = {
    name: "Tom",
    age: 18,
}

/**
 * 测试
 */
const d = [
    {
        name: "Tom",
        age: 18,
    },
    {
        name: "Jerry",
        age: 20,
    },
]

const w = 2

const x = `



`

const {
    a1111,
    b1111,
    c1111,
    d1111,
    e1111,
    f1111,
    g1111,
    h1111,
    i1111,
    j1111,
    ...rest
} = {
    a1111: 1,
    b1111: 2,
    c1111: 3,
    d1111: 4,
    e1111: 5,
    f1111: 6,
    g1111: 7,
    h1111: 8,
    i1111: 9,
    j1111: 10,
}

export {}

class Person {
    name: string
    age: number

    toString() {
        return "Person"
    }

    getAge() {
        return this.age
    }
}

class Animal {
    species: string

    makeSound() {
        console.log("sound")
    }
}
