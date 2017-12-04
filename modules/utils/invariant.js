// Modified version of facebook's invariant.

let invariant = function (condition) {
  if (!condition) {
    throw new Error('Minified exception occurred.')
  }
}

if (process.env.NODE_ENV !== 'production' || process.env.SERVER) {
  invariant = function invariant(condition, message) {
    if (!message) {
      throw new Error('invariant requires a message argument.')
    }

    if (!condition) {
      const error = new Error(message)
      error.framesToPop = 1
      throw error
    }
  }
}

export default invariant
