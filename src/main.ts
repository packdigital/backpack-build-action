import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'

import {cachePaths, primaryKey} from './cache/constants'
import {StateProvider} from './cache/state-provider'
import restoreImpl from './cache/restore-impl'

import {failedMessage} from './slack'
import axios from 'axios'

const sendBackPackWebHook = async (status: string): Promise<void> => {
  try {
    const packApiUrl: string =
      core.getInput('pack_api_url') || 'https://app.packdigital.com'

    await axios.post(`${packApiUrl}/webhooks/deploys`, {
      id: core.getInput('deploy_id'),
      build_id: `${github.context.runId}`,
      site_id: core.getInput('backpack_site_id'),
      status
    })
  } catch (err) {
    if (err instanceof Error) {
      core.info(err.message)
    }
  }
}

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

  const message: string = core.getInput('message')

  if (message) {
    messageParts.push(message)
  }

  if (!branch && !commitMessage && !message) {
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

const restoreCache = async (): Promise<void> => {
  await restoreImpl(new StateProvider(), primaryKey, cachePaths)
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
  const summary = core.summary

  const stdout: string[] = []

  try {
    core.startGroup('Get Inputs')
    if (!getInputs()) return
    core.endGroup()

    core.startGroup('Send Deploy Webhook')
    await sendBackPackWebHook('building')
    core.endGroup()

    core.startGroup('Restore Cache')
    await restoreCache()
    core.endGroup()

    core.startGroup('Install Packages')
    await exec.exec('yarn')
    core.endGroup()

    core.startGroup('Build StoreFront')

    await exec.exec('netlify', ['--version'])

    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          stdout.push(data.toString())
        }
      }
    }

    await exec.exec(
      'netlify',
      ['deploy', '--build', getDeployCommand(), '--message', getMessage()],
      options
    )

    core.endGroup()

    core.startGroup('Send Deploy Webhook')
    await sendBackPackWebHook('ready')
    core.endGroup()

    summary.addHeading('Deploy Success :rocket:')

    const success = stdout.findIndex(s => s.includes('Netlify Build completed'))

    if (success !== -1) {
      const mainUrl = stdout.findIndex(s => s.includes('Unique Deploy URL'))
      if (mainUrl !== -1) {
        const url = stdout[mainUrl]

        summary.addLink(
          'NetLify URL',
          url.split('\n')[1].replace('Unique Deploy URL: ', '')
        )
      }

      const draftUrl = stdout.findIndex(s => s.includes('Website Draft URL'))
      if (draftUrl !== -1) {
        const url = stdout[draftUrl]
        summary.addLink(
          'NetLify URL',
          url.split('\n')[1].replace('Website Draft URL: ', '')
        )
      }
    }
  } catch (error) {
    core.startGroup('Send Deploy Webhook')
    await sendBackPackWebHook('failed')
    core.endGroup()

    if (error instanceof Error) {
      summary.addHeading(
        `The build failed! :anguished: :negative_squared_cross_mark:`,
        2
      )

      const index = stdout.findIndex(s => s.includes('✖'))
      const index2 = stdout.findIndex(s => s.includes('"build.command" failed'))
      const errorCode = stdout.slice(index, index2).join('\n')
      if (errorCode) {
        summary.addCodeBlock(errorCode)
        core.setFailed(errorCode)

        await failedMessage(
          github?.context.repo.owner,
          github?.context.repo.repo,
          `${github.context.serverUrl}/${github?.context.repo.owner}/${github?.context.repo.repo}/actions/runs/${github.context.runId}`,
          errorCode
        )
      } else {
        const indexBuildFailed = stdout.findIndex(s =>
          s.includes('"build.command" failed')
        )

        const errorCodeBuildFailed = stdout.slice(indexBuildFailed).join('\n')
        if (errorCodeBuildFailed) {
          summary.addCodeBlock(errorCodeBuildFailed)
          core.setFailed(errorCodeBuildFailed)

          await failedMessage(
            github?.context.repo.owner,
            github?.context.repo.repo,
            `${github.context.serverUrl}/${github?.context.repo.owner}/${github?.context.repo.repo}/actions/runs/${github.context.runId}`,
            errorCodeBuildFailed
          )
        } else {
          core.setFailed(error.message)
        }
      }
    }
  }

  await summary.write()
}

run()
