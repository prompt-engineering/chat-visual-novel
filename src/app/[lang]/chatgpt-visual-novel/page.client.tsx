"use client";

import {
  useState,
  useMemo,
  ChangeEventHandler,
  useEffect,
  MouseEventHandler,
  SetStateAction,
  Dispatch,
} from "react";
import {
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Text,
  Link,
  Select,
  Image,
  useDisclosure,
  Heading,
  VStack,
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

type Character = {
  name: string;
};

type Cast = {
  main: Character;
  girls: Character[];
};

function ChatGptVisualNovel({ i18n }: GeneralI18nProps) {
  const dict = i18n.dict;
  const genres = ["romance", "fantasy", "horror", "sci-fi", "crime"];
  const player = assets.player as { [key: string]: string };
  const girls = assets.girls as { [key: string]: string }[];
  const places = assets.places as { [key: string]: string };
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogueLoading, setIsDialogueLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [hasLogin, setHasLogin] = useState(false);
  const [genre, setGenre] = useState(dict[genres[0]]);
  const [cast, setCast] = useState({} as Cast);
  const [scene, setScene] = useState({} as Scene);
  const getInitialPrompt = () =>
    `${dict["prompt_start"]}${girls.length}${dict["prompt_after_number_of_girls"]}\n{"main":{"name":""},girls:[{"name":""}]}\n${dict["prompt_follow_cast_rules"]}`;
  const [prompt, setPrompt] = useState(getInitialPrompt());
  const [conversationId, setConversationId] = useState(
    undefined as number | undefined
  );
  const [promptQueue, setPromptQueue] = useState(
    [] as { prompt: string; setLoading?: Dispatch<SetStateAction<boolean>> }[]
  );
  useEffect(() => {
    if (conversationId && promptQueue && promptQueue.length) {
      const _prompt = promptQueue.shift();
      if (_prompt) executePrompt(_prompt).catch(console.error);
    }
    setPromptQueue(promptQueue);
  }, [conversationId, promptQueue]);
  const [characterMap, setCharacterMap] = useState(
    {} as { [key: string]: number }
  );
  const [answer, setAnswer] = useState(undefined as string | undefined);

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
      const json = JSON.parse(response[0].content.trim());
      if ("main" in json && "girls" in json) {
        const cast = json as Cast;
        const newCharacterMap = characterMap;
        for (const girlIndex in cast.girls) {
          const girl = cast.girls[girlIndex].name.toLowerCase();
          const girlCount = Object.keys(newCharacterMap).length;
          if (
            !(girl in newCharacterMap) &&
            Object.keys(newCharacterMap).length < girls.length
          ) {
            newCharacterMap[girl] = girlCount;
          }
        }
        setCharacterMap(newCharacterMap);
        setCast(cast);
        const storyPrompt = `${dict["prompt_story_start"]}${genre}${
          dict["prompt_after_story_genre"]
        }\n{"speaker":string,"dialogue":string,"mood":string,"location":string,"answers":string[]}\n${
          dict["prompt_after_story_format"]
        }${JSON.stringify(Object.keys(girls[0]))}\n${
          dict["prompt_places"]
        }${JSON.stringify(Object.keys(places))}\n${dict["prompt_end"]}`;
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

  const character = useMemo(() => {
    if (!scene) return;
    if (!scene.speaker) return;
    const speaker = scene.speaker.toLowerCase();
    if (
      speaker == cast.main.name.toLowerCase() ||
      speaker.indexOf("主人公") != -1
    )
      return player[scene.mood.toLowerCase()] ?? player["neutral"];
    if (speaker in characterMap)
      return (
        girls[characterMap[speaker]][scene.mood.toLowerCase()] ??
        girls[characterMap[speaker]]["neutral"]
      );
  }, [scene, cast, characterMap, girls, player]);

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
        cursor: "pointer",
      }}
    >
      <Image
        src={
          scene.location in places ? places[scene.location] : places["street"]
        }
        alt={scene.location}
        style={{
          position: "absolute",
          left: "0",
          bottom: "0",
          minHeight: "100%",
          minWidth: "100%",
          objectFit: "cover",
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
              {cast.main.name},{" "}
              {cast.girls.flatMap((val) => val.name).join(", ")}
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
          {character && (
            <Image
              src={character ?? ""}
              alt={scene.speaker}
              style={{
                position: "absolute",
                left: "35%",
                bottom: "100%",
                width: "30%",
                minWidth: "256px",
              }}
            />
          )}
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
          <VStack paddingTop="1rem" paddingRight="18px" alignItems="end">
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
          <Text
            style={{
              fontSize: "0.5rem",
              color: "lightgray",
              paddingTop: "0.5rem",
            }}
          >
            {dict["sd_note_prefix"]}
            <Link href="https://github.com/CompVis/stable-diffusion" isExternal>
              Stable Diffusion
            </Link>
            {dict["sd_note_model"]}
            <Link
              href="https://huggingface.co/WarriorMama777/OrangeMixs/tree/main/Models/AbyssOrangeMix3"
              isExternal
            >
              AbyssOrangeMix3
            </Link>
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default ChatGptVisualNovel;
