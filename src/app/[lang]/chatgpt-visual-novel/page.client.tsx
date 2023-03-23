"use client";

import {
  useState,
  useMemo,
  ChangeEventHandler,
  useEffect,
  MouseEventHandler,
  SetStateAction,
  Dispatch,
  CSSProperties,
} from "react";
import {
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Text,
  Select,
  useDisclosure,
  Heading,
  VStack,
  Image,
} from "@chakra-ui/react";
import assets from "@/assets/assets.json";
import { upperFirst } from "lodash-es";
import ExecutePromptButton from "@/components/ClickPrompt/ExecutePromptButton";
import { ResponseSend } from "@/pages/api/chatgpt/chat";
import CopyComponent from "@/components/CopyComponent";
import * as UserAPI from "@/api/user";
import { sendMessage } from "@/api/chat";
import { BeatLoader } from "react-spinners";
import { ClickPromptBird } from "@/components/ClickPrompt/ClickPromptButton";

type Scene = {
  speaker: string;
  dialogue: string;
  mood: string;
  location: string;
  answers?: string[];
};

type CharacterName = {
  name: string;
};

type Cast = {
  main: CharacterName;
  others: CharacterName[];
};

type Character = {
  images: KV<string>;
  imageSettings?: CSSProperties;
  isPlayer?: boolean;
};

type KV<T> = {
  [key: string]: T;
};

type Config = {
  genres: string[];
  player?: Character;
  playerGender: string;
  girls?: Character[];
  characters?: KV<Character>;
  places: KV<string>;
  imageSettings?: CSSProperties;
};

type Speaker = {
  image: string;
  imageSettings?: CSSProperties;
};

function ChatGptVisualNovel({ i18n }: GeneralI18nProps) {
  const dict = i18n.dict;
  const config = JSON.parse(JSON.stringify(assets)) as Config;
  const genres = config.genres;
  const player = config.player;
  const girls = config.girls;
  const places = config.places;
  let mainCharacterName: undefined | string;
  const otherCharacterNames: string[] = [];
  const _characterMap: KV<Character> = {};
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
    }
  }
  const _locationMap: KV<string> = {};
  const _locationNames: string[] = [];
  for (const _key in places) {
    _locationMap[_key.toLowerCase()] = places[_key];
    if (_key.toLowerCase() in dict) {
      _locationMap[dict[_key.toLowerCase()].toLowerCase()] = places[_key];
      _locationNames.push(dict[_key.toLowerCase()]);
    } else {
      _locationNames.push(_key);
    }
  }
  const [characterMap, setCharacterMap] = useState(_characterMap);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogueLoading, setIsDialogueLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [hasLogin, setHasLogin] = useState(false);
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

  const currentSpeaker: Speaker | undefined = useMemo(() => {
    if (!scene) return;
    if (!scene.speaker) return;
    const speaker = scene.speaker.toLowerCase();
    if (speaker in characterMap)
      return {
        image:
          characterMap[speaker].images[scene.mood.toLowerCase()] ??
          characterMap[speaker].images["neutral"],
        imageSettings: characterMap[speaker].imageSettings,
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
          image:
            characterMap[mainCharacterName.toLowerCase()].images[
              scene.mood.toLowerCase()
            ] ??
            characterMap[mainCharacterName.toLowerCase()].images["neutral"],
          imageSettings: characterMap[speaker].imageSettings,
        };
      } else if (player) {
        return {
          image:
            player.images[scene.mood.toLowerCase()] ?? player.images["neutral"],
          imageSettings: player.imageSettings,
        };
      }
    }
  }, [scene, cast, characterMap, player]);

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

  const executePrompt = async (_prompt: {
    prompt: string;
    setLoading?: Dispatch<SetStateAction<boolean>>;
  }) => {
    if (_prompt.setLoading) _prompt.setLoading(true);
    try {
      const isLoggedIn = await UserAPI.isLoggedIn();
      if (!isLoggedIn) {
        onOpen();
        if (_prompt.setLoading) _prompt.setLoading(false);
        return;
      }
    } catch (e) {
      console.log(e);
      setHasLogin(false);
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

  const handleResponse = async (
    response: ResponseSend,
    setLoading?: Dispatch<SetStateAction<boolean>>
  ) => {
    try {
      const result = response[0].content.trim();
      const jsonStart = result.indexOf("{");
      const jsonEnd = result.lastIndexOf("}");
      let json = {};
      if (jsonStart >= 0 && jsonEnd >= 0) {
        const jsonStr = result.substring(jsonStart, jsonEnd + 1);
        json = JSON.parse(jsonStr);
      } else {
        throw new Error("Invalid json");
      }
      if ("main" in json && "others" in json) {
        const cast = json as Cast;
        const newCharacterMap: KV<Character> = {};
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
        }
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
        )}\n${dict["prompt_end"]}`;
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

  const handleDialogueLoadingStateChange = (_isLoading: boolean) => {
    setIsDialogueLoading(_isLoading);
  };

  const handleAnswerClick: MouseEventHandler<HTMLButtonElement> = (e: any) => {
    setAnswer(e.target.innerText);
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
      <Image
        src={
          scene &&
          scene.location &&
          scene.location.toLowerCase() in _locationMap
            ? _locationMap[scene.location.toLowerCase()]
            : places[Object.keys(places)[0]]
        }
        alt={scene.location ?? ""}
        style={{
          position: "absolute",
          left: "0",
          bottom: "0",
          minHeight: "100%",
          minWidth: "100%",
          objectFit: "cover",
          zIndex: "-2",
        }}
      />
      {isLoading ? (
        <Card
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "300px",
          }}
        >
          <ClickPromptBird />
          <CardHeader textAlign="center">
            <Heading size="md">{dict["loading"]}</Heading>
          </CardHeader>
          <CardBody>
            <Text>
              {dict["cast_prefix"]}
              {cast.others.flatMap((val) => val.name).join(", ")}
              {dict["and"]}
              {cast.main.name}
              {dict["cast_suffix"]}
            </Text>
          </CardBody>
          <CardFooter>
            <BeatLoader style={{ margin: "0 auto" }} />
          </CardFooter>
        </Card>
      ) : !(scene && scene.speaker) ? (
        <Card
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <CardHeader>
            <Heading size="md">{dict["title"]}</Heading>
          </CardHeader>
          <CardBody maxH="320px" overflow="auto" minW="320px">
            <Heading size="xs">{dict["select_genre"]}</Heading>
            <Select mt={4} onChange={handleGenreChange}>
              {genres.map((storyGenre) => (
                <option key={storyGenre} value={storyGenre}>
                  {upperFirst(dict[storyGenre])}
                </option>
              ))}
            </Select>
          </CardBody>
          <CardFooter>
            <Flex
              w="100%"
              mr="18px"
              flexGrow={"column"}
              justifyContent="space-between"
            >
              <Box>
                <CopyComponent value={prompt} />
              </Box>
              <Box>
                <ExecutePromptButton
                  text={prompt}
                  name="promptBtn"
                  handleResponse={(response) =>
                    handleResponse(response, setIsLoading)
                  }
                  conversationId={conversationId}
                  updateConversationId={updateConversationId}
                  conversationName={genre}
                  btnText={dict["start"]}
                />
              </Box>
            </Flex>
          </CardFooter>
        </Card>
      ) : (
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
          {scene.speaker && (
            <Box
              style={{
                borderRadius: "10px 10px 0 0",
                background: "rgba(0,128,128,0.8)",
                color: "white",
                fontSize: "1.2rem",
                fontWeight: "bold",
                textAlign: "center",
                padding: "0.4rem 1rem 0 1rem",
                height: "2.2rem",
                position: "absolute",
                left: "1rem",
                top: "-2.2rem",
              }}
            >
              {upperFirst(scene.speaker)}
            </Box>
          )}
          {scene.dialogue}
          <VStack
            paddingTop="1rem"
            paddingRight="18px"
            alignItems="end"
            minH="60px"
          >
            {isDialogueLoading ? (
              <>
                {answer && <Box style={{ fontSize: "1rem" }}>{answer}</Box>}
                <BeatLoader color="white" />
              </>
            ) : scene.answers && scene.answers.length > 0 ? (
              <>
                {scene.answers.map((_answer) => {
                  return (
                    <ExecutePromptButton
                      key={_answer}
                      loading={isDialogueLoading}
                      text={
                        dict["prompt_continue_with_answer"] +
                        '"' +
                        _answer +
                        '"'
                      }
                      name="promptBtn"
                      handleResponse={(response) =>
                        handleResponse(response, setIsDialogueLoading)
                      }
                      conversationId={conversationId}
                      updateConversationId={updateConversationId}
                      btnText={_answer}
                      handleLoadingStateChange={
                        handleDialogueLoadingStateChange
                      }
                      onClick={handleAnswerClick}
                    />
                  );
                })}
              </>
            ) : (
              <ExecutePromptButton
                loading={isDialogueLoading}
                text={dict["prompt_continue"]}
                name="promptBtn"
                handleResponse={(response) =>
                  handleResponse(response, setIsDialogueLoading)
                }
                conversationId={conversationId}
                updateConversationId={updateConversationId}
                btnText={dict["continue"]}
                handleLoadingStateChange={handleDialogueLoadingStateChange}
              />
            )}
          </VStack>
          {"copyright_note" in dict && (
            <Text
              style={{
                fontSize: "0.5rem",
                color: "lightgray",
                paddingTop: "0.5rem",
              }}
            >
              {dict["copyright_note"]}
            </Text>
          )}
          {currentSpeaker && (
            <Image
              src={currentSpeaker.image ?? ""}
              alt={scene.speaker ?? ""}
              style={{
                position: "absolute",
                zIndex: "-1",
                ...config.imageSettings,
                ...currentSpeaker.imageSettings,
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

export default ChatGptVisualNovel;
