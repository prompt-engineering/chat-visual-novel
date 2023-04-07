"use client";

import {
  useState,
  useMemo,
  ChangeEventHandler,
  useEffect,
  MouseEventHandler,
  SetStateAction,
  Dispatch,
  createRef,
} from "react";
import { Box, Text } from "@chakra-ui/react";
import assets from "@/assets/assets.json";
import { ResponseSend } from "@/pages/api/chatgpt/chat";
import * as UserAPI from "@/api/user";
import { sendMessage } from "@/api/chat";
import { Cast, Character, Config, KV, Scene, Speaker } from "@/utils/types";
import { SpeakerCard } from "@/components/Engine/SpeakerCard";
import { NewStoryMenu } from "@/components/Engine/NewStoryMenu";
import { MainMenu } from "@/components/Engine/MainMenu";
import { LoadStoryMenu } from "@/components/Engine/LoadStoryMenu";
import { generateVoice } from "@/utils/huggingface.space.util";
import { Background } from "@/components/Engine/Background";
import { LoadingCard } from "@/components/Engine/LoadingCard";
import { InteractionCard } from "@/components/Engine/InteractionCard";
import { DialogueCard } from "@/components/Engine/DialogueCard";
import { parseResponse } from "@/utils/json.util";

function ChatGptVisualNovel({ i18n, locale }: GeneralI18nProps) {
  const dict = i18n.dict;
  const config = JSON.parse(JSON.stringify(assets)) as Config;
  const genres = config.genres;
  const player = config.player;
  const girls = config.girls;
  const places = config.places;
  let mainCharacterName: undefined | string;
  const otherCharacterNames: string[] = [];
  const _characterMap: KV<Character> = {};
  const _voiceMap: KV<string> = {};
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
  const _locationMap: KV<string> = {};
  const _bgmMap: KV<string | undefined> = {};
  const bgmRef = createRef<HTMLAudioElement>();
  const _locationNames: string[] = [];
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
  const [characterMap, setCharacterMap] = useState(_characterMap);
  const [voiceMap, setVoiceMap] = useState(_voiceMap);
  const [engineState, setEngineState] = useState("main_menu");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogueLoading, setIsDialogueLoading] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [genre, setGenre] = useState(dict[genres[0]]);
  const [cast, setCast] = useState({} as Cast);
  const [scene, setScene] = useState({} as Scene);
  const [conversationId, setConversationId] = useState(
    undefined as number | undefined
  );
  const [promptQueue, setPromptQueue] = useState(
    [] as { prompt: string; setLoading?: Dispatch<SetStateAction<boolean>> }[]
  );
  const getInitialPrompt = () => {
    const mainCharacterPrompt = `${
      mainCharacterName
        ? dict["prompt_main_character_named"] + mainCharacterName
        : dict["prompt_main_character_default"] +
          (config.playerGender in dict
            ? dict[config.playerGender]
            : config.playerGender) +
          dict["prompt_main_character_gender_suffix"]
    }`;
    const otherCharacterPrompt = `${
      otherCharacterNames.length
        ? dict["prompt_other_characters"] + JSON.stringify(otherCharacterNames)
        : girls?.length
        ? dict["prompt_generate_girls_prefix"] +
          girls.length +
          dict["prompt_generate_girls_suffix"]
        : ""
    }`;
    return `${mainCharacterPrompt}${otherCharacterPrompt}${dict["prompt_characters_json_prefix"]}\n{"main":{"name":""},"others":[{"name":""}]}\n${dict["prompt_characters_json_suffix"]}`;
  };
  const [prompt, setPrompt] = useState(getInitialPrompt());
  const [answer, setAnswer] = useState(undefined as string | undefined);

  useEffect(() => {
    if (conversationId && promptQueue && promptQueue.length) {
      const _prompt = promptQueue.shift();
      if (_prompt) executePrompt(_prompt).catch(console.error);
    }
    setPromptQueue(promptQueue);
  }, [conversationId, promptQueue]);

  const apiTypes = ["client", "server"];
  const [apiType, setApiType] = useState("client");
  if (typeof window !== "undefined") {
    useEffect(() => {
      const _apiType = window.sessionStorage.getItem("o:t");
      if (_apiType) {
        setApiType(JSON.parse(_apiType));
      } else {
        window.sessionStorage.setItem("o:t", JSON.stringify(apiType));
      }
    }, [window.sessionStorage["o:t"]]);
  }
  const handleApiTypeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    window.sessionStorage.setItem("o:t", JSON.stringify(e.target.value));
    setApiType(e.target.value);
  };

  const [mode, setMode] = useState("classic");
  if (typeof window !== "undefined") {
    useEffect(() => {
      const _mode = window.sessionStorage.getItem("o:m");
      if (_mode) {
        setMode(JSON.parse(_mode));
      } else {
        window.sessionStorage.setItem("o:m", JSON.stringify(mode));
      }
    }, [window.sessionStorage["o:m"]]);
  }
  const handleModeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    window.sessionStorage.setItem("o:m", JSON.stringify(e.target.value));
    setMode(e.target.value);
  };

  const currentSpeaker: Speaker | undefined = useMemo(() => {
    if (!scene) return;
    if (!scene.speaker) return;
    const speaker = scene.speaker.toLowerCase();
    const mood = scene.mood.toLowerCase();
    if (speaker in characterMap)
      return {
        name: speaker,
        mood: mood in characterMap[speaker].images ? mood : "neutral",
      };
    if (
      speaker == cast.main.name.toLowerCase() ||
      speaker.indexOf("主人公") != -1
    ) {
      if (
        mainCharacterName &&
        mainCharacterName.toLowerCase() in characterMap
      ) {
        return {
          name: mainCharacterName.toLowerCase(),
          mood:
            mood in characterMap[mainCharacterName.toLowerCase()].images
              ? mood
              : "neutral",
        };
      }
    }
  }, [scene, cast, characterMap, player]);

  const [voice, setVoice] = useState<string>();

  const handleGenreChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const _genre = genres.indexOf(e.target.value)
      ? dict[e.target.value]
      : dict[genres[0]];
    setGenre(_genre);
    setPrompt(getInitialPrompt());
  };

  const updateConversationId = (id: number) => {
    setConversationId(id);
  };

  useEffect(() => {
    if (
      config &&
      config.tts &&
      (locale in config.tts || "default" in config.tts) &&
      scene &&
      scene.speaker &&
      scene.dialogue &&
      scene.dialogue.length &&
      voiceMap &&
      scene.speaker.toLowerCase() in voiceMap
    ) {
      setIsVoiceLoading(true);
      setVoice(undefined);
      const _tts = config.tts[locale] ?? config.tts["default"];
      const _speaker = scene.speaker.toLowerCase();
      if (_speaker in voiceMap) {
        if (!_tts.method || _tts.method == "GET") {
          if (
            _tts.url &&
            _tts.params &&
            _tts.params.speaker &&
            _tts.params.text
          ) {
            const _params = _tts.params;
            const _voice = encodeURI(
              `${_tts.url}?${_params.speaker}=${voiceMap[_speaker]}&${
                _params.text
              }=${scene.dialogue}${_params.additionalParams ?? ""}`
            );
            setVoice(_voice);
            setIsVoiceLoading(false);
          }
        } else if (_tts.method == "HuggingFaceSpace") {
          generateVoice(dict, locale, scene.dialogue, voiceMap[_speaker], _tts)
            .then((voice) => {
              setVoice(voice);
              setIsVoiceLoading(false);
            })
            .catch((e) => {
              console.log(e);
              setIsVoiceLoading(false);
            });
        }
      }
    }
  }, [scene.speaker, scene.dialogue, voiceMap, dict]);

  const handleResponse = (
    response: ResponseSend,
    setLoading?: Dispatch<SetStateAction<boolean>>,
    nextAction?: boolean
  ) => {
    try {
      const json = parseResponse(response[0].content);
      if ("main" in json && "others" in json) {
        const cast = json as Cast;
        const newCharacterMap: KV<Character> = {};
        const newVoiceMap: KV<string> = {};
        for (const _index in cast.others) {
          const _name = cast.others[_index].name.toLowerCase();
          if (
            !(_name in _characterMap) &&
            !(_name in newCharacterMap) &&
            girls?.length
          ) {
            const _length = Object.keys(newCharacterMap).length;
            if (_length < girls.length) {
              newCharacterMap[_name] = girls[_length];
            }
          }
          if (config.tts && (config.tts[locale] || config.tts["default"])) {
            const _tts = config.tts[locale] ?? config.tts["default"];
            if (
              !(_name in _voiceMap) &&
              !(_name in newVoiceMap) &&
              _tts.voices &&
              _tts.voices.female
            ) {
              const _length = Object.keys(newVoiceMap).length;
              if (_length < _tts.voices.female.length) {
                newVoiceMap[_name] = _tts.voices.female[_length];
              }
            }
          }
        }
        if (!(cast.main.name.toLowerCase() in _characterMap) && player) {
          newCharacterMap[cast.main.name.toLowerCase()] = player;
          if (config.tts && (config.tts[locale] || config.tts["default"])) {
            const _tts = config.tts[locale] ?? config.tts["default"];
            if (_tts.voices && _tts.voices.male && _tts.voices.male.length)
              newVoiceMap[cast.main.name.toLowerCase()] = _tts.voices.male[0];
          }
        }
        const _newVoiceMap = { ...voiceMap, ...newVoiceMap };
        setVoiceMap(_newVoiceMap);
        const _newCharacterMap = { ..._characterMap, ...newCharacterMap };
        const moods = Object.keys(
          _newCharacterMap[Object.keys(_newCharacterMap)[0]].images
        );
        setCharacterMap(_newCharacterMap);
        setCast(cast);
        const storyPrompt = `${dict["prompt_story_start"]}${genre}${
          dict["prompt_after_story_genre"]
        }\n{"speaker":string,"dialogue":string,"mood":string,"location":string,"answers":string[]}\n${
          dict["prompt_after_story_format"]
        }${JSON.stringify(moods)}\n${dict["prompt_places"]}${JSON.stringify(
          _locationNames
        )}\n${dict["prompt_end"].replaceAll("${player}", cast.main.name)}`;
        if (nextAction)
          setPromptQueue([...promptQueue, { prompt: storyPrompt, setLoading }]);
      } else if (
        "speaker" in json &&
        "dialogue" in json &&
        "mood" in json &&
        "location" in json
      ) {
        const newScene = json as Scene;
        setAnswer(undefined);
        setScene(newScene);
        setEngineState("story");
      } else {
        console.log(json);
      }
    } catch (e) {
      console.log(response);
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsDialogueLoading(false);
    }
  };

  const executePrompt = async (_prompt: {
    prompt: string;
    setLoading?: Dispatch<SetStateAction<boolean>>;
  }) => {
    if (_prompt.setLoading) _prompt.setLoading(true);
    try {
      const isLoggedIn = await UserAPI.isLoggedIn();
      if (!isLoggedIn) {
        if (_prompt.setLoading) _prompt.setLoading(false);
        return;
      }
    } catch (e) {
      console.log(e);
      return;
    }
    if (conversationId) {
      try {
        const response: ResponseSend = (await sendMessage(
          conversationId,
          _prompt.prompt
        )) as ResponseSend;
        if (response) {
          handleResponse(response, _prompt.setLoading);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (_prompt.setLoading) _prompt.setLoading(false);
  };

  const handleOnStart: MouseEventHandler<HTMLButtonElement> = (e: any) => {
    if (bgmRef && bgmRef.current && bgmRef.current.src) {
      bgmRef.current.play();
      bgmRef.current.volume = 0.4;
    }
  };

  return (
    <Box
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <Background
        scene={scene}
        locationMap={_locationMap}
        places={places}
        bgmMap={_bgmMap}
        bgmRef={bgmRef}
      />
      {isLoading ? (
        <LoadingCard dict={dict} cast={cast} />
      ) : (
        <>
          {engineState == "main_menu" && (
            <MainMenu
              dict={dict}
              apiType={apiType}
              apiTypes={apiTypes}
              handleApiTypeChange={handleApiTypeChange}
              mode={mode}
              modes={config.modes}
              handleModeChange={handleModeChange}
              handleOnNewStory={() => setEngineState("new_story")}
              handleOnContinueStory={() => setEngineState("continue_story")}
            />
          )}
          {engineState == "new_story" && (
            <NewStoryMenu
              dict={dict}
              genre={genre}
              genres={genres}
              handleGenreChange={handleGenreChange}
              prompt={prompt}
              handleResponse={(response) =>
                handleResponse(response, setIsLoading, true)
              }
              handleUpdateConversationId={updateConversationId}
              handleOnStart={handleOnStart}
              handleReturn={() => setEngineState("main_menu")}
            />
          )}
          {engineState == "continue_story" && (
            <LoadStoryMenu
              dict={dict}
              locale={locale}
              handleResponse={handleResponse}
              handleSetConversationId={setConversationId}
              handleReturn={() => setEngineState("main_menu")}
            />
          )}
          {engineState == "story" && scene && scene.speaker && (
            <Box
              style={{
                borderRadius: "10px 10px 0 0",
                background: "rgba(0,128,128,0.8)",
                color: "white",
                fontSize: "1.2rem",
                padding: "1rem",
                width: "100%",
                position: "absolute",
                left: "0",
                bottom: "0",
              }}
            >
              <DialogueCard
                scene={scene}
                voice={voice}
                isVoiceLoading={isVoiceLoading}
              />
              <InteractionCard
                dict={dict}
                mode={mode}
                cast={cast}
                scene={scene}
                isDialogueLoading={isDialogueLoading}
                setIsDialogueLoading={setIsDialogueLoading}
                answer={answer}
                setAnswer={setAnswer}
                handleResponse={handleResponse}
                conversationId={conversationId}
                updateConversationId={updateConversationId}
              />
              {"copyright_note" in dict && (
                <Text
                  style={{
                    fontSize: "0.5rem",
                    color: "lightgray",
                    paddingTop: "0.5rem",
                    whiteSpace: "pre-line",
                  }}
                >
                  {dict["copyright_note"]}
                </Text>
              )}
              <SpeakerCard
                dict={dict}
                imageSettings={config.imageSettings}
                characterMap={characterMap}
                speaker={currentSpeaker}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

export default ChatGptVisualNovel;
