import { recordFlow, FlowFn } from '../record-flow';

const flow: FlowFn = async (page) => {
  // Wait for dashboard to load
  await page.waitForSelector('h1');
  await page.waitForTimeout(500);

  // Click "+ New Setlist" button
  await page.click('button:has-text("+ New Setlist")');
  await page.waitForSelector('input[type="text"]');
  await page.waitForTimeout(400);

  // Fill in the form
  await page.fill('input[type="text"]', 'Saturday Show');
  await page.waitForTimeout(400);

  // Click Create
  await page.click('button:has-text("Create")');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
};

export default async function run(record: typeof recordFlow) {
  await record(flow, {
    outputPath: '../docs/recordings/create-setlist.webm',
    url: 'http://localhost:3000',
  });
}
