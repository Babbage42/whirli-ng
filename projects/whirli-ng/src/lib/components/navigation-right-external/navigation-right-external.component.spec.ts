import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationRightExternalComponent } from './navigation-right-external.component';
import { CarouselRegistryService } from '../carousel/carousel-registry.service';
import { CarouselComponent } from '../carousel/carousel.component';

describe('NavigationRightExternalComponent', () => {
  let component: NavigationRightExternalComponent;
  let fixture: ComponentFixture<NavigationRightExternalComponent>;
  let registry: CarouselRegistryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationRightExternalComponent],
    }).compileComponents();

    registry = new CarouselRegistryService();
    fixture = TestBed.createComponent(NavigationRightExternalComponent);
    fixture.componentRef.setInput('for', {
      carouselRegistry: registry,
    } as CarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('registers and unregisters external navigation controls', () => {
    expect(registry.hasExternalControls()).toBe(true);

    fixture.destroy();

    expect(registry.hasExternalControls()).toBe(false);
  });
});
