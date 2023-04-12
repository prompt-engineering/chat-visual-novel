"use client";

import { KV, Character, Speaker, Config } from "@/utils/types";
import { createRef, RefObject, useMemo, useState } from "react";

export type SpeakerProps = {
  dict: Record<string, string>;
  config: Config;
  characterMap: KV<Character>;
  speaker?: Speaker;
  onLoaded?: (count: number, total: number) => void;
};

export function SpeakerCard(props: SpeakerProps) {
  const [characterRefs, setCharacterRefs] = useState<
    KV<RefObject<HTMLImageElement>>
  >({});
  const characters = useMemo(() => {
    const _characters: KV<Character> = {};
    if (props.config.player) _characters["player"] = props.config.player;
    if (props.config.girls)
      props.config.girls.forEach((character, idx) => {
        _characters["girl_" + idx] = character;
      });
    const result = { ..._characters, ...props.config.characters };
    Object.keys(result).forEach((key) => {
      const character = result[key];
      Object.keys(character.images).forEach((mood) => {
        characterRefs[key + "_" + mood] = createRef<HTMLImageElement>();
      });
    });
    setCharacterRefs(characterRefs);
    const imageCount = Object.keys(characterRefs).length;
    ((characterRefs, imageCount) => {
      const checkInterval = setInterval(() => {
        const initialValue = 0;
        const loadedImageCount = Object.keys(characterRefs).reduce(
          (accumulator, key) =>
            accumulator + (characterRefs[key].current?.complete ? 1 : 0),
          initialValue
        );
        if (props.onLoaded) props.onLoaded(loadedImageCount, imageCount);
        if (loadedImageCount >= imageCount) {
          clearInterval(checkInterval);
        }
      });
    })(characterRefs, imageCount);
    return result;
  }, [props.config.player, props.config.girls, props.config.characters]);

  const currentSpeaker = useMemo(() => {
    if (!props.speaker) return;
    if (!props.characterMap) return;
    let _character = undefined;
    let _currentSpeaker = undefined;
    if (props.speaker.name.toLowerCase() in props.characterMap)
      _character = props.characterMap[props.speaker.name.toLowerCase()];
    if (
      props.speaker.name.toLowerCase() in props.dict &&
      props.dict[props.speaker.name.toLowerCase()] in props.characterMap
    )
      _character =
        props.characterMap[props.dict[props.speaker.name.toLowerCase()]];
    if (!_character) return;
    if (props.speaker.mood.toLowerCase() in _character.images)
      _currentSpeaker = _character.images[props.speaker.mood.toLowerCase()];
    if (
      props.speaker.mood.toLowerCase() in props.dict &&
      props.dict[props.speaker.mood.toLowerCase()] in _character.images
    )
      _currentSpeaker =
        _character.images[props.dict[props.speaker.mood.toLowerCase()]];
    return _currentSpeaker;
  }, [props.characterMap, props.dict, props.speaker]);

  return (
    <>
      {characters &&
        Object.keys(characters).map((key) =>
          Object.keys(characters[key].images).map((mood) => {
            const character = characters[key];
            const image = character ? character.images[mood] : "";
            return (
              <img
                key={key + "_" + mood}
                src={image}
                alt={key + "_" + mood}
                style={{
                  position: "absolute",
                  zIndex: "-1",
                  ...props.config.imageSettings,
                  ...character?.imageSettings,
                  display: currentSpeaker == image ? "block" : "none",
                }}
                ref={characterRefs[key + "_" + mood]}
              />
            );
          })
        )}
    </>
  );
}
