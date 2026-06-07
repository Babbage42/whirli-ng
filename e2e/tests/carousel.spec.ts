import { expect, test, Page, Locator } from '@playwright/test';
import {
  clickNext,
  clickNextUntilStop,
  clickPrev,
  clickPrevUntilStop,
  countVisibleSlides,
  dragSlides,
  findClickableSlide,
  firstCarousel,
  getTimeout,
  getActiveSlideIndex,
  getRealActiveIndex,
  getRenderedIndices,
  isSlideInViewport,
  waitActiveChange,
  waitCarouselReady,
  waitStoryReady,
} from './helpers/carousel-test.helper';

/**
 * Storybook helper
 */
const story = (id: string) => `?id=${id}`;

type HasLocator = Page | Locator;
type PaginationType =
  | 'dot'
  | 'dynamic_dot'
  | 'fraction'
  | 'progress'
  | 'scrollbar'
  | 'none';

type Scenario = {
  name: string;
  id: string;
  caps: {
    buttons?: boolean;
    pagination?: PaginationType;
    clickableDots?: boolean;
    draggable?: boolean;
    freeMode?: boolean;
    mouseWheel?: boolean;
    loop?: boolean;
    rewind?: boolean;
    rtl?: boolean;
    vertical?: boolean;
    virtual?: boolean;
    slideOnClick?: boolean;
    disabledSlides?: boolean;
    totalSlides?: number;
    variableWidths?: boolean;
    center?: boolean;
    notCenterBounds?: boolean;
    stepSlides?: number;
    peekEdges?: 'relative' | 'absolute';
    projected?: boolean;
    externalPagination?: boolean;
    externalNavigation?: boolean;
  };
};

/**
 * Scénarios de test
 */
const scenarios: Scenario[] = [
  {
    name: 'Partial slidesPerView',
    id: 'whirli-carousel--partial-slides-per-view',
    caps: {
      totalSlides: 10,
    },
  },
  {
    name: 'ExternalNavigation',
    id: 'whirli-carousel--external-navigation',
    caps: {
      pagination: 'dynamic_dot',
      clickableDots: true,
      externalNavigation: true,
      totalSlides: 10,
    },
  },
  {
    name: 'ExternalPagination',
    id: 'whirli-carousel--external-pagination',
    caps: {
      buttons: true,
      pagination: 'dynamic_dot',
      clickableDots: true,
      externalPagination: true,
      totalSlides: 10,
    },
  },
  {
    name: 'ProjectedComplexContent',
    id: 'whirli-carousel--projected-slides-complex-content',
    caps: {
      buttons: true,
      pagination: 'dynamic_dot',
      clickableDots: true,
      projected: true,
      totalSlides: 12,
    },
  },
  {
    name: 'ProjectedMarginEnd',
    id: 'whirli-carousel--projected-slides-margin-end',
    caps: {
      buttons: true,
      pagination: 'dot',
      clickableDots: true,
      projected: true,
      totalSlides: 12,
    },
  },
  {
    name: 'Looping',
    id: 'whirli-carousel--looping',
    caps: {
      buttons: true,
      pagination: 'dynamic_dot',
      clickableDots: true,
      loop: true,
      totalSlides: 8,
    },
  },
  {
    name: 'AutoWithDifferentWidths',
    id: 'whirli-carousel--auto-with-different-widths',
    caps: {
      buttons: true,
      pagination: 'dynamic_dot',
      clickableDots: true,
      totalSlides: 10,
      variableWidths: true,
    },
  },
  {
    name: 'LoopingAutoWithDifferentWidths',
    id: 'whirli-carousel--looping-auto-with-different-widths',
    caps: {
      buttons: true,
      pagination: 'dynamic_dot',
      clickableDots: true,
      loop: true,
      totalSlides: 10,
      variableWidths: true,
    },
  },
  {
    name: 'Rewind',
    id: 'whirli-carousel--rewind',
    caps: {
      buttons: true,
      rewind: true,
      totalSlides: 8,
    },
  },
  {
    name: 'RTL',
    id: 'whirli-carousel--right-to-left-carousel',
    caps: {
      buttons: true,
      rtl: true,
      totalSlides: 10,
    },
  },
  {
    name: 'Vertical',
    id: 'whirli-carousel--vertical-carousel',
    caps: {
      buttons: true,
      vertical: true,
      totalSlides: 10,
    },
  },
  {
    name: 'FreeMode (drag)',
    id: 'whirli-carousel--free-mode',
    caps: {
      buttons: true,
      draggable: true,
      freeMode: true,
      totalSlides: 12,
    },
  },
  {
    name: 'MouseWheel (free)',
    id: 'whirli-carousel--mouse-wheel-bool',
    caps: {
      buttons: true,
      mouseWheel: true,
      totalSlides: 12,
    },
  },
  {
    name: 'NoSlideOnClick',
    id: 'whirli-carousel--no-slide-on-clik',
    caps: {
      buttons: true,
      slideOnClick: false,
      totalSlides: 20,
    },
  },
  {
    name: 'DisabledSlides',
    id: 'whirli-carousel--disabled-slides',
    caps: {
      buttons: true,
      slideOnClick: true,
      disabledSlides: true,
      totalSlides: 10,
    },
  },
  {
    name: 'NonDraggable',
    id: 'whirli-carousel--non-draggable',
    caps: {
      buttons: true,
      draggable: false,
      totalSlides: 10,
    },
  },
  {
    name: 'VirtualMode',
    id: 'whirli-carousel--virtual-mode',
    caps: {
      buttons: true,
      virtual: true,
      totalSlides: 30,
      loop: false,
    },
  },
  {
    name: 'VirtualLoopMode',
    id: 'whirli-carousel--virtual-loop-mode',
    caps: {
      buttons: true,
      virtual: true,
      loop: true,
      totalSlides: 30,
    },
  },
  {
    name: 'VirtualLoopSmallTotal',
    id: 'whirli-carousel--virtual-loop-small-total',
    caps: {
      buttons: true,
      virtual: true,
      loop: true,
      totalSlides: 7,
    },
  },
  {
    name: 'VirtualLoopAutoSlidesPerView',
    id: 'whirli-carousel--virtual-loop-auto-slides-per-view',
    caps: {
      buttons: true,
      virtual: true,
      loop: true,
      totalSlides: 30,
    },
  },
  {
    name: 'NotCenterBounds',
    id: 'whirli-carousel--not-center-bounds',
    caps: {
      buttons: true,
      center: true,
      notCenterBounds: true,
      totalSlides: 10,
    },
  },
  {
    name: 'NotCenterBoundsOdd',
    id: 'whirli-carousel--not-center-bounds-odd',
    caps: {
      buttons: true,
      center: true,
      notCenterBounds: true,
      totalSlides: 10,
    },
  },
  {
    name: 'NotCenterBoundsWithLoop',
    id: 'whirli-carousel--not-center-bounds-with-loop',
    caps: {
      buttons: true,
      loop: true,
      center: true,
      notCenterBounds: true,
      totalSlides: 10,
    },
  },
  {
    name: 'NotCenterBoundsWithRewind',
    id: 'whirli-carousel--not-center-bounds-with-rewind',
    caps: {
      buttons: true,
      rewind: true,
      center: true,
      notCenterBounds: true,
      totalSlides: 10,
    },
  },
  {
    name: 'StepSlidesLargerThanView',
    id: 'whirli-carousel--step-slides-larger-than-view',
    caps: {
      buttons: true,
      stepSlides: 5,
      totalSlides: 15,
    },
  },
  {
    name: 'StepSlidesWithLoop',
    id: 'whirli-carousel--step-slides-with-loop',
    caps: {
      buttons: true,
      loop: true,
      stepSlides: 2,
      totalSlides: 12,
    },
  },
  {
    name: 'StepSlidesWithRewind',
    id: 'whirli-carousel--step-slides-with-rewind',
    caps: {
      buttons: true,
      rewind: true,
      stepSlides: 2,
      totalSlides: 12,
    },
  },
  {
    name: 'PeekEdgesAbsolute',
    id: 'whirli-carousel--with-absolute-peek-edges',
    caps: {
      buttons: true,
      peekEdges: 'absolute',
      totalSlides: 10,
    },
  },
  {
    name: 'Centered',
    id: 'whirli-carousel--centered',
    caps: {
      buttons: true,
      center: true,
      totalSlides: 9,
    },
  },
  {
    name: 'LoopAndCenter',
    id: 'whirli-carousel--loop-and-center',
    caps: {
      buttons: true,
      loop: true,
      center: true,
      totalSlides: 10,
    },
  },
];

/* ------------------------------------------------------------------------------------------------
 * Suites de tests
 * ------------------------------------------------------------------------------------------------ */

function defineBaseContracts(s: Scenario) {
  test('renders with exactly one active slide', async ({ page }) => {
    const carousel = firstCarousel(page);

    const active = carousel.locator('[data-testid^="slide-"].slide--active');
    await expect(active).toHaveCount(1);

    const idx = await getActiveSlideIndex(carousel);
    expect(idx).toBeGreaterThanOrEqual(0);

    // Vérifier que la slide active est bien dans le DOM
    const activeSlide = carousel.locator(`[data-testid="slide-${idx}"]`);
    await expect(activeSlide).toBeVisible();
  });

  test('a11y: active slide has basic aria attributes', async ({ page }) => {
    const carousel = firstCarousel(page);

    const active = carousel
      .locator('[data-testid^="slide-"].slide--active')
      .first();

    await expect(active).toHaveAttribute('role', /group/i);
    await expect(active).toHaveAttribute('aria-label', /of/i);
    await expect(active).toHaveAttribute('tabindex', /-1|0/);
  });
}

function defineButtonsNavigationSuite(s: Scenario) {
  test('buttons: next/prev changes active slide', async ({ page }) => {
    test.skip(!s.caps.buttons, 'No buttons expected');

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    const mode = {
      rtl: s.caps.rtl ?? false,
      loop: s.caps.loop ?? false,
      virtual: s.caps.virtual ?? false,
      freeMode: s.caps.freeMode ?? false,
    };
    await clickNext(carousel, 1, mode);
    await waitActiveChange(carousel, initial, mode);

    const afterNext = await getActiveSlideIndex(carousel);
    expect(afterNext).not.toBe(initial);

    await clickPrev(carousel, 1, mode);
    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
      .not.toBe(afterNext);

    // Stronger contract for plain (non-loop, non-rewind, non-disabled, non-step)
    // setups: next then prev should return to the exact initial index.
    // notCenterBounds has its own offset rules and is excluded.
    const isStraightForward =
      !s.caps.loop &&
      !s.caps.rewind &&
      !s.caps.disabledSlides &&
      !s.caps.notCenterBounds &&
      (s.caps.stepSlides ?? 1) === 1;
    if (isStraightForward) {
      await expect
        .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
        .toBe(initial);
    }
  });

  test('edges: without loop/rewind, next/prev eventually stops at bounds', async ({
    page,
  }) => {
    test.skip(!s.caps.buttons, 'No buttons expected');
    test.skip(
      !!s.caps.loop || !!s.caps.rewind,
      'Edge stop contract only for non-loop/non-rewind',
    );

    const carousel = firstCarousel(page);
    const maxSteps = (s.caps.totalSlides ?? 12) + 8;
    const mode = { rtl: s.caps.rtl ?? false };

    const end = await clickNextUntilStop(carousel, maxSteps, mode);
    expect(end.steps).toBeLessThanOrEqual(maxSteps);

    const atEnd = await getActiveSlideIndex(carousel);
    await clickNext(carousel, 1, mode);
    await page.waitForTimeout(500);
    const stillAtEnd = await getActiveSlideIndex(carousel);
    expect(stillAtEnd).toBe(atEnd);

    const start = await clickPrevUntilStop(carousel, maxSteps, mode);
    expect(start.steps).toBeLessThanOrEqual(maxSteps);

    const atStart = await getActiveSlideIndex(carousel);
    await clickPrev(carousel, 1, mode);
    await page.waitForTimeout(500);
    const stillAtStart = await getActiveSlideIndex(carousel);
    expect(stillAtStart).toBe(atStart);
  });

  test('navigation buttons: visibility at start/end follows loop/rewind mode', async ({
    page,
  }) => {
    test.skip(!s.caps.buttons, 'No buttons expected');

    const carousel = firstCarousel(page);
    const prevBtn = carousel.locator('button[aria-label="Previous slide"]');
    const nextBtn = carousel.locator('button[aria-label="Next slide"]');

    // At start: prev should be visible only in loop/rewind mode
    // Note: In RTL mode, button labels don't match logical direction (leftControl uses showNextControl)
    // So we skip this check for RTL scenarios to avoid confusion
    if (!s.caps.rtl) {
      const prevVisibleAtStart = await prevBtn.isVisible();
      if (s.caps.loop || s.caps.rewind) {
        expect(prevVisibleAtStart).toBe(true);
      } else {
        expect(prevVisibleAtStart).toBe(false);
      }

      // Next should always be visible at start (unless at end with 1 slide)
      const nextVisibleAtStart = await nextBtn.isVisible();
      expect(nextVisibleAtStart).toBe(true);
    }

    // Navigate to middle if possible
    const mode = { rtl: s.caps.rtl ?? false };
    await clickNext(carousel, 2, mode);
    await page.waitForTimeout(500);

    // In middle: both buttons should be visible
    const prevVisibleInMiddle = await prevBtn.isVisible();
    const nextVisibleInMiddle = await nextBtn.isVisible();
    expect(prevVisibleInMiddle).toBe(true);
    expect(nextVisibleInMiddle).toBe(true);
  });
}

function defineExternalNavigationSuite(s: Scenario) {
  test('external navigation: renders outside carousel and stays wired', async ({
    page,
  }) => {
    test.skip(!s.caps.externalNavigation, 'Only for external navigation');

    const carousel = firstCarousel(page);
    const external = page.locator('[data-testid="external-navigation"]');

    await expect(external).toBeVisible();
    await expect(
      carousel.getByRole('button', { name: /next slide/i }),
    ).toHaveCount(0);
    await expect(
      carousel.getByRole('button', { name: /previous slide/i }),
    ).toHaveCount(0);

    const next = external.getByRole('button', { name: /next slide/i });
    const prev = external.getByRole('button', { name: /previous slide/i });

    await expect(next).toBeVisible();
    await expect(prev).not.toBeVisible();

    const initial = await getActiveSlideIndex(carousel);
    await next.click();

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
      .not.toBe(initial);

    await expect(prev).toBeVisible();
    await prev.click();

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
      .toBe(initial);
  });
}

function definePaginationSuite(s: Scenario) {
  test('pagination: clicking dot navigates (dot/dynamic_dot)', async ({
    page,
  }) => {
    test.skip(
      !s.caps.pagination || s.caps.pagination === 'none',
      'No pagination expected',
    );
    test.skip(
      !(s.caps.pagination === 'dot' || s.caps.pagination === 'dynamic_dot'),
      'Not dot-based pagination',
    );
    test.skip(!s.caps.clickableDots, 'Dots not clickable in this scenario');

    const carousel = firstCarousel(page);
    const paginationScope = s.caps.externalPagination
      ? page.locator('[data-testid="external-pagination"]')
      : carousel;
    const initial = await getActiveSlideIndex(carousel);

    const dot = paginationScope.getByRole('button', {
      name: /go to slide 3/i,
    });
    await dot.click();

    const active = await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
      .not.toBe(initial)
      .then(async () => getActiveSlideIndex(carousel));

    expect(active).toBeGreaterThanOrEqual(2);
  });

  test('pagination: multiple dot jumps remain consistent', async ({ page }) => {
    test.skip(
      !s.caps.pagination || s.caps.pagination === 'none',
      'No pagination expected',
    );
    test.skip(
      !(s.caps.pagination === 'dot' || s.caps.pagination === 'dynamic_dot'),
      'Not dot-based pagination',
    );
    test.skip(!s.caps.clickableDots, 'Dots not clickable in this scenario');

    const carousel = firstCarousel(page);
    const paginationScope = s.caps.externalPagination
      ? page.locator('[data-testid="external-pagination"]')
      : carousel;
    const dots = paginationScope.locator(
      'button.dot[aria-label^="Go to slide "]',
    );
    const count = await dots.count();
    if (!count) {
      test.skip(true, 'No dots found');
      return;
    }

    const targets = Array.from(
      new Set([0, Math.floor(count / 2), count - 1]),
    ).sort((a, b) => a - b);

    for (const dotIndex of targets) {
      const dot = dots.nth(dotIndex);
      const label = (await dot.getAttribute('aria-label')) ?? '';
      const match = label.match(/(\d+)/);
      if (!match) {
        continue;
      }
      const targetIndex = Number(match[1]) - 1;
      if (!Number.isFinite(targetIndex) || targetIndex < 0) {
        continue;
      }
      await dot.click();
      await expect
        .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
        .toBe(targetIndex);
      await page.waitForTimeout(250);
    }
  });

  test('pagination: fraction updates (if present)', async ({ page }) => {
    test.skip(
      s.caps.pagination !== 'fraction',
      'Not a fraction pagination scenario',
    );

    const carousel = firstCarousel(page);
    const fraction = carousel
      .locator('.carousel__pagination--fraction')
      .first();

    await fraction.waitFor();

    const before = (await fraction.innerText()).trim();
    await clickNext(carousel, 1);
    await expect
      .poll(async () => (await fraction.innerText()).trim(), { timeout: 1500 })
      .not.toBe(before);
  });

  test('pagination: external mode renders outside the carousel and stays wired', async ({
    page,
  }) => {
    test.skip(!s.caps.externalPagination, 'Only for external pagination');

    const carousel = firstCarousel(page);
    const external = page.locator('[data-testid="external-pagination"]');

    await expect(external).toBeVisible();
    await expect(carousel.locator('.carousel__pagination')).toHaveCount(0);
    await expect(external.locator('.carousel__pagination')).toBeVisible();

    const initial = await getActiveSlideIndex(carousel);
    await external
      .getByRole('button', { name: /go to slide 3/i })
      .click();

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
      .not.toBe(initial);
  });
}

function defineSlideClickSuite(s: Scenario) {
  test('slideOnClick: clicking a slide selects it (when enabled)', async ({
    page,
  }) => {
    test.skip(
      s.caps.slideOnClick === false,
      'Slide click disabled by scenario',
    );
    const carousel = firstCarousel(page);

    const isVirtual = s.caps.virtual ?? false;
    const isLoop = s.caps.loop ?? false;

    if (isVirtual && isLoop) {
      await clickNext(carousel, 3);
      await page.waitForTimeout(800);
    }

    const initialIndex = await getActiveSlideIndex(carousel);
    const initialReal = await getRealActiveIndex(carousel);

    // Trouver une slide cliquable (non-active, non-disabled, visible)
    const clickable = await findClickableSlide(carousel, {
      notActive: true,
      notDisabled: true,
    });

    if (!clickable) {
      test.skip(true, 'No clickable slide found');
      return;
    }

    // Cliquer sur la slide
    await clickable.locator.click();

    if (s.caps.notCenterBounds) {
      // In notCenterBounds, perceivedIndex may stay put when the clicked
      // slide is past lastSlideAnchor → assert on the real (intent) index.
      await expect
        .poll(() => getRealActiveIndex(carousel), { timeout: 2000 })
        .not.toBe(initialReal);
    } else {
      await waitActiveChange(carousel, initialIndex);
      const newIndex = await getActiveSlideIndex(carousel);
      expect(newIndex).not.toBe(initialIndex);
    }

    // In all cases, exactly one slide must carry the .slide--active class.
    await expect(carousel.locator('.slide--active')).toHaveCount(1);
  });

  test('slideOnClick=false: clicking slides does NOT change active', async ({
    page,
  }) => {
    test.skip(
      s.caps.slideOnClick !== false,
      'Only for slideOnClick=false scenario',
    );

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    const clickable = await findClickableSlide(carousel, {
      notActive: true,
      notDisabled: true,
    });

    if (!clickable) {
      test.skip(true, 'No clickable slide found');
      return;
    }

    await clickable.locator.click();

    await page.waitForTimeout(800);
    const afterClick = await getActiveSlideIndex(carousel);
    expect(afterClick).toBe(initial);
  });

  test('slideOnClick: clicking slide X makes it active (verify exact index)', async ({
    page,
  }) => {
    test.skip(s.caps.slideOnClick === false, 'Slide click disabled');

    const carousel = firstCarousel(page);
    const mode = {
      rtl: s.caps.rtl ?? false,
      loop: s.caps.loop ?? false,
      virtual: s.caps.virtual ?? false,
      freeMode: s.caps.freeMode ?? false,
    };
    const clickOptions = s.caps.vertical
      ? { position: { x: 5, y: 5 }, force: true }
      : { force: true };

    if (s.caps.disabledSlides) {
      const clickable = await findClickableSlide(carousel, {
        notActive: true,
        notDisabled: true,
      });

      if (!clickable) {
        test.skip(true, 'No clickable slide found');
        return;
      }

      await page.waitForTimeout(getTimeout(mode));
      const before = await getActiveSlideIndex(carousel);
      await clickable.locator.click(clickOptions);

      if (before !== clickable.index) {
        await waitActiveChange(carousel, before, mode);
      }

      const activeIndex = await getActiveSlideIndex(carousel);
      expect(activeIndex).toBe(clickable.index);
      return;
    }

    // Try to navigate to find a clickable slide (especially important for edge cases like stepSlides > slidesPerView)
    let current = await getActiveSlideIndex(carousel);
    let targetSlide = await findClickableSlide(carousel, {
      notActive: true,
      notDisabled: true,
    });

    // If no clickable slide found initially, try navigating a few times
    if (!targetSlide) {
      for (let i = 0; i < 4; i++) {
        const res = await clickNext(carousel, 1, mode);
        if (res.blocked) {
          break;
        }
        current = await waitActiveChange(carousel, current, mode);
        targetSlide = await findClickableSlide(carousel, {
          notActive: true,
          notDisabled: true,
        });
        if (targetSlide) {
          break;
        }
      }
    }

    if (!targetSlide) {
      test.skip(true, 'No clickable slide found');
      return;
    }

    // Avoid clicking during ongoing transitions which can be treated as drag.
    await page.waitForTimeout(getTimeout(mode));

    const before = await getActiveSlideIndex(carousel);
    const beforeReal = await getRealActiveIndex(carousel);
    await targetSlide.locator.click(clickOptions);

    if (s.caps.notCenterBounds) {
      // In notCenterBounds scenarios, the clicked index may exceed the
      // lastSlideAnchor → `perceivedIndex` (= .slide--active) stays on the
      // anchor while `currentRealPosition` reflects the click intent. Wait
      // on and assert the real (intent) index.
      if (beforeReal !== targetSlide.index) {
        await expect
          .poll(() => getRealActiveIndex(carousel), { timeout: 2000 })
          .toBe(targetSlide.index);
      }
      expect(await getRealActiveIndex(carousel)).toBe(targetSlide.index);
    } else {
      if (before !== targetSlide.index) {
        await waitActiveChange(carousel, before, mode);
      }
      const activeIndex = await getActiveSlideIndex(carousel);
      expect(activeIndex).toBe(targetSlide.index);
    }
  });

  test('slideOnClick: repeated clicks keep active in sync', async ({
    page,
  }) => {
    test.skip(s.caps.slideOnClick === false, 'Slide click disabled');

    const carousel = firstCarousel(page);
    const mode = {
      rtl: s.caps.rtl ?? false,
      loop: s.caps.loop ?? false,
      virtual: s.caps.virtual ?? false,
      freeMode: s.caps.freeMode ?? false,
    };

    const repetitions = Math.min(
      6,
      Math.max(3, Math.floor((s.caps.totalSlides ?? 10) / 3)),
    );

    for (let i = 0; i < repetitions; i++) {
      const before = await getActiveSlideIndex(carousel);
      const beforeReal = await getRealActiveIndex(carousel);
      const clickable = await findClickableSlide(carousel, {
        notActive: true,
        notDisabled: true,
      });

      if (!clickable) {
        test.skip(true, 'No clickable slide found');
        return;
      }

      const clickOptions = s.caps.vertical
        ? { position: { x: 5, y: 5 }, force: true }
        : { force: true };
      await clickable.locator.click(clickOptions);

      if (s.caps.notCenterBounds) {
        // Perceived may stay parked on the anchor; the intent is what matters.
        if (beforeReal !== clickable.index) {
          await expect
            .poll(() => getRealActiveIndex(carousel), { timeout: 2000 })
            .toBe(clickable.index);
        }
      } else {
        await waitActiveChange(carousel, before, mode);
        const after = await getActiveSlideIndex(carousel);
        expect(after).toBe(clickable.index);
      }
      await expect(carousel.locator('.slide--active')).toHaveCount(1);
      await page.waitForTimeout(Math.min(getTimeout(mode), 250));
    }
  });
}

function defineDisabledSlidesSuite(s: Scenario) {
  test('disabled slides cannot become active on click', async ({ page }) => {
    test.skip(!s.caps.disabledSlides, 'No disabled slides expected');

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    // Dans votre story, les slides 2 et 5 sont disabled
    const disabled2 = carousel.locator('[data-testid="slide-2"]');

    // Vérifier qu'elle a bien la classe disabled
    await expect(disabled2).toHaveClass(/slide--disabled/);

    await disabled2.click({ force: true });
    await page.waitForTimeout(800);

    const afterClick = await getActiveSlideIndex(carousel);
    expect(afterClick).toBe(initial);

    // Vérifier qu'un clic sur une slide non-disabled fonctionne
    const clickable = await findClickableSlide(carousel, {
      notActive: true,
      notDisabled: true,
      preferredIndex: 3,
    });

    if (clickable) {
      await clickable.locator.click();
      await waitActiveChange(carousel, initial);
      const newIndex = await getActiveSlideIndex(carousel);
      expect(newIndex).not.toBe(initial);
    }
  });

  test('prev with a disabled slide between current and start does NOT wrap', async ({
    page,
  }) => {
    test.skip(!s.caps.disabledSlides, 'No disabled slides expected');
    test.skip(
      !!s.caps.loop || !!s.caps.rewind,
      'Wrap-around is expected in loop/rewind mode',
    );

    const carousel = firstCarousel(page);
    const total = s.caps.totalSlides ?? 10;

    // Navigate forward a few times to a position past the disabled slides.
    await clickNext(carousel, 3);
    await page.waitForTimeout(400);

    // Now walk back: even if some intermediate slide is disabled, we must
    // never wrap to the end. The active index must only decrease (or stay).
    let prevIdx = await getActiveSlideIndex(carousel);
    for (let i = 0; i < 6; i++) {
      await clickPrev(carousel, 1);
      await page.waitForTimeout(250);
      const cur = await getActiveSlideIndex(carousel);
      expect(cur).toBeLessThanOrEqual(prevIdx);
      expect(cur).toBeLessThan(total - 1); // must NEVER jump to the end
      prevIdx = cur;
    }
  });
}

function defineDragSuite(s: Scenario) {
  test('drag: dragging changes active when draggable (or does nothing when not)', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    const isVertical = s.caps.vertical ?? false;
    const isRtl = s.caps.rtl ?? false;
    let dragDistance = -700;

    if (isRtl) {
      dragDistance = 700;
    }

    await dragSlides(page, carousel, {
      distance: dragDistance,
      mode: {
        vertical: isVertical,
        rtl: isRtl,
        loop: s.caps.loop,
      },
    });

    if (s.caps.draggable === false) {
      await page.waitForTimeout(800);
      const afterDrag = await getActiveSlideIndex(carousel);
      expect(afterDrag).toBe(initial);
      return;
    }

    const isVirtual = s.caps.virtual ?? false;
    const isLoop = s.caps.loop ?? false;
    const timeout = isVirtual && isLoop ? 3500 : 2000;

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout })
      .not.toBe(initial);
  });

  test('drag: swipe left/right navigates in correct direction', async ({
    page,
  }) => {
    test.skip(s.caps.draggable === false, 'Not draggable');
    test.skip(!!s.caps.freeMode, 'Free mode has different drag behavior');

    const carousel = firstCarousel(page);
    const isVertical = s.caps.vertical ?? false;
    const isRtl = s.caps.rtl ?? false;
    const isLoop = s.caps.loop ?? false;

    // Navigate to a middle position for non-loop scenarios to have room to move
    if (!isLoop && !s.caps.rewind) {
      await clickNext(carousel, 3);
      await page.waitForTimeout(500);
    }

    const initial = await getActiveSlideIndex(carousel);

    // Swipe LEFT (negative distance) = move FORWARD in LTR
    // In RTL, swipe left = move BACKWARD
    await dragSlides(page, carousel, {
      distance: -600,
      mode: { vertical: isVertical, rtl: isRtl, loop: isLoop },
    });

    await page.waitForTimeout(400);
    const afterLeftSwipe = await getActiveSlideIndex(carousel);

    // Verify it moved (or stayed if at boundary)
    expect(afterLeftSwipe).toBeDefined();

    if (afterLeftSwipe !== initial) {
      if (isRtl) {
        // RTL: swipe left should decrease index (or wrap to end)
        if (isLoop && afterLeftSwipe > initial) {
          // Wrapped around to end
          expect(afterLeftSwipe).toBeGreaterThan(initial);
        } else {
          expect(afterLeftSwipe).toBeLessThan(initial);
        }
      } else {
        // LTR: swipe left should increase index (or wrap to start)
        if (isLoop && afterLeftSwipe < initial) {
          // Wrapped around to start
          expect(afterLeftSwipe).toBeLessThan(initial);
        } else {
          expect(afterLeftSwipe).toBeGreaterThan(initial);
        }
      }
    }

    // Wait before next swipe
    await page.waitForTimeout(400);

    // Swipe RIGHT (positive distance) = move BACKWARD in LTR
    // In RTL, swipe right = move FORWARD
    await dragSlides(page, carousel, {
      distance: 600,
      mode: { vertical: isVertical, rtl: isRtl, loop: isLoop },
    });

    await page.waitForTimeout(400);
    const afterRightSwipe = await getActiveSlideIndex(carousel);

    // At least one of the swipes should have moved
    const atLeastOneMoved =
      afterLeftSwipe !== initial || afterRightSwipe !== afterLeftSwipe;
    expect(atLeastOneMoved).toBe(true);

    if (afterRightSwipe !== afterLeftSwipe) {
      if (isRtl) {
        // RTL: swipe right should increase index (or wrap to start)
        if (isLoop && afterRightSwipe < afterLeftSwipe) {
          // Wrapped around to start
          expect(afterRightSwipe).toBeLessThan(afterLeftSwipe);
        } else {
          expect(afterRightSwipe).toBeGreaterThan(afterLeftSwipe);
        }
      } else {
        // LTR: swipe right should decrease index (or wrap to end)
        if (isLoop && afterRightSwipe > afterLeftSwipe) {
          // Wrapped around to end
          expect(afterRightSwipe).toBeGreaterThan(afterLeftSwipe);
        } else {
          expect(afterRightSwipe).toBeLessThan(afterLeftSwipe);
        }
      }
    }
  });
}

function defineMouseWheelSuite(s: Scenario) {
  test('mouseWheel: wheel moves slides (when enabled)', async ({ page }) => {
    test.skip(!s.caps.mouseWheel, 'Mouse wheel not enabled');

    const carousel = firstCarousel(page);
    const hostSlides = carousel.locator('.slides').first();

    const initial = await getActiveSlideIndex(carousel);

    for (let i = 0; i < 4; i++) {
      await hostSlides.dispatchEvent('wheel', {
        deltaX: 250,
        deltaY: 0,
        bubbles: true,
        cancelable: true,
      });
      await page.waitForTimeout(120);
    }

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 2000 })
      .not.toBe(initial);
  });
}

function defineVariableWidthsSuite(s: Scenario) {
  test('variable widths: active slide stays visible after navigation', async ({
    page,
  }) => {
    test.skip(s.caps.variableWidths !== true, 'Only for variable widths story');

    const carousel = firstCarousel(page);
    const mode = {
      rtl: s.caps.rtl ?? false,
      loop: s.caps.loop ?? false,
      virtual: s.caps.virtual ?? false,
      freeMode: s.caps.freeMode ?? false,
    };
    const total = s.caps.totalSlides ?? 10;
    let current = await getActiveSlideIndex(carousel);

    const maxSteps = mode.loop ? total + 4 : Math.min(total + 2, 12);
    for (let i = 0; i < maxSteps; i++) {
      const res = await clickNext(carousel, 1, mode);
      if (res.blocked) {
        break;
      }
      try {
        current = await waitActiveChange(carousel, current, mode);
      } catch (err) {
        if (mode.loop) {
          throw err;
        }
        break;
      }

      const activeSlide = carousel.locator(`[data-testid="slide-${current}"]`);
      await expect
        .poll(() => isSlideInViewport(activeSlide, carousel, 0.3), {
          timeout: getTimeout(mode) + 400,
        })
        .toBe(true);
    }
  });
}

function defineNavigationEnduranceSuite(s: Scenario) {
  test('navigation endurance: repeated next/prev keeps state valid', async ({
    page,
  }) => {
    test.skip(s.caps.buttons === false, 'No buttons expected');

    const carousel = firstCarousel(page);
    const mode = { rtl: s.caps.rtl ?? false };
    const total = s.caps.totalSlides ?? 10;
    const steps = Math.min(30, total + 10);

    for (let i = 0; i < steps; i++) {
      await clickNext(carousel, 1, mode);
    }

    let active = await getActiveSlideIndex(carousel);
    expect(active).toBeGreaterThanOrEqual(0);
    expect(active).toBeLessThan(total);
    await expect(carousel.locator('.slide--active')).toHaveCount(1);

    for (let i = 0; i < steps; i++) {
      await clickPrev(carousel, 1, mode);
    }

    active = await getActiveSlideIndex(carousel);
    expect(active).toBeGreaterThanOrEqual(0);
    expect(active).toBeLessThan(total);
    await expect(carousel.locator('.slide--active')).toHaveCount(1);
  });
}

function defineLoopSuite(s: Scenario) {
  test('loop: eventually wraps (active index goes down after going up)', async ({
    page,
  }) => {
    test.skip(!s.caps.loop, 'Not a loop scenario');

    const carousel = firstCarousel(page);

    let prev = await getActiveSlideIndex(carousel);
    let sawIncrease = false;
    let sawWrap = false;

    const total = s.caps.totalSlides ?? 10;
    const maxClicks = total + 10;

    for (let i = 0; i < maxClicks; i++) {
      await clickNext(carousel, 1);
      await page.waitForTimeout(100);
      const cur = await getActiveSlideIndex(carousel);

      if (cur > prev) sawIncrease = true;
      if (sawIncrease && cur < prev) {
        sawWrap = true;
        break;
      }
      prev = cur;
    }

    expect(sawWrap).toBeTruthy();
  });
}

function defineRewindSuite(s: Scenario) {
  test('rewind: after passing end, goes back to start', async ({ page }) => {
    test.skip(!s.caps.rewind, 'Not a rewind scenario');

    const carousel = firstCarousel(page);
    const total = s.caps.totalSlides ?? 8;
    const initialIndex = await getActiveSlideIndex(carousel);

    // Click next up to totalSlides + 1 times, checking if we loop back
    let currentIndex = initialIndex;
    let rewound = false;

    for (let i = 0; i < total + 1; i++) {
      const beforeClick = currentIndex;
      await clickNext(carousel, 1);
      await page.waitForTimeout(200);
      currentIndex = await getActiveSlideIndex(carousel);

      // If we're back at initial index after moving forward, rewind happened
      // @todo fix issue for notcenterwithrewind
      if (
        currentIndex === initialIndex ||
        (currentIndex === initialIndex + 1 && beforeClick !== initialIndex)
      ) {
        rewound = true;
        break;
      }
    }

    expect(rewound).toBe(true);
  });
}

function defineRtlSuite(s: Scenario) {
  test('rtl: buttons wiring allows round-trip (prev then next)', async ({
    page,
  }) => {
    test.skip(!s.caps.rtl, 'Not an RTL scenario');

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    await clickPrev(carousel, 1);
    await waitActiveChange(carousel, initial);
    const afterPrev = await getActiveSlideIndex(carousel);

    await clickNext(carousel, 1);
    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
      .toBe(initial);
  });
}

function defineVerticalSuite(s: Scenario) {
  test('vertical: has vertical class and navigation works', async ({
    page,
  }) => {
    test.skip(!s.caps.vertical, 'Not a vertical scenario');

    const carousel = firstCarousel(page);
    await expect(carousel).toHaveClass(/carousel--vertical/);

    const initial = await getActiveSlideIndex(carousel);
    await clickNext(carousel, 1);
    await waitActiveChange(carousel, initial);
  });
}

function defineVirtualSuite(s: Scenario) {
  test('virtual: does not render all slides & keeps a buffer around active', async ({
    page,
  }) => {
    test.skip(!s.caps.virtual, 'Not a virtual scenario');

    const carousel = firstCarousel(page);
    const total = s.caps.totalSlides ?? 30;
    const buffer = 2;

    const normalize = (idx: number) => {
      if (s.caps.loop) return (idx + total) % total;
      return idx;
    };

    const checkBuffer = async () => {
      const active = await getActiveSlideIndex(carousel);
      const rendered = await getRenderedIndices(carousel);

      if (s.name !== 'VirtualLoopAutoSlidesPerView' && total >= 10) {
        expect(rendered.length).toBeLessThan(total);
      }

      expect(rendered).toContain(active);

      for (let d = 1; d <= buffer; d++) {
        const left = normalize(active - d);
        const right = normalize(active + d);

        if (!s.caps.loop) {
          if (active - d >= 0) expect(rendered).toContain(left);
          if (active + d < total) expect(rendered).toContain(right);
        } else {
          expect(rendered).toContain(left);
          expect(rendered).toContain(right);
        }
      }
    };

    await checkBuffer();

    const steps = Math.min(10, total + 2);
    for (let i = 0; i < steps; i++) {
      await clickNext(carousel, 1);
      await page.waitForTimeout(150);
      await checkBuffer();
    }
  });
}

function defineBoundsSuite(s: Scenario) {
  const readTranslate = async (carousel: Locator, axis: 'x' | 'y') => {
    return await carousel.locator('.slides').evaluate((el, axis) => {
      const transform = window.getComputedStyle(el).transform;
      if (!transform || transform === 'none') {
        return 0;
      }

      const matrixMatch = transform.match(/^matrix\((.+)\)$/);
      if (matrixMatch) {
        const values = matrixMatch[1]
          .split(',')
          .map((value) => parseFloat(value.trim()));
        if (values.length === 6) {
          return axis === 'x' ? values[4] : values[5];
        }
      }

      const matrix3dMatch = transform.match(/^matrix3d\((.+)\)$/);
      if (matrix3dMatch) {
        const values = matrix3dMatch[1]
          .split(',')
          .map((value) => parseFloat(value.trim()));
        if (values.length === 16) {
          return axis === 'x' ? values[12] : values[13];
        }
      }

      return 0;
    }, axis);
  };

  test('bounds: cannot translate beyond minTranslate', async ({ page }) => {
    test.skip(
      !!s.caps.externalNavigation,
      'External navigation has its own wiring contract',
    );
    test.skip(!!s.caps.loop, 'No bounds in loop mode');
    test.skip(!!s.caps.rewind, 'No bounds in rewind mode (wraps like loop)');

    const carousel = firstCarousel(page);
    const mode = { rtl: s.caps.rtl ?? false };

    // Essayer d'aller au-delà du début
    await clickPrevUntilStop(carousel, 20, mode);

    const axis = s.caps.vertical ? 'y' : 'x';
    const translate = await readTranslate(carousel, axis);

    // Le translate ne devrait pas dépasser minTranslate
    expect(translate).toBeGreaterThanOrEqual(-50); // Margin for minTranslate=0
  });

  test('bounds: cannot translate beyond maxTranslate', async ({ page }) => {
    test.skip(
      !!s.caps.externalNavigation,
      'External navigation has its own wiring contract',
    );
    test.skip(!!s.caps.loop, 'No bounds in loop mode');
    test.skip(!!s.caps.rewind, 'No bounds in rewind mode (wraps like loop)');

    const carousel = firstCarousel(page);
    const mode = { rtl: s.caps.rtl ?? false };
    await clickNextUntilStop(carousel, 20, mode);

    // Vérifier que translate <= maxTranslate (négatif)
    const axis = s.caps.vertical ? 'y' : 'x';
    const translate = await readTranslate(carousel, axis);
    const rtlHorizontal = !!s.caps.rtl && !s.caps.vertical;

    if (rtlHorizontal) {
      expect(translate).toBeGreaterThan(0);
    } else {
      expect(translate).toBeLessThan(0); // Should be negative at end
    }
  });
}

/* ------------------------------------------------------------------------------------------------
 * Tests principaux
 * ------------------------------------------------------------------------------------------------ */

test.describe('Carousel E2E (modular matrix)', () => {
  for (const s of scenarios) {
    test.describe(`${s.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(story(s.id));
        await waitStoryReady(page);
      });

      defineBaseContracts(s);
      defineButtonsNavigationSuite(s);
      defineExternalNavigationSuite(s);
      definePaginationSuite(s);
      defineSlideClickSuite(s);
      defineDisabledSlidesSuite(s);
      defineDragSuite(s);
      defineMouseWheelSuite(s);
      defineNavigationEnduranceSuite(s);
      defineVariableWidthsSuite(s);
      defineLoopSuite(s);
      defineRewindSuite(s);
      defineRtlSuite(s);
      defineVerticalSuite(s);
      defineVirtualSuite(s);
      defineBoundsSuite(s);
    });
  }
});
/* ------------------------------------------------------------------------------------------------

Tests spéciaux
------------------------------------------------------------------------------------------------ */

test.describe('Carousel E2E (special)', () => {
  test('pagination progress updates while navigating', async ({ page }) => {
    await page.goto(story('whirli-carousel--pagination-progress'));
    await waitStoryReady(page);

    const carousel = firstCarousel(page);
    const progress = carousel.getByRole('progressbar', {
      name: /carousel progress/i,
    });
    await progress.waitFor();

    const before = Number(await progress.getAttribute('aria-valuenow'));
    expect(before).toBeGreaterThan(0);

    await clickNext(carousel, 2);

    await expect
      .poll(async () => Number(await progress.getAttribute('aria-valuenow')), {
        timeout: 1500,
      })
      .toBeGreaterThan(before);
  });

  test('pagination progress can be positioned at the top', async ({ page }) => {
    await page.goto(story('whirli-carousel--pagination-progress-top'));
    await waitStoryReady(page);

    const carousel = firstCarousel(page);
    const progress = carousel.getByRole('progressbar', {
      name: /carousel progress/i,
    });
    await progress.waitFor();

    const [carouselBox, progressBox] = await Promise.all([
      carousel.boundingBox(),
      progress.boundingBox(),
    ]);

    expect(carouselBox).not.toBeNull();
    expect(progressBox).not.toBeNull();
    expect(progressBox!.y - carouselBox!.y).toBeLessThan(8);
    expect(progressBox!.x).toBeGreaterThanOrEqual(carouselBox!.x - 1);
    expect(progressBox!.x + progressBox!.width).toBeLessThanOrEqual(
      carouselBox!.x + carouselBox!.width + 1,
    );
  });

  test('pagination scrollbar reflects navigation and supports track click', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--pagination-scrollbar'));
    await waitStoryReady(page);

    const carousel = firstCarousel(page);
    const scrollbar = carousel.getByRole('scrollbar', {
      name: /carousel scrollbar/i,
    });
    await scrollbar.waitFor();

    const before = Number(await scrollbar.getAttribute('aria-valuenow'));
    expect(before).toBe(1);

    await clickNext(carousel, 1);

    await expect
      .poll(async () => Number(await scrollbar.getAttribute('aria-valuenow')), {
        timeout: 1500,
      })
      .toBeGreaterThan(before);

    const box = await scrollbar.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.click(box!.x + box!.width * 0.85, box!.y + box!.height / 2);

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
      .toBeGreaterThan(4);

    const lastStep = Number(await scrollbar.getAttribute('aria-valuemax'));
    await clickNext(carousel, lastStep + 1);

    await expect
      .poll(async () => Number(await scrollbar.getAttribute('aria-valuenow')), {
        timeout: 2000,
      })
      .toBe(lastStep);

    const [trackBox, thumbBox] = await Promise.all([
      scrollbar.boundingBox(),
      scrollbar.locator('span').boundingBox(),
    ]);
    expect(trackBox).not.toBeNull();
    expect(thumbBox).not.toBeNull();
    const trackEnd = trackBox!.x + trackBox!.width;
    const thumbEnd = thumbBox!.x + thumbBox!.width;
    expect(Math.abs(trackEnd - thumbEnd)).toBeLessThanOrEqual(1);

    await scrollbar.press('Home');

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
      .toBe(0);
  });

  test('controllerFor keeps two carousels synchronized without thumbs mode', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--controller-sync'));
    await waitStoryReady(page);

    const master = firstCarousel(page);
    const controlled = page
      .getByTestId('controlled-carousel')
      .locator('.carousel')
      .first();

    await clickNext(master, 2);

    await expect
      .poll(() => getActiveSlideIndex(controlled), { timeout: 1500 })
      .toBe(2);

    await controlled.locator('[data-testid="slide-4"]').click();

    await expect
      .poll(() => getActiveSlideIndex(master), { timeout: 1500 })
      .toBe(4);
  });

  test('responsive breakpoints change visible slides', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit');
    await page.setViewportSize({ width: 500, height: 800 });
    await page.goto(story('whirli-carousel--responsive-breakpoints'));
    await waitStoryReady(page);

    const slides = firstCarousel(page).locator('.slides').first();
    const mobileVisible = await countVisibleSlides(slides);
    expect(mobileVisible).toBeLessThanOrEqual(2);

    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);

    const desktopVisible = await countVisibleSlides(slides);
    expect(desktopVisible).toBeGreaterThanOrEqual(3);
  });
  test('thumbnails sync with master carousel', async ({ page }) => {
    await page.goto(story('whirli-carousel--thumbs'));
    await waitStoryReady(page);
    const carousels = page.locator('.carousel');
    const master = carousels.nth(0);
    const thumbs = carousels.nth(1);

    const initial = await getActiveSlideIndex(master);

    const clickable = await findClickableSlide(thumbs, {
      notActive: true,
      preferredIndex: 3,
    });

    if (clickable) {
      await clickable.locator.click();

      await expect
        .poll(() => getActiveSlideIndex(master), { timeout: 1500 })
        .not.toBe(initial);
    }
  });
  test('autoplay advances slides over time', async ({ page }) => {
    await page.goto(story('whirli-carousel--auto-play'));
    await waitStoryReady(page);
    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 6500 })
      .not.toBe(initial);
  });
});
/* ------------------------------------------------------------------------------------------------

NOUVEAUX TESTS : Edge Cases Critiques
------------------------------------------------------------------------------------------------ */

test.describe('Carousel E2E (edge cases)', () => {
  test('virtual mode with very few slides (< slidesPerView)', async ({
    page,
  }) => {
    // Créer une story avec seulement 2 slides mais slidesPerView=4
    await page.goto(
      story('whirli-carousel--few-slides-less-than-slides-per-view'),
    );
    await waitStoryReady(page);
    const carousel = firstCarousel(page);
    const rendered = await getRenderedIndices(carousel);

    // Toutes les slides doivent être rendues
    expect(rendered.length).toBe(2);

    // Les boutons ne devraient pas permettre de naviguer
    const initial = await getActiveSlideIndex(carousel);
    await clickNext(carousel, 1);
    await page.waitForTimeout(500);

    const afterNext = await getActiveSlideIndex(carousel);
    // Devrait rester à 0 car pas assez de slides
    expect(afterNext).toBe(initial);
  });
  test('clicking disabled slide in loop mode', async ({ page }) => {
    await page.goto(story('whirli-carousel--disabled-slides'));
    await waitStoryReady(page);
    const carousel = firstCarousel(page);

    // Activer le loop
    // (vous devrez peut-être créer une story spécifique pour ça)

    const disabledSlide = carousel.locator('[data-testid="slide-2"]');
    await expect(disabledSlide).toHaveClass(/slide--disabled/);

    const initial = await getActiveSlideIndex(carousel);
    await disabledSlide.click({ force: true });
    await page.waitForTimeout(800);

    const afterClick = await getActiveSlideIndex(carousel);
    expect(afterClick).toBe(initial);
  });
  test('rapid navigation does not break state', async ({ page }) => {
    await page.goto(story('whirli-carousel--looping'));
    await waitStoryReady(page);
    const carousel = firstCarousel(page);

    // Cliquer rapidement 10 fois sur next
    for (let i = 0; i < 10; i++) {
      await clickNext(carousel, 1);
      // Pas d'attente entre les clics
    }

    // Attendre que tout se stabilise
    await page.waitForTimeout(1000);

    // Vérifier qu'on a toujours exactement 1 slide active
    const activeSlides = carousel.locator('.slide--active');
    await expect(activeSlides).toHaveCount(1);

    // Vérifier qu'on peut encore naviguer
    const beforeNav = await getActiveSlideIndex(carousel);
    await clickNext(carousel, 1);
    await waitActiveChange(carousel, beforeNav);

    const afterNav = await getActiveSlideIndex(carousel);
    expect(afterNav).not.toBe(beforeNav);
  });
  test('drag and immediate click does not conflict', async ({ page }) => {
    await page.goto(story('whirli-carousel--looping'));
    await waitStoryReady(page);
    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    await dragSlides(page, carousel, {
      distance: -150,
    });

    await page.waitForTimeout(500);

    const clickable = await findClickableSlide(carousel, {
      notActive: true,
      notDisabled: true,
    });

    if (clickable) {
      await clickable.locator.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(1000);

      // Vérifier qu'on a une seule slide active
      const activeSlides = carousel.locator('.slide--active');
      await expect(activeSlides).toHaveCount(1);
    }
  });
});
