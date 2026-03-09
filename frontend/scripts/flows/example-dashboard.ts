import { recordFlow, FlowFn } from '../record-flow';

const flow: FlowFn = async (page) => {
  // Wait for dashboard to load
  await page.waitForSelector('h1');
  await page.waitForTimeout(500);

  // Example: click create button, fill modal, submit
  // await page.click('button:has-text("New Setlist")');
  // await page.waitForTimeout(300);
  // await page.fill('input[name="name"]', 'Friday Night Set');
  // await page.click('button:has-text("Create")');
  // await page.waitForTimeout(500);
};

export default async function run(record: typeof recordFlow) {
  await record(flow, {
    outputPath: 'docs/recordings/dashboard-flow.webm',
    url: 'http://localhost:3000',
  });
}
