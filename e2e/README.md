# Whirli E2E Tests

Playwright validates Whirli through Storybook stories and the SSR playground.
The goal is to exercise the carousel like a consumer would: DOM, pointer
interactions, keyboard, external controls, emitted events, and hydration.

## Structure

```text
e2e/
├── playwright.config.ts              # Storybook-based browser tests
├── playwright.ssr.config.ts          # SSR playground hydration tests
├── README.md
└── tests/
    ├── carousel.spec.ts              # Main scenario matrix + special cases
    ├── carousel-extra-tests.spec.ts  # Cross-cutting coverage
    ├── carousel-events.spec.ts       # Output/event contract coverage
    ├── carousel-margin-end.spec.ts   # marginEnd regressions
    ├── carousel-perceived-index.spec.ts
    ├── playground-ssr-cls.spec.ts    # SSR/no-JS/CSR stability
    └── helpers/carousel-test.helper.ts
```

## Commands

```bash
# Unit + e2e + SSR e2e, same command used by the pre-commit hook
npm test

# Storybook e2e only
npm run test:e2e

# SSR playground e2e only
npm run test:e2e:ssr

# One file or grep
npm run test:e2e -- e2e/tests/carousel-events.spec.ts
npm run test:e2e -- -g "pagination scrollbar"

# Debug
npm run test:e2e -- --ui
npx playwright show-trace test-results/.../trace.zip
```

The pre-commit hook currently runs `npm test`, so keep the suite green before
committing. If the hook becomes too heavy later, move the full suite to CI and
keep only a critical subset locally.

## Strategy

### Main matrix

`carousel.spec.ts` defines scenario capabilities such as `loop`, `virtual`,
`rtl`, `vertical`, `pagination`, `externalNavigation`, `slidesPerView=auto`,
`center`, `stepSlides`, and `peekEdges`.

Each reusable suite skips itself when a scenario does not support the feature.
This keeps coverage broad without duplicating test logic.

The matrix currently covers:

- basic fractional slides
- external navigation and external pagination
- projected content and projected content with `marginEnd`
- loop, rewind, free mode, mouse wheel
- RTL and vertical axis
- disabled slides, non-draggable mode, `slideOnClick=false`
- fixed and auto slide widths
- virtual, virtual loop, small virtual totals, virtual with auto widths
- center and not-center-bounds combinations
- step slides, peek edges

Special tests in the same file cover progress pagination, scrollbar pagination,
controller sync, responsive breakpoints, thumbs, autoplay, and edge cases.

### Cross-cutting tests

`carousel-extra-tests.spec.ts` covers behavior that is easier to express outside
the matrix:

- keyboard navigation and mappings
- autoplay pause/resume/stop behavior
- center-mode visual assertions
- performance and virtual-window sanity checks
- small slide totals
- projected slides
- relative/absolute peek edges
- accessibility checks
- historical regressions

### Dedicated regression suites

- `carousel-margin-end.spec.ts`: verifies that `marginEnd` is preserved after
  drag, `slideTo`, next/prev, pagination, fractional `slidesPerView`, and
  free-mode combinations.
- `carousel-perceived-index.spec.ts`: verifies perceived index behavior,
  especially at visual boundaries and in free mode.
- `playground-ssr-cls.spec.ts`: verifies that query state is used before
  hydration and that selected carousel geometries remain stable between no-JS
  SSR and hydrated CSR.

### Events

`carousel-events.spec.ts` uses dedicated Storybook probe stories that expose
event counters in the DOM. This avoids depending on Storybook Actions and keeps
assertions deterministic.

Covered outputs include:

- `afterInit`, `beforeDestroy` where practical
- `activeIndexChange`, `perceivedIndexChange`
- `slideNext`, `slidePrev`
- `touchStart`, `dragStart`, `dragEnd`, `touched`
- `translateChange`, `progress`
- `transitionStart`, `transitionEnd`
- `slideClick`
- `reachStart`, `reachEnd`
- `autoplayStart`, `autoplayPause`, `autoplayStop`
- `imagesLoaded` where the timing is testable

## Helpers

Shared helpers live in `tests/helpers/carousel-test.helper.ts`.

Common helpers:

```ts
clickNext(carousel, times, mode)
clickPrev(carousel, times, mode)
dragSlides(page, carousel, { distance, mode, fast })
waitActiveChange(carousel, fromIndex, mode)
getActiveSlideIndex(carousel)
getRenderedIndices(carousel)
findClickableSlide(carousel, options)
isSlideInViewport(slide, carousel, threshold)
assertCarouselIntegrity(carousel)
getTimeout(mode)
```

Prefer adding reusable behavior to helpers instead of repeating low-level
Playwright code in multiple files.

## Adding Coverage

Add a new matrix scenario when the feature should pass the standard carousel
contracts across navigation, drag, pagination, bounds, and accessibility.

Add a cross-cutting test when the behavior is global, very specific, or not tied
to a scenario capability.

Add a dedicated file only for focused regression areas that need many variants,
like `marginEnd`, perceived index, or SSR hydration stability.
