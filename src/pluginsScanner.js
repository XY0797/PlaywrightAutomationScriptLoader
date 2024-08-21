import fs from 'fs/promises';
import path from 'path';

/**
 * 异步扫描插件目录，返回插件信息数组
 * @param {string} pluginsDir - 插件目录路径
 * @returns {Promise<Array>} - 插件信息数组
 */
export async function scanPlugins(pluginsDir) {
    pluginsDir = path.resolve(pluginsDir);
    const pluginDefaultIcon = 'file://' + path.resolve('./images/pluginDefaultIcon.png').replace(/\\/g, '/');

    const plugins = [];

    // 读取插件目录下的所有文件夹
    const folders = await fs.readdir(pluginsDir, { withFileTypes: true });

    const pluginFolders = folders.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

    for (const folderName of pluginFolders) {
        const pluginPath = path.join(pluginsDir, folderName);
        const infoJsonPath = path.join(pluginPath, 'info.json');
        const indexJsPath = path.join(pluginPath, 'index.js');
        const iconPngPath = path.join(pluginPath, 'icon.png');
        const settingHtmlPath = path.join(pluginPath, 'setting.html');

        try {
            // 检查info.json和index.js是否存在
            await fs.access(infoJsonPath);
            await fs.access(indexJsPath);

            // 读取info.json
            const infoJson = JSON.parse(await fs.readFile(infoJsonPath, 'utf-8'));

            // 判断icon.png和setting.html是否存在
            let iconFileURL = null;
            try {
                await fs.access(iconPngPath);
                iconFileURL = `file://${iconPngPath.replace(/\\/g, '/')}`;
            } catch (error) {
                // icon.png不存在，保持为null
            }
            let settingHtmlFileURL = null;
            try {
                await fs.access(settingHtmlPath);
                settingHtmlFileURL = `file://${settingHtmlPath.replace(/\\/g, '/')}`;
            } catch (error) {
                // setting.html不存在，保持为null
            }

            // 压入列表
            plugins.push({
                folderName,
                iconFileURL: (iconFileURL || pluginDefaultIcon),
                settingHtmlFileURL,
                ...infoJson
            });
        } catch (error) {
            // info.json不存在或读取失败，跳过此文件夹
            console.warn(`检测到无效的插件：${folderName}`);
        }
    }

    return plugins;
}
