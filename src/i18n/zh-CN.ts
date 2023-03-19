import type { PagePath } from "./pagePath";

import _global from "@i18n/zh-CN/$.json";
import _index from "@i18n/zh-CN/_.json";
import _chatgpt from "@i18n/zh-CN/_chatgpt.json";

export type GlobalKey = keyof typeof _global;
const pages = {
  "/": _index,
  "/chatgpt/": _chatgpt,
} satisfies Record<PagePath, any>;
export type PageKey<P extends PagePath> = keyof (typeof pages)[P];

const i18nDataZhCN = {
  "*": _global,
  ...pages,
};
export default i18nDataZhCN;
