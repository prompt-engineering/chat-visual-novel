export function parseResponse(response: string) {
  let result = response.trim();
  const speakerMatch = result.match(/speaker/g);
  if (speakerMatch && speakerMatch.length > 1) {
    result = result.substring(result.indexOf("{"), result.indexOf("}") + 1);
  }
  const jsonRegex = /{.*}/s; // s flag for dot to match newline characters
  const jsonMatch = result.match(jsonRegex);
  if (jsonMatch) {
    const jsonStr = jsonMatch[0].replaceAll(/\n|\r/g, "");
    return JSON.parse(jsonStr);
  }
}
