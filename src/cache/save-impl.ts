import * as cache from '@actions/cache'
import * as core from '@actions/core'

import * as utils from './utils/action-utils'
import {Events, Inputs} from './constants'
import {IStateProvider} from './state-provider'

// Catch and log any unhandled exceptions.  These exceptions can leak out of the uploadChunk method in
// @actions/toolkit when a failed upload closes the file descriptor causing any in-process reads to
// throw an uncaught exception.  Instead of failing this action, just warn.
process.on('uncaughtException', e => utils.logWarning(e.message))

async function saveImpl(
  stateProvider: IStateProvider,
  primaryKey: string,
  cachePaths: string[]
): Promise<number | void> {
  let cacheId = -1
  try {
    if (!utils.isCacheFeatureAvailable()) {
      return
    }

    if (!utils.isValidEvent()) {
      utils.logWarning(
        `Event Validation Error: The event type ${
          process.env[Events.Key]
        } is not supported because it's not tied to a branch or tag ref.`
      )
      return
    }

    // If matched restore key is same as primary key, then do not save cache
    // NO-OP in case of SaveOnly action
    const restoredKey = stateProvider.getCacheState()

    if (utils.isExactKeyMatch(primaryKey, restoredKey)) {
      core.info(
        `Cache hit occurred on the primary key ${primaryKey}, not saving cache.`
      )
      return
    }

    const enableCrossOsArchive = false

    cacheId = await cache.saveCache(
      cachePaths,
      primaryKey,
      {uploadChunkSize: utils.getInputAsInt(Inputs.UploadChunkSize)},
      enableCrossOsArchive
    )

    if (cacheId !== -1) {
      core.info(`Cache saved with key: ${primaryKey}`)
    }
  } catch (error: unknown) {
    utils.logWarning((error as Error).message)
  }
  return cacheId
}

export default saveImpl
