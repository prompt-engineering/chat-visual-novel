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
import { Box, Progress, Text, useDisclosure, useToast } from "@chakra-ui/react";
import assets from "@/assets/assets.json";
import { ResponseSend } from "@/pages/api/chatgpt/chat";
import * as UserAPI from "@/api/user";
import { sendMessage } from "@/api/chat";
import {
  Cast,
  Character,
  Config,
  EngineState,
  KV,
  Scene,
  Speaker,
} from "@/utils/types";
import { SpeakerCard } from "@/components/Engine/SpeakerCard";
import { NewStoryMenu } from "@/components/Engine/NewStoryMenu";
import { MainMenu } from "@/components/Engine/MainMenu";
import { LoadStoryMenu } from "@/components/Engine/LoadStoryMenu";
import { generateVoice } from "@/utils/huggingface.space.util";
import { Background } from "@/components/Engine/Background";
import { LoadingCard } from "@/components/Engine/LoadingCard";
import { InteractionCard } from "@/components/Engine/InteractionCard";
import { DialogueCard } from "@/components/Engine/DialogueCard";
import { HistoryCard } from "@/components/Engine/HistoryCard";
import {
  buildCharacterMap,
  buildLocationMap,
  parseScene,
} from "@/utils/content.util";
import { DialogueMenu } from "@/components/Engine/DialogueMenu";

function ChatGptVisualNovel({ i18n, locale }: GeneralI18nProps) {
  const toast = useToast();
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
  buildCharacterMap(
    dict,
    locale,
    config,
    _characterMap,
    _voiceMap,
    otherCharacterNames,
    mainCharacterName
  );
  const _locationMap: KV<string> = {};
  const _bgmMap: KV<string | undefined> = {};
  const bgmRef = createRef<HTMLAudioElement>();
  const _locationNames: string[] = [];
  buildLocationMap(dict, places, _locationMap, _locationNames, _bgmMap);
  const [characterMap, setCharacterMap] = useState(_characterMap);
  const [voiceMap, setVoiceMap] = useState(_voiceMap);
  const [engineState, setEngineState] = useState<EngineState>("main_menu");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogueLoading, setIsDialogueLoading] = useState(false);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [loadedImageCount, setLoadedImageCount] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const {
    isOpen: isHistoryOpen,
    onOpen: onHistoryOpen,
    onClose: onHistoryClose,
  } = useDisclosure();
  const [genre, setGenre] = useState(dict[genres[0]]);
  const [cast, setCast] = useState({} as Cast);
  const [scene, setScene] = useState({} as Scene);
  const [conversationId, setConversationId] = useState(
    undefined as number | undefined
  );
  const [promptQueue, setPromptQueue] = useState(
    [] as { prompt: string; setLoading?: Dispatch<SetStateAction<boolean>> }[]
  );
  const prompt = useMemo(() => {
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
    const _prompt = `${dict["prompt_story_start"]}${genre}${
      dict["prompt_after_story_genre"]
    }
${dict["prompt_after_story_format"]}${JSON.stringify(
      Object.keys(_characterMap).length
        ? Object.keys(_characterMap[Object.keys(_characterMap)[0]].images)
        : Object.keys(config.player ? config.player.images : {})
    )}
${dict["prompt_places"]}${JSON.stringify(_locationNames)}
${dict["prompt_end"]}
${mainCharacterPrompt}${otherCharacterPrompt}${
      dict["prompt_characters_json_prefix"]
    }
${dict["prompt_characters_json_suffix"]}`;
    return _prompt;
  }, [
    dict,
    _characterMap,
    genre,
    _locationNames,
    mainCharacterName,
    config,
    otherCharacterNames,
  ]);
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
    if (!scene.mood) return;
    if (!cast.main) return;
    if (!cast.others) return;
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
  const [voiceSocket, setVoiceSocket] = useState<WebSocket | undefined>();

  const handleGenreChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const _genre = genres.indexOf(e.target.value)
      ? dict[e.target.value]
      : dict[genres[0]];
    setGenre(_genre);
  };

  const updateConversationId = (id: number) => {
    setConversationId(id);
  };

  const handleVoiceUpdate = (
    text: string,
    state: string,
    socket: WebSocket
  ) => {
    setVoiceSocket(socket);
    if (
      !scene ||
      !scene.dialogue ||
      scene.dialogue != text ||
      isDialogueLoading
    ) {
      if (socket) socket.close();
      return false;
    }
    return true;
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
      scene.speaker.toLowerCase() in voiceMap &&
      !isDialogueLoading
    ) {
      setIsVoiceLoading(true);
      setVoice(undefined);
      if (voiceSocket) {
        voiceSocket.close();
        setVoiceSocket(undefined);
      }
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
          generateVoice(
            dict,
            locale,
            scene.dialogue,
            voiceMap[_speaker],
            _tts,
            handleVoiceUpdate
          )
            .then(({ text, voice }) => {
              if (text == scene.dialogue && voice) {
                setVoice(voice);
                setIsVoiceLoading(false);
              }
            })
            .catch(({ text, error }) => {
              if (text == scene.dialogue) {
                console.log(error);
                setIsVoiceLoading(false);
              }
            });
        }
      } else {
        setIsVoiceLoading(false);
      }
    }
  }, [scene.speaker, scene.dialogue, voiceMap, dict, isDialogueLoading]);

  const handlePreparation = (
    arrayMatch: RegExpMatchArray,
    setLoading?: Dispatch<SetStateAction<boolean>>,
    nextAction?: boolean
  ) => {
    const names: string[] = JSON.parse(arrayMatch[0].trim());
    const cast: Cast = {
      main: {
        name: names[0],
      },
      others: [],
    };
    const newCharacterMap: KV<Character> = {};
    const newVoiceMap: KV<string> = {};
    for (let _index = 1; _index < names.length; _index++) {
      cast.others.push({
        name: names[_index],
      });
      const _name = cast.others[_index - 1].name.toLowerCase();
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
    setCharacterMap(_newCharacterMap);
    setCast(cast);
    if (nextAction)
      setPromptQueue([
        ...promptQueue,
        { prompt: dict["prompt_start_story"], setLoading },
      ]);
  };

  const handleDialogue = (
    content: string,
    arrayMatch: RegExpMatchArray | null
  ) => {
    const {
      scene: _scene,
      _sceneDescription,
      _sceneDialogue,
    } = parseScene(content, scene, arrayMatch);
    setAnswer(undefined);
    setScene(_scene);
    setEngineState("story");
    if (_sceneDescription.length > 1) {
      setIsLoading(false);
    }
    if (_sceneDialogue.length > 1) {
      setIsDialogueLoading(false);
    }
  };

  const handleContent = (
    content: string,
    setLoading?: Dispatch<SetStateAction<boolean>>,
    nextAction?: boolean,
    isDelta?: boolean
  ) => {
    try {
      setIsVoiceLoading(true);
      setIsDialogueLoading(true);
      setIsAnswerLoading(true);
      setVoice(undefined);
      const _arrayMatch = content.trim().match(/\[.*\]/s);
      if (content.indexOf("/") == -1 && _arrayMatch && !isDelta) {
        handlePreparation(_arrayMatch, setLoading, nextAction);
      } else if (content.indexOf("/") != -1) {
        handleDialogue(content, _arrayMatch);
      } else {
        if (!isDelta)
          toast({
            title: content,
            status: "error",
            isClosable: true,
          });
      }
    } catch (e) {
      if (!isDelta)
        toast({
          title: content,
          status: "error",
          isClosable: true,
        });
      console.error(e);
    } finally {
      if (isDelta) return;
      setIsDialogueLoading(false);
      setIsAnswerLoading(false);
      setIsLoading(false);
    }
  };

  const handleResponse = (
    response: ResponseSend,
    setLoading?: Dispatch<SetStateAction<boolean>>,
    nextAction?: boolean,
    isDelta?: boolean
  ) => {
    handleContent(response[0].content, setLoading, nextAction, isDelta);
  };

  const handleDelta = (content: string) => {
    handleContent(content, undefined, false, true);
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
          _prompt.prompt,
          undefined,
          handleDelta
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

  const handleOnStart: MouseEventHandler<HTMLButtonElement> = () => {
    if (bgmRef && bgmRef.current && bgmRef.current.src) {
      bgmRef.current.play();
      bgmRef.current.volume = 0.4;
    }
  };

  const handleImageLoaded = (count: number, total: number) => {
    if (imageCount != total) setImageCount(total);
    if (loadedImageCount != count) setLoadedImageCount(count);
    if (count >= total) setIsImageLoading(false);
  };

  const handleReturnToMainMenu = () => {
    if (voiceSocket) {
      voiceSocket.close();
      setVoiceSocket(undefined);
    }
    setEngineState("main_menu");
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
      {(isLoading || isImageLoading) && (
        <LoadingCard dict={dict} cast={cast} isLoading={isLoading} />
      )}
      {!isLoading && !isImageLoading && (
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
        </>
      )}
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
          display:
            engineState == "story" &&
            scene &&
            scene.speaker &&
            !isLoading &&
            !isImageLoading
              ? "block"
              : "none",
        }}
      >
        {engineState == "story" &&
          scene &&
          scene.speaker &&
          !isImageLoading &&
          !isLoading && (
            <DialogueCard
              scene={scene}
              voice={voice}
              isVoiceLoading={isVoiceLoading}
            />
          )}
        <InteractionCard
          dict={dict}
          mode={mode}
          cast={cast}
          scene={scene}
          isAnswerLoading={isAnswerLoading}
          setIsAnswerLoading={setIsAnswerLoading}
          answer={answer}
          setAnswer={setAnswer}
          handleResponse={handleResponse}
          conversationId={conversationId}
          updateConversationId={updateConversationId}
          handleDelta={handleDelta}
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
          config={config}
          characterMap={characterMap}
          speaker={currentSpeaker}
          onLoaded={handleImageLoaded}
        />
        <DialogueMenu
          dict={dict}
          onHistoryOpen={onHistoryOpen}
          onReturnToMainMenu={handleReturnToMainMenu}
        />
      </Box>
      {isImageLoading && imageCount > 0 && (
        <Progress
          value={(loadedImageCount / imageCount) * 100}
          size="xs"
          colorScheme="teal"
          style={{
            position: "fixed",
            bottom: "0",
            width: "100vw",
          }}
        />
      )}
      {conversationId && cast && cast.main && (
        <HistoryCard
          dict={dict}
          conversationId={conversationId}
          cast={cast}
          handleClose={onHistoryClose}
          isOpen={isHistoryOpen}
        />
      )}
    </Box>
  );
}

export default ChatGptVisualNovel;
