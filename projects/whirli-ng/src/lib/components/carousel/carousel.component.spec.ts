import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';

import { CarouselComponent } from './carousel.component';
import { CarouselStore } from '../../carousel.store';
import { CarouselNavigationService } from '../../services/carousel-navigation.service';
import { CarouselLoopService } from '../../services/carousel-loop.service';
import { CarouselTransformService } from '../../services/carousel-transform.service';
import { CarouselBreakpointService } from '../../services/carousel-breakpoints.service';
import { Renderer2, signal } from '@angular/core';
import { CarouselDomService } from '../../services/carousel-dom.service';
import { createSlideElement } from '../../helpers/tests/test.utils.helper';

describe.skip('CarouselComponent', () => {
  let fixture: ComponentFixture<CarouselComponent>;
  let component: CarouselComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarouselComponent],
      providers: [CarouselNavigationService, CarouselLoopService],
    })
      .overrideProvider(CarouselDomService, {
        useValue: {
          resetPositions: jest.fn(),
          updateSlides: jest.fn(),
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CarouselComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('debug', false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize uniqueCarouselId and patch store in ngOnInit', () => {
    fixture.componentRef.setInput('initialSlide', 2);

    const store = component.store as CarouselStore;

    fixture.detectChanges();

    store.patch({
      slidesElements: [
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
      ],
    });

    const state = store.state();

    expect(state.currentPosition).toBe(2);
    expect(state.currentRealPosition).toBe(2);
    expect(state.uniqueCarouselId).toBeTruthy();
  });

  it('should slideTo given index with animation', () => {
    const store = component.store as CarouselStore;

    jest.spyOn(component as any, 'clampToVisibleSlide').mockReturnValue(2);
    const enableTransitionSpy = jest.spyOn(
      component as any,
      'enableTransition'
    );
    const updateTransformSpy = jest.spyOn(component as any, 'updateTransform');

    const transformService = (component as any)
      .transformService as CarouselTransformService;
    jest
      .spyOn(transformService, 'getTranslateFromPosition')
      .mockReturnValue(456);

    store.patch({ slides: [{}, {}, {}], currentPosition: 0 });

    component.slideTo(2, true);

    const state = store.state();

    expect(state.currentRealPosition).toBe(2);
    expect(state.currentPosition).toBe(2);
    expect(enableTransitionSpy).toHaveBeenCalled();
    expect(updateTransformSpy).toHaveBeenCalledWith(456, false);
  });

  it('should not call enableTransition when animate=false in slideTo', () => {
    const store = component.store as CarouselStore;

    jest.spyOn(component as any, 'clampToVisibleSlide').mockReturnValue(1);

    const enableTransitionSpy = jest.spyOn(
      component as any,
      'enableTransition'
    );
    const updateTransformSpy = jest.spyOn(component as any, 'updateTransform');

    const transformService = (component as any)
      .transformService as CarouselTransformService;
    jest
      .spyOn(transformService, 'getTranslateFromPosition')
      .mockReturnValue(999);

    store.patch({ slides: [{}, {}], currentPosition: 0 });

    component.slideTo(1, false);

    const state = store.state();
    expect(state.currentRealPosition).toBe(1);
    expect(state.currentPosition).toBe(1);

    expect(enableTransitionSpy).not.toHaveBeenCalled();
    expect(updateTransformSpy).toHaveBeenCalledWith(999, false);
  });

  it('should slideToNext and emit slideNext', () => {
    const loopService = (component as any).loopService as CarouselLoopService;
    const navigationService = (component as any)
      .navigationService as CarouselNavigationService;

    const slideToSpy = jest.spyOn(component, 'slideTo');
    const loopSpy = jest.spyOn(loopService, 'insertLoopSlides');
    const navSpy = jest
      .spyOn(navigationService, 'calculateNewPositionAfterNavigation')
      .mockReturnValue(5);

    const slideNextSpy = jest.fn();
    component.slideNext.subscribe(slideNextSpy);

    component.slideToNext();

    expect(loopSpy).toHaveBeenCalledWith(undefined, false);
    expect(navSpy).toHaveBeenCalledWith(true);
    expect(slideNextSpy).toHaveBeenCalledTimes(1);
    expect(slideToSpy).toHaveBeenCalledWith(5);
  });

  it('should slideToPrev and emit slidePrev', () => {
    const loopService = (component as any).loopService as CarouselLoopService;
    const navigationService = (component as any)
      .navigationService as CarouselNavigationService;

    const slideToSpy = jest.spyOn(component, 'slideTo');
    const loopSpy = jest.spyOn(loopService, 'insertLoopSlides');
    const navSpy = jest
      .spyOn(navigationService, 'calculateNewPositionAfterNavigation')
      .mockReturnValue(1);

    const slidePrevSpy = jest.fn();
    component.slidePrev.subscribe(slidePrevSpy);

    component.slideToPrev();

    expect(loopSpy).toHaveBeenCalledWith(undefined, true);
    expect(navSpy).toHaveBeenCalledWith(false);
    expect(slidePrevSpy).toHaveBeenCalledTimes(1);
    expect(slideToSpy).toHaveBeenCalledWith(1);
  });

  it('should slide to nearest position when swipeToNearest is called', () => {
    const transformService = (component as any)
      .transformService as CarouselTransformService;
    const transformSpy = jest
      .spyOn(transformService, 'calculateTargetPositionAfterTranslation')
      .mockReturnValue({ position: 4, exactPosition: 4 });

    const slideToSpy = jest.spyOn(component, 'slideTo');

    jest.spyOn(component as any, 'isReachEnd').mockReturnValue(false);
    jest.spyOn(component as any, 'isReachStart').mockReturnValue(false);

    (component as any).dragState.set({
      isDragging: false,
      hasMoved: true,
      hasExtraTranslation: false,
      startX: 0,
      lastX: 0,
      lastMoveTime: 99,
      lastClickTime: 0,
      lastPageXPosition: 0,
    });

    (component as any)['slideToNearest']();

    expect(transformSpy).toHaveBeenCalledWith(false, false);
    expect(slideToSpy).toHaveBeenCalledWith(4, true, true);
  });

  it('should patch store when inputs change', () => {
    const store = component.store as CarouselStore;

    fixture.componentRef.setInput('loop', true);
    fixture.componentRef.setInput('slidesPerView', 3);

    fixture.detectChanges();

    const state = store.state();
    expect(state.loop).toBe(true);
    expect(state.slidesPerView).toBe(3);
  });

  it('should call breakpointService methods in applyBreakpoints', () => {
    const breakpointService = (component as any)
      .breakpointService as CarouselBreakpointService;

    const cssSpy = jest
      .spyOn(breakpointService, 'generateCss')
      .mockReturnValue('<style></style>');
    const setupSpy = jest
      .spyOn(breakpointService, 'setupMediaQueryListeners')
      .mockReturnValue();

    fixture.componentRef.setInput('breakpoints', {
      '(min-width: 500px)': { slidesPerView: 2 },
    });

    fixture.detectChanges();

    expect(cssSpy).toHaveBeenCalled();
    expect(setupSpy).toHaveBeenCalled();
  });

  it('should handle keyboard navigation (ArrowRight)', () => {
    const slideToNextSpy = jest.spyOn(component, 'slideToNext');

    fixture.componentRef.setInput('keyboardNavigation', true);
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    fixture.nativeElement.dispatchEvent(event);

    expect(slideToNextSpy).toHaveBeenCalled();
  });

  it('should emit reachStart when attempting to slidePrev at the first slide (no loop)', () => {
    const store = component.store;
    fixture.detectChanges();

    store.patch({
      slidesElements: [
        {
          nativeElement: {
            getBoundingClientRect: () => ({ width: 100 } as any),
          },
        },
        {
          nativeElement: {
            getBoundingClientRect: () => ({ width: 100 } as any),
          },
        },
        {
          nativeElement: {
            getBoundingClientRect: () => ({ width: 100 } as any),
          },
        },
        {
          nativeElement: {
            getBoundingClientRect: () => ({ width: 100 } as any),
          },
        },
      ],
    });
    fixture.componentRef.setInput('loop', false);
    fixture.detectChanges();

    const reachStartSpy = jest.fn();
    component.reachStart.subscribe(reachStartSpy);

    const slideToSpy = jest.spyOn(component, 'slideTo');

    component.slideToPrev();

    expect(reachStartSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit reachEnd when attempting to slideNext at the last slide (no loop)', () => {
    const store = component.store;

    store.patch({ slides: [{}, {}, {}, {}], currentPosition: 3 });
    fixture.componentRef.setInput('loop', false);
    fixture.detectChanges();

    const reachEndSpy = jest.fn();
    component.reachEnd.subscribe(reachEndSpy);

    const slideToSpy = jest.spyOn(component, 'slideTo');

    component.slideToNext();

    expect(reachEndSpy).toHaveBeenCalledTimes(1);
  });
});
