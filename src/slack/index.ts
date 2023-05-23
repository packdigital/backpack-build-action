import * as core from '@actions/core'
import {HttpsProxyAgent} from 'https-proxy-agent'
import axios from 'axios'
import {flatten} from 'flat'
import github from '@actions/github'
import {parseURL} from 'whatwg-url'

export async function slackSend(
  webhookUrl: string,
  payload: unknown = null
): Promise<void> {
  try {
    if (webhookUrl === undefined || webhookUrl.length <= 0) {
      throw new Error('Need to provide at least one botToken or webhookUrl')
    }

    let webResponse

    if (payload) {
      try {
        // confirm it is valid json
        if (typeof payload === 'string') {
          payload = JSON.parse(payload)
        }
      } catch (e) {
        // passed in payload wasn't valid json
        throw new Error('Need to provide valid JSON payload')
      }
    }

    if (typeof webhookUrl !== 'undefined' && webhookUrl.length > 0) {
      if (!payload) {
        // No Payload was passed in
        // Get the JSON webhook payload for the event that triggered the workflow
        payload = github.context.payload
      }

      const flatPayload = flatten(payload)

      // workflow builder requires values to be strings
      // iterate over every value and convert it to string
      // eslint-disable-next-line github/array-foreach
      Object.keys(flatPayload).forEach(key => {
        flatPayload[key] = `${flatPayload[key]}`
      })

      payload = flatPayload

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
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (webResponse && webResponse.ok) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      core.setOutput('ts', webResponse.ts)
      // return the thread_ts if it exists, if not return the ts
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const thread_ts = webResponse?.thread_ts
        ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          webResponse.thread_ts
        : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          webResponse.ts
      core.setOutput('thread_ts', thread_ts)
      // return id of the channel from the response
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      core.setOutput('channel_id', webResponse.channel)
    }

    const time = new Date().toTimeString()
    core.setOutput('time', time)
  } catch (error) {
    if (error instanceof Error || error === 'string') {
      core.setFailed(error)
    }
  }
}

function templateFailed(repo: string, gitHubUrl: string, logs: string): object {
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
          text: 'Client: ',
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
  repo: string,
  gitHubUrl: string,
  logs: string
): Promise<void> {
  const template = templateFailed(repo, gitHubUrl, logs)

  try {
    await slackSend(process.env.SLACK_WEBHOOK || '', template)
  } catch (error) {
    if (error instanceof Error || error === 'string') {
      core.error(error)
    }
  }
}
