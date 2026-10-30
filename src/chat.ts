import { makeItem, type Item, type Runtime } from "./schema";
import { visible } from "./engine";
/**
 * Scripted composer: owner messages marked meta.autoType="true" and hidden:true
 * are typed automatically when the player taps the chat input. Returns the next
 * batch for a conversation (consecutive pending autoType items), only once every
 * earlier message in that conversation is visible, so replies gate later rounds.
 */
export function nextAutoType(
  items: Item[],
  thread: string,
  s: Runtime,
): Item[] {
  const all = items.filter(
    (i) => i.title === thread && !s.hidden.includes(i.id),
  );
  const pending = (i: Item) => i.meta?.autoType === "true" && !visible(i, s);
  const start = all.findIndex(pending);
  if (start < 0 || all.slice(0, start).some((i) => !visible(i, s))) return [];
  const batch: Item[] = [];
  for (const i of all.slice(start)) {
    if (!pending(i)) break;
    batch.push(i);
  }
  return batch;
}
export function parseChat(text: string): { items: Item[]; errors: string[] } {
  const errors: string[] = [];
  const items: Item[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const match = line.match(/^\[([^\]]+)\]\s*([^：:]+)[：:]\s*(.+)$/);
    if (!match) {
      errors.push(`第 ${index + 1} 行：应为 [时间] 发送者：消息`);
      return;
    }
    const [, time, sender, body] = match;
    items.push(
      makeItem({
        title: sender.trim() === "我" ? "小林" : sender.trim(),
        sender: sender.trim(),
        body,
        time,
        outgoing: sender.trim() === "我",
      }),
    );
  });
  return { items, errors };
}
export function parseCsv(text: string): { items: Item[]; errors: string[] } {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if (c === "\n" && !quoted) {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field);
  if (row.some(Boolean)) rows.push(row);
  if (quoted) return { items: [], errors: ["CSV 引号未闭合"] };
  const header = rows.shift()?.map((s) => s.trim()) ?? [];
  const indexes = ["time", "sender", "body"].map((k) => header.indexOf(k));
  if (indexes.includes(-1))
    return { items: [], errors: ["CSV 必须包含 time,sender,body 列"] };
  return {
    items: rows.map((r) =>
      makeItem({
        time: r[indexes[0]] ?? "",
        sender: r[indexes[1]] ?? "",
        title: r[indexes[1]] ?? "",
        body: r[indexes[2]] ?? "",
        outgoing: r[indexes[1]] === "我",
      }),
    ),
    errors: [],
  };
}
