import axios from 'axios'

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

  await axios.post(
    'https://hooks.slack.com/services/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',
    template
  )
}
