import encryptorFactory from 'simple-encryptor'
import warning from 'utils/warning'
import { observable } from 'mobx'

const key = process.env.SECRETMANAGER_KEY
if (process.env.NODE_ENV === 'production') {
  warning(key, 'No key provided for secret manager, a default one will be used, which is intended for testing only.')
}

const encryptor = encryptorFactory(key || 'JV5K2ZSHV19B2K4F')
