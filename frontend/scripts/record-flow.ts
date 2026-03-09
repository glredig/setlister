import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

export type FlowFn = (page: Page) => Promise<void>;

interface RecordOptions {
  /** Output path for the webm file (relative to project root or absolute) */
  outputPath: string;
  /** URL to navigate to before starting the flow */
  url?: string;
  /** Viewport width (default: 1280) */
  width?: number;
  /** Viewport height (default: 720) */
  height?: number;
}

/**
 * Records a browser interaction flow as a webm video.
 *
 * Usage: Write a flow script that imports this helper, defines interactions,
 * and calls recordFlow(). See docs/recordings/README for examples.
 */
export async function recordFlow(flow: FlowFn, options: RecordOptions): Promise<string> {
  const { outputPath, url = 'http://localhost:3000', width = 1280, height = 720 } = options;

  const resolvedOutput = path.resolve(outputPath);
  const recordingDir = path.dirname(resolvedOutput);
  fs.mkdirSync(recordingDir, { recursive: true });

  // Playwright saves videos to a directory, then we rename to the desired path
  const tempDir = path.join(recordingDir, `.tmp-recording-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  let browser: Browser | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    const context: BrowserContext = await browser.newContext({
      viewport: { width, height },
      recordVideo: { dir: tempDir, size: { width, height } },
    });

    const page: Page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    await flow(page);

    // Close context to finalize the video
    await context.close();

    // Move the recorded video to the desired output path
    const files = fs.readdirSync(tempDir);
    const videoFile = files.find(f => f.endsWith('.webm'));
    if (!videoFile) {
      throw new Error('No video file generated');
    }

    fs.renameSync(path.join(tempDir, videoFile), resolvedOutput);
    fs.rmSync(tempDir, { recursive: true });

    return resolvedOutput;
  } finally {
    if (browser) await browser.close();
  }
}

// CLI runner: execute a flow script directly
// Usage: npx ts-node scripts/record-flow.ts <flow-script.ts>
if (require.main === module) {
  const flowScript = process.argv[2];
  if (!flowScript) {
    console.error('Usage: npx ts-node scripts/record-flow.ts <flow-script.ts>');
    process.exit(1);
  }

  const resolved = path.resolve(flowScript);
  import(resolved).then(mod => {
    if (typeof mod.default !== 'function') {
      console.error('Flow script must export a default function: (recordFlow) => Promise<void>');
      process.exit(1);
    }
    return mod.default(recordFlow);
  }).then(() => {
    console.log('Recording complete.');
  }).catch(err => {
    console.error('Recording failed:', err);
    process.exit(1);
  });
}
