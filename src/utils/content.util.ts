import { Character, Config, KV, Scene, Location } from "./types";

export const cleanString = (input: string): string => {
  return input
    .replaceAll('"', "")
    .replace(/“|”/g, "")
    .replace(/\(|\)/g, "")
    .trim();
};

export const parseScene = (
  content: string,
  scene?: Scene,
  arrayMatch?: RegExpMatchArray | null
): { scene: Scene; _sceneDescription: string[]; _sceneDialogue: string[] } => {
  const _arrayMatch = arrayMatch ?? content.trim().match(/\[.*\]/s);
  const _sceneScript =
    content.indexOf(":") != -1
      ? [
          content.substring(0, content.indexOf(":")),
          content.substring(content.indexOf(":") + 1),
        ]
      : content.indexOf("：") != -1
      ? [
          content.substring(0, content.indexOf("：")),
          content.substring(content.indexOf("：") + 1),
        ]
      : [content];
  const _sceneDescription = _sceneScript[0].split("/");
  const _sceneDialogue =
    _sceneScript.length > 1 ? _sceneScript[1].split("/") : [];
  const _scene: Scene = {
    location:
      _sceneDescription.length > 1
        ? cleanString(_sceneDescription[0])
        : scene
        ? scene.location
        : "",
    speaker:
      _sceneDescription.length > 2
        ? cleanString(_sceneDescription[1])
        : scene
        ? scene.speaker
        : "",
    mood:
      _sceneScript.length > 1
        ? cleanString(_sceneDescription[2])
        : scene
        ? scene.mood
        : "",
    dialogue: _sceneScript.length > 1 ? cleanString(_sceneDialogue[0]) : "",
    answers: [],
  };
  if (_sceneDialogue.length > 1 && _sceneDialogue[1].indexOf('["') != -1) {
    if (_arrayMatch) {
      _scene.answers = JSON.parse(_arrayMatch[0]);
    }
  }
  return {
    scene: _scene,
    _sceneDescription,
    _sceneDialogue,
  };
};

export const buildCharacterMap = (
  dict: Record<string, string>,
  locale: string,
  config: Config,
  _characterMap: KV<Character>,
  _voiceMap: KV<string>,
  otherCharacterNames: string[],
  mainCharacterName?: string
) => {
  if (config.characters && Object.keys(config.characters).length > 0) {
    const characters: { [key: string]: Character } = JSON.parse(
      JSON.stringify(config.characters)
    );
    for (const _key in characters) {
      const character = characters[_key];
      if (character.isPlayer) {
        mainCharacterName = _key in dict ? dict[_key] : _key;
      } else {
        otherCharacterNames.push(_key in dict ? dict[_key] : _key);
      }
      _characterMap[_key.toLowerCase()] = character;
      if (_key.toLowerCase() in dict) {
        _characterMap[dict[_key.toLowerCase()].toLowerCase()] = character;
      }
      if (
        config.tts &&
        config.tts &&
        (config.tts[locale] || config.tts["default"])
      ) {
        const ttsConfig = config.tts[locale] ?? config.tts["default"];
        const voiceArray = [
          ...(ttsConfig.voices.male ?? []),
          ...(ttsConfig.voices.female ?? []),
        ];
        for (const i in voiceArray) {
          if (voiceArray[i].indexOf(_key.toLowerCase()) != -1)
            _voiceMap[_key.toLowerCase()] = voiceArray[i];
          if (
            _key.toLowerCase() in dict &&
            voiceArray[i].indexOf(dict[_key.toLowerCase()]) != -1
          ) {
            _voiceMap[_key.toLowerCase()] = voiceArray[i];
            _voiceMap[dict[_key.toLowerCase()]] = voiceArray[i];
          }
        }
      }
    }
  }
};

export const buildLocationMap = (
  dict: Record<string, string>,
  places: KV<Location>,
  _locationMap: KV<string>,
  _locationNames: string[],
  _bgmMap: KV<string | undefined>
) => {
  for (const _key in places) {
    _locationMap[_key.toLowerCase()] = places[_key].image;
    if (_key.toLowerCase() in dict) {
      _locationMap[dict[_key.toLowerCase()].toLowerCase()] = places[_key].image;
      _bgmMap[dict[_key.toLowerCase()].toLowerCase()] = places[_key].bgm;
      _locationNames.push(dict[_key.toLowerCase()]);
    } else {
      _locationNames.push(_key);
    }
  }
};
