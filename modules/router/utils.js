import warning from 'utils/warning'
import { encode, decode } from 'utils/string-encoding'
import { parsePath } from 'history/PathUtils'
import { createLocation } from 'history/LocationUtils'
import qs from 'qs'

function tryDecode(s) {
  if (typeof s === 'string' && s.length > 0) {
    try {
      return { state: decode(s), isValidState: true }
    } catch (err) {
      return { state: null, isValidState: false }
    }
  } else {
    return { state: null, isValidState: true }
  }
}

function merge(query, state) {
  if (state !== undefined && state !== null) {
    state = encode(state)
    if (!query) {
      return { _state: state }
    }

    if (typeof query === 'string') {
      query = qs.parse(query, { ignoreQueryPrefix: true })
    } else if (typeof query !== 'object') {
      warning(false, 'Invalid query object.')
      return { _state: state }
    }

    warning(!('_state' in query), 'Query object should not contain key \'_state\' because it will be overwritten by state.')
    return qs.stringify({ ...query, _state: state })
  } else if (query !== null && typeof query === 'object') {
    return qs.stringify(query)
  } else if (typeof query === 'string') {
    return query
  } else {
    return ''
  }
}

function wrap(path, query, state, hash) {
  const { pathname, search: searchStr, hash: hashStr } = parsePath(path)
  warning(!(query && searchStr), 'A query string is found in path. This will be overwritten because \'query\' parameter exists in location.')
  warning(!(hash && hashStr), 'A hash string is found in path. This will be overwritten because \'hash\' parameter exists in location.')
  return {
    pathname,
    search: merge(query || searchStr, state),
    hash: hash || hashStr
  }
}

export function fromLocation(location) {
  const { _state, ...query } = qs.parse(location.search || '', { ignoreQueryPrefix: true })
  const { state, isValidState } = tryDecode(_state)
  return {
    path: location.pathname,
    hash: location.hash,
    query,
    state,
    isValidState
  }
}

export function toPath(arg, currentLocation) {
  if (typeof arg === 'string') {
    return createLocation(arg, null, null, currentLocation).pathname
  } else if (Array.isArray(arg)) {
    return createLocation({
      pathname: arg[0]
    }, null, null, currentLocation).pathname
  } else if (arg !== null && typeof arg === 'object') {
    return createLocation({
      pathname: arg.path || arg.pathname
    }, null, null, currentLocation).pathname
  } else {
    return null
  }
}

export function toLocation(arg, currentLocation) {
  if (typeof arg === 'string') {
    return createLocation(arg, null, null, currentLocation)
  } else if (Array.isArray(arg)) {
    return createLocation(wrap(arg[0], arg[1], arg[2], arg[3]), null, null, currentLocation)
  } else if (arg !== null && typeof arg === 'object') {
    return createLocation(wrap(arg.path || arg.pathname, arg.query, arg.state, arg.hash), null, null, currentLocation)
  } else {
    throw new Error('Invalid location.')
  }
}

export function getProps(app, props, clone = true) {
  if (props && typeof props === 'object') {
    return clone ? { ...props } : props
  }

  if (typeof props === 'function') {
    return props(app)
  }

  return {}
}
