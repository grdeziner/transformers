import sys, asyncio
from playwright.async_api import async_playwright
URL = "http://localhost:8787/index.html"
OUT = "/workspace/transformers-site/screenshots"
async def shot(p, name, w, h, mobile=False):
    b = await p.chromium.launch(channel="chrome", args=["--no-sandbox"])
    pg = await b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1, is_mobile=mobile, has_touch=mobile)
    await pg.goto(URL, wait_until="networkidle")
    await pg.evaluate("document.fonts.ready")
    # reveal the decoded tech specs + comparison so the static shot shows the finished state
    await pg.evaluate("""() => { document.querySelectorAll('.decoder-btn').forEach(b=>b.click());
      document.querySelector('.vs-table')?.classList.add('in-view');
      document.querySelector('.marquee__track').style.animation='none'; }""")
    await pg.wait_for_timeout(1600)
    await pg.screenshot(path=f"{OUT}/{name}-full.png", full_page=True)
    await pg.screenshot(path=f"{OUT}/{name}-fold.png")
    # mid-transform frame
    await pg.evaluate("document.querySelector('#optimus .btn--transform').scrollIntoView({block:'center'})")
    await pg.wait_for_timeout(300)
    await pg.click("#optimus .btn--transform")
    await pg.wait_for_timeout(430)
    el = await pg.query_selector("#optimus .stage")
    await el.screenshot(path=f"{OUT}/{name}-transform-mid.png", animations="allow")
    await b.close()
async def main():
    async with async_playwright() as p:
        await shot(p, "desktop-1440", 1440, 900)
        await shot(p, "mobile-390", 390, 844, mobile=True)
asyncio.run(main())
