const a = true
const b = false
const c = 1
const d = 2
const e = { key: 1 }
const f = { key: 2 }
const arr = [1, 2, 3]
function someFn() {}

function test1() {
  if (!(a || b)) {
  }
  if (!(a || c === d)) {
  }
  if (!(b || c !== d)) {
  }
  const x1 = !(a || c < d)
  const x2 = !(a || c <= d)
  const x3 = !(a || c > d)
  const x4 = !(a || c >= d)
  const x5 = !(a || 'key' in e)
  const x6 = !(a || e instanceof Object)
  someFn(!(a || b))
  !(a || b) || someFn()
  return !(a || b || !a)
}

while (!(a || c > d)) {
  break
}

for (let i = 0; !(a || arr[i] == 2); i++) {}

do {} while (!(a || arr.includes(d)))

const obj = {
  p1: !(a || b),
  p2: !(a || c === d),
  p3: !(a || c !== d),
  p4: !(a || c < d),
  p5: !(a || c <= d),
  p6: !(a || c > d),
  p7: !(a || c >= d),
  p8: !(a || 'key' in e),
  p9: !(a || e instanceof Object),
  p10: !(a || arr.length === 3),
}

const arr2 = [
  !(a || b),
  !(a || c === d),
  !(a || c !== d),
  !(a || c < d),
  !(a || c <= d),
  !(a || c > d),
  !(a || c >= d),
  !(a || 'key' in e),
  !(a || e instanceof Object),
  !(a || arr.length === 3),
]

;(() => {
  !(a || b) ? someFn() : someFn()
  const y1 = !(a || b)
  const y2 = !(a || c === d)
  const y3 = !(a || c !== d)
  const y4 = !(a || c < d)
  const y5 = !(a || c <= d)
  const y6 = !(a || c > d)
  const y7 = !(a || c >= d)
  const y8 = !(a || 'key' in e)
  const y9 = !(a || e instanceof Object)
  const y10 = !(a || arr.length === 3)
})()
