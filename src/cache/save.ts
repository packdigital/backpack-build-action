import {StateProvider} from './state-provider'
import saveImpl from './save-impl'

async function run(): Promise<void> {
  await saveImpl(new StateProvider())
}

run()

export default run
