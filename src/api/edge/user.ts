import { WebStorage } from "@/storage/webstorage";

export function isClientSideOpenAI() {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    // Client-side
    const _storage = new WebStorage<string>("o:t", "sessionStorage");
    const _type = _storage.get<string>();
    return _type && _type == "client" ? true : false;
  }
  return false;
}

export function getApiKey() {
  const _apiKeyRepo = new WebStorage<string>("o:a", "sessionStorage");
  const _apiKey = _apiKeyRepo.get();
  return _apiKey;
}

export function saveApiKey(apiKey: string) {
  const _apiKeyRepo = new WebStorage<string>("o:a", "sessionStorage");
  _apiKeyRepo.set(apiKey);
  return apiKey;
}

export function logout() {
  window.sessionStorage.removeItem("o:a");
  return { message: "Logged out" };
}
