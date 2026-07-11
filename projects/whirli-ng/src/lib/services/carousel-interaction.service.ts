import { inject, Injectable, Injector, signal, untracked } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import { CarouselLoopService } from './carousel-loop.service';
import { CarouselPhysicsService } from './carousel-physics.service';
import { CarouselDomService } from './carousel-dom.service';
import {
  CAROUSEL_VIEW,
  CarouselViewActions,
} from '../components/carousel/view-adapter';
import { getPointerPosition } from '../helpers/event.helper';
import { CarouselVirtualService } from './carousel-virtual.service';
import { clampBetween } from '../helpers/calculations.helper';

export type PointerCoords = {
  x: number;
  y: number;
  isTouch: boolean;
};

export type DragState = {
  isDragging: boolean;
  hasMoved: boolean;
  hasExtraTranslation: boolean;
  lastMain: number;
  currentMain: number;
  lastMoveTime: number;
  lastClickTime: number;
  lastMainPosition: number;
  lockedAxis: 'main' | 'cross' | null;
};

// Determine threshold for mobile scroll on page while sliding.
const AXIS_LOCK_THRESHOLD_PX = 8;
const SWIPE_THRESHOLD_PX = 15;
const SWIPE_TIME_LIMIT_MS = 200;
const MIN_DRAG_DISTANCE_PX = 5;
const CLICK_MAX_DISTANCE_PX = 2;
const CLICK_MAX_TIME_MS = 200;

@Injectable()
export class CarouselInteractionService {
  private readonly store = inject(CarouselStore);
  private readonly physicsService = inject(CarouselPhysicsService);
  private readonly loopService = inject(CarouselLoopService);
  private readonly domService = inject(CarouselDomService);
  private readonly virtualService = inject(CarouselVirtualService);

  private readonly injector = inject(Injector);

  private suppressNextNativeClick = false;

  private get view(): CarouselViewActions {
    return this.injector.get(CAROUSEL_VIEW);
  }

  public sensitivity = 1;
  public velocitySensitivity = 5;
  public velocitySensitivityFreeMode = 1;
  public velocityBounds = 0.5;

  public gestureStart: {
    main: number;
    cross: number;
    time: number;
    event?: MouseEvent | TouchEvent;
  } = { main: 0, cross: 0, time: 0 };

  private dragState = signal<DragState>({
    isDragging: false,
    hasMoved: false,
    hasExtraTranslation: false,
    lastMain: 0,
    currentMain: 0,
    lastMoveTime: 0,
    lastClickTime: 0,
    lastMainPosition: 0,
    lockedAxis: null,
  });

  public getDragState() {
    return this.dragState();
  }

  public updateDragState(updatedState: Partial<DragState>) {
    this.dragState.update((state) => ({
      ...state,
      ...updatedState,
    }));
  }

  public consumeSuppressNextNativeClick(): boolean {
    if (!this.suppressNextNativeClick) {
      return false;
    }

    this.suppressNextNativeClick = false;
    return true;
  }

  /**
   * Update translation as user is dragging.
   * @param deltaMain
   * @param noExtraTranslation
   * @param mainPosition
   */
  public followUserMove(
    deltaMain: number,
    noExtraTranslation = false,
    mainPosition?: number,
  ) {
    const effectiveDeltaMain = this.store.isRtl() ? -deltaMain : deltaMain;

    let newTranslate =
      this.store.currentTranslate() + effectiveDeltaMain / this.sensitivity;
    const clampedTranslate = clampBetween(
      newTranslate,
      this.store.maxTranslate(),
      this.store.minTranslate(),
    );

    const isOutOfBounds =
      !this.store.loop() &&
      !Number.isNaN(newTranslate) &&
      newTranslate !== clampedTranslate;

    if (isOutOfBounds) {
      const resistance = this.store.resistance();
      let ratio: number;
      if (resistance === false || resistance === 0) {
        ratio = 0;
      } else if (resistance === true) {
        ratio = this.velocityBounds;
      } else {
        ratio = resistance;
      }

      if (noExtraTranslation || ratio <= 0) {
        // Hard clamp.
        newTranslate = clampedTranslate;
      } else {
        this.dragState.update((state) => ({
          ...state,
          hasExtraTranslation: true,
        }));
        newTranslate =
          this.store.currentTranslate() +
          (effectiveDeltaMain / this.sensitivity) * ratio;
      }
    } else {
      this.dragState.update((state) => ({
        ...state,
        hasExtraTranslation: false,
      }));
    }

    this.updatePositionOnMouseMove(newTranslate, mainPosition);
  }

  /**
   * Update current translate and apply transform CSS.
   * @param newTranslate
   * @param mainPosition
   */
  private updatePositionOnMouseMove(
    newTranslate: number,
    mainPosition?: number,
  ) {
    const rawVelocity = mainPosition
      ? (mainPosition - this.dragState().lastMainPosition) *
        (this.store.freeMode()
          ? this.velocitySensitivityFreeMode
          : this.velocitySensitivity)
      : 0;

    const velocity = this.store.isRtl() ? -rawVelocity : rawVelocity;

    this.store.patch({
      currentTranslate: newTranslate,
      velocity,
    });

    this.loopService.insertLoopSlidesByTranslation();
    this.virtualService.syncVirtualSlides();

    this.view.updateTransform();
  }

  /**
   * Promote the user-perceived index to currentRealPosition so the perception
   * persists once isDragging flips back to false. Used at drag end in
   * freeMode to avoid the active slide / thumb snapping back to
   * lastSlideAnchor after the user released the pointer in the residual zone.
   */
  private commitPerceivedIndex(explicit?: number) {
    const perceived = explicit ?? this.store.perceivedIndex();
    const real = this.store.currentRealPosition();
    if (perceived !== real && perceived >= 0) {
      this.store.patch({ currentRealPosition: perceived });
    }
  }

  public resetDrag() {
    this.dragState.update((state) => ({
      ...state,
      isDragging: false,
      hasMoved: false,
      lockedAxis: null,
    }));
    this.store.patch({ isDragging: false });
    this.domService.updateSlides();
  }

  private shouldStartDrag(event: MouseEvent | TouchEvent): boolean {
    if (!this.store.draggable()) {
      return false;
    }

    const target = event.target as HTMLElement | null;
    if (!target) {
      return true;
    }

    const selector = this.store.state().dragIgnoreSelector;
    if (!selector) {
      return true;
    }

    try {
      const ignoreCandidate = target.closest(selector);
      return !ignoreCandidate;
    } catch (e) {
      console.error('[Carousel] Invalid dragIgnoreSelector:', selector, e);
      return true;
    }
  }

  public handleMove(event: MouseEvent | TouchEvent, onDragStart?: () => void) {
    const dragState = this.getDragState();

    if (!dragState.isDragging) {
      return;
    }

    const { x, y, isTouch } = getPointerPosition(event);
    const main = this.store.axisConf().pointerMainPos({ x, y });
    const cross = this.store.axisConf().pointerCrossPos({ x, y });

    const now = Date.now();
    const gestureStart = this.gestureStart;
    if (isTouch && gestureStart) {
      const { lockedAxis } = dragState;

      if (!lockedAxis) {
        const deltaMain = main - gestureStart.main;
        const deltaCross = cross - gestureStart.cross;
        const absDeltaMain = Math.abs(deltaMain);
        const absDeltaCross = Math.abs(deltaCross);

        // Too little gesture to decide.
        if (
          absDeltaMain < AXIS_LOCK_THRESHOLD_PX &&
          absDeltaCross < AXIS_LOCK_THRESHOLD_PX
        ) {
          return;
        }

        if (absDeltaMain >= absDeltaCross) {
          this.updateDragState({ lockedAxis: 'main' });
        } else {
          // Cross gesture => no drag
          this.resetDrag();
          return;
        }

        // Main gesture.
        this.updateDragState({ lockedAxis: 'main' });
      } else if (lockedAxis === 'cross') {
        return;
      }
    }

    // For mouse.
    if (!isTouch && dragState.lockedAxis !== 'main') {
      this.updateDragState({ lockedAxis: 'main' });
    }

    if (this.getDragState().lockedAxis !== 'main') {
      return;
    }

    if (isTouch) {
      event.preventDefault();
    }

    const deltaMain = (main - dragState.currentMain) * this.sensitivity;
    const currentState = this.getDragState();
    this.updateDragState({
      hasMoved: true,
      lastMoveTime: now,
      currentMain: currentState.currentMain + deltaMain,
      lastMainPosition:
        now - currentState.lastMoveTime > 50
          ? main
          : currentState.lastMainPosition,
    });

    if (this.shouldStartDrag(gestureStart.event ?? event)) {
      if (!currentState.hasMoved) {
        onDragStart?.();
      }
      this.followUserMove(deltaMain, false, main);
    }
  }

  public handleStart(event: MouseEvent | TouchEvent) {
    // If this start should trigger a drag (not on a dragIgnoreSelector
    // target), prevent the browser's native drag of <img>/<a> children
    if (
      event instanceof MouseEvent &&
      this.shouldStartDrag(event) &&
      event.cancelable !== false
    ) {
      event.preventDefault();
    }

    const position = getPointerPosition(event);

    const main = this.store.axisConf().pointerMainPos(position);
    const cross = this.store.axisConf().pointerCrossPos(position);

    this.gestureStart = {
      main,
      cross,
      time: Date.now(),
      event,
    };

    this.store.patch({ lastTranslate: this.store.currentTranslate() });

    this.updateDragState({
      isDragging: true,
      hasMoved: false,
      hasExtraTranslation: false,
      currentMain: main,
      lastMainPosition: main,
      lastClickTime: new Date().getTime(),
      lockedAxis: null,
    });
    this.store.patch({ isDragging: true });

    // Stop autoplay on interaction if option is enabled
    this.view.stopAutoplayOnInteraction();
  }

  /**
   * Returns true if it was a dragging move and false otherwise.
   * @param event
   * @returns
   */
  public handleEnd(event: MouseEvent | TouchEvent): boolean {
    if (!this.getDragState().isDragging) {
      return false;
    }

    const { x, y } = getPointerPosition(event);
    const main = this.store.axisConf().pointerMainPos({ x, y });

    const timeEnd = Date.now();

    const dist = main - this.gestureStart.main;
    const duration = timeEnd - this.gestureStart.time;
    const absDist = Math.abs(dist);

    if (
      absDist < MIN_DRAG_DISTANCE_PX &&
      !this.getDragState().hasExtraTranslation
    ) {
      this.resetDrag();
      return false;
    }

    if (this.store.draggable()) {
      this.suppressNextNativeClick = true;
    }

    const isSwipe =
      duration < SWIPE_TIME_LIMIT_MS && absDist > SWIPE_THRESHOLD_PX;

    // Freemode specific
    if (this.store.freeMode() || this.store.navigateSlideBySlide()) {
      if (isSwipe) {
        this.physicsService.applyInertia(undefined, (translate) => {
          this.view.updateTransform(translate);
        });
        this.commitPerceivedIndex();
        this.resetDrag();
        return true;
      }
      if (
        this.getDragState().hasExtraTranslation &&
        !this.store.navigateSlideBySlide()
      ) {
        const perceivedBefore = this.store.perceivedIndex();
        this.view.slideToNearest();
        this.commitPerceivedIndex(perceivedBefore);
        this.resetDrag();
        return true;
      }
      this.commitPerceivedIndex();
      this.resetDrag();
      return true;
    }

    const swipeToLeft = dist < 0;

    // Swipe
    if (isSwipe && this.store.canSwipe()) {
      if (!this.store.isRtl()) {
        swipeToLeft ? this.view.slideToNext() : this.view.slideToPrev();
      } else {
        swipeToLeft ? this.view.slideToPrev() : this.view.slideToNext();
      }
      this.resetDrag();
      return true;
    }

    // Classic translation
    if (this.store.draggable()) {
      this.view.slideToNearest();
      this.commitPerceivedIndex();
    }

    this.resetDrag();
    return true;
  }

  public handleClick(event: MouseEvent) {
    if (this.consumeSuppressNextNativeClick()) {
      return;
    }

    if (this.getDragState().hasMoved) {
      return;
    }

    const deltaMain =
      this.store.axisConf().mouseMainPos(event) - this.gestureStart.main;
    const deltaCross =
      this.store.axisConf().mouseCrossPos(event) - this.gestureStart.cross;
    const dist = Math.hypot(deltaMain, deltaCross);
    const dt = Date.now() - this.gestureStart.time;

    if (dist > CLICK_MAX_DISTANCE_PX || dt > CLICK_MAX_TIME_MS) {
      return;
    }

    this.view.clickOnSlide(event);
  }

  public handleWheel(event: WheelEvent) {
    const mouseWheel = this.store.state().mouseWheel;
    if (!mouseWheel) {
      return;
    }
    const wheelAllowed =
      mouseWheel === true ||
      (this.store.isVertical() && mouseWheel.vertical) ||
      (!this.store.isVertical() && mouseWheel.horizontal);
    if (!wheelAllowed) {
      return;
    }
    const delta = this.store.axisConf().wheelMainDelta(event);
    if (!delta) {
      return;
    }

    event.preventDefault();
    this.store.patch({
      lastTranslate: this.store.currentTranslate(),
    });
    const deltaMain = -delta * this.sensitivity;
    this.followUserMove(deltaMain, true);
  }
}
