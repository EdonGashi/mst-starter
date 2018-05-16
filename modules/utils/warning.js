// Modified version of facebook's warning.

let warning = function () { }

if (process.env.NODE_ENV !== 'production' || process.env.IS_SERVER) {
  warning = function warning(condition, message) {
    if (!message) {
      throw new Error('warning requires a message argument.')
    }

    if (!condition) {
      if (typeof console !== 'undefined') {
        console.error(message)
      }

      try {
        throw new Error(message)
      } catch (x) {
        // stack trace helper
      }
    }
  }
}

export default warning
