import {
  CHAT_COMPLETION_CONFIG,
  CHAT_COMPLETION_URL,
} from "@/configs/constants";
import { ResponseGetChats } from "@/pages/api/chatgpt/chat";
import { WebStorage } from "@/storage/webstorage";
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  CreateChatCompletionResponse,
} from "openai";
import { getApiKey } from "./user";

export function getChatsByConversationId(conversationId: number) {
  const _chatRepo = new WebStorage<ResponseGetChats>("o:c");
  const _chats = _chatRepo.get<ResponseGetChats>() ?? [];
  const _result: ResponseGetChats = [];
  for (const _index in _chats) {
    const _chat = _chats[_index];
    if (_chat.conversation_id == conversationId) {
      _result.push(_chat);
    }
  }
  return _result;
}

export function saveChat(
  conversationId: number,
  message: ChatCompletionResponseMessage
) {
  const _chatRepo = new WebStorage<ResponseGetChats>("o:c");
  const _chats = _chatRepo.get<ResponseGetChats>() ?? [];
  let nextIndex = 0;
  for (const _index in _chats) {
    if ((_chats[_index].id ?? 0) >= nextIndex)
      nextIndex = (_chats[_index].id ?? 0) + 1;
  }
  const _chat = {
    id: nextIndex,
    conversation_id: conversationId,
    role: message.role as string,
    content: message.content,
    name: undefined,
    created_at: Date.now().toString(),
  };
  _chats.push(_chat);
  _chatRepo.set(_chats);
  return _chat;
}

export async function sendMessage(
  conversationId: number,
  message: string,
  name?: string
) {
  console.log("EdgeChat.sendMessage");
  const messages = getChatsByConversationId(conversationId).map((it) => ({
    role: it.role,
    content: it.content,
    name: it.name,
  })) as ChatCompletionRequestMessage[];
  messages.push({
    role: "user",
    content: message,
    name: name ?? undefined,
  });
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API key not set.");
  try {
    const response = await fetch(CHAT_COMPLETION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...CHAT_COMPLETION_CONFIG,
        messages: messages,
      }),
    });
    const json = await response.json();
    console.log(json);
    if (!response.ok) {
      throw new Error(json);
    }
    const { choices } = json as CreateChatCompletionResponse;
    if (choices.length === 0 || !choices[0].message) {
      throw new Error("No response from OpenAI");
    }

    return [saveChat(conversationId, choices[0].message)];
  } catch (e) {
    console.error(e);
  }
}

export function deleteChatsByConversationId(conversationId: number) {
  const _chatRepo = new WebStorage<ResponseGetChats>("o:c");
  const _chats = _chatRepo.get<ResponseGetChats>() ?? [];
  const _result: number[] = [];
  for (const _index in _chats) {
    const _chat = _chats[_index];
    if (_chat.conversation_id == conversationId) {
      _result.push(parseInt(_index));
    }
  }
  for (const _index in _result) {
    _chats.splice(_result[_index], 1);
  }
  _chatRepo.set(_chats);
}

export function deleteAllChats() {
  const _chatRepo = new WebStorage<ResponseGetChats>("o:c");
  _chatRepo.set([]);
}
