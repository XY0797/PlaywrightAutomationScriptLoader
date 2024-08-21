import { chromium } from 'playwright';
import path from 'path';

/**
 * 启动浏览器并显示插件列表界面
 * 
 * @returns {Object} 返回一个对象，包含以下属性：
 * - browser: {Browser} 启动的浏览器实例
 * - context: {BrowserContext} 加载器网页的上下文
 * - page: {Page} 加载器网页的页面
 */
export async function startBrowser() {
    // 启动浏览器
    const browser = await chromium.launch({
        executablePath: './chromium/chrome.exe',
        headless: false
    });
    // 创建上下文
    const context = await browser.newContext();
    // 创建第一个页面
    const page = await context.newPage();

    // 显示插件列表界面
    const pluginListHtmlPath = 'file://' + path.resolve('./views/index.html').replace(/\\/g, '/');
    await page.goto(pluginListHtmlPath);

    return { browser, context, page };
}