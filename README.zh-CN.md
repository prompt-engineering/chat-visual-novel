# ChatVisualNovel - 基于 ChatGPT 的定制化视觉小说引擎。

[![ci](https://github.com/prompt-engineering/chat-visual-novel/actions/workflows/ci.yml/badge.svg)](https://github.com/prompt-engineering/chat-visual-novel/actions/workflows/ci.yml)
![GitHub](https://img.shields.io/github/license/prompt-engineering/chat-visual-novel)

演示: https://chatvisualnovel.com/

原神同人（AI语音）: https://genshin.chatvisualnovel.com/

逆转裁判同人: https://ace.chatvisualnovel.com/

![截图](https://chatvisualnovelassets.s3.us-west-2.amazonaws.com/images/screenshots/Screenshot+2023-03-27+at+10.05.36.png)

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

- 当出现（i18n）标注时，对应的 key 或者 value 需要在 i18n 中配置多语言对应。

```typescript
{
  "genres": string[],           //（Required）（i18n）故事类型，用于Prompt。
  "player": {                   // (Optional）让ChatGPT命名的玩家角色，当 characters 中不存在 isPlayer: true 的角色时使用。
    "images": {
      [key: string]: string,        //（Required）每一个key对应这个角色的一个表情，可以是任意数量但必须存在一个 neutral，角色列表中第一位角色的所有可能表情将被使用在 Prompt 中作为可挑选的 mood。value 是这个表情对应的图片地址。
    },
    "imagesSettings": {
      [key: string]: string,        //（Optional）当显示这个角色的图片时加载的CSS，最高优先级。
    }
  },
  "playerGender": string,       //（Optional）（i18n）主人公性别，当 characters 中不存在 isPlayer: true 的角色时用于Prompt。
  "girls": [{                   // (Optional）让ChatGPT命名的女性角色，当 characters 中不存在 isPlayer: false 的角色时使用。
    "images": {
      [key: string]: string,        //（Required）每一个key对应这个角色的一个表情，可以是任意数量但必须存在一个 neutral，角色列表中第一位角色的所有可能表情将被使用在 Prompt 中作为可挑选的 mood。value 是这个表情对应的图片地址。
    },
    "imagesSettings": {
      [key: string]: string,        //（Optional）当显示这个角色的图片时加载的CSS，最高优先级。
    }
  }],
  "characters": {               //（Optional）有名字的角色。
    [key: string]: {                //（Required）（i18n）角色名字，用于Prompt。
      "isPlayer": boolean,          //（Optional）设为 true 时将作为玩家角色，请只设置一个玩家角色。
      "images": {
        [key: string]: string,      //（Required）每一个key对应这个角色的一个表情，可以是任意数量但必须存在一个 neutral，角色列表中第一位角色的所有可能表情将被使用在 Prompt 中作为可挑选的 mood。value 是这个表情对应的图片地址。
      },
      "imagesSettings": {
        [key: string]: string,      //（Optional）当显示这个角色的图片时加载的CSS，最高优先级。
      }
    }
  },
  "places": {                   //（Required）地点（背景）。
    [key: string]: {                //（Required）（i18n）每一个key对应一个地点，可以是任意数量但必须至少存在一个，所有可能的地点将被使用在 Prompt 中作为可挑选的 location。
      "image": string,              //（Required）这个地点对应的图片地址。
      "bgm": string                 //（Optional）这个地点对应的背景音乐地址。
    }
  },
  "imagesSettings": {           //（Optional）角色图片显示配置（CSS）。
    [key: string]: string,
  },
  "tts": {                      //（Optional）在线文字语音合成服务集成，目前仅支持GET。
    [key: string]: {                //（Required) 对应 i18n 地区，可以设一个 default。
      "method": string,             //（Optional）GET或POST，默认为GET。
      "url": string,                //（Required）调用API的URL。
      "params": {                   //（Optional）URL参数对应，如果 method 为 GET 则必填。
        "speaker": string,          //（Required）speaker 对应的参数名。
        "text": string,             //（Required）text 对应的参数名。
        "additionalParams": string  //（Optional）附加参数值。
      }
    }
  }
}
```

## LICENSE

This code is distributed under the MIT license. See [LICENSE](./LICENSE) in this directory.
