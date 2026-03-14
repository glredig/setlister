import { recordFlow, FlowFn } from '../record-flow';

const flow: FlowFn = async (page) => {
  // Select a member first
  await page.waitForSelector('[aria-label="Select member"]');
  await page.selectOption('[aria-label="Select member"]', { label: 'Mike' });
  await page.waitForTimeout(300);

  // Navigate to editor
  await page.click('a[href*="/edit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Expand first song
  const firstCard = page.locator('[role="button"][aria-expanded]').first();
  await firstCard.click();
  await page.waitForTimeout(500);

  // Scroll to My Notes textarea
  const myNotes = page.locator('[aria-label="My Notes"]');
  await myNotes.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Type a personal note — autosave should trigger
  await myNotes.click();
  await myNotes.fill('Remember to switch to capo 3 on this one');
  await page.waitForTimeout(1500); // Wait for debounce + save

  // Switch to Sarah to show notes change per member
  await page.selectOption('[aria-label="Select member"]', { label: 'Sarah' });
  await page.waitForTimeout(800);

  // My Notes should now be empty (Sarah has no note for this song)
  await myNotes.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Type Sarah's note
  await myNotes.click();
  await myNotes.fill('Harmonize on the chorus');
  await page.waitForTimeout(1500);

  // Switch back to Mike to verify his note persisted
  await page.selectOption('[aria-label="Select member"]', { label: 'Mike' });
  await page.waitForTimeout(800);
};

export default async function run(record: typeof recordFlow) {
  await record(flow, {
    outputPath: '../docs/recordings/editor-member-notes.webm',
    url: 'http://localhost:3000',
  });
}
