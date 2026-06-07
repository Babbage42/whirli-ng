import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  signal,
  TemplateRef,
  Inject,
  PLATFORM_ID,
  viewChild,
  forwardRef,
  viewChildren,
  inject,
  input,
  computed,
  untracked,
  afterRenderEffect,
  output,
  DOCUMENT,
  contentChild,
  contentChildren,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SlideDirective } from '../../directives/slide.directive';
import { ImagesReadyDirective } from '../../directives/images-ready.directive';

import { PaginationComponent } from '../pagination/pagination.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavigationComponent } from '../navigation/navigation.component';
import { CarouselNavLeftDirective } from '../../directives/navigation/navigation-left.directive';
import { CarouselNavRightDirective } from '../../directives/navigation/navigation-right.directive';
import { CarouselRegistryService } from './carousel-registry.service';
import {
  AutoplayOptions,
  Carousel,
  CarouselA11yConfig,
  CarouselAxis,
  CarouselDirection,
  CarouselResponsiveConfig,
  DEFAULT_AUTOPLAY_OPTIONS,
  Pagination,
  PeekEdges,
  Slide,
  TRANSITION_DURATION,
} from '../../models/carousel.model';
import {
  generateRandomClassName,
  positiveModulo,
} from '../../helpers/utils.helper';
import { CarouselStore } from '../../carousel.store';
import { CarouselLoopService } from '../../services/carousel-loop.service';
import { CarouselTransformService } from '../../services/carousel-transform.service';
import { CAROUSEL_VIEW } from './view-adapter';
import { CarouselNavigationService } from '../../services/carousel-navigation.service';
import { CarouselPhysicsService } from '../../services/carousel-physics.service';
import { CarouselDomService } from '../../services/carousel-dom.service';
import { CarouselBreakpointService } from '../../services/carousel-breakpoints.service';
import { CarouselLayoutService } from '../../services/carousel-layout.service';
import { CarouselInteractionService } from '../../services/carousel-interaction.service';
import { CarouselVirtualService } from '../../services/carousel-virtual.service';
import { getFixedSlideSizeCss } from '../../helpers/calculations.helper';
import { CarouselAutoplayService } from '../../services/carousel-autoplay.service';
import { CarouselKeyboardService } from '../../services/carousel-keyboard.service';
import { CarouselThumbsService } from '../../services/carousel-thumbs.service';

@Component({
  selector: 'whirli-carousel',
  imports: [
    CommonModule,
    PaginationComponent,
    NavigationComponent,
    ImagesReadyDirective,
  ],
  // TODO what was the need ?
  //encapsulation: ViewEncapsulation.None,
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--spv]': 'cssSpv',
    '[style.--gap]': 'cssGap',
    '[style.--index]': 'cssIndex',
  },
  providers: [
    CarouselStore,
    CarouselTransformService,
    CarouselPhysicsService,
    CarouselLoopService,
    CarouselNavigationService,
    CarouselDomService,
    CarouselLayoutService,
    CarouselBreakpointService,
    CarouselInteractionService,
    CarouselVirtualService,
    CarouselAutoplayService,
    CarouselKeyboardService,
    CarouselThumbsService,
    { provide: CarouselRegistryService, useClass: CarouselRegistryService },
    {
      provide: CAROUSEL_VIEW,
      useExisting: forwardRef(() => CarouselComponent),
    },
  ],
})
export class CarouselComponent implements OnInit, AfterViewInit, OnDestroy {
  public readonly store = inject(CarouselStore);
  private readonly loopService = inject(CarouselLoopService);
  private readonly transformService = inject(CarouselTransformService);
  public readonly navigationService = inject(CarouselNavigationService);
  private readonly domService = inject(CarouselDomService);
  private readonly layoutService = inject(CarouselLayoutService);
  private readonly interactionService = inject(CarouselInteractionService);
  private readonly virtualService = inject(CarouselVirtualService);
  private readonly autoplayService = inject(CarouselAutoplayService);
  private readonly keyboardService = inject(CarouselKeyboardService);
  private readonly thumbsService = inject(CarouselThumbsService);

  private readonly breakpointService = inject(CarouselBreakpointService);
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document?.defaultView;
  private debugModeEnabled = false;

  readonly currentPosition = this.store.currentPosition;
  readonly firstSlideAnchor = this.store.firstSlideAnchor;
  readonly lastSlideAnchor = this.store.lastSlideAnchor;
  readonly currentRealPosition = this.store.currentRealPosition;
  readonly perceivedIndex = this.store.perceivedIndex;
  readonly totalSlides = this.store.totalSlides;
  readonly totalSlidesVisible = this.store.totalSlidesVisible;
  readonly hasReachedStart = this.store.hasReachedStart;
  readonly hasReachedEnd = this.store.hasReachedEnd;
  readonly peekEdgesOffset = this.store.peekOffset;
  readonly virtualStart = this.store.virtualStart;

  readonly projectedSlides = contentChildren(SlideDirective);
  readonly customLeftArrow = contentChild(CarouselNavLeftDirective);
  readonly customRightArrow = contentChild(CarouselNavRightDirective);

  get cssSpv() {
    const spv = this.store.slidesPerView();
    return typeof spv === 'number' ? spv : 1;
  }
  get cssGap() {
    return `${this.store.spaceBetween()}px`;
  }
  get cssIndex() {
    return this.currentPosition();
  }

  debug = input(false);

  slides = input([], {
    transform: (v: Slide[] | string[]): Slide[] => {
      return v.map((el: string | Slide) =>
        typeof el === 'string' ? { image: el } : el,
      );
    },
  });
  slidesPerView = input(1, {
    transform: (v: number | string): number | 'auto' => {
      if (v === 'auto') {
        return 'auto';
      }
      const n = typeof v === 'string' ? Number(v) : v;
      // Validate: must be finite and positive
      if (!Number.isFinite(n) || n <= 0) {
        return 1;
      }
      return n as number;
    },
  });
  spaceBetween = input(0);
  stepSlides = input(1);
  showControls = input(true);
  alwaysShowControls = input(false);
  iconSize = input(50);
  pagination = input<Pagination | undefined>({
    type: 'dynamic_dot',
    clickable: true,
    external: false,
  });
  freeMode = input(false);
  mouseWheel = input<
    | boolean
    | {
        horizontal?: boolean;
        vertical?: boolean;
      }
  >(false);
  dragThresholdRatio = input(0.6);
  rewind = input(false);
  center = input(false);
  notCenterBounds = input(false);
  centerWhenNotEnoughSlides = input(false);
  resistance = input(true, {
    transform: (v: boolean | number): boolean | number => {
      if (typeof v === 'number' && Number.isFinite(v)) {
        return Math.max(0, Math.min(1, v));
      }
      return v;
    },
  });
  slideOnClick = input(true);
  marginEnd = input(0);
  marginStart = input(0);
  lazyLoading = input(true);
  breakpoints = input<CarouselResponsiveConfig>();
  autoplay = input(false, {
    transform: (value: boolean | AutoplayOptions) => {
      if (!value) {
        return false;
      }

      const opts =
        value === true
          ? DEFAULT_AUTOPLAY_OPTIONS
          : { ...DEFAULT_AUTOPLAY_OPTIONS, ...value };

      return opts;
    },
  });
  loop = input<boolean>(false);
  controlledSlideTo = input(undefined, {
    transform: (
      value:
        | undefined
        | number
        | {
            position: number;
            animated: boolean;
          },
    ) => {
      if (value === undefined) {
        return undefined;
      }
      if (typeof value === 'number') {
        return {
          position: value,
          animated: true,
        };
      }
      return value;
    },
  });
  draggable = input(true);
  canSwipe = input(true);
  /**
   * Peek mode with non-center :
   * slide percent to be visible at edges.
   * absolute : in px
   * relative : decimal 0.15 = 15% of slide width.
   */
  peekEdges = input<PeekEdges>(undefined);
  /**
   * CSS selector for elements inside slides that should NOT start a drag.
   * Typical default: interactive elements like buttons, links, inputs…
   */
  dragIgnoreSelector = input<string>(
    '[data-carousel-no-drag], a, button, input, textarea, select, [role="button"]',
  );

  keyboardNavigation = input(true);

  initialSlide = input<number>(0);
  realInitialSlide = computed(() => {
    const initial = this.initialSlide();
    const firstSlideAnchor = this.firstSlideAnchor();
    return Math.max(firstSlideAnchor, initial);
  });
  /**
   * By default, navigate prev or next will move page by page.
   * With this option, you can force carousel to really slide to prev or next slide.
   * Useful when you want to highligh the currently selected slide.
   * Useful in thumbs mode.
   */
  navigateSlideBySlide = input(false);
  /**
   * Can pass ref of master carousel.
   * Current carousel will serve as thumbnails pilote.
   */
  thumbsFor = input<CarouselComponent>();
  /**
   * Generic controller sync. The current carousel follows and controls the
   * target carousel without enabling thumbnail-specific defaults/styles.
   */
  controllerFor = input<CarouselComponent>();
  /**
   * Thumbs custom options.
   */
  thumbsOptions = input<
    | {
        selectionBar: boolean;
      }
    | undefined
  >();

  direction = input<CarouselDirection>('ltr');
  axis = input<CarouselAxis>('horizontal');
  virtual = input(false);
  virtualBuffer = input(1);
  a11y = input<CarouselA11yConfig>({});

  readonly resolvedA11y = computed<Required<CarouselA11yConfig>>(() => {
    const a11y = this.a11y();
    return {
      carouselLabel: a11y.carouselLabel ?? 'Carousel',
      slidesLabel: a11y.slidesLabel ?? 'Carousel slides',
      previousSlideLabel: a11y.previousSlideLabel ?? 'Previous slide',
      nextSlideLabel: a11y.nextSlideLabel ?? 'Next slide',
      slideLabel:
        a11y.slideLabel ?? (({ index, total }) => `${index + 1} of ${total}`),
      paginationBulletLabel:
        a11y.paginationBulletLabel ??
        (({ index }) => `Go to slide ${index + 1}`),
    };
  });

  /**
   * Subscribe to the linked carousel position.
   */
  readonly masterActiveIndex = computed(() => {
    const master = this.getControlledCarousel();
    if (!master) {
      return undefined;
    }
    const perceived = master.store.perceivedIndex();
    return {
      currentPosition: perceived,
      currentRealPosition: perceived,
    };
  });

  private getControlledCarousel(): CarouselComponent | undefined {
    return this.thumbsFor() ?? this.controllerFor();
  }

  // Chrome fix to avoid subpixel issue.
  // @todo only for chrome
  public fixSubPixelIssue = computed(
    () =>
      this.store.spaceBetween() === 0 &&
      typeof this.store.slidesPerView() === 'number' &&
      Number.isInteger(this.store.slidesPerView()) &&
      this.store.fullWidth() % (this.store.slidesPerView() as number) !== 0,
  );

  public readonly forceCentering = computed(() => {
    if (!this.store.centerWhenNotEnoughSlides()) {
      return false;
    }
    const total = this.totalSlides();
    const slidesPerView = this.slidesPerView();
    if (slidesPerView !== 'auto') {
      return slidesPerView >= total;
    }
    return !this.store.hasScrollableOverflow();
  });

  /**
   * We force center by CSS at init (when all values are not ready).
   */
  public readonly applyCenterAtInit = computed(() => {
    const spv = this.store.slidesPerView();
    if (this.isServerMode || !this.layoutReady()) {
      if (
        this.store.center() &&
        !this.store.loop() &&
        typeof spv === 'number'
      ) {
        return true;
      }
    }
    return false;
  });

  // Center mode keeps a CSS fallback until DOM measurements are available.
  public readonly slidesTransform = computed(() => {
    const currentTranslate = this.store.currentTranslate();
    const effective = this.store.isRtl() ? -currentTranslate : currentTranslate;
    return this.store.axisConf().slidesTransform(effective);
  });

  private readonly _transitionDuration = signal(0);
  readonly transitionDuration = this._transitionDuration.asReadonly();
  public readonly thumbsTransitionDuration =
    this.thumbsService.transitionDuration;

  public readonly slidesGap = computed(() => `${this.store.spaceBetween()}px`);
  private initialResizeObserverAttached = false;
  private layoutInitialized = false;

  public readonly slidesGridSize = computed(() => {
    const slidesPerView = this.store.slidesPerView();
    if (slidesPerView === 'auto') {
      return 'max-content';
    }
    return getFixedSlideSizeCss(slidesPerView, this.store.spaceBetween());
  });

  public readonly peekPaddingStyle = computed(() => {
    const peek = this.peekEdges();
    if (!peek || this.store.center()) {
      return this.store.axisConf().peekPadding(0);
    }

    if (this.usesSsrRelativePeekFallback()) {
      return {};
    }

    return this.store.axisConf().peekPadding(this.store.peekOffset());
  });

  // SSR has no DOM measurements, so relative peekEdges need a temporary CSS
  // projection. Once layoutReady is true, the store becomes the only source of
  // truth again for padding and translate.
  public readonly usesSsrRelativePeekFallback = computed(() => {
    if (this.layoutReady() || this.store.center()) {
      return false;
    }

    const relativeOffset = this.peekEdges()?.relativeOffset ?? 0;
    const slidesPerView = this.store.slidesPerView();
    return Boolean(relativeOffset && slidesPerView !== 'auto');
  });

  public readonly ssrRelativePeekRatio = computed(() => {
    const relativeOffset = this.peekEdges()?.relativeOffset ?? 0;
    const slidesPerView = this.store.slidesPerView();
    return relativeOffset && slidesPerView !== 'auto'
      ? relativeOffset / slidesPerView
      : null;
  });

  // We register all user inputs here so we can react to each change and
  // update state accordingly.
  private inputsSnapshot = computed<Partial<Carousel>>(() => {
    const inputs: Partial<Carousel> = {
      marginStart: this.marginStart(),
      marginEnd: this.marginEnd(),
      resistance: this.resistance(),
      showControls: this.showControls(),
      alwaysShowControls: this.alwaysShowControls(),
      iconSize: this.iconSize(),
      slides: this.slides(),
      initialSlide: this.initialSlide(),
      freeMode: this.freeMode(),
      mouseWheel: this.mouseWheel(),
      dragThresholdRatio: this.dragThresholdRatio(),
      slidesPerView: this.slidesPerView(),
      spaceBetween: this.spaceBetween(),
      loop: this.loop(),
      rewind: this.rewind(),
      center: this.center(),
      notCenterBounds: this.notCenterBounds(),
      centerWhenNotEnoughSlides: this.centerWhenNotEnoughSlides(),
      slideOnClick: this.slideOnClick(),
      stepSlides: this.stepSlides(),
      autoplay: this.autoplay(),
      lazyLoading: this.lazyLoading(),
      draggable: this.draggable(),
      canSwipe: this.canSwipe(),
      peekEdges: this.peekEdges(),
      pagination: this.pagination(),
      dragIgnoreSelector: this.dragIgnoreSelector(),
      keyboardNavigation: this.keyboardNavigation(),
      navigateSlideBySlide: this.navigateSlideBySlide(),
      thumbsOptions: this.thumbsOptions(),
      direction: this.direction(),
      axis: this.axis(),
      virtual: this.virtual(),
      virtualBuffer: this.virtualBuffer(),
      a11y: this.resolvedA11y(),
    };
    return inputs;
  });

  private layoutOptionsSnapshot = computed(() => ({
    slidesPerView: this.slidesPerView(),
    spaceBetween: this.spaceBetween(),
    marginStart: this.marginStart(),
    marginEnd: this.marginEnd(),
    center: this.center(),
    notCenterBounds: this.notCenterBounds(),
    loop: this.loop(),
    rewind: this.rewind(),
    peekEdges: this.peekEdges(),
    direction: this.direction(),
    axis: this.axis(),
  }));

  // Navigation events
  activeIndexChange = output<number>();
  slideNext = output<void>();
  slidePrev = output<void>();
  // Emits the user-perceived active index, which can differ from activeIndexChange
  perceivedIndexChange = output<number>();

  // Lifecycle events
  afterInit = output<void>();
  beforeDestroy = output<void>();

  // Interaction events
  touched = output<void>();
  touchStart = output<MouseEvent | TouchEvent>();
  dragStart = output<MouseEvent | TouchEvent>();
  dragEnd = output<MouseEvent | TouchEvent>();
  translateChange = output<number>();

  // Boundary events
  reachEnd = output<void>();
  reachStart = output<void>();

  // Transition events
  transitionStart = output<void>();
  transitionEnd = output<void>();

  // Progress event (0-1 normalized progress)
  progress = output<number>();

  // Click events
  slideClick = output<{
    index: number;
    event: MouseEvent;
  }>();

  // Autoplay events
  autoplayStart = output<void>();
  autoplayStop = output<void>();
  autoplayPause = output<void>();

  imagesLoaded = output<void>();

  firstTouch = false;
  private afterInitEmitted = false;
  uniqueCarouselId = '';
  generatedStyles: SafeHtml = '';
  allSlides = viewChild<ElementRef<HTMLElement>>('allSlides');
  slidesElements = viewChildren<ElementRef<HTMLElement>>('slide');

  private readonly paginationTemplateRef =
    viewChild<TemplateRef<any>>('paginationTemplate');

  // Can be used by user to move pagination element.
  public get paginationTemplate(): TemplateRef<any> | null {
    return this.paginationTemplateRef() ?? null;
  }

  private navigation = viewChild(NavigationComponent);

  private areImagesReady = signal(false);
  public layoutReady = signal(false);

  /**
   * Thumb selection bar positioning.
   */
  thumbIndicatorLeft = this.thumbsService.indicatorLeft;
  thumbIndicatorWidth = this.thumbsService.indicatorWidth;

  constructor(
    private renderer: Renderer2,
    private detectChanges: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    public carouselRegistry: CarouselRegistryService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private hostRef: ElementRef<HTMLElement>,
  ) {
    effect(() => this.syncDebugMode());
    /**
     * Set initial current position to apply.
     */
    effect(() => {
      const realInitialSlide = this.realInitialSlide();
      untracked(() => {
        this.updateCarouselState({
          currentPosition: realInitialSlide,
        });
      });
    });

    effect(() => {
      const allSlides = this.allSlides();
      untracked(() => this.updateCarouselState({ allSlides }));
    });

    effect(() => {
      const navigation = this.navigation();
      this.carouselRegistry.carouselNavigationLeftSignal.set(
        navigation?.leftControl(),
      );
      this.carouselRegistry.carouselNavigationRightSignal.set(
        navigation?.rightControl(),
      );
    });

    effect(() => {
      const projectedSlides = this.projectedSlides();
      untracked(() =>
        this.updateCarouselState({ projectedSlides: [...projectedSlides] }),
      );
    });

    afterRenderEffect(() => {
      const slidesEls = this.slidesElements();
      if (!slidesEls.length) {
        return;
      }

      if (!this.areImagesReady()) {
        return;
      }

      if (!this.initialResizeObserverAttached) {
        this.initialResizeObserverAttached = true;
        this.layoutService.observeSlidesResize(
          this.slidesElements(),
          () => this.areImagesReady(),
          () => this.updateLayoutFromDom(),
        );
      }

      if (!this.layoutInitialized) {
        this.updateLayoutFromDom();
      } else {
        untracked(() => this.refresh());
        this.debugLog('Refreshed after slides update');
      }
    });

    effect(() => {
      const currentPosition = this.store.currentPosition();

      this.debugLog('activeIndexChange', currentPosition);
      this.activeIndexChange.emit(currentPosition);
    });

    effect(() => {
      const snap = this.inputsSnapshot();
      this.updateCarouselState({
        ...snap,
      });
    });

    let hasObservedReadyLayoutOptions = false;
    effect(() => {
      this.layoutOptionsSnapshot();

      if (!this.layoutReady()) {
        hasObservedReadyLayoutOptions = false;
        return;
      }

      if (!hasObservedReadyLayoutOptions) {
        hasObservedReadyLayoutOptions = true;
        return;
      }

      untracked(() => this.refresh());
    });

    effect(() => {
      const autoplay = this.autoplay();
      if (autoplay !== false && this.layoutReady()) {
        this.autoplayService.start(this.autoplayCallbacks());
      }
    });

    // Emit once, when (and only when) layout is actually ready.
    effect(() => {
      if (this.layoutReady() && !this.afterInitEmitted) {
        this.afterInitEmitted = true;
        this.afterInit.emit();
      }
    });

    effect(() => {
      const slideTo = this.controlledSlideTo();
      untracked(() => {
        if (slideTo) {
          this.slideTo(slideTo.position, slideTo.animated);
        }
      });
    });

    effect(() => {
      if (this.thumbsFor()) {
        this.updateCarouselState(this.thumbsService.defaultThumbsState);
      }
    });

    /**
     * Force linked carousels to follow the master current index.
     */
    effect(() => {
      const master = this.getControlledCarousel();
      if (!master) {
        return;
      }

      const masterActiveIndex = this.masterActiveIndex();
      if (!masterActiveIndex) {
        return;
      }

      const { currentPosition, currentRealPosition } = masterActiveIndex;
      if (currentPosition === undefined || currentPosition < 0) {
        return;
      }

      untracked(() => {
        this.slideTo(currentRealPosition, true, true, true);
      });
    });

    let lastPerceived = -1;
    effect(() => {
      const idx = this.store.perceivedIndex();
      if (idx !== lastPerceived && idx >= 0) {
        lastPerceived = idx;
        this.perceivedIndexChange.emit(idx);
      }
    });

    /**
     * Positioning of thumb selection bar.
     */
    afterRenderEffect(() => {
      const master = this.thumbsFor();
      if (!master) {
        return;
      }

      if (!this.store.thumbsOptions()?.selectionBar) {
        return;
      }

      const index = this.currentRealPosition();
      if (index === undefined || index < 0) {
        return;
      }

      this.thumbsService.updateIndicator(
        index,
        this.slidesElements(),
        this.allSlides()?.nativeElement,
      );
    });

    effect(() => {
      const total = this.totalSlides();
      const order = this.store.slidesIndexOrder();

      if (!total) {
        return;
      }

      if (order.length !== total) {
        this.store.resetSlidesIndexOrder();
      }
    });

    afterRenderEffect(() => {
      if (this.breakpoints()) {
        this.applyBreakpoints();
      }
    });
  }

  ngOnInit(): void {
    if (!this.uniqueCarouselId) {
      this.uniqueCarouselId = generateRandomClassName(10);
    }

    this.updateCarouselState({
      currentRealPosition: this.realInitialSlide(),
      uniqueCarouselId: this.uniqueCarouselId,
    });
  }

  ngAfterViewInit(): void {
    this.applyUniqueId();
    this.initProjectedSlides();
    this.refresh(false);
    this.layoutService.observeContainerResize(
      this.allSlides()?.nativeElement,
      () => this.refresh(),
    );
    this.installPostDragClickGuard();
  }

  /**
   * Must prevent the projected slides children to trigger a click
   * when the user is executing a swipe or a drag and drop action.
   */
  private removePostDragClickGuard?: () => void;
  private installPostDragClickGuard() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const host = this.hostRef.nativeElement;
    const onClickCapture = (event: MouseEvent) => {
      if (!this.interactionService.consumeSuppressNextNativeClick()) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    };

    host.addEventListener('click', onClickCapture, true);
    this.removePostDragClickGuard = () => {
      host.removeEventListener('click', onClickCapture, true);
    };
  }

  ngOnDestroy(): void {
    this.beforeDestroy.emit();

    this.breakpointService.clear();
    this.autoplayService.destroy(this.autoplayCallbacks());
    this.layoutService.disconnectObservers();
    this.removePostDragClickGuard?.();
  }

  private enableDebugMode() {
    if (!this.window) {
      return;
    }

    (
      this.window as Window & {
        __carouselDebug?: Record<string, unknown>;
      }
    ).__carouselDebug = {
      store: this.store,
      state: () => this.store.state(),
      slideTo: (index: number) => this.slideTo(index),
      getTranslate: () => this.store.currentTranslate(),
      getPosition: () => this.currentPosition(),
    };
  }

  private syncDebugMode(): void {
    if (!this.debug() || this.debugModeEnabled) {
      return;
    }

    this.debugModeEnabled = true;
    this.enableDebugMode();
  }

  private debugLog(...args: unknown[]): void {
    if (this.debug()) {
      console.log('[Whirli]', ...args);
    }
  }

  private updateCarouselState(partial: Partial<Carousel>) {
    this.store.patch(partial);
  }

  private autoplayCallbacks() {
    return {
      slideToNext: () => this.slideToNext(),
      autoplayStart: () => this.autoplayStart.emit(),
      autoplayStop: () => this.autoplayStop.emit(),
      autoplayPause: () => this.autoplayPause.emit(),
    };
  }

  public get isServerMode() {
    return !isPlatformBrowser(this.platformId);
  }

  private applyUniqueId() {
    this.renderer.addClass(
      this.allSlides()?.nativeElement,
      this.uniqueCarouselId,
    );
  }

  public refresh(updateSlides = true) {
    if (updateSlides) {
      this.updateCarouselState({
        slidesElements: [...this.slidesElements()],
        allSlides: { ...this.allSlides() } as ElementRef<any>,
      });
    }
    this.domService.updateSlides();

    // Unwanted if a translation is in progress.
    if (!this.interactionService.getDragState().isDragging) {
      this.refreshTranslate();
      // Initialize hasReachedStart/hasReachedEnd states after translate is refreshed.
      this.handleReachEvents(false);
    }
  }

  private initTouched() {
    if (!this.firstTouch) {
      this.touched.emit();
      this.firstTouch = true;
    }
  }

  /**
   * Handle slide to next index.
   * From navigation or accessibility.
   */
  public slideToNext() {
    this.slideNext.emit();
    const target = this.navigationService.getNextIndex();
    this.slideTo(target);
  }

  /**
   * Handle slide to prev index.
   * From navigation or accessibility.
   */
  public slideToPrev() {
    this.slidePrev.emit();
    const target = this.navigationService.getPrevIndex();
    this.slideTo(target);
  }

  /**
   * When we need to slide to nearest index after translation.
   */
  private slideToNearest() {
    const { position, exactPosition } =
      this.transformService.calculateTargetPositionAfterTranslation(
        this.isReachEnd(),
        this.isReachStart(),
      );
    this.debugLog('slideToNearest', { position, exactPosition });
    const target = !this.navigationService.isSlideDisabled(position)
      ? position
      : this.store.currentPosition();

    this.slideTo(target, true, exactPosition === target);
  }

  @HostListener('transitionend', ['$event'])
  onHostTransitionEnd(event: TransitionEvent) {
    const slidesEl = this.allSlides()?.nativeElement;
    if (event.propertyName === 'transform' && event.target === slidesEl) {
      this.transitionEnd.emit();
    }
  }

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onMouseDown(event: MouseEvent | TouchEvent) {
    this.initTouched();
    this.touchStart.emit(event);
    this.interactionService.handleStart(event);
  }

  @HostListener('dragstart', ['$event'])
  onHostDragStart(event: DragEvent) {
    event.preventDefault();
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    if (this.mouseWheel()) {
      this.interactionService.handleWheel(event);
      this.initTouched();
    }
  }

  @HostListener('mousemove', ['$event'])
  @HostListener('touchmove', ['$event'])
  onMouseMove(event: MouseEvent | TouchEvent) {
    this.initTouched();
    this.interactionService.handleMove(event, () => this.dragStart.emit(event));
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onMouseUp(event: MouseEvent | TouchEvent) {
    if (this.interactionService.handleEnd(event)) {
      this.dragEnd.emit(event);
    }
  }

  @HostListener('click', ['$event'])
  onHostClick(event: MouseEvent) {
    this.initTouched();
    this.interactionService.handleClick(event);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.keyboardService.handleKeyDown(
      event,
      this.keyboardNavigation(),
      this.slidesElements(),
      {
        slideToNext: () => this.slideToNext(),
        slideToPrev: () => this.slideToPrev(),
        slideTo: (index) => this.slideTo(index),
        initTouched: () => this.initTouched(),
      },
      this.debug(),
    );
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    this.autoplayService.pauseOnHover(this.autoplayCallbacks());
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.autoplayService.resumeOnMouseLeave(this.autoplayCallbacks());
  }

  public stopAutoplayOnInteraction() {
    this.autoplayService.stopOnInteraction(this.autoplayCallbacks());
  }

  public startAutoplay() {
    this.autoplayService.start(this.autoplayCallbacks());
  }

  public stopAutoplay() {
    this.autoplayService.stop(this.autoplayCallbacks());
  }

  public pauseAutoplay() {
    this.autoplayService.pauseOnHover(this.autoplayCallbacks());
  }

  private isReachEnd(): boolean {
    return this.currentPosition() >= this.lastSlideAnchor();
  }
  private isReachStart(): boolean {
    return this.store.currentTranslate() >= this.store.state().minTranslate;
  }

  private handleReachEvents(emitEvents = true) {
    const hasReachedEnd = this.isReachEnd();
    const hasReachedStart = this.isReachStart();
    const wasReachedEnd = this.store.hasReachedEnd();
    const wasReachedStart = this.store.hasReachedStart();

    this.updateCarouselState({
      hasReachedEnd,
      hasReachedStart,
    });

    // In loop mode there is no true start / end, so don't emit these.
    if (this.loop()) {
      return;
    }

    if (!emitEvents) {
      return;
    }

    if (hasReachedEnd && !wasReachedEnd) {
      this.reachEnd.emit();
    }
    if (hasReachedStart && !wasReachedStart) {
      this.reachStart.emit();
    }
  }

  /**
   * We detect if we have projected slides.
   * If we have projected slides, we will use them instead of the slides input.
   */
  private initProjectedSlides() {
    const isProjected =
      this.store.slides().length === 0 &&
      this.projectedSlides() &&
      this.projectedSlides().length > 0;

    this.updateCarouselState({
      isProjected,
    });
  }

  /**
   * Slide to clicked slide.
   * @param event
   */
  private clickOnSlide(event: Event) {
    const slideElement = (event.target as HTMLElement).closest('.slide');
    if (!slideElement) {
      return;
    }

    let index = -1;
    const testId = slideElement.getAttribute('data-testid');
    if (testId && testId.startsWith('slide-')) {
      index = Number(testId.replace('slide-', ''));
    }

    if (!Number.isFinite(index)) {
      const classes = slideElement.className.split(' ');
      const posClass = classes.find((cls) => cls.indexOf('position-') === 0);
      if (!posClass) {
        return;
      }
      const indexStr = posClass.replace('position-', '');
      const position = parseInt(indexStr, 10);
      if (isNaN(position)) {
        return;
      }
      index = position - 1;
    }

    if (index < 0) {
      return;
    }

    // Emit slideClick event with index
    this.slideClick.emit({ index, event: event as MouseEvent });

    if (!this.store.slideOnClick()) {
      return;
    }

    this.loopService.insertLoopSlidesBySlidingTo(index);
    this.virtualService.syncVirtualSlides(index);

    if (this.navigationService.isSlideDisabled(index)) {
      return;
    }

    this.debugLog('slide click navigation', index);

    this.slideTo(index, true, true, false);
  }

  private clampToVisibleSlide(index: number) {
    if (this.store.loop()) {
      return index;
    }

    return Math.max(
      this.store.firstSlideAnchor(),
      Math.min(index, this.store.lastSlideAnchor()),
    );
  }

  private applyBreakpoints() {
    const breakpoints = this.breakpoints();

    const css = this.breakpointService.generateCss(
      breakpoints,
      this.uniqueCarouselId,
    );

    if (css) {
      this.generatedStyles = this.sanitizer.bypassSecurityTrustHtml(css);
      this.detectChanges.detectChanges();
    }

    if (this.isServerMode) {
      return;
    }

    this.breakpointService.setupMediaQueryListeners(breakpoints, (config) =>
      this.updateCarouselState(config),
    );
  }

  public onImagesReady() {
    this.debugLog('images ready');
    this.imagesLoaded.emit();
    this.areImagesReady.set(true);
  }

  public onImagesChanged() {
    this.debugLog('images changed');
  }

  private enableTransition() {
    this._transitionDuration.set(TRANSITION_DURATION);
    this.transitionStart.emit();
    setTimeout(() => this.disableTransition(), TRANSITION_DURATION);
  }

  public disableTransition() {
    this._transitionDuration.set(0);
  }

  private enableThumbsTransition(customTransition?: number) {
    this.thumbsService.enableTransition(customTransition);
  }

  /**
   * Calculate and emit progress (0-1 normalized value)
   */
  private emitProgress() {
    const currentTranslate = this.store.currentTranslate();
    const minTranslate = this.store.minTranslate();
    const maxTranslate = this.store.maxTranslate();

    // Progress is distance travelled from the "start" anchor (minTranslate)
    // over the total travel range, regardless of sign conventions (LTR/RTL/center).
    // 0 = at the start, 1 = at the end.
    const total = Math.abs(minTranslate - maxTranslate);
    if (total === 0) {
      this.progress.emit(0);
      return;
    }
    const travelled = Math.abs(currentTranslate - minTranslate);
    const clampedProgress = Math.max(0, Math.min(1, travelled / total));

    this.progress.emit(clampedProgress);
  }

  /**
   * Move slides.
   * From arrows or by mouse / touch.
   * @param posX
   * @returns
   */
  public updateTransform(
    translateToApply: number = this.store.currentTranslate(),
    updatePosition = true,
    detectChanges = false,
    emitReachEvents = true,
  ) {
    this.updateCarouselState({ currentTranslate: translateToApply });

    // Emit translate and progress events
    this.translateChange.emit(translateToApply);
    this.emitProgress();

    if (detectChanges) {
      this.detectChanges.detectChanges();
    }

    this.handleReachEvents(emitReachEvents);

    // Position is not updated following the translation.
    if (!updatePosition || this.store.navigateSlideBySlide()) {
      this.domService.updateSlides();
      return;
    }

    const newPosition =
      this.transformService.getNewPositionFromTranslate().position;
    if (newPosition === undefined) {
      return;
    }
    const position = positiveModulo(newPosition, this.store.totalSlides());
    const realPosition = this.store.slidesIndexOrder()[position];
    if (realPosition !== this.store.currentPosition()) {
      this.store.setCurrentPosition(this.clampToVisibleSlide(realPosition));
      this.updateCarouselState({ currentRealPosition: realPosition });
      this.domService.updateSlides();
    }
  }

  /**
   * Trigger slide to specific index.
   * If index is not provided, it will slide to the current position.
   * @param index
   */
  public slideTo(
    index = this.store.currentRealPosition(),
    animate = true,
    updateRealPosition = true,
    force = false,
  ) {
    if (!this.autoplayService.isAutoplayTick) {
      this.stopAutoplayOnInteraction();
    }

    this.debugLog('slideTo', index);
    const controlledCarousel = this.getControlledCarousel();
    if (!force && controlledCarousel) {
      controlledCarousel.slideTo(index, animate);
      return;
    }

    if (updateRealPosition) {
      this.updateCarouselState({ currentRealPosition: index });
    }

    index = this.clampToVisibleSlide(index);

    if (index !== undefined && index !== this.store.currentPosition()) {
      this.store.setCurrentPosition(index);
    }

    if (animate) {
      this.enableTransition();
    }

    if (this.thumbsFor()) {
      this.enableThumbsTransition();
    }

    const translateToApply =
      this.transformService.getTranslateFromPosition(index);
    this.updateTransform(translateToApply, false);
  }

  private refreshTranslate() {
    const currentPosition = this.currentPosition();
    const translate =
      this.transformService.getTranslateFromPosition(currentPosition);
    this.updateCarouselState({ currentTranslate: translate });
  }

  /**
   * Slide to the slide whose id matches the given key.
   */
  public slideToKey(id: string, animate = true) {
    let index = -1;

    const slides = this.store.slides();
    const projected = this.projectedSlides?.() ?? [];

    if (slides && slides.length > 0) {
      index = slides.findIndex((slide) => slide?.id === id);
    }

    if (index === -1 && projected.length > 0) {
      index = projected.findIndex((dir) => dir.slideId() === id);
    }
    if (index === -1) {
      return;
    }

    this.loopService.insertLoopSlidesBySlidingTo(index);
    this.virtualService.syncVirtualSlides(index);

    this.slideTo(index, animate);
  }

  private updateLayoutFromDom() {
    const slidesEls = this.slidesElements();
    if (!slidesEls.length) {
      return;
    }

    const initialized = this.layoutService.updateLayoutFromSlides(slidesEls);

    if (initialized) {
      this.layoutReady.set(true);
      this.layoutInitialized = true;
    }
  }
}
