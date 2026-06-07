import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationLeftExternalComponent } from './navigation-left-external.component';
import { CarouselRegistryService } from '../carousel/carousel-registry.service';
import { CarouselComponent } from '../carousel/carousel.component';

describe('NavigationLeftExternalComponent', () => {
  let component: NavigationLeftExternalComponent;
  let fixture: ComponentFixture<NavigationLeftExternalComponent>;
  let registry: CarouselRegistryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationLeftExternalComponent],
    }).compileComponents();

    registry = new CarouselRegistryService();
    fixture = TestBed.createComponent(NavigationLeftExternalComponent);
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
