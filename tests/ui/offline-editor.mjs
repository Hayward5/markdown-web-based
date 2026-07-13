import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from 'playwright-core';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.dirname(path.dirname(TEST_DIR));
const LOCAL_TEST_DIR = path.join(ROOT_DIR, '.chrome-ui-test');
const ARTIFACT_DIR = path.join(LOCAL_TEST_DIR, 'artifacts');
const DOWNLOAD_DIR = path.join(LOCAL_TEST_DIR, 'downloads');
const CHROME_PATH = process.env.CHROME_BIN;
const RESULT_FILE = process.env.UI_RESULT_FILE
    ?? path.join(ARTIFACT_DIR, 'results.json');
const APP_URL = pathToFileURL(path.join(ROOT_DIR, 'release', 'markdown-editor.html')).href;

if (!CHROME_PATH) throw new Error('CHROME_BIN is required');

await mkdir(ARTIFACT_DIR, { recursive: true });
await mkdir(DOWNLOAD_DIR, { recursive: true });

const results = [];

function serializeError(error) {
    return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

async function test(name, callback) {
    const startedAt = Date.now();
    try {
        const details = await callback();
        results.push({ name, status: 'PASS', durationMs: Date.now() - startedAt, details });
    } catch (error) {
        results.push({ name, status: 'FAIL', durationMs: Date.now() - startedAt, error: serializeError(error) });
    }
}

async function observe(name, callback) {
    const startedAt = Date.now();
    try {
        const details = await callback();
        results.push({ name, status: 'OBSERVATION', durationMs: Date.now() - startedAt, details });
    } catch (error) {
        results.push({ name, status: 'OBSERVATION_ERROR', durationMs: Date.now() - startedAt, error: serializeError(error) });
    }
}

const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    downloadsPath: DOWNLOAD_DIR,
    env: {
        ...process.env,
        LD_LIBRARY_PATH: process.env.CHROME_LD_LIBRARY_PATH ?? '',
        FONTCONFIG_FILE: process.env.FONTCONFIG_FILE ?? '',
    },
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const browserVersion = browser.version();

const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 1000 },
});

async function openApp({ initScript } = {}) {
    const page = await context.newPage();
    if (initScript) await page.addInitScript(initScript);
    const consoleErrors = [];
    const pageErrors = [];
    const externalRequests = [];

    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
        if (/^https?:\/\//i.test(request.url())) externalRequests.push(request.url());
    });
    await page.route(/^https?:\/\//i, (route) => route.abort('internetdisconnected'));

    await page.goto(APP_URL, { waitUntil: 'load' });
    await page.locator('.milkdown .ProseMirror').waitFor({ state: 'visible', timeout: 20_000 });

    return { page, consoleErrors, pageErrors, externalRequests };
}

async function loadVirtualFile(page, name, content) {
    await page.locator('#file-input').setInputFiles({
        name,
        mimeType: name.endsWith('.md') ? 'text/markdown' : 'text/plain',
        buffer: Buffer.from(content, 'utf8'),
    });
}

await test('Chrome Stable 以 file:// 啟動單檔成品', async () => {
    const { page, consoleErrors, pageErrors, externalRequests } = await openApp();
    assert.equal(await page.title(), 'document.md — Markdown 編輯器');
    assert.equal(await page.locator('.ProseMirror').count(), 1);
    assert.match(await page.locator('.ProseMirror').innerText(), /歡迎使用 Markdown 編輯器/);
    assert.equal(consoleErrors.length, 0, `Console errors: ${consoleErrors.join(' | ')}`);
    assert.equal(pageErrors.length, 0, `Page errors: ${pageErrors.join(' | ')}`);
    assert.equal(externalRequests.length, 0, `External requests: ${externalRequests.join(' | ')}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-startup.png'), fullPage: true });
    const details = { title: await page.title(), externalRequests, consoleErrors, pageErrors };
    await page.close();
    return details;
});

await test('Chrome 可使用 Noto Sans TC 顯示繁中', async () => {
    const { page } = await openApp();
    const fontAvailable = await page.evaluate(() => document.fonts.check('16px "Noto Sans TC"', '繁體中文測試'));
    assert.equal(fontAvailable, true, 'Chrome 無法解析 Noto Sans TC 繁中字型');
    await page.close();
    return { fontAvailable };
});

await test('開啟 UTF-8 Markdown 並切換編輯／預覽', async () => {
    const { page, consoleErrors, pageErrors, externalRequests } = await openApp();
    const markdown = [
        '# 採購測試',
        '',
        '中文段落與 **粗體**。',
        '',
        '| 欄位 | 值 |',
        '| --- | --- |',
        '| 數量 | 3 |',
        '',
        '- [x] 完成',
        '- [ ] 待辦',
    ].join('\n');
    await loadVirtualFile(page, 'procurement.md', markdown);
    await page.waitForFunction(() => document.querySelector('.ProseMirror')?.textContent?.includes('採購測試'));
    await page.locator('#btn-preview-mode').click();
    await page.locator('#preview-content h1').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#preview-content table').count(), 1);
    assert.equal(await page.locator('#preview-content input[type="checkbox"]').count(), 2);
    assert.equal(await page.locator('.editor-container').isVisible(), false);
    assert.equal(await page.locator('.preview-container').isVisible(), true);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-preview.png'), fullPage: true });
    await page.locator('#btn-edit-mode').click();
    assert.equal(await page.locator('.editor-container').isVisible(), true);
    assert.equal(consoleErrors.length, 0, `Console errors: ${consoleErrors.join(' | ')}`);
    assert.equal(pageErrors.length, 0, `Page errors: ${pageErrors.join(' | ')}`);
    assert.equal(externalRequests.length, 0, `External requests: ${externalRequests.join(' | ')}`);
    await page.close();
    return { heading: '採購測試', tableCount: 1, checkboxCount: 2 };
});

await test('預覽表格應有可辨識的格線與儲存格間距', async () => {
    const { page } = await openApp();
    await loadVirtualFile(page, 'table.md', '| 欄位 | 值 |\n| --- | --- |\n| 數量 | 3 |');
    await page.locator('#btn-preview-mode').click();
    const cell = page.locator('#preview-content td').first();
    await cell.waitFor({ state: 'visible' });
    const style = await cell.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
            borderStyle: computed.borderTopStyle,
            borderWidth: computed.borderTopWidth,
            padding: computed.padding,
        };
    });
    assert.notEqual(style.borderStyle, 'none', JSON.stringify(style));
    assert.notEqual(style.borderWidth, '0px', JSON.stringify(style));
    await page.close();
    return style;
});

await test('預覽模式中開啟新檔會即時更新', async () => {
    const { page } = await openApp();
    await page.locator('#btn-preview-mode').click();
    await page.locator('#preview-content h1').waitFor({ state: 'visible' });
    await loadVirtualFile(page, 'replacement.md', '# 預覽中換檔\n\n內容已更新');
    await page.waitForFunction(() => document.querySelector('#preview-content h1')?.textContent === '預覽中換檔');
    assert.match(await page.locator('#preview-content').innerText(), /內容已更新/);
    await page.close();
    return { previewUpdated: true };
});

await test('WYSIWYG 鍵盤輸入會同步到預覽', async () => {
    const { page } = await openApp();
    await loadVirtualFile(page, 'typing.md', '# 輸入測試\n\nAlpha');
    const paragraph = page.locator('.ProseMirror p').last();
    await paragraph.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' 中文XYZ');
    await page.locator('#btn-preview-mode').click();
    await page.waitForFunction(() => document.querySelector('#preview-content')?.textContent?.includes('Alpha 中文XYZ'));
    assert.match(await page.locator('#preview-content').innerText(), /Alpha 中文XYZ/);
    await page.close();
    return { typedText: 'Alpha 中文XYZ' };
});

await test('Slash 命令選單可由鍵盤開啟', async () => {
    const { page } = await openApp();
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('/');
    const slashMenu = page.locator('.milkdown-slash-menu');
    await slashMenu.waitFor({ state: 'visible', timeout: 5_000 });
    assert.match(await slashMenu.innerText(), /Heading 1/);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-slash-menu.png'), fullPage: true });
    await page.close();
    return { menuVisible: true };
});

await test('Ctrl+S 會觸發可讀取的下載檔案', async () => {
    const { page } = await openApp({ initScript: () => {
        Object.defineProperty(window, 'showSaveFilePicker', { value: undefined, configurable: true });
        Object.defineProperty(window, 'showOpenFilePicker', { value: undefined, configurable: true });
    } });
    await loadVirtualFile(page, 'shortcut.md', '# Shortcut save\n\nBody');
    const downloadPromise = page.waitForEvent('download');
    await page.keyboard.press('Control+s');
    const download = await downloadPromise;
    const destination = path.join(DOWNLOAD_DIR, 'shortcut-download.txt');
    await download.saveAs(destination);
    const saved = await readFile(destination, 'utf8');
    assert.match(saved, /Shortcut save/);
    assert.equal(download.suggestedFilename(), 'shortcut.md');
    await page.close();
    return { suggestedFilename: download.suggestedFilename(), savedBytes: Buffer.byteLength(saved) };
});

await test('開啟 .md 後儲存應保留 .md 副檔名', async () => {
    const { page } = await openApp({ initScript: () => {
        window.__writes = [];
        window.showSaveFilePicker = async () => ({
            name: 'notes.md',
            createWritable: async () => ({
                write: async (value) => window.__writes.push(value),
                close: async () => {},
            }),
        });
    } });
    await loadVirtualFile(page, 'notes.md', '# Save me');
    await page.locator('#btn-save').click();
    await page.waitForFunction(() => window.__writes.length === 1);
    const writes = await page.evaluate(() => window.__writes);
    assert.deepEqual(writes, ['# Save me\n']);
    await page.close();
    return { suggestedFilename: 'notes.md', writeCount: writes.length };
});

await test('空白 Markdown 檔應可正常開啟', async () => {
    const { page } = await openApp();
    const dialogPromise = page.waitForEvent('dialog', { timeout: 1_500 })
        .then(async (dialog) => {
            const message = dialog.message();
            await dialog.dismiss();
            return message;
        })
        .catch(() => null);
    await loadVirtualFile(page, 'empty.md', '');
    const dialogMessage = await dialogPromise;
    assert.equal(dialogMessage, null, `空白檔觸發錯誤：${dialogMessage}`);
    assert.equal((await page.locator('.ProseMirror').innerText()).trim(), '');
    await page.close();
    return { opened: true };
});

await test('預覽不得執行 Markdown 內嵌事件處理器', async () => {
    const { page, externalRequests } = await openApp();
    await loadVirtualFile(page, 'security.md', [
        '<img src="missing-ui-test.png" onerror="document.documentElement.dataset.uiXss=\'executed\'">',
        '<iframe src="file:///etc/passwd"></iframe>',
        '[bad](javascript:document.body.dataset.bad=1)',
        '![remote](https://example.invalid/probe.png)',
    ].join('\n'));
    await page.locator('#btn-preview-mode').click();
    await page.waitForFunction(() => document.documentElement.dataset.uiXss === 'executed', null, { timeout: 3_000 }).catch(() => {});
    const executed = await page.evaluate(() => document.documentElement.dataset.uiXss === 'executed');
    assert.equal(executed, false, 'onerror 事件已在預覽頁面執行');
    assert.equal(await page.locator('#preview-content iframe').count(), 0);
    assert.equal(await page.locator('#preview-content a[href^="javascript:"]').count(), 0);
    assert.deepEqual(externalRequests, []);
    await page.close();
    return { executed };
});

await test('預覽不應由文件內容發出外部網路請求', async () => {
    const { page, externalRequests } = await openApp();
    await loadVirtualFile(page, 'network.md', '<img src="https://example.invalid/markdown-editor-probe.png">');
    await page.locator('#btn-preview-mode').click();
    await page.waitForTimeout(500);
    assert.deepEqual(externalRequests, [], `偵測到外部請求：${externalRequests.join(', ')}`);
    await page.close();
    return { externalRequests };
});

await test('普通父清單項目的 marker 不應被巢狀 task item 移除', async () => {
    const { page } = await openApp();
    await loadVirtualFile(page, 'nested-task.md', '- parent\n  - [ ] nested task');
    await page.locator('#btn-preview-mode').click();
    const outerItem = page.locator('#preview-content > ul > li');
    await outerItem.waitFor({ state: 'visible' });
    const markerContent = await outerItem.evaluate((element) => getComputedStyle(element, '::marker').content);
    assert.notEqual(markerContent, 'none', '普通父項目的 marker 被移除');
    assert.notEqual(markerContent, 'normal', '普通父項目的 marker 沒有可見內容');
    await page.close();
    return { markerContent };
});

await observe('file:// 下的 Chrome 檔案 API 能力', async () => {
    const { page } = await openApp();
    const capabilities = await page.evaluate(() => ({
        isSecureContext,
        showOpenFilePicker: 'showOpenFilePicker' in window,
        showSaveFilePicker: 'showSaveFilePicker' in window,
        indexedDB: 'indexedDB' in window,
    }));
    await page.close();
    return capabilities;
});

await test('未儲存內容在換檔前要求確認', async () => {
    const { page } = await openApp();
    await loadVirtualFile(page, 'first.md', '# 第一份');
    const heading = page.locator('.ProseMirror h1');
    await heading.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' 已修改');
    await page.locator('#document-status').getByText('未儲存').waitFor();
    let dialogMessage = null;
    page.once('dialog', async (dialog) => {
        dialogMessage = dialog.message();
        await dialog.dismiss();
    });
    await loadVirtualFile(page, 'second.md', '# 第二份');
    const retainedHeading = await page.locator('.ProseMirror h1').innerText();
    assert.match(dialogMessage, /尚未儲存/);
    assert.equal(retainedHeading, '第一份 已修改');
    await page.close();
    return { dialogMessage, retainedHeading };
});

await test('未儲存草稿在重新載入後可復原', async () => {
    const { page } = await openApp();
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type(' 草稿復原測試');
    await page.waitForTimeout(700);
    let restored = false;
    page.on('dialog', async (dialog) => {
        if (/未儲存草稿/.test(dialog.message())) restored = true;
        await dialog.accept();
    });
    await page.reload({ waitUntil: 'load' });
    await page.locator('.ProseMirror').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('.ProseMirror')?.textContent?.includes('草稿復原測試'));
    assert.equal(restored, true);
    await page.close();
    return { restored: true };
});

await test('窄螢幕不應產生水平捲動', async () => {
    const { page } = await openApp();
    await page.setViewportSize({ width: 375, height: 800 });
    const layout = await page.evaluate(() => ({
        viewportWidth: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        toolbarWidth: document.querySelector('.toolbar')?.scrollWidth,
    }));
    assert.ok(layout.documentWidth <= layout.viewportWidth, JSON.stringify(layout));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-mobile.png'), fullPage: true });
    await page.close();
    return layout;
});

await browser.close();

const summary = {
    chromeVersion: browserVersion,
    appUrl: APP_URL,
    generatedAt: new Date().toISOString(),
    counts: {
        pass: results.filter((result) => result.status === 'PASS').length,
        fail: results.filter((result) => result.status === 'FAIL').length,
        observation: results.filter((result) => result.status === 'OBSERVATION').length,
        observationError: results.filter((result) => result.status === 'OBSERVATION_ERROR').length,
    },
    results,
};

await writeFile(RESULT_FILE, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

for (const result of results) {
    const suffix = result.error ?? JSON.stringify(result.details ?? {});
    console.log(`${result.status.padEnd(17)} ${result.name} :: ${suffix}`);
}
console.log(`SUMMARY ${JSON.stringify(summary.counts)}`);

if (summary.counts.fail > 0 || summary.counts.observationError > 0) {
    process.exitCode = 1;
}
