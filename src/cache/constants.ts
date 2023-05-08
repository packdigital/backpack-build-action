// eslint-disable-next-line no-shadow
export enum Inputs {
  Key = 'key', // Input for cache, restore, save action
  Path = 'path', // Input for cache, restore, save action
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
