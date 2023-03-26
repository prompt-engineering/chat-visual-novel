"use client";

import {
  Dispatch,
  MouseEventHandler,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import {
  Card,
  CardHeader,
  Heading,
  CardBody,
  CardFooter,
  useDisclosure,
  Text,
  Button,
  Box,
} from "@chakra-ui/react";
import { ChevronLeftIcon } from "@chakra-ui/icons";
import { ResponseGetConversations } from "@/pages/api/chatgpt/conversation";
import { LoggingDrawer } from "../ClickPrompt/LoggingDrawer";
import { getConversations } from "@/api/conversation";
import { isLoggedIn } from "@/api/user";
import { BeatLoader } from "react-spinners";
import { getChatsByConversationId } from "@/api/chat";
import { ResponseSend } from "@/pages/api/chatgpt/chat";

export type LoadStoryMenuProps = {
  dict: Record<string, string>;
  locale: string;
  handleResponse: (
    response: ResponseSend,
    setLoading?: Dispatch<SetStateAction<boolean>>,
    nextAction?: boolean
  ) => void;
  handleReturn: MouseEventHandler<HTMLHeadingElement>;
  handleSetConversationId: Dispatch<SetStateAction<number | undefined>>;
};

export function LoadStoryMenu(props: LoadStoryMenuProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [hasLogin, setHasLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<ResponseGetConversations>(
    []
  );
  const [selectedConversation, setSelectedConversation] = useState<
    number | undefined
  >(undefined);

  // get conversations
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
    if (hasLogin) {
      onClose();
      (async () => {
        try {
          setIsLoading(true);
          const data = (await getConversations()) ?? [];
          data.sort((a, b) => (a.id && b.id ? b.id - a.id : !a.id ? 1 : -1));
          setConversations(data);
          // if (data.length) setSelectedConversation(data[0].id);
        } catch (error) {
          setConversations([]);
          alert("Error: " + JSON.stringify(error));
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [hasLogin]);

  const handleClose = () => {
    onClose();
  };

  const updateLoginStatus = (status: boolean) => {
    if (status) {
      setHasLogin(true);
      onClose();
    }
  };

  const handleLoadStory: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (!selectedConversation) return;
    setIsLoading(true);
    (async () => {
      try {
        const data =
          (await getChatsByConversationId(selectedConversation)) ?? [];
        if (data.length > 1) {
          const jsonRegex = /{.*}/s; // s flag for dot to match newline characters
          const jsonMatch = data[1].content.match(jsonRegex);
          let json = {};
          if (jsonMatch) {
            json = JSON.parse(jsonMatch[0]);
            if ("main" in json && "others" in json) {
              props.handleSetConversationId(selectedConversation);
              props.handleResponse([data[1]], undefined, data.length < 4);
            } else {
              setIsLoading(false);
              return;
            }
          } else {
            setIsLoading(false);
            return;
          }
        }
        if (data.length > 3) {
          const jsonRegex = /{.*}/s; // s flag for dot to match newline characters
          const jsonMatch = data[data.length - 1].content.match(jsonRegex);
          let json = {};
          if (jsonMatch) {
            json = JSON.parse(jsonMatch[0]);
            if (
              "speaker" in json &&
              "dialogue" in json &&
              "mood" in json &&
              "location" in json
            ) {
              props.handleSetConversationId(selectedConversation);
              props.handleResponse([data[data.length - 1]]);
            } else {
              setIsLoading(false);
              return;
            }
          } else {
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <>
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
          {isLoading ? (
            <Box style={{ textAlign: "center" }}>
              <BeatLoader />
            </Box>
          ) : conversations && conversations.length ? (
            conversations.map((conversation) => (
              <Card
                key={conversation.id}
                style={{
                  padding: "1rem",
                  marginBottom: "0.5rem",
                  border: "1px solid teal",
                  cursor: "pointer",
                  background:
                    selectedConversation == conversation.id
                      ? "teal"
                      : undefined,
                  color:
                    selectedConversation == conversation.id
                      ? "white"
                      : undefined,
                }}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                  }}
                >
                  {conversation.name}
                </Text>
                {conversation.created_at && (
                  <Text>
                    {new Date(conversation.created_at).toLocaleString(
                      props.locale
                    )}
                  </Text>
                )}
              </Card>
            ))
          ) : (
            <Text textAlign="center">{props.dict["no_record"]}</Text>
          )}
        </CardBody>
        <CardFooter>
          <Button
            colorScheme="teal"
            width="100%"
            isDisabled={isLoading || !hasLogin || !selectedConversation}
            onClick={handleLoadStory}
          >
            {props.dict["load_story"]}
          </Button>
        </CardFooter>
      </Card>
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
