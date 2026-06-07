import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationComponent } from './navigation.component';
import { CarouselStore } from '../../carousel.store';
import { CarouselStoreFake } from '../../helpers/tests/test.utils.helper';
import { CarouselRegistryService } from '../carousel/carousel-registry.service';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  const storeFake = new CarouselStoreFake();

  beforeEach(async () => {
    storeFake.setPeekOffset(0);
    storeFake.setVertical(false);

    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [
        { provide: CarouselStore, useValue: storeFake as any },
        CarouselRegistryService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps horizontal controls aligned to the visual carousel edge when peekEdges are enabled', () => {
    storeFake.setPeekOffset(50);

    expect(component.leftLeftControl()).toBe(
      'calc(var(--whirli-nav-inline-offset, 0px) - var(--whirli-internal-peek-offset, 50px))',
    );
    expect(component.rightRightControl()).toBe(
      'calc(var(--whirli-nav-inline-offset, 0px) - var(--whirli-internal-peek-offset, 50px))',
    );
  });

  it('keeps vertical controls aligned to the visual carousel edge when peekEdges are enabled', () => {
    storeFake.setVertical(true);
    storeFake.setPeekOffset(40);
    fixture.componentRef.setInput('iconSize', 24);
    fixture.detectChanges();

    expect(component.topLeftControl()).toBe(
      'calc(var(--whirli-nav-block-offset, 0px) - var(--whirli-internal-peek-offset, 40px))',
    );
    expect(component.topRightControl()).toBe(
      'calc(100% - 24px - var(--whirli-nav-block-offset, 0px) + var(--whirli-internal-peek-offset, 40px))',
    );
    expect(component.leftLeftControl()).toBe(
      'calc(50% - 12px + var(--whirli-nav-block-offset, 0px))',
    );
  });

  it('uses custom aria labels for controls', () => {
    fixture.componentRef.setInput('previousSlideLabel', 'Slide précédente');
    fixture.componentRef.setInput('nextSlideLabel', 'Slide suivante');
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;

    expect(native.querySelector('.control-left')?.getAttribute('aria-label')).toBe(
      'Slide précédente',
    );
    expect(
      native.querySelector('.control-right')?.getAttribute('aria-label'),
    ).toBe('Slide suivante');
  });
});
