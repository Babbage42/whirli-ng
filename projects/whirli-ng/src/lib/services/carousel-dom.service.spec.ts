import { TestBed } from '@angular/core/testing';
import { ElementRef, Renderer2 } from '@angular/core';
import { CarouselDomService } from './carousel-dom.service';
import { CarouselStore } from '../carousel.store';
import { CarouselStoreFake } from '../helpers/tests/test.utils.helper';

describe('CarouselDomService', () => {
  let service: CarouselDomService;
  let storeFake: CarouselStoreFake;
  let renderer: Renderer2;

  const createSlide = (index: number, withImages = 0): HTMLElement => {
    const el = document.createElement('div');
    el.classList.add('slide');
    el.dataset.index = String(index);
    for (let i = 0; i < withImages; i++) {
      const img = document.createElement('img');
      el.appendChild(img);
    }
    return el;
  };

  beforeEach(() => {
    storeFake = new CarouselStoreFake();

    const rendererMock: Partial<Renderer2> = {
      addClass: (el: any, className: string) => el.classList.add(className),
      removeClass: (el: any, className: string) =>
        el.classList.remove(className),
      setAttribute: (el: any, name: string, value: string) =>
        el.setAttribute(name, value),
      setProperty: (el: any, name: string, value: any) => {
        (el as any)[name] = value;
      },
    };

    TestBed.configureTestingModule({
      providers: [
        CarouselDomService,
        { provide: CarouselStore, useValue: storeFake as any },
        { provide: Renderer2, useValue: rendererMock },
      ],
    });

    service = TestBed.inject(CarouselDomService);
    renderer = TestBed.inject(Renderer2);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('updateSlides', () => {
    it('should do nothing if allSlides() is falsy', () => {
      expect(storeFake.allSlides()).toBeUndefined();

      expect(() => service.updateSlides()).not.toThrow();
    });

    it('should set accessibility attributes and tabindex correctly', () => {
      const container = document.createElement('div');
      const slide1 = createSlide(0);
      const slide2 = createSlide(1);
      const slide3 = createSlide(2);

      container.appendChild(slide1);
      container.appendChild(slide2);
      container.appendChild(slide3);

      storeFake.setAllSlides(new ElementRef(container));
      storeFake.setSlidesElements([
        new ElementRef(slide1),
        new ElementRef(slide2),
        new ElementRef(slide3),
      ]);
      storeFake.setTotalSlides(3);
      storeFake.setCurrentPosition(1);
      storeFake.setLazyLoading(false);
      storeFake.setSlidesPerView(1);

      service.updateSlides();

      expect(slide1.getAttribute('role')).toBe('group');
      expect(slide1.getAttribute('aria-roledescription')).toBe('slide');
      expect(slide1.getAttribute('aria-label')).toBe('1 of 3');
      expect(slide1.getAttribute('tabindex')).toBe('-1');

      expect(slide2.getAttribute('aria-label')).toBe('2 of 3');
      expect(slide2.getAttribute('tabindex')).toBe('0');

      expect(slide3.getAttribute('aria-label')).toBe('3 of 3');
      expect(slide3.getAttribute('tabindex')).toBe('-1');
    });

    it('should use the configured slide aria-label formatter', () => {
      const container = document.createElement('div');
      const slide1 = createSlide(0);
      const slide2 = createSlide(1);

      container.appendChild(slide1);
      container.appendChild(slide2);

      storeFake.setAllSlides(new ElementRef(container));
      storeFake.setSlidesElements([new ElementRef(slide1), new ElementRef(slide2)]);
      storeFake.setTotalSlides(2);
      storeFake.setCurrentPosition(0);
      storeFake.setLazyLoading(false);
      storeFake.setSlidesPerView(1);
      storeFake.setA11y({
        slideLabel: ({ index, total }) => `Slide ${index + 1} sur ${total}`,
        paginationBulletLabel: ({ index }) => `Aller au slide ${index + 1}`,
      });

      service.updateSlides();

      expect(slide1.getAttribute('aria-label')).toBe('Slide 1 sur 2');
      expect(slide2.getAttribute('aria-label')).toBe('Slide 2 sur 2');
    });

    it('should set prev/curr/next classes with loop = false', () => {
      const container = document.createElement('div');
      const slide1 = createSlide(0);
      const slide2 = createSlide(1);
      const slide3 = createSlide(2);

      container.appendChild(slide1);
      container.appendChild(slide2);
      container.appendChild(slide3);

      storeFake.setAllSlides(new ElementRef(container));
      storeFake.setSlidesElements([
        new ElementRef(slide1),
        new ElementRef(slide2),
        new ElementRef(slide3),
      ]);

      storeFake.setTotalSlides(3);
      storeFake.setCurrentPosition(1);
      storeFake.setLoop(false);
      storeFake.setLazyLoading(false);
      storeFake.setSlidesPerView(1);

      service.updateSlides();

      // resetPositions : position-X
      expect(slide1.classList.contains('position-1')).toBe(true);
      expect(slide2.classList.contains('position-2')).toBe(true);
      expect(slide3.classList.contains('position-3')).toBe(true);

      // curr / prev / next
      expect(slide2.classList.contains('curr')).toBe(true);
      expect(slide3.classList.contains('next')).toBe(true);
      expect(slide1.classList.contains('prev')).toBe(true);

      expect(slide1.classList.contains('curr')).toBe(false);
      expect(slide3.classList.contains('curr')).toBe(false);
    });

    it('should wrap prev/next when loop = true (current on first slide)', () => {
      const container = document.createElement('div');
      const slide1 = createSlide(0);
      const slide2 = createSlide(1);
      const slide3 = createSlide(2);

      container.appendChild(slide1);
      container.appendChild(slide2);
      container.appendChild(slide3);

      storeFake.setAllSlides(new ElementRef(container));
      storeFake.setSlidesElements([
        new ElementRef(slide1),
        new ElementRef(slide2),
        new ElementRef(slide3),
      ]);

      storeFake.setTotalSlides(3);
      storeFake.setCurrentPosition(0);
      storeFake.setLoop(true);
      storeFake.setLazyLoading(false);
      storeFake.setSlidesPerView(1);

      service.updateSlides();

      expect(slide1.classList.contains('curr')).toBe(true);
      expect(slide2.classList.contains('next')).toBe(true);
      expect(slide3.classList.contains('prev')).toBe(true);
    });

    it('should eager load visible slides in normal mode (center=false, numeric slidesPerView)', () => {
      const container = document.createElement('div');

      const slides: HTMLElement[] = [];
      for (let i = 0; i < 8; i++) {
        const slide = createSlide(i, 1);
        container.appendChild(slide);
        slides.push(slide);
      }

      storeFake.setAllSlides(new ElementRef(container));
      storeFake.setSlidesElements(slides.map((s) => new ElementRef(s)));
      storeFake.setTotalSlides(8);

      storeFake.setCurrentPosition(2);
      storeFake.setLoop(false);
      storeFake.setCenter(false);
      storeFake.setLazyLoading(true);
      storeFake.setSlidesPerView(3);

      service.updateSlides();

      slides.forEach((slide, index) => {
        const img = slide.querySelector('img')!;
        if (index >= 2 && index <= 4) {
          expect((img as any).loading).toBe('eager');
        } else {
          expect((img as any).loading).toBe('lazy');
        }
      });
    });

    it('should eager load slides around current in center mode (center=true, numeric slidesPerView)', () => {
      const container = document.createElement('div');

      const slides: HTMLElement[] = [];
      for (let i = 0; i < 8; i++) {
        const slide = createSlide(i, 1);
        container.appendChild(slide);
        slides.push(slide);
      }

      storeFake.setAllSlides(new ElementRef(container));
      storeFake.setSlidesElements(slides.map((s) => new ElementRef(s)));
      storeFake.setTotalSlides(8);

      storeFake.setCurrentPosition(4);
      storeFake.setLoop(false);
      storeFake.setCenter(true);
      storeFake.setLazyLoading(true);
      storeFake.setSlidesPerView(3);

      service.updateSlides();

      slides.forEach((slide, index) => {
        const img = slide.querySelector('img')!;
        if (index >= 3 && index <= 5) {
          expect((img as any).loading).toBe('eager');
        } else {
          expect((img as any).loading).toBe('lazy');
        }
      });
    });

    it('should eager load window starting from current in normal mode with slidesPerView="auto"', () => {
      const container = document.createElement('div');

      const slides: HTMLElement[] = [];
      for (let i = 0; i < 10; i++) {
        const slide = createSlide(i, 1);
        container.appendChild(slide);
        slides.push(slide);
      }

      storeFake.setAllSlides(new ElementRef(container));
      storeFake.setSlidesElements(slides.map((s) => new ElementRef(s)));
      storeFake.setTotalSlides(10);

      storeFake.setCurrentPosition(1);
      storeFake.setLoop(false);
      storeFake.setCenter(false);
      storeFake.setLazyLoading(true);
      storeFake.setSlidesPerView('auto');

      service.updateSlides();

      slides.forEach((slide, index) => {
        const img = slide.querySelector('img')!;
        if (index >= 1 && index <= 6) {
          expect((img as any).loading).toBe('eager');
        } else {
          expect((img as any).loading).toBe('lazy');
        }
      });
    });

    it('should handle loop correctly in center mode for eager slides', () => {
      const container = document.createElement('div');

      const slides: HTMLElement[] = [];
      for (let i = 0; i < 8; i++) {
        const slide = createSlide(i, 1);
        container.appendChild(slide);
        slides.push(slide);
      }

      storeFake.setAllSlides(new ElementRef(container));
      storeFake.setSlidesElements(slides.map((s) => new ElementRef(s)));
      storeFake.setTotalSlides(8);

      storeFake.setCurrentPosition(7);
      storeFake.setLoop(true);
      storeFake.setCenter(true);
      storeFake.setLazyLoading(true);
      storeFake.setSlidesPerView(3);

      service.updateSlides();

      slides.forEach((slide, index) => {
        const img = slide.querySelector('img')!;
        if (index === 7 || index === 0 || index === 6) {
          expect((img as any).loading).toBe('eager');
        } else {
          expect((img as any).loading).toBe('lazy');
        }
      });
    });
  });
});
