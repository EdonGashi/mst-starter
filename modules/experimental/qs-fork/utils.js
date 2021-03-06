const has = Object.prototype.hasOwnProperty

const hexTable = (function () {
  const array = []
  for (let i = 0; i < 256; ++i) {
    array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase())
  }

  return array
}())

const compactQueue = function compactQueue(queue) {
  let obj

  while (queue.length) {
    const item = queue.pop()
    obj = item.obj[item.prop]

    if (Array.isArray(obj)) {
      const compacted = []

      for (let j = 0; j < obj.length; ++j) {
        if (typeof obj[j] !== 'undefined') {
          compacted.push(obj[j])
        }
      }

      item.obj[item.prop] = compacted
    }
  }

  return obj
}

export const arrayToObject = function arrayToObject(source, options) {
  const obj = options && options.plainObjects ? Object.create(null) : {}
  for (let i = 0; i < source.length; ++i) {
    if (typeof source[i] !== 'undefined') {
      obj[i] = source[i]
    }
  }

  return obj
}

export const merge = function merge(target, source, options) {
  if (!source) {
    return target
  }

  if (typeof source !== 'object') {
    if (Array.isArray(target)) {
      target.push(source)
    } else if (typeof target === 'object') {
      if (options.plainObjects || options.allowPrototypes || !has.call(Object.prototype, source)) {
        target[source] = true
      }
    } else {
      return [target, source]
    }

    return target
  }

  if (typeof target !== 'object' || target.constructor === Blob || target.constructor === File) {
    return [target].concat(source)
  }

  let mergeTarget = target
  if (Array.isArray(target) && !Array.isArray(source)) {
    mergeTarget = arrayToObject(target, options)
  }

  if (Array.isArray(target) && Array.isArray(source)) {
    source.forEach(function (item, i) {
      if (has.call(target, i)) {
        if (target[i] && typeof target[i] === 'object') {
          target[i] = merge(target[i], item, options)
        } else {
          target.push(item)
        }
      } else {
        target[i] = item
      }
    })
    return target
  }

  return Object.keys(source).reduce(function (acc, key) {
    const value = source[key]

    if (has.call(acc, key)) {
      acc[key] = merge(acc[key], value, options)
    } else {
      acc[key] = value
    }
    return acc
  }, mergeTarget)
}

export const assign = function assignSingleSource(target, source) {
  return Object.keys(source).reduce(function (acc, key) {
    acc[key] = source[key]
    return acc
  }, target)
}

export const decode = function (str) {
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '))
  } catch (e) {
    return str
  }
}

export const encode = function encode(str) {
  // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
  // It has been adapted here for stricter adherence to RFC 3986
  if (str.length === 0) {
    return str
  }

  const string = typeof str === 'string' ? str : String(str)

  let out = ''
  for (let i = 0; i < string.length; ++i) {
    let c = string.charCodeAt(i)

    if (
      c === 0x2D // -
      || c === 0x2E // .
      || c === 0x5F // _
      || c === 0x7E // ~
      || c >= 0x30 && c <= 0x39 // 0-9
      || c >= 0x41 && c <= 0x5A // a-z
      || c >= 0x61 && c <= 0x7A // A-Z
    ) {
      out += string.charAt(i)
      continue
    }

    if (c < 0x80) {
      out = out + hexTable[c]
      continue
    }

    if (c < 0x800) {
      out = out + (hexTable[0xC0 | c >> 6] + hexTable[0x80 | c & 0x3F])
      continue
    }

    if (c < 0xD800 || c >= 0xE000) {
      out = out + (hexTable[0xE0 | c >> 12] + hexTable[0x80 | c >> 6 & 0x3F] + hexTable[0x80 | c & 0x3F])
      continue
    }

    i += 1
    c = 0x10000 + ((c & 0x3FF) << 10 | string.charCodeAt(i) & 0x3FF)
    out += hexTable[0xF0 | c >> 18]
      + hexTable[0x80 | c >> 12 & 0x3F]
      + hexTable[0x80 | c >> 6 & 0x3F]
      + hexTable[0x80 | c & 0x3F]
  }

  return out
}

export const compact = function compact(value) {
  const queue = [{ obj: { o: value }, prop: 'o' }]
  const refs = []

  for (let i = 0; i < queue.length; ++i) {
    const item = queue[i]
    const obj = item.obj[item.prop]

    const keys = Object.keys(obj)
    for (let j = 0; j < keys.length; ++j) {
      const key = keys[j]
      const val = obj[key]
      if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
        queue.push({ obj: obj, prop: key })
        refs.push(val)
      }
    }
  }

  return compactQueue(queue)
}

export const isRegExp = function isRegExp(obj) {
  return Object.prototype.toString.call(obj) === '[object RegExp]'
}

export const isBuffer = function isBuffer(obj) {
  if (obj === null || typeof obj === 'undefined') {
    return false
  }

  return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj))
}
