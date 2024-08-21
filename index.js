import { startBrowser } from './src/starter.js';
import { scanPlugins } from './src/pluginsScanner.js';
import fs from 'fs/promises';

// 发送消息给页面
async function sendMessage2Page(page, type, data) {
  const msgObject = { type, ...data };
  await page.evaluate((msg) => {
    window.postMessage(msg, '*');
  }, msgObject);
}

// 加载插件
async function loadPlugin(pluginName, pluginFolderName, pluginSettingHtmlFileURL, browser, indexcontext, indexpage) {
  // js对象形式的插件设置数据
  let settingData = null;

  // 处理插件自定义的设置页面
  if (pluginSettingHtmlFileURL) {
    console.log(`等待用户设置插件 ${pluginName}`);

    // 在加载器的上下文打开插件设置对话框
    const newPagePromise = indexcontext.waitForEvent('page');
    await indexpage.evaluate(() => {
      window.open('about:blank', '_blank', 'left=200,top=200');
    });
    const popup = await newPagePromise;

    // 设置加载设置页面
    await popup.goto(pluginSettingHtmlFileURL);

    // 发送原本的设置数据
    let settingDataStr = null; // json字符串版本
    try {
      // 读取文件内容并且解析为对象
      settingDataStr = await fs.readFile(`./plugins/${pluginFolderName}/setting.json`, 'utf-8');
      settingData = JSON.parse(settingDataStr);
    } catch (e) {
      // 忽略错误
    }
    await sendMessage2Page(popup, 'initialize', { data: settingData });

    // 是否取消加载插件
    let isCancel = false

    // 监听来自设置页面的消息
    popup.on('console', async logstr => {
      let data = null
      let hasData = false
      try {
        const msgObj = JSON.parse(logstr.text());
        if (msgObj?.type === 'pluginSetting') {
          data = msgObj.data;
          hasData = true;
        }
      } catch (e) {
        // 忽略非json输出
      }
      if (hasData) {
        if (data) {
          const newSettingStrJSON = JSON.stringify(data);
          // 保存设置到json文件
          if (settingDataStr !== newSettingStrJSON) {
            // 不相等才保存
            await fs.writeFile(`./plugins/${pluginFolderName}/setting.json`, newSettingStrJSON, 'utf-8');
            console.log(`更新了插件 ${pluginName} 的设置`);
            settingData = data;
          }
          // 设置完成，放出关闭页面信号
          await popup.evaluate(() => {
            document.body.innerHTML = '<h1 id="SettingOK">正在设置中...</h1>';
          });
        } else {
          // 取消插件加载
          isCancel = true;
          await popup.evaluate(() => {
            document.body.innerHTML = '<h1 id="SettingOK">正在取消...</h1>';
          });
        }
      }
    });
    // 等待用户设置完成，不限制时间
    await popup.waitForSelector('#SettingOK', { timeout: 0 });
    popup.close(); // 关闭对话框
    if (isCancel) {
      // 取消加载插件
      console.log(`用户取消加载插件 ${pluginName}`);
      return;
    }
  }

  // 正式加载插件
  console.log(`加载插件 ${pluginName}`);

  // 创建上下文
  const context = await browser.newContext();

  // 创建新页面
  const page = await context.newPage();

  // 根据插件名称动态导入插件
  const plugin = await import(`./plugins/${pluginFolderName}/index.js`);

  // 调用插件中的 main 函数
  await plugin.default(page, context, settingData);

  // 插件结束运行
  console.log(`插件结束运行 ${pluginName}`);
}

(async () => {
  // 启动浏览器
  const { browser, context, page } = await startBrowser();

  // 发送插件列表
  sendMessage2Page(page, 'initialize', { plugins: await scanPlugins('./plugins') });

  // 监听来自 GUI 的消息
  page.on('console', async message => {
    // 保证一定是JSON格式的消息
    const data = JSON.parse(message.text());
    if (data?.type === 'loadPlugin') {
      await loadPlugin(data.name, data.folderName, data.settingHtmlFileURL, browser, context, page);
    }
  });

  // 等待GUI告知关闭
  await page.waitForSelector('#NowExit', { timeout: 0 });

  // 关闭浏览器
  await browser.close();
})();
