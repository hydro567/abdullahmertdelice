# Siteyi yerelde Chrome ile acip ekran goruntusu alir (WebGL icin SwiftShader).
# Once repo kokunde:  python3 -m http.server 8000
# Sonra:              python3 tools/test_site.py
import asyncio, os
from playwright.async_api import async_playwright
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 1600, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8000/index.html'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path='shot_kapali.png')
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(9000)
        await pg.screenshot(path='shot_acik.png')
        await pg.goto('http://localhost:8000/hakkimda.html'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='shot_hakkimda.png')
        print('Hatalar:', errs or 'yok')
        await b.close()
asyncio.run(main())
