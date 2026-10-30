import type { Page } from "@playwright/test";
/** Taps the lock screen and, when the story sets a passcode, enters it. */
export async function unlockPhone(page: Page, passcode = "") {
  await page.getByRole("button", { name: "轻触解锁" }).click();
  for (const n of passcode)
    await page.getByRole("button", { name: "密码键" + n, exact: true }).click();
}
