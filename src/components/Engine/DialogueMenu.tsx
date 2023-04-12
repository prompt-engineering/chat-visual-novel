"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  HStack,
  Text,
  useDisclosure,
  Box,
} from "@chakra-ui/react";
import { ChatIcon, HamburgerIcon } from "@chakra-ui/icons";
import { useRef } from "react";

export type DialogueMenuProps = {
  dict: Record<string, string>;
  onHistoryOpen: () => void;
  onReturnToMainMenu: () => void;
};

export function DialogueMenu(props: DialogueMenuProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef(null);

  return (
    <Box
      style={{
        position: "absolute",
        bottom: "100%",
        right: "0.2rem",
      }}
    >
      <HStack
        style={{
          marginBottom: "0.2rem",
        }}
      >
        <Text
          onClick={props.onHistoryOpen}
          style={{
            padding: "0.2rem 0.5rem",
            cursor: "pointer",
            fontSize: "1rem",
            background: "rgba(0,128,128,0.8)",
            borderRadius: "10px",
          }}
        >
          <ChatIcon />
          &nbsp;{props.dict["history"]}
        </Text>
        <Text
          onClick={onOpen}
          style={{
            padding: "0.2rem 0.5rem",
            cursor: "pointer",
            fontSize: "1rem",
            background: "rgba(0,128,128,0.8)",
            borderRadius: "10px",
          }}
        >
          <HamburgerIcon />
          &nbsp;{props.dict["return_to_main_menu"]}
        </Text>
      </HStack>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {props.dict["return_to_main_menu"]}?
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {props.dict["cancel"]}
              </Button>
              <Button
                onClick={() => {
                  if (window != undefined) window.location.reload();
                  onClose();
                }}
                colorScheme="red"
                ml={3}
              >
                {props.dict["confirm"]}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
