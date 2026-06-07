import { SafeHtml } from '@angular/platform-browser';
import { ElementRef } from '@angular/core';
import { SlideDirective } from '../directives/slide.directive';

export const TRANSITION_DURATION = 400; // ms

export type CarouselAxis = 'horizontal' | 'vertical';
export type CarouselDirection = 'ltr' | 'rtl';

export type PaginationType =
  | 'number'
  | 'dot'
  | 'dynamic_dot'
  | 'fraction'
  | 'progress'
  | 'scrollbar';

export type PaginationProgressPosition = 'top' | 'bottom' | 'left' | 'right';

export interface Pagination {
  type: PaginationType;
  clickable?: boolean;
  external?: boolean;
  /**
   * Main placement for progress/scrollbar pagination. CSS variables still allow fine
   * offset/style overrides without turning placement into a low-level setup.
   */
  position?: PaginationProgressPosition;
}

export type Slide = {
  image: string;
  id?: string;
  disabled?: boolean;
};

export type AutoplayOptions = {
  delay?: number;
  pauseOnHover?: boolean;
  pauseOnFocus?: boolean;
  stopOnInteraction?: boolean;
  disableOnHidden?: boolean;
  resumeOnMouseLeave?: boolean;
};

export const DEFAULT_AUTOPLAY_OPTIONS: Required<AutoplayOptions> = {
  delay: 2500,
  pauseOnHover: true,
  pauseOnFocus: true,
  stopOnInteraction: true,
  disableOnHidden: true,
  resumeOnMouseLeave: true,
};

export type CarouselA11yConfig = {
  carouselLabel?: string;
  slidesLabel?: string;
  previousSlideLabel?: string;
  nextSlideLabel?: string;
  slideLabel?: (context: { index: number; total: number }) => string;
  paginationBulletLabel?: (context: { index: number; total: number }) => string;
};

export interface CarouselResponsiveConfig {
  [mediaQuery: string]: {
    slidesPerView?: number;
    spaceBetween?: number;
  };
}

export type PeekEdges =
  | undefined
  | {
      absoluteOffset?: number;
      relativeOffset?: number;
    };

export interface SnapDom {
  domIndex: number;
  logicalIndex: number;
  left: number;
  width: number;
  translate: number;
}

export interface Carousel {
  isProjected: boolean;
  snapsDom: SnapDom[];
  visibleDom: SnapDom[];
  resistance: boolean | number;
  slides: Slide[];
  slidesElements: ElementRef<HTMLElement>[];
  slidesPerView: number | 'auto';
  spaceBetween: number;
  showControls: boolean;
  alwaysShowControls: boolean;
  iconSize: number;
  pagination?: Pagination;
  initialSlide: number;
  freeMode: boolean;
  mouseWheel:
    | boolean
    | {
        horizontal?: boolean;
        vertical?: boolean;
      };
  dragThresholdRatio: number;
  rewind: boolean;
  loop: boolean;
  center: boolean;
  notCenterBounds: boolean;
  centerWhenNotEnoughSlides: boolean;
  slideOnClick: boolean;

  marginEnd: number;
  marginStart: number;

  lazyLoading: boolean;

  breakpoints?: CarouselResponsiveConfig;

  customStyle?: SafeHtml;

  currentPosition: number;

  hasReachedEnd: boolean;

  hasReachedStart: boolean;

  totalSlidesVisible: number;

  totalSlides: number;

  fullWidth: number;

  scrollWidth: number;

  currentTranslate: number;
  currentRealPosition: number;
  lastTranslate: number;
  minTranslate: number;
  maxTranslate: number;

  slidesWidths: number[];

  uniqueCarouselId: string;

  allSlides: ElementRef<HTMLElement> | undefined;

  slidesIndexOrder: number[];

  slideTranslates: number[];

  velocity: number;

  firstSlideAnchor: number;
  lastSlideAnchor: number;

  stepSlides: number;

  autoplay: boolean | AutoplayOptions;

  draggable: boolean;

  canSwipe: boolean;

  peekEdges: PeekEdges;

  dragIgnoreSelector?: string;

  keyboardNavigation: boolean;

  navigateSlideBySlide: boolean;

  thumbsOptions:
    | {
        selectionBar: boolean;
      }
    | undefined;

  projectedSlides?: SlideDirective[];

  direction: CarouselDirection;
  axis: CarouselAxis;

  virtual: boolean;
  virtualStart: number;
  virtualRange?: {
    start: number;
    end: number;
  };
  virtualEnd: number;
  virtualBuffer?: number;
  renderedIndices?: number[];
  virtualLoopStart: number;

  perceivedIndex: number;
  /** True while the user is actively dragging the carousel (pointer down). */
  isDragging: boolean;

  a11y: CarouselA11yConfig;
}

export const CAROUSEL_SLIDE_CLASS = 'slide';

export const THUMBS_TRANSITION_DURATION_MS = 200;
