export default function makeClass(...args) {
  if (!args || args.length === 0) {
    return ''
  }

  let result = ' '
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (typeof arg === 'string') {
      result += arg + ' '
    }
  }

  return result
}
