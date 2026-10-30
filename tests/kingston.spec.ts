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
  for (const title of ["Leo", "Sing", "刘隽", "Eva姐", "梓渝", "ctbz办公室"])
    await expect(
      phone.locator(".wechat-ui").getByText(title, { exact: true }).first(),
    ).toBeVisible();
  await phone.screenshot({ path: "outputs/kingston/wechat-list.png" });

  // Leo: history, then two typed messages, then reply.
  await openThread(phone, "Leo");
  await expect(thread(phone)).toContainText("你把厨房水池收拾一下");
  await expect(thread(phone)).toContainText("我刚去看了发现你已经收拾完了");
  // Opening the chat delivers Leo's message from the night before.
  await expect(thread(phone)).toContainText("明天早上化妆叫我");
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

  // Leaving a chat mid-typing dismisses the keyboard; the rest resumes later.
  await openThread(phone, "Sing");
  await phone.getByRole("button", { name: "输入消息" }).click();
  await expect(phone.getByLabel("消息草稿")).toHaveValue(/我和/);
  await back(phone);
  await expect(phone.locator(".device-keyboard")).toHaveCount(0);

  // Sing
  await openThread(phone, "Sing");
  await expect(thread(phone)).toContainText("昨晚我很开心");
  await expect(thread(phone)).toContainText("哥我们回北京还有机会做吗");
  await expect(thread(phone)).toContainText("看情况吧");
  await expect(thread(phone)).toContainText("哥你们起床了吗？");
  await phone.getByRole("button", { name: "输入消息" }).click();
  await expect(thread(phone)).toContainText("你经纪人到了吗", {
    timeout: 15000,
  });
  await expect(thread(phone)).toContainText("她已经到了", { timeout: 10000 });
  await phone.screenshot({ path: "outputs/kingston/sing-done.png" });
  await back(phone);

  // 刘隽: opening delivers 到家了吗, then three typed messages, two replies.
  await openThread(phone, "刘隽");
  await expect(thread(phone).locator(".skin-system-tip")).toHaveCount(0);
  await expect(thread(phone).locator(".skin-bubble").first()).toContainText(
    "到家了吗",
  );
  await phone.getByRole("button", { name: "输入消息" }).click();
  await expect(thread(phone)).toContainText("到家了，抱歉昨晚太累了直接睡了", {
    timeout: 15000,
  });
  await expect(thread(phone)).toContainText("昨天辛苦你了", {
    timeout: 15000,
  });
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

  // 梓渝: static history.
  await openThread(phone, "梓渝");
  for (const line of [
    "不是，哥们",
    "我一分钱没赚到",
    "还倒贴了好多钱啊",
    "下海改变阶级",
    "没毛病啊",
    "我也没说往上还是往下啊",
    "。。。",
  ])
    await expect(thread(phone)).toContainText(line);
  await back(phone);

  // Group chat: no invite tip; Eva姐's notice and the replies with names.
  await openThread(phone, "ctbz办公室");
  await expect(thread(phone).locator(".skin-system-tip")).toHaveCount(0);
  // Kingston's and Sing's quick replies carry no time; Eva's and Leo's do.
  await expect(thread(phone).locator(".wx-message-time")).toHaveText([
    "21:03",
    "22:32",
  ]);
  await expect(thread(phone).locator(".skin-bubble")).toContainText([
    "@全体成员 明天早上10点化妆师会来，下午一点准时出发，辛苦各位明天早起～",
    "收到",
    "好的姐姐",
    "111",
  ]);
  await expect(thread(phone).locator(".wx-sender-name")).toHaveText([
    "Eva姐",
    "Sing",
    "Leo",
  ]);
  await expect(phone.locator(".device-keyboard")).toHaveCount(0);
  await phone.screenshot({ path: "outputs/kingston/group-chat.png" });
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
test("Kingston: WhatsApp, Spotify, Threads, Taobao, delivery and WeChat friend request", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const phone = page.locator(".phone-screen");
  await phone.getByRole("button", { name: "轻触解锁" }).click();
  for (const n of "0306")
    await phone
      .getByRole("button", { name: "密码键" + n, exact: true })
      .click();
  await expect(phone.locator(".home-screen")).toBeVisible();
  const openApp = async (name: string) => {
    await phone.getByRole("button", { name: "返回桌面", exact: true }).click();
    await phone
      .getByRole("button", { name: "打开" + name, exact: true })
      .click();
    await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
      "transform",
      "none",
    );
  };
  const shot = (name: string) =>
    phone.screenshot({ path: `outputs/kingston/${name}.png` });

  await phone
    .getByRole("button", { name: "打开WhatsApp", exact: true })
    .click();
  await expect(phone.getByText("Abigail").first()).toBeVisible();
  await phone.getByText("Abigail").first().click();
  await expect(
    phone.getByText("Who's that guy you posted on Insta?").first(),
  ).toBeVisible();
  await shot("whatsapp");

  await openApp("Spotify");
  await phone.getByRole("button", { name: "最近播放" }).click();
  const tracks = phone.locator(".spotify-tracks strong");
  await expect(tracks).toHaveText([
    "Neon",
    "boyfriend",
    "少女的祈祷",
    "Yellow",
    "雨爱",
    "小人国",
    "褪黑素",
    "Visions of Gideon",
    "刻在我心底的名字",
  ]);
  await shot("spotify");

  await openApp("Threads");
  for (const t of [
    "料杰你们什么时候能调理好",
    "zjj是不是疯了居然躲开",
    "林克们又护复审了",
    "TTC delays again this morning",
    "immigration rules keep changing",
  ])
    await expect(phone.getByText(t)).toBeVisible();
  await shot("threads");

  await openApp("淘宝");
  await phone.getByRole("button", { name: "订单", exact: true }).click();
  await expect(phone.locator(".taobao-order section strong")).toHaveText([
    "双眼皮贴",
    "垃圾袋",
    "拖把",
    "避孕套",
    "面膜",
  ]);
  await shot("taobao");

  await openApp("外卖");
  await phone.getByRole("button", { name: "订单", exact: true }).click();
  await expect(phone.locator(".delivery-order header strong")).toHaveText([
    "霸王茶姬",
    "老街烧烤",
    "霸王茶姬",
    "霸王茶姬",
    "霸王茶姬",
    "霸王茶姬",
    "片皮烤鸭",
    "霸王茶姬",
  ]);
  await shot("delivery");

  await openApp("微信");
  await expect(phone.locator(".wechat-ui")).not.toContainText("好友申请");
  await phone.getByRole("button", { name: "通讯录", exact: true }).click();
  await expect(phone.locator(".wx-request-badge")).toHaveText("1");
  await expect(phone.locator(".wx-contact:not(.wx-new-friends)")).toHaveText([
    /Leo$/,
    /Sing$/,
    /刘隽$/,
    /Eva姐$/,
    /梓渝$/,
  ]);
  await shot("wechat-contacts");
  await phone.getByRole("button", { name: /新的朋友/ }).click();
  await expect(phone.locator(".wx-friend-request")).toContainText("汪佳辰");
  await shot("wechat-new-friends");
  await phone.locator(".wx-request-main").click();
  await expect(phone).toContainText(
    "我听说你回国了，如果有机会你来上海，我们还能再见面吗？我很想你。",
  );
  await shot("wechat-request-detail");
  expect(errors).toEqual([]);
});
test("Kingston: calls, SMS, Google history, calendar, mail, WhatsApp, Netflix and Taobao trigger", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const phone = page.locator(".phone-screen");
  await phone.getByRole("button", { name: "轻触解锁" }).click();
  for (const n of "0306")
    await phone
      .getByRole("button", { name: "密码键" + n, exact: true })
      .click();
  await expect(phone.locator(".home-screen")).toBeVisible();
  const openApp = async (name: string) => {
    await phone.getByRole("button", { name: "返回桌面", exact: true }).click();
    const icon = phone.getByRole("button", {
      name: "打开" + name,
      exact: true,
    });
    if (!(await icon.isVisible())) {
      const box = await phone.boundingBox();
      await page.mouse.move(box!.x + box!.width * 0.85, box!.y + 400);
      await page.mouse.down();
      await page.mouse.move(box!.x + box!.width * 0.15, box!.y + 400, {
        steps: 8,
      });
      await page.mouse.up();
    }
    await icon.click();
    await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
      "transform",
      "none",
    );
  };
  const shot = (name: string) =>
    phone.screenshot({ path: `outputs/kingston/${name}.png` });

  await openApp("电话");
  await expect(phone.locator(".call-row")).toHaveCount(10);
  await expect(phone.locator(".call-row").first()).toContainText("138****2716");
  await expect(phone.locator(".call-row").first()).toContainText("北京");
  await shot("phone-calls");

  await openApp("信息");
  for (const t of [
    "圆通速递 张师傅",
    "顺丰速运 李师傅",
    "中通快递 王师傅",
    "京东快递 赵师傅",
    "韵达快递 刘师傅",
    "+86 176****8832",
    "+86 152****0619",
  ])
    await expect(phone.getByText(t, { exact: true })).toBeVisible();
  await shot("sms-list");
  await phone.getByText("顺丰速运 李师傅", { exact: true }).click();
  await expect(phone.locator(".catalog-message")).toHaveCount(4);
  await phone.getByRole("button", { name: "返回" }).first().click();
  await phone.getByText("+86 176****8832", { exact: true }).click();
  await expect(phone.locator(".catalog-message")).toContainText(
    "Kingston你再不和我宝宝主动卖腐你就等着回加拿大吧！",
  );
  await shot("sms-unknown");
  await phone.getByRole("button", { name: "返回" }).first().click();
  await phone.getByText("+86 152****0619", { exact: true }).click();
  await expect(phone.locator(".catalog-message")).toContainText(
    "不麦麸就滚！！",
  );

  await openApp("浏览器");
  await expect(phone.locator(".safari-search-history")).toHaveCount(0);
  await phone.locator(".safari-search-box").click();
  await expect(phone.locator(".safari-search-history button")).toHaveText([
    "万圣节妆容",
    "失眠助眠音乐",
    "不想吃饭怎么办",
    "植发恢复期护理",
    "和同事弟弟做了怎么办",
    "要不要跟前男友复合",
  ]);
  await shot("safari-google");

  await openApp("日历");
  await expect(phone.locator(".month-title h2")).toHaveText("2026 年 10 月");
  await phone.locator(".calendar-grid button", { hasText: /^12$/ }).click();
  await expect(phone.getByText("坐飞机")).toBeVisible();
  await shot("calendar");

  await openApp("提醒事项");
  await expect(phone.getByText("坐飞机")).toBeVisible();

  await openApp("邮件");
  for (const t of [
    "Your Halloween picks are here 🎃",
    "Black Friday Early Deals start now",
    "Kingston, items you viewed are on sale",
    "Thinking of you, wherever you are",
    "Checking in: how are you doing?",
  ])
    await expect(phone.getByText(t)).toBeVisible();
  await shot("mail");

  await openApp("Netflix");
  await expect(phone.getByText("最近在看")).toBeVisible();
  await expect(
    phone.locator(".netflix-shelf strong", { hasText: "Heated Rivalry" }),
  ).toBeVisible();
  await shot("netflix");

  await openApp("WhatsApp");
  for (const t of [
    "Abigail",
    "姐姐",
    "Dad",
    "Mom",
    "vfs team",
    "winter game",
    "Vancouver Asians",
  ])
    await expect(
      phone.locator(".wa-chat-row strong", { hasText: new RegExp(`^${t}$`) }),
    ).toBeVisible();
  await shot("whatsapp-list");
  await phone.locator(".wa-chat-row", { hasText: "Dad" }).click();
  await expect(phone.locator(".wa-locked-notice")).toBeVisible();
  await expect(phone.locator(".wa-thread-profile")).toHaveCount(0);
  await shot("whatsapp-locked");
  await phone.locator(".wa-chat-row", { hasText: "姐姐" }).click();
  await expect(phone.locator(".skin-messages")).toContainText(
    "感觉比Vancouver冷",
  );
  await phone.getByRole("button", { name: "返回聊天列表" }).click();
  await phone.locator(".wa-chat-row", { hasText: "vfs team" }).click();
  await expect(phone.locator(".skin-system-tip")).toHaveText("你已加入此群组");

  // Taobao only delivers Leo's message after Leo has replied "起来了".
  await openApp("淘宝");
  await page.waitForTimeout(1500);
  await expect(page.getByText("昨天套子用完了，该买了")).toHaveCount(0);
  await openApp("微信");
  await phone
    .locator(".wechat-ui")
    .getByRole("button", { name: "Leo" })
    .first()
    .click();
  await expect(phone.locator(".skin-messages")).not.toContainText(
    "昨天套子用完了",
  );
  await phone.getByRole("button", { name: "输入消息" }).click();
  await expect(phone.locator(".skin-messages")).toContainText("起来了", {
    timeout: 15000,
  });
  await openApp("淘宝");
  await expect(page.getByText("昨天套子用完了，该买了").first()).toBeVisible();
  await shot("taobao-banner");
  await openApp("微信");
  await phone
    .locator(".wechat-ui")
    .getByRole("button", { name: "Leo" })
    .first()
    .click();
  await expect(
    phone.locator(".skin-messages .skin-message").last(),
  ).toContainText("昨天套子用完了，该买了");
  await shot("leo-after-taobao");
  await openApp("Netflix");
  await shot("netflix");
  expect(errors).toEqual([]);
});
test("Kingston: decorative photo apps sit on the home screen with their icons", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const phone = page.locator(".phone-screen");
  await phone.getByRole("button", { name: "轻触解锁" }).click();
  for (const n of "0306")
    await phone
      .getByRole("button", { name: "密码键" + n, exact: true })
      .click();
  await expect(phone.locator(".home-screen")).toBeVisible();
  const box = (await phone.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.85, box.y + 400);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.15, box.y + 400, { steps: 8 });
  await page.mouse.up();
  for (const name of ["醒图", "Dazz Cam", "美图秀秀"]) {
    const icon = phone.getByRole("button", {
      name: "打开" + name,
      exact: true,
    });
    await expect(icon).toBeVisible();
    await expect(icon.locator("img")).toHaveAttribute(
      "src",
      /^data:image\/png;base64,/,
    );
  }
  await page.waitForTimeout(400);
  await phone.screenshot({ path: "outputs/kingston/home-page-2.png" });
  await phone
    .getByRole("button", { name: "打开美图秀秀", exact: true })
    .click();
  await expect(page.locator(".app-screen:not([inert])")).toBeVisible();
  expect(errors).toEqual([]);
});
test("Kingston: WeChat avatars for Kingston, Leo and Sing", async ({
  page,
}) => {
  await page.goto("/");
  const phone = page.locator(".phone-screen");
  await phone.getByRole("button", { name: "轻触解锁" }).click();
  for (const n of "0306")
    await phone
      .getByRole("button", { name: "密码键" + n, exact: true })
      .click();
  await phone.getByRole("button", { name: "打开微信", exact: true }).click();
  const row = (t: string) =>
    phone.locator(".wx-chat-row", { has: page.getByText(t, { exact: true }) });
  const leoSrc = await row("Leo").locator("img").getAttribute("src");
  const singSrc = await row("Sing").locator("img").getAttribute("src");
  expect(leoSrc).toMatch(/^data:image\/jpeg/);
  expect(singSrc).toMatch(/^data:image\/jpeg/);
  expect(leoSrc).not.toBe(singSrc);
  const srcs = [leoSrc, singSrc];
  for (const t of ["刘隽", "Eva姐", "梓渝"]) {
    const src = await row(t).locator("img").getAttribute("src");
    expect(src).toMatch(/^data:image\/jpeg/);
    srcs.push(src);
  }
  expect(new Set(srcs).size).toBe(5);
  const groupSrc = await row("ctbz办公室").locator("img").getAttribute("src");
  expect(groupSrc).toMatch(/^data:image\/jpeg/);
  expect(srcs).not.toContain(groupSrc);
  await phone.screenshot({ path: "outputs/kingston/avatars-list.png" });
  await row("Leo").click();
  const own = phone.locator(".skin-message.outgoing img").first();
  const ownSrc = await own.getAttribute("src");
  expect(ownSrc).toMatch(/^data:image\/jpeg/);
  expect(ownSrc).not.toBe(leoSrc);
  await expect(
    phone.locator(".skin-message:not(.outgoing) img").first(),
  ).toHaveAttribute("src", leoSrc!);
  await phone.screenshot({ path: "outputs/kingston/avatars-thread.png" });
  await phone.locator(".wx-nav").getByRole("button", { name: "返回" }).click();
  await phone.getByRole("button", { name: "我", exact: true }).click();
  await expect(phone.locator(".wx-profile img")).toHaveAttribute(
    "src",
    ownSrc!,
  );
});
test("Kingston: wallpaper, model, health alert, Alipay, 小红书, notes, photos", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const phone = page.locator(".phone-screen");
  await expect(phone).toHaveClass(/wallpaper-custom/);
  await expect(phone).toHaveCSS("background-image", /data:image\/jpeg/);
  await phone.screenshot({ path: "outputs/kingston/lock-wallpaper.png" });
  await phone.getByRole("button", { name: "轻触解锁" }).click();
  for (const n of "0306")
    await phone
      .getByRole("button", { name: "密码键" + n, exact: true })
      .click();
  await expect(phone.locator(".home-screen")).toBeVisible();
  await phone.screenshot({ path: "outputs/kingston/home-wallpaper.png" });
  for (const gone of ["微博", "钱包", "抖音", "YouTube", "Instagram"])
    await expect(
      phone.getByRole("button", { name: "打开" + gone, exact: true }),
    ).toHaveCount(0);
  const openApp = async (name: string) => {
    await phone.getByRole("button", { name: "返回桌面", exact: true }).click();
    const icon = phone.getByRole("button", {
      name: "打开" + name,
      exact: true,
    });
    if (!(await icon.isVisible())) {
      const box = (await phone.boundingBox())!;
      await page.mouse.move(box.x + box.width * 0.85, box.y + 400);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.15, box.y + 400, {
        steps: 8,
      });
      await page.mouse.up();
    }
    await icon.click();
    await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
      "transform",
      "none",
    );
  };
  const shot = (name: string) =>
    phone.screenshot({ path: `outputs/kingston/${name}.png` });

  await openApp("设置");
  await phone.getByRole("button", { name: "通用", exact: true }).click();
  await phone.getByRole("button", { name: "关于本机", exact: true }).click();
  await expect(phone.getByText("iPhone 18 Pro", { exact: true })).toBeVisible();

  await openApp("健康");
  await expect(
    page.getByText(/过去 7 晚，你的睡眠评分均低于 60 分/).first(),
  ).toBeVisible();
  await shot("health-alert");
  await phone.locator(".health-card-sleep").click();
  await expect(phone.locator(".health-detail-value")).toContainText("52");
  await shot("health-sleep");

  await openApp("支付宝");
  await expect(phone.getByText("交易成功").first()).toBeVisible();
  await shot("alipay");

  await openApp("小红书");
  for (const t of [
    "二手劳力士价格涨幅｜这几款闭眼入不亏",
    "合同违约金到底怎么算？一篇讲清楚",
    "北京绝佳约会地点合集｜氛围感拉满",
    "如何偷情不被老公发现",
  ])
    await expect(phone.getByText(t).first()).toBeVisible();
  await shot("redbook");

  await openApp("备忘录");
  await expect(phone.locator(".notes-list button")).toHaveCount(3);
  await expect(phone.locator(".notes-list")).toContainText("已锁定的备忘录");
  await expect(phone.locator(".notes-list")).not.toContainText("destination");
  await shot("notes-list");
  await phone.locator(".notes-list button", { hasText: "采购清单" }).click();
  const tasks = phone.locator(".rich-task");
  await expect(tasks).toHaveText(["垃圾袋", "山楂条", "咖啡粉", "套", "oil"]);
  await tasks.nth(0).getByRole("checkbox").click();
  await expect(tasks.nth(0)).toHaveClass(/is-done/);
  await shot("notes-checklist");
  await phone.getByRole("button", { name: "返回" }).first().click();
  await phone.locator(".notes-list button", { hasText: "上床日记" }).click();
  await expect(phone.getByText("这条内容已锁定")).toBeVisible();
  await expect(phone.getByText(/我今天居然/)).toHaveCount(0);
  await shot("notes-locked");

  await openApp("相册");
  await expect(phone.locator(".photo-mosaic img")).toHaveCount(18);
  await shot("photos");
  expect(errors).toEqual([]);
});
test("Kingston: 新的朋友 red dot, add 汪佳辰, and Leo after Taobao", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const phone = page.locator(".phone-screen");
  await phone.getByRole("button", { name: "轻触解锁" }).click();
  for (const n of "0306")
    await phone
      .getByRole("button", { name: "密码键" + n, exact: true })
      .click();
  await phone.getByRole("button", { name: "打开微信", exact: true }).click();
  await expect(phone.locator(".wx-tab-dot")).toBeVisible();
  await expect(
    phone.locator(".wx-chat-row", { hasText: "汪佳辰" }),
  ).toHaveCount(0);
  await phone.screenshot({ path: "outputs/kingston/wechat-tab-dot.png" });
  await phone.getByRole("button", { name: "通讯录", exact: true }).click();
  await phone.getByRole("button", { name: /新的朋友/ }).click();
  await phone.getByRole("button", { name: "添加", exact: true }).click();
  // Lands in the new chat: the request message, then 我很想你.
  await expect(phone.locator(".wechat-ui")).toHaveAttribute(
    "data-thread",
    "true",
  );
  const thread = phone.locator(".wechat-ui .skin-messages");
  await expect(thread).toContainText("我听说你回国了");
  // The request text itself ends with 我很想你。; wait for the separate message.
  await expect(thread.locator(".skin-message:not(.outgoing)")).toHaveCount(2, {
    timeout: 8000,
  });
  await expect(
    thread.locator(".skin-message:not(.outgoing) .skin-bubble").last(),
  ).toContainText("我很想你");
  await phone.getByRole("button", { name: "输入消息" }).click();
  await expect(thread).toContainText("最近没有去上海的行程", {
    timeout: 15000,
  });
  const draft = phone.getByLabel("消息草稿");
  await expect(draft).toHaveValue("我们已经分手了。", { timeout: 8000 });
  await phone.screenshot({ path: "outputs/kingston/jiachen-draft.png" });
  await expect(phone.locator(".device-keyboard")).toHaveCount(0, {
    timeout: 8000,
  });
  await expect(thread).not.toContainText("我们已经分手了");
  await expect(thread.locator(".skin-message.outgoing")).toHaveCount(2);
  await phone.screenshot({ path: "outputs/kingston/jiachen-done.png" });
  await phone.locator(".wx-nav").getByRole("button", { name: "返回" }).click();
  await expect(phone.locator(".wx-tab-dot")).toHaveCount(0);
  await phone.getByRole("button", { name: "通讯录", exact: true }).click();
  await expect(phone.locator(".wx-request-badge")).toHaveCount(0);
  await phone.getByRole("button", { name: /新的朋友/ }).click();
  await expect(phone.locator(".wx-request-added")).toHaveText("已添加");
  await phone.locator(".wx-nav").getByRole("button", { name: "返回" }).click();

  // Leo: finish the first round, then Taobao delivers his message and the
  // argument plays out over two typed rounds.
  await phone.getByRole("button", { name: "微信", exact: true }).click();
  await phone.locator(".wx-chat-row", { hasText: "Leo" }).click();
  await phone.getByRole("button", { name: "输入消息" }).click();
  await expect(thread).toContainText("起来了", { timeout: 15000 });
  await phone.getByRole("button", { name: "返回桌面", exact: true }).click();
  await phone.getByRole("button", { name: "打开淘宝", exact: true }).click();
  await expect(page.getByText("昨天套子用完了，该买了").first()).toBeVisible();
  await phone.getByRole("button", { name: "返回桌面", exact: true }).click();
  await phone.getByRole("button", { name: "打开微信", exact: true }).click();
  await phone.locator(".wx-chat-row", { hasText: "Leo" }).click();
  await phone.getByRole("button", { name: "输入消息" }).click();
  await expect(thread).toContainText("我记得回香港之前还有的啊", {
    timeout: 15000,
  });
  await expect(thread).toContainText("不会是你拿走跟sing用了吧？", {
    timeout: 10000,
  });
  await phone.getByRole("button", { name: "输入消息" }).click();
  await expect(thread).toContainText("就是你拿回香港用了吧，痴线", {
    timeout: 15000,
  });
  // The chat follows the conversation: the newest message is on screen.
  await expect(thread.locator(".skin-message").last()).toBeInViewport();
  await phone.screenshot({ path: "outputs/kingston/leo-argument.png" });
  expect(errors).toEqual([]);
});
