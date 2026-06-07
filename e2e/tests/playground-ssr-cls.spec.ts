import { expect, test, type Browser, type Page } from '@playwright/test';

type PlaygroundState = Record<string, unknown>;

type SsrClsCase = {
  name: string;
  state: PlaygroundState;
  expectedFirstImage: string;
  expectedSsrText?: string;
  skipGeometry?: boolean;
  expectPeekPadding?: boolean;
  expectedPeekEdgesMode?: 'absolute' | 'relative';
};

type RectSnapshot = Record<
  string,
  {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null
>;

const CASES: SsrClsCase[] = [
  {
    name: 'basic image slides',
    state: {
      slideCount: 10,
      spaceBetween: 12,
      paginationMode: 'dot',
      imageSeed: 'ssr-basic',
    },
    expectedFirstImage:
      'https://picsum.photos/seed/carousel-ssr-basic-0-300x200/300/200',
  },
  {
    name: 'peek edges absolute',
    state: {
      slideCount: 10,
      spaceBetween: 12,
      peekEdgesMode: 'absolute',
      peekEdgesAbsolute: 50,
      paginationMode: 'dot',
      imageSeed: 'ssr-peek-absolute',
    },
    expectedFirstImage:
      'https://picsum.photos/seed/carousel-ssr-peek-absolute-0-300x200/300/200',
    expectPeekPadding: true,
    expectedPeekEdgesMode: 'absolute',
  },
  {
    name: 'peek edges relative',
    state: {
      slideCount: 10,
      slidesPerView: 3,
      spaceBetween: 12,
      peekEdgesMode: 'relative',
      peekEdgesRelative: 0.2,
      paginationMode: 'dot',
      imageSeed: 'ssr-peek-relative',
    },
    expectedFirstImage:
      'https://picsum.photos/seed/carousel-ssr-peek-relative-0-300x200/300/200',
    expectPeekPadding: true,
    expectedPeekEdgesMode: 'relative',
  },
  {
    name: 'didactic peek edges',
    state: {
      slideCount: 10,
      spaceBetween: 12,
      peekEdgesMode: 'absolute',
      peekEdgesAbsolute: 50,
      alwaysShowControls: true,
      navInlineOffset: 16,
      navBlockOffset: -8,
      paginationMode: 'dot',
      visualDebug: true,
      imageSeed: 'ssr-peek',
    },
    expectedFirstImage:
      'https://picsum.photos/seed/carousel-ssr-peek-0-300x200/300/200',
  },
  {
    name: 'margin end fractional slides',
    state: {
      slideCount: 12,
      slidesPerView: 3.5,
      marginEnd: 180,
      paginationMode: 'dot',
      imageSeed: 'ssr-margin-end',
    },
    expectedFirstImage:
      'https://picsum.photos/seed/carousel-ssr-margin-end-0-300x200/300/200',
  },
  {
    name: 'external pagination',
    state: {
      slideCount: 10,
      slidesPerView: 3,
      spaceBetween: 12,
      paginationMode: 'dynamic_dot',
      paginationExternal: true,
      imageSeed: 'ssr-external-pagination',
    },
    expectedFirstImage:
      'https://picsum.photos/seed/carousel-ssr-external-pagination-0-300x200/300/200',
    expectedSsrText: 'External pagination',
    skipGeometry: true,
  },
  {
    name: 'projected content',
    state: {
      slideCount: 12,
      slidesPerView: 3,
      spaceBetween: 12,
      contentMode: 'projected',
      paginationMode: 'dot',
      imageSeed: 'ssr-projected',
    },
    expectedFirstImage:
      'https://picsum.photos/seed/carousel-ssr-projected-0-260x180/260/180',
    expectedSsrText: 'Go to slide 10',
  },
  {
    name: 'loop virtual',
    state: {
      slideCount: 30,
      slidesPerView: 3.5,
      loop: true,
      virtual: true,
      imageSeed: 'ssr-loop-virtual',
    },
    expectedFirstImage:
      'https://picsum.photos/seed/carousel-ssr-loop-virtual-0-300x200/300/200',
  },
];

const CAROUSEL_GEOMETRY_CASES = CASES.filter(
  (c) => c.state['visualDebug'] !== true && !c.skipGeometry,
);

const SSR_ORIGIN =
  process.env['SSR_ORIGIN'] ??
  `http://127.0.0.1:${process.env['SSR_PORT'] ?? '4010'}`;

function encodeState(state: PlaygroundState) {
  return Buffer.from(JSON.stringify(state), 'utf-8').toString('base64');
}

function playgroundUrl(state: PlaygroundState) {
  return `/?s=${encodeURIComponent(encodeState(state))}`;
}

async function waitForHydratedCarousel(page: Page) {
  await page.locator('.carousel').first().waitFor();
  await page
    .locator('.carousel.layout-ready')
    .first()
    .waitFor({ timeout: 10_000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(800);
}

async function countDidacticEvent(page: Page, name: string) {
  return page
    .locator('.pg-didactic-events article')
    .filter({ has: page.locator('b', { hasText: name }) })
    .count();
}

async function openCarouselSnapshot(
  browser: Browser,
  state: PlaygroundState,
  javaScriptEnabled: boolean,
  includeSlidesGeometry = false,
): Promise<RectSnapshot> {
  const context = await browser.newContext({
    javaScriptEnabled,
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  await page.goto(`${SSR_ORIGIN}${playgroundUrl(state)}`, {
    waitUntil: 'domcontentloaded',
  });

  if (javaScriptEnabled) {
    await waitForHydratedCarousel(page);
  } else {
    await page.locator('.carousel').first().waitFor();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(300);
  }

  const snapshot = await page.evaluate((includeSlidesGeometry) => {
    const selectors = {
      host: '.pg-carousel-host',
      carousel: '.carousel',
      wrapper: '.slides-wrapper',
      pagination: '.carousel__pagination',
      ...(includeSlidesGeometry
        ? {
            slides: '.slides',
            firstSlide: '[data-testid="slide-0"]',
            rightControl: '.control-right',
          }
        : {}),
    };

    return Object.fromEntries(
      Object.entries(selectors).map(([key, selector]) => {
        const el = document.querySelector(selector);
        if (!el) return [key, null];
        const rect = el.getBoundingClientRect();
        return [
          key,
          {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        ];
      }),
    );
  }, includeSlidesGeometry);

  await context.close();
  return snapshot;
}

function expectRectSnapshotsToMatch(
  noJs: RectSnapshot,
  hydrated: RectSnapshot,
) {
  for (const key of Object.keys(noJs)) {
    expect(hydrated[key], `${key} should exist after hydration`).toBeTruthy();
    expect(noJs[key], `${key} should exist in no-JS SSR`).toBeTruthy();

    for (const prop of ['x', 'y', 'width', 'height'] as const) {
      expect(
        Math.abs(hydrated[key]![prop] - noJs[key]![prop]),
        `${key}.${prop}: no-JS=${JSON.stringify(noJs[key])}, hydrated=${JSON.stringify(hydrated[key])}`,
      ).toBeLessThanOrEqual(2);
    }
  }
}

async function openPeekEdgesModeSnapshot(
  browser: Browser,
  state: PlaygroundState,
  javaScriptEnabled: boolean,
) {
  const context = await browser.newContext({
    javaScriptEnabled,
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  await page.goto(`${SSR_ORIGIN}${playgroundUrl(state)}`, {
    waitUntil: 'domcontentloaded',
  });

  if (javaScriptEnabled) {
    await waitForHydratedCarousel(page);
  } else {
    await page.locator('.carousel').first().waitFor();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(300);
  }

  const value = await page.evaluate(() => {
    const select = Array.from(document.querySelectorAll('select')).find((el) =>
      Array.from(el.options).some((option) => option.value === 'absolute'),
    );
    return select?.value;
  });

  await context.close();
  return value;
}

async function openPeekPaddingSnapshot(
  browser: Browser,
  state: PlaygroundState,
  javaScriptEnabled: boolean,
) {
  const context = await browser.newContext({
    javaScriptEnabled,
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  await page.goto(`${SSR_ORIGIN}${playgroundUrl(state)}`, {
    waitUntil: 'domcontentloaded',
  });

  if (javaScriptEnabled) {
    await waitForHydratedCarousel(page);
  } else {
    await page.locator('.carousel').first().waitFor();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(300);
  }

  const snapshot = await page.locator('.carousel').first().evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      paddingLeft: Number.parseFloat(style.paddingLeft) || 0,
      paddingRight: Number.parseFloat(style.paddingRight) || 0,
      paddingTop: Number.parseFloat(style.paddingTop) || 0,
      paddingBottom: Number.parseFloat(style.paddingBottom) || 0,
    };
  });

  await context.close();
  return snapshot;
}

function expectPeekPaddingToMatch(
  noJs: Awaited<ReturnType<typeof openPeekPaddingSnapshot>>,
  hydrated: Awaited<ReturnType<typeof openPeekPaddingSnapshot>>,
) {
  const noJsMainPadding = Math.max(
    noJs.paddingLeft,
    noJs.paddingRight,
    noJs.paddingTop,
    noJs.paddingBottom,
  );
  const hydratedMainPadding = Math.max(
    hydrated.paddingLeft,
    hydrated.paddingRight,
    hydrated.paddingTop,
    hydrated.paddingBottom,
  );

  expect(noJsMainPadding, `no-JS peek padding: ${JSON.stringify(noJs)}`).toBeGreaterThan(0);
  expect(
    Math.abs(hydratedMainPadding - noJsMainPadding),
    `peek padding changed: no-JS=${JSON.stringify(noJs)}, hydrated=${JSON.stringify(hydrated)}`,
  ).toBeLessThanOrEqual(2);
}

test.describe('playground SSR hydration stability', () => {
  for (const c of CASES) {
    test(`${c.name}: SSR uses query state before hydration`, async ({
      request,
    }) => {
      const response = await request.get(playgroundUrl(c.state));
      expect(response.ok()).toBe(true);

      const html = await response.text();
      expect(html).toContain(c.expectedFirstImage);
      if (c.expectedSsrText) {
        expect(html).toContain(c.expectedSsrText);
      }
      expect(html).not.toContain('cacheBust=');
    });

    if (CAROUSEL_GEOMETRY_CASES.includes(c)) {
      test(`${c.name}: keeps carousel geometry stable between no-JS SSR and hydrated CSR`, async ({
        browser,
      }) => {
        const noJs = await openCarouselSnapshot(
          browser,
          c.state,
          false,
          c.expectPeekPadding,
        );
        const hydrated = await openCarouselSnapshot(
          browser,
          c.state,
          true,
          c.expectPeekPadding,
        );

        expectRectSnapshotsToMatch(noJs, hydrated);
      });
    }

    if (c.expectPeekPadding) {
      test(`${c.name}: keeps peek padding stable between no-JS SSR and hydrated CSR`, async ({
        browser,
      }) => {
        const noJs = await openPeekPaddingSnapshot(browser, c.state, false);
        const hydrated = await openPeekPaddingSnapshot(browser, c.state, true);

        expectPeekPaddingToMatch(noJs, hydrated);
      });
    }

    if (c.expectedPeekEdgesMode) {
      test(`${c.name}: preserves the selected peekEdges mode in SSR and CSR`, async ({
        browser,
      }) => {
        const noJs = await openPeekEdgesModeSnapshot(browser, c.state, false);
        const hydrated = await openPeekEdgesModeSnapshot(browser, c.state, true);

        expect(noJs).toBe(c.expectedPeekEdgesMode);
        expect(hydrated).toBe(c.expectedPeekEdgesMode);
      });
    }
  }
});

test.describe('playground event coach', () => {
  test('does not log reachStart during initial hydration or remount', async ({
    page,
  }) => {
    await page.goto(
      playgroundUrl({
        slideCount: 10,
        slidesPerView: 3.5,
        spaceBetween: 12,
        marginEnd: 180,
        paginationMode: 'dot',
        visualDebug: true,
        imageSeed: 'event-coach-reach-start',
      }),
      { waitUntil: 'domcontentloaded' },
    );
    await waitForHydratedCarousel(page);

    await expect
      .poll(() => countDidacticEvent(page, 'reachStart'))
      .toBe(0);

    await page.getByRole('button', { name: 'Remount' }).click();
    await waitForHydratedCarousel(page);

    await expect
      .poll(() => countDidacticEvent(page, 'reachStart'))
      .toBe(0);
  });
});
