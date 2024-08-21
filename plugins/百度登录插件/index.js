export default async function main(page, context, setting) {
    await page.goto('https://www.baidu.com/');
    await page.getByRole('link', { name: '登录' }).click();
    await page.getByPlaceholder('手机号/用户名/邮箱').click();
    await page.getByPlaceholder('手机号/用户名/邮箱').fill(setting.username);
    await page.getByPlaceholder('密码').click();
    await page.getByPlaceholder('密码').fill('456');
    await page.getByRole('checkbox', { name: '阅读并接受' }).check(setting.password);
}