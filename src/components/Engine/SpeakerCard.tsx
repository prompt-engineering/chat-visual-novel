"use client";

import { CSSProperties, useMemo } from "react";
import { KV, Character, Speaker } from "@/configs/type";

export type SpeakerProps = {
  dict: Record<string, string>;
  imageSettings?: CSSProperties;
  characterMap: KV<Character>;
  speaker?: Speaker;
};

export function SpeakerCard(props: SpeakerProps) {
  const characters = useMemo(() => {
    const uniqueNames = Object.keys(props.characterMap).filter(
      (value) => !(value.toLowerCase() in props.dict)
    );
    const _characters: KV<Character> = {};
    uniqueNames.map((key) => {
      _characters[key] = props.characterMap[key];
    });
    return _characters;
  }, [props.characterMap, props.dict]);

  return (
    <>
      {characters &&
        Object.keys(characters).map((characterName) => {
          const character = props.characterMap[characterName];
          return Object.keys(character.images).map((mood) => {
            const image = character.images[mood];
            return (
              <img
                key={characterName + "_" + mood}
                src={image}
                alt={characterName}
                style={{
                  position: "absolute",
                  zIndex: "-1",
                  ...props.imageSettings,
                  ...character.imageSettings,
                  display:
                    props.speaker?.name.toLowerCase() ==
                      characterName.toLowerCase() &&
                    props.speaker?.mood.toLowerCase() == mood
                      ? "block"
                      : "none",
                }}
              />
            );
          });
        })}
    </>
  );
}
