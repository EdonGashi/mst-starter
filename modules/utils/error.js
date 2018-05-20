export function stringify(e) {
  if (!e) {
    return false
  }

  if (process.env.NODE_ENV === 'development') {
    if (e === true) {
      return 'Internal server error.'
    }

    if (e.stack) {
      return e.stack
    }

    if (e.message) {
      return e.message
    }

    return e.toString()
  } else {
    return 'Internal server error.'
  }
}
