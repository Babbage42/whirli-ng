import type { CarouselAxis, CarouselDirection } from 'whirli-ng';

/**
 * Single source of truth for the playground state.
 * Maps 1:1 with carousel inputs (plus a few playground-only fields).
 */
export type PlaygroundState = {
  // Layout / sizing
  slideCount: number;
  variableWidths: boolean;
  slidesPerView: number | 'auto';
  spaceBetween: number;
  marginStart: number;
  marginEnd: number;
  peekEdgesMode: 'none' | 'absolute' | 'relative';
  peekEdgesAbsolute: number;
  peekEdgesRelative: number;

  // Step / navigation
  stepSlides: number;
  navigateSlideBySlide: boolean;
  initialSlide: number;
  keyboardNavigation: boolean;
  showControls: boolean;
  navigationExternal: boolean;
  alwaysShowControls: boolean;
  iconSize: number;
  navInlineOffset: number;
  navBlockOffset: number;
  themeColor: string;
  navColor: string;
  navColorHover: string;
  navBackground: string;
  navBackgroundHover: string;
  navBorder: string;
  navRadius: number;
  navPadding: number;
  navCursor: string;
  navHiddenOpacity: number;
  navZIndex: number;
  focusColor: string;
  focusWidth: number;
  focusOffset: number;

  // Modes
  loop: boolean;
  rewind: boolean;
  center: boolean;
  notCenterBounds: boolean;
  centerWhenNotEnoughSlides: boolean;
  freeMode: boolean;
  virtual: boolean;
  virtualBuffer: number;
  resistance: boolean;

  // Direction / axis
  direction: CarouselDirection;
  axis: CarouselAxis;

  // Interaction
  draggable: boolean;
  canSwipe: boolean;
  slideOnClick: boolean;
  dragThresholdRatio: number;
  dragIgnoreSelector: string;
  mouseWheel: 'off' | 'on' | 'horizontal' | 'vertical' | 'both';

  // Pagination
  paginationMode:
    | 'none'
    | 'number'
    | 'dot'
    | 'dynamic_dot'
    | 'fraction'
    | 'progress'
    | 'scrollbar';
  paginationClickable: boolean;
  paginationExternal: boolean;
  paginationMarginBottom: string;
  paginationColor: string;
  paginationGap: number;
  paginationPadding: number;
  paginationDotSize: number;
  paginationDotWidth: number;
  paginationDotHeight: number;
  paginationDotRadius: number;
  paginationDotColor: string;
  paginationDotActiveColor: string;
  paginationDotOpacity: number;
  paginationDotActiveOpacity: number;
  paginationDotActiveScale: number;
  paginationDotNearScale: number;
  paginationDotFarScale: number;
  paginationTransitionDuration: number;
  paginationFractionColor: string;
  paginationFractionBackground: string;
  paginationFractionBorder: string;
  paginationFractionRadius: number;
  paginationFractionPadding: number;
  paginationFractionFontSize: number;
  paginationFractionFontWeight: number;
  paginationProgressWidth: string;
  paginationProgressHeight: number;
  paginationProgressColor: string;
  paginationProgressBackground: string;
  paginationProgressBorder: string;
  paginationProgressRadius: number;
  paginationProgressPosition: 'top' | 'bottom' | 'left' | 'right';
  paginationHostWidth: string;
  paginationScrollbarWidth: string;
  paginationScrollbarHeight: number;
  paginationScrollbarBackground: string;
  paginationScrollbarBorder: string;
  paginationScrollbarRadius: number;
  paginationScrollbarThumbColor: string;
  paginationScrollbarThumbBorder: string;
  paginationScrollbarThumbRadius: number;
  paginationPosition: 'default' | 'static' | 'absolute';
  paginationTop: string;
  paginationRight: string;
  paginationBottom: string;
  paginationLeft: string;
  paginationMargin: string;
  paginationAlign: 'flex-start' | 'center' | 'flex-end';
  paginationZIndex: number;

  // Autoplay
  autoplayEnabled: boolean;
  autoplayDelay: number;
  autoplayPauseOnHover: boolean;
  autoplayPauseOnFocus: boolean;
  autoplayStopOnInteraction: boolean;
  autoplayDisableOnHidden: boolean;
  autoplayResumeOnMouseLeave: boolean;

  // Breakpoints (responsive overrides). When enabled, three preset tiers
  // override slidesPerView/spaceBetween based on media query width.
  breakpointsEnabled: boolean;
  bpMobileMaxWidth: number;
  bpMobileSlidesPerView: number;
  bpMobileSpaceBetween: number;
  bpTabletMaxWidth: number;
  bpTabletSlidesPerView: number;
  bpTabletSpaceBetween: number;
  bpDesktopSlidesPerView: number;
  bpDesktopSpaceBetween: number;

  // Thumbs mode: render a second (thumbnail) carousel below the master.
  thumbsEnabled: boolean;
  thumbsSlidesPerView: number;
  thumbsSpaceBetween: number;
  thumbsSelectionBar: boolean;
  thumbIndicatorHeight: number;
  thumbIndicatorRadius: number;
  thumbIndicatorColor: string;
  thumbIndicatorBottom: number;
  thumbIndicatorZIndex: number;

  // Misc
  contentMode: 'image' | 'projected';
  imageSeed: string;
  viewportMode: 'full' | 'mobile' | 'tablet' | 'desktop';
  visualDebug: boolean;
  lazyLoading: boolean;
  disabledIndices: string; // comma-separated list, e.g. "2,5"
  debug: boolean;
  carouselOverflow: 'hidden' | 'visible';
  carouselGapToPagination: number;
  slideCursor: string;
  slideDisabledOpacity: number;
};

export const DEFAULT_STATE: PlaygroundState = {
  slideCount: 12,
  variableWidths: false,
  slidesPerView: 3,
  spaceBetween: 8,
  marginStart: 0,
  marginEnd: 0,
  peekEdgesMode: 'none',
  peekEdgesAbsolute: 40,
  peekEdgesRelative: 0.2,

  stepSlides: 1,
  navigateSlideBySlide: false,
  initialSlide: 0,
  keyboardNavigation: true,
  showControls: true,
  navigationExternal: false,
  alwaysShowControls: false,
  iconSize: 40,
  navInlineOffset: 0,
  navBlockOffset: 0,
  themeColor: '#111827',
  navColor: 'inherit',
  navColorHover: 'inherit',
  navBackground: 'transparent',
  navBackgroundHover: 'transparent',
  navBorder: 'none',
  navRadius: 0,
  navPadding: 0,
  navCursor: 'pointer',
  navHiddenOpacity: 0,
  navZIndex: 2,
  focusColor: '#000000',
  focusWidth: 2,
  focusOffset: 2,

  loop: false,
  rewind: false,
  center: false,
  notCenterBounds: false,
  centerWhenNotEnoughSlides: false,
  freeMode: false,
  virtual: false,
  virtualBuffer: 1,
  resistance: true,

  direction: 'ltr',
  axis: 'horizontal',

  draggable: true,
  canSwipe: true,
  slideOnClick: true,
  dragThresholdRatio: 0.6,
  dragIgnoreSelector:
    '[data-carousel-no-drag], a, button, input, textarea, select, [role="button"]',
  mouseWheel: 'off',

  paginationMode: 'dynamic_dot',
  paginationClickable: true,
  paginationExternal: false,
  paginationMarginBottom: '1rem',
  paginationColor: '#00008b',
  paginationGap: 16,
  paginationPadding: 16,
  paginationDotSize: 8,
  paginationDotWidth: 8,
  paginationDotHeight: 8,
  paginationDotRadius: 999,
  paginationDotColor: '#808080',
  paginationDotActiveColor: '#00008b',
  paginationDotOpacity: 0.5,
  paginationDotActiveOpacity: 1,
  paginationDotActiveScale: 1.5,
  paginationDotNearScale: 0.6,
  paginationDotFarScale: 0.4,
  paginationTransitionDuration: 200,
  paginationFractionColor: 'inherit',
  paginationFractionBackground: 'transparent',
  paginationFractionBorder: 'none',
  paginationFractionRadius: 0,
  paginationFractionPadding: 0,
  paginationFractionFontSize: 16,
  paginationFractionFontWeight: 400,
  paginationProgressWidth: '100%',
  paginationProgressHeight: 4,
  paginationProgressColor: '#00008b',
  paginationProgressBackground: 'rgba(0, 0, 0, 0.15)',
  paginationProgressBorder: 'none',
  paginationProgressRadius: 999,
  paginationProgressPosition: 'bottom',
  paginationHostWidth: '100%',
  paginationScrollbarWidth: '100%',
  paginationScrollbarHeight: 6,
  paginationScrollbarBackground: 'rgba(0, 0, 0, 0.15)',
  paginationScrollbarBorder: 'none',
  paginationScrollbarRadius: 999,
  paginationScrollbarThumbColor: '#00008b',
  paginationScrollbarThumbBorder: 'none',
  paginationScrollbarThumbRadius: 999,
  paginationPosition: 'default',
  paginationTop: '',
  paginationRight: '',
  paginationBottom: '',
  paginationLeft: '',
  paginationMargin: '0',
  paginationAlign: 'center',
  paginationZIndex: 1,

  autoplayEnabled: false,
  autoplayDelay: 2500,
  autoplayPauseOnHover: true,
  autoplayPauseOnFocus: true,
  autoplayStopOnInteraction: false,
  autoplayDisableOnHidden: true,
  autoplayResumeOnMouseLeave: true,

  breakpointsEnabled: false,
  bpMobileMaxWidth: 768,
  bpMobileSlidesPerView: 1.5,
  bpMobileSpaceBetween: 4,
  bpTabletMaxWidth: 1024,
  bpTabletSlidesPerView: 2.5,
  bpTabletSpaceBetween: 8,
  bpDesktopSlidesPerView: 4,
  bpDesktopSpaceBetween: 16,

  thumbsEnabled: false,
  thumbsSlidesPerView: 5,
  thumbsSpaceBetween: 8,
  thumbsSelectionBar: true,
  thumbIndicatorHeight: 3,
  thumbIndicatorRadius: 999,
  thumbIndicatorColor: '#000000',
  thumbIndicatorBottom: 0,
  thumbIndicatorZIndex: 1,

  contentMode: 'image',
  imageSeed: 'default',
  viewportMode: 'full',
  visualDebug: false,
  lazyLoading: true,
  disabledIndices: '',
  debug: false,
  carouselOverflow: 'hidden',
  carouselGapToPagination: 16,
  slideCursor: 'grab',
  slideDisabledOpacity: 0.4,
};

export type PresetCategory =
  | 'Basics'
  | 'Margin'
  | 'Projected'
  | 'Loop / virtual'
  | 'Interaction'
  | 'Layout'
  | 'Responsive'
  | 'Linked carousel';

export type Preset = {
  name: string;
  category: PresetCategory;
  description: string;
  state: Partial<PlaygroundState>;
};

export const PRESETS: Preset[] = [
  {
    name: 'Default',
    category: 'Basics',
    description: 'Vanilla horizontal carousel',
    state: {},
  },
  {
    name: 'Loop + autoplay',
    category: 'Loop / virtual',
    description: 'Infinite loop with auto-advance every 2s',
    state: {
      loop: true,
      autoplayEnabled: true,
      autoplayDelay: 2000,
      slideCount: 10,
    },
  },
  {
    name: 'Center + loop',
    category: 'Loop / virtual',
    description: 'Centered active slide, infinite loop',
    state: { center: true, loop: true, slidesPerView: 3, slideCount: 10 },
  },
  {
    name: 'Virtual large list',
    category: 'Loop / virtual',
    description: '200 slides, virtual windowing',
    state: { virtual: true, slideCount: 200, slidesPerView: 3.5, loop: false },
  },
  {
    name: 'Virtual + loop',
    category: 'Loop / virtual',
    description: 'Windowed rendering combined with loop',
    state: {
      virtual: true,
      loop: true,
      slideCount: 100,
      slidesPerView: 3.5,
    },
  },
  {
    name: 'Free mode + wheel',
    category: 'Interaction',
    description: 'Inertia drag + scroll-wheel scrolling',
    state: { freeMode: true, mouseWheel: 'on', slideCount: 16 },
  },
  {
    name: 'Margin end',
    category: 'Margin',
    description: 'Fractional SPV with a visible end offset',
    state: {
      slideCount: 12,
      slidesPerView: 3.5,
      marginEnd: 180,
      paginationMode: 'dot',
    },
  },
  {
    name: 'Projected content',
    category: 'Projected',
    description: 'Custom slide templates with interactive children',
    state: {
      contentMode: 'projected',
      slideCount: 12,
      slidesPerView: 3,
      spaceBetween: 12,
    },
  },
  {
    name: 'Projected + marginEnd',
    category: 'Projected',
    description: 'Projected cards with a fractional end gap',
    state: {
      contentMode: 'projected',
      slideCount: 12,
      slidesPerView: 3.5,
      marginEnd: 180,
      paginationMode: 'dot',
    },
  },
  {
    name: 'RTL',
    category: 'Layout',
    description: 'Right-to-left reading direction',
    state: { direction: 'rtl', slideCount: 10 },
  },
  {
    name: 'Vertical',
    category: 'Layout',
    description: 'Vertical axis with peek edges',
    state: {
      axis: 'vertical',
      slidesPerView: 3,
      peekEdgesMode: 'relative',
      peekEdgesRelative: 0.2,
    },
  },
  {
    name: 'Variable widths',
    category: 'Layout',
    description: 'slidesPerView: auto with different widths',
    state: { slidesPerView: 'auto', variableWidths: true, slideCount: 10 },
  },
  {
    name: 'Step by 3',
    category: 'Interaction',
    description: 'Jump 3 slides per click',
    state: { stepSlides: 3, slideCount: 15 },
  },
  {
    name: 'Disabled slides',
    category: 'Interaction',
    description: 'Slides 2 and 5 disabled',
    state: { disabledIndices: '2,5', slideCount: 10 },
  },
  {
    name: 'Responsive breakpoints',
    category: 'Responsive',
    description: 'Mobile 1.5 / Tablet 2.5 / Desktop 4 SPV',
    state: { breakpointsEnabled: true, slideCount: 14 },
  },
  {
    name: 'External pagination',
    category: 'Responsive',
    description: 'Pagination template rendered outside the carousel',
    state: {
      paginationExternal: true,
      paginationMode: 'dynamic_dot',
      slideCount: 12,
    },
  },
  {
    name: 'External navigation',
    category: 'Responsive',
    description: 'Navigation buttons rendered outside the carousel layout',
    state: {
      navigationExternal: true,
      slideCount: 12,
      slidesPerView: 3,
    },
  },
  {
    name: 'Thumbs gallery',
    category: 'Linked carousel',
    description: 'Master + 5-thumb navigator',
    state: { thumbsEnabled: true, slideCount: 16, slidesPerView: 1 },
  },
];
