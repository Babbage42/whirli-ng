import {
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injectable,
  linkedSignal,
  Signal,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { Carousel, Slide, SnapDom } from './models/carousel.model';
import {
  extractVisibleSlides,
  getFixedSlideSize,
} from './helpers/calculations.helper';
import {
  AxisConfig,
  HORIZONTAL_AXIS_CONFIG,
  VERTICAL_AXIS_CONFIG,
} from './helpers/axis.helper';
import { positiveModulo } from './helpers/utils.helper';

@Injectable()
export class CarouselStore {
  private static readonly RESIDUAL_EDGE_TAIL_PX = 2;

  // All initial values.
  private readonly _state = signal<Carousel>({
    isProjected: false,
    hasReachedEnd: false,
    hasReachedStart: false,
    scrollWidth: 0,
    velocity: 0,
    fullWidth: 0,
    slidesIndexOrder: [],
    slidesWidths: [],
    allSlides: undefined,
    slidesElements: [] as ElementRef<HTMLElement>[],
    snapsDom: [],
    visibleDom: [],
    slides: [],
    slidesPerView: 1,
    spaceBetween: 0,
    showControls: true,
    alwaysShowControls: false,
    iconSize: 50,
    initialSlide: 0,
    freeMode: true,
    mouseWheel: false,
    dragThresholdRatio: 0.6,
    rewind: false,
    loop: false,
    center: false,
    notCenterBounds: false,
    centerWhenNotEnoughSlides: false,
    slideOnClick: true,
    resistance: true,
    lazyLoading: true,
    currentPosition: -1,
    totalSlidesVisible: 0,
    totalSlides: 0,
    uniqueCarouselId: '',
    currentTranslate: 0,
    currentRealPosition: 0,
    lastTranslate: 0,
    slideTranslates: [],
    minTranslate: 0,
    maxTranslate: 0,
    marginStart: 0,
    marginEnd: 0,
    firstSlideAnchor: 0,
    lastSlideAnchor: 0,
    stepSlides: 1,
    autoplay: false,
    draggable: true,
    canSwipe: true,
    peekEdges: undefined,
    keyboardNavigation: true,
    navigateSlideBySlide: false,
    thumbsOptions: undefined,
    direction: 'ltr',
    axis: 'horizontal',
    virtual: false,
    virtualStart: 0,
    virtualEnd: 0,
    virtualLoopStart: 0,
    perceivedIndex: -1,
    isDragging: false,
    a11y: {},
  });

  // Final state with all updated values.
  public readonly state: Signal<Carousel> = computed(() => {
    const update: Carousel = {
      ...this._state(),
      fullWidth: this.fullWidth(),
      scrollWidth: this.scrollWidth(),
      maxTranslate: this.maxTranslate(),
      minTranslate: this.minTranslate(),
      snapsDom: this.snapsDom(),
      visibleDom: this.visibleDom(),
      slideTranslates: this.slideTranslates(),
      slidesWidths: this.slidesWidths(),
      totalSlides: this.totalSlides(),
      totalSlidesVisible: this.totalSlidesVisible(),
      firstSlideAnchor: this.firstSlideAnchor(),
      lastSlideAnchor: this.lastSlideAnchor(),
      virtualRange: this.virtualRange(),
      virtualStart: this.virtualStart(),
      virtualEnd: this.virtualEnd(),
      renderedIndices: this.renderedIndices(),
      perceivedIndex: this.perceivedIndex(),
    };
    return update;
  });

  setCurrentPosition(newPos: number) {
    if (newPos !== this.currentPosition()) {
      this.patch({ currentPosition: newPos });
    }
  }

  /**
   * Tracks whether the user is currently dragging (used by perceivedIndex to
   * only activate the residual-zone subdivision while the user is actively
   * dragging — not during programmatic snap transitions).
   */
  readonly isDragging = computed(() => this._state().isDragging);

  readonly axisConf = computed<AxisConfig>(() =>
    this.isVertical() ? VERTICAL_AXIS_CONFIG : HORIZONTAL_AXIS_CONFIG,
  );

  // Expose common values.
  // This values are calculated and updated from carousel component (inputs or dom).
  readonly currentRealPosition = computed(() => {
    const { currentRealPosition } = this._state();
    const total = this.totalSlides();
    if (total <= 0) {
      return currentRealPosition;
    }

    return this.clampPosition(currentRealPosition, total);
  });
  readonly currentPosition = computed(() => {
    const { currentPosition } = this._state();
    const total = this.totalSlides();
    if (total <= 0) {
      return currentPosition;
    }
    return this.clampPosition(currentPosition, total);
  });

  readonly hasReachedStart = computed(() => this._state().hasReachedStart);
  readonly hasReachedEnd = computed(() => this._state().hasReachedEnd);
  readonly currentTranslate = computed(() => this._state().currentTranslate);
  readonly lastTranslate = computed(() => this._state().lastTranslate);
  readonly allSlides = computed(() => this._state().allSlides);
  readonly slides = computed(() => this._state().slides);
  readonly slidesIndexOrder = computed(() => this._state().slidesIndexOrder);
  readonly slidesElements = computed(() => this._state().slidesElements);
  readonly projectedSlides = computed(() => this._state().projectedSlides);
  // Real DOM order (may differ from slidesElements in loop mode).
  readonly domSlides = computed(() => {
    const slidesElements = this.slidesElements();
    if (!slidesElements.length) {
      return [];
    }

    if (this.virtual()) {
      return slidesElements.map((slide) => slide.nativeElement);
    }

    const order = this.slidesIndexOrder();
    if (!order.length || order.length !== slidesElements.length) {
      return slidesElements.map((slide) => slide.nativeElement);
    }

    return order
      .map((logicalIndex) => slidesElements[logicalIndex]?.nativeElement)
      .filter(Boolean);
  });

  readonly pagination = computed(() => this._state().pagination);
  readonly loop = computed(() => this._state().loop);
  readonly freeMode = computed(() => this._state().freeMode);
  readonly rewind = computed(() => this._state().rewind);
  readonly slidesPerView = computed(() => this._state().slidesPerView);
  readonly spaceBetween = computed(() => this._state().spaceBetween);
  readonly center = computed(() => this._state().center);
  readonly notCenterBounds = computed(() => this._state().notCenterBounds);
  readonly centerWhenNotEnoughSlides = computed(
    () => this._state().centerWhenNotEnoughSlides,
  );
  readonly marginStart = computed(() => this._state().marginStart);
  readonly marginEnd = computed(() => this._state().marginEnd);
  readonly draggable = computed(() => this._state().draggable);
  readonly canSwipe = computed(() => this._state().canSwipe);
  readonly resistance = computed(() => this._state().resistance);
  readonly slideOnClick = computed(() => this._state().slideOnClick);
  readonly thumbsOptions = computed(() => this._state().thumbsOptions);
  readonly navigateSlideBySlide = computed(
    () => this._state().navigateSlideBySlide,
  );
  readonly a11y = computed(() => this._state().a11y);
  readonly isRtl = computed(
    () => this._state().direction === 'rtl' && !this.isVertical(),
  );
  readonly isVertical = computed(() => this._state().axis === 'vertical');
  readonly virtual = computed(() => this._state().virtual);
  readonly virtualBuffer = computed(() => this._state().virtualBuffer);
  readonly virtualStart = computed(() => this._state().virtualStart);
  readonly virtualEnd = computed(() => this._state().virtualEnd);
  readonly virtualLoopStart = computed(() => this._state().virtualLoopStart);

  readonly peekEdges = computed(() => this._state().peekEdges);
  readonly peekOffset = computed(() => {
    const peek = this.peekEdges();
    if (!peek) {
      return 0;
    }

    if (this.center()) {
      return 0;
    }

    if (peek.absoluteOffset) {
      return peek.absoluteOffset;
    }

    const scrollWidth = this.scrollWidth();

    const widths = untracked(() => this.slidesWidths());
    const totalSlides = this.totalSlides();
    let baseWidth = widths[0] ?? 0;

    // Fallback
    if (!baseWidth) {
      const spv = this.slidesPerView();
      if (
        typeof spv === 'number' &&
        spv > 0 &&
        totalSlides > 0 &&
        scrollWidth > 0
      ) {
        baseWidth = scrollWidth / totalSlides;
      }
    }

    if (!baseWidth) {
      return 0;
    }

    return baseWidth * (peek.relativeOffset ?? 0);
  });

  // Computed, need to update manually in state.
  readonly fullWidth = computed(() =>
    this.axisConf().getContainerSize(
      this.allSlides()?.nativeElement as HTMLElement,
    ),
  );
  readonly scrollWidth = computed(() => {
    // We must watch any slides update.
    this.slidesWidths();
    return this.axisConf().getScrollSize(
      this.allSlides()?.nativeElement as HTMLElement,
    );
  });
  private sumWidths(from: number, to: number, fallback: number) {
    let sum = 0;
    const width = this.slidesWidths();
    const gap = this.spaceBetween();
    for (let i = from; i <= to; i++) {
      sum += width[i] ?? fallback;
      if (i < to - 1) {
        sum += gap;
      }
    }
    return sum;
  }

  readonly maxTranslate = computed(() => {
    if (this.virtual()) {
      const renderedIndices = this.renderedIndices();
      return (
        -(
          this.sumWidths(
            renderedIndices[0],
            renderedIndices[renderedIndices.length - 1],
            0,
          ) - this.fullWidth()
        ) - this.endOffset()
      );
    }

    const maxTranslate =
      -(this.scrollWidth() - this.fullWidth()) - this.endOffset();
    if (this.center() && !this.notCenterBounds()) {
      const width = this.slidesWidths()[0] ?? this.getFallbackSlideWidth();
      return maxTranslate - this.fullWidth() / 2 + width / 2;
    }
    return maxTranslate;
  });
  readonly minTranslate = computed(() => {
    const fullWidth = this.fullWidth();
    if (this.center() && !this.notCenterBounds()) {
      const width = this.slidesWidths()[0] ?? this.getFallbackSlideWidth();
      return fullWidth / 2 - width / 2;
    }
    return this.marginStart() - this.peekOffset();
  });
  readonly totalSlides = computed(() => {
    const slides = this.slides();
    if (slides?.length) {
      return slides.length;
    }
    const projectedSlides = this.projectedSlides();
    if (projectedSlides?.length) {
      return projectedSlides.length;
    }
    return this.slidesElements().length;
  });
  readonly totalSlidesVisible = computed(() => {
    return this.lastSlideAnchor() - this.firstSlideAnchor() + 1;
  });
  readonly hasScrollableOverflow = computed(() => {
    const fullWidth = this.fullWidth();
    if (!fullWidth) {
      return false;
    }

    const scrollableWidth =
      this.scrollWidth() + this.marginStart() + this.marginEnd();
    return scrollableWidth > fullWidth + 1;
  });
  readonly lastSlideAnchor = computed(() => {
    if (this.totalSlides()) {
      if (this.loop()) {
        return this.totalSlides() - 1;
      }

      if (this.center()) {
        if (this.notCenterBounds() && this.slidesPerView() !== 'auto') {
          const spv = this.slidesPerView() as number;
          return this.totalSlides() - (Math.round(spv / 2) - 1) - 1;
        } else if (!this.notCenterBounds()) {
          return this.totalSlides() - 1;
        }
      } else {
        if (this.slidesPerView() !== 'auto') {
          const spv = this.slidesPerView() as number;
          const translatePrecisionTolerance = this.marginEnd() ? 0 : 1;
          return this.findFirstEndBoundAnchor(spv, translatePrecisionTolerance);
        }

        if (!this.hasScrollableOverflow()) {
          return this.firstSlideAnchor();
        }

        let index = this.totalSlides() - 1;
        let total = 0;
        let count = 0;
        while (index >= 0 && total + this.marginEnd() < this.fullWidth()) {
          total += this.slidesWidths()[index];
          count++;
          index--;
        }
        return this.totalSlides() - count + 1;
      }
    }
    return 0;
  });
  readonly firstSlideAnchor = computed(() => {
    this.totalSlides();
    if (this.center()) {
      if (this.notCenterBounds()) {
        if (this.slidesPerView() !== 'auto') {
          const spv = this.slidesPerView() as number;
          return Math.round(spv / 2) - 1;
        }
        return 0;
      }
      return 0;
    }
    return 0;
  });

  private startOffset(): number {
    return this.marginStart() - this.peekOffset();
  }

  private endOffset(): number {
    return this.marginEnd() - this.peekOffset();
  }

  private getSlideWidth(index: number, fallback: number): number {
    return this.slidesWidths()[index] ?? fallback;
  }

  private getStartAlignedSnap(index: number, naturalSnap: number): number {
    return index === 0 ? naturalSnap : naturalSnap - this.startOffset();
  }

  /**
   * Finds the first slide index that should be treated as the end anchor.
   *
   * It mostly corresponds to totalSlides - slidesPerView, but in some
   * cases we can still have space available at carousel end, especially
   * with marginEnd.
   *
   * In this case we walk the natural snap positions and return the first eligible end page
   * whose aligned snap reaches the max translate bound.
   */
  private findFirstEndBoundAnchor(
    slidesPerView: number,
    translatePrecisionTolerance: number,
  ): number {
    const firstEndPage = this.totalSlides() - Math.floor(slidesPerView);
    const fallbackSlideWidth = getFixedSlideSize(
      this.fullWidth(),
      slidesPerView,
      this.spaceBetween(),
    );
    let naturalSnap = this.minTranslate();

    for (let index = 0; index < this.totalSlides(); index++) {
      const alignedSnap = this.getStartAlignedSnap(index, naturalSnap);

      if (
        index >= firstEndPage &&
        alignedSnap <= this.maxTranslate() + translatePrecisionTolerance
      ) {
        return index;
      }

      const slideWidth = this.getSlideWidth(index, fallbackSlideWidth);
      naturalSnap -= slideWidth + this.spaceBetween();
    }

    return this.totalSlides() - 1;
  }

  private usesUncenteredEndBoundSnap(index: number): boolean {
    return !this.loop() && !this.center() && index >= this.lastSlideAnchor();
  }

  /**
   * Incremented whenever the carousel host is resized. slidesWidthsSource
   * reads this so that a viewport resize forces a full re-measure of every
   * slide DOM element — useful when the slides themselves don't change size
   * but the container does (typical in slidesPerView: auto + projected
   * slides)
   */
  private readonly _resizeTick = signal(0);
  bumpResizeTick(): void {
    this._resizeTick.update((v) => v + 1);
  }

  private readonly slidesWidthsSource = computed(() => ({
    total: this.totalSlides(),
    start: this.virtual() ? this.currentVirtualRange().start : 0,
    domCount: this.domSlides().length,
    virtual: this.virtual(),
    loop: this.loop(),
    order: this.slidesIndexOrder(),
    rendered: this.virtual() ? this.renderedIndices() : [],
    resizeTick: this._resizeTick(),
  }));
  readonly slidesWidths: WritableSignal<number[]> = linkedSignal({
    source: () => this.slidesWidthsSource(),
    computation: (src, previous) => {
      const total = src.total;
      if (!total || total <= 0) {
        return [];
      }
      const prev = previous?.value;
      const next =
        Array.isArray(prev) && prev.length >= total
          ? prev.slice(0, total)
          : new Array(total);

      const slidesEls = this.domSlides();

      for (let domIndex = 0; domIndex < slidesEls.length; domIndex++) {
        const logicalIndex = src.virtual
          ? src.loop
            ? src.rendered[domIndex]
            : src.start + domIndex
          : (src.order[domIndex] ?? domIndex);
        if (logicalIndex < 0 || logicalIndex >= total) {
          continue;
        }

        const size = this.axisConf().rectSize(slidesEls[domIndex]);
        if (size) {
          next[logicalIndex] = size;
        }
      }

      return next;
    },
  });

  readonly snapsDom = computed(() => {
    const order = this.virtual()
      ? this.renderedIndices()
      : this.slidesIndexOrder();

    return order.map((logicalIndex, domIndex) => {
      const translate = this.slideTranslates()[logicalIndex];
      const left = -translate;
      const width = this.slidesWidths()[logicalIndex] ?? 0;
      return { domIndex, logicalIndex, left, width, translate };
    });
  });
  readonly visibleDom = computed(() => {
    return extractVisibleSlides(
      this.snapsDom(),
      this.currentTranslate(),
      this.fullWidth(),
      undefined,
      this.center(),
    );
  });

  readonly slideTranslates = computed(() => {
    const slidesWidths = this.slidesWidths();
    const order = this.slidesIndexOrder();
    const snaps: number[] = new Array(this.totalSlides()).fill(undefined);
    const renderedIndices = this.renderedIndices();

    untracked(() => {
      let currentTranslate = this.minTranslate();

      for (let i = 0; i < renderedIndices.length; i++) {
        const domIndex = renderedIndices[i];
        const logicalIndex =
          this.virtual() && this.loop() ? domIndex : order[domIndex];
        const slideWidth =
          slidesWidths[logicalIndex] ?? this.getFallbackSlideWidth();

        let snapPosition = currentTranslate;
        let usesEndBound = false;

        if (this.notCenterBounds()) {
          if (domIndex <= this.firstSlideAnchor()) {
            snapPosition = this.minTranslate();
          } else if (domIndex >= this.lastSlideAnchor()) {
            snapPosition = this.maxTranslate();
            usesEndBound = true;
          }
        } else if (this.usesUncenteredEndBoundSnap(domIndex)) {
          snapPosition = this.maxTranslate();
          usesEndBound = true;
        }

        if (domIndex !== 0 && !usesEndBound) {
          snapPosition -= this.startOffset();
        }

        if (domIndex === this.totalSlides() - 1 && !usesEndBound) {
          snapPosition -= this.endOffset();
        }

        snaps[logicalIndex] = snapPosition;

        currentTranslate -= slideWidth + this.spaceBetween();

        if (this.notCenterBounds() && domIndex === this.firstSlideAnchor()) {
          currentTranslate += this.fullWidth() / 2 - slidesWidths[domIndex] / 2;
        }
      }
    });

    return snaps;
  });

  /**
   * In a plain (non-loop, non-rewind) carousel with non-integer `slidesPerView`
   * or `freeMode`, the last reachable snap is `lastSlideAnchor`, but several
   * slides are still visible to the right of it ("crammed" against the right
   * edge). The reverse case happens at the start in `center` mode where
   * `firstSlideAnchor > 0`.
   *
   * `currentPosition` saturates at the anchor => from a UX standpoint the
   * thumbs, the `.slide--active` class and the pagination dot all keep
   * pointing to the anchor while the user clearly "sees" a later slide
   * sliding into view.
   *
   * Solution: split the residual translate zone into (N+1) chunks, where N is
   * the number of "crammed" slides. Each chunk crossed counts as one extra
   * slide. Outside of these residual zones, `perceivedIndex === currentPosition`.
   */
  readonly perceivedIndex = computed(() => {
    const real = this.currentRealPosition();
    const total = this.totalSlides();
    if (!total || real < 0) {
      return real;
    }
    // Loop: no real start/end, fall back to the loop-aware index.
    if (this.loop()) {
      return real;
    }
    // Only redistribute the perceived index while the user is actively
    // dragging (freeMode or not).
    if (!this.isDragging()) {
      return real;
    }
    const snaps = this.slideTranslates();
    const t = this.currentTranslate();
    const min = this.minTranslate();
    const max = this.maxTranslate();

    // End residual zone: after the last reachable snap, extra slides can still
    // be revealed while dragging toward maxTranslate.
    let effectiveLast = total - 1;
    for (let i = 0; i < total; i++) {
      const snap = snaps[i];
      if (snap !== undefined && snap <= max) {
        effectiveLast = i;
        break;
      }
    }

    // Use the previous reachable snap as the pivot, otherwise the residual
    // range can be zero when the effective anchor is already clamped to max.
    if (effectiveLast > 0) {
      const pivotIndex = effectiveLast - 1;
      const pivotSnap = snaps[pivotIndex];
      const crammed = total - 1 - pivotIndex;
      if (pivotSnap !== undefined && t < pivotSnap && crammed > 0) {
        const perceived = this.resolveResidualPerceivedIndex({
          currentTranslate: t,
          pivotIndex,
          pivotSnap,
          edgeTranslate: max,
          edgeIndex: total - 1,
          crammed,
          direction: 1,
        });
        if (perceived !== undefined) {
          return perceived;
        }
      }
    }

    // Start residual zone: same calculation mirrored for centered bounds,
    // where slides can be hidden before the first reachable snap.
    let effectiveFirst = 0;
    for (let i = total - 1; i >= 0; i--) {
      const snap = snaps[i];
      if (snap !== undefined && snap >= min) {
        effectiveFirst = i;
        break;
      }
    }

    if (effectiveFirst < total - 1) {
      const pivotIndex = effectiveFirst + 1;
      const pivotSnap = snaps[pivotIndex];
      const crammed = pivotIndex;
      if (pivotSnap !== undefined && t > pivotSnap && crammed > 0) {
        const perceived = this.resolveResidualPerceivedIndex({
          currentTranslate: t,
          pivotIndex,
          pivotSnap,
          edgeTranslate: min,
          edgeIndex: 0,
          crammed,
          direction: -1,
        });
        if (perceived !== undefined) {
          return perceived;
        }
      }
    }

    return real;
  });

  private resolveResidualPerceivedIndex({
    currentTranslate,
    pivotIndex,
    pivotSnap,
    edgeTranslate,
    edgeIndex,
    crammed,
    direction,
  }: {
    currentTranslate: number;
    pivotIndex: number;
    pivotSnap: number;
    edgeTranslate: number;
    edgeIndex: number;
    crammed: number;
    direction: 1 | -1;
  }): number | undefined {
    const range = Math.abs(pivotSnap - edgeTranslate);
    if (range <= 0) {
      return undefined;
    }
    const travelled = Math.min(range, Math.abs(currentTranslate - pivotSnap));
    const ratio = Math.min(1, Math.max(0, travelled / range));

    // Keep the last pixels for the true edge slide so it only becomes active
    // once the carousel is visually flush against that edge.
    const tailPx = Math.min(CarouselStore.RESIDUAL_EDGE_TAIL_PX, range / 2);
    const tailRatio = tailPx / range;
    if (ratio >= 1 - tailRatio) {
      return edgeIndex;
    }

    const visibleRatio = ratio / (1 - tailRatio);
    const extra = Math.min(crammed - 1, Math.floor(visibleRatio * crammed));
    return pivotIndex + extra * direction;
  }

  readonly virtualRange = computed(() => {
    if (!this.virtual()) {
      return { start: 0, end: this.totalSlides() - 1 };
    }

    if (this.loop()) {
      return { start: 0, end: this.totalSlides() - 1 };
    }

    const total = this.totalSlides();
    const visible = this.visibleDom();

    if (!total || !visible.length) {
      return { start: 0, end: total ? total - 1 : 0 };
    }

    const buffer = this.virtualBuffer() ?? 1;

    const minVisible = visible.reduce(
      (min, s) => Math.min(min, s.logicalIndex),
      Number.POSITIVE_INFINITY,
    );
    const maxVisible = visible.reduce(
      (max, s) => Math.max(max, s.logicalIndex),
      Number.NEGATIVE_INFINITY,
    );

    const slidePerView = this.slidesPerView();
    const slidesPerViewToApply =
      slidePerView === 'auto'
        ? Math.max(1, this.totalSlidesVisible() || 1)
        : Math.max(1, slidePerView as number);

    let start = Math.floor(minVisible - buffer * slidesPerViewToApply);
    let end = Math.ceil(maxVisible + buffer * slidesPerViewToApply);

    start = Math.max(0, start);
    end = Math.min(total - 1, end);

    return { start, end };
  });

  public readonly virtualLength = computed(() => {
    if (this.virtual()) {
      return 0;
    }
    return positiveModulo(
      this.virtualRange().end - this.virtualRange().start + 1,
      this.totalSlides(),
    );
  });
  readonly renderedIndices = computed(() => {
    const total = this.totalSlides();
    if (!total) {
      return [] as number[];
    }
    if (!this.virtual()) {
      return Array.from({ length: total }, (_, i) => i);
    }

    if (this.virtual() && this.loop()) {
      const slidesPerView =
        this.slidesPerView() === 'auto'
          ? Math.max(1, this.totalSlidesVisible() || 1)
          : (this.slidesPerView() as number);

      const buffer = this.virtualBuffer() ?? 1;
      const windowSize = Math.min(
        total,
        Math.ceil(slidesPerView * (1 + 2 * buffer)),
      );

      const start = this.virtualLoopStart();
      return Array.from({ length: windowSize }, (_, i) =>
        positiveModulo(start + i, total),
      );
    }

    const { start, end } = this.currentVirtualRange();
    const length = end - start + 1;
    if (length <= 0) {
      return [];
    }

    return Array.from({ length }, (_, i) => start + i);
  });
  readonly currentVirtualRange = computed(() => {
    const total = this.totalSlides();
    if (!this.virtual() || !total) {
      return { start: 0, end: total ? total - 1 : 0 };
    }

    const start = Math.max(0, Math.min(this.virtualStart(), total - 1));
    const end = Math.max(start, Math.min(this.virtualEnd(), total - 1));
    return { start, end };
  });

  patch(partial: Partial<Carousel>) {
    // Validate peekEdges if provided
    if (partial.peekEdges) {
      const peek = partial.peekEdges;
      if (peek.absoluteOffset !== undefined && peek.absoluteOffset < 0) {
        console.warn(
          '[Carousel] peekEdges.absoluteOffset must be >= 0, using 0',
        );
        peek.absoluteOffset = 0;
      }
      if (
        peek.relativeOffset !== undefined &&
        (peek.relativeOffset < 0 || peek.relativeOffset > 1)
      ) {
        console.warn(
          '[Carousel] peekEdges.relativeOffset must be in [0, 1], clamping',
        );
        peek.relativeOffset = Math.max(0, Math.min(1, peek.relativeOffset));
      }
    }

    this._state.update((curr) => ({ ...curr, ...partial }));
  }

  private getFallbackSlideWidth(): number {
    const widths = this.slidesWidths();
    const known = widths.filter(
      (w) => typeof w === 'number' && w > 0,
    ) as number[];
    if (known.length) {
      return known.reduce((a, b) => a + b, 0) / known.length;
    }
    const spv = this.slidesPerView();
    const divider =
      spv === 'auto'
        ? Math.max(1, this.totalSlidesVisible() || 1)
        : (spv as number);
    return this.fullWidth() / Math.max(1, divider);
  }

  private clampPosition(position: number, totalSlides: number) {
    if (totalSlides <= 0) {
      return -1;
    }
    return Math.min(Math.max(0, position), totalSlides - 1);
  }

  resetSlidesIndexOrder() {
    const total = this.totalSlides();
    if (!total) {
      this.patch({ slidesIndexOrder: [] });
      return;
    }

    const order = Array.from({ length: total }, (_, i) => i);
    this.patch({ slidesIndexOrder: order });
  }
}
