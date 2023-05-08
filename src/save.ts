import {cachePaths, primaryKey} from './cache/constants'
import {StateProvider} from './cache/state-provider'
import saveImpl from './cache/save-impl'

async function run(): Promise<void> {
  await saveImpl(new StateProvider(), primaryKey, cachePaths)
}

run()

export default run
