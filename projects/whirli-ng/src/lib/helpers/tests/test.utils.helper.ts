import { ElementRef, signal } from '@angular/core';

export class CarouselStoreFake {
  private _currentPosition = signal(0);
  private _stepSlides = 1;
  private _loop = false;
  private _totalSlides = signal(0);
  private _firstSlideAnchor = signal(0);
  private _lastSlideAnchor = signal(0);
  private _spaceBetween = 0;

  private _allSlides?: ElementRef<HTMLElement>;
  private _slidesElements?: ElementRef<HTMLElement>[];
  private _domSlides?: HTMLElement[];

  private _lazyLoading = false;
  private _slidesPerView: number | 'auto' = 1;
  private _center = false;

  private _fullWidth = 0;
  private _marginStart = 0;
  private _initialSlide = 0;

  private _visibleDom: any[] = [];
  private _slidesIndexOrder: number[] = [];
  private _slidesWidths: number[] = [];
  private _slideTranslates: number[] = [];
  private _snapsDom: any[] = [];
  private _currentTranslate = 0;
  private _lastTranslate = 0;
  private _navigateSlideBySlide = false;
  private _isRtl = false;
  private _isVertical = signal(false);
  private _peekOffset = signal(0);
  private _a11y = {
    slideLabel: ({ index, total }: { index: number; total: number }) =>
      `${index + 1} of ${total}`,
    paginationBulletLabel: ({
      index,
    }: {
      index: number;
      total: number;
    }) =>
      `Go to slide ${index + 1}`,
  };

  private _virtual = false;
  private _pagination = { type: 'dot', clickable: true, external: false };

  currentPosition = () => this._currentPosition();
  perceivedIndex = () => this._currentPosition();

  state = () =>
    ({
      stepSlides: this._stepSlides,
      loop: this._loop,
      lazyLoading: this._lazyLoading,
      center: this._center,
      fullWidth: this._fullWidth,
      marginStart: this._marginStart,
      spaceBetween: this._spaceBetween,
      initialSlide: this._initialSlide,
      allSlides: this._allSlides,
      navigateSlideBySlide: this._navigateSlideBySlide,
    }) as any;

  loop = () => this._loop;
  totalSlides = () => this._totalSlides();
  totalSlidesVisible = () =>
    this._lastSlideAnchor() - this._firstSlideAnchor() + 1;
  lastSlideAnchor = () => this._lastSlideAnchor();
  firstSlideAnchor = () => this._firstSlideAnchor();

  allSlides = () => this._allSlides;
  slidesElements = () => this._slidesElements;
  domSlides = () => this._domSlides;

  slidesPerView = () => this._slidesPerView;
  spaceBetween = () => this._spaceBetween;
  center = () => this._center;

  visibleDom = () => this._visibleDom;
  slidesIndexOrder = () => this._slidesIndexOrder;
  slidesWidths = () => this._slidesWidths;
  slides = () => this._slidesElements;
  slideTranslates = () => this._slideTranslates;
  snapsDom = () => this._snapsDom;
  currentTranslate = () => this._currentTranslate;
  lastTranslate = () => this._lastTranslate;
  navigateSlideBySlide = () => this._navigateSlideBySlide;
  isRtl = () => this._isRtl;
  isVertical = () => this._isVertical();
  peekOffset = () => this._peekOffset();
  a11y = () => this._a11y;
  virtual = () => this._virtual;
  pagination = () => this._pagination;

  patch(partial: any) {
    if (partial.slidesIndexOrder) {
      this._slidesIndexOrder = partial.slidesIndexOrder;
    }
    if (typeof partial.currentTranslate === 'number') {
      this._currentTranslate = partial.currentTranslate;
    }
    if (typeof partial.lastTranslate === 'number') {
      this._lastTranslate = partial.lastTranslate;
    }
  }

  setCurrentPosition(pos: number) {
    this._currentPosition.set(pos);
  }

  setStepSlides(step: number) {
    this._stepSlides = step;
  }

  setLoop(loop: boolean) {
    this._loop = loop;
  }

  setTotalSlides(total: number) {
    this._totalSlides.set(total);
    this._lastSlideAnchor.set(Math.max(0, total - 1));
  }

  setLastSlideAnchor(anchor: number) {
    this._lastSlideAnchor.set(anchor);
  }

  setFirstSlideAnchor(anchor: number) {
    this._firstSlideAnchor.set(anchor);
  }

  setAllSlides(allSlides: ElementRef<HTMLElement> | undefined) {
    this._allSlides = allSlides;
  }

  setSlidesElements(slides: ElementRef<HTMLElement>[] | undefined) {
    this._slidesElements = slides;
    this._domSlides = slides?.map((slide) => slide?.nativeElement);
  }

  setLazyLoading(lazy: boolean) {
    this._lazyLoading = lazy;
  }

  setSlidesPerView(spv: number | 'auto') {
    this._slidesPerView = spv;
  }

  setSpaceBetween(space: number) {
    this._spaceBetween = space;
  }

  setCenter(center: boolean) {
    this._center = center;
  }

  // --- nouveaux setters pour ce que le service / tests utilisent ---

  setFullWidth(value: number) {
    this._fullWidth = value;
  }

  setMarginStart(value: number) {
    this._marginStart = value;
  }

  setInitialSlide(value: number) {
    this._initialSlide = value;
  }

  setVisibleDom(snaps: any[]) {
    this._visibleDom = snaps;
  }

  setSlidesIndexOrder(order: number[]) {
    this._slidesIndexOrder = order;
  }

  setSlidesWidths(widths: number[]) {
    this._slidesWidths = widths;
  }

  setSlideTranslates(translates: number[]) {
    this._slideTranslates = translates;
  }

  setSnapsDom(snaps: any[]) {
    this._snapsDom = snaps;
  }

  setCurrentTranslate(value: number) {
    this._currentTranslate = value;
  }

  setLastTranslate(value: number) {
    this._lastTranslate = value;
  }

  setPeekOffset(value: number) {
    this._peekOffset.set(value);
  }

  setVertical(value: boolean) {
    this._isVertical.set(value);
  }

  setA11y(a11y: typeof this._a11y) {
    this._a11y = a11y;
  }

  setPagination(pagination: any) {
    this._pagination = pagination;
  }
}

export function createSlideElement(width: number): ElementRef<HTMLElement> {
  const nativeElement = {
    getBoundingClientRect: () => ({ width }),
  } as any;
  return new ElementRef(nativeElement);
}
