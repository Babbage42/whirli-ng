import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { fn, userEvent, within } from 'storybook/test';
import {
  CarouselComponent,
  CarouselNavLeftDirective,
  CarouselNavRightDirective,
  SlideDirective,
  PaginationExternalComponent,
  NavigationLeftExternalComponent,
  NavigationRightExternalComponent,
} from 'whirli-ng';
import { RandomSrcPipe, randomSrc } from '../../../pipes/random-src.pipe';
import { buildSlides, img } from './utils.helper';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const modules = {
  imports: [
    SlideDirective,
    PaginationExternalComponent,
    CarouselNavLeftDirective,
    CarouselNavRightDirective,
    NavigationLeftExternalComponent,
    NavigationRightExternalComponent,
    RandomSrcPipe,
    FormsModule,
  ],
};

const meta: Meta<CarouselComponent> = {
  title: 'Whirli/Carousel',
  component: CarouselComponent,
  decorators: [
    moduleMetadata({
      imports: [
        SlideDirective,
        PaginationExternalComponent,
        CarouselNavLeftDirective,
        CarouselNavRightDirective,
        NavigationLeftExternalComponent,
        NavigationRightExternalComponent,
        RandomSrcPipe,
        FormsModule,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Carousel** — Options clés:
- \`slidesPerView: number | 'auto'\`
- \`stepSlides: number\` (nb de slides avancées par navigation)
- \`freeMode\`, \`loop\`, \`rewind\`, \`center\`, \`notCenterBounds\`
- \`mouseWheel: boolean | { horizontal?: boolean; vertical?: boolean }\`
- \`pagination\` (ex: { type: 'dynamic_dot', clickable: true, external: false })
- \`imagesLoaded\` émis quand les images initiales sont prêtes
- Styling CSS variables:
  - \`--whirli-nav-inline-offset\`: horizontal arrow offset
  - \`--whirli-nav-block-offset\`: cross-axis arrow offset
        `.trim(),
      },
    },
  },
  argTypes: {
    slides: {
      control: 'object',
      description: 'Liste de slides (dans tes tests: URLs)',
    },
    slidesPerView: {
      control: 'text',
      table: { type: { summary: '"auto" | number' } },
      description: 'Nombre de slides visibles ou "auto"',
    },
    stepSlides: { control: 'number', description: 'Avance par N slides' },
    spaceBetween: { control: 'number' },
    showControls: { control: 'boolean' },
    alwaysShowControls: { control: 'boolean' },
    iconSize: { control: 'number' },
    pagination: { control: 'object' },
    freeMode: { control: 'boolean' },
    mouseWheel: { control: 'object' }, // accepte boolean ou objet
    dragThresholdRatio: { control: 'number' },
    rewind: { control: 'boolean' },
    loop: { control: 'boolean' },
    center: { control: 'boolean' },
    notCenterBounds: { control: 'boolean' },
    slideOnClick: { control: 'boolean' },
    marginEnd: { control: 'number' },
    marginStart: { control: 'number' },
    lazyLoading: { control: 'boolean' },
    breakpoints: { control: 'object' },
    // outputs -> actions
    activeIndexChange: { action: 'activeIndexChange' },
    slideNext: { action: 'slideNext' },
    slidePrev: { action: 'slidePrev' },
    reachEnd: { action: 'reachEnd' },
    reachStart: { action: 'reachStart' },
    touched: { action: 'touched' },
    imagesLoaded: { action: 'imagesLoaded' },
    autoplay: { control: 'object' },
    resistance: { control: 'boolean' },
    initialSlide: { control: 'number' },
    draggable: { control: 'boolean' },
    direction: { control: 'text' },
    axis: { control: 'text' },
  },
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    stepSlides: 1,
    spaceBetween: 5,
    freeMode: false,
    showControls: true,
    alwaysShowControls: false,
    iconSize: 50,
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
    dragThresholdRatio: 0.6,
    rewind: false,
    loop: false,
    center: false,
    notCenterBounds: false,
    slideOnClick: true,
    marginEnd: 0,
    marginStart: 0,
    lazyLoading: true,
    autoplay: false,
    initialSlide: 0,
    resistance: true,
    draggable: true,
    peekEdges: undefined,
    debug: false,
    direction: 'ltr',
    axis: 'horizontal',
  },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<CarouselComponent>;
// helpers inchangés...
const TemplateProjected = (args: any) => ({
  props: args,
  template: `
    <whirli-carousel
      [slidesPerView]="slidesPerView"
      [stepSlides]="stepSlides"
      [spaceBetween]="spaceBetween"
      [showControls]="showControls"
      [alwaysShowControls]="alwaysShowControls"
      [iconSize]="iconSize"
      [pagination]="pagination"
      [freeMode]="freeMode"
      [mouseWheel]="mouseWheel"
      [dragThresholdRatio]="dragThresholdRatio"
      [rewind]="rewind"
      [loop]="loop"
      [center]="center"
      [notCenterBounds]="notCenterBounds"
      [centerWhenNotEnoughSlides]="centerWhenNotEnoughSlides"
      [slideOnClick]="slideOnClick"
      [marginEnd]="marginEnd"
      [marginStart]="marginStart"
      [lazyLoading]="lazyLoading"
      [autoplay]="autoplay"
      [resistance]="resistance"
      [initialSlide]="initialSlide"
      [draggable]="draggable"
      [peekEdges]="peekEdges"
      [direction]="direction"
      [axis]="axis"
      [breakpoints]="breakpoints"
      [virtual]="virtual"
      (touched)="touched($event)"
      (activeIndexChange)="activeIndexChange($event)"
      (slidePrev)="slidePrev($event)"
      (slideNext)="slideNext($event)"
      (reachEnd)="reachEnd($event)"
      (reachStart)="reachStart($event)"
      (imagesLoaded)="imagesLoaded()"
      [debug]="debug">
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
    </whirli-carousel>
  `,
  moduleMetadata: modules,
});

const projectedComplexSlides = Array.from(
  { length: 12 },
  (_, index) => `
      <div *slide class="projected-card projected-card-${index}">
        <img
          src="${img(index, 320 + index * 3, 190 + (index % 3) * 12)}"
          alt="Projected slide ${index + 1}"
        />
        <div class="projected-card__body">
          <strong>Projected ${index + 1}</strong>
          <span>${index % 2 === 0 ? 'Rich text content' : 'Variable content width'}</span>
          ${
            index % 3 === 0
              ? `<button
                  type="button"
                  data-testid="projected-action-${index}"
                  (click)="onProjectedAction($event)"
                >
                  Action
                </button>`
              : ''
          }
        </div>
      </div>
    `,
).join('');

const TemplateProjectedComplex = (args: any) => ({
  props: {
    ...args,
    projectedActionCount: 0,
    onProjectedAction(this: any, event: Event) {
      event.stopPropagation();
      this.projectedActionCount++;
    },
  },
  template: `
    <style>
      .projected-card {
        height: 100%;
        min-height: 180px;
        display: grid;
        grid-template-rows: minmax(80px, 1fr) auto;
        background: #f8fafc;
        border: 1px solid #d7dee8;
        overflow: hidden;
      }
      .projected-card img {
        width: 100%;
        height: 100%;
        min-height: 90px;
        object-fit: cover;
      }
      .projected-card__body {
        display: grid;
        gap: 6px;
        padding: 10px;
        color: #172033;
      }
      .projected-card__body span {
        font-size: 12px;
        color: #526071;
      }
      .projected-card__body button {
        width: max-content;
        border: 1px solid #8492a6;
        background: #fff;
        padding: 4px 8px;
        cursor: pointer;
      }
    </style>
    <div data-testid="projected-action-count">{{ projectedActionCount }}</div>
    <whirli-carousel
      [slidesPerView]="slidesPerView"
      [stepSlides]="stepSlides"
      [spaceBetween]="spaceBetween"
      [showControls]="showControls"
      [alwaysShowControls]="alwaysShowControls"
      [iconSize]="iconSize"
      [pagination]="pagination"
      [freeMode]="freeMode"
      [mouseWheel]="mouseWheel"
      [dragThresholdRatio]="dragThresholdRatio"
      [rewind]="rewind"
      [loop]="loop"
      [center]="center"
      [notCenterBounds]="notCenterBounds"
      [centerWhenNotEnoughSlides]="centerWhenNotEnoughSlides"
      [slideOnClick]="slideOnClick"
      [marginEnd]="marginEnd"
      [marginStart]="marginStart"
      [lazyLoading]="lazyLoading"
      [autoplay]="autoplay"
      [resistance]="resistance"
      [initialSlide]="initialSlide"
      [draggable]="draggable"
      [peekEdges]="peekEdges"
      [direction]="direction"
      [axis]="axis"
      [breakpoints]="breakpoints"
      (touched)="touched($event)"
      (activeIndexChange)="activeIndexChange($event)"
      (slidePrev)="slidePrev($event)"
      (slideNext)="slideNext($event)"
      (reachEnd)="reachEnd($event)"
      (reachStart)="reachStart($event)"
      (imagesLoaded)="imagesLoaded()"
      [debug]="debug">
      ${projectedComplexSlides}
    </whirli-carousel>
  `,
  moduleMetadata: modules,
});

const TemplateWithSlides = (args: any) => ({
  props: args,
  template: `
    <whirli-carousel
      [slidesPerView]="slidesPerView"
      [stepSlides]="stepSlides"
      [spaceBetween]="spaceBetween"
      [showControls]="showControls"
      [alwaysShowControls]="alwaysShowControls"
      [iconSize]="iconSize"
      [pagination]="pagination"
      [freeMode]="freeMode"
      [mouseWheel]="mouseWheel"
      [dragThresholdRatio]="dragThresholdRatio"
      [rewind]="rewind"
      [loop]="loop"
      [center]="center"
      [notCenterBounds]="notCenterBounds"
      [centerWhenNotEnoughSlides]="centerWhenNotEnoughSlides"
      [slideOnClick]="slideOnClick"
      [marginEnd]="marginEnd"
      [marginStart]="marginStart"
      [lazyLoading]="lazyLoading"
      [autoplay]="autoplay"
      [resistance]="resistance"
      [initialSlide]="initialSlide"
      [draggable]="draggable"
      [peekEdges]="peekEdges"
      [direction]="direction"
      [axis]="axis"
      [breakpoints]="breakpoints"
      [virtual]="virtual"
      (touched)="touched($event)"
      (activeIndexChange)="activeIndexChange($event)"
      (slidePrev)="slidePrev($event)"
      (slideNext)="slideNext($event)"
      (reachEnd)="reachEnd($event)"
      (reachStart)="reachStart($event)"
      (imagesLoaded)="imagesLoaded()"
      [slides]="slides"
      [debug]="debug">
    </whirli-carousel>
  `,
  moduleMetadata: modules,
});

const TemplateWithExternalPagination = (args: any) => ({
  props: args,
  template: `
    <whirli-carousel
      #carousel
      [slidesPerView]="slidesPerView"
      [stepSlides]="stepSlides"
      [spaceBetween]="spaceBetween"
      [showControls]="showControls"
      [alwaysShowControls]="alwaysShowControls"
      [iconSize]="iconSize"
      [pagination]="pagination"
      [freeMode]="freeMode"
      [loop]="loop"
      [rewind]="rewind"
      [slideOnClick]="slideOnClick"
      [slides]="slides"
      [debug]="debug"
      (activeIndexChange)="activeIndexChange($event)">
    </whirli-carousel>

    <div class="external-pagination-story" data-testid="external-pagination">
      <strong>External pagination</strong>
      <whirli-pagination [for]="carousel"></whirli-pagination>
    </div>
  `,
  moduleMetadata: modules,
});

const TemplateWithExternalNavigation = (args: any) => ({
  props: args,
  template: `
    <div style="display: grid; gap: 16px;">
      <whirli-carousel
        #carousel
        [slidesPerView]="slidesPerView"
        [stepSlides]="stepSlides"
        [spaceBetween]="spaceBetween"
        [showControls]="showControls"
        [alwaysShowControls]="alwaysShowControls"
        [iconSize]="iconSize"
        [pagination]="pagination"
        [freeMode]="freeMode"
        [loop]="loop"
        [rewind]="rewind"
        [slideOnClick]="slideOnClick"
        [slides]="slides"
        [debug]="debug"
        (activeIndexChange)="activeIndexChange($event)">

        <button
          *whirliNavLeft
          type="button"
          style="border: 0; border-radius: 6px; padding: 10px 14px; background: #172033; color: white; font-weight: 700;">
          Previous
        </button>
        <button
          *whirliNavRight
          type="button"
          style="border: 0; border-radius: 6px; padding: 10px 14px; background: #172033; color: white; font-weight: 700;">
          Next
        </button>
      </whirli-carousel>

      <div
        data-testid="external-navigation"
        style="display: flex; justify-content: center; gap: 12px; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 8px; background: #f8fafc;">
        <whirli-navigation-prev [for]="carousel"></whirli-navigation-prev>
        <whirli-navigation-next [for]="carousel"></whirli-navigation-next>
      </div>
    </div>
  `,
  moduleMetadata: modules,
});

const TemplateControlledSlideTo = (args: any) => ({
  props: {
    ...args,
    targetIndex: 0,
    applyTarget(this: any) {
      this.controlledSlideTo = Number(this.targetIndex);
    },
  },
  template: `
    <div style="display: grid; gap: 12px;">
      <label style="display: flex; align-items: center; gap: 8px;">
        Slide index
        <input
          type="number"
          min="0"
          [max]="slides.length - 1"
          [(ngModel)]="targetIndex"
          style="width: 80px;"
        />
        <button type="button" (click)="applyTarget()">Go</button>
      </label>

      <whirli-carousel
        [slides]="slides"
        [slidesPerView]="slidesPerView"
        [stepSlides]="stepSlides"
        [spaceBetween]="spaceBetween"
        [pagination]="pagination"
        [freeMode]="freeMode"
        [controlledSlideTo]="controlledSlideTo"
        (activeIndexChange)="activeIndexChange($event)">
      </whirli-carousel>
    </div>
  `,
  moduleMetadata: modules,
});

const TemplateDynamicSlides = (args: any) => ({
  props: {
    ...args,
    count: args.slides?.length ?? 4,
    updateSlides(this: any, count: number) {
      this.count = count;
      this.slides = buildSlides(count);
    },
  },
  template: `
    <div style="display: grid; gap: 12px;">
      <label style="display: flex; align-items: center; gap: 8px;">
        Slide count
        <input
          type="range"
          min="2"
          max="18"
          [ngModel]="count"
          (ngModelChange)="updateSlides(+$event)"
        />
        <strong>{{ count }}</strong>
      </label>

      <whirli-carousel
        [slides]="slides"
        [slidesPerView]="slidesPerView"
        [stepSlides]="stepSlides"
        [spaceBetween]="spaceBetween"
        [pagination]="pagination"
        [freeMode]="freeMode"
        (activeIndexChange)="activeIndexChange($event)">
      </whirli-carousel>
    </div>
  `,
  moduleMetadata: modules,
});

const TemplateSlideToKey = (args: any) => ({
  props: {
    ...args,
    targetKey: 'featured',
  },
  template: `
    <div style="display: grid; gap: 12px;">
      <label style="display: flex; align-items: center; gap: 8px;">
        Slide key
        <input [(ngModel)]="targetKey" style="width: 120px;" />
        <button type="button" (click)="carousel.slideToKey(targetKey)">Go</button>
      </label>

      <whirli-carousel
        #carousel
        [slidesPerView]="slidesPerView"
        [stepSlides]="stepSlides"
        [spaceBetween]="spaceBetween"
        [pagination]="pagination"
        [freeMode]="freeMode"
        [dragIgnoreSelector]="dragIgnoreSelector"
        (activeIndexChange)="activeIndexChange($event)">
        <div *slide="'intro'" style="padding: 32px; background: #f8fafc;">Intro</div>
        <div *slide style="padding: 32px; background: #eef2ff;">Auto key</div>
        <div *slide="'featured'" style="padding: 32px; background: #ecfeff;">
          Featured keyed slide
          <button type="button">Nested action</button>
        </div>
        <div *slide style="padding: 32px; background: #fef3c7;">Auto key</div>
        <div *slide="'details'" style="padding: 32px; background: #f0fdf4;">Details</div>
      </whirli-carousel>
    </div>
  `,
  moduleMetadata: modules,
});

const TemplateWithThumbs = (args: any) => ({
  props: args,
  template: `
    <div
      style="
        width: 80%;
        margin: 40px auto;
        padding: 24px 0;
        display: flex;
        flex-direction: column;
        gap: 24px;
      "
    >
      <whirli-carousel
        #master
        [slides]="slides"
        [slidesPerView]="3"
        [stepSlides]="3"
        [spaceBetween]="16"
        [showControls]="true"
        [alwaysShowControls]="false"
        [loop]="false"
        [center]="false"
        [freeMode]="false"
        [pagination]="null"
        [slideOnClick]="true"
        [debug]="debug"
        [breakpoints]="breakpoints"
        (touched)="touched($event)"
        (activeIndexChange)="activeIndexChange($event)"
        (slidePrev)="slidePrev($event)"
        (slideNext)="slideNext($event)"
        (reachEnd)="reachEnd($event)"
        (reachStart)="reachStart($event)"
        (imagesLoaded)="imagesLoaded()"
      >
      </whirli-carousel>

      <div style="width: 50%; margin: 0 auto;">
        <whirli-carousel
          [slides]="slides"
          [slidesPerView]="5"
          [spaceBetween]="8"
          [thumbsFor]="master"
          [showControls]="true"
          [alwaysShowControls]="false"
          [loop]="false"
          [center]="false"
          [freeMode]="false"
          [pagination]="null"
          [slideOnClick]="true"
          [debug]="debug"
          (touched)="touched($event)"
          (activeIndexChange)="activeIndexChange($event)"
          (slidePrev)="slidePrev($event)"
          (slideNext)="slideNext($event)"
          (reachEnd)="reachEnd($event)"
          (reachStart)="reachStart($event)"
          (imagesLoaded)="imagesLoaded()"
        >
        </whirli-carousel>
      </div>
    </div>
  `,
  moduleMetadata: modules,
});

const TemplateWithController = (args: any) => ({
  props: args,
  template: `
    <div
      style="
        width: 80%;
        margin: 40px auto;
        padding: 24px 0;
        display: flex;
        flex-direction: column;
        gap: 24px;
      "
    >
      <whirli-carousel
        #master
        [slides]="slides"
        [slidesPerView]="3"
        [stepSlides]="1"
        [spaceBetween]="16"
        [showControls]="true"
        [loop]="false"
        [freeMode]="false"
        [pagination]="pagination"
        [slideOnClick]="true"
      >
      </whirli-carousel>

      <whirli-carousel
        data-testid="controlled-carousel"
        [slides]="slides"
        [slidesPerView]="4"
        [stepSlides]="1"
        [spaceBetween]="8"
        [controllerFor]="master"
        [showControls]="true"
        [loop]="false"
        [freeMode]="false"
        [pagination]="null"
        [slideOnClick]="true"
      >
      </whirli-carousel>
    </div>
  `,
  moduleMetadata: modules,
});

const TemplateVerticalWithSlides = (args: any) => ({
  props: args,
  template: `
  <div
      style="
        height: 400px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      "
    >
    <whirli-carousel
      [slidesPerView]="slidesPerView"
      [stepSlides]="stepSlides"
      [spaceBetween]="spaceBetween"
      [showControls]="showControls"
      [alwaysShowControls]="alwaysShowControls"
      [iconSize]="iconSize"
      [pagination]="pagination"
      [freeMode]="freeMode"
      [mouseWheel]="mouseWheel"
      [dragThresholdRatio]="dragThresholdRatio"
      [rewind]="rewind"
      [loop]="loop"
      [center]="center"
      [notCenterBounds]="notCenterBounds"
      [slideOnClick]="slideOnClick"
      [marginEnd]="marginEnd"
      [marginStart]="marginStart"
      [lazyLoading]="lazyLoading"
      [autoplay]="autoplay"
      [resistance]="resistance"
      [initialSlide]="initialSlide"
      [draggable]="draggable"
      [peekEdges]="peekEdges"
      [direction]="direction"
      [axis]="axis"
      [breakpoints]="breakpoints"
      (touched)="touched($event)"
      (activeIndexChange)="activeIndexChange($event)"
      (slidePrev)="slidePrev($event)"
      (slideNext)="slideNext($event)"
      (reachEnd)="reachEnd($event)"
      (reachStart)="reachStart($event)"
      (imagesLoaded)="imagesLoaded()"
      [slides]="slides"
      [debug]="debug">
    </whirli-carousel>
    </div>
  `,
  moduleMetadata: modules,
});

export const ProjectedSlides: Story = {
  render: TemplateProjected,
  args: {
    slides: [],
  },
};

export const ProjectedSlidesComplexContent: Story = {
  render: TemplateProjectedComplex,
  args: {
    slides: [],
    slidesPerView: '3',
    spaceBetween: 12,
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
    freeMode: false,
  },
};

export const ProjectedSlidesMarginEnd: Story = {
  render: TemplateProjectedComplex,
  args: {
    slides: [],
    slidesPerView: '3.5',
    spaceBetween: 8,
    marginEnd: 180,
    pagination: { type: 'dot', clickable: true, external: false },
    freeMode: false,
  },
};

export const ExactSlidesPerView: Story = {
  render: TemplateWithSlides,
  args: { slides: buildSlides(10), slidesPerView: '4', freeMode: false },
};

export const PartialSlidesPerView: Story = {
  render: TemplateWithSlides,
  args: { slides: buildSlides(10), slidesPerView: '3.5', freeMode: false },
};

export const ExternalPagination: Story = {
  render: TemplateWithExternalPagination,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    spaceBetween: 8,
    pagination: { type: 'dynamic_dot', clickable: true, external: true },
    showControls: true,
    freeMode: false,
  },
};

export const ExternalNavigation: Story = {
  render: TemplateWithExternalNavigation,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    spaceBetween: 8,
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
    showControls: true,
    alwaysShowControls: false,
    freeMode: false,
  },
};

export const ControlledSlideTo: Story = {
  render: TemplateControlledSlideTo,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    stepSlides: 2,
    spaceBetween: 8,
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
    freeMode: false,
    controlledSlideTo: undefined,
  },
};

export const DynamicSlides: Story = {
  render: TemplateDynamicSlides,
  args: {
    slides: buildSlides(4),
    slidesPerView: '3',
    stepSlides: 1,
    spaceBetween: 8,
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
    freeMode: false,
  },
};

export const SlideToKey: Story = {
  render: TemplateSlideToKey,
  args: {
    slidesPerView: '3',
    stepSlides: 1,
    spaceBetween: 8,
    pagination: { type: 'dot', clickable: true, external: false },
    freeMode: false,
    dragIgnoreSelector: '[data-carousel-no-drag], button',
  },
};

export const StepBy3: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3',
    stepSlides: 3,
    freeMode: false,
  },
};

export const NoResistance: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    loop: false,
    resistance: false,
  },
};

export const NoResistanceFreeMode: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(20),
    slidesPerView: '3',
    freeMode: true,
    mouseWheel: true,
    loop: false,
    resistance: false,
  },
};

export const NoSlideOnClik: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(20),
    slidesPerView: '3',
    slideOnClick: false,
  },
};

export const FreeMode: Story = {
  render: TemplateWithSlides,
  args: { slides: buildSlides(12), slidesPerView: '3', freeMode: true },
};

export const NoSpace: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3',
    spaceBetween: 0,
  },
};

export const FreeModeNoSpace: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3',
    freeMode: true,
    spaceBetween: 0,
  },
};

export const InitialSlideMiddle: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    initialSlide: 4,
    loop: false,
  },
};

export const InitialSlideWithCenter: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    loop: false,
    center: true,
    initialSlide: 7,
  },
};

export const InitialSlideWithLoop: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    loop: true,
    initialSlide: 7,
  },
};

export const Looping: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(8),
    slidesPerView: '3',
    loop: true,
    freeMode: false,
  },
};

export const Rewind: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(8),
    slidesPerView: '3',
    rewind: true,
    freeMode: false,
  },
};

export const Centered: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(9),
    slidesPerView: '3',
    center: true,
    freeMode: false,
  },
};

export const NotCenterBounds: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '4',
    center: true,
    notCenterBounds: true,
    freeMode: false,
  },
};

export const NotCenterBoundsOdd: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    center: true,
    notCenterBounds: true,
    freeMode: false,
  },
};

export const MouseWheelBool: Story = {
  render: TemplateWithSlides,
  args: { slides: buildSlides(12), slidesPerView: '3', mouseWheel: true },
};

export const MouseWheelHorizontal: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3',
    mouseWheel: { horizontal: true, vertical: true },
  },
};

export const PaginationDynamicDots: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
  },
};

export const ResponsiveBreakpoints: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    freeMode: false,
    breakpoints: {
      '(max-width: 768px)': { slidesPerView: 1.5, spaceBetween: 2 },
      '(min-width: 769px) and (max-width: 1024px)': {
        slidesPerView: 2.5,
        spaceBetween: 5,
      },
      '(min-width: 1025px)': { slidesPerView: 3.5, spaceBetween: 1 },
    },
  },
};

export const SlidesPerViewAuto: Story = {
  render: TemplateWithSlides,
  args: {
    slides: Array.from({ length: 12 }, (_, i) =>
      img(i, 200 + (i % 4) * 60, 160),
    ),
    slidesPerView: 'auto' as any,
    freeMode: false,
  },
};

export const AutoWithDifferentWidths: Story = {
  render: TemplateWithSlides,
  args: {
    slides: Array.from({ length: 10 }, (_, i) =>
      img(i, 200 + (i % 5) * 60, 160),
    ),
    slidesPerView: 'auto' as any,
    freeMode: false,
  },
};

export const LoopingAutoWithDifferentWidths: Story = {
  render: TemplateWithSlides,
  args: {
    slides: Array.from({ length: 10 }, (_, i) =>
      img(i, 200 + (i % 5) * 60, 160),
    ),
    slidesPerView: 'auto' as any,
    loop: true,
    freeMode: false,
  },
};

export const Margins: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    marginStart: 100,
    marginEnd: 150,
    freeMode: false,
  },
};

export const MarginEndSnapInteractions: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3.5',
    stepSlides: 1,
    marginStart: 0,
    marginEnd: 120,
    freeMode: false,
    loop: false,
    rewind: false,
    showControls: true,
    pagination: { type: 'dot', clickable: true, external: false },
  },
};

export const MarginEndSmall: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3.5',
    stepSlides: 1,
    marginStart: 0,
    marginEnd: 24,
    freeMode: false,
    loop: false,
    rewind: false,
    showControls: true,
    pagination: { type: 'dot', clickable: true, external: false },
  },
};

export const MarginEndLarge: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3.5',
    stepSlides: 1,
    marginStart: 0,
    marginEnd: 320,
    freeMode: false,
    loop: false,
    rewind: false,
    showControls: true,
    pagination: { type: 'dot', clickable: true, external: false },
  },
};

export const MarginEndFreeMode: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3.5',
    stepSlides: 1,
    marginStart: 0,
    marginEnd: 120,
    freeMode: true,
    loop: false,
    rewind: false,
    showControls: true,
    pagination: { type: 'dot', clickable: true, external: false },
  },
};

export const SpaceBetween: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    spaceBetween: 30,
    freeMode: false,
  },
};

export const OneSlide: Story = {
  render: TemplateWithSlides,
  args: { slides: buildSlides(1), slidesPerView: '1', freeMode: false },
};

export const TwoSlides: Story = {
  render: TemplateWithSlides,
  args: { slides: buildSlides(2), slidesPerView: '2', freeMode: false },
};

export const AutoPlay: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(8),
    slidesPerView: 3,
    stepSlides: 1,
    loop: true,
    autoplay: { delay: 1800, pauseOnHover: true, stopOnInteraction: true },
  },
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement);
    const nextBtn = await c
      .findByRole('button', { name: /next/i })
      .catch(() => null);
    if (!nextBtn) return;
    await step('Hover to pause', async () => {
      await userEvent.hover(canvasElement);
    });
    await new Promise((r) => setTimeout(r, 1000));
    await step('Unhover to resume', async () => {
      await userEvent.unhover(canvasElement);
    });
    await new Promise((r) => setTimeout(r, 1000));
  },
};

export const FewSlidesLessThanSlidesPerView: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(2),
    slidesPerView: '4',
    freeMode: false,
    loop: false,
  },
};

export const FewAutoSlidesNotEnough: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(2),
    slidesPerView: 'auto' as any,
    spaceBetween: 12,
    freeMode: false,
    loop: false,
    centerWhenNotEnoughSlides: true,
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
    showControls: true,
  },
};

export const FewSlidesLoop: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(3),
    slidesPerView: '3',
    loop: true,
    rewind: false,
    freeMode: false,
  },
};

export const LoopAndCenter: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    loop: true,
    center: true,
    notCenterBounds: false,
    freeMode: false,
  },
};

export const CenterWithSpaceBetween: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    center: true,
    spaceBetween: 30,
    freeMode: false,
  },
};

export const CenterWithPartialSlidesPerView: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '2.5',
    center: true,
    freeMode: false,
  },
};

export const CenterWithMargins: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    center: true,
    marginStart: 40,
    marginEnd: 40,
  },
};

export const NonDraggable: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    draggable: false,
  },
};

export const WithRelativePeekEdges: Story = {
  render: TemplateWithSlides,
  args: {
    peekEdges: {
      relativeOffset: 0.25,
    },
    slides: buildSlides(10),
    slidesPerView: '3',
  },
};

export const DisabledSlides: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10).map((el, index) => ({
      image: el,
      disabled: index === 2 || index === 5,
    })),
    slidesPerView: '3',
  },
};

export const RightToLeftCarousel: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3.5',
    direction: 'rtl',
  },
};

export const VerticalCarousel: Story = {
  render: TemplateVerticalWithSlides,
  args: {
    slides: buildSlides(10),
    axis: 'vertical',
    slidesPerView: '4',
  },
};

export const VerticalCarouselWithPeek: Story = {
  render: TemplateVerticalWithSlides,
  args: {
    slides: buildSlides(10),
    axis: 'vertical',
    peekEdges: {
      relativeOffset: 0.25,
    },
    slidesPerView: '3',
  },
};

export const VerticalCenterCarousel: Story = {
  render: TemplateVerticalWithSlides,
  args: {
    slides: buildSlides(10),
    axis: 'vertical',
    center: true,
    slidesPerView: '3',
  },
};

export const Thumbs: Story = {
  render: TemplateWithThumbs,
  args: {
    slides: buildSlides(16),
  },
};

export const ControllerSync: Story = {
  render: TemplateWithController,
  args: {
    slides: buildSlides(12),
    pagination: { type: 'dot', clickable: true, external: false },
  },
};

export const VirtualMode: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(30),
    slidesPerView: '3.5',
    virtual: true,
  },
};

export const VirtualModeCenter: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(30),
    slidesPerView: '3',
    virtual: true,
    center: true,
  },
};

export const VirtualLoopMode: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(30),
    slidesPerView: '3.5',
    virtual: true,
    loop: true,
  },
};

export const VirtualLoopAutoSlidesPerView: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(30),
    slidesPerView: 'auto',
    virtual: true,
    loop: true,
  },
};

export const VirtualLoopSmallTotal: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(7),
    slidesPerView: '3.5',
    virtual: true,
    loop: true,
  },
};

export const VirtualLoopLargeSPV: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(30),
    slidesPerView: '6',
    virtual: true,
    loop: true,
  },
};

export const ManySlides: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(150),
  },
};

export const Interaction_NextPrev: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(9),
    slidesPerView: '3',
    stepSlides: 2,
    freeMode: false,
  },
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement);
    const nextBtn = await c.findByRole('button', { name: /next/i });
    const prevBtn = await c.findByRole('button', { name: /prev/i });

    await step('Next twice', async () => {
      await userEvent.click(nextBtn);
      await userEvent.click(nextBtn);
    });

    await step('Prev once', async () => {
      await userEvent.click(prevBtn);
    });
  },
};

export const Interaction_ClickDots: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
    freeMode: false,
  },
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement);
    const dots = await c
      .findAllByRole('button', { name: /dot/i })
      .catch(() => []);
    if (dots.length >= 3) {
      await step('Go to dot #3', async () => {
        await userEvent.click(dots[2]);
      });
    }
  },
};

// ==============================================================================
// NEW STORIES FOR COMPREHENSIVE E2E TESTING
// ==============================================================================

export const WithAbsolutePeekEdges: Story = {
  render: TemplateWithSlides,
  args: {
    peekEdges: {
      absoluteOffset: 50,
    },
    slides: buildSlides(10),
    slidesPerView: '3',
  },
};

export const CanSwipeFalseDraggableTrue: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    draggable: true,
    canSwipe: false,
  },
};

export const AutoplayPauseOnFocus: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(8),
    slidesPerView: 3,
    stepSlides: 1,
    loop: true,
    autoplay: {
      delay: 1500,
      pauseOnHover: false,
      pauseOnFocus: true,
      stopOnInteraction: false,
    },
  },
};

export const AutoplayDisableOnHidden: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(8),
    slidesPerView: 3,
    stepSlides: 1,
    loop: true,
    autoplay: {
      delay: 1200,
      pauseOnHover: false,
      disableOnHidden: true,
      stopOnInteraction: false,
    },
  },
};

export const NavigateSlideBySlide: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    stepSlides: 1,
    navigateSlideBySlide: true,
  },
};

export const NotCenterBoundsWithLoop: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    center: true,
    notCenterBounds: true,
    loop: true,
    freeMode: false,
  },
};

export const NotCenterBoundsWithRewind: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    center: true,
    notCenterBounds: true,
    rewind: true,
    freeMode: false,
  },
};

export const PaginationFraction: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    pagination: { type: 'fraction', clickable: false, external: false },
  },
};

export const PaginationProgress: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    pagination: { type: 'progress', clickable: false, external: false },
  },
};

export const PaginationProgressTop: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    pagination: {
      type: 'progress',
      position: 'top',
      clickable: false,
      external: false,
    },
  },
};

export const PaginationScrollbar: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    pagination: {
      type: 'scrollbar',
      position: 'bottom',
      clickable: true,
      external: false,
    },
  },
};

export const StepSlidesLargerThanView: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(15),
    slidesPerView: '3',
    stepSlides: 5,
    freeMode: false,
  },
};

export const StepSlidesWithLoop: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3',
    stepSlides: 2,
    loop: true,
    freeMode: false,
  },
};

export const StepSlidesWithRewind: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3',
    stepSlides: 2,
    rewind: true,
    freeMode: false,
  },
};

/**
 * EventsProbe — story dédiée aux tests E2E sur les outputs.
 * Chaque event est écrit dans un compteur DOM avec un data-testid
 * lisible par Playwright. Voir e2e/tests/carousel-events.spec.ts.
 */
const TemplateEventsProbe = (args: any) => ({
  props: {
    ...args,
    counts: {
      activeIndexChange: 0,
      slideNext: 0,
      slidePrev: 0,
      afterInit: 0,
      touched: 0,
      touchStart: 0,
      dragStart: 0,
      dragEnd: 0,
      translateChange: 0,
      transitionStart: 0,
      transitionEnd: 0,
      progress: 0,
      slideClick: 0,
      reachEnd: 0,
      reachStart: 0,
      autoplayStart: 0,
      autoplayStop: 0,
      autoplayPause: 0,
      imagesLoaded: 0,
    },
    last: {
      activeIndexChange: -1,
      translateChange: 0,
      progress: 0,
      slideClick: -1,
    },
    bump(this: any, key: string, value?: any) {
      this.counts[key]++;
      if (value !== undefined && this.last[key] !== undefined) {
        this.last[key] = value;
      }
    },
  },
  template: `
    <whirli-carousel
      [slidesPerView]="slidesPerView"
      [stepSlides]="stepSlides"
      [spaceBetween]="spaceBetween"
      [showControls]="showControls"
      [pagination]="pagination"
      [freeMode]="freeMode"
      [loop]="loop"
      [rewind]="rewind"
      [center]="center"
      [slideOnClick]="slideOnClick"
      [autoplay]="autoplay"
      [draggable]="draggable"
      [slides]="slides"
      (activeIndexChange)="bump('activeIndexChange', $event)"
      (slideNext)="bump('slideNext')"
      (slidePrev)="bump('slidePrev')"
      (afterInit)="bump('afterInit')"
      (touched)="bump('touched')"
      (touchStart)="bump('touchStart')"
      (dragStart)="bump('dragStart')"
      (dragEnd)="bump('dragEnd')"
      (translateChange)="bump('translateChange', $event)"
      (transitionStart)="bump('transitionStart')"
      (transitionEnd)="bump('transitionEnd')"
      (progress)="bump('progress', $event)"
      (slideClick)="bump('slideClick', $event.index)"
      (reachEnd)="bump('reachEnd')"
      (reachStart)="bump('reachStart')"
      (autoplayStart)="bump('autoplayStart')"
      (autoplayStop)="bump('autoplayStop')"
      (autoplayPause)="bump('autoplayPause')"
      (imagesLoaded)="bump('imagesLoaded')">
    </whirli-carousel>
    <div data-testid="events-probe" style="margin-top:16px;font-family:monospace;font-size:12px">
      <div data-testid="evt-activeIndexChange" [attr.data-count]="counts.activeIndexChange">activeIndexChange: {{ counts.activeIndexChange }}</div>
      <div data-testid="evt-slideNext" [attr.data-count]="counts.slideNext">slideNext: {{ counts.slideNext }}</div>
      <div data-testid="evt-slidePrev" [attr.data-count]="counts.slidePrev">slidePrev: {{ counts.slidePrev }}</div>
      <div data-testid="evt-afterInit" [attr.data-count]="counts.afterInit">afterInit: {{ counts.afterInit }}</div>
      <div data-testid="evt-touched" [attr.data-count]="counts.touched">touched: {{ counts.touched }}</div>
      <div data-testid="evt-touchStart" [attr.data-count]="counts.touchStart">touchStart: {{ counts.touchStart }}</div>
      <div data-testid="evt-dragStart" [attr.data-count]="counts.dragStart">dragStart: {{ counts.dragStart }}</div>
      <div data-testid="evt-dragEnd" [attr.data-count]="counts.dragEnd">dragEnd: {{ counts.dragEnd }}</div>
      <div data-testid="evt-translateChange" [attr.data-count]="counts.translateChange">translateChange: {{ counts.translateChange }}</div>
      <div data-testid="evt-transitionStart" [attr.data-count]="counts.transitionStart">transitionStart: {{ counts.transitionStart }}</div>
      <div data-testid="evt-transitionEnd" [attr.data-count]="counts.transitionEnd">transitionEnd: {{ counts.transitionEnd }}</div>
      <div data-testid="evt-progress" [attr.data-count]="counts.progress">progress: {{ counts.progress }}</div>
      <div data-testid="evt-slideClick" [attr.data-count]="counts.slideClick">slideClick: {{ counts.slideClick }}</div>
      <div data-testid="evt-reachEnd" [attr.data-count]="counts.reachEnd">reachEnd: {{ counts.reachEnd }}</div>
      <div data-testid="evt-reachStart" [attr.data-count]="counts.reachStart">reachStart: {{ counts.reachStart }}</div>
      <div data-testid="evt-autoplayStart" [attr.data-count]="counts.autoplayStart">autoplayStart: {{ counts.autoplayStart }}</div>
      <div data-testid="evt-autoplayStop" [attr.data-count]="counts.autoplayStop">autoplayStop: {{ counts.autoplayStop }}</div>
      <div data-testid="evt-autoplayPause" [attr.data-count]="counts.autoplayPause">autoplayPause: {{ counts.autoplayPause }}</div>
      <div data-testid="evt-imagesLoaded" [attr.data-count]="counts.imagesLoaded">imagesLoaded: {{ counts.imagesLoaded }}</div>

      <div data-testid="last-activeIndexChange" [attr.data-value]="last.activeIndexChange">last-activeIndexChange: {{ last.activeIndexChange }}</div>
      <div data-testid="last-translateChange" [attr.data-value]="last.translateChange">last-translateChange: {{ last.translateChange }}</div>
      <div data-testid="last-progress" [attr.data-value]="last.progress">last-progress: {{ last.progress }}</div>
      <div data-testid="last-slideClick" [attr.data-value]="last.slideClick">last-slideClick: {{ last.slideClick }}</div>
    </div>
  `,
  moduleMetadata: modules,
});

export const EventsProbe: Story = {
  render: TemplateEventsProbe,
  args: {
    slides: buildSlides(8),
    slidesPerView: '3',
    stepSlides: 1,
    loop: false,
    rewind: false,
    slideOnClick: true,
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
  },
};

export const EventsProbeLoop: Story = {
  render: TemplateEventsProbe,
  args: {
    slides: buildSlides(8),
    slidesPerView: '3',
    stepSlides: 1,
    loop: true,
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
  },
};

export const EventsProbeAutoplay: Story = {
  render: TemplateEventsProbe,
  args: {
    slides: buildSlides(8),
    slidesPerView: '3',
    stepSlides: 1,
    loop: true,
    autoplay: { delay: 1000, pauseOnHover: true, stopOnInteraction: true },
  },
};

/**
 * 5 slides, slidesPerView=2.5, freeMode → reproduces the residual zone case:
 * lastSlideAnchor = 2, but slides 3 and 4 are visible to the right of it.
 * perceivedIndex is expected to subdivide that residual zone in 3 chunks.
 */
export const PerceivedFreeMode: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(5),
    slidesPerView: '2.5',
    freeMode: true,
    loop: false,
    rewind: false,
    pagination: { type: 'dot', clickable: true, external: false },
  },
};

/**
 * Same as above but with snap-to navigation (no freeMode). Used to verify
 * perceivedIndex during a manual drag against the end edge.
 */
export const PerceivedFractionalSpv: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(5),
    slidesPerView: '2.5',
    freeMode: false,
    loop: false,
    rewind: false,
    pagination: { type: 'dot', clickable: true, external: false },
  },
};
