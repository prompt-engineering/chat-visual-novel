import {
  CHAT_COMPLETION_CONFIG,
  CHAT_COMPLETION_URL,
} from "@/configs/constants";
import { ResponseGetChats, ResponseSend } from "@/pages/api/chatgpt/chat";
import { WebStorage } from "@/storage/webstorage";
import { CreateChatCompletionStreamResponse } from "@/utils/types";
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  CreateChatCompletionResponse,
} from "openai";
import { getApiKey } from "./user";

export function getChatsByConversationId(conversationId: number) {
  const _chatRepo = new WebStorage<ResponseGetChats>("o:c");
  const _chats = _chatRepo.get<ResponseGetChats>() ?? [];
  return _chats.filter((e) => e.conversation_id == conversationId);
}

export function saveChat(
  conversationId: number,
  message: ChatCompletionResponseMessage
) {
  const _chatRepo = new WebStorage<ResponseGetChats>("o:c");
  const _chats = _chatRepo.get<ResponseGetChats>() ?? [];
  let nextIndex = 1;
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
    created_at: new Date().toISOString(),
  };
  _chats.push(_chat);
  _chatRepo.set(_chats);
  return _chat;
}

export async function sendMessage(
  conversationId: number,
  message: string,
  name?: string,
  handleDelta?: (value: string, delta: string) => void
) {
  const messages = getChatsByConversationId(conversationId).map((it) => ({
    role: it.role,
    content: it.content,
    name: it.name,
  })) as ChatCompletionRequestMessage[];
  const _message: ChatCompletionRequestMessage = {
    role: "user",
    content: message,
    name: name ?? undefined,
  };
  messages.push(_message);
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
        stream: true,
      }),
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const message: ChatCompletionResponseMessage = {
      role: "assistant",
      content: "",
    };
    while (reader) {
      const { value, done } = await reader.read();
      const data = decoder.decode(value).split("\n");
      for (const lineIndex in data) {
        const jsonStr = data[lineIndex].replace(/^data: /g, "").trim();
        if (!jsonStr) continue;
        if (jsonStr == "[DONE]") break;
        let json: CreateChatCompletionStreamResponse | undefined = undefined;
        try {
          json = JSON.parse(jsonStr) as CreateChatCompletionStreamResponse;
          if (
            json &&
            json.choices &&
            json.choices.length &&
            "delta" in json.choices[0] &&
            json.choices[0].delta
          ) {
            if (json.choices[0].delta.role) {
              message.role = json.choices[0].delta.role;
            }
            if (json.choices[0].delta.content) {
              message.content += json.choices[0].delta.content;
              if (handleDelta) {
                handleDelta(message.content, json.choices[0].delta.content);
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (done) break;
    }
    saveChat(conversationId, _message);
    return [saveChat(conversationId, message)] as ResponseSend;
  } catch (e) {
    console.error(e);
  }
}

export function deleteChatsByConversationId(conversationId: number) {
  const _chatRepo = new WebStorage<ResponseGetChats>("o:c");
  const _chats = _chatRepo.get<ResponseGetChats>() ?? [];
  const _filtered = _chats.filter((e) => e.conversation_id != conversationId);
  _chatRepo.set(_filtered);
}

export function deleteAllChats() {
  const _chatRepo = new WebStorage<ResponseGetChats>("o:c");
  _chatRepo.set([]);
}
