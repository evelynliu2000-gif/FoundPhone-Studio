import { test, expect, type Locator } from "@playwright/test";
// Plays the default story (stories/template/story.json) end to end in the real build.
async function openThread(phone: Locator, title: string) {
  await phone
    .locator(".wechat-ui")
    .getByRole("button", { name: title })
    .first()
    .click();
  await expect(phone.locator(".wechat-ui")).toHaveAttribute(
    "data-thread",
    "true",
  );
}
async function back(phone: Locator) {
  await phone.locator(".wx-nav").getByRole("button", { name: "返回" }).click();
}
const thread = (phone: Locator) => phone.locator(".wechat-ui .skin-messages");
test("Kingston: passcode, WeChat chats and scripted typing", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const phone = page.locator(".phone-screen");
  await expect(phone.getByText("Eva姐", { exact: false })).toBeVisible();
  await phone.getByRole("button", { name: "轻触解锁" }).click();
  for (const n of "0306")
    await phone
      .getByRole("button", { name: "密码键" + n, exact: true })
      .click();
  await expect(phone.locator(".home-screen")).toBeVisible();
  await phone.getByRole("button", { name: "打开微信", exact: true }).click();
  for (const title of [
    "Leo",
    "Sing",
    "刘隽",
    "Eva姐",
    "Kingston、Leo、Sing、Eva姐",
  ])
    await expect(
      phone.locator(".wechat-ui").getByText(title, { exact: true }).first(),
    ).toBeVisible();
  await phone.screenshot({ path: "outputs/kingston/wechat-list.png" });

  // Leo: history, then two typed messages, then reply.
  await openThread(phone, "Leo");
  await expect(thread(phone)).toContainText("你把厨房水池收拾一下");
  await expect(thread(phone)).toContainText("OK");
  await expect(thread(phone)).not.toContainText("起床了吗");
  await phone.getByRole("button", { name: "输入消息" }).click();
  await expect(phone.getByLabel("消息草稿")).toHaveValue(/起床/);
  await phone.screenshot({ path: "outputs/kingston/leo-typing.png" });
  await expect(thread(phone)).toContainText("起床了吗，她们已经过来了");
  await expect(thread(phone)).toContainText("今天妆造很费时间");
  await expect(thread(phone)).toContainText("起来了", { timeout: 10000 });
  await expect(phone.locator(".device-keyboard")).toHaveCount(0);
  await phone.screenshot({ path: "outputs/kingston/leo-done.png" });
  // Nothing left to type: the keyboard opens normally and stays empty.
  await phone.getByRole("button", { name: "输入消息" }).click();
  await expect(phone.getByLabel("消息草稿")).toHaveValue("");
  await phone.getByRole("button", { name: "收起键盘" }).click();
  await back(phone);

  // Sing
  await openThread(phone, "Sing");
  await expect(thread(phone)).toContainText("昨晚我很开心");
  await expect(thread(phone)).toContainText("哥我们回北京还有机会做吗");
  await expect(thread(phone)).toContainText("看情况吧");
  await phone.getByRole("button", { name: "输入消息" }).click();
  await expect(thread(phone)).toContainText("你经纪人到了吗", {
    timeout: 15000,
  });
  await expect(thread(phone)).toContainText("她已经到了", { timeout: 10000 });
  await phone.screenshot({ path: "outputs/kingston/sing-done.png" });
  await back(phone);

  // 刘隽: two typed messages, two replies.
  await openThread(phone, "刘隽");
  await expect(thread(phone).locator(".skin-system-tip")).toHaveText(
    "你已添加了刘隽，现在可以开始聊天了。",
  );
  await phone.getByRole("button", { name: "输入消息" }).click();
  await expect(thread(phone)).toContainText("要你多费心照顾他们两个", {
    timeout: 15000,
  });
  await expect(thread(phone)).toContainText("兄弟我们俩不用说谢", {
    timeout: 10000,
  });
  await expect(thread(phone)).toContainText(
    "是我要谢谢你呢一下子给我找这么好的活",
    { timeout: 10000 },
  );
  await phone.screenshot({ path: "outputs/kingston/liujuan-done.png" });
  await back(phone);

  // Eva姐: type a draft, delete it, then send "知道了".
  await openThread(phone, "Eva姐");
  await expect(thread(phone)).toContainText("你再忍忍吧");
  await expect(thread(phone)).toContainText("现在这个情况确实必须这样做");
  await phone.getByRole("button", { name: "输入消息" }).click();
  const draft = phone.getByLabel("消息草稿");
  await expect(draft).toHaveValue("忍到什么时候啊");
  await phone.screenshot({ path: "outputs/kingston/eva-draft.png" });
  await expect(draft).toHaveValue("");
  await expect(draft).toHaveValue("知道了");
  await expect(thread(phone)).toContainText("知道了");
  await expect(thread(phone)).not.toContainText("忍到什么时候啊");
  await phone.screenshot({ path: "outputs/kingston/eva-done.png" });
  await back(phone);

  // Group chat exists with its creation tip.
  await openThread(phone, "Kingston、Leo、Sing、Eva姐");
  await expect(thread(phone).locator(".skin-system-tip")).toHaveText(
    "你邀请Leo、Sing、Eva姐加入了群聊",
  );
  await back(phone);

  // Progress survives a reload.
  await page.reload();
  await phone.getByRole("button", { name: "轻触解锁" }).click();
  for (const n of "0306")
    await phone
      .getByRole("button", { name: "密码键" + n, exact: true })
      .click();
  await phone.getByRole("button", { name: "打开微信", exact: true }).click();
  await openThread(phone, "Eva姐");
  await expect(thread(phone)).toContainText("知道了");
  expect(errors).toEqual([]);
});
