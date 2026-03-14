import { recordFlow, FlowFn } from '../record-flow';

const flow: FlowFn = async (page) => {
  // Navigate from dashboard to editor
  await page.waitForSelector('a[href*="/setlists/"]');
  await page.waitForTimeout(300);
  await page.click('a[href*="/edit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Duration summary bar should be visible — pause to show it
  await page.waitForTimeout(500);

  // Change gap time to 60 seconds
  const gapInput = page.locator('[aria-label="Time between songs (seconds)"]');
  await gapInput.click();
  await gapInput.fill('60');
  await page.waitForTimeout(500);

  // Change to 15 seconds
  await gapInput.fill('15');
  await page.waitForTimeout(500);

  // Change back to 30
  await gapInput.fill('30');
  await page.waitForTimeout(500);

  // Save
  await page.click('button[aria-label="Save"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
};

export default async function run(record: typeof recordFlow) {
  await record(flow, {
    outputPath: '../docs/recordings/editor-duration.webm',
    url: 'http://localhost:3000',
  });
}
