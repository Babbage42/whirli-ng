# Whirli

A lightweight, dependency-free carousel component for Angular, published as `whirli-ng`.
Designed to be easy to drop into an app, while still covering advanced carousel needs: drag, loop, virtual slides, projected content, thumbs, SSR-friendly responsive layouts, external controls, and a rich event API.

## Start Here

**TL;DR: open the Playground first.**

The Playground is the main entry point for the library. It is designed as an interactive documentation surface: configure every major feature, see the result live, inspect state/events, enable didactic mode, copy the generated Angular code, and share a URL for any setup.

- **Playground:** [https://babbage42.github.io/whirli-ng/playground/](https://babbage42.github.io/whirli-ng/playground/)
- **Storybook:** [https://babbage42.github.io/whirli-ng/?path=/docs/whirli-carousel--docs](https://babbage42.github.io/whirli-ng/?path=/docs/whirli-carousel--docs)

Use them like this:

| Tool | Best for |
| ---- | -------- |
| **Playground** | Complete interactive docs, real-time configuration, didactic explanations, generated code, shared setups. |
| **Storybook** | Curated stories, regression-friendly examples, isolated feature cases and visual checks. |
| **README** | Quick start, API overview, integration notes, and troubleshooting. |

The written documentation below is intentionally a companion to the Playground. If you want the fastest understanding of the carousel API, behavior, and edge cases, start with the Playground and use this README as a reference.

---

## Features

### Core Features
- **Mouse & touch drag** with smooth animations and momentum
- **Loop or rewind** navigation for infinite-style scrolling
- **Free mode** scrolling with inertia
- **Center mode** with bounds handling for edge slides
- **Peek edges** while keeping the first and last positions flush
- **Built-in or external UI** for navigation and pagination
- **Keyboard navigation** with accessibility support

### Advanced Features
- **Virtual scrolling** for large datasets
- **Thumbnail carousel** sync via `thumbsFor`
- **RTL support** for right-to-left layouts
- **Vertical axis** for up/down carousels
- **Autoplay** with pause/resume options
- **Mouse wheel** navigation
- **SSR-friendly responsive breakpoints**
- **Projected custom content** with the `*slide` directive
- **CSS-variable styling API** for visual customization
- **TypeScript API** with strongly typed inputs and outputs

### Quality
- **Automated e2e and unit coverage** for core behavior and edge cases
- **Standalone Angular components**
- **SSR/hydration checks** for the playground
- **Regression stories** for feature combinations such as `marginEnd`, projected slides, external controls, virtual loop, RTL, vertical axis, and peek edges

---

## 1. Installation

```bash
npm install whirli-ng
# or
yarn add whirli-ng
# or
pnpm add whirli-ng
```

Then import the components / directives you need from the library:

```ts
import { CarouselComponent, PaginationExternalComponent, NavigationLeftExternalComponent, NavigationRightExternalComponent, SlideDirective, CarouselNavLeftDirective, CarouselNavRightDirective } from "whirli-ng";
```

All components are **standalone**, so you can add them directly to `imports` in your Angular components.

---

## 2. Quick start

### 2.1. Basic carousel with image URLs

The simplest usage is to pass an array of image URLs through the `slides` input:

```ts
import { Component } from "@angular/core";
import { CarouselComponent } from "whirli-ng";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CarouselComponent],
  template: ` <whirli-carousel [slides]="slides" [slidesPerView]="3" [spaceBetween]="10"></whirli-carousel> `,
})
export class HomeComponent {
  slides = ["https://via.placeholder.com/400x250?text=Slide+1", "https://via.placeholder.com/400x250?text=Slide+2", "https://via.placeholder.com/400x250?text=Slide+3", "https://via.placeholder.com/400x250?text=Slide+4"];
}
```

This gives you:

- Horizontal carousel
- Drag support (mouse and touch)
- Default navigation arrows
- Pagination dots (dynamic) if enabled

---

### 2.2. Custom slide content with `*slide`

If you want more than images (cards, buttons, text, etc.), you can project custom content using `SlideDirective` (`*slide`):

```ts
import { Component } from "@angular/core";
import { CarouselComponent, SlideDirective } from "whirli-ng";

@Component({
  selector: "app-custom-slides",
  standalone: true,
  imports: [CarouselComponent, SlideDirective],
  template: `
    <whirli-carousel [slidesPerView]="3" [spaceBetween]="10">
      <div *slide class="my-slide">
        <img src="https://via.placeholder.com/300x200?text=A" />
        <h3>Slide A</h3>
      </div>

      <div *slide class="my-slide">
        <img src="https://via.placeholder.com/300x200?text=B" />
        <h3>Slide B</h3>
      </div>

      <div *slide class="my-slide">
        <img src="https://via.placeholder.com/300x200?text=C" />
        <h3>Slide C</h3>
      </div>
    </whirli-carousel>
  `,
})
export class CustomSlidesComponent {}
```

Rules:

- If `slides` input is provided and non‑empty, it is used.
- Otherwise, projected `*slide` content is used.
- If neither is provided, raw `<ng-content>` is rendered (not recommended for normal usage).

---

## 3. Core inputs

Below is a list of the main inputs you will typically configure.  
Types and defaults come directly from `carousel.component.ts`.

### 3.1. Data & layout

| Input           | Type                               | Default | Description                                                                                                                  |
| --------------- | ---------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `slides`        | `Slide[]` (`string[]` in examples) | `[]`    | Array of slide values. In the default template, each slide is treated as an image URL.                                       |
| `slidesPerView` | `number \| 'auto'`                 | `1`     | Number of slides visible at once. Use `'auto'` to let slides size based on their content (`grid-auto-columns: max-content`). |
| `spaceBetween`  | `number`                           | `0`     | Horizontal space (in pixels) between slides.                                                                                 |
| `stepSlides`    | `number`                           | `1`     | How many slides to move on each `Prev` / `Next` navigation.                                                                  |
| `marginStart`   | `number`                           | `0`     | Extra margin before the first slide, in pixels.                                                                              |
| `marginEnd`     | `number`                           | `0`     | Extra margin after the last slide, in pixels.                                                                                |
| `initialSlide`  | `number`                           | `0`     | Initial logical slide index when the carousel initializes.                                                                   |

---

### 3.2. Controls & UI

| Input                | Type                      | Default                                                     | Description                                                                                     |
| -------------------- | ------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `showControls`       | `boolean`                 | `true`                                                      | Show / hide built‑in navigation arrows.                                                         |
| `alwaysShowControls` | `boolean`                 | `false`                                                     | When `true`, arrows are always visible (no auto‑hide).                                          |
| `iconSize`           | `number`                  | `50`                                                        | Size of the built-in navigation arrow icons.                                                     |
| `pagination`         | `Pagination \| undefined` | `{ type: 'dynamic_dot', clickable: true, external: false }` | Controls pagination behavior and whether dots are rendered inside the carousel or externally.   |
| `slideOnClick`       | `boolean`                 | `true`                                                      | When `true`, clicking a slide moves the carousel to that slide.                                 |
| `debug`              | `boolean`                 | `false`                                                     | When `true`, shows debug info overlay with slide indices and state.                             |

**Internal vs external pagination**

If `pagination.external === false` (default), dots are rendered inside the carousel.  
If you set `pagination.external === true`, you can render `<whirli-pagination>` yourself elsewhere and wire its `(goToSlide)` output to `slideTo()`.

**Navigation styling variables**

Use CSS variables for visual-only navigation tweaks. They keep the Angular API focused on behavior while still allowing design overrides.

| CSS variable                         | Default | Description                                  |
| ------------------------------------ | ------- | -------------------------------------------- |
| `--whirli-nav-inline-offset`       | `0px`   | Moves horizontal arrows inward or outward.   |
| `--whirli-nav-block-offset`        | `0px`   | Moves arrows along the cross/block axis.     |

```scss
whirli-carousel {
  --whirli-nav-inline-offset: 8px;
  --whirli-nav-block-offset: -4px;
}
```

These names are intentionally grouped under the `whirli` namespace and mirrored in the Playground CSS API panel.

---

### 3.3. Scrolling, loop & behavior

| Input             | Type                                                      | Default | Description                                                                                                  |
| ----------------- | --------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `loop`            | `boolean`                                                 | `false` | Enables true infinite loop mode by inserting loop slides.                                                    |
| `rewind`          | `boolean`                                                 | `false` | When `true`, going past the end rewinds to the beginning (and vice versa) without loop slides.               |
| `freeMode`        | `boolean`                                                 | `false` | When `true`, behaves like a free scroll strip with inertia. Swipes do not necessarily snap to single slides. |
| `mouseWheel`      | `boolean \| { horizontal?: boolean; vertical?: boolean }` | `false` | Enable navigation with the mouse wheel. Use `true` or specify axes.                                          |
| `dragThresholdRatio` | `number`                                                  | `0.6`   | Threshold controlling when a swipe should change slide. Swipes smaller than this value may snap back.        |
| `center`          | `boolean`                                                 | `false` | Center the active slide within the carousel.                                                                 |
| `notCenterBounds` | `boolean`                                                 | `false` | When `true` with `center`, prevents empty space at carousel edges. The first/last slides won't be centered if it would create gaps. |
| `resistance`      | `boolean`                                                 | `true`  | When `true`, dragging beyond bounds applies a resistance effect instead of clamping immediately.             |
| `virtual`         | `boolean`                                                 | `false` | Enables virtual scrolling (windowing) for performance with large lists (100+ slides).                        |
| `direction`       | `'ltr' \| 'rtl'`                                          | `'ltr'` | Text direction. Use `'rtl'` for right-to-left languages (automatically flips navigation).                    |
| `axis`            | `'horizontal' \| 'vertical'`                              | `'horizontal'` | Carousel axis. Use `'vertical'` for up/down scrolling.                                            |
| `lazyLoading`     | `boolean`                                                 | `true`  | Used internally to control loading strategy together with the `ImagesReady` directive.                       |

**Mode comparison guide:**

| Use case | Recommended settings |
|----------|---------------------|
| **Simple gallery** | Default settings work great |
| **Infinite scrolling** | `loop="true"` |
| **Wrap to start** | `rewind="true"` (no loop clones) |
| **Hero/spotlight** | `center="true"` + `slidesPerView="3"` |
| **Hero (no gaps)** | `center="true"` + `notCenterBounds="true"` |
| **Free scrolling** | `freeMode="true"` + `slidesPerView="auto"` |
| **Large dataset** | `virtual="true"` (100+ slides) |
| **Product thumbs** | Use two carousels with `thumbsFor` |
| **Vertical stories** | `[axis]="'vertical'"` + `autoplay` |
| **RTL language** | `direction="rtl"` |

---

### 3.4. Autoplay

```ts
autoplay = input(false, {
  transform: (value: boolean | AutoplayOptions) => { ... },
});
```

- **Type:** `boolean | AutoplayOptions`
- **Default:** `false`

When `autoplay` is:

- `false` → autoplay disabled
- `true` → default options are applied:

  ```ts
  const base: AutoplayOptions = {
    delay: 2500,
    pauseOnHover: true,
    pauseOnFocus: true,
    stopOnInteraction: true,
    disableOnHidden: true,
    resumeOnMouseLeave: true,
  };
  ```

- `{ delay?: number; pauseOnHover?: boolean; ... }` → merged with the base config

Autoplay starts automatically once the layout is ready and images are loaded.

---

### 3.5. Responsive `breakpoints`

```ts
breakpoints = input<CarouselResponsiveConfig>();
```

- **Type:** object keyed by media query strings
- **Purpose:** change carousel options based on viewport width using CSS media queries (SSR‑friendly).

Example:

```ts
<whirli-carousel
  [slides]="slides"
  [breakpoints]="{
    '(max-width: 768px)': { slidesPerView: 1.5, spaceBetween: 2 },
    '(min-width: 769px) and (max-width: 1024px)': {
      slidesPerView: 2.5,
      spaceBetween: 5
    },
    '(min-width: 1025px)': { slidesPerView: 3.5, spaceBetween: 1 }
  }"
></whirli-carousel>
```

For each media query you can provide a partial carousel configuration (e.g. `slidesPerView`, `spaceBetween`, `loop`, etc.).  
The library generates CSS based on these breakpoints and applies them both on the server and in the browser.

---

### 3.6. Advanced features

#### Virtual scrolling (windowing)

For carousels with many slides (100+), enable `virtual` mode for better performance:

```ts
<whirli-carousel
  [slides]="manySlides"
  [virtual]="true"
  [slidesPerView]="3"
></whirli-carousel>
```

Virtual mode renders only the visible slides plus a buffer, dramatically reducing DOM size and improving performance.

**Notes:**
- Works with `loop` mode for infinite virtual scrolling
- Automatically manages slide rendering as you navigate
- Best for uniform slide sizes

#### Thumbnails carousel

Link two carousels together (main + thumbnails) using `thumbsFor`:

```ts
<whirli-carousel
  #mainCarousel
  [slides]="slides"
  [slidesPerView]="1"
></whirli-carousel>

<whirli-carousel
  [slides]="slides"
  [slidesPerView]="5"
  [thumbsFor]="mainCarousel"
></whirli-carousel>
```

The thumbnail carousel automatically:
- Highlights the active thumbnail
- Syncs with main carousel navigation
- Allows clicking thumbnails to change main slide

#### Right-to-left (RTL) support

For RTL languages, set `direction="rtl"`:

```ts
<whirli-carousel
  [slides]="slides"
  [direction]="'rtl'"
></whirli-carousel>
```

This automatically:
- Reverses navigation direction (next/prev buttons)
- Flips keyboard shortcuts
- Mirrors the visual layout

#### Vertical carousel

For vertical scrolling:

```ts
<whirli-carousel
  [slides]="slides"
  [axis]="'vertical'"
  [slidesPerView]="3"
></whirli-carousel>
```

Keyboard navigation adapts: `ArrowUp`/`ArrowDown` instead of left/right.

---

## 4. Outputs

The carousel provides a comprehensive event system similar to SwiperJS, allowing you to react to all lifecycle, interaction, and navigation events.

### 4.1. Navigation Events

```ts
activeIndexChange = output<number>();     // Emitted when the active slide index changes
perceivedIndexChange = output<number>();  // Emitted when the visually perceived slide changes
slideNext = output<void>();               // Emitted when navigating next
slidePrev = output<void>();               // Emitted when navigating previous
```

**Example:**
```html
<whirli-carousel
  [slides]="slides"
  (activeIndexChange)="onSlideUpdate($event)"
  (perceivedIndexChange)="onPerceivedSlideUpdate($event)"
  (slideNext)="log('next')"
  (slidePrev)="log('prev')">
</whirli-carousel>
```

```ts
onSlideUpdate(index: number) {
  console.log('Current slide index:', index);
}

onPerceivedSlideUpdate(index: number) {
  console.log('Perceived slide index:', index);
}
```

### 4.2. Lifecycle Events

```ts
afterInit = output<void>();      // Emitted after carousel initialization
beforeDestroy = output<void>();  // Emitted before carousel destruction
imagesLoaded = output<void>();   // Emitted when all images are loaded
```

**Example:**
```html
<whirli-carousel
  [slides]="slides"
  (afterInit)="onCarouselReady()"
  (beforeDestroy)="cleanup()">
</whirli-carousel>
```

### 4.3. Interaction Events

```ts
touched = output<void>();                            // First user interaction (once)
touchStart = output<MouseEvent | TouchEvent>();      // Touch/mouse down inside the carousel
dragStart = output<MouseEvent | TouchEvent>();       // Confirmed drag intent
dragEnd = output<MouseEvent | TouchEvent>();         // Confirmed drag completed
translateChange = output<number>();                  // Emits translate value during drag
```

**Example:**
```html
<whirli-carousel
  [slides]="slides"
  (touched)="trackFirstInteraction()"
  (touchStart)="onPointerDown($event)"
  (dragStart)="onDragStart($event)"
  (dragEnd)="onDragEnd($event)"
  (translateChange)="onSlide($event)">
</whirli-carousel>
```

```ts
onPointerDown(event: MouseEvent | TouchEvent) {
  console.log('Pointer down', event);
}

onDragStart(event: MouseEvent | TouchEvent) {
  console.log('Drag started', event);
}

onSlide(translate: number) {
  console.log('Current translation:', translate);
}
```

### 4.4. Transition Events

```ts
transitionStart = output<void>();  // Emitted when CSS transition starts
transitionEnd = output<void>();    // Emitted when CSS transition ends
```

**Example:**
```html
<whirli-carousel
  [slides]="slides"
  (transitionStart)="showSpinner()"
  (transitionEnd)="hideSpinner()">
</whirli-carousel>
```

### 4.5. Progress Event

```ts
progress = output<number>();  // Emits 0-1 normalized progress value
```

This event emits the current scroll progress as a value between 0 and 1, where:
- `0` = at the start
- `0.5` = halfway through
- `1` = at the end

**Example - Progress bar:**
```html
<whirli-carousel
  [slides]="slides"
  (progress)="updateProgressBar($event)">
</whirli-carousel>

<div class="progress-bar">
  <div class="progress-fill" [style.width.%]="carouselProgress * 100"></div>
</div>
```

```ts
carouselProgress = 0;

updateProgressBar(progress: number) {
  this.carouselProgress = progress;
}
```

### 4.6. Click Events

```ts
slideClick = output<{ index: number; event: MouseEvent }>(); // Emitted when slide is clicked
```

**Example:**
```html
<whirli-carousel
  [slides]="slides"
  (slideClick)="onSlideClick($event)">
</whirli-carousel>
```

```ts
onSlideClick(data: { index: number; event: MouseEvent }) {
  console.log('Clicked slide:', data.index);
  // Custom handling (e.g., open modal, navigate, etc.)
}
```

### 4.7. Boundary Events

```ts
reachEnd = output<void>();    // Emitted when reaching the end
reachStart = output<void>();  // Emitted when reaching the start
```

**Example:**
```html
<whirli-carousel
  [slides]="slides"
  (reachEnd)="loadMoreSlides()"
  (reachStart)="onReachStart()">
</whirli-carousel>
```

### 4.8. Autoplay Events

```ts
autoplayStart = output<void>();  // Emitted when autoplay starts
autoplayStop = output<void>();   // Emitted when autoplay stops
autoplayPause = output<void>();  // Emitted when autoplay pauses
```

**Example:**
```html
<whirli-carousel
  [slides]="slides"
  [autoplay]="true"
  (autoplayStart)="log('Autoplay started')"
  (autoplayPause)="log('Autoplay paused')"
  (autoplayStop)="log('Autoplay stopped')">
</whirli-carousel>
```

### 4.9. Complete Event Monitoring Example

```ts
@Component({
  selector: 'app-monitored-carousel',
  template: `
    <whirli-carousel
      [slides]="slides"
      (afterInit)="log('Carousel initialized')"
      (activeIndexChange)="log('Slide changed to: ' + $event)"
      (progress)="updateProgress($event)"
      (transitionStart)="log('Transition started')"
      (transitionEnd)="log('Transition ended')"
      (touchStart)="log('Touch started')"
      (dragEnd)="log('Drag ended')"
      (slideClick)="handleSlideClick($event)"
      (reachEnd)="log('Reached end')"
      (beforeDestroy)="log('Carousel destroyed')">
    </whirli-carousel>

    <div class="progress">{{ (currentProgress * 100).toFixed(0) }}%</div>
  `
})
export class MonitoredCarouselComponent {
  slides = ['slide1.jpg', 'slide2.jpg', 'slide3.jpg'];
  currentProgress = 0;

  log(message: string) {
    console.log(`[Carousel Event] ${message}`);
  }

  updateProgress(progress: number) {
    this.currentProgress = progress;
  }

  handleSlideClick(data: { index: number; event: MouseEvent }) {
    console.log('Slide clicked:', data);
    // Custom logic here
  }
}
```

---

## 5. Advanced examples

### 5.1. Infinite loop with autoplay

```ts
<whirli-carousel
  [slides]="slides"
  [loop]="true"
  [autoplay]="{
    delay: 3000,
    pauseOnHover: true,
    stopOnInteraction: false
  }"
></whirli-carousel>
```

### 5.2. Centered carousel with custom step

```ts
<whirli-carousel
  [slides]="slides"
  [center]="true"
  [slidesPerView]="3"
  [stepSlides]="2"
  [spaceBetween]="20"
></whirli-carousel>
```

### 5.3. Free‑mode + mouse wheel

```ts
<whirli-carousel
  [slides]="slides"
  [freeMode]="true"
  [mouseWheel]="{ horizontal: true }"
  [slidesPerView]="'auto'"
  [spaceBetween]="12"
></whirli-carousel>
```

### 5.4. Virtual scrolling with loop

For large datasets with infinite loop:

```ts
<whirli-carousel
  [slides]="largeDataset"
  [virtual]="true"
  [loop]="true"
  [slidesPerView]="3"
  [spaceBetween]="10"
></whirli-carousel>
```

### 5.5. Center mode with notCenterBounds

Prevent empty space at edges while keeping slides centered:

```ts
<whirli-carousel
  [slides]="slides"
  [center]="true"
  [notCenterBounds]="true"
  [slidesPerView]="3"
></whirli-carousel>
```

**Behavior:**
- Middle slides: centered as normal
- First slides: aligned to start (no gap on left)
- Last slides: aligned to end (no gap on right)
- Perfect for hero carousels or featured content

### 5.6. Vertical RTL carousel with thumbnails

Combine multiple features:

```ts
<whirli-carousel
  #main
  [slides]="slides"
  [axis]="'vertical'"
  [direction]="'rtl'"
  [slidesPerView]="1"
  [autoplay]="{ delay: 3000 }"
></whirli-carousel>

<whirli-carousel
  [slides]="slides"
  [thumbsFor]="main"
  [slidesPerView]="5"
></whirli-carousel>
```

---

## 6. Keyboard support & accessibility

The carousel listens to keyboard events on its host:

**Horizontal mode:**
- `ArrowRight` → next slide (or prev in RTL)
- `ArrowLeft` → previous slide (or next in RTL)
- `Home` → first slide
- `End` → last slide

**Vertical mode:**
- `ArrowDown` → next slide
- `ArrowUp` → previous slide
- `Home` → first slide
- `End` → last slide

**Accessibility features:**
- Navigation buttons have proper `aria-label` attributes
- Active slide has `slide--active` class
- Disabled slides have `slide--disabled` class
- Keyboard navigation respects `loop` and `rewind` modes
- `aria-live="polite"` on slides container announces changes

**To improve accessibility:**

1. Add a descriptive label to the carousel:
   ```html
   <whirli-carousel [slides]="slides" aria-label="Product gallery"></whirli-carousel>
   ```

2. Ensure slides have meaningful alt text for images

3. Test with screen readers (NVDA, JAWS, VoiceOver)

---

## 7. Styling

The library ships with default styles for:

- Carousel container (`.carousel`)
- Slides wrapper (`.slides`)
- Slide items (`.slide`)
- Centered mode (`.carousel--center`)
- Debug overlays (only visible when `debug` is enabled)

Key points:

- Layout is implemented using CSS grid with horizontal flow.
- When `slidesPerView === 'auto'`, slides use `grid-auto-columns: max-content`.
- Styles are applied with `ViewEncapsulation.None`, so you can override them from your app’s global styles.

You can customize:

- Slide sizes (e.g. setting fixed width/height on `.slide` or its content)
- Colors and typography
- Spacing, backgrounds, hover states, etc.

---

## 8. Playground, Storybook & written docs

### Playground

The Playground is the recommended documentation entry point:

👉 **https://babbage42.github.io/whirli-ng/playground/**

It covers the full carousel surface in one place:

- live configuration for layout, navigation, interaction, pagination, autoplay, breakpoints, thumbs, virtual mode, SSR-sensitive setups and CSS variables;
- didactic mode with index overlays, snap map, event coach, decision trace and generated Angular code;
- shareable URLs, so any scenario can be saved, reproduced or discussed directly.

If you only have a few minutes, open the Playground first. It is meant to be the practical, exhaustive documentation experience.

### Storybook

Storybook complements the Playground with curated, isolated examples and regression-friendly stories:

- `loop`, `rewind`
- `center`, `notCenterBounds`
- `freeMode`, `mouseWheel`
- `marginStart`, `marginEnd`
- `breakpoints`, SSR-sensitive cases
- projected slides, external navigation, external pagination
- pagination and navigation options

👉 **https://babbage42.github.io/whirli-ng/?path=/docs/whirli-carousel--docs**

### Written README

The README stays useful for quick installation, API scanning, copy/paste examples and troubleshooting. It should not try to replace the Playground for every feature combination.

---

## 9. Public exports

The library currently exports at least:

```ts
import { CarouselComponent, CarouselNavLeftDirective, CarouselNavRightDirective, SlideDirective, PaginationExternalComponent, NavigationLeftExternalComponent, NavigationRightExternalComponent } from "whirli-ng";
```

- `CarouselComponent` – main carousel component.
- `SlideDirective` – structural directive enabling `*slide` projected slides.
- `CarouselNavLeftDirective`, `CarouselNavRightDirective` – directives used for custom navigation arrow templates.
- `PaginationExternalComponent` – renders the carousel pagination outside the carousel when `pagination.external` is enabled.
- `NavigationLeftExternalComponent`, `NavigationRightExternalComponent` – render the built-in navigation controls outside the carousel.

---

## 10. Troubleshooting

### Carousel not visible or slides overlap

**Problem:** Slides don't display correctly or overlap.

**Solution:** Ensure slides have explicit dimensions. The carousel uses CSS Grid, so slides need a defined size:

```css
.slide {
  width: 100%;
  height: 300px; /* or use aspect-ratio */
}

.slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Navigation buttons don't appear

**Problem:** Prev/next arrows are missing.

**Solutions:**
1. Check `showControls` is `true` (default)
2. In non-loop/non-rewind mode, buttons hide at boundaries
3. Set `alwaysShowControls="true"` to always show them
4. Check your CSS isn't hiding `.carousel-nav-button`

### Autoplay doesn't start

**Problem:** Carousel doesn't auto-advance.

**Solutions:**
1. Verify `autoplay` is configured: `[autoplay]="true"` or `[autoplay]="{ delay: 3000 }"`
2. Autoplay starts after images load - wait for `imagesLoaded` event
3. Check if `stopOnInteraction` stopped it after user interaction
4. Ensure carousel is visible (autoplay pauses on hidden elements)

### Drag/swipe not working

**Problem:** Can't drag slides.

**Solutions:**
1. Check `draggable` isn't set to `false` (it's `true` by default)
2. Ensure there's no CSS `pointer-events: none` blocking interactions
3. For touch devices, verify viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`

### Virtual mode shows blank slides

**Problem:** In virtual mode, some slides are blank.

**Solution:** Virtual mode requires slides to have uniform sizes. Use fixed dimensions:

```css
.slide {
  width: 300px;
  height: 200px;
}
```

### Performance issues with many slides

**Problem:** Carousel is slow with 100+ slides.

**Solution:** Enable virtual mode:
```ts
<whirli-carousel [slides]="manySlides" [virtual]="true"></whirli-carousel>
```

This renders only visible slides, dramatically improving performance.

### Slides don't center correctly

**Problem:** With `center="true"`, slides aren't centered.

**Solution:**
- For edge slides, use `notCenterBounds="true"` to prevent empty space
- Check `slidesPerView` - decimal values (e.g. `3.5`) work best with center mode
- Verify slide widths are consistent

### TypeScript errors with inputs

**Problem:** Type errors when setting carousel options.

**Solution:** Import types from the library:

```ts
import { CarouselComponent, AutoplayOptions, Pagination } from 'whirli-ng';

// Then use proper types
autoplayConfig: AutoplayOptions = {
  delay: 3000,
  pauseOnHover: true
};

paginationConfig: Pagination = {
  type: 'dot',
  clickable: true
};
```

---

## 11. Performance tips

1. **Use virtual mode** for 100+ slides
2. **Optimize images**: Use appropriate sizes, consider lazy loading
3. **Limit `slidesPerView`**: More slides = more DOM elements
4. **Disable debug mode** in production: `[debug]="false"`
5. **Use `freeMode`** sparingly: It's more CPU-intensive than snap mode
6. **Avoid complex slide content**: Keep slide templates simple
7. **Consider pagination over thumbnails**: Thumbnails double the carousel count

---

## 12. License

Add your license information here (MIT, etc.).
