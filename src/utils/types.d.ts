import { ChatCompletionResponseMessageRoleEnum } from "openai";
import { CSSProperties } from "react";

export type Scene = {
  speaker: string;
  dialogue: string;
  mood: string;
  location: string;
  answers?: string[];
};

export type CharacterName = {
  name: string;
};

export type Cast = {
  main: CharacterName;
  others: CharacterName[];
};

export type Character = {
  images: KV<string>;
  imageSettings?: CSSProperties;
  isPlayer?: boolean;
};

export type KV<T> = {
  [key: string]: T;
};

export type Location = {
  image: string;
  bgm?: string;
};

export type Config = {
  modes: string[];
  genres: string[];
  player?: Character;
  playerGender: string;
  girls?: Character[];
  characters?: KV<Character>;
  places: KV<Location>;
  imageSettings?: CSSProperties;
  tts?: KV<TTS>;
};

export type Speaker = {
  name: string;
  mood: string;
};

export type TTS = {
  method?: "GET" | "POST" | "HuggingFaceSpace";
  url: string;
  ws?: {
    url: string;
    data?: string[];
  };
  params?: {
    speaker: string;
    text: string;
    additionalParams?: string;
  };
  voices: {
    male?: string[];
    female?: string[];
  };
};

export type EngineState =
  | "main_menu"
  | "new_story"
  | "continue_story"
  | "story";

/**
 *
 * @export
 * @interface CreateChatCompletionStreamResponse
 */
export interface CreateChatCompletionStreamResponse {
  /**
   *
   * @type {string}
   * @memberof CreateChatCompletionStreamResponse
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof CreateChatCompletionStreamResponse
   */
  object: string;
  /**
   *
   * @type {number}
   * @memberof CreateChatCompletionStreamResponse
   */
  created: number;
  /**
   *
   * @type {string}
   * @memberof CreateChatCompletionStreamResponse
   */
  model: string;
  /**
   *
   * @type {Array<CreateChatCompletionStreamResponseChoicesInner>}
   * @memberof CreateChatCompletionStreamResponse
   */
  choices: Array<CreateChatCompletionStreamResponseChoicesInner>;
  /**
   *
   * @type {CreateCompletionStreamResponseUsage}
   * @memberof CreateChatCompletionStreamResponse
   */
  usage?: CreateCompletionStreamResponseUsage;
}
/**
 *
 * @export
 * @interface CreateChatCompletionStreamResponseChoicesInner
 */
export interface CreateChatCompletionStreamResponseChoicesInner {
  /**
   *
   * @type {number}
   * @memberof CreateChatCompletionStreamResponseChoicesInner
   */
  index?: number;
  /**
   *
   * @type {ChatCompletionStreamResponseMessage}
   * @memberof CreateChatCompletionStreamResponseChoicesInner
   */
  delta?: ChatCompletionStreamResponseMessage;
  /**
   *
   * @type {string}
   * @memberof CreateChatCompletionStreamResponseChoicesInner
   */
  finish_reason?: string | null;
}

/**
 *
 * @export
 * @interface ChatCompletionStreamResponseMessage
 */
export interface ChatCompletionStreamResponseMessage {
  /**
   * @type {ChatCompletionResponseMessageRoleEnum}
   * @memberof ChatCompletionStreamResponseMessage
   */
  role?: ChatCompletionResponseMessageRoleEnum;
  /**
   * @type {string}
   * @memberof ChatCompletionStreamResponseMessage
   */
  content?: string;
}
