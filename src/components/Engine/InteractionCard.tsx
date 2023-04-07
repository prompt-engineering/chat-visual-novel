"use client";

import { ResponseSend } from "@/pages/api/chatgpt/chat";
import { Cast, Scene } from "@/utils/types";
import { Box, HStack, Input, VStack } from "@chakra-ui/react";
import {
  Dispatch,
  MouseEventHandler,
  RefObject,
  SetStateAction,
  useState,
} from "react";
import { BeatLoader } from "react-spinners";
import ExecutePromptButton from "../ClickPrompt/ExecutePromptButton";

export type InteractionProps = {
  dict: Record<string, string>;
  mode: string;
  cast: Cast;
  scene: Scene;
  isDialogueLoading: boolean;
  setIsDialogueLoading: Dispatch<SetStateAction<boolean>>;
  answer: string | undefined;
  setAnswer: Dispatch<SetStateAction<string | undefined>>;
  handleResponse: (
    response: ResponseSend,
    setLoading?: Dispatch<SetStateAction<boolean>>,
    nextAction?: boolean
  ) => void;
  conversationId: number | undefined;
  updateConversationId: (id: number) => void;
};

export function InteractionCard(props: InteractionProps) {
  const [btnRef, setBtnRef] = useState<HTMLButtonElement>();
  const handleAnswerClick: MouseEventHandler<HTMLButtonElement> = (e: any) => {
    props.setAnswer(e.target.innerText);
  };
  const handleResponse = (response: ResponseSend) => {
    return props.handleResponse(response, props.setIsDialogueLoading);
  };
  const handleDialogueLoadingStateChange = (_isLoading: boolean) => {
    props.setIsDialogueLoading(_isLoading);
  };
  const handleButtonRefChange = (_btnRef: RefObject<HTMLButtonElement>) => {
    if (_btnRef && _btnRef.current) {
      setBtnRef(_btnRef.current);
      console.log(_btnRef.current);
    }
  };

  return (
    <VStack paddingTop="1rem" paddingRight="18px" alignItems="end" minH="60px">
      {props.isDialogueLoading ? (
        <>
          {props.answer && (
            <Box style={{ fontSize: "1rem" }}>{props.answer}</Box>
          )}
          <BeatLoader color="white" />
        </>
      ) : props.scene.answers && props.scene.answers.length > 0 ? (
        props.mode == "classic" ? (
          <>
            {props.scene.answers.map((_answer) => {
              return (
                <ExecutePromptButton
                  key={_answer}
                  loading={props.isDialogueLoading}
                  text={
                    props.dict["prompt_continue_with_answer"] +
                    props.cast.main.name +
                    ": " +
                    '"' +
                    _answer +
                    '"'
                  }
                  name="promptBtn"
                  handleResponse={handleResponse}
                  conversationId={props.conversationId}
                  updateConversationId={props.updateConversationId}
                  btnText={_answer}
                  handleLoadingStateChange={handleDialogueLoadingStateChange}
                  onClick={handleAnswerClick}
                />
              );
            })}
          </>
        ) : (
          <HStack style={{ width: "100%" }}>
            <Input
              value={props.answer ?? ""}
              onChange={(e) => props.setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") btnRef?.click();
              }}
            />
            <ExecutePromptButton
              disabled={!props.answer}
              loading={props.isDialogueLoading}
              text={
                props.dict["prompt_continue_with_answer"] +
                props.cast.main.name +
                ": " +
                '"' +
                props.answer +
                '"'
              }
              name="promptBtn"
              handleResponse={handleResponse}
              conversationId={props.conversationId}
              updateConversationId={props.updateConversationId}
              btnText={props.dict["continue"]}
              handleLoadingStateChange={handleDialogueLoadingStateChange}
              handleButtonRefChange={handleButtonRefChange}
            />
          </HStack>
        )
      ) : (
        <ExecutePromptButton
          loading={props.isDialogueLoading}
          text={props.dict["prompt_continue"]}
          name="promptBtn"
          handleResponse={handleResponse}
          conversationId={props.conversationId}
          updateConversationId={props.updateConversationId}
          btnText={props.dict["continue"]}
          handleLoadingStateChange={handleDialogueLoadingStateChange}
        />
      )}
    </VStack>
  );
}
