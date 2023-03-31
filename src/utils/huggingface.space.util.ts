import { TTS } from "@/utils/types";

function randomhash(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateVoice(
  dict: Record<string, string>,
  locale: string,
  text: string,
  voice: string,
  tts: TTS
): Promise<string | undefined> {
  if (!tts.ws || !tts.ws.url || !tts.url) return undefined;
  const hash = randomhash(12);
  const send_hash = {
    fn_index: 0,
    session_hash: hash,
  };
  const data: any[] = [];
  tts.ws.data?.forEach((key) => {
    switch (key) {
      case "text":
        data.push(text);
        break;
      case "voice":
        data.push(voice);
        break;
      case "localeLanguage":
        data.push(dict[locale]);
        break;
      case "speed":
        data.push(0.8);
        break;
      case "phonemeInput":
        data.push(false);
        break;
    }
  });
  const payload = {
    fn_index: 2,
    data: data,
    session_hash: hash,
  };
  const socket = new WebSocket(tts.ws?.url);
  return new Promise((resolve, reject) => {
    socket.onerror = (event: Event) => {
      reject(new Error(`WebSocket error: ${event}`));
    };
    socket.onmessage = async (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data["msg"] === "send_hash") {
        socket.send(JSON.stringify(send_hash));
      } else if (data["msg"] === "send_data") {
        socket.send(JSON.stringify(payload));
      } else if (data["msg"] === "process_completed") {
        const result = tts.url + "/file=" + data["output"]["data"][1].name;
        resolve(result);
      }
    };
  });
}
