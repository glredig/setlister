import { recordFlow, FlowFn } from '../record-flow';

const flow: FlowFn = async (page) => {
  // Wait for dashboard to load, then click edit on the first setlist
  await page.waitForSelector('a[href*="/setlists/"]');
  await page.waitForTimeout(300);
  await page.click('a[href*="/edit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Click first song to expand
  const firstCard = page.locator('[role="button"][aria-expanded]').first();
  await firstCard.click();
  await page.waitForTimeout(500);

  // Check a lead vocalist checkbox (Jake)
  await page.click('[aria-label="Lead: Jake"]');
  await page.waitForTimeout(300);

  // Type in notes
  const notes = page.locator('[aria-label="Notes"]');
  await notes.click();
  await notes.fill('Updated notes from flow recording');
  await page.waitForTimeout(400);

  // Click second song to demonstrate accordion
  const secondCard = page.locator('[role="button"][aria-expanded]').nth(1);
  await secondCard.click();
  await page.waitForTimeout(500);

  // Click first song again to re-expand
  await firstCard.click();
  await page.waitForTimeout(500);

  // Save
  await page.click('button[aria-label="Save"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
};

export default async function run(record: typeof recordFlow) {
  await record(flow, {
    outputPath: '../docs/recordings/editor-expand-config.webm',
    url: 'http://localhost:3000',
  });
}
