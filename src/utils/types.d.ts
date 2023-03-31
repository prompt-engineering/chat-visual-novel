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
    male: string[];
    female: string[];
  };
};
