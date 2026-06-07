import { expect, test } from '@playwright/test';
import {
  waitCarouselReady,
  getActiveSlideIndex,
  clickNext,
  clickPrev,
  assertCarouselIntegrity,
  waitActiveChange,
  getRenderedIndices,
  countVisibleSlides,
  dragSlides,
} from './helpers/carousel-test.helper';
const story = (id: string) => `?id=${id}`;

function firstCarousel(page) {
  return page.locator('.carousel').first();
}
function nthCarousel(page, index: number) {
  return page.locator('.carousel').nth(index);
}

/**
 * Tests pour la navigation clavier
 */
test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(story('whirli-carousel--looping'));
    await waitCarouselReady(page);
  });

  test('ArrowRight navigates to next slide', async ({ page }) => {
    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    // Focus sur le carousel
    await carousel.press('Tab');
    await carousel.press('ArrowRight');

    await page.waitForTimeout(600);
    const afterKey = await getActiveSlideIndex(carousel);
    expect(afterKey).not.toBe(initial);
  });

  test('ArrowLeft navigates to previous slide', async ({ page }) => {
    const carousel = firstCarousel(page);

    // Se positionner à un index > 0
    await clickNext(carousel, 2);
    await page.waitForTimeout(600);

    const beforeKey = await getActiveSlideIndex(carousel);

    await carousel.press('Tab');
    await carousel.press('ArrowLeft');

    await page.waitForTimeout(600);
    const afterKey = await getActiveSlideIndex(carousel);
    expect(afterKey).not.toBe(beforeKey);
  });

  test('Home key goes to first slide', async ({ page }) => {
    const carousel = firstCarousel(page);

    // Naviguer vers le milieu
    await clickNext(carousel, 4);
    await page.waitForTimeout(600);

    await carousel.press('Tab');
    await carousel.press('Home');

    await page.waitForTimeout(600);
    const index = await getActiveSlideIndex(carousel);
    expect(index).toBe(0);
  });

  test('End key goes to last slide', async ({ page }) => {
    const carousel = firstCarousel(page);

    await carousel.press('Tab');
    await carousel.press('End');

    await page.waitForTimeout(600);
    const index = await getActiveSlideIndex(carousel);

    // En mode loop, le dernier index dépend du totalSlides
    // Pour cette story, c'est 7 (8 slides, index 0-7)
    expect(index).toBeGreaterThanOrEqual(6);
  });

  test('keyboard navigation in RTL mode', async ({ page }) => {
    await page.goto(story('whirli-carousel--right-to-left-carousel'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    const initial = await getActiveSlideIndex(carousel);

    await carousel.press('Tab');

    await carousel.press('ArrowLeft');
    await page.waitForTimeout(600);

    const afterLeft = await getActiveSlideIndex(carousel);
    expect(afterLeft).toBeGreaterThan(initial);

    // ArrowRight devrait revenir
    await carousel.press('ArrowRight');
    await page.waitForTimeout(600);

    const afterRight = await getActiveSlideIndex(carousel);
    expect(afterRight).toBe(initial);
  });

  test('keyboard navigation in vertical mode', async ({ page }) => {
    await page.goto(story('whirli-carousel--vertical-carousel'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    await carousel.press('Tab');

    // En vertical, ArrowDown = next
    await carousel.press('ArrowDown');
    await page.waitForTimeout(600);

    const afterDown = await getActiveSlideIndex(carousel);
    expect(afterDown).not.toBe(initial);

    // ArrowUp = prev
    await carousel.press('ArrowUp');
    await page.waitForTimeout(600);

    const afterUp = await getActiveSlideIndex(carousel);
    expect(afterUp).toBe(initial);
  });
});

/**
 * Tests pour l'autoplay
 */
test.describe('Autoplay', () => {
  test('autoplay advances slides automatically', async ({ page }) => {
    await page.goto(story('whirli-carousel--auto-play'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    // Attendre que l'autoplay fasse au moins 1 transition
    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 5000 })
      .not.toBe(initial);
  });

  test('autoplay pauses on hover', async ({ page }) => {
    await page.goto(story('whirli-carousel--auto-play'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Hover sur le carousel
    await carousel.hover();

    const beforeHover = await getActiveSlideIndex(carousel);

    // Attendre le délai d'autoplay
    await page.waitForTimeout(2500);

    const afterHover = await getActiveSlideIndex(carousel);

    // L'index ne devrait pas avoir changé (autoplay pausé)
    expect(afterHover).toBe(beforeHover);
  });

  test('autoplay resumes after mouse leave', async ({ page }) => {
    await page.goto(story('whirli-carousel--auto-play'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Hover puis unhover
    await carousel.hover();
    await page.mouse.move(0, 0); // Sortir du carousel

    const beforeResume = await getActiveSlideIndex(carousel);

    // Attendre que l'autoplay reprenne
    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 5000 })
      .not.toBe(beforeResume);
  });

  test('autoplay stops on interaction (stopOnInteraction=true)', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--auto-play'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Interagir en cliquant sur next
    await clickNext(carousel, 1);
    await page.waitForTimeout(600);

    const afterInteraction = await getActiveSlideIndex(carousel);

    // Attendre le délai d'autoplay
    await page.waitForTimeout(2500);

    const afterWait = await getActiveSlideIndex(carousel);

    // L'index ne devrait pas avoir changé (autoplay arrêté)
    expect(afterWait).toBe(afterInteraction);
  });
});

/**
 * Tests pour center mode
 */
test.describe('Center Mode', () => {
  test('active slide is centered visually', async ({ page }) => {
    await page.goto(story('whirli-carousel--centered'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const activeSlide = carousel.locator('.slide--active').first();

    // Récupérer les positions
    const positions = await carousel.evaluate(
      (carouselEl, activeEl) => {
        const carouselRect = carouselEl.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();

        const carouselCenter = carouselRect.left + carouselRect.width / 2;
        const activeCenter = activeRect.left + activeRect.width / 2;

        return {
          carouselCenter,
          activeCenter,
          diff: Math.abs(carouselCenter - activeCenter),
        };
      },
      await activeSlide.elementHandle(),
    );

    // La slide active devrait être centrée (tolérance de 5px)
    expect(positions.diff).toBeLessThan(5);
  });

  test('center mode maintains centering after navigation', async ({ page }) => {
    await page.goto(story('whirli-carousel--centered'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Naviguer
    await clickNext(carousel, 1);
    await page.waitForTimeout(600);

    const activeSlide = carousel.locator('.slide--active').first();

    const positions = await carousel.evaluate(
      (carouselEl, activeEl) => {
        const carouselRect = carouselEl.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();

        const carouselCenter = carouselRect.left + carouselRect.width / 2;
        const activeCenter = activeRect.left + activeRect.width / 2;

        return Math.abs(carouselCenter - activeCenter);
      },
      await activeSlide.elementHandle(),
    );

    expect(positions).toBeLessThan(5);
  });
});

/**
 * Tests de performance
 */
test.describe('Performance', () => {
  test('carousel handles many slides (100+) without lag', async ({ page }) => {
    // Vous devrez créer une story avec 100+ slides
    await page.goto(story('whirli-carousel--many-slides'));
    await waitCarouselReady(page, { timeout: 5000 });

    const carousel = firstCarousel(page);

    // Mesurer le temps de navigation
    const startTime = Date.now();
    await clickNext(carousel, 5);
    const endTime = Date.now();

    const duration = endTime - startTime;

    // 5 navigations devraient prendre moins de 3s
    expect(duration).toBeLessThan(3000);
  });

  test('virtual mode improves performance with many slides', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--virtual-mode'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Vérifier qu'on ne rend pas toutes les slides
    const renderedCount = await carousel
      .locator('[data-testid^="slide-"]')
      .count();

    // Avec 30 slides totales et virtual mode, on devrait en rendre ~10-15
    expect(renderedCount).toBeLessThan(20);
    expect(renderedCount).toBeGreaterThan(5);
  });

  test('smooth animations (60 FPS)', async ({ page }) => {
    await page.goto(story('whirli-carousel--looping'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Mesurer les FPS pendant une transition
    const fps = await page.evaluate(async () => {
      let frameCount = 0;
      let lastTime = performance.now();

      return new Promise<number>((resolve) => {
        const checkFrame = () => {
          frameCount++;
          const now = performance.now();

          if (now - lastTime >= 1000) {
            resolve(frameCount);
          } else {
            requestAnimationFrame(checkFrame);
          }
        };

        requestAnimationFrame(checkFrame);
      });
    });

    // Au moins 50 FPS attendu
    expect(fps).toBeGreaterThanOrEqual(50);
  });
});

/**
 * Tests fonctionnels additionnels
 */
test.describe('Functional Coverage', () => {
  test('input image slides do not reserve inline baseline space', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--partial-slides-per-view'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const metrics = await carousel.evaluate(async (carouselEl) => {
      const img = carouselEl.querySelector<HTMLImageElement>(
        '[data-testid="slide-0"] .slide__image',
      );
      const slide = carouselEl.querySelector<HTMLElement>(
        '[data-testid="slide-0"]',
      );
      const slides = carouselEl.querySelector<HTMLElement>('.slides');
      const wrapper =
        carouselEl.querySelector<HTMLElement>('.slides-wrapper');

      if (!img || !slide || !slides || !wrapper) {
        throw new Error('Cannot find carousel image slide structure');
      }

      if (!img.complete && typeof img.decode === 'function') {
        await img.decode().catch(() => undefined);
      }

      return {
        imageHeight: img.getBoundingClientRect().height,
        slideHeight: slide.getBoundingClientRect().height,
        slidesHeight: slides.getBoundingClientRect().height,
        wrapperHeight: wrapper.getBoundingClientRect().height,
        imageDisplay: getComputedStyle(img).display,
      };
    });

    expect(metrics.imageDisplay).toBe('block');
    expect(Math.abs(metrics.slideHeight - metrics.imageHeight)).toBeLessThan(0.5);
    expect(Math.abs(metrics.slidesHeight - metrics.imageHeight)).toBeLessThan(0.5);
    expect(Math.abs(metrics.wrapperHeight - metrics.imageHeight)).toBeLessThan(
      0.5,
    );
  });

  test('slidesPerView=auto applies class and still navigates', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--slides-per-view-auto'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    await expect(carousel.locator('.slides')).toHaveClass(/slides-auto/);

    const initial = await getActiveSlideIndex(carousel);
    await clickNext(carousel, 1);
    await waitActiveChange(carousel, initial);

    const afterNext = await getActiveSlideIndex(carousel);
    expect(afterNext).not.toBe(initial);
  });

  test('slidesPerView=auto with too few slides has no extra page and can center slides', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--few-auto-slides-not-enough'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const slides = carousel.locator('.slides');
    await expect(slides).toHaveClass(/slides-auto/);
    await expect(slides).toHaveClass(/force-centering/);

    await expect(carousel.locator('.dot-pagination.dynamic')).toHaveCount(0);
    await expect(carousel.locator('.control-right')).toBeDisabled();

    const initial = await getActiveSlideIndex(carousel);
    await page.waitForTimeout(200);
    expect(await getActiveSlideIndex(carousel)).toBe(initial);
  });

  test('responsive breakpoints keep active index stable', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(story('whirli-carousel--responsive-breakpoints'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const slides = carousel.locator('.slides').first();

    const initial = await getActiveSlideIndex(carousel);
    await clickNext(carousel, 1);
    await waitActiveChange(carousel, initial);
    const afterNext = await getActiveSlideIndex(carousel);

    const wideCount = await countVisibleSlides(slides);

    await page.setViewportSize({ width: 500, height: 800 });
    await page.waitForTimeout(300);

    const narrowCount = await countVisibleSlides(slides);
    const afterResize = await getActiveSlideIndex(carousel);

    expect(afterResize).toBe(afterNext);
    expect(narrowCount).toBeLessThan(wideCount);
  });

  test('virtual loop large SPV renders a window of slides', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--virtual-loop-large-spv'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const rendered = await getRenderedIndices(carousel);

    expect(rendered.length).toBeGreaterThan(8);
    expect(rendered.length).toBeLessThan(25);

    const before = await getActiveSlideIndex(carousel);
    await clickNext(carousel, 1);
    await waitActiveChange(carousel, before);

    const active = await getActiveSlideIndex(carousel);
    const renderedAfter = await getRenderedIndices(carousel);
    expect(renderedAfter).toContain(active);
  });

  test('few slides loop stays consistent during navigation', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--few-slides-loop'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    for (let i = 0; i < 5; i++) {
      await clickNext(carousel, 1);
      await page.waitForTimeout(200);
      await assertCarouselIntegrity(carousel);
    }

    const after = await getActiveSlideIndex(carousel);
    expect(after).not.toBe(initial);
  });

  test('one/two slide stories do not advance on next/prev', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--one-slide'));
    await waitCarouselReady(page);

    const one = firstCarousel(page);
    const oneInitial = await getActiveSlideIndex(one);
    await clickNext(one, 1);
    await page.waitForTimeout(300);
    expect(await getActiveSlideIndex(one)).toBe(oneInitial);
    await clickPrev(one, 1);
    await page.waitForTimeout(300);
    expect(await getActiveSlideIndex(one)).toBe(oneInitial);

    await page.goto(story('whirli-carousel--two-slides'));
    await waitCarouselReady(page);

    const two = firstCarousel(page);
    const twoInitial = await getActiveSlideIndex(two);
    await clickNext(two, 1);
    await page.waitForTimeout(300);
    expect(await getActiveSlideIndex(two)).toBe(twoInitial);
    await clickPrev(two, 1);
    await page.waitForTimeout(300);
    expect(await getActiveSlideIndex(two)).toBe(twoInitial);
  });

  test('thumbs: clicking a thumb updates the master carousel', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--thumbs'));
    await waitCarouselReady(page);

    const master = nthCarousel(page, 0);
    const thumbs = nthCarousel(page, 1);
    await thumbs.waitFor();

    const targetIndex = 4;
    const thumbSlide = thumbs.locator(`[data-testid="slide-${targetIndex}"]`);
    await expect(thumbSlide).toBeVisible();

    const before = await getActiveSlideIndex(master);
    await thumbSlide.click({ force: true });
    await waitActiveChange(master, before);

    const after = await getActiveSlideIndex(master);
    expect(after).toBe(targetIndex);
  });

  test('thumbs: master navigation syncs active thumb', async ({ page }) => {
    await page.goto(story('whirli-carousel--thumbs'));
    await waitCarouselReady(page);

    const master = nthCarousel(page, 0);
    const thumbs = nthCarousel(page, 1);
    await thumbs.waitFor();

    const before = await getActiveSlideIndex(master);
    await clickNext(master, 1);
    await waitActiveChange(master, before);

    const activeMaster = await getActiveSlideIndex(master);
    await expect
      .poll(() => getActiveSlideIndex(thumbs), { timeout: 2000 })
      .toBe(activeMaster);
  });

  test('thumbs: master drag to the residual end syncs the last active thumb', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--thumbs'));
    await waitCarouselReady(page);

    const master = nthCarousel(page, 0);
    const thumbs = nthCarousel(page, 1);
    await thumbs.waitFor();

    for (let i = 0; i < 20; i++) {
      await dragSlides(page, master, { distance: -700 });
      if ((await getActiveSlideIndex(master)) === 15) {
        break;
      }
    }

    await expect
      .poll(() => getActiveSlideIndex(master), { timeout: 3000 })
      .toBe(15);
    await expect
      .poll(() => getActiveSlideIndex(thumbs), { timeout: 3000 })
      .toBe(15);
  });

  test('stepSlides: next/prev jumps by the configured step', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--step-by-3'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    await clickNext(carousel, 1);
    await waitActiveChange(carousel, initial);
    const afterNext = await getActiveSlideIndex(carousel);
    expect(afterNext).toBe(initial + 3);

    await clickPrev(carousel, 1);
    await waitActiveChange(carousel, afterNext);
    const afterPrev = await getActiveSlideIndex(carousel);
    expect(afterPrev).toBe(initial);
  });

  test('initialSlide: starts on the configured index', async ({ page }) => {
    await page.goto(story('whirli-carousel--initial-slide-middle'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);
    expect(initial).toBe(4);
  });

  test('initialSlide with loop keeps the configured index', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--initial-slide-with-loop'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);
    expect(initial).toBe(7);
  });

  test('projected slides: click selects the correct slide', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--projected-slides'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const targetIndex = 4;
    const target = carousel.locator(`[data-testid="slide-${targetIndex}"]`);
    await expect(target).toBeVisible();

    const before = await getActiveSlideIndex(carousel);
    await target.click({ force: true });
    await waitActiveChange(carousel, before);

    const after = await getActiveSlideIndex(carousel);
    expect(after).toBe(targetIndex);
  });

  test('projected complex content: inner controls click, but drag does not click', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--projected-slides-complex-content'));
    await waitCarouselReady(page);

    const count = page.getByTestId('projected-action-count');
    const button = page.getByTestId('projected-action-0');
    await expect(button).toBeVisible();

    await button.click();
    await expect(count).toHaveText('1');

    const box = await button.boundingBox();
    if (!box) {
      test.skip(true, 'Projected action button has no bounding box');
      return;
    }

    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + Math.min(20, box.width / 3), y, { steps: 6 });
    await page.waitForTimeout(250);
    await page.mouse.up();
    await page.waitForTimeout(300);

    await expect(count).toHaveText('1');
  });

  test('few slides (< slidesPerView) do not advance on next/prev', async ({
    page,
  }) => {
    await page.goto(
      story('whirli-carousel--few-slides-less-than-slides-per-view'),
    );
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    await clickNext(carousel, 1);
    await page.waitForTimeout(500);
    expect(await getActiveSlideIndex(carousel)).toBe(initial);

    await clickPrev(carousel, 1);
    await page.waitForTimeout(500);
    expect(await getActiveSlideIndex(carousel)).toBe(initial);
  });

  test('peekEdges adds container padding', async ({ page }) => {
    await page.goto(story('whirli-carousel--with-relative-peek-edges'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const padding = await carousel.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        left: parseFloat(style.paddingLeft || '0'),
        right: parseFloat(style.paddingRight || '0'),
      };
    });

    expect(padding.left).toBeGreaterThan(0);
    expect(padding.right).toBeGreaterThan(0);
  });

  test('peekEdges do not leave edge padding visible at start or end bounds', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--with-absolute-peek-edges'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const edgeMetrics = async () =>
      carousel.evaluate((el) => {
        const carouselRect = el.getBoundingClientRect();
        const firstSlide = el.querySelector('[data-testid="slide-0"]');
        const lastSlide = el.querySelector('[data-testid="slide-9"]');
        if (!firstSlide || !lastSlide) {
          throw new Error('Expected first and last slides to be rendered');
        }

        return {
          carouselLeft: carouselRect.left,
          carouselRight: carouselRect.right,
          firstSlideLeft: firstSlide.getBoundingClientRect().left,
          lastSlideRight: lastSlide.getBoundingClientRect().right,
        };
      });

    const start = await edgeMetrics();
    expect(Math.abs(start.firstSlideLeft - start.carouselLeft)).toBeLessThan(2);

    await clickNext(carousel, 10);
    await page.waitForTimeout(600);

    const end = await edgeMetrics();
    expect(Math.abs(end.lastSlideRight - end.carouselRight)).toBeLessThan(2);
  });
});

/**
 * Tests d'accessibilité
 */
test.describe('Accessibility', () => {
  test('carousel has proper ARIA roles', async ({ page }) => {
    await page.goto(story('whirli-carousel--looping'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Vérifier la structure ARIA
    const slides = carousel.locator('[data-testid^="slide-"]');
    const firstSlide = slides.first();

    await expect(firstSlide).toHaveAttribute('role', 'group');
    await expect(firstSlide).toHaveAttribute('aria-roledescription', 'slide');
    await expect(firstSlide).toHaveAttribute('aria-label', /\d+ of \d+/);
  });

  test('active slide has tabindex=0, others have tabindex=-1', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--looping'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    const activeSlide = carousel.locator('.slide--active');
    await expect(activeSlide).toHaveAttribute('tabindex', '0');

    const inactiveSlides = carousel.locator('.slide:not(.slide--active)');
    const count = await inactiveSlides.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(inactiveSlides.nth(i)).toHaveAttribute('tabindex', '-1');
    }
  });

  test('navigation buttons have descriptive labels', async ({ page }) => {
    await page.goto(story('whirli-carousel--looping'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    const nextBtn = carousel.getByRole('button', { name: /next slide/i });
    const prevBtn = carousel.getByRole('button', { name: /previous slide/i });

    await expect(nextBtn).toBeVisible();
    await expect(prevBtn).toBeVisible();
  });

  test('disabled slides have proper state', async ({ page }) => {
    await page.goto(story('whirli-carousel--disabled-slides'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Les slides 2 et 5 sont désactivées dans cette story
    const disabled2 = carousel.locator('[data-testid="slide-2"]');

    await expect(disabled2).toHaveClass(/slide--disabled/);

    // La slide désactivée devrait avoir pointer-events: none
    const pointerEvents = await disabled2.evaluate(
      (el) => window.getComputedStyle(el).pointerEvents,
    );

    expect(pointerEvents).toBe('none');
  });
});

/**
 * Tests de régression
 */
test.describe('Regression Tests', () => {
  test('BUG-001: Virtual loop with small totalSlides does not crash', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--virtual-loop-small-total'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Naviguer plusieurs fois sans crash
    for (let i = 0; i < 10; i++) {
      await clickNext(carousel, 1);
      await page.waitForTimeout(300);

      // Vérifier l'intégrité après chaque navigation
      await assertCarouselIntegrity(carousel);
    }
  });

  test('BUG-002: Rapid clicks do not create multiple active slides', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--looping'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Cliquer rapidement 10 fois
    for (let i = 0; i < 10; i++) {
      await clickNext(carousel, 1);
      // Pas de délai
    }

    // Attendre que tout se stabilise
    await page.waitForTimeout(1000);

    // Doit toujours avoir exactement 1 slide active
    const activeSlides = carousel.locator('.slide--active');
    await expect(activeSlides).toHaveCount(1);
  });

  test('BUG-003: Center mode with loop does not lose slides', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--loop-and-center'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Faire un tour complet
    const totalSlides = 10; // Selon la story
    for (let i = 0; i < totalSlides + 2; i++) {
      await clickNext(carousel, 1);
      await page.waitForTimeout(400);
    }

    // Vérifier qu'on peut toujours naviguer
    await assertCarouselIntegrity(carousel);
  });
});

/**
 * Tests for new features and combinations
 */
test.describe('Advanced Features', () => {
  test('peek edges (absolute): adds fixed pixel padding', async ({ page }) => {
    await page.goto(story('whirli-carousel--with-absolute-peek-edges'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Check padding is applied
    const padding = await carousel.evaluate((el: Element) => {
      const style = window.getComputedStyle(el);
      return {
        left: parseFloat(style.paddingLeft || '0'),
        right: parseFloat(style.paddingRight || '0'),
      };
    });

    // Should have padding (exact value depends on config)
    expect(padding.left).toBeGreaterThan(0);
    expect(padding.right).toBeGreaterThan(0);
  });

  test('notCenterBounds + loop: navigation works correctly', async ({
    page,
  }) => {
    await page.goto(story('whirli-carousel--not-center-bounds-with-loop'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Navigate multiple times
    for (let i = 0; i < 5; i++) {
      const before = await getActiveSlideIndex(carousel);
      await clickNext(carousel, 1);
      await waitActiveChange(carousel, before, { loop: true });

      // Verify integrity
      await assertCarouselIntegrity(carousel);
    }
  });

  test('notCenterBounds + rewind: navigation works correctly', async ({
    page,
  }) => {
    await page.goto(
      story('whirli-carousel--not-center-bounds-with-rewind'),
    );
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Navigate to end
    await clickNext(carousel, 10);
    await page.waitForTimeout(1000);

    // Verify still works
    await assertCarouselIntegrity(carousel);
  });

  test('step slides larger than view: navigates correctly', async ({
    page,
  }) => {
    await page.goto(
      story('whirli-carousel--step-slides-larger-than-view'),
    );
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    // Should jump by step size (5)
    await clickNext(carousel, 1);
    await waitActiveChange(carousel, initial);

    const afterNext = await getActiveSlideIndex(carousel);
    // Should have moved significantly (step=5)
    expect(afterNext).toBeGreaterThanOrEqual(initial + 3);
  });

  test('step slides with loop: wraps correctly', async ({ page }) => {
    await page.goto(story('whirli-carousel--step-slides-with-loop'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Navigate full circle
    for (let i = 0; i < 8; i++) {
      const before = await getActiveSlideIndex(carousel);
      await clickNext(carousel, 1);
      await waitActiveChange(carousel, before, { loop: true });
    }

    // Should still be valid
    await assertCarouselIntegrity(carousel);
  });

  test('step slides with rewind: rewinds to start', async ({ page }) => {
    await page.goto(story('whirli-carousel--step-slides-with-rewind'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Navigate to end: with stepSlides=2 and lastSlideAnchor=9
    // 0 → 2 → 4 → 6 → 8 → 10 (exceeds 9, triggers rewind to 0)
    await clickNext(carousel, 5);
    await page.waitForTimeout(1000);

    // After 5 clicks, should have rewound to 0
    const afterRewind = await getActiveSlideIndex(carousel);
    expect(afterRewind).toBe(0);
  });
});
