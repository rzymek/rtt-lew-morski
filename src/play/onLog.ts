export function onLog(text: string): HTMLElement {
  const entry = document.createElement("div");
  entry.textContent = text;
  if (/^Etap \d+$/.test(text)) entry.className = "stage";
  return entry;
}
