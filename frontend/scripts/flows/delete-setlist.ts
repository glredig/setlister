import { recordFlow, FlowFn } from '../record-flow';

const flow: FlowFn = async (page) => {
  // Wait for dashboard to load
  await page.waitForSelector('h1');
  await page.waitForTimeout(500);

  // Hover over the delete button first to show the highlight
  const deleteButton = page.locator('button[aria-label*="Delete"]').first();
  await deleteButton.hover();
  await page.waitForTimeout(400);

  // Click delete
  await deleteButton.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
};

export default async function run(record: typeof recordFlow) {
  await record(flow, {
    outputPath: '../docs/recordings/delete-setlist.webm',
    url: 'http://localhost:3000',
  });
}
