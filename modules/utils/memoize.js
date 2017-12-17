export default function memoize(func) {
  let lastArg
  let lastResult
  return function (arg) {
    if (arg === lastArg) {
      return lastResult
    }

    lastArg = arg
    lastResult = func(arg)
    return lastResult
  }
}
