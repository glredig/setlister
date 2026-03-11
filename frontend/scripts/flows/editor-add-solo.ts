import { recordFlow, FlowFn } from '../record-flow';

const flow: FlowFn = async (page) => {
  // Navigate from dashboard to editor
  await page.waitForSelector('a[href*="/setlists/"]');
  await page.waitForTimeout(300);
  await page.click('a[href*="/edit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Click first song to expand
  const firstCard = page.locator('[role="button"][aria-expanded]').first();
  await firstCard.click();
  await page.waitForTimeout(500);

  // Scroll to Add Solo button
  await page.locator('[aria-label="Add solo"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Click Add Solo
  await page.click('[aria-label="Add solo"]');
  await page.waitForTimeout(400);

  // Scroll to see solo row
  await page.locator('[aria-label="Solo 1 member"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  // Select a member
  await page.selectOption('[aria-label="Solo 1 member"]', { index: 1 });
  await page.waitForTimeout(300);

  // Select instrument
  await page.selectOption('[aria-label="Solo 1 instrument"]', { index: 1 });
  await page.waitForTimeout(300);

  // Add another solo
  await page.click('[aria-label="Add solo"]');
  await page.waitForTimeout(300);

  // Remove the second solo
  await page.click('[aria-label="Remove solo 2"]');
  await page.waitForTimeout(400);

  // Save
  await page.click('button[aria-label="Save"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
};

export default async function run(record: typeof recordFlow) {
  await record(flow, {
    outputPath: '../docs/recordings/editor-add-solo.webm',
    url: 'http://localhost:3000',
  });
}
