"use client";

import {
  Dispatch,
  MouseEventHandler,
  SetStateAction,
  useEffect,
  useRef,
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
  VStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  HStack,
} from "@chakra-ui/react";
import { ChevronLeftIcon, DeleteIcon } from "@chakra-ui/icons";
import { ResponseGetConversations } from "@/pages/api/chatgpt/conversation";
import { LoggingDrawer } from "../ClickPrompt/LoggingDrawer";
import {
  deleteAllConversations,
  deleteConversation,
  getConversations,
} from "@/api/conversation";
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
    nextAction?: boolean,
    isDelta?: boolean,
    forceStart?: boolean
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
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const cancelRef = useRef(null);

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
      loadStory();
    }
  }, [hasLogin]);

  const loadStory = async () => {
    try {
      setSelectedConversation(undefined);
      setIsLoading(true);
      const data = (await getConversations()) ?? [];
      data.sort((a, b) => (a.id && b.id ? b.id - a.id : !a.id ? 1 : -1));
      setConversations(data);
      if (data.length) setSelectedConversation(data[0].id);
    } catch (error) {
      setConversations([]);
      alert("Error: " + JSON.stringify(error));
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

  const handleLoadStory: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (!selectedConversation) return;
    setIsLoading(true);
    (async () => {
      try {
        const data =
          (await getChatsByConversationId(selectedConversation)) ?? [];
        if (data.length > 1) {
          props.handleSetConversationId(selectedConversation);
          props.handleResponse(
            [data[1]],
            undefined,
            data.length < 4,
            undefined,
            true
          );
        }
        if (data.length > 3) {
          props.handleSetConversationId(selectedConversation);
          props.handleResponse(
            [data[data.length - 1]],
            undefined,
            undefined,
            undefined,
            true
          );
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleDeleteAll: MouseEventHandler<HTMLButtonElement> = (e) => {
    setIsLoading(true);
    (async () => {
      try {
        await deleteAllConversations();
        await loadStory();
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
        onDeleteClose();
      }
    })();
  };

  const handleDelete: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (!selectedConversation) return;
    setIsLoading(true);
    (async () => {
      try {
        await deleteConversation(selectedConversation);
        await loadStory();
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
        onDeleteClose();
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
                <HStack>
                  <VStack
                    style={{
                      flexGrow: 1,
                      alignItems: "flex-start",
                    }}
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
                  </VStack>
                  <Button
                    style={{
                      color: "white",
                      backgroundColor: "red",
                      height: "3rem",
                      borderRadius: "50%",
                    }}
                    onClick={(e) => {
                      setSelectedConversation(conversation.id);
                      onDeleteOpen();
                    }}
                  >
                    <DeleteIcon />
                  </Button>
                </HStack>
              </Card>
            ))
          ) : (
            <Text textAlign="center">{props.dict["no_record"]}</Text>
          )}
        </CardBody>
        <CardFooter>
          <VStack width="100%">
            <Button
              width="100%"
              colorScheme="teal"
              isDisabled={isLoading || !hasLogin || !selectedConversation}
              onClick={handleLoadStory}
            >
              {props.dict["load_story"]}
            </Button>
            <Button
              width="100%"
              isDisabled={
                isLoading ||
                !hasLogin ||
                !conversations ||
                !conversations.length
              }
              onClick={(e) => {
                setSelectedConversation(undefined);
                onDeleteOpen();
              }}
            >
              {props.dict["delete_all_story"]}
            </Button>
          </VStack>
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
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {selectedConversation
                ? props.dict["delete_story"]
                : props.dict["delete_all_story"]}
            </AlertDialogHeader>
            <AlertDialogBody>
              {props.dict["action_confirmation"].replace(
                "${action}",
                selectedConversation
                  ? props.dict["delete_story"]
                  : props.dict["delete_all_story"]
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                {props.dict["cancel"]}
              </Button>
              <Button
                colorScheme="red"
                onClick={selectedConversation ? handleDelete : handleDeleteAll}
                ml={3}
                isDisabled={
                  isLoading ||
                  !hasLogin ||
                  !conversations ||
                  !conversations.length
                }
              >
                {props.dict["confirm"]}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
