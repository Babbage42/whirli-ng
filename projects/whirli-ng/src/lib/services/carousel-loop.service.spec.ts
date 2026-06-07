import { TestBed } from '@angular/core/testing';
import { ElementRef, Renderer2 } from '@angular/core';
import { CarouselLoopService } from './carousel-loop.service';
import { CarouselStore } from '../carousel.store';
import {
  CAROUSEL_VIEW,
  CarouselViewActions,
} from '../components/carousel/view-adapter';
import { CarouselStoreFake } from '../helpers/tests/test.utils.helper';
describe('CarouselLoopService', () => {
  let service: CarouselLoopService;
  let store: CarouselStoreFake;
  let viewMock: Pick<
    CarouselViewActions,
    'disableTransition' | 'updateTransform'
  >;

  beforeEach(() => {
    store = new CarouselStoreFake();

    viewMock = {
      disableTransition: jest.fn(),
      updateTransform: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        CarouselLoopService,
        { provide: CarouselStore, useValue: store },
        { provide: CAROUSEL_VIEW, useValue: viewMock },
        // Renderer2 is injected into the service, we just provide a stub
        { provide: Renderer2, useValue: {} },
      ],
    });

    service = TestBed.inject(CarouselLoopService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('insertLoopSlidesByTranslation', () => {
    it('inserts one slide before when left edge is close to the start', () => {
      store.setLoop(true);
      store.setVisibleDom([{ domIndex: 0 } as any]);

      store.setCurrentTranslate(-20);

      // Simulate computed signals scrollWidth() and fullWidth()
      (store as any).scrollWidth = jest.fn(() => 300);
      (store as any).fullWidth = jest.fn(() => 200);

      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => undefined as any);

      service.insertLoopSlidesByTranslation();

      expect(insertElementSpy).toHaveBeenCalledTimes(1);
      expect(insertElementSpy.mock.calls[0][0]).toBe(true);
    });

    it('inserts one slide after when right edge is close to the end', () => {
      store.setLoop(true);
      store.setVisibleDom([{ domIndex: 0 } as any]);

      store.setCurrentTranslate(-100);

      (store as any).scrollWidth = jest.fn(() => 200);
      (store as any).fullWidth = jest.fn(() => 200);

      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => undefined as any);

      service.insertLoopSlidesByTranslation();

      expect(insertElementSpy).toHaveBeenCalledTimes(1);
      expect(insertElementSpy.mock.calls[0][0]).toBe(false);
    });

    it('does nothing when there is no empty space at the edges', () => {
      store.setLoop(true);
      store.setVisibleDom([{ domIndex: 0 } as any]);

      store.setCurrentTranslate(-100);

      (store as any).scrollWidth = jest.fn(() => 400);
      (store as any).fullWidth = jest.fn(() => 200);

      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => undefined as any);

      service.insertLoopSlidesByTranslation();

      expect(insertElementSpy).not.toHaveBeenCalled();
    });
  });

  describe('insertLoopSlidesByNavigation', () => {
    it('inserts missing slides BEFORE when slidesAvailableBefore < stepSlides', () => {
      store.setLoop(true);
      store.setTotalSlides(5);
      store.setStepSlides(3);
      // leftMostIndex = 1 => slidesAvailableBefore = 1 => 2 missing slides
      store.setVisibleDom([
        { domIndex: 1 } as any,
        { domIndex: 2 } as any,
        { domIndex: 3 } as any,
      ]);

      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => undefined as any);

      service.insertLoopSlidesByNavigation(true);

      expect(insertElementSpy).toHaveBeenCalledTimes(2);
      insertElementSpy.mock.calls.forEach(([before]) =>
        expect(before).toBe(true)
      );
    });

    it('inserts missing slides AFTER when slidesAvailableAfter < stepSlides', () => {
      store.setLoop(true);
      store.setTotalSlides(5);
      store.setStepSlides(3);
      // rightMostIndex = 3 => slidesAvailableAfter = 1 => 2 missing slides
      store.setVisibleDom([
        { domIndex: 1 } as any,
        { domIndex: 2 } as any,
        { domIndex: 3 } as any,
      ]);

      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => undefined as any);

      service.insertLoopSlidesByNavigation(false);

      expect(insertElementSpy).toHaveBeenCalledTimes(2);
      insertElementSpy.mock.calls.forEach(([before]) =>
        expect(before).toBe(false)
      );
    });

    it('does nothing when enough slides are available before and after step', () => {
      store.setLoop(true);
      store.setTotalSlides(10);
      store.setStepSlides(3);

      // Visible range: indices 3 to 6
      store.setVisibleDom([
        { domIndex: 3 } as any,
        { domIndex: 4 } as any,
        { domIndex: 5 } as any,
        { domIndex: 6 } as any,
      ]);

      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => undefined as any);

      service.insertLoopSlidesByNavigation(true);
      service.insertLoopSlidesByNavigation(false);

      expect(insertElementSpy).not.toHaveBeenCalled();
    });
  });

  describe('insertLoopSlidesBySlidingTo', () => {
    it('does nothing when translation diff is less than 1 (no elements recalculated)', () => {
      store.setLoop(true);
      store.setVisibleDom([{ domIndex: 0 } as any]);

      // futureTranslate == currentTranslate => translateDiff = 0
      store.setSlideTranslates([50, 60, 70]);
      store.setCurrentTranslate(60);

      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => undefined as any);

      // act
      service.insertLoopSlidesBySlidingTo(1);

      // assert: nothing is recalculated / inserted
      expect(insertElementSpy).not.toHaveBeenCalled();
    });

    it('inserts slides before and after when there is visible space at the edges', () => {
      store.setLoop(true);
      store.setTotalSlides(3);
      store.setVisibleDom([
        { domIndex: 0 } as any,
        { domIndex: 1 } as any,
        { domIndex: 2 } as any,
      ]);

      store.setFullWidth(500);
      store.setSpaceBetween(10);
      store.setCenter(false);

      const snaps = [0, 1, 2].map((i) => ({
        domIndex: i,
        left: i * 100,
        width: 100,
        translate: i * 100,
      })) as any[];
      store.setSnapsDom(snaps);

      // We move 50px away from the final destination
      store.setSlideTranslates([0, 100, 200]);
      store.setCurrentTranslate(50);

      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => ({ width: 80, offset: 0 }));

      // act
      service.insertLoopSlidesBySlidingTo(1);

      // assert: we have inserted both before AND after
      const beforeCalls = insertElementSpy.mock.calls.filter(
        ([before]) => before === true
      ).length;
      const afterCalls = insertElementSpy.mock.calls.filter(
        ([before]) => before === false
      ).length;

      expect(beforeCalls).toBeGreaterThan(0);
      expect(afterCalls).toBeGreaterThan(0);
    });

    it('inserts only before when the first slide is visible and the last visible slide is not the last one', () => {
      store.setLoop(true);
      store.setTotalSlides(4);

      store.setVisibleDom([
        { domIndex: 0 } as any,
        { domIndex: 1 } as any,
        { domIndex: 2 } as any,
      ]);

      store.setFullWidth(350);
      store.setSpaceBetween(10);
      store.setCenter(false);

      const snaps = [0, 1, 2].map((i) => ({
        domIndex: i,
        left: i * 100,
        width: 100,
        translate: i * 100,
      })) as any[];
      store.setSnapsDom(snaps);

      // We move by 10px compared to the future translate
      store.setSlideTranslates([0, -10, -20, -30]);
      store.setCurrentTranslate(0);

      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => ({ width: 80, offset: 0 }));

      // act
      service.insertLoopSlidesBySlidingTo(1);

      const beforeCalls = insertElementSpy.mock.calls.filter(
        ([before]) => before === true
      ).length;
      const afterCalls = insertElementSpy.mock.calls.filter(
        ([before]) => before === false
      ).length;

      expect(beforeCalls).toBeGreaterThan(0);
      expect(afterCalls).toBe(0);
    });
  });

  describe('initializeLoopCenter', () => {
    it('does nothing when loop is disabled', () => {
      store.setLoop(false);
      store.setCenter(true);
      store.setTotalSlides(5);
      store.setAllSlides(new ElementRef(document.createElement('div')));

      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => undefined as any);

      service.initializeLoopCenter();

      expect(insertElementSpy).not.toHaveBeenCalled();
    });

    it('does nothing when center is disabled', () => {
      store.setLoop(true);
      store.setCenter(false);
      store.setTotalSlides(5);
      store.setAllSlides(new ElementRef(document.createElement('div')));

      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => undefined as any);

      service.initializeLoopCenter();

      expect(insertElementSpy).not.toHaveBeenCalled();
    });

    it('does nothing when there are no slides or no allSlides container', () => {
      store.setLoop(true);
      store.setCenter(true);

      // case 1: totalSlides = 0
      store.setTotalSlides(0);
      store.setAllSlides(new ElementRef(document.createElement('div')));

      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => undefined as any);

      service.initializeLoopCenter();
      expect(insertElementSpy).not.toHaveBeenCalled();

      jest.restoreAllMocks();

      // case 2: no container
      store.setTotalSlides(5);
      store.setAllSlides(undefined);

      const insertElementSpy2 = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => undefined as any);

      service.initializeLoopCenter();
      expect(insertElementSpy2).not.toHaveBeenCalled();
    });

    it('inserts the required number of slides to fill the initial space before initialSlide', () => {
      store.setLoop(true);
      store.setCenter(true);
      store.setTotalSlides(5);
      store.setAllSlides(new ElementRef(document.createElement('div')));

      // global width + margin to compute spaceToFill
      store.setFullWidth(500);
      store.setMarginStart(0);
      store.setSpaceBetween(10);

      // initial slide: width 100
      store.setInitialSlide(0);
      store.setSlidesWidths([100, 80, 80, 80, 80]);

      // spaceToFill = 500/2 - 100/2 - 0 = 200
      // each insertElement returns width=80 => 80 + 10 = 90 per loop
      // => 3 calls: 90, 180, 270 >= 200
      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => ({ width: 80, offset: 0 }));

      service.initializeLoopCenter();

      expect(insertElementSpy).toHaveBeenCalledTimes(3);
      insertElementSpy.mock.calls.forEach(([before]) =>
        expect(before).toBe(true)
      );
    });

    it('does nothing when spaceToFill is less or equal to zero', () => {
      store.setLoop(true);
      store.setCenter(true);
      store.setTotalSlides(2);
      store.setAllSlides(new ElementRef(document.createElement('div')));

      store.setFullWidth(200);
      store.setMarginStart(0);
      store.setSpaceBetween(10);

      store.setInitialSlide(0);
      store.setSlidesWidths([400, 100]);

      const insertElementSpy = jest
        .spyOn<any>(service as any, 'insertElement')
        .mockImplementation(() => ({ width: 80, offset: 0 }));

      service.initializeLoopCenter();

      expect(insertElementSpy).not.toHaveBeenCalled();
    });
  });
});
