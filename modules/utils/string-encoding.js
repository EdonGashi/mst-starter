import { encode as enc, decode as dec } from 'hi-base32'
import adler32 from 'adler-32'
import padStart from 'lodash/padStart'
import trimEnd from 'lodash/trimEnd'

// Provides JSON encoding and decoding for URL codes with a small checksum check.
// This is not meant to be cryptographically secure. Encryption is only used to diffuse encoded strings.

const nonce = 'J3GF4BLHSC'
const salt = 'FU1KPHJWNL4SLXETM2T7G3ZNRXBFMXZD8YIHV2H89I3CYB3K6YUQG90QV2XMCLUTDWXD2P7PNA0F1RYLWUA9OJ9A72'

function xor(str, salt, saltStart = 0) {
  const len = str.length
  const saltLen = salt.length
  let result = ''
  for (let i = 0; i < len; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ salt.charCodeAt((saltStart + i) % saltLen))
  }

  return result
}

function checksum(str) {
  let num = adler32.str(str) & 0xffffffff
  if (num < 0) {
    num = 0xffffffff + num + 1
  }

  const value = num.toString(16)
  return padStart(value, 8, (8 - value.length).toString())
}

function rc4(str, key) {
  const strLen = str.length
  const keyLen = key.length
  const s = []
  let i
  let j = 0
  let x
  let res = ''
  for (i = 0; i < 256; i++) {
    s[i] = i
  }

  for (i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % keyLen)) % 256
    x = s[i]
    s[i] = s[j]
    s[j] = x
  }

  i = 0
  j = 0
  for (let y = 0; y < strLen; y++) {
    i = (i + 1) % 256
    j = (j + s[i]) % 256
    x = s[i]
    s[i] = s[j]
    s[j] = x
    res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256])
  }

  return res
}

export function encode(obj) {
  if (typeof obj === 'undefined') {
    throw new Error('Invalid argument.')
  }

  let str = JSON.stringify(obj)
  const hash = checksum(str)
  str = rc4(str, hash + nonce)
  str += hash
  str = xor(str, salt, str.length)
  return trimEnd(enc(str), '=').toLowerCase()
}

export function decode(str) {
  if (typeof str !== 'string') {
    throw new Error('Invalid argument.')
  }

  str = dec(str.toUpperCase())
  if (str.length <= 8) {
    throw new Error('Invalid argument.')
  }

  str = xor(str, salt, str.length)
  const hash = str.substr(str.length - 8)
  const plain = rc4(str.substr(0, str.length - 8), hash + nonce)
  const computedHash = checksum(plain)
  if (hash !== computedHash) {
    throw new Error('Checksum error.')
  }

  return JSON.parse(plain)
}

export function tryDecode(str) {
  try {
    return decode(str)
  } catch (err) {
    return null
  }
}
