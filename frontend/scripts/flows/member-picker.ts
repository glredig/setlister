import { recordFlow, FlowFn } from '../record-flow';

const flow: FlowFn = async (page) => {
  // Dashboard loads with member picker in top bar
  await page.waitForSelector('[aria-label="Select member"]');
  await page.waitForTimeout(500);

  // Select Mike from the dropdown
  await page.selectOption('[aria-label="Select member"]', { label: 'Mike' });
  await page.waitForTimeout(500);

  // Switch to Sarah
  await page.selectOption('[aria-label="Select member"]', { label: 'Sarah' });
  await page.waitForTimeout(500);

  // Clear selection
  await page.selectOption('[aria-label="Select member"]', { value: '0' });
  await page.waitForTimeout(500);

  // Select Mike again before navigating to editor
  await page.selectOption('[aria-label="Select member"]', { label: 'Mike' });
  await page.waitForTimeout(300);

  // Navigate to editor — member picker stays visible
  await page.click('a[href*="/edit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
};

export default async function run(record: typeof recordFlow) {
  await record(flow, {
    outputPath: '../docs/recordings/member-picker.webm',
    url: 'http://localhost:3000',
  });
}
