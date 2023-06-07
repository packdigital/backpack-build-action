import * as core from '@actions/core'
import {HttpsProxyAgent} from 'https-proxy-agent'
import axios from 'axios'
import {parseURL} from 'whatwg-url'

export async function slackSend(
  webhookUrl: string,
  payload: unknown
): Promise<void> {
  try {
    if (webhookUrl === undefined || webhookUrl.length <= 0) {
      throw new Error('Need to provide webhookUrl')
    }

    const axiosOpts = {}
    try {
      if (parseURL(webhookUrl).scheme === 'https') {
        const httpsProxy =
          process.env.HTTPS_PROXY || process.env.https_proxy || ''
        if (httpsProxy && parseURL(httpsProxy).scheme === 'http') {
          const httpsProxyAgent = new HttpsProxyAgent(httpsProxy)
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          axiosOpts.httpsAgent = httpsProxyAgent

          // Use configured tunnel above instead of default axios proxy setup from env vars
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          axiosOpts.proxy = false
        }
      }
    } catch (err) {
      core.info(
        'failed to configure https proxy agent for http proxy. Using default axios configuration'
      )
    }

    try {
      await axios.post(webhookUrl, payload, axiosOpts)
    } catch (err) {
      if (err instanceof Error) {
        core.info(
          'axios post failed, double check the payload being sent includes the keys Slack expects'
        )
        if (typeof payload === 'string') {
          core.debug(payload)
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (err.response) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          core.setFailed(err.response.data)
        }

        core.setFailed(err.message)
        return
      }
    }
  } catch (error) {
    if (error instanceof Error || error === 'string') {
      core.setFailed(error)
    }
  }
}

function templateFailed(
  owner: string,
  repo: string,
  gitHubUrl: string,
  logs: string
): object {
  if (logs.length > 1950) {
    logs = `${logs.slice(0, 1950)}...`
  }

  logs = `\`\`\`${logs}\`\`\``

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `The build on ${repo} failed :cry:!`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: `Client: ${owner}`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Check the logs here.'
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'GitHub logs',
            emoji: true
          },
          value: 'click_me_123',
          url: gitHubUrl,
          action_id: 'button-action'
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'Preview:',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: logs
        }
      }
    ]
  }
}

export async function failedMessage(
  owner: string,
  repo: string,
  gitHubUrl: string,
  logs: string
): Promise<void> {
  const SLACK_WEBHOOK = core.getInput('slack_webhook')
  if (!['douglas-pack-org', 'pack-digital-staging'].includes(owner)) {
    if (SLACK_WEBHOOK) {
      try {
        await slackSend(
          SLACK_WEBHOOK,
          templateFailed(owner, repo, gitHubUrl, logs)
        )
      } catch (error) {
        if (error instanceof Error || error === 'string') {
          core.error(error)
        }
      }
    }
  }
}
