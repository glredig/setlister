import { recordFlow, FlowFn } from '../record-flow';

const flow: FlowFn = async (page) => {
  // Wait for editor to load with songs
  await page.waitForSelector('h1');
  await page.waitForTimeout(500);

  // Remove the first song
  const removeButtons = page.locator('button[aria-label^="Remove"]');
  await removeButtons.first().click();
  await page.waitForTimeout(500);

  // Click Save
  await page.click('button[aria-label="Save"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
};

export default async function run(record: typeof recordFlow) {
  await record(flow, {
    outputPath: '../docs/recordings/editor-remove-song.webm',
    url: 'http://localhost:3000/setlists/3/edit',
  });
}
