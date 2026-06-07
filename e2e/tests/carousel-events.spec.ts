import { expect, test, Page } from '@playwright/test';
import {
  clickNext,
  clickPrev,
  dragSlides,
  firstCarousel,
  getActiveSlideIndex,
  waitActiveChange,
  waitStoryReady,
} from './helpers/carousel-test.helper';

/**
 * Tests des outputs / events du carousel.
 *
 * On utilise la story EventsProbe (et ses variantes) qui exposent
 * le nombre d'émissions de chaque event sous forme d'attributs DOM
 * `data-testid="evt-<eventName>"` (compteur) et
 * `data-testid="last-<eventName>"` (dernière valeur émise).
 *
 * Avantages :
 *  - pas besoin de l'addon Storybook actions
 *  - test entièrement déterministe / mesurable
 *  - covers the public output contract exposed by CarouselComponent
 */

const story = (id: string) => `?id=${id}`;

async function getCount(page: Page, key: string): Promise<number> {
  const v = await page
    .locator(`[data-testid="evt-${key}"]`)
    .getAttribute('data-count');
  return Number(v ?? '0');
}

async function getLast(page: Page, key: string): Promise<number> {
  const v = await page
    .locator(`[data-testid="last-${key}"]`)
    .getAttribute('data-value');
  return Number(v ?? '0');
}

test.describe('Carousel Events / Outputs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(story('whirli-carousel--events-probe'));
    await waitStoryReady(page);
  });

  test('afterInit fires once after mount', async ({ page }) => {
    await expect
      .poll(() => getCount(page, 'afterInit'), { timeout: 3000 })
      .toBeGreaterThanOrEqual(1);
  });

  test('reachStart does not fire during initial layout', async ({ page }) => {
    expect(await getCount(page, 'reachStart')).toBe(0);
  });

  test('slideNext + activeIndexChange + transitionStart/End fire on next click', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);
    const before = await getActiveSlideIndex(carousel);
    const beforeUpdate = await getCount(page, 'activeIndexChange');
    const beforeNext = await getCount(page, 'slideNext');

    await clickNext(carousel, 1);
    await waitActiveChange(carousel, before);

    expect(await getCount(page, 'slideNext')).toBeGreaterThan(beforeNext);
    expect(await getCount(page, 'activeIndexChange')).toBeGreaterThan(beforeUpdate);
    expect(await getCount(page, 'transitionStart')).toBeGreaterThanOrEqual(1);
    // transitionEnd fires once the CSS transform animation completes,
    // which can outlast the activeIndexChange event — poll it.
    await expect
      .poll(() => getCount(page, 'transitionEnd'), { timeout: 2000 })
      .toBeGreaterThanOrEqual(1);

    const after = await getActiveSlideIndex(carousel);
    expect(await getLast(page, 'activeIndexChange')).toBe(after);
  });

  test('slidePrev fires on prev click', async ({ page }) => {
    const carousel = firstCarousel(page);
    await clickNext(carousel, 2);
    await page.waitForTimeout(500);

    const before = await getCount(page, 'slidePrev');
    const beforeIndex = await getActiveSlideIndex(carousel);

    await clickPrev(carousel, 1);
    await waitActiveChange(carousel, beforeIndex);

    expect(await getCount(page, 'slidePrev')).toBeGreaterThan(before);
  });

  test('reachEnd fires when reaching the end (non-loop)', async ({ page }) => {
    const carousel = firstCarousel(page);
    // 8 slides, spv=3 → maxIndex=5, on enchaîne plus que nécessaire
    await clickNext(carousel, 8);
    await page.waitForTimeout(1000);
    expect(await getCount(page, 'reachEnd')).toBeGreaterThanOrEqual(1);
  });

  test('reachStart fires when going back to the start', async ({ page }) => {
    const carousel = firstCarousel(page);
    await clickNext(carousel, 3);
    await page.waitForTimeout(500);
    const before = await getCount(page, 'reachStart');
    await clickPrev(carousel, 6);
    await page.waitForTimeout(800);
    expect(await getCount(page, 'reachStart')).toBe(before + 1);
  });

  test('touchStart / dragStart / dragEnd / touched fire on drag', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);
    const beforeTouched = await getCount(page, 'touched');

    await dragSlides(page, carousel, { distance: -400 });
    await page.waitForTimeout(400);

    expect(await getCount(page, 'touchStart')).toBeGreaterThanOrEqual(1);
    expect(await getCount(page, 'dragStart')).toBeGreaterThanOrEqual(1);
    expect(await getCount(page, 'dragEnd')).toBeGreaterThanOrEqual(1);
    // touched fires once on first interaction
    expect(await getCount(page, 'touched')).toBeGreaterThan(beforeTouched);
  });

  test('touched fires only once across multiple interactions', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);
    await dragSlides(page, carousel, { distance: -200 });
    await page.waitForTimeout(300);
    await dragSlides(page, carousel, { distance: -200 });
    await page.waitForTimeout(300);
    await clickNext(carousel, 1);
    await page.waitForTimeout(300);

    expect(await getCount(page, 'touched')).toBe(1);
  });

  test('translateChange + progress fire during drag', async ({ page }) => {
    const carousel = firstCarousel(page);
    await dragSlides(page, carousel, { distance: -400 });
    await page.waitForTimeout(300);

    expect(await getCount(page, 'translateChange')).toBeGreaterThanOrEqual(1);
    expect(await getCount(page, 'progress')).toBeGreaterThanOrEqual(1);

    const lastProgress = await getLast(page, 'progress');
    expect(lastProgress).toBeGreaterThanOrEqual(0);
    expect(lastProgress).toBeLessThanOrEqual(1);
  });

  test('progress is 0 at the start and ~1 at the end (non-loop)', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);
    // Trigger an initial transition to seed progress
    await clickNext(carousel, 1);
    await page.waitForTimeout(400);
    await clickPrev(carousel, 1);
    await page.waitForTimeout(400);

    const startProgress = await getLast(page, 'progress');
    expect(startProgress).toBeLessThan(0.2);

    await clickNext(carousel, 8);
    await page.waitForTimeout(800);

    const endProgress = await getLast(page, 'progress');
    expect(endProgress).toBeGreaterThan(0.8);
  });

  test('slideClick fires on slide click with index', async ({ page }) => {
    const carousel = firstCarousel(page);
    const target = carousel.locator('[data-testid="slide-3"]');
    await expect(target).toBeVisible();
    await target.click({ force: true });
    await page.waitForTimeout(500);

    expect(await getCount(page, 'slideClick')).toBeGreaterThanOrEqual(1);
    expect(await getLast(page, 'slideClick')).toBe(3);
  });

});

test.describe('Carousel Events / Loop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(story('whirli-carousel--events-probe-loop'));
    await waitStoryReady(page);
  });

  test('reachEnd / reachStart do NOT fire in loop mode', async ({ page }) => {
    const carousel = firstCarousel(page);
    // Full circle and beyond
    await clickNext(carousel, 12);
    await page.waitForTimeout(1500);

    expect(await getCount(page, 'reachEnd')).toBe(0);
    expect(await getCount(page, 'reachStart')).toBe(0);
  });
});

test.describe('Carousel Events / Autoplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(story('whirli-carousel--events-probe-autoplay'));
    await waitStoryReady(page);
  });

  test('autoplayStart fires on mount', async ({ page }) => {
    await expect
      .poll(() => getCount(page, 'autoplayStart'), { timeout: 3000 })
      .toBeGreaterThanOrEqual(1);
  });

  test('autoplayPause fires on hover', async ({ page }) => {
    const carousel = firstCarousel(page);
    await carousel.hover();
    await expect
      .poll(() => getCount(page, 'autoplayPause'), { timeout: 2000 })
      .toBeGreaterThanOrEqual(1);
  });

  test('autoplayStop fires on interaction (stopOnInteraction=true)', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);
    await clickNext(carousel, 1);
    await expect
      .poll(() => getCount(page, 'autoplayStop'), { timeout: 2000 })
      .toBeGreaterThanOrEqual(1);
  });
});
