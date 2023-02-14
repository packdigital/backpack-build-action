import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'

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
    return `--alias ${branch}`
  }

  const autoDeployDisabled: string = core.getInput(
    'auto_deploy_netlify_disabled'
  )

  if (autoDeployDisabled) {
    return '--prod-if-unlocked'
  }

  return '--prod'
}

async function run(): Promise<void> {
  try {
    const netlifyAuthToken: string = core.getInput('netlify_auth_token')

    if (!netlifyAuthToken) {
      return
    }

    const packApiUrl: string = core.getInput('pack_api_url')

    if (packApiUrl) {
      core.exportVariable('PACK_API_URL', packApiUrl)
    }

    const resp = await exec.exec(
      `sudo /usr/bin/netlify`,
      ['deploy', '--build', getDeployCommand(), '--message', getMessage()],
      {
        env: {
          NETLIFY_SITE_ID: core.getInput('netlify_site_id'),
          BACKPACK_SITE_ID: core.getInput('backpack_site_id'),
          CMS_CONTENT_TOKEN: core.getInput('cms_content_token'),
          SHOPIFY_DOMAIN: core.getInput('shopify_domain'),
          SITE_URL: core.getInput('site_url'),
          NETLIFY_AUTH_TOKEN: core.getInput('netlify_auth_token'),
          BACKPACK_API_SECRET_TOKEN: core.getInput('backpack_api_secret_token'),
          CMS_MANAGEMENT_TOKEN: core.getInput('cms_management_token'),
          SHOPIFY_ADMIN_API_TOKEN: core.getInput('shopify_admin_api_token'),
          SHOPIFY_STOREFRONT_API_TOKEN: core.getInput(
            'shopify_storefront_api_token'
          )
        }
      }
    )

    console.log('resp', resp)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
