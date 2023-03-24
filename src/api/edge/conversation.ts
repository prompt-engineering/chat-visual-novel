import { ResponseGetConversations } from "@/pages/api/chatgpt/conversation";
import { WebStorage } from "@/storage/webstorage";
import { deleteAllChats, deleteChatsByConversationId } from "./chat";

function getConversationById(
  id: number,
  conversations: ResponseGetConversations
) {
  for (const _index in conversations) {
    const _conversation = conversations[_index];
    if (_conversation.id == id)
      return {
        conversation: _conversation,
        index: parseInt(_index),
      };
  }
}

export function getConversations() {
  const _conversationsRepo = new WebStorage<ResponseGetConversations>(
    "o:convo"
  );
  const _conversations =
    _conversationsRepo.get<ResponseGetConversations>() ?? [];
  return _conversations as ResponseGetConversations;
}

export function createConversation(name?: string) {
  const _conversationsRepo = new WebStorage<ResponseGetConversations>(
    "o:convo"
  );
  const _conversations =
    _conversationsRepo.get<ResponseGetConversations>() ?? [];
  let nextIndex = 0;
  for (const _index in _conversations) {
    if ((_conversations[_index].id ?? 0) >= nextIndex)
      nextIndex = (_conversations[_index].id ?? 0) + 1;
  }
  const _newConversation = {
    id: nextIndex,
    name: name ?? "Default name",
    created_at: Date.now().toString(),
    user_id: 0,
    deleted: 0,
  };
  _conversations.push(_newConversation);
  _conversationsRepo.set(_conversations);

  return _newConversation;
}

export function changeConversationName(conversationId: number, name: string) {
  const _conversationsRepo = new WebStorage<ResponseGetConversations>(
    "o:convo"
  );
  const _conversations =
    _conversationsRepo.get<ResponseGetConversations>() ?? [];
  const _result = getConversationById(conversationId, _conversations);
  if (!_result) return;
  _result.conversation.name = name;
  _conversationsRepo.set(_conversations);

  return _result.conversation;
}

export function deleteConversation(conversationId: number) {
  const _conversationsRepo = new WebStorage<ResponseGetConversations>(
    "o:convo"
  );
  const _conversations =
    _conversationsRepo.get<ResponseGetConversations>() ?? [];
  const _result = getConversationById(conversationId, _conversations);
  if (!_result) return;
  deleteChatsByConversationId(conversationId);
  _conversations.splice(_result.index, 1);
  _conversationsRepo.set(_conversations);
  return _conversations;
}

export async function deleteAllConversations() {
  const _conversationsRepo = new WebStorage<ResponseGetConversations>(
    "o:convo"
  );
  deleteAllChats();
  _conversationsRepo.set([]);
  return [];
}
