import * as cache from '@actions/cache'
import * as core from '@actions/core'

import * as utils from './utils/action-utils'
import {Events, Outputs, State} from './constants'
import {IStateProvider} from './state-provider'

async function restoreImpl(
  stateProvider: IStateProvider,
  primaryKey: string,
  cachePaths: string[]
): Promise<string | undefined> {
  try {
    if (!utils.isCacheFeatureAvailable()) {
      core.setOutput(Outputs.CacheHit, 'false')
      return
    }

    // Validate inputs, this can cause task failure
    if (!utils.isValidEvent()) {
      utils.logWarning(
        `Event Validation Error: The event type ${
          process.env[Events.Key]
        } is not supported because it's not tied to a branch or tag ref.`
      )
      return
    }

    stateProvider.setState(State.CachePrimaryKey, primaryKey)

    const restoreKeys: string[] | undefined = []
    const enableCrossOsArchive = false
    const failOnCacheMiss = false
    const lookupOnly = false

    const cacheKey = await cache.restoreCache(
      cachePaths,
      primaryKey,
      restoreKeys,
      {lookupOnly},
      enableCrossOsArchive
    )

    if (!cacheKey) {
      if (failOnCacheMiss) {
        throw new Error(
          `Failed to restore cache entry. Exiting as fail-on-cache-miss is set. Input key: ${primaryKey}`
        )
      }
      core.info(
        `Cache not found for input keys: ${[primaryKey, ...restoreKeys].join(
          ', '
        )}`
      )

      return
    }

    // Store the matched cache key in states
    stateProvider.setState(State.CacheMatchedKey, cacheKey)

    const isExactKeyMatch = utils.isExactKeyMatch(
      core.getInput(primaryKey, {required: true}),
      cacheKey
    )

    core.setOutput(Outputs.CacheHit, isExactKeyMatch.toString())
    if (lookupOnly) {
      core.info(`Cache found and can be restored from key: ${cacheKey}`)
    } else {
      core.info(`Cache restored from key: ${cacheKey}`)
    }

    return cacheKey
  } catch (error: unknown) {
    core.setFailed((error as Error).message)
  }
}

export default restoreImpl
