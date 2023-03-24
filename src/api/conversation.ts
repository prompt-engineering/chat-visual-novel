import fetch from "node-fetch";
import {
  RequestChangeConversationName,
  RequestCreateConversation,
  RequestDeleteAllConversation,
  RequestDeleteConversation,
  RequestGetConversations,
  ResponseGetConversations,
  ResponseCreateConversation,
  ResponseDeleteAllConversation,
} from "@/pages/api/chatgpt/conversation";
import { isClientSideOpenAI } from "@/api/edge/user";
import * as EdgeConversation from "@/api/edge/conversation";

export async function getConversations() {
  if (isClientSideOpenAI()) return EdgeConversation.getConversations();
  const response = await fetch("/api/chatgpt/conversation", {
    method: "POST",
    body: JSON.stringify({
      action: "get_conversations",
    } as RequestGetConversations),
  });
  const data = (await response.json()) as ResponseGetConversations;
  if (!response.ok) {
    alert("Error: " + JSON.stringify((data as any).error));
    return;
  }

  if (data == null) {
    alert("Error(createConversation): sOmeTHiNg wEnT wRoNg");
    return;
  }

  return data;
}

export async function createConversation(name?: string) {
  if (isClientSideOpenAI()) return EdgeConversation.createConversation(name);
  const response = await fetch("/api/chatgpt/conversation", {
    method: "POST",
    body: JSON.stringify({
      action: "create_conversation",
      name: name ?? "Default name",
    } as RequestCreateConversation),
  });
  const data = (await response.json()) as ResponseCreateConversation;
  if (!response.ok) {
    alert("Error(createConversation): " + JSON.stringify((data as any).error));
    return;
  }

  if (data == null) {
    alert("Error(createConversation): sOmeTHiNg wEnT wRoNg");
    return;
  }

  return data;
}

export async function changeConversationName(
  conversationId: number,
  name: string
) {
  if (isClientSideOpenAI())
    return EdgeConversation.changeConversationName(conversationId, name);
  const response = await fetch("/api/chatgpt/conversation", {
    method: "POST",
    body: JSON.stringify({
      action: "change_conversation_name",
      conversation_id: conversationId,
      name: name ?? "Default name",
    } as RequestChangeConversationName),
  });
  const data = (await response.json()) as ResponseCreateConversation;
  if (!response.ok) {
    alert("Error: " + JSON.stringify((data as any).error));
    return;
  }

  if (!data) {
    alert("Error(changeConversationName): sOmeTHiNg wEnT wRoNg");
    return;
  }

  return data;
}

export async function deleteConversation(conversationId: number) {
  if (isClientSideOpenAI())
    return EdgeConversation.deleteConversation(conversationId);
  const response = await fetch("/api/chatgpt/conversation", {
    method: "POST",
    body: JSON.stringify({
      action: "delete_conversation",
      conversation_id: conversationId,
    } as RequestDeleteConversation),
  });
  const data = (await response.json()) as ResponseCreateConversation;
  if (!response.ok) {
    alert("Error: " + JSON.stringify((data as any).error));
    return;
  }

  if (!data) {
    alert("Error(deleteConversation): sOmeTHiNg wEnT wRoNg");
    return;
  }

  return data;
}

export async function deleteAllConversations() {
  if (isClientSideOpenAI()) return EdgeConversation.deleteAllConversations();
  const response = await fetch("/api/chatgpt/conversation", {
    method: "POST",
    body: JSON.stringify({
      action: "delete_all_conversations",
    } as RequestDeleteAllConversation),
  });
  const data = (await response.json()) as ResponseDeleteAllConversation;
  if (!response.ok) {
    alert("Error: " + JSON.stringify((data as any).error));
    return;
  }

  if (data.error) {
    alert("Error(deleteAllConversation): sOmeTHiNg wEnT wRoNg: " + data.error);
    return;
  }

  return data;
}
