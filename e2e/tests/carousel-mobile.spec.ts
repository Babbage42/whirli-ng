import { expect, test } from '@playwright/test';
import {
  findClickableSlide,
  firstCarousel,
  getActiveSlideIndex,
  waitActiveChange,
  waitCarouselReady,
} from './helpers/carousel-test.helper';
import type { Page } from '@playwright/test';

const story = (id: string) => `?id=${id}`;

async function dispatchTouchSwipe(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: start.x, y: start.y }],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: end.x, y: end.y }],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await session.detach();
}

async function overscrollAtStart(page: Page) {
  const carousel = firstCarousel(page);
  const box = await carousel.boundingBox();
  expect(box).not.toBeNull();

  const y = box!.y + box!.height / 2;
  await dispatchTouchSwipe(
    page,
    { x: box!.x + box!.width * 0.25, y },
    { x: box!.x + box!.width * 0.75, y },
  );
  await page.waitForTimeout(500);
}

test.describe('Real touch interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(story('whirli-carousel--partial-slides-per-view'));
    await waitCarouselReady(page);
  });

  test('a touchscreen tap selects the tapped slide', async ({ page }) => {
    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);
    const target = await findClickableSlide(carousel, {
      notActive: true,
      notDisabled: true,
    });

    expect(target).not.toBeNull();
    // Locator.tap chooses an actionable point inside the actually visible
    // portion of a partially displayed slide and emits a touch sequence.
    await target!.locator.tap();

    await waitActiveChange(carousel, initial);
    expect(await getActiveSlideIndex(carousel)).toBe(target!.index);
  });

  test('a touch swipe navigates only once and is not treated as a tap', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);
    const box = await carousel.boundingBox();
    expect(box).not.toBeNull();

    const y = box!.y + box!.height / 2;
    const startX = box!.x + box!.width * 0.8;
    const endX = box!.x + box!.width * 0.2;

    await carousel.evaluate(
      (element, points) => {
        const touch = (clientX: number) =>
          new Touch({
            identifier: 0,
            target: element,
            clientX,
            clientY: points.y,
            pageX: clientX,
            pageY: points.y,
          });
        const start = touch(points.startX);
        const end = touch(points.endX);

        element.dispatchEvent(
          new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: [start],
            changedTouches: [start],
          }),
        );
        element.dispatchEvent(
          new TouchEvent('touchmove', {
            bubbles: true,
            cancelable: true,
            touches: [end],
            changedTouches: [end],
          }),
        );
        element.dispatchEvent(
          new TouchEvent('touchend', {
            bubbles: true,
            cancelable: true,
            touches: [],
            changedTouches: [end],
          }),
        );
      },
      { startX, endX, y },
    );

    await waitActiveChange(carousel, initial);
    await expect(carousel.locator('.slide--active')).toHaveCount(1);
  });

  test('pagination dots respond to a touchscreen tap', async ({ page }) => {
    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);
    const dot = carousel.getByRole('button', { name: /go to slide 3/i });
    const box = await dot.boundingBox();
    expect(box).not.toBeNull();

    await page.touchscreen.tap(
      box!.x + box!.width / 2,
      box!.y + box!.height / 2,
    );

    await waitActiveChange(carousel, initial);
  });

  test('a vertical gesture over a horizontal carousel scrolls the page', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);
    const box = await carousel.boundingBox();
    expect(box).not.toBeNull();

    await page.evaluate(() => {
      document.body.style.minHeight = '2000px';
      window.scrollTo(0, 0);
    });

    const x = box!.x + box!.width / 2;
    await dispatchTouchSwipe(
      page,
      { x, y: box!.y + box!.height * 0.75 },
      { x, y: box!.y + box!.height * 0.25 },
    );

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    expect(await getActiveSlideIndex(carousel)).toBe(initial);
  });

  test('a swipe starting on an image navigates without native image drag', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);
    const activeImage = carousel.locator('.slide--active img').first();
    const box = await activeImage.boundingBox();
    expect(box).not.toBeNull();

    await activeImage.evaluate((image) => {
      (window as Window & { __nativeImageDragCount?: number })
        .__nativeImageDragCount = 0;
      image.addEventListener('dragstart', () => {
        (window as Window & { __nativeImageDragCount?: number })
          .__nativeImageDragCount!++;
      });
    });

    const y = box!.y + box!.height / 2;
    await dispatchTouchSwipe(
      page,
      { x: box!.x + box!.width * 0.8, y },
      { x: box!.x + box!.width * 0.2, y },
    );

    await waitActiveChange(carousel, initial);
    expect(
      await page.evaluate(
        () =>
          (window as Window & { __nativeImageDragCount?: number })
            .__nativeImageDragCount,
      ),
    ).toBe(0);
  });

  test('the first slide tap works after releasing start-edge resistance', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--exact-slides-per-view'));
    await waitCarouselReady(page);
    const carousel = firstCarousel(page);

    await overscrollAtStart(page);
    expect(await getActiveSlideIndex(carousel)).toBe(0);

    const fourthSlide = carousel.locator('[data-testid="slide-3"]');
    const box = await fourthSlide.boundingBox();
    expect(box).not.toBeNull();
    await page.touchscreen.tap(
      box!.x + box!.width * 0.2,
      box!.y + box!.height / 2,
    );

    await expect.poll(() => getActiveSlideIndex(carousel)).toBe(3);
  });

  test('the first Next tap works after releasing start-edge resistance', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--exact-slides-per-view'));
    await waitCarouselReady(page);
    const carousel = firstCarousel(page);

    await overscrollAtStart(page);
    expect(await getActiveSlideIndex(carousel)).toBe(0);

    await carousel.getByRole('button', { name: 'Next slide' }).tap();

    await expect.poll(() => getActiveSlideIndex(carousel)).not.toBe(0);
  });
});
