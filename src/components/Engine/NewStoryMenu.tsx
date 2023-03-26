"use client";

import { ChangeEventHandler, MouseEventHandler, useState } from "react";
import {
  Card,
  CardHeader,
  Heading,
  CardBody,
  Select,
  CardFooter,
  Flex,
  Box,
} from "@chakra-ui/react";
import { upperFirst } from "lodash-es";
import ExecutePromptButton from "../ClickPrompt/ExecutePromptButton";
import CopyComponent from "../CopyComponent";
import { ResponseSend } from "@/pages/api/chatgpt/chat";
import { ChevronLeftIcon } from "@chakra-ui/icons";

export type NewStoryMenuProps = {
  dict: Record<string, string>;
  genre: string;
  genres: string[];
  handleGenreChange: ChangeEventHandler<HTMLSelectElement>;
  prompt: string;
  handleResponse: (response: ResponseSend) => void;
  handleUpdateConversationId: (conversationId: number) => void;
  handleOnStart: MouseEventHandler<HTMLButtonElement>;
  handleReturn: MouseEventHandler<HTMLDivElement>;
};

export function NewStoryMenu(props: NewStoryMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <Card
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      <CardHeader
        style={{ cursor: !isLoading ? "pointer" : undefined }}
        onClick={!isLoading ? props.handleReturn : undefined}
      >
        <Heading size="md">
          <ChevronLeftIcon />
          {props.dict["return_to_main_menu"]}
        </Heading>
      </CardHeader>
      <CardBody maxH="320px" overflow="auto" minW="320px">
        <Heading size="xs">{props.dict["select_genre"]}</Heading>
        <Select
          mt={4}
          onChange={props.handleGenreChange}
          value={props.dict[props.genre]}
        >
          {props.genres.map((storyGenre) => (
            <option key={storyGenre} value={storyGenre}>
              {upperFirst(props.dict[storyGenre])}
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
            <CopyComponent value={props.prompt} />
          </Box>
          <Box>
            <ExecutePromptButton
              text={props.prompt}
              name="promptBtn"
              handleResponse={props.handleResponse}
              updateConversationId={props.handleUpdateConversationId}
              conversationName={props.genre}
              btnText={props.dict["start"]}
              onClick={props.handleOnStart}
              handleLoadingStateChange={(_isLoading) =>
                setIsLoading(_isLoading)
              }
            />
          </Box>
        </Flex>
      </CardFooter>
    </Card>
  );
}
