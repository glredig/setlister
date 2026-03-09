import { recordFlow, FlowFn } from '../record-flow';

const flow: FlowFn = async (page) => {
  // Wait for dashboard to fully render
  await page.waitForSelector('h1');
  await page.waitForTimeout(1000);

  // Hover over the setlist card to show the border highlight
  await page.hover('a[href*="/setlists/"]');
  await page.waitForTimeout(1000);
};

export default async function run(record: typeof recordFlow) {
  await record(flow, {
    outputPath: '../docs/recordings/dashboard-list.webm',
    url: 'http://localhost:3000',
  });
}
