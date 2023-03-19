# ChatVisualNovel - An endless visual novel powered by ChatGPT.

[![ci](https://github.com/prompt-engineering/chat-visual-novel/actions/workflows/ci.yaml/badge.svg)](https://github.com/prompt-engineering/chat-visual-novel/actions/workflows/ci.yaml)
![GitHub](https://img.shields.io/github/license/prompt-engineering/chat-visual-novel)
[![Discord](https://img.shields.io/discord/1082563233593966612)](https://discord.gg/FSWXq4DmEj)

English | [简体中文](./README.zh-CN.md)

Online Demo: https://visualnovel.fluoritestudio.com/

Join us:

[![Chat Server](https://img.shields.io/badge/chat-discord-7289da.svg)](https://discord.gg/FSWXq4DmEj)

# Deploy ChatVisualNovel on Vercel with Planetscale

Follow these steps to deploy ChatVisualNovel on Vercel with a serverless MySQL database provided by Planetscale:

1.  Clone the [ChatVisualNovel repo](https://github.com/prompt-engineering/chat-visual-novel) from GitHub.
2.  Create a Vercel account and connect it to your GitHub account.
3.  Create a [Planetscale](https://app.planetscale.com) account.
4.  Set up your Planetscale database:
    1.  Log in to your Planetscale account with `pscale auth login`.
    2.  Create a password with `pscale password create <DATABASE_NAME> <BRANCH_NAME> <PASSWORD_NAME>`.
    3.  Push your database to Planetscale with `npx prisma db push`.
5.  Configure your Vercel environment:
    - Set `DATABASE_URL` to your Planetscale database URL.
    - Generate an encryption key with `node scripts/gen-enc.js` and set it as `ENC_KEY`.

With these steps completed, your ChatVisualNovel will be deployed on Vercel with a Planetscale serverless MySQL database.

# Development

## LICENSE

This code is distributed under the MIT license. See [LICENSE](./LICENSE) in this directory.
