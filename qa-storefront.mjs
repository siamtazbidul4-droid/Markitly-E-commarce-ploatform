export default async function run(page) {
  const results = {};
  const errors = [];
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + String(err).slice(0, 200)));

  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(4000);
  results.homeTitle = await page.title();

  await page.goto('http://localhost:3000/shop');
  await page.waitForTimeout(4000);
  const card = page.locator('.group.relative.cursor-pointer').first();
  results.cardsOnShop = await page.locator('.group.relative.cursor-pointer').count();
  await card.click();
  await page.waitForTimeout(3500);
  results.detailUrl = page.url();
  results.detailH1 = (await page.locator('h1').first().textContent())?.slice(0, 50);

  const addBtn = page.getByRole('button', { name: /add to cart/i }).first();
  results.addBtnCount = await addBtn.count();
  if ((await addBtn.count()) > 0) {
    await addBtn.click();
    await page.waitForTimeout(1800);
  }

  await page.goto('http://localhost:3000/cart');
  await page.waitForTimeout(3000);
  results.cartUrl = page.url();
  results.cartHasItem = (await page.locator('img').count()) > 0;

  await page.goto('http://localhost:3000/checkout');
  await page.waitForTimeout(3000);
  results.checkoutLoaded = (await page.locator('h1').count()) > 0;

  const pages = ['/', '/shop', '/cart', '/checkout'];
  results.overflow = {};
  for (const [w, h, name] of [[390, 844, 'm390'], [768, 1024, 't768'], [1920, 1080, 'd1920']]) {
    await page.setViewportSize({ width: w, height: h });
    for (const p of pages) {
      await page.goto('http://localhost:3000' + p);
      await page.waitForTimeout(2500);
      const has = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      if (has) results.overflow[`${name}${p}`] = true;
    }
  }
  results.pageErrors = errors.slice(0, 6);
  return results;
}
