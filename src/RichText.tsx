import { useState, type ReactNode } from "react";
type RichNode = {
  type?: string;
  text?: string;
  checked?: boolean;
  marks?: { type: string }[];
  content?: RichNode[];
  attrs?: Record<string, unknown>;
};
const allowed = new Set([
  "doc",
  "text",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
  "horizontalRule",
  "codeBlock",
  "taskList",
  "taskItem",
]);
function cleanNode(value: unknown, depth = 0): RichNode | undefined {
  if (depth > 12 || !value || typeof value !== "object") return;
  const n = value as Record<string, unknown>;
  if (typeof n.type !== "string" || !allowed.has(n.type)) return;
  return {
    type: n.type,
    text: typeof n.text === "string" ? n.text : undefined,
    checked:
      n.type === "taskItem" &&
      !!n.attrs &&
      typeof n.attrs === "object" &&
      (n.attrs as Record<string, unknown>).checked === true,
    marks: Array.isArray(n.marks)
      ? n.marks
          .filter(
            (m): m is { type: string } =>
              !!m &&
              typeof m === "object" &&
              typeof m.type === "string" &&
              ["bold", "italic", "strike", "code"].includes(m.type),
          )
          .map((m) => ({ type: m.type }))
      : undefined,
    content: Array.isArray(n.content)
      ? n.content
          .slice(0, 10000)
          .map((c) => cleanNode(c, depth + 1))
          .filter((n): n is RichNode => !!n)
      : undefined,
  };
}
export function parseRichText(value: string): RichNode | undefined {
  if (!value) return;
  try {
    const n = cleanNode(JSON.parse(value));
    return n?.type === "doc" ? n : undefined;
  } catch {
    return;
  }
}
export function RichText({
  value,
  fallback,
}: {
  value: string;
  fallback: string;
}) {
  const n = parseRichText(value);
  if (!n) return <p className="detail-body">{fallback}</p>;
  const render = (n: RichNode, depth: number, key: number): ReactNode => {
    if (depth > 12) return null;
    if (n.type === "text") {
      let text: ReactNode = n.text ?? "";
      for (const m of n.marks ?? []) {
        if (m.type === "bold") text = <strong>{text}</strong>;
        if (m.type === "italic") text = <em>{text}</em>;
        if (m.type === "strike") text = <s>{text}</s>;
        if (m.type === "code") text = <code>{text}</code>;
      }
      return <span key={key}>{text}</span>;
    }
    const children = n.content
      ?.slice(0, 10000)
      .map((c, i) => render(c, depth + 1, i));
    switch (n.type) {
      case "paragraph":
        return <p key={key}>{children}</p>;
      case "heading":
        return <h3 key={key}>{children}</h3>;
      case "bulletList":
        return <ul key={key}>{children}</ul>;
      case "orderedList":
        return <ol key={key}>{children}</ol>;
      case "listItem":
        return <li key={key}>{children}</li>;
      case "blockquote":
        return <blockquote key={key}>{children}</blockquote>;
      case "hardBreak":
        return <br key={key} />;
      case "horizontalRule":
        return <hr key={key} />;
      case "codeBlock":
        return <pre key={key}>{children}</pre>;
      case "taskList":
        return (
          <ul key={key} className="rich-checklist">
            {children}
          </ul>
        );
      case "taskItem":
        return (
          <TaskItem key={key} checked={!!n.checked}>
            {children}
          </TaskItem>
        );
      default:
        return <span key={key}>{children}</span>;
    }
  };
  return <div className="detail-body rich-body">{render(n, 0, 0)}</div>;
}
/** iOS Notes style checklist row; tapping toggles it for this viewing only. */
function TaskItem({
  checked,
  children,
}: {
  checked: boolean;
  children: ReactNode;
}) {
  const [done, setDone] = useState(checked);
  return (
    <li className={`rich-task ${done ? "is-done" : ""}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? "标为未完成" : "标为完成"}
        onClick={() => setDone(!done)}
      />
      <div>{children}</div>
    </li>
  );
}
