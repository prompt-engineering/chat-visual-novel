"use client";

import React, {
  createRef,
  MouseEventHandler,
  MutableRefObject,
  ReactEventHandler,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { Text, useDisclosure } from "@chakra-ui/react";
import * as UserAPI from "@/api/user";
import { ResponseCreateConversation } from "@/pages/api/chatgpt/conversation";
import { createConversation } from "@/api/conversation";
import { sendMessage } from "@/api/chat";
import { ResponseSend } from "@/pages/api/chatgpt/chat";
import { Button } from "@/components/ChakraUI";
import { BeatLoader } from "react-spinners";
import { ClickPromptBird } from "@/components/ClickPrompt/ClickPromptButton";
import { ButtonSize, StyledPromptButton } from "./Button.shared";
import { LoggingDrawer } from "@/components/ClickPrompt/LoggingDrawer";

export type ExecButtonProps = {
  loading?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler;
  name: string;
  text: string;
  size?: ButtonSize;
  btnText?: string;
  conversationName?: string;
  children?: React.ReactNode;
  handleResponse?: (response: ResponseSend) => void;
  conversationId?: number;
  updateConversationId?: (conversationId: number) => void;
  handleLoadingStateChange?: (isLoading: boolean) => void;
  handleButtonRefChange?: (e: RefObject<HTMLButtonElement>) => void;
  handleDelta?: (value: string, delta: string) => void;
};

function ExecutePromptButton(props: ExecButtonProps) {
  const [isLoading, setIsLoading] = useState(props.loading);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [hasLogin, setHasLogin] = useState(false);
  const btnRef = createRef<HTMLButtonElement>();

  const handleClick: MouseEventHandler<HTMLButtonElement> = async (e) => {
    if (props.onClick) {
      props.onClick(e);
    }
    setIsLoading(true);
    if (props.handleLoadingStateChange) props.handleLoadingStateChange(true);
    try {
      const isLoggedIn = await UserAPI.isLoggedIn();
      if (!isLoggedIn) {
        setHasLogin(false);
        onOpen();
        setIsLoading(false);
        if (props.handleLoadingStateChange)
          props.handleLoadingStateChange(false);
        return;
      } else {
        setHasLogin(true);
      }
    } catch (e) {
      console.log(e);
      setHasLogin(false);
      setIsLoading(false);
      if (props.handleLoadingStateChange) props.handleLoadingStateChange(false);
      return;
    }

    let conversationId = props.conversationId;
    if (!props.conversationId) {
      const conversation: ResponseCreateConversation = await createConversation(
        props.conversationName
      );
      if (!conversation) {
        return;
      }

      conversationId = conversation.id as number;
      props.updateConversationId
        ? props.updateConversationId(conversationId)
        : null;
    }

    if (conversationId) {
      try {
        const response: any = await sendMessage(
          conversationId,
          props.text,
          undefined,
          props.handleDelta
        );
        if (response && props.handleResponse) {
          props.handleResponse(response as ResponseSend);
        }
      } catch (e) {
        console.error(e);
      }
    }

    setIsLoading(false);
    if (props.handleLoadingStateChange) props.handleLoadingStateChange(false);
  };

  useEffect(() => {
    console.log(`hasLogin: ${hasLogin}`);
    if (hasLogin) {
      onClose();
    }
  }, [hasLogin]);

  useEffect(() => {
    if (props.loading != undefined) setIsLoading(props.loading);
  }, [props.loading]);

  const handleClose = () => {
    onClose();
  };

  const updateLoginStatus = (status: boolean) => {
    if (status) {
      setHasLogin(true);
      onClose();
    }
  };

  useEffect(() => {
    if (props.handleButtonRefChange) props.handleButtonRefChange(btnRef);
  }, [btnRef.current]);

  return (
    <>
      <StyledPromptButton>
        <Button
          colorScheme="twitter"
          className="bg-blue"
          onClick={handleClick}
          whiteSpace="normal"
          height="auto"
          minHeight="2.5rem"
          isDisabled={props.disabled || props.loading}
          ref={btnRef}
        >
          {props.children}
          {!isLoading && (
            <Text padding="0.5rem 0" minWidth="2rem">
              {props.btnText ?? "Prompt"}
            </Text>
          )}
          {isLoading && <BeatLoader size={8} color="black" />}
        </Button>
        <ClickPromptBird />
      </StyledPromptButton>
      {!hasLogin &&
        LoggingDrawer(isOpen, handleClose, hasLogin, props, updateLoginStatus)}
    </>
  );
}

export default ExecutePromptButton;
