# ChatVisualNovel - 这部视觉小说，由 ChatGPT 来写，永不结束。

[![ci](https://github.com/prompt-engineering/chat-visual-novel/actions/workflows/ci.yml/badge.svg)](https://github.com/prompt-engineering/chat-visual-novel/actions/workflows/ci.yml)
![GitHub](https://img.shields.io/github/license/prompt-engineering/chat-visual-novel)

演示: https://chatvisualnovel.com/

[English](./README.md) | 简体中文

# 在 Vercel 上部署 ChatVisualNovel，使用 Planetscale

按照以下步骤，在 Vercel 上部署 ChatVisualNovel，使用由 Planetscale 提供的无服务器 MySQL 数据库：

1.  从 GitHub 克隆 [ChatVisualNovel](https://github.com/prompt-engineering/chat-visual-novel)。
2.  创建 Vercel 帐户，并将其连接到 GitHub 帐户。
3.  创建 [Planetscale](https://app.planetscale.com) 帐户。
4.  设置 Planetscale 数据库：
    1.  使用 `pscale auth login` 登录 Planetscale 帐户。
    2.  使用 `pscale password create <DATABASE_NAME> <BRANCH_NAME> <PASSWORD_NAME>` 创建密码。
    3.  使用 `npx prisma db push` 将数据库推送到 Planetscale。
5.  配置 Vercel 环境：
    - 将 `DATABASE_URL` 设置为 Planetscale 数据库的 URL。
    - 使用 `node scripts/gen-enc.js` 生成加密密钥，并将其设置为 `ENC_KEY`。

完成这些步骤后，您的 ChatVisualNovel 将在 Vercel 上部署，并使用 Planetscale 的无服务器 MySQL 数据库。

## 本地搭建

1. 从 GitHub 克隆 [ChatVisualNovel](https://github.com/prompt-engineering/chat-visual-novel)。
2. 暂时仍依赖 Planetscale 服务，按照上小节注册，并配置`DATABASE_URL`到.env 文件。
3. 执行 `npm install`。
4. 使用 `node scripts/gen-enc.js` 生成加密密钥，在 `.env` 文件中配置 `ENC_KEY=***` 的形式。（PS：`.env` 文件可以从 env.template 复制过去）
5. 直接运行 `npm run dev` 就可以使用了。

# 自定义模版

[assets.json](src/assets/assets.json)
```typescript
{
  "genres": string[],           //（Required）（i18n）故事类型，用于Prompt
  "player": {                   // (Optional）让ChatGPT命名的玩家角色，当 characters 中不存在 isPlayer: true 的角色时使用。
    [key: string]: string,          //（Required） 每一个key对应一个这个角色的表情，可以是任意数量但必须存在一个 neutral，角色列表中第一位角色的所有可能表情将被使用在 Prompt 中作为可挑选的 mood。value 是这个表情对应的图片地址。
  },
  "playerGender": string,       //（Required）（i18n）主人公性别，用于Prompt
  "girls": [{                   // (Optional）让ChatGPT命名的女性角色，当 characters 中不存在 isPlayer: false 的角色时使用。
    [key: string]: string,          //（Required）每一个key对应一个这个角色的表情，可以是任意数量但必须存在一个 neutral，角色列表中第一位角色的所有可能表情将被使用在 Prompt 中作为可挑选的 mood。value 是这个表情对应的图片地址。
  }],
  "characters": {               //（Optional）有名字的角色
    [key: string]: {                //（Required）（i18n）角色名字，用于Prompt
      "isPlayer": boolean,          //（Optional）设为 true 时将作为玩家角色，请只设置一个玩家角色。
      "images": {
        [key: string]: string,      //（Required）每一个key对应一个这个角色的表情，可以是任意数量但必须存在一个 neutral，角色列表中第一位角色的所有可能表情将被使用在 Prompt 中作为可挑选的 mood。value 是这个表情对应的图片地址。
      }
    }
  },
  "places": {                   //（Required）地点（背景）
    [key: string]: string,          // （Required）（i18n）每一个key对应一个地点，可以是任意数量但必须至少存在一个，所有可能的地点将被使用在 Prompt 中作为可挑选的 location。value 是这个地点对应的图片地址。
  },
  "characterPosition": {        //（Optional）角色图片显示配置（CSS）
    "bottom": "0",                  //（Optional）到屏幕最下方的距离，默认值 100% (文字对话框高度）
    "maxW": "70vw",                 //（Optioanl）最大宽度，默认值 70vw
    "maxH": "70vh"                  //（Optioanl）最大高度，默认值 70vh
  }
}
```

## LICENSE

This code is distributed under the MIT license. See [LICENSE](./LICENSE) in this directory.
