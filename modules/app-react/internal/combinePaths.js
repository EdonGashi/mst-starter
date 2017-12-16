import invariant from 'utils/invariant'

export default function combinePaths(path1, path2) {
  if (path1 instanceof Array) {
    if (path2 instanceof Array) {
      return [...path1, ...path2]
    } else {
      invariant(typeof path2 === 'string', 'Paths must be either arrays or strings.')
      return [...path1, ...path2.split('.')]
    }
  } else {
    invariant(typeof path1 === 'string', 'Paths must be either arrays or strings.')
    if (path2 instanceof Array) {
      return [...path1.split('.'), ...path2]
    } else {
      invariant(typeof path2 === 'string', 'Paths must be either arrays or strings.')
      return path1 + '.' + path2
    }
  }
}
