import * as core from '@actions/core'
import {cachePaths, primaryKey} from './cache/constants'
import {StateProvider} from './cache/state-provider'
import saveImpl from './cache/save-impl'

async function run(): Promise<void> {
  const netlifyAuthToken: string = core.getInput('netlify_auth_token')

  if (netlifyAuthToken) {
    await saveImpl(new StateProvider(), primaryKey, cachePaths)
  }
}

run()

export default run
