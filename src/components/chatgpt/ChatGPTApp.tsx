"use client";

import { isClientSideOpenAI, getApiKey } from "@/api/edge/user";
import { ChatRoom } from "@/components/chatgpt/ChatRoom";
import { LoginPage } from "@/components/chatgpt/LoginPage";
import React, { useEffect, useState } from "react";

type ChatGPTAppProps = {
  loggedIn?: boolean;
  updateLoginStatus?: (loggedIn: boolean) => void;
  initMessage?: string;
};
export const ChatGPTApp = ({
  loggedIn,
  initMessage,
  updateLoginStatus,
}: ChatGPTAppProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(loggedIn ?? false);

  useEffect(() => {
    if (isClientSideOpenAI()) {
      let _isLoggedin = getApiKey() ? true : false;
      if (isLoggedIn != _isLoggedin) {
        setIsLoggedIn(_isLoggedin);
        if (updateLoginStatus) {
          updateLoginStatus(_isLoggedin);
        }
        return;
      }
    }
    if (updateLoginStatus) {
      updateLoginStatus(isLoggedIn);
    }
  }, [isLoggedIn]);

  return isLoggedIn ? (
    <ChatRoom setIsLoggedIn={setIsLoggedIn} initMessage={initMessage} />
  ) : (
    <LoginPage setIsLoggedIn={setIsLoggedIn} />
  );
};
