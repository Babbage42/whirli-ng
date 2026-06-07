import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarouselStore } from '../../carousel.store';
import { CarouselStoreFake } from '../../helpers/tests/test.utils.helper';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;
  let storeFake: CarouselStoreFake;

  beforeEach(async () => {
    storeFake = new CarouselStoreFake();
    storeFake.setTotalSlides(3);
    storeFake.setA11y({
      slideLabel: ({ index, total }) => `${index + 1} of ${total}`,
      paginationBulletLabel: ({ index, total }) =>
        `Aller au slide ${index + 1} sur ${total}`,
    });

    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
      providers: [{ provide: CarouselStore, useValue: storeFake as any }],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    fixture.detectChanges();
  });

  it('uses custom aria labels for pagination bullets', () => {
    expect(fixture.componentInstance.bulletLabel(1)).toBe(
      'Aller au slide 2 sur 3',
    );
  });

  it('computes progress as the active pagination step', () => {
    storeFake.setTotalSlides(10);
    storeFake.setLastSlideAnchor(8);
    storeFake.setCurrentPosition(4);
    fixture.detectChanges();

    expect(fixture.componentInstance.progressPercent()).toBeCloseTo(55.56, 1);
  });

  it('keeps the first progress step visible', () => {
    storeFake.setTotalSlides(10);
    storeFake.setLastSlideAnchor(8);
    storeFake.setCurrentPosition(0);
    fixture.detectChanges();

    expect(fixture.componentInstance.progressPercent()).toBeCloseTo(11.11, 1);
  });

  it('uses full progress when there is only one pagination step', () => {
    storeFake.setTotalSlides(1);
    storeFake.setLastSlideAnchor(0);
    storeFake.setCurrentPosition(0);
    fixture.detectChanges();

    expect(fixture.componentInstance.progressPercent()).toBe(100);
  });

  it('sizes and offsets the scrollbar thumb from the active pagination step', () => {
    storeFake.setTotalSlides(10);
    storeFake.setLastSlideAnchor(4);
    storeFake.setCurrentPosition(2);
    fixture.detectChanges();

    expect(fixture.componentInstance.scrollbarThumbPercent()).toBeCloseTo(20);
    expect(
      fixture.componentInstance.scrollbarThumbOffsetPercent(),
    ).toBeCloseTo(40);
  });

  it('maps a clickable scrollbar track position to a pagination step', () => {
    storeFake.setTotalSlides(10);
    storeFake.setLastSlideAnchor(4);
    storeFake.setPagination({
      type: 'scrollbar',
      clickable: true,
      external: false,
    });
    fixture.detectChanges();

    const goToSlide = jest.fn();
    const subscription =
      fixture.componentInstance.goToSlide.subscribe(goToSlide);
    const event = {
      preventDefault: jest.fn(),
      clientX: 80,
      clientY: 4,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          right: 100,
          top: 0,
          width: 100,
          height: 8,
        }),
      },
    } as unknown as PointerEvent;

    fixture.componentInstance.onScrollbarPointerDown(event);

    expect(goToSlide).toHaveBeenCalledWith(3);
    subscription.unsubscribe();
  });

  it('keeps updating scrollbar pagination while dragging the track', () => {
    storeFake.setTotalSlides(10);
    storeFake.setLastSlideAnchor(4);
    storeFake.setPagination({
      type: 'scrollbar',
      clickable: true,
      external: false,
    });
    fixture.detectChanges();

    const goToSlide = jest.fn();
    const subscription =
      fixture.componentInstance.goToSlide.subscribe(goToSlide);
    const currentTarget = {
      getBoundingClientRect: () => ({
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        height: 8,
      }),
      setPointerCapture: jest.fn(),
      releasePointerCapture: jest.fn(),
    };
    const baseEvent = {
      preventDefault: jest.fn(),
      pointerId: 1,
      clientY: 4,
      currentTarget,
    };

    fixture.componentInstance.onScrollbarPointerDown({
      ...baseEvent,
      clientX: 20,
    } as unknown as PointerEvent);
    fixture.componentInstance.onScrollbarPointerMove({
      ...baseEvent,
      clientX: 95,
    } as unknown as PointerEvent);
    fixture.componentInstance.onScrollbarPointerEnd({
      ...baseEvent,
      clientX: 95,
    } as unknown as PointerEvent);

    expect(goToSlide).toHaveBeenLastCalledWith(4);
    expect(currentTarget.setPointerCapture).toHaveBeenCalledWith(1);
    expect(currentTarget.releasePointerCapture).toHaveBeenCalledWith(1);
    subscription.unsubscribe();
  });

  it('supports keyboard navigation on clickable scrollbar pagination', () => {
    storeFake.setTotalSlides(10);
    storeFake.setLastSlideAnchor(4);
    storeFake.setCurrentPosition(2);
    storeFake.setPagination({
      type: 'scrollbar',
      clickable: true,
      external: false,
    });
    fixture.detectChanges();

    const goToSlide = jest.fn();
    const subscription =
      fixture.componentInstance.goToSlide.subscribe(goToSlide);
    const event = {
      key: 'ArrowRight',
      preventDefault: jest.fn(),
    } as unknown as KeyboardEvent;

    fixture.componentInstance.onScrollbarKeydown(event);

    expect(goToSlide).toHaveBeenCalledWith(3);
    expect(event.preventDefault).toHaveBeenCalled();
    subscription.unsubscribe();
  });
});
