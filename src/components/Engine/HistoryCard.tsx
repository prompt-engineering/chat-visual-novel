"use client";

import { useEffect, useState } from "react";
import {
  Card,
  useDisclosure,
  Text,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
} from "@chakra-ui/react";
import { isLoggedIn } from "@/api/user";
import { LoggingDrawer } from "../ClickPrompt/LoggingDrawer";
import { getChatsByConversationId } from "@/api/chat";
import { cleanString, parseScene } from "@/utils/content.util";
import { Scene, Cast } from "@/utils/types";
import { ResponseGetChats } from "@/pages/api/chatgpt/chat";
import { BeatLoader } from "react-spinners";

export type HistoryCardProps = {
  dict: Record<string, string>;
  conversationId: number;
  cast: Cast;
  isOpen: boolean;
  handleClose: () => void;
};

export function HistoryCard(props: HistoryCardProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [hasLogin, setHasLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<ResponseGetChats>([]);

  // get chats
  useEffect(() => {
    (async () => {
      try {
        const _isLoggedIn = await isLoggedIn();
        if (!_isLoggedIn) {
          setHasLogin(false);
          onOpen();
          setIsLoading(false);
          return;
        } else {
          setHasLogin(true);
        }
      } catch (e) {
        console.log(e);
        setHasLogin(false);
        setIsLoading(false);
        return;
      }
    })();
  }, []);

  useEffect(() => {
    if (hasLogin && props.conversationId && props.isOpen) {
      onClose();
      loadChats();
    }
  }, [hasLogin, props.conversationId, props.isOpen]);

  const loadChats = async () => {
    if (!props.conversationId) return;
    try {
      setIsLoading(true);
      const data = (await getChatsByConversationId(props.conversationId)) ?? [];
      setHistory(
        data.filter(
          (it, idx) =>
            idx > 1 && (it.role == "assistant" || it.content.indexOf(":") != -1)
        )
      );
    } catch (error) {
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const updateLoginStatus = (status: boolean) => {
    if (status) {
      setHasLogin(true);
      onClose();
    }
  };

  return (
    <>
      <Drawer
        isOpen={props.isOpen}
        placement="right"
        onClose={props.handleClose}
        size={"2xl"}
      >
        <DrawerOverlay />
        <DrawerContent
          style={{
            background: "rgba(80,80,80,0.5)",
            paddingTop: "3rem",
            paddingBottom: "2rem",
          }}
        >
          <DrawerCloseButton
            style={{
              background: "teal",
              color: "white",
              zIndex: "50",
              borderRadius: "50%",
            }}
          />
          <DrawerBody>
            {!isLoading && history && history.length ? (
              history.map((chat, idx) => {
                const scene =
                  chat.role == "assistant"
                    ? parseScene(chat.content).scene
                    : undefined;
                return (
                  <Card
                    key={idx}
                    style={{
                      padding: "1rem",
                      marginBottom: "0.5rem",
                      border: "1px solid",
                      borderColor:
                        chat.role == "assistant" ? "teal" : "darkgray",
                      background:
                        chat.role == "assistant"
                          ? "rgba(0,128,128,0.5)"
                          : "rgba(128,128,128,0.5)",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "bold",
                        color: "white",
                      }}
                    >
                      {scene
                        ? scene.speaker + ": " + scene.dialogue
                        : props.cast.main.name +
                          ": " +
                          cleanString(chat.content.split(":")[1])}
                    </Text>
                  </Card>
                );
              })
            ) : (
              <BeatLoader
                style={{
                  filter: "invert(100%)",
                }}
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      {!hasLogin &&
        LoggingDrawer(
          isOpen,
          handleClose,
          hasLogin,
          { text: "" },
          updateLoginStatus
        )}
    </>
  );
}
