import { CarouselNavigationService } from './carousel-navigation.service';
import { CarouselStore } from '../carousel.store';
import { CarouselStoreFake } from '../helpers/tests/test.utils.helper';

describe.skip('CarouselNavigationService', () => {
  let storeFake: CarouselStoreFake;
  let service: CarouselNavigationService;

  beforeEach(() => {
    storeFake = new CarouselStoreFake();
    service = new CarouselNavigationService(
      storeFake as unknown as CarouselStore
    );
  });

  it('in mode loop, next wrap correclty with positiveModulo', () => {
    storeFake.setLoop(true);
    storeFake.setCurrentPosition(2);
    storeFake.setStepSlides(3);
    storeFake.setTotalSlides(5);

    // newIndex = 2 + 3 = 5 → 5 mod 5 = 0
    const result = service.calculateNewPositionAfterNavigation(true);

    expect(result).toBe(0);
  });

  it('in mode loop, prev wrap correctly with positiveModulo', () => {
    storeFake.setLoop(true);
    storeFake.setCurrentPosition(0);
    storeFake.setStepSlides(2);
    storeFake.setTotalSlides(5);

    // newIndex = 0 - 2 = -2 → -2 mod 5 = 3
    const result = service.calculateNewPositionAfterNavigation(false);

    expect(result).toBe(3);
  });

  it('in mode non-loop, next stays in bounds', () => {
    storeFake.setLoop(false);
    storeFake.setCurrentPosition(2);
    storeFake.setStepSlides(2);
    storeFake.setLastSlideAnchor(7);

    // newIndex = 2 + 2 = 4, clamp in [0, lastSlideAnchor=7] → 4
    const result = service.calculateNewPositionAfterNavigation(true);

    expect(result).toBe(4);
  });

  it('in mode non-loop, next will not be over lastSlideAnchor', () => {
    storeFake.setLoop(false);
    storeFake.setCurrentPosition(6);
    storeFake.setStepSlides(3);
    storeFake.setLastSlideAnchor(7);

    // newIndex = 6 + 3 = 9 → clamp max(lastSlideAnchor)=7
    const result = service.calculateNewPositionAfterNavigation(true);

    expect(result).toBe(7);
  });

  it('in mode non-loop, prev lows correctly', () => {
    storeFake.setLoop(false);
    storeFake.setCurrentPosition(5);
    storeFake.setStepSlides(2);
    storeFake.setLastSlideAnchor(7);

    // newIndex = 5 - 2 = 3
    // clamp min( newIndex, lastSlideAnchor-1 = 6 ) => 3
    // then max(0, 3) => 3
    const result = service.calculateNewPositionAfterNavigation(false);

    expect(result).toBe(3);
  });

  it('in mode no-loop, prev do not low below 0', () => {
    storeFake.setLoop(false);
    storeFake.setCurrentPosition(1);
    storeFake.setStepSlides(3);
    storeFake.setLastSlideAnchor(7);

    // newIndex = 1 - 3 = -2
    // min(-2, lastSlideAnchor-1 = 6) => -2
    // max(0, -2) => 0
    const result = service.calculateNewPositionAfterNavigation(false);

    expect(result).toBe(0);
  });

  it('uses stepSlides from state to calculate newIndex', () => {
    storeFake.setLoop(false);
    storeFake.setCurrentPosition(4);
    storeFake.setStepSlides(5);
    storeFake.setLastSlideAnchor(20);

    const resultNext = service.calculateNewPositionAfterNavigation(true);
    const resultPrev = service.calculateNewPositionAfterNavigation(false);

    expect(resultNext).toBe(9); // 4 + 5
    expect(resultPrev).toBe(0); // 4 - 5 = -1 → clamp to 0
  });
});
