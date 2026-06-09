import { Page, Locator, expect } from '@playwright/test';

/**
 * Configuration des timeouts selon le mode du carousel
 */
export const TIMEOUTS = {
  TRANSITION_DEFAULT: 500,
  TRANSITION_VIRTUAL: 800,
  TRANSITION_LOOP: 600,
  TRANSITION_VIRTUAL_LOOP: 1000,
  WAIT_AFTER_DRAG: 600,
  WAIT_AFTER_DRAG_FREE_MODE: 800,
  POLL_ACTIVE_CHANGE: 2000,
  POLL_ACTIVE_CHANGE_VIRTUAL: 3000,
} as const;

/**
 * Configuration du drag selon le contexte
 */
export const DRAG_CONFIG = {
  DISTANCE_DEFAULT: -700,
  DISTANCE_VIRTUAL: -900,
  DISTANCE_LOOP: -900,
  DISTANCE_SHORT: -150,
  STEPS_DEFAULT: 15,
  STEPS_FAST: 8,
  STEP_DELAY_DEFAULT: 10,
  STEP_DELAY_FAST: 5,
  STEPS_REALISTIC: 40,
  STEP_DELAY_REALISTIC: 25,
} as const;

/**
 * Types helper
 */
export type CarouselMode = {
  virtual?: boolean;
  loop?: boolean;
  freeMode?: boolean;
  rtl?: boolean;
  vertical?: boolean;
};

/**
 * Calcule le timeout approprié selon le mode
 */
export function getTimeout(
  mode: CarouselMode,
  action: 'transition' | 'poll' = 'transition',
): number {
  if (action === 'poll') {
    return mode.virtual
      ? TIMEOUTS.POLL_ACTIVE_CHANGE_VIRTUAL
      : TIMEOUTS.POLL_ACTIVE_CHANGE;
  }

  if (mode.virtual && mode.loop) {
    return TIMEOUTS.TRANSITION_VIRTUAL_LOOP;
  }
  if (mode.virtual) {
    return TIMEOUTS.TRANSITION_VIRTUAL;
  }
  if (mode.loop) {
    return TIMEOUTS.TRANSITION_LOOP;
  }
  return TIMEOUTS.TRANSITION_DEFAULT;
}

/**
 * Calcule la distance de drag appropriée selon le mode
 */
export function getDragDistance(mode: CarouselMode): number {
  if (mode.virtual || mode.loop) {
    return DRAG_CONFIG.DISTANCE_VIRTUAL;
  }
  return DRAG_CONFIG.DISTANCE_DEFAULT;
}

/**
 * Attend que le carousel soit prêt (layout + images)
 */
export async function waitCarouselReady(
  page: Page,
  options?: { timeout?: number },
) {
  const timeout = options?.timeout ?? 3000;

  // Attendre le carousel
  await page.locator('.carousel').first().waitFor({ timeout });

  // Attendre qu'il y ait des slides
  await page.waitForSelector('[data-testid^="slide-"]', { timeout });

  // Attendre le layout-ready
  await page
    .locator('.carousel.layout-ready')
    .first()
    .waitFor({ timeout })
    .catch(() => {
      console.warn('Layout-ready class not found, continuing anyway');
    });

  // Petit délai pour les transitions initiales
  await page.waitForTimeout(100);
}

/**
 * Vérifie l'intégrité de l'état du carousel
 */
export async function assertCarouselIntegrity(carousel: Locator) {
  // Exactement 1 slide active
  const activeSlides = carousel.locator('.slide--active');
  await expect(activeSlides).toHaveCount(1);

  // L'index actif est valide
  const activeIndex = await getActiveSlideIndex(carousel);
  expect(activeIndex).toBeGreaterThanOrEqual(0);

  // La slide active est visible
  await expect(activeSlides.first()).toBeVisible();
}

/**
 * Obtient l'index de la slide active
 */
export async function getActiveSlideIndex(carousel: Locator): Promise<number> {
  const slides = carousel.locator('[data-testid^="slide-"].slide--active');
  const count = await slides.count();

  if (count === 0) {
    return -1;
  }

  const testId = await slides.first().getAttribute('data-testid');
  return testId ? Number(testId.replace('slide-', '')) : -1;
}

/**
 * Real (programmatic / intent) active index, exposed by the carousel host via
 * `data-real-index`. Use this when the test cares about what the user *asked
 * for* (slideTo, click), not what is currently visible. In residual zones
 * (notCenterBounds, freeMode, spv-fraction), this can differ from
 * `getActiveSlideIndex` which returns the perceived index.
 */
export async function getRealActiveIndex(carousel: Locator): Promise<number> {
  const v = await carousel.getAttribute('data-real-index');
  return v ? Number(v) : -1;
}

/**
 * Attend qu'une slide différente devienne active
 */
export async function waitActiveChange(
  carousel: Locator,
  from: number,
  mode: CarouselMode = {},
): Promise<number> {
  const timeout = getTimeout(mode, 'poll');

  return await expect
    .poll(
      async () => {
        const current = await getActiveSlideIndex(carousel);
        return current;
      },
      { timeout, intervals: [100, 250, 500] },
    )
    .not.toBe(from)
    .then(() => getActiveSlideIndex(carousel));
}

/**
 * Drag optimisé avec configuration selon le contexte
 */
export async function dragCarousel(
  page: Page,
  carousel: Locator,
  options: {
    distance?: number;
    mode?: CarouselMode;
    fast?: boolean;
  } = {},
): Promise<void> {
  const { mode = {}, fast = false } = options;
  const distance = options.distance ?? getDragDistance(mode);
  const waitAfter = mode.freeMode
    ? TIMEOUTS.WAIT_AFTER_DRAG_FREE_MODE
    : TIMEOUTS.WAIT_AFTER_DRAG;

  const handle = carousel.locator('.slides');
  await handle.waitFor();
  await handle.scrollIntoViewIfNeeded();

  const box = await handle.boundingBox();
  if (!box) {
    throw new Error('Cannot get bounding box of slides container');
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  // Commencer le drag
  await page.mouse.move(startX, startY);
  await page.waitForTimeout(50);
  await page.mouse.down();
  await page.waitForTimeout(50);

  // Effectuer le drag
  const steps = fast ? DRAG_CONFIG.STEPS_FAST : DRAG_CONFIG.STEPS_DEFAULT;
  const stepDelay = fast
    ? DRAG_CONFIG.STEP_DELAY_FAST
    : DRAG_CONFIG.STEP_DELAY_DEFAULT;

  const offsetX = mode.vertical ? 0 : distance;
  const offsetY = mode.vertical ? distance : 0;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await page.mouse.move(startX + offsetX * t, startY + offsetY * t);
    await page.waitForTimeout(stepDelay);
  }

  await page.mouse.up();

  // Attendre que les transitions se terminent
  await page.waitForTimeout(waitAfter);
}

/**
 * Vérifie qu'un drag a bien eu effet (translation CSS)
 */
export async function assertDragHadEffect(carousel: Locator): Promise<void> {
  const slidesContainer = carousel.locator('.slides');
  const transform = await slidesContainer.evaluate((el) => {
    return window.getComputedStyle(el).transform;
  });

  expect(transform).not.toBe('none');
  expect(transform).toContain('matrix');
}

/**
 * Trouve une slide cliquable selon des critères
 */
export async function findClickableSlide(
  carousel: Locator,
  options: {
    notActive?: boolean;
    notDisabled?: boolean;
    preferredIndex?: number;
  } = {},
): Promise<{ locator: Locator; index: number } | null> {
  const { notActive = true, notDisabled = true, preferredIndex } = options;

  let selector = '[data-testid^="slide-"]';

  if (notActive) {
    selector += ':not(.slide--active)';
  }

  if (notDisabled) {
    selector += ':not(.slide--disabled)';
  }

  const candidates = carousel.locator(selector);
  const count = await candidates.count();

  if (count === 0) {
    return null;
  }

  // Essayer l'index préféré d'abord
  if (preferredIndex !== undefined) {
    const preferred = carousel.locator(
      `[data-testid="slide-${preferredIndex}"]`,
    );
    if ((await preferred.count()) > 0) {
      const isVisible = await preferred.isVisible();
      const inViewport = isVisible
        ? await isSlideInViewport(preferred, carousel)
        : false;
      if (isVisible && inViewport) {
        return { locator: preferred, index: preferredIndex };
      }
    }
  }

  // Sinon, chercher la première slide VISIBLE ET DANS LE VIEWPORT
  for (let i = 0; i < count; i++) {
    const candidate = candidates.nth(i);
    const isVisible = await candidate.isVisible();

    if (isVisible) {
      // AJOUT : Vérifier qu'elle est dans le viewport
      const inViewport = await isSlideInViewport(candidate, carousel);

      if (inViewport) {
        const testId = await candidate.getAttribute('data-testid');
        const index = testId ? Number(testId.replace('slide-', '')) : -1;

        if (index >= 0) {
          return { locator: candidate, index };
        }
      }
    }
  }

  return null;
}

/**
 * Vérifie si une slide est dans le viewport
 */
export async function isSlideInViewport(
  slide: Locator,
  carousel: Locator,
  threshold: number = 0.5,
): Promise<boolean> {
  return await slide.evaluate(
    (slideEl, { carouselEl, threshold }) => {
      if (!carouselEl) {
        return false;
      }
      const slideRect = slideEl.getBoundingClientRect();
      const carouselRect = carouselEl.getBoundingClientRect();
      const isVertical = carouselEl.classList.contains('carousel--vertical');

      const visibleWidth = Math.max(
        0,
        Math.min(slideRect.right, carouselRect.right) -
          Math.max(slideRect.left, carouselRect.left),
      );
      const visibleHeight = Math.max(
        0,
        Math.min(slideRect.bottom, carouselRect.bottom) -
          Math.max(slideRect.top, carouselRect.top),
      );

      const visibleMain = isVertical ? visibleHeight : visibleWidth;
      const sizeMain = isVertical ? slideRect.height : slideRect.width;
      if (!sizeMain) {
        return false;
      }
      const visibilityRatio = visibleMain / sizeMain;
      return visibilityRatio >= threshold;
    },
    { carouselEl: await carousel.elementHandle(), threshold },
  );
}

export async function clickNext(
  carousel: Locator,
  times: number = 1,
  mode: CarouselMode = {},
): Promise<{ clicked: number; blocked: boolean }> {
  // En RTL, "Next" physique fait reculer l'index
  const buttonName = mode.rtl ? /previous slide/i : /next slide/i;
  const button = carousel.getByRole('button', { name: buttonName });
  let clicked = 0;
  const timeout = getTimeout(mode);

  for (let i = 0; i < times; i++) {
    if ((await button.count()) === 0) {
      return { clicked, blocked: true };
    }

    const visible = await button.isVisible().catch(() => false);
    if (!visible) {
      return { clicked, blocked: true };
    }

    const clickedButton = await button
      .click({ timeout: timeout + 400 })
      .then(() => true)
      .catch(() => false);
    if (!clickedButton) {
      return { clicked, blocked: true };
    }
    clicked++;

    if (i < times - 1) {
      await carousel.page().waitForTimeout(timeout / 2);
    }
  }

  return { clicked, blocked: false };
}

export async function clickPrev(
  carousel: Locator,
  times: number = 1,
  mode: CarouselMode = {},
): Promise<{ clicked: number; blocked: boolean }> {
  const buttonName = mode.rtl ? /next slide/i : /previous slide/i;
  const button = carousel.getByRole('button', { name: buttonName });
  let clicked = 0;
  const timeout = getTimeout(mode);

  for (let i = 0; i < times; i++) {
    if ((await button.count()) === 0) {
      return { clicked, blocked: true };
    }

    const visible = await button.isVisible().catch(() => false);
    if (!visible) {
      return { clicked, blocked: true };
    }

    const clickedButton = await button
      .click({ timeout: timeout + 400 })
      .then(() => true)
      .catch(() => false);
    if (!clickedButton) {
      return { clicked, blocked: true };
    }
    clicked++;

    if (i < times - 1) {
      await carousel.page().waitForTimeout(timeout / 2);
    }
  }

  return { clicked, blocked: false };
}

/**
 * Debug helper : affiche l'état du carousel
 */
export async function debugCarouselState(
  carousel: Locator,
  label: string = '',
) {
  const activeIndex = await getActiveSlideIndex(carousel);
  const activeCount = await carousel.locator('.slide--active').count();
  const rendered = await carousel.locator('[data-testid^="slide-"]').count();

  console.log(`[DEBUG${label ? ` ${label}` : ''}]`, {
    activeIndex,
    activeCount,
    rendered,
  });
}

export async function countVisibleSlides(slidesContainer: Locator) {
  return await slidesContainer.locator('[data-testid^="slide-"]').evaluateAll(
    (nodes, container) => {
      if (!container) return 0;
      const parentRect = container.getBoundingClientRect();
      return nodes.reduce((acc, el) => {
        const r = el.getBoundingClientRect();
        const visibleWidth = Math.max(
          0,
          Math.min(r.right, parentRect.right) -
            Math.max(r.left, parentRect.left),
        );
        const visibleHeight = Math.max(
          0,
          Math.min(r.bottom, parentRect.bottom) -
            Math.max(r.top, parentRect.top),
        );
        const visibleArea = visibleWidth * visibleHeight;
        const area = r.width * r.height || 1;
        return acc + (visibleArea / area >= 0.5 ? 1 : 0);
      }, 0);
    },
    await slidesContainer.elementHandle(),
  );
}

export async function waitStoryReady(page: Page) {
  await page.locator('.carousel').first().waitFor();
  await page.waitForSelector('[data-testid^="slide-"]');

  // Attendre que le layout soit prêt
  await page
    .locator('.carousel.layout-ready')
    .first()
    .waitFor({ timeout: 3000 })
    .catch(() => null);

  // Attendre un petit délai pour que les transitions initiales se terminent
  await page.waitForTimeout(100);
}

export function firstCarousel(page: Page) {
  return page.locator('.carousel').first();
}

export async function getRenderedIndices(scope: Page | Locator): Promise<number[]> {
  const indices: number[] = await scope
    .locator('[data-testid^="slide-"]')
    .evaluateAll((els) =>
      els
        .map((el) => (el as HTMLElement).getAttribute('data-testid') || '')
        .map((s) => Number(s.replace('slide-', '')))
        .filter((n) => Number.isFinite(n)),
    );

  return Array.from(new Set(indices)).sort((a: number, b: number) => a - b);
}

export async function clickNextUntilStop(
  carousel: Locator,
  maxSteps: number,
  mode: CarouselMode = {},
) {
  let prev = await getActiveSlideIndex(carousel);
  const timeout = getTimeout(mode);

  for (let i = 0; i < maxSteps; i++) {
    const res = await clickNext(carousel, 1, mode);
    if (res.blocked) {
      return { stoppedAt: prev, steps: i };
    }
    await carousel.page().waitForTimeout(timeout / 2);
    const cur = await getActiveSlideIndex(carousel);
    if (cur === prev) return { stoppedAt: cur, steps: i + 1 };
    prev = cur;
  }
  return { stoppedAt: prev, steps: maxSteps };
}

export async function clickPrevUntilStop(
  carousel: Locator,
  maxSteps: number,
  mode: CarouselMode = {},
) {
  let prev = await getActiveSlideIndex(carousel);
  const timeout = getTimeout(mode);

  for (let i = 0; i < maxSteps; i++) {
    const res = await clickPrev(carousel, 1, mode);
    if (res.blocked) {
      return { stoppedAt: prev, steps: i };
    }
    await carousel.page().waitForTimeout(timeout / 2);
    const cur = await getActiveSlideIndex(carousel);
    if (cur === prev) return { stoppedAt: cur, steps: i + 1 };
    prev = cur;
  }
  return { stoppedAt: prev, steps: maxSteps };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export async function dragSlides(
  page: Page,
  carousel: Locator,
  options: {
    distance?: number;
    mode?: CarouselMode;
    fast?: boolean;
  } = {},
): Promise<void> {
  const { mode = {}, fast = false } = options;
  const distance = options.distance ?? getDragDistance(mode);
  const waitAfter = mode.freeMode
    ? TIMEOUTS.WAIT_AFTER_DRAG_FREE_MODE
    : TIMEOUTS.WAIT_AFTER_DRAG;

  const handle = carousel.locator('.slides');
  await handle.waitFor();
  await handle.scrollIntoViewIfNeeded();

  const box = await carousel.boundingBox();
  if (!box) {
    throw new Error('Cannot get bounding box of slides container');
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.waitForTimeout(30);
  await page.mouse.down();

  const offsetX = mode.vertical ? 0 : distance;
  const offsetY = mode.vertical ? distance : 0;

  const rawEndX = startX + offsetX;
  const rawEndY = startY + offsetY;
  const margin = 5;
  const endX = clamp(rawEndX, box.x + margin, box.x + box.width - margin);
  const endY = clamp(rawEndY, box.y + margin, box.y + box.height - margin);

  await page.mouse.move(endX, endY, {
    steps: 12,
  });
  // Keep drag duration above swipe threshold to avoid swipe-only handling.
  await page.waitForTimeout(250);
  await page.mouse.up();

  await page.waitForTimeout(waitAfter);
}
