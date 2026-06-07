import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationExternalComponent } from './pagination-external.component';
import { CarouselComponent } from '../carousel/carousel.component';

describe('PaginationExternalComponent', () => {
  let component: PaginationExternalComponent;
  let fixture: ComponentFixture<PaginationExternalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationExternalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationExternalComponent);
    fixture.componentRef.setInput('for', {} as CarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the target carousel from the for input', () => {
    expect(component.targetCarousel()).toBeTruthy();
  });
});
