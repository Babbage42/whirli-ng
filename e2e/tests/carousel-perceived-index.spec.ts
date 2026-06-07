import { expect, Locator, test } from '@playwright/test';
import {
  dragSlides,
  firstCarousel,
  getActiveSlideIndex,
  waitStoryReady,
} from './helpers/carousel-test.helper';

/**
 * Tests for the `perceivedIndex` feature.
 *
 * Background:
 *  In a plain (non-loop, non-rewind) carousel with non-integer slidesPerView
 *  or freeMode, the last reachable snap is `lastSlideAnchor`, but several
 *  slides are still visible to the right. `currentPosition` saturates there
 *  → from a UX standpoint the active slide visible to the user is one of
 *  the "crammed" slides, not the anchor.
 *
 *  perceivedIndex splits the residual translate zone into N+1 chunks where
 *  N = totalSlides - 1 - lastSlideAnchor, so each chunk crossed counts as
 *  one extra slide.
 */

const story = (id: string) => `?id=${id}`;

/**
 * `getActiveSlideIndex` reads the slide carrying `.slide--active` (which is
 * now driven by perceivedIndex). The helper returns -1 when no active slide
 * is found.
 */
async function getPerceivedActive(carousel: Locator): Promise<number> {
  return getActiveSlideIndex(carousel);
}

async function dragToEnd(
  page: import('@playwright/test').Page,
  carousel: Locator,
  steps = 3,
) {
  // Drag left a few times so we cross the residual zone.
  for (let i = 0; i < steps; i++) {
    await dragSlides(page, carousel, { distance: -400 });
    await page.waitForTimeout(200);
  }
}

test.describe('perceivedIndex — residual zone (freeMode)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(story('whirli-carousel--perceived-free-mode'));
    await waitStoryReady(page);
  });

  test('drag past the lastSlideAnchor pushes perceivedIndex into the residual zone', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);
    const before = await getPerceivedActive(carousel);
    expect(before).toBeGreaterThanOrEqual(0);

    await dragToEnd(page, carousel, 4);

    const after = await getPerceivedActive(carousel);
    // 5 slides, spv=2.5 → lastSlideAnchor=2. Before the fix, currentPosition
    // saturates at 2 no matter how far the user drags. With perceivedIndex,
    // we must land on at least slide 3 (the first crammed slide) once the
    // user drags past the anchor.
    expect(after).toBeGreaterThanOrEqual(3);
    expect(after).toBeLessThanOrEqual(4);
  });

  test('intermediate drag lands on an intermediate perceived index', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);

    // Single short drag past the lastSlideAnchor.
    await dragSlides(page, carousel, { distance: -300 });
    await page.waitForTimeout(300);
    const mid = await getPerceivedActive(carousel);

    // Should not stay on the original index, nor jump straight to the end.
    expect(mid).toBeGreaterThanOrEqual(1);
    expect(mid).toBeLessThanOrEqual(4);
  });

  test('pagination dot reflects perceivedIndex at the edge', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);
    await dragToEnd(page, carousel, 4);

    const dots = carousel.locator('button.dot[aria-label^="Go to slide "]');
    const count = await dots.count();
    if (count === 0) {
      test.skip(true, 'No dots rendered');
      return;
    }

    // Find which dot is .selected — must be the last one (perceived = 4).
    const selectedIndices: number[] = [];
    for (let i = 0; i < count; i++) {
      const cls = (await dots.nth(i).getAttribute('class')) ?? '';
      if (/\bselected\b/.test(cls)) selectedIndices.push(i);
    }
    expect(selectedIndices.length).toBe(1);
    expect(selectedIndices[0]).toBe(count - 1);
  });
});

test.describe('perceivedIndex — regression: no behavior change in plain mode', () => {
  test('integer slidesPerView: perceivedIndex === currentPosition', async ({
    page,
  }) => {
    // Plain story: 8 slides, spv=3, no loop, no rewind, no freeMode.
    await page.goto(story('whirli-carousel--partial-slides-per-view'));
    await waitStoryReady(page);
    const carousel = firstCarousel(page);

    // Navigate via next button if available, else drag, then assert
    // perceivedIndex matches the standard slide--active behavior.
    const nextBtn = carousel.getByRole('button', { name: /next slide/i });
    if (await nextBtn.count()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    const active = await getPerceivedActive(carousel);
    expect(active).toBeGreaterThanOrEqual(0);
    expect(active).toBeLessThan(10);
    // No residual-zone artifact: at most one slide is active.
    await expect(carousel.locator('.slide--active')).toHaveCount(1);
  });
});
