import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { CarouselStore } from '../carousel.store';
import { CarouselBreakpointService } from './carousel-breakpoints.service';
import { CarouselStoreFake } from '../helpers/tests/test.utils.helper';

describe('CarouselBreakpointService', () => {
  let service: CarouselBreakpointService;
  let storeFake: CarouselStoreFake;

  beforeEach(() => {
    storeFake = new CarouselStoreFake();

    (window as any).matchMedia = jest
      .fn()
      .mockImplementation((query: string) => {
        return {
          media: query,
          matches: false,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        } as any as MediaQueryList;
      });

    TestBed.configureTestingModule({
      providers: [
        CarouselBreakpointService,
        { provide: CarouselStore, useValue: storeFake as any },
        { provide: DOCUMENT, useValue: document },
      ],
    });

    service = TestBed.inject(CarouselBreakpointService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateCss', () => {
    it('should return empty string if breakpoints is undefined', () => {
      const css = service.generateCss(undefined, 'uid123');
      expect(css).toBe('');
    });

    it("should return empty string if store.slidesPerView() === 'auto'", () => {
      storeFake.setSlidesPerView('auto');

      const breakpoints = {
        '(min-width: 768px)': { slidesPerView: 3, spaceBetween: 20 },
      };

      const css = service.generateCss(breakpoints as any, 'uid123');
      expect(css).toBe('');
    });

    it('should generate CSS using breakpoint values and store fallbacks', () => {
      storeFake.setSlidesPerView(2);
      storeFake.setSpaceBetween(10);

      const breakpoints = {
        '(min-width: 768px)': {
          slidesPerView: 3,
          spaceBetween: 20,
        },
        '(min-width: 1024px)': {
          slidesPerView: 4,
        },
      };

      const css = service.generateCss(breakpoints as any, 'carousel-uid');

      expect(css.startsWith('<style>')).toBe(true);
      expect(css.endsWith('</style>')).toBe(true);

      // 1st breakpoint : 3 slides, 20px
      // calc((100% - 40px) / 3)
      expect(css).toContain('@media (min-width: 768px)');
      expect(css).toContain('.slides.carousel-uid');
      expect(css).toContain('grid-auto-columns: calc((100% - 40px) / 3)');
      expect(css).toContain('gap: 20px');

      // 2nd breakpoint : 4 slides, fallback space 10px
      // calc((100% - 30px) / 4)
      expect(css).toContain('@media (min-width: 1024px)');
      expect(css).toContain('grid-auto-columns: calc((100% - 30px) / 4)');
      expect(css).toContain('gap: 10px');
    });
  });

  describe('setupMediaQueryListeners & clear', () => {
    it('should register listeners and call onMatch when a breakpoint matches', () => {
      const listeners: ((e: MediaQueryListEvent) => void)[] = [];

      (window as any).matchMedia = jest
        .fn()
        .mockImplementation((query: string) => {
          return {
            media: query,
            matches: false,
            addEventListener: (
              event: string,
              listener: (e: MediaQueryListEvent) => void
            ) => {
              if (event === 'change') {
                listeners.push(listener);
              }
            },
            removeEventListener: jest.fn(),
          } as any as MediaQueryList;
        });

      const breakpoints = {
        '(min-width: 768px)': { slidesPerView: 3 },
        '(min-width: 1024px)': { slidesPerView: 5 },
      };

      const onMatch = jest.fn();

      service.setupMediaQueryListeners(breakpoints as any, onMatch);

      expect((window as any).matchMedia).toHaveBeenCalledTimes(2);
      expect(listeners.length).toBe(2);

      const firstListener = listeners[0];

      firstListener({ matches: true } as MediaQueryListEvent);

      expect(onMatch).toHaveBeenCalledTimes(1);
      expect(onMatch).toHaveBeenCalledWith({ slidesPerView: 3 });
    });

    it('clear() should remove all listeners', () => {
      const removeMocks: jest.Mock[] = [];

      (window as any).matchMedia = jest
        .fn()
        .mockImplementation((query: string) => {
          const mql: any = {
            media: query,
            matches: false,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
          };
          removeMocks.push(mql.removeEventListener);
          return mql as MediaQueryList;
        });

      const breakpoints = {
        '(min-width: 768px)': { slidesPerView: 3 },
        '(min-width: 1024px)': { slidesPerView: 5 },
      };

      service.setupMediaQueryListeners(breakpoints as any, jest.fn());

      service.clear();

      removeMocks.forEach((mock) => {
        expect(mock).toHaveBeenCalled();
      });
    });
  });
});
