import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'

import {createHash} from 'crypto'
import {readFileSync} from 'fs'
// eslint-disable-next-line sort-imports
import {StateProvider} from './cache/state-provider'
import restoreImpl from './cache/restore-impl'

const getMessage = (): string => {
  const messageParts = [`Run id: ${github.context.runId}`]

  const branch: string = core.getInput('branch')

  if (branch) {
    messageParts.push(`Branch: ${branch}`)
  }

  const commitMessage: string | undefined =
    github?.context?.payload?.head_commit?.message

  if (commitMessage) {
    messageParts.push(commitMessage)
  }

  if (!branch && !commitMessage) {
    messageParts.push('Deploy to production')
  }

  return messageParts.join(' | ')
}

const getDeployCommand = (): string => {
  const branch: string = core.getInput('branch')

  if (branch) {
    return `--alias="${branch}"`
  }

  const autoDeployDisabled: string = core.getInput(
    'auto_deploy_netlify_disabled'
  )

  if (autoDeployDisabled) {
    return '--prodIfUnlocked'
  }

  return '--prod'
}

const hashFile = (file: string): string => {
  const fileBuffer = readFileSync(file)
  const hashSum = createHash('sha256')
  hashSum.update(fileBuffer)
  return hashSum.digest('hex')
}
const restoreCache = async (): Promise<void> => {
  await restoreImpl(
    new StateProvider(),
    `build-backpack-${hashFile('yarn.lock')}`,
    ['~/.npm', './node_modules', './.backpack/build/cache']
  )
}

const getInputs = (): boolean => {
  const netlifyAuthToken: string = core.getInput('netlify_auth_token')

  if (!netlifyAuthToken) {
    return false
  }

  const packApiUrl: string = core.getInput('pack_api_url')

  if (packApiUrl) {
    core.exportVariable('PACK_API_URL', packApiUrl)
  }

  core.exportVariable('NETLIFY_SITE_ID', core.getInput('netlify_site_id'))
  core.exportVariable('BACKPACK_SITE_ID', core.getInput('backpack_site_id'))
  core.exportVariable('CMS_CONTENT_TOKEN', core.getInput('cms_content_token'))
  core.exportVariable('SHOPIFY_DOMAIN', core.getInput('shopify_domain'))
  core.exportVariable('SITE_URL', core.getInput('site_url'))
  core.exportVariable('NETLIFY_AUTH_TOKEN', core.getInput('netlify_auth_token'))
  core.exportVariable(
    'BACKPACK_API_SECRET_TOKEN',
    core.getInput('backpack_api_secret_token')
  )
  core.exportVariable(
    'CMS_MANAGEMENT_TOKEN',
    core.getInput('cms_management_token')
  )
  core.exportVariable(
    'SHOPIFY_ADMIN_API_TOKEN',
    core.getInput('shopify_admin_api_token')
  )
  core.exportVariable(
    'SHOPIFY_STOREFRONT_API_TOKEN',
    core.getInput('shopify_storefront_api_token')
  )

  return true
}

async function run(): Promise<void> {
  try {
    if (!getInputs()) return

    await restoreCache()

    await exec.exec('yarn')

    await exec.exec('netlify', ['--version'])

    await exec.exec('netlify', [
      'deploy',
      '--debug',
      '--build',
      getDeployCommand(),
      '--message',
      getMessage()
    ])
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
