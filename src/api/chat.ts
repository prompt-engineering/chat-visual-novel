import {
  RequestGetChats,
  RequestSend,
  ResponseGetChats,
  ResponseSend,
} from "@/pages/api/chatgpt/chat";
import nodeFetch from "node-fetch";
import { isClientSideOpenAI } from "@/api/edge/user";
import * as EdgeChat from "@/api/edge/chat";

export async function getChatsByConversationId(conversationId: number) {
  if (isClientSideOpenAI())
    return EdgeChat.getChatsByConversationId(
      conversationId
    ) as ResponseGetChats;
  const response = await nodeFetch("/api/chatgpt/chat", {
    method: "POST",
    body: JSON.stringify({
      action: "get_chats",
      conversation_id: conversationId,
    } as RequestGetChats),
  });
  const data = (await response.json()) as ResponseGetChats;
  if (!response.ok) {
    alert("Error: " + JSON.stringify((data as any).error));
    return null;
  }

  if (!data) {
    alert("Error(getChatsByConversationId): sOmeTHiNg wEnT wRoNg");
    return null;
  }

  return data;
}

export async function sendMessage(
  conversationId: number,
  message: string,
  name?: string
) {
  if (isClientSideOpenAI())
    return (await EdgeChat.sendMessage(
      conversationId,
      message,
      name
    )) as ResponseSend;
  const response = await nodeFetch("/api/chatgpt/chat", {
    method: "POST",
    body: JSON.stringify({
      action: "send",
      conversation_id: conversationId,
      messages: [
        {
          role: "user",
          content: message,
          name: name ?? undefined,
        },
      ],
    } as RequestSend),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const data = (await response.json()) as ResponseSend;
  if (!data) {
    throw new Error("Empty response");
  }
  return data;
}

export async function sendMsgWithStreamRes(
  conversationId: number,
  message: string,
  name?: string
) {
  const response = await fetch("/api/chatgpt/stream", {
    method: "POST",
    headers: { Accept: "text/event-stream" },
    body: JSON.stringify({
      action: "send_stream",
      conversation_id: conversationId,
      messages: [
        {
          role: "user",
          content: message,
          name: name ?? undefined,
        },
      ],
    }),
  });

  if (!response.ok) {
    alert("Error: " + response.statusText);
    return;
  }
  if (response.body == null) {
    alert("Error: sOmeTHiNg wEnT wRoNg");
    return;
  }
  return response.body;
}
