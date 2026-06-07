import { expect, test, type Locator } from '@playwright/test';
import {
  clickNext,
  dragSlides,
  firstCarousel,
  getRealActiveIndex,
  waitStoryReady,
} from './helpers/carousel-test.helper';

const story = (id: string) => `?id=${id}`;

test.use({ viewport: { width: 700, height: 720 } });

type MarginEndCase = {
  name: string;
  storyId: string;
  expectedMarginEnd: number;
  finalNexts: number;
  lastSlideIndex: number;
  intermediate?: {
    nexts: number;
    slideIndex: number;
  };
};

const SNAP_CASES: MarginEndCase[] = [
  {
    name: 'small marginEnd',
    storyId: 'whirli-carousel--margin-end-small',
    expectedMarginEnd: 24,
    finalNexts: 9,
    lastSlideIndex: 11,
  },
  {
    name: 'medium marginEnd',
    storyId: 'whirli-carousel--margin-end-snap-interactions',
    expectedMarginEnd: 120,
    finalNexts: 10,
    lastSlideIndex: 11,
    intermediate: {
      nexts: 9,
      slideIndex: 9,
    },
  },
  {
    name: 'large marginEnd',
    storyId: 'whirli-carousel--margin-end-large',
    expectedMarginEnd: 320,
    finalNexts: 11,
    lastSlideIndex: 11,
    intermediate: {
      nexts: 10,
      slideIndex: 10,
    },
  },
];

async function getEndGap(
  carousel: Locator,
  lastSlideIndex: number,
): Promise<number> {
  return carousel.evaluate((carouselEl, lastSlideIndex) => {
    const lastSlide = carouselEl.querySelector(
      `[data-testid="slide-${lastSlideIndex}"]`,
    ) as HTMLElement | null;

    if (!lastSlide) {
      return Number.NaN;
    }

    const viewport = carouselEl.getBoundingClientRect();
    const slide = lastSlide.getBoundingClientRect();
    return Math.round(viewport.right - slide.right);
  }, lastSlideIndex);
}

async function expectMarginEndVisible(
  carousel: Locator,
  expectedMarginEnd: number,
  lastSlideIndex: number,
) {
  await expect
    .poll(() => getEndGap(carousel, lastSlideIndex), {
      timeout: 2500,
      intervals: [100, 200, 400],
    })
    .toBeGreaterThanOrEqual(expectedMarginEnd - 2);

  await expect
    .poll(() => getEndGap(carousel, lastSlideIndex), {
      timeout: 2500,
      intervals: [100, 200, 400],
    })
    .toBeLessThanOrEqual(expectedMarginEnd + 2);
}

async function expectRealActiveIndex(carousel: Locator, index: number) {
  await expect
    .poll(() => getRealActiveIndex(carousel), {
      timeout: 2500,
      intervals: [100, 200, 400],
    })
    .toBe(index);
}

async function expectNotYetAtFinalMarginEnd(
  carousel: Locator,
  expectedMarginEnd: number,
  lastSlideIndex: number,
) {
  await expect
    .poll(() => getEndGap(carousel, lastSlideIndex), {
      timeout: 2500,
      intervals: [100, 200, 400],
    })
    .toBeLessThan(expectedMarginEnd - 2);
}

test.describe('marginEnd snap offset', () => {
  for (const c of SNAP_CASES) {
    test(`${c.name}: keeps the visual end gap after slideNext reaches the last anchor`, async ({
      page,
    }) => {
      await page.goto(story(c.storyId));
      await waitStoryReady(page);
      const carousel = firstCarousel(page);

      await clickNext(carousel, c.finalNexts);
      await page.waitForTimeout(600);

      await expectRealActiveIndex(carousel, c.finalNexts);
      await expectMarginEndVisible(
        carousel,
        c.expectedMarginEnd,
        c.lastSlideIndex,
      );
    });

    if (c.intermediate) {
      test(`${c.name}: keeps a natural intermediate snap before the final marginEnd snap`, async ({
        page,
      }) => {
        await page.goto(story(c.storyId));
        await waitStoryReady(page);
        const carousel = firstCarousel(page);

        await clickNext(carousel, c.intermediate!.nexts);
        await page.waitForTimeout(600);

        await expectRealActiveIndex(carousel, c.intermediate!.slideIndex);
        await expectNotYetAtFinalMarginEnd(
          carousel,
          c.expectedMarginEnd,
          c.lastSlideIndex,
        );

        await clickNext(carousel, 1);
        await page.waitForTimeout(600);

        await expectRealActiveIndex(carousel, c.finalNexts);
        await expectMarginEndVisible(
          carousel,
          c.expectedMarginEnd,
          c.lastSlideIndex,
        );
      });
    }
  }

  test('medium marginEnd: keeps the visual end gap after pagination slideTo targets the last anchor', async ({
    page,
  }) => {
    const c = SNAP_CASES[1]!;
    await page.goto(story(c.storyId));
    await waitStoryReady(page);
    const carousel = firstCarousel(page);
    const dots = carousel.locator('button.dot[aria-label^="Go to slide "]');
    const dotCount = await dots.count();
    expect(dotCount).toBeGreaterThan(0);

    await dots.nth(dotCount - 1).click();
    await page.waitForTimeout(600);

    await expectRealActiveIndex(carousel, c.finalNexts);
    await expectMarginEndVisible(
      carousel,
      c.expectedMarginEnd,
      c.lastSlideIndex,
    );
  });

  test('freeMode: keeps the visual end gap after drag release at the end', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--margin-end-free-mode'));
    await waitStoryReady(page);
    const carousel = firstCarousel(page);

    for (let i = 0; i < 6; i++) {
      await dragSlides(page, carousel, {
        distance: -900,
        mode: { freeMode: true },
      });
    }

    await expectMarginEndVisible(carousel, 120, 11);
  });
});
