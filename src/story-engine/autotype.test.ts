import { describe, it, expect } from "vitest";
import { compileStory, type Story } from "./compiler";
import { testStory } from "./testStory";
import { dispatch, advance } from "../engine";
import { nextAutoType } from "../chat";
import { initialRuntime } from "../schema";
const raw = () => ({
  scriptVersion: 1,
  id: "autotype-fixture",
  title: "自动输入",
  phone: { owner: "机主" },
  installedApps: ["wechat"],
  contacts: [{ id: "amy", name: "Amy" }],
  chats: [
    {
      id: "chat-amy",
      app: "wechat",
      title: "Amy",
      participants: ["owner", "amy"],
      messages: [
        { id: "history", body: "早", senderId: "amy" },
        {
          id: "out-1",
          body: "知道了",
          senderId: "owner",
          hidden: true,
          meta: { autoType: "true", retract: "不想去" },
        },
        {
          id: "out-2",
          body: "马上到",
          senderId: "owner",
          hidden: true,
          meta: { autoType: "true" },
        },
        { id: "reply", body: "好", senderId: "amy", hidden: true },
        {
          id: "out-3",
          body: "到了",
          senderId: "owner",
          hidden: true,
          meta: { autoType: "true" },
        },
      ],
    },
  ],
  events: [
    {
      id: "sent",
      label: "发完",
      event: "send",
      target: "out-2",
      next: ["wait"],
    },
    {
      id: "wait",
      label: "回复",
      type: "delay",
      delayMs: 2000,
      actions: [{ type: "unlock", key: "reply", value: true }],
    },
  ],
  tests: [
    {
      name: "按顺序发送",
      steps: [
        { event: "send", target: "out-1" },
        { event: "send", target: "out-2" },
        { advanceMs: 2000 },
        { event: "send", target: "out-3" },
      ],
      expectUnlocked: ["out-1", "out-2", "reply", "out-3"],
    },
  ],
});
describe("scripted composer (autoType)", () => {
  it("types consecutive drafts as one batch and gates the next round on replies", () => {
    const { work } = compileStory(raw());
    const items = work.data.wechat;
    let s = dispatch(work, initialRuntime(work), "start");
    expect(nextAutoType(items, "Amy", s).map((i) => i.id)).toEqual([
      "out-1",
      "out-2",
    ]);
    expect(nextAutoType(items, "Amy", s)[0].meta.retract).toBe("不想去");
    s = dispatch(work, s, "send", "out-1");
    s = dispatch(work, s, "send", "out-2");
    expect(nextAutoType(items, "Amy", s)).toEqual([]);
    s = advance(work, s, 2000);
    expect(s.unlocked).toContain("reply");
    expect(nextAutoType(items, "Amy", s).map((i) => i.id)).toEqual(["out-3"]);
  });
  it("only reveals autoType messages through the send event", () => {
    const { work } = compileStory(raw());
    const s = dispatch(work, initialRuntime(work), "send", "reply");
    expect(s.unlocked).not.toContain("reply");
  });
  it("story tests pass in order and fail when sending out of order", () => {
    const { story, work } = compileStory(raw());
    expect(testStory(story, work)).toEqual([]);
    const bad = structuredClone(story) as Story;
    bad.tests[0].steps.splice(2, 1);
    expect(testStory(bad, work).join()).toContain("尚不能发送");
  });
  it("rejects autoType messages that are not hidden owner messages", () => {
    const s = raw();
    s.chats[0].messages[1].hidden = false;
    expect(() => compileStory(s)).toThrow("自动输入消息");
    const t = raw();
    t.events[0].target = "reply";
    expect(() => compileStory(t)).toThrow("send 事件");
  });
});
