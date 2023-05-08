import * as github from '@actions/github'
import {hashFile} from './utils/action-utils'

export const primaryKey = `backpack-${github.context.ref}-${hashFile(
  github.context.ref,
  'yarn.lock'
)}`

export const cachePaths: string[] = [
  '~/.npm',
  './node_modules',
  './.backpack/build/cache'
]

// eslint-disable-next-line no-shadow
export enum Inputs {
  UploadChunkSize = 'upload-chunk-size' // Input for cache, save action
}

// eslint-disable-next-line no-shadow
export enum Outputs {
  CacheHit = 'cache-hit', // Output from cache, restore action
  CachePrimaryKey = 'cache-primary-key', // Output from restore action
  CacheMatchedKey = 'cache-matched-key' // Output from restore action
}

// eslint-disable-next-line no-shadow
export enum State {
  CachePrimaryKey = 'CACHE_KEY',
  CacheMatchedKey = 'CACHE_RESULT'
}

// eslint-disable-next-line no-shadow
export enum Events {
  Key = 'GITHUB_EVENT_NAME'
}

export const RefKey = 'GITHUB_REF'
