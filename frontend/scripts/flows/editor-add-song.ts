import { recordFlow, FlowFn } from '../record-flow';

const flow: FlowFn = async (page) => {
  // Wait for editor to load
  await page.waitForSelector('h1');
  await page.waitForTimeout(500);

  // Add Bohemian Rhapsody
  await page.click('button[aria-label="Add Bohemian Rhapsody"]');
  await page.waitForTimeout(400);

  // Add Superstition
  await page.click('button[aria-label="Add Superstition"]');
  await page.waitForTimeout(400);

  // Add Come Together
  await page.click('button[aria-label="Add Come Together"]');
  await page.waitForTimeout(500);

  // Click Save
  await page.click('button[aria-label="Save"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
};

export default async function run(record: typeof recordFlow) {
  await record(flow, {
    outputPath: '../docs/recordings/editor-add-song.webm',
    url: 'http://localhost:3000/setlists/3/edit',
  });
}
