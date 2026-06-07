import { TestBed } from '@angular/core/testing';
import { CarouselStore } from '../carousel.store';
import { CarouselInteractionService } from './carousel-interaction.service';
import { CarouselPhysicsService } from './carousel-physics.service';
import { CarouselLoopService } from './carousel-loop.service';
import { CarouselDomService } from './carousel-dom.service';
import { CarouselVirtualService } from './carousel-virtual.service';
import {
  CAROUSEL_VIEW,
  CarouselViewActions,
} from '../components/carousel/view-adapter';

describe('CarouselInteractionService', () => {
  let service: CarouselInteractionService;
  let store: CarouselStore;
  let view: jest.Mocked<CarouselViewActions>;

  beforeEach(() => {
    view = {
      updateTransform: jest.fn(),
      disableTransition: jest.fn(),
      slideToNext: jest.fn(),
      slideToPrev: jest.fn(),
      slideToNearest: jest.fn(),
      clickOnSlide: jest.fn(),
      stopAutoplayOnInteraction: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CarouselInteractionService,
        CarouselStore,
        { provide: CarouselPhysicsService, useValue: {} },
        { provide: CarouselLoopService, useValue: {} },
        { provide: CarouselDomService, useValue: { updateSlides: jest.fn() } },
        { provide: CarouselVirtualService, useValue: {} },
        { provide: CAROUSEL_VIEW, useValue: view },
      ],
    });

    service = TestBed.inject(CarouselInteractionService);
    store = TestBed.inject(CarouselStore);
    store.patch({ freeMode: false });
  });

  function mouse(type: string, x: number, y = 0, target?: EventTarget) {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
    });

    if (target) {
      Object.defineProperty(event, 'target', {
        configurable: true,
        value: target,
      });
    }

    return event;
  }

  it('arms a one-shot native click suppression after a real drag', () => {
    service.handleStart(mouse('mousedown', 0));
    service.handleEnd(mouse('mouseup', -20));

    expect(service.getDragState().hasMoved).toBe(false);
    expect(service.consumeSuppressNextNativeClick()).toBe(true);
    expect(service.consumeSuppressNextNativeClick()).toBe(false);
  });

  it('does not suppress the next native click for a simple click', () => {
    service.handleStart(mouse('mousedown', 0));
    service.handleEnd(mouse('mouseup', 1));

    expect(service.consumeSuppressNextNativeClick()).toBe(false);
  });

  it('ignores document releases when no carousel gesture is active', () => {
    expect(service.handleEnd(mouse('mouseup', 20))).toBe(false);
  });

  it('suppresses the native click after a drag gesture that starts on an ignored child', () => {
    store.patch({ dragIgnoreSelector: 'button' });
    const button = document.createElement('button');

    service.handleStart(mouse('mousedown', 0, 0, button));
    service.handleMove(mouse('mousemove', 20, 0, button));
    service.handleEnd(mouse('mouseup', 20, 0, button));

    expect(service.consumeSuppressNextNativeClick()).toBe(true);
  });

  it('commits the perceived index before resetting a classic drag', () => {
    store.patch({ currentRealPosition: 10 });
    const perceivedSpy = jest.spyOn(store, 'perceivedIndex').mockReturnValue(11);

    service.handleStart(mouse('mousedown', 0));
    (service as any).gestureStart.time = Date.now() - 300;
    service.handleEnd(mouse('mouseup', -30));

    expect(view.slideToNearest).toHaveBeenCalled();
    expect(store.currentRealPosition()).toBe(11);
    expect(perceivedSpy).toHaveBeenCalled();
  });
});
