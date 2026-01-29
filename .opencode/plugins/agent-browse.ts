import { tool, type Plugin } from "@opencode-ai/plugin";
import { Stagehand } from "@browserbasehq/stagehand";
import { spawn, type ChildProcess } from "child_process";
import { cpSync, existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { platform } from "os";
import sharp from "sharp";
import { z } from "zod";

type ExtractSchema = Record<string, "string" | "number" | "boolean">;

let stagehandInstance: Stagehand | null = null;
let chromeProcess: ChildProcess | null = null;
let weStartedChrome = false;

const CDP_PORT = 9222;

function getStorageRoot(worktree?: string, directory?: string) {
  return join(worktree ?? directory ?? process.cwd(), ".opencode");
}

function getAnthropicApiKey(): string {
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  throw new Error("ANTHROPIC_API_KEY is not set. Export it in your shell or add it to your environment.");
}

function findLocalChrome(): string | undefined {
  const systemPlatform = platform();
  const chromePaths: string[] = [];

  if (systemPlatform === "darwin") {
    chromePaths.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      `${process.env.HOME}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
      `${process.env.HOME}/Applications/Chromium.app/Contents/MacOS/Chromium`
    );
  } else if (systemPlatform === "win32") {
    chromePaths.push(
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
      "C:\\Program Files\\Chromium\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe"
    );
  } else {
    chromePaths.push(
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/snap/bin/chromium",
      "/usr/local/bin/google-chrome",
      "/usr/local/bin/chromium",
      "/opt/google/chrome/chrome",
      "/opt/google/chrome/google-chrome"
    );
  }

  for (const candidate of chromePaths) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function getChromeUserDataDir(): string | undefined {
  const systemPlatform = platform();

  if (systemPlatform === "darwin") {
    return `${process.env.HOME}/Library/Application Support/Google/Chrome`;
  }

  if (systemPlatform === "win32") {
    return `${process.env.LOCALAPPDATA}\\Google\\Chrome\\User Data`;
  }

  return `${process.env.HOME}/.config/google-chrome`;
}

function prepareChromeProfile(storageRoot: string) {
  const sourceUserDataDir = getChromeUserDataDir();
  const tempUserDataDir = join(storageRoot, ".chrome-profile");

  if (existsSync(tempUserDataDir)) {
    return;
  }

  mkdirSync(tempUserDataDir, { recursive: true });

  if (!sourceUserDataDir) {
    return;
  }

  const sourceDefaultProfile = join(sourceUserDataDir, "Default");
  const destDefaultProfile = join(tempUserDataDir, "Default");

  if (existsSync(sourceDefaultProfile)) {
    cpSync(sourceDefaultProfile, destDefaultProfile, { recursive: true });
  }
}

async function getCdpUrl(): Promise<string> {
  const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
  if (!response.ok) {
    throw new Error("Chrome CDP endpoint not available");
  }
  const versionData = (await response.json()) as { webSocketDebuggerUrl: string };
  return versionData.webSocketDebuggerUrl;
}

async function initBrowser(storageRoot: string) {
  if (stagehandInstance) {
    return stagehandInstance;
  }

  getAnthropicApiKey();
  prepareChromeProfile(storageRoot);

  const chromePath = findLocalChrome();
  if (!chromePath) {
    throw new Error("Chrome not found. Install Chrome to use the browser tool.");
  }

  const tempUserDataDir = join(storageRoot, ".chrome-profile");
  const pidFilePath = join(storageRoot, ".chrome-pid");

  let chromeReady = false;
  try {
    const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
    chromeReady = response.ok;
  } catch {
    chromeReady = false;
  }

  if (!chromeReady) {
    chromeProcess = spawn(
      chromePath,
      [
        `--remote-debugging-port=${CDP_PORT}`,
        `--user-data-dir=${tempUserDataDir}`,
        "--window-position=-9999,-9999",
        "--window-size=1250,900"
      ],
      {
        stdio: "ignore",
        detached: false
      }
    );

    if (chromeProcess.pid) {
      writeFileSync(pidFilePath, JSON.stringify({ pid: chromeProcess.pid, startTime: Date.now() }));
    }

    for (let i = 0; i < 50; i += 1) {
      try {
        const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        if (response.ok) {
          chromeReady = true;
          weStartedChrome = true;
          break;
        }
      } catch {
        // wait
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    if (!chromeReady) {
      throw new Error("Chrome failed to start");
    }
  }

  const cdpUrl = await getCdpUrl();
  stagehandInstance = new Stagehand({
    env: "LOCAL",
    verbose: 0,
    model: "anthropic/claude-3-5-sonnet-20241022",
    localBrowserLaunchOptions: {
      cdpUrl
    }
  });

  await stagehandInstance.init();
  return stagehandInstance;
}

async function takeScreenshot(stagehand: Stagehand, storageRoot: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const screenshotDir = join(storageRoot, "agent", "browser_screenshots");
  const screenshotPath = join(screenshotDir, `screenshot-${timestamp}.png`);

  if (!existsSync(screenshotDir)) {
    mkdirSync(screenshotDir, { recursive: true });
  }

  const page = stagehand.context.pages()[0];
  const screenshotResult = await page.screenshot({ type: "png" });

  const image = sharp(screenshotResult);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  let finalBuffer = screenshotResult;
  if (width && height && (width > 2000 || height > 2000)) {
    finalBuffer = await sharp(screenshotResult)
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  }

  writeFileSync(screenshotPath, finalBuffer);
  return screenshotPath;
}

async function closeBrowser(storageRoot: string) {
  const pidFilePath = join(storageRoot, ".chrome-pid");

  if (stagehandInstance) {
    try {
      await stagehandInstance.close();
    } catch {
      // ignore
    }
    stagehandInstance = null;
  }

  if (chromeProcess && weStartedChrome) {
    try {
      chromeProcess.kill("SIGTERM");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (chromeProcess.exitCode === null) {
        chromeProcess.kill("SIGKILL");
      }
    } catch {
      // ignore
    }
    chromeProcess = null;
    weStartedChrome = false;
  }

  if (existsSync(pidFilePath)) {
    try {
      unlinkSync(pidFilePath);
    } catch {
      // ignore
    }
  }
}

async function extractWithSchema(stagehand: Stagehand, instruction: string, schema?: ExtractSchema) {
  if (!schema) {
    return stagehand.extract({ instruction });
  }

  const zodSchema: Record<string, z.ZodTypeAny> = {};
  for (const [key, type] of Object.entries(schema)) {
    if (type === "string") {
      zodSchema[key] = z.string();
    } else if (type === "number") {
      zodSchema[key] = z.number();
    } else if (type === "boolean") {
      zodSchema[key] = z.boolean();
    }
  }

  if (Object.keys(zodSchema).length === 0) {
    return stagehand.extract({ instruction });
  }

  return stagehand.extract({ instruction, schema: z.object(zodSchema) });
}

export const AgentBrowsePlugin: Plugin = async ({ worktree, directory }) => {
  const storageRoot = getStorageRoot(worktree, directory);

  return {
    tool: {
      browser: tool({
        description: "Control a real Chrome browser using natural language.",
        args: {
          action: tool.schema.enum(["navigate", "act", "extract", "observe", "screenshot", "close"]),
          url: tool.schema.string().optional(),
          instruction: tool.schema.string().optional(),
          query: tool.schema.string().optional(),
          schemaJson: tool.schema.string().optional()
        },
        async execute({ action, url, instruction, query, schemaJson }) {
          const stagehand = action === "close" ? null : await initBrowser(storageRoot);

          if (action === "close") {
            await closeBrowser(storageRoot);
            return { success: true, message: "Browser closed." };
          }

          if (!stagehand) {
            return { success: false, error: "Browser not initialized." };
          }

          if (action === "navigate") {
            if (!url) {
              return { success: false, error: "Missing url for navigate action." };
            }
            await stagehand.context.pages()[0].goto(url);
            const screenshot = await takeScreenshot(stagehand, storageRoot);
            return { success: true, message: `Navigated to ${url}.`, screenshot };
          }

          if (action === "act") {
            if (!instruction) {
              return { success: false, error: "Missing instruction for act action." };
            }
            await stagehand.act(instruction);
            const screenshot = await takeScreenshot(stagehand, storageRoot);
            return { success: true, message: `Action completed: ${instruction}.`, screenshot };
          }

          if (action === "extract") {
            if (!instruction) {
              return { success: false, error: "Missing instruction for extract action." };
            }
            const schema = schemaJson ? (JSON.parse(schemaJson) as ExtractSchema) : undefined;
            const result = await extractWithSchema(stagehand, instruction, schema);
            const screenshot = await takeScreenshot(stagehand, storageRoot);
            return { success: true, data: result, screenshot };
          }

          if (action === "observe") {
            if (!query) {
              return { success: false, error: "Missing query for observe action." };
            }
            const actions = await stagehand.observe(query);
            const screenshot = await takeScreenshot(stagehand, storageRoot);
            return { success: true, data: actions, screenshot };
          }

          if (action === "screenshot") {
            const screenshot = await takeScreenshot(stagehand, storageRoot);
            return { success: true, screenshot };
          }

          return { success: false, error: "Unknown action." };
        }
      })
    }
  };
};

export default AgentBrowsePlugin;
