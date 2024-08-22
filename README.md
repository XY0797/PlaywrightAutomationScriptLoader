# Playwright自动化脚本加载器

## 简介

一个基于`node.js`版`Playwright`的自动化脚本加载器，方便分享自己的脚本给他人使用。

用户下载本项目发行包后，可以像安装插件一样导入`Playwright`自动化脚本，避免配置开发环境。

## 初始化

先安装依赖

```sh
npm install
```

然后下载`chromium`，并且必须是编译了编解码器的版本，否则浏览器无法播放视频！

可以到[https://chromium.woolyss.com/](https://chromium.woolyss.com/)下载，绿底表示稳定版本，含`all-codecs+`的才能播放视频

找到合适版本点击`Archive`即可下载

解压后重命名文件夹为`chromium`，移动到项目根目录，确保有`chromium\chrome.exe`

## 启动

终端里面运行`npm run start`，或`node index.js`，即可启动脚本加载器。

## 发行

初始化后额外下载一个node.js的预编译二进制版本，放到项目目录

然后写一个启动脚本即可

比如Windows下可以写一个`start.bat`脚本作为启动脚本，内容为`.\yourpath\node.exe index.js`即可

最后打包给用户，告知用户通过启动脚本启动即可

## 使用

用户把插件放到`plugins`目录下。启动加载器后，用户可以选择一个插件来运行。

## 插件开发

插件开发需要遵循以下规范：

* `plugins`目录下放置插件，一个插件对应一个目录
* 插件目录下必须有`info.json`保存插件信息（`info.json`是判断文件夹是否为插件文件夹的依据），`info.json`定义插件的`插件名称`、`解释说明`、`作者`、`版本号`信息
* 可选`icon.png`作为插件的图标，如果没有则显示默认图标
* 可选`setting.json`存储插件的设置信息，可选`setting.html`用于插件的设置页面，设置页面先于插件加载，用户设置完成后才会加载插件
* `index.js`作为插件的程序入口，加载插件后执行导出的默认函数

`info.json`格式如下：

```json
{
    "name": "插件名称",
    "description": "插件说明",
    "author": "作者名称",
    "version": "版本号"
}
```

`index.js`必须提供如下格式的入口函数：

```js
/**
 * 主函数，用于执行Playwright自动化脚本
 * @param {import('playwright').Page} page - 创建好的新页面
 * @param {import('playwright').BrowserContext} context - 浏览器上下文对象
 * @param {Object|null} setting - 保存了插件设置信息的对象，如果没有设置文件则为null
 * @param {string} pluginsFolderPath - 插件目录的绝对路径，例如：R:\Playwright自动化脚本加载器\plugins\百度登录插件
 * 注意：插件内代码必须用pluginsFolderPath拼接绝对路径，插件内使用相对路径会错误！
 */
export default async function main(page, context, setting, pluginsFolderPath) {
    // 下面可自由编写业务逻辑
    await page.goto('https://xxxx'); // 跳转网址示例
}
```

如果提供`setting.html`，那么加载器会在加载插件前打开设置页面，用户可以根据设置信息来调整插件的运行参数

通过下面的方法获取之前的旧设置：

```js
// 监听来自插件加载器的消息
window.addEventListener('message', (msg) => {
    if (msg.data?.type === 'initialize') {
        const data = msg.data.data;
        // data即为setting.json文件的内容，为js对象
        // 如果没有setting.json文件，data为null
    }
});
```

通过下面的方法发送新的设置：

```js
// 向插件加载器发送setting json，传入js对象
function sendSetting2Loader(data) {
    console.log(JSON.stringify({ type: 'pluginSetting', data: data }));
}
```

发送新设置后，会关闭设置页面，创建新页面后调用`index.js`的入口函数开始执行插件内容，并传入新的设置对象。如果发送null则会中断插件加载

本项目`plugins`有相关示例可以参考

## 许可证

本程序遵循 [GPL-3.0-only](https://opensource.org/license/gpl-3-0/)许可证。

本程序仅供学习研究使用，严禁用于商业用途！

> 注意：由于GPL协议的强约束性，如果您将本项目的代码用于您的商业项目，会导致您商业项目的所有代码被迫全部以相同协议开源

本项目许可证的具体内容详见项目根目录下的LICENSE文件

您也可访问[GNU的网站](https://www.gnu.org/licenses/)获取更多有关GPL许可证以及自由软件运动的相关信息
