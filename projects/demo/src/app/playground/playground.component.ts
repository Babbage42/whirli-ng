import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  AutoplayOptions,
  CarouselComponent,
  NavigationLeftExternalComponent,
  NavigationRightExternalComponent,
  Pagination,
  PaginationExternalComponent,
  PeekEdges,
  SlideDirective,
  SnapDom,
} from 'whirli-ng';
import {
  DEFAULT_STATE,
  PRESETS,
  PresetCategory,
  PlaygroundState,
} from './playground.model';

type EventLogEntry = {
  id: number;
  name: string;
  category:
    | 'navigation'
    | 'lifecycle'
    | 'interaction'
    | 'transition'
    | 'progress'
    | 'click'
    | 'boundary'
    | 'autoplay';
  payload?: unknown;
  t: number;
};

type ExperienceMode = 'base' | 'didactic';
type DidacticCodeTab = 'template' | 'config' | 'styles';

const EVENT_CATEGORY: Record<string, EventLogEntry['category']> = {
  activeIndexChange: 'navigation',
  slideNext: 'navigation',
  slidePrev: 'navigation',
  perceivedIndexChange: 'navigation',
  afterInit: 'lifecycle',
  beforeDestroy: 'lifecycle',
  imagesLoaded: 'lifecycle',
  touched: 'interaction',
  touchStart: 'interaction',
  dragStart: 'interaction',
  dragEnd: 'interaction',
  translateChange: 'interaction',
  transitionStart: 'transition',
  transitionEnd: 'transition',
  progress: 'progress',
  slideClick: 'click',
  projectedAction: 'click',
  reachEnd: 'boundary',
  reachStart: 'boundary',
  autoplayStart: 'autoplay',
  autoplayStop: 'autoplay',
  autoplayPause: 'autoplay',
};

const ALL_EVENTS = Object.keys(EVENT_CATEGORY);
const PRESET_CATEGORIES: PresetCategory[] = [
  'Basics',
  'Margin',
  'Projected',
  'Loop / virtual',
  'Interaction',
  'Layout',
  'Responsive',
  'Linked carousel',
];

type IndexMarker = {
  label: string;
  value: number;
  offsetPx: number;
  lane: number;
  sticky: 'none' | 'start' | 'end';
  kind: 'current' | 'real' | 'perceived';
};

type VisualSlideMarker = {
  logicalIndex: number;
  offset: number;
  width: number;
};

type SlideBadge = {
  logicalIndex: number;
  offsetPx: number;
  anchor: 'first' | 'last' | undefined;
  active: boolean;
};

type SnapMapItem = {
  id: string;
  logicalIndex: number;
  offsetPercent: number;
  active: boolean;
  anchor: 'first' | 'last' | undefined;
};

type SnapMapCursor = {
  offsetPercent: number;
  label: string;
};

type DecisionTraceItem = {
  label: string;
  value: string;
  reason: string;
};

type DidacticCodeSnippet = {
  template: string;
  config: string;
  styles: string;
};

type DidacticEvent = {
  id: number;
  name: string;
  category: EventLogEntry['category'];
  detail: string;
  value?: string;
};

type StateEntry = {
  key: string;
  value: string;
};

type CompactInsight = {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'ok' | 'warn';
};

type ActiveLesson = {
  title: string;
  body: string;
  focus: string;
};

type DidacticMechanic = {
  title: string;
  value: string;
  body: string;
};

const EVENT_EXPLANATIONS: Partial<Record<string, string>> = {
  touchStart: 'Pointer is down; the carousel starts measuring intent.',
  dragStart: 'Swipe intent is confirmed; movement now controls the carousel.',
  dragEnd:
    'Confirmed drag ended; the carousel resolves inertia, snap, or boundary behavior.',
  translateChange: 'Translate changed during drag.',
  activeIndexChange: 'The navigation index changed.',
  perceivedIndexChange: 'The visually dominant slide changed.',
  slideNext: 'Next navigation command was requested.',
  slidePrev: 'Previous navigation command was requested.',
  slideClick: 'A click on slide content was accepted.',
  projectedAction:
    'An interactive child inside projected content handled the click.',
  transitionStart: 'Animated settling started.',
  transitionEnd: 'Animated settling ended.',
  reachStart: 'The carousel reached the minimum translate boundary.',
  reachEnd: 'The carousel reached the maximum translate boundary.',
  progress: 'Progress ratio changed across the available translate range.',
};

const DIDACTIC_TIMELINE_LIMIT = 32;

@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CarouselComponent,
    SlideDirective,
    NavigationLeftExternalComponent,
    NavigationRightExternalComponent,
    PaginationExternalComponent,
  ],
  templateUrl: './playground.component.html',
  styleUrl: './playground.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaygroundComponent {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly route = inject(ActivatedRoute);

  readonly presets = PRESETS;

  /** Master state — every input on the carousel is derived from this. */
  readonly state = signal<PlaygroundState>(this.readInitialState());

  readonly experienceMode = computed<ExperienceMode>(() => {
    const s = this.state();
    if (s.visualDebug) return 'didactic';
    return 'base';
  });

  readonly experienceModeLabel = computed(() => {
    switch (this.experienceMode()) {
      case 'didactic':
        return 'Developer tutorial: overlays, snaps, state and event timeline';
      default:
        return 'Full workshop: controls, events and state';
    }
  });

  /**
   * Toggle used to fully tear down & remount the carousel component.
   * Useful when the live state looks stuck after many config changes:
   * one click rebuilds the carousel from scratch without restarting ng serve.
   */
  readonly carouselVisible = signal(true);

  /** Inspector tabs */
  readonly tab = signal<'controls' | 'css' | 'events' | 'state'>('controls');

  /** Controls panel collapsed sections */
  readonly collapsedSections = signal<Record<string, boolean>>({});

  /** Programmatic controlledSlideTo helper */
  readonly controlledSlideToValue = signal<number | undefined>(undefined);

  /** Event log (most-recent first) and counters */
  readonly events = signal<EventLogEntry[]>([]);
  readonly counts = signal<Record<string, number>>(
    Object.fromEntries(ALL_EVENTS.map((k) => [k, 0])),
  );
  readonly lastPayloads = signal<Record<string, unknown>>({});
  readonly maxLogSize = 80;
  private nextEventId = 0;
  readonly projectedActionCount = signal(0);
  readonly shareCopied = signal(false);
  readonly didacticCodeVisible = signal(false);
  readonly didacticCodeTab = signal<DidacticCodeTab>('template');
  readonly didacticCodeCopied = signal(false);

  /** Live snapshot of internal carousel state (read from the component ref) */
  readonly carouselRef = viewChild<CarouselComponent>(CarouselComponent);
  readonly liveSnapshot = signal<Record<string, unknown>>({});
  readonly snapshotEnabled = signal(true);
  readonly runtimeStateEntries = computed<StateEntry[]>(() =>
    Object.entries(this.liveSnapshot()).map(([key, value]) => ({
      key,
      value: this.formatStateValue(value),
    })),
  );
  readonly activeLesson = computed<ActiveLesson>(() => {
    const s = this.state();
    if (s.marginEnd > 0) {
      return {
        title: 'marginEnd extends the final scroll range',
        body: 'Use last anchor and last slide to see why the carousel can expose end spacing without losing intermediate slide anchors.',
        focus: `marginEnd ${s.marginEnd}px`,
      };
    }
    if (s.peekEdgesMode !== 'none') {
      return {
        title: 'peekEdges keeps edges flush at boundaries',
        body: 'The carousel reveals neighbouring slides while travelling, but start and end boundaries stay visually aligned.',
        focus:
          s.peekEdgesMode === 'absolute'
            ? `${s.peekEdgesAbsolute}px peek`
            : `${s.peekEdgesRelative} ratio peek`,
      };
    }
    if (s.freeMode) {
      return {
        title: 'freeMode makes perceivedIndex the useful reading',
        body: 'When translate can settle between snaps, perceivedIndex tells which slide the user visually reads as active.',
        focus: 'free translate',
      };
    }
    if (s.loop) {
      return {
        title: 'loop separates logical indexes from DOM positions',
        body: 'Loop can render repeated DOM positions for the same logical slide, so real/current/perceived explain different concerns.',
        focus: 'logical index',
      };
    }
    if (s.thumbsEnabled) {
      return {
        title: 'thumbs follow perceivedIndex',
        body: 'The thumbnail carousel follows the slide that is visually dominant in the master carousel.',
        focus: 'linked carousel',
      };
    }
    return {
      title: 'indexes, snaps and events stay connected',
      body: 'Interact with the carousel and compare the snap map, highlighted indexes and event coach to understand each state update.',
      focus: 'baseline',
    };
  });

  private getImageSrc(index: number, width: number, height: number) {
    const seed = this.state().imageSeed;
    return `https://picsum.photos/seed/carousel-${seed}-${index}-${width}x${height}/${width}/${height}`;
  }

  projectedImageSrc(index: number) {
    return this.getImageSrc(index, 260 + (index % 4) * 36, 180);
  }

  // ── Derived inputs (state → carousel) ─────────────────────────────────

  readonly slides = computed(() => {
    const { slideCount, variableWidths, disabledIndices } = this.state();
    const disabled = new Set(
      disabledIndices
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n)),
    );
    return Array.from({ length: slideCount }, (_, i) => {
      const w = variableWidths ? 200 + (i % 5) * 60 : 300;
      return {
        image: this.getImageSrc(i, w, 200),
        disabled: disabled.has(i),
      };
    });
  });

  readonly slideIndexes = computed(() =>
    Array.from({ length: this.state().slideCount }, (_, i) => i),
  );

  readonly presetGroups = computed(() =>
    PRESET_CATEGORIES.map((category) => ({
      category,
      presets: this.presets
        .map((preset, index) => ({ preset, index }))
        .filter((item) => item.preset.category === category),
    })).filter((group) => group.presets.length > 0),
  );

  readonly compactInsights = computed<CompactInsight[]>(() => {
    const snapshot = this.liveSnapshot();
    const current = Number(snapshot['currentPosition']);
    const real = Number(snapshot['currentRealPosition']);
    const perceived = Number(snapshot['perceivedIndex']);
    const firstAnchor = Number(snapshot['firstSlideAnchor']);
    const lastAnchor = Number(snapshot['lastSlideAnchor']);
    const minTranslate = Number(snapshot['minTranslate']);
    const maxTranslate = Number(snapshot['maxTranslate']);
    const currentTranslate = Number(snapshot['currentTranslate']);
    const hasReachedStart = Boolean(snapshot['hasReachedStart']);
    const hasReachedEnd = Boolean(snapshot['hasReachedEnd']);
    const progress = this.translateToPercent(
      Number.isFinite(currentTranslate) ? currentTranslate : 0,
      Number.isFinite(minTranslate) ? minTranslate : 0,
      Number.isFinite(maxTranslate) ? maxTranslate : 0,
    );

    return [
      {
        label: 'Focus',
        value:
          current === perceived
            ? this.formatIndex(current)
            : `nav ${this.formatIndex(current)} / visual ${this.formatIndex(perceived)}`,
        detail:
          current === perceived
            ? 'Navigation and visual focus are aligned.'
            : 'Navigation anchor and perceived slide diverge.',
        tone: current === perceived ? 'ok' : 'warn',
      },
      {
        label: 'Range',
        value: `${Math.round(progress)}%`,
        detail: 'Current translate position within the allowed travel range.',
      },
      {
        label: 'Boundary',
        value: hasReachedStart ? 'start' : hasReachedEnd ? 'end' : 'inside',
        detail: 'Whether prev/next can still move the carousel.',
        tone: hasReachedStart || hasReachedEnd ? 'warn' : 'ok',
      },
      {
        label: 'Anchors',
        value: `${this.formatIndex(firstAnchor)} -> ${this.formatIndex(lastAnchor)}`,
        detail: 'First and last slide indexes that can be used as snap anchors.',
      },
      ...(Number.isFinite(real) && real !== current
        ? [
            {
              label: 'Logical',
              value: this.formatIndex(real),
              detail: 'Loop or direction normalization changed the real index.',
              tone: 'warn' as const,
            },
          ]
        : []),
    ];
  });

  readonly indexMarkers = computed<IndexMarker[]>(() => {
    const snapshot = this.liveSnapshot();
    const snaps = (snapshot['snapsDom'] as SnapDom[] | undefined) ?? [];
    const slideTranslates =
      (snapshot['slideTranslates'] as Array<number | undefined> | undefined) ??
      [];
    const visualSlides =
      (snapshot['visualSlides'] as VisualSlideMarker[] | undefined) ?? [];
    const currentTranslate = Number(snapshot['currentTranslate']) || 0;
    const viewportSize = Number(snapshot['fullWidth']) || 0;
    return [
      ['current', snapshot['currentPosition'], 'current'],
      ['real', snapshot['currentRealPosition'], 'real'],
      ['perceived', snapshot['perceivedIndex'], 'perceived'],
    ]
      .map(([label, raw, kind]) => ({
        label: String(label),
        value: Number(raw),
        kind: kind as IndexMarker['kind'],
      }))
      .filter((marker) => Number.isFinite(marker.value))
      .map((marker) => {
        const visualSlide = visualSlides.find(
          (item) => item.logicalIndex === marker.value,
        );
        const snap = snaps.find((item) => item.logicalIndex === marker.value);
        const snapLeft =
          snap?.left ??
          (Number.isFinite(slideTranslates[marker.value])
            ? -Number(slideTranslates[marker.value])
            : undefined);
        const rawOffset =
          visualSlide?.offset ??
          (snapLeft === undefined ? undefined : snapLeft + currentTranslate);

        if (rawOffset === undefined) return undefined;
        const clampedOffset = viewportSize
          ? Math.max(0, Math.min(viewportSize, rawOffset))
          : rawOffset;

        return {
          ...marker,
          offsetPx: clampedOffset,
          lane: marker.kind === 'current' ? 0 : marker.kind === 'real' ? 1 : 2,
          sticky:
            viewportSize && rawOffset < 0
              ? 'start'
              : viewportSize && rawOffset > viewportSize
                ? 'end'
                : 'none',
        };
      })
      .filter(
        (marker): marker is IndexMarker =>
          !!marker && Number.isFinite(marker.offsetPx),
      );
  });

  readonly slideBadges = computed<SlideBadge[]>(() => {
    const snapshot = this.liveSnapshot();
    const visualSlides =
      (snapshot['visualSlides'] as VisualSlideMarker[] | undefined) ?? [];
    const viewportSize = Number(snapshot['fullWidth']) || 0;
    const current = Number(snapshot['currentPosition']);
    const real = Number(snapshot['currentRealPosition']);
    const perceived = Number(snapshot['perceivedIndex']);
    const firstAnchor = Number(snapshot['firstSlideAnchor']);
    const lastAnchor = Number(snapshot['lastSlideAnchor']);

    return visualSlides
      .filter((slide) => {
        if (!viewportSize) return true;
        return slide.offset + slide.width >= 0 && slide.offset <= viewportSize;
      })
      .map((slide) => ({
        logicalIndex: slide.logicalIndex,
        offsetPx: viewportSize
          ? Math.max(0, Math.min(viewportSize, slide.offset))
          : slide.offset,
        anchor:
          firstAnchor === slide.logicalIndex
            ? 'first'
            : lastAnchor === slide.logicalIndex
              ? 'last'
              : undefined,
        active:
          current === slide.logicalIndex ||
          real === slide.logicalIndex ||
          perceived === slide.logicalIndex,
      }));
  });

  readonly snapMapItems = computed<SnapMapItem[]>(() => {
    const snapshot = this.liveSnapshot();
    const snaps = (snapshot['snapsDom'] as SnapDom[] | undefined) ?? [];
    const slideTranslates =
      (snapshot['slideTranslates'] as Array<number | undefined> | undefined) ??
      [];
    const minTranslate = Number(snapshot['minTranslate']) || 0;
    const maxTranslate = Number(snapshot['maxTranslate']) || 0;
    const perceived = Number(snapshot['perceivedIndex']);
    const firstAnchor = Number(snapshot['firstSlideAnchor']);
    const lastAnchor = Number(snapshot['lastSlideAnchor']);
    const loop = this.state().loop;

    return snaps
      .map((snap) => {
        const indexedTranslate = slideTranslates[snap.logicalIndex];
        const translate =
          !loop && Number.isFinite(indexedTranslate)
            ? Number(slideTranslates[snap.logicalIndex])
            : snap.translate;
        if (!Number.isFinite(translate)) return undefined;
        if (!this.isTranslateInRange(translate, minTranslate, maxTranslate)) {
          return undefined;
        }
        return {
          id: `${snap.domIndex}:${snap.logicalIndex}:${translate}`,
          logicalIndex: snap.logicalIndex,
          offsetPercent: this.translateToPercent(
            translate,
            minTranslate,
            maxTranslate,
          ),
          active: snap.logicalIndex === perceived,
          anchor:
            firstAnchor === snap.logicalIndex
              ? 'first'
              : lastAnchor === snap.logicalIndex
                ? 'last'
                : undefined,
        };
      })
      .filter((item): item is SnapMapItem => !!item);
  });

  readonly snapMapCursor = computed<SnapMapCursor>(() => {
    const snapshot = this.liveSnapshot();
    return {
      label: 'translate',
      offsetPercent: this.translateToPercent(
        Number(snapshot['currentTranslate']) || 0,
        Number(snapshot['minTranslate']) || 0,
        Number(snapshot['maxTranslate']) || 0,
      ),
    };
  });

  readonly decisionTrace = computed<DecisionTraceItem[]>(() => {
    const s = this.state();
    const snapshot = this.liveSnapshot();
    const current = Number(snapshot['currentPosition']);
    const real = Number(snapshot['currentRealPosition']);
    const perceived = Number(snapshot['perceivedIndex']);
    const firstAnchor = Number(snapshot['firstSlideAnchor']);
    const lastAnchor = Number(snapshot['lastSlideAnchor']);
    const translate = Math.round(Number(snapshot['currentTranslate']) || 0);
    const minTranslate = Math.round(Number(snapshot['minTranslate']) || 0);
    const maxTranslate = Math.round(Number(snapshot['maxTranslate']) || 0);
    const atStart = Boolean(snapshot['hasReachedStart']);
    const atEnd = Boolean(snapshot['hasReachedEnd']);
    const items: DecisionTraceItem[] = [];

    items.push({
      label: 'active index',
      value: `current ${this.formatIndex(current)} / perceived ${this.formatIndex(perceived)}`,
      reason:
        current === perceived
          ? 'The navigation anchor and visual focus currently point to the same slide.'
          : 'The navigation anchor and visual focus diverge, usually because several slides are visible or the carousel is between snaps.',
    });

    if (Number.isFinite(real) && real !== current) {
      items.push({
        label: 'logical index',
        value: `real ${this.formatIndex(real)}`,
        reason:
          'The real index represents the logical slide after direction, loop, or DOM ordering has been normalized.',
      });
    }

    items.push({
      label: 'translate bounds',
      value: `${translate}px | start ${minTranslate}px / end ${maxTranslate}px`,
      reason: atEnd
        ? 'The carousel is clamped on the end boundary, so next navigation cannot move beyond maxTranslate.'
        : atStart
          ? 'The carousel is clamped on the start boundary, so previous navigation cannot move before minTranslate.'
          : 'The carousel is travelling inside its allowed translate range.',
    });

    if (Number.isFinite(firstAnchor) && Number.isFinite(lastAnchor)) {
      items.push({
        label: 'snap anchors',
        value: `${this.formatIndex(firstAnchor)} -> ${this.formatIndex(lastAnchor)}`,
        reason:
          'These are the first and last indexes that can act as navigation anchors for the current layout.',
      });
    }

    if (s.peekEdgesMode !== 'none') {
      items.push({
        label: 'peek edges',
        value:
          s.peekEdgesMode === 'absolute'
            ? `${s.peekEdgesAbsolute}px`
            : `${s.peekEdgesRelative}`,
        reason:
          'Peek is applied while travelling, but start and end boundaries stay flush so the carousel does not leave an empty outer gutter.',
      });
    }

    if (s.marginEnd > 0) {
      items.push({
        label: 'marginEnd',
        value: `${s.marginEnd}px`,
        reason:
          'The final translate range includes this extra end space, so the last slide can be followed by a deliberate visual gap.',
      });
    }

    if (s.loop) {
      items.push({
        label: 'loop',
        value: 'enabled',
        reason:
          'DOM snaps can repeat logical indexes; the trace uses logical indexes so the explanation stays stable while the DOM wraps.',
      });
    }

    if (s.freeMode) {
      items.push({
        label: 'freeMode',
        value: 'enabled',
        reason:
          'The translate can settle between snap points; perceivedIndex is therefore the best indicator of what the user visually reads as active.',
      });
    }

    if (s.thumbsEnabled) {
      items.push({
        label: 'thumbs',
        value: 'linked',
        reason:
          'The thumbnail carousel follows the perceived index, so the selected thumb matches the visible focus of the main carousel.',
      });
    }

    if (s.virtual) {
      items.push({
        label: 'virtual window',
        value: `${snapshot['virtualStart'] ?? 0} -> ${snapshot['virtualEnd'] ?? 0}`,
        reason:
          'Only the useful slide window is rendered while the logical slide count remains available for navigation.',
      });
    }

    if (s.contentMode === 'projected') {
      items.push({
        label: 'projected content',
        value: 'custom DOM',
        reason:
          'Interactive children can opt out of drag with dragIgnoreSelector or data-carousel-no-drag while the slide itself remains draggable.',
      });
    }

    return items.slice(0, 7);
  });

  readonly didacticMechanics = computed<DidacticMechanic[]>(() => {
    const s = this.state();
    const snapshot = this.liveSnapshot();
    const current = Number(snapshot['currentPosition']);
    const real = Number(snapshot['currentRealPosition']);
    const perceived = Number(snapshot['perceivedIndex']);
    const firstAnchor = Number(snapshot['firstSlideAnchor']);
    const lastAnchor = Number(snapshot['lastSlideAnchor']);
    const items: DidacticMechanic[] = [
      {
        title: 'Index model',
        value: `current ${this.formatIndex(current)} / real ${this.formatIndex(real)} / perceived ${this.formatIndex(perceived)}`,
        body:
          current === perceived && current === real
            ? 'All index readings agree in this simple state.'
            : 'The readings split navigation intent, normalized logical index and visual focus.',
      },
      {
        title: 'Snap anchors',
        value: `${this.formatIndex(firstAnchor)} -> ${this.formatIndex(lastAnchor)}`,
        body:
          'Navigation cannot use every slide as a final anchor when several slides are visible or the end range is constrained.',
      },
    ];

    if (s.marginEnd > 0) {
      items.push({
        title: 'marginEnd',
        value: `${s.marginEnd}px`,
        body:
          'The end translate includes intentional extra space, so the last snap and the last slide can be different concepts.',
      });
    }

    if (s.peekEdgesMode !== 'none') {
      items.push({
        title: 'peekEdges',
        value:
          s.peekEdgesMode === 'absolute'
            ? `${s.peekEdgesAbsolute}px`
            : `${s.peekEdgesRelative}`,
        body:
          'Neighbours peek during travel, while the first and final boundaries stay visually flush.',
      });
    }

    if (s.freeMode) {
      items.push({
        title: 'freeMode',
        value: 'free translate',
        body:
          'The carousel can settle between snaps; perceivedIndex becomes the best live reading of what the user sees.',
      });
    }

    if (s.loop) {
      items.push({
        title: 'loop',
        value: 'logical wrap',
        body:
          'The DOM can wrap or repeat slides, but real/perceived indexes keep the public reading logical.',
      });
    }

    if (s.virtual) {
      items.push({
        title: 'virtual window',
        value: `${snapshot['virtualStart'] ?? 0} -> ${snapshot['virtualEnd'] ?? 0}`,
        body:
          'Only the useful DOM window is rendered while navigation still targets the full logical slide set.',
      });
    }

    if (s.thumbsEnabled) {
      items.push({
        title: 'thumbs sync',
        value: 'perceived index',
        body:
          'The selected thumb follows visual focus, not only the last requested navigation command.',
      });
    }

    if (s.contentMode === 'projected') {
      items.push({
        title: 'projected content',
        value: 'custom DOM',
        body:
          'Interactive slide children remain usable while drag/click guarding protects swipe intent.',
      });
    }

    if (s.navigationExternal || s.paginationExternal) {
      items.push({
        title: 'external controls',
        value: [
          s.navigationExternal ? 'navigation' : undefined,
          s.paginationExternal ? 'pagination' : undefined,
        ]
          .filter(Boolean)
          .join(' + '),
        body:
          'Controls can live outside the carousel while still binding to the same carousel instance.',
      });
    }

    return items.slice(0, 8);
  });

  readonly didacticEvents = computed<DidacticEvent[]>(() => {
    return this.events()
      .filter((event) => EVENT_EXPLANATIONS[event.name])
      .slice(0, DIDACTIC_TIMELINE_LIMIT)
      .map((event) => this.toDidacticEvent(event));
  });

  readonly didacticCode = computed<DidacticCodeSnippet>(() => {
    return {
      template: this.buildDidacticTemplate(),
      config: this.buildDidacticConfig(),
      styles: this.buildDidacticStyles(),
    };
  });

  readonly activeDidacticCode = computed(
    () => this.didacticCode()[this.didacticCodeTab()],
  );

  readonly autoplayValue = computed<boolean | AutoplayOptions>(() => {
    const s = this.state();
    if (!s.autoplayEnabled) return false;
    return {
      delay: s.autoplayDelay,
      pauseOnHover: s.autoplayPauseOnHover,
      pauseOnFocus: s.autoplayPauseOnFocus,
      stopOnInteraction: s.autoplayStopOnInteraction,
      disableOnHidden: s.autoplayDisableOnHidden,
      resumeOnMouseLeave: s.autoplayResumeOnMouseLeave,
    };
  });

  readonly paginationValue = computed<Pagination | undefined>(() => {
    const s = this.state();
    if (s.paginationMode === 'none') return undefined;
    return {
      type: s.paginationMode,
      clickable: s.paginationClickable,
      external: s.paginationExternal,
      position:
        s.paginationMode === 'progress' || s.paginationMode === 'scrollbar'
          ? s.paginationProgressPosition
          : undefined,
    };
  });

  readonly peekEdgesValue = computed<PeekEdges>(() => {
    const s = this.state();
    if (s.peekEdgesMode === 'absolute')
      return { absoluteOffset: s.peekEdgesAbsolute };
    if (s.peekEdgesMode === 'relative')
      return { relativeOffset: s.peekEdgesRelative };
    return undefined;
  });

  readonly breakpointsValue = computed(() => {
    const s = this.state();
    if (!s.breakpointsEnabled) return undefined;
    return {
      [`(max-width: ${s.bpMobileMaxWidth}px)`]: {
        slidesPerView: s.bpMobileSlidesPerView,
        spaceBetween: s.bpMobileSpaceBetween,
      },
      [`(min-width: ${s.bpMobileMaxWidth + 1}px) and (max-width: ${s.bpTabletMaxWidth}px)`]:
        {
          slidesPerView: s.bpTabletSlidesPerView,
          spaceBetween: s.bpTabletSpaceBetween,
        },
      [`(min-width: ${s.bpTabletMaxWidth + 1}px)`]: {
        slidesPerView: s.bpDesktopSlidesPerView,
        spaceBetween: s.bpDesktopSpaceBetween,
      },
    };
  });

  readonly thumbsOptionsValue = computed(() => {
    const s = this.state();
    if (!s.thumbsEnabled) return undefined;
    return { selectionBar: s.thumbsSelectionBar };
  });

  readonly mouseWheelValue = computed<
    boolean | { horizontal?: boolean; vertical?: boolean }
  >(() => {
    const m = this.state().mouseWheel;
    if (m === 'off') return false;
    if (m === 'on') return true;
    if (m === 'horizontal') return { horizontal: true, vertical: false };
    if (m === 'vertical') return { horizontal: false, vertical: true };
    return { horizontal: true, vertical: true };
  });

  readonly eventList = computed(() => {
    const counts = this.counts();
    const last = this.lastPayloads();
    return ALL_EVENTS.map((name) => ({
      name,
      category: EVENT_CATEGORY[name],
      count: counts[name] ?? 0,
      last: last[name],
    }));
  });

  readonly categoryColor: Record<EventLogEntry['category'], string> = {
    navigation: '#3b82f6',
    lifecycle: '#a855f7',
    interaction: '#10b981',
    transition: '#f59e0b',
    progress: '#06b6d4',
    click: '#ef4444',
    boundary: '#eab308',
    autoplay: '#ec4899',
  };

  constructor() {
    // SSR: skip all browser-only side-effects to avoid blocking prerender.
    if (!this.isBrowser) return;

    // Hydrate legacy hash links if present, then keep the SSR-readable query
    // param in sync. URL fragments are never sent to the server.
    this.hydrateFromUrl();
    effect(() => {
      this.syncUrl(this.state());
    });

    // Periodically pull internal snapshot (read-only) for the "State" tab.
    effect((onCleanup) => {
      if (!this.snapshotEnabled()) return;
      const handle = setInterval(() => this.refreshSnapshot(), 250);
      onCleanup(() => clearInterval(handle));
    });
  }

  // ── State mutators ────────────────────────────────────────────────────

  patch<K extends keyof PlaygroundState>(key: K, value: PlaygroundState[K]) {
    this.state.update((s) => ({ ...s, [key]: value }));
  }

  setExperienceMode(mode: ExperienceMode) {
    this.state.update((s) => ({
      ...s,
      visualDebug: mode === 'didactic',
    }));
    this.tab.set('controls');
  }

  /** ngModel two-way bridge with proper typing. */
  bind<K extends keyof PlaygroundState>(key: K) {
    return {
      get: () => this.state()[key],
      set: (v: PlaygroundState[K]) => this.patch(key, v),
    };
  }

  // ── Presets / actions ────────────────────────────────────────────────

  applyPreset(idx: number) {
    const p = this.presets[idx];
    if (!p) return;
    this.resetEvents();
    this.state.set({ ...DEFAULT_STATE, ...p.state });
  }

  resetAll() {
    this.resetEvents();
    this.projectedActionCount.set(0);
    this.state.set({ ...DEFAULT_STATE });
  }

  /**
   * Destroy then re-create the carousel without touching the playground
   * state. Useful when a sequence of config changes left the live carousel
   * in an inconsistent visual state.
   */
  resetCarousel() {
    this.carouselVisible.set(false);
    // Wait one microtask so Angular fully runs the destroy lifecycle.
    queueMicrotask(() => this.carouselVisible.set(true));
  }

  randomizeImages() {
    this.patch('imageSeed', Math.random().toString(36).slice(2, 10));
  }

  applyForceSlideTo() {
    const v = this.controlledSlideToValue();
    if (v === undefined || v === null || !Number.isFinite(v)) return;
    // Re-arm: toggle to undefined first to allow re-sending the same value.
    this.controlledSlideToValue.set(undefined);
    setTimeout(() => this.controlledSlideToValue.set(v), 0);
  }

  goToDidacticIndex(kind: 'firstAnchor' | 'lastAnchor' | 'lastSlide') {
    const snapshot = this.liveSnapshot();
    const index =
      kind === 'firstAnchor'
        ? Number(snapshot['firstSlideAnchor'])
        : kind === 'lastAnchor'
          ? Number(snapshot['lastSlideAnchor'])
          : this.state().slideCount - 1;

    if (!Number.isFinite(index)) return;
    this.controlledSlideToValue.set(undefined);
    setTimeout(() => this.controlledSlideToValue.set(index), 0);
  }

  toggleSection(section: string) {
    this.collapsedSections.update((s) => ({ ...s, [section]: !s[section] }));
  }

  setTab(t: 'controls' | 'css' | 'events' | 'state') {
    this.tab.set(t);
  }

  setDidacticCodeTab(tab: DidacticCodeTab) {
    this.didacticCodeTab.set(tab);
  }

  copyDidacticCode() {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard?.writeText(this.activeDidacticCode());
    this.didacticCodeCopied.set(true);
    setTimeout(() => this.didacticCodeCopied.set(false), 1200);
  }

  // ── Event capture ────────────────────────────────────────────────────

  onEvent(name: string, payload?: unknown) {
    this.counts.update((c) => ({ ...c, [name]: (c[name] ?? 0) + 1 }));
    if (payload !== undefined) {
      this.lastPayloads.update((l) => ({ ...l, [name]: payload }));
    }
    this.events.update((log) => {
      const entry: EventLogEntry = {
        id: this.nextEventId++,
        name,
        category: EVENT_CATEGORY[name] ?? 'navigation',
        payload,
        t: performance.now(),
      };
      const next = [entry, ...log];
      return next.length > this.maxLogSize
        ? next.slice(0, this.maxLogSize)
        : next;
    });
  }

  onProjectedAction(event: Event, index: number) {
    event.stopPropagation();
    this.projectedActionCount.update((count) => count + 1);
    this.onEvent('projectedAction', index);
  }

  resetEvents() {
    this.events.set([]);
    this.counts.set(Object.fromEntries(ALL_EVENTS.map((k) => [k, 0])));
    this.lastPayloads.set({});
  }

  private toDidacticEvent(event: EventLogEntry): DidacticEvent {
    return {
      id: event.id,
      name: event.name,
      category: event.category,
      detail: EVENT_EXPLANATIONS[event.name] ?? '',
      value: this.formatEventPayload(event),
    };
  }

  private formatEventPayload(event: EventLogEntry) {
    if (event.payload === undefined || event.payload === null) return undefined;

    if (typeof event.payload === 'number') {
      if (event.name === 'progress') {
        return `${Math.round(event.payload * 100)}%`;
      }
      if (event.name === 'translateChange') {
        return `${Math.round(event.payload)}px`;
      }
      return `#${event.payload}`;
    }

    return undefined;
  }

  private formatIndex(index: number) {
    return Number.isFinite(index) ? `#${index}` : '-';
  }

  private buildDidacticTemplate() {
    const s = this.state();
    const lines = ['<whirli-carousel'];
    const addInput = (name: string, expression: string) => {
      lines.push(`  [${name}]="${expression}"`);
    };

    if (s.contentMode === 'projected') {
      addInput('slides', '[]');
    } else {
      addInput('slides', 'slides');
    }
    if (s.thumbsEnabled || s.navigationExternal || s.paginationExternal) {
      lines.splice(1, 0, '  #carousel');
    }

    this.addStateInput(lines, 'slidesPerView', 'slidesPerView');
    this.addStateInput(lines, 'stepSlides', 'stepSlides');
    this.addStateInput(lines, 'spaceBetween', 'spaceBetween');
    this.addStateInput(lines, 'marginStart', 'marginStart');
    this.addStateInput(lines, 'marginEnd', 'marginEnd');
    if (this.peekEdgesValue()) addInput('peekEdges', 'peekEdges');
    if (s.navigationExternal) {
      addInput('showControls', 'true');
    } else {
      this.addStateInput(lines, 'showControls', 'showControls');
    }
    this.addStateInput(lines, 'alwaysShowControls', 'alwaysShowControls');
    this.addStateInput(lines, 'iconSize', 'iconSize');
    if (this.paginationValue()) addInput('pagination', 'pagination');
    this.addStateInput(lines, 'loop', 'loop');
    this.addStateInput(lines, 'rewind', 'rewind');
    this.addStateInput(lines, 'center', 'center');
    this.addStateInput(lines, 'notCenterBounds', 'notCenterBounds');
    this.addStateInput(
      lines,
      'centerWhenNotEnoughSlides',
      'centerWhenNotEnoughSlides',
    );
    this.addStateInput(lines, 'freeMode', 'freeMode');
    this.addStateInput(lines, 'virtual', 'virtual');
    this.addStateInput(lines, 'virtualBuffer', 'virtualBuffer');
    this.addStateInput(lines, 'resistance', 'resistance');
    this.addStateInput(lines, 'direction', 'direction');
    this.addStateInput(lines, 'axis', 'axis');
    this.addStateInput(lines, 'draggable', 'draggable');
    this.addStateInput(lines, 'canSwipe', 'canSwipe');
    this.addStateInput(lines, 'slideOnClick', 'slideOnClick');
    this.addStateInput(lines, 'dragThresholdRatio', 'dragThresholdRatio');
    this.addStateInput(lines, 'dragIgnoreSelector', 'dragIgnoreSelector');
    if (s.mouseWheel !== DEFAULT_STATE.mouseWheel)
      addInput('mouseWheel', 'mouseWheel');
    this.addStateInput(lines, 'keyboardNavigation', 'keyboardNavigation');
    this.addStateInput(lines, 'navigateSlideBySlide', 'navigateSlideBySlide');
    this.addStateInput(lines, 'initialSlide', 'initialSlide');
    if (this.autoplayValue()) addInput('autoplay', 'autoplay');
    this.addStateInput(lines, 'lazyLoading', 'lazyLoading');
    if (this.breakpointsValue()) addInput('breakpoints', 'breakpoints');
    this.addStateInput(lines, 'debug', 'debug');
    lines.push(`  (activeIndexChange)="onSlideUpdate($event)"`);
    lines.push(`  (perceivedIndexChange)="onPerceivedIndexChanged($event)"`);
    lines.push('>');

    if (s.contentMode === 'projected') {
      lines.push('  @for (item of items; track item.id) {');
      lines.push('    <article *slide class="carousel-card">');
      lines.push('      <h3>{{ item.title }}</h3>');
      lines.push('      <button data-carousel-no-drag>Action</button>');
      lines.push('    </article>');
      lines.push('  }');
    }

    lines.push('</whirli-carousel>');

    if (s.navigationExternal) {
      lines.push('');
      lines.push('<nav class="carousel-external-navigation">');
      lines.push(
        '  <whirli-navigation-prev [for]="carousel"></whirli-navigation-prev>',
      );
      lines.push(
        '  <whirli-navigation-next [for]="carousel"></whirli-navigation-next>',
      );
      lines.push('</nav>');
    }

    if (s.paginationExternal && this.paginationValue()) {
      lines.push('');
      lines.push('<nav class="carousel-external-pagination">');
      lines.push(
        '  <whirli-pagination [for]="carousel"></whirli-pagination>',
      );
      lines.push('</nav>');
    }

    if (s.thumbsEnabled) {
      lines.push('');
      lines.push('<whirli-carousel');
      lines.push('  [slides]="slides"');
      lines.push(`  [slidesPerView]="thumbsSlidesPerView"`);
      lines.push(`  [spaceBetween]="thumbsSpaceBetween"`);
      lines.push(`  [thumbsFor]="carousel"`);
      lines.push(`  [thumbsOptions]="thumbsOptions"`);
      lines.push('></whirli-carousel>');
    }

    return lines.join('\n');
  }

  private addStateInput<K extends keyof PlaygroundState>(
    lines: string[],
    key: K,
    inputName: string,
  ) {
    if (this.state()[key] !== DEFAULT_STATE[key]) {
      lines.push(`  [${inputName}]="${String(key)}"`);
    }
  }

  private buildDidacticConfig() {
    const s = this.state();
    const lines = [
      `slides = buildSlides(${s.slideCount});`,
      `slidesPerView = ${this.toCodeLiteral(s.slidesPerView)};`,
    ];
    const addStateConst = <K extends keyof PlaygroundState>(key: K) => {
      if (s[key] !== DEFAULT_STATE[key]) {
        lines.push(`${String(key)} = ${this.toCodeLiteral(s[key])};`);
      }
    };

    addStateConst('stepSlides');
    addStateConst('spaceBetween');
    addStateConst('marginStart');
    addStateConst('marginEnd');
    addStateConst('showControls');
    addStateConst('alwaysShowControls');
    addStateConst('iconSize');
    addStateConst('loop');
    addStateConst('rewind');
    addStateConst('center');
    addStateConst('notCenterBounds');
    addStateConst('centerWhenNotEnoughSlides');
    addStateConst('freeMode');
    addStateConst('virtual');
    addStateConst('virtualBuffer');
    addStateConst('resistance');
    addStateConst('direction');
    addStateConst('axis');
    addStateConst('draggable');
    addStateConst('canSwipe');
    addStateConst('slideOnClick');
    addStateConst('dragThresholdRatio');
    addStateConst('dragIgnoreSelector');
    addStateConst('keyboardNavigation');
    addStateConst('navigateSlideBySlide');
    addStateConst('initialSlide');
    addStateConst('lazyLoading');
    addStateConst('debug');

    if (s.mouseWheel !== DEFAULT_STATE.mouseWheel) {
      lines.push(`mouseWheel = ${this.toCodeLiteral(this.mouseWheelValue())};`);
    }
    if (this.paginationValue()) {
      lines.push(`pagination = ${this.toCodeLiteral(this.paginationValue())};`);
    }
    if (this.peekEdgesValue()) {
      lines.push(`peekEdges = ${this.toCodeLiteral(this.peekEdgesValue())};`);
    }
    if (this.autoplayValue()) {
      lines.push(`autoplay = ${this.toCodeLiteral(this.autoplayValue())};`);
    }
    if (this.breakpointsValue()) {
      lines.push(
        `breakpoints = ${this.toCodeLiteral(this.breakpointsValue())};`,
      );
    }
    if (s.thumbsEnabled) {
      lines.push(
        `thumbsSlidesPerView = ${this.toCodeLiteral(s.thumbsSlidesPerView)};`,
      );
      lines.push(
        `thumbsSpaceBetween = ${this.toCodeLiteral(s.thumbsSpaceBetween)};`,
      );
      lines.push(
        `thumbsOptions = ${this.toCodeLiteral(this.thumbsOptionsValue())};`,
      );
    }

    lines.push('');
    lines.push('onSlideUpdate(index: number) {');
    lines.push('  // navigation index changed');
    lines.push('}');
    lines.push('');
    lines.push('onPerceivedIndexChanged(index: number) {');
    lines.push('  // visually dominant slide changed');
    lines.push('}');

    return lines.join('\n');
  }

  private buildDidacticStyles() {
    const s = this.state();
    const lines = ['whirli-carousel {'];
    const addCssVar = (
      key: keyof PlaygroundState,
      name: string,
      value: string | number,
      unit = '',
    ) => {
      if (s[key] !== DEFAULT_STATE[key]) {
        lines.push(`  ${name}: ${value}${unit};`);
      }
    };

    addCssVar('themeColor', '--whirli-theme-color', s.themeColor);
    addCssVar('carouselOverflow', '--whirli-overflow', s.carouselOverflow);
    addCssVar(
      'carouselGapToPagination',
      '--whirli-gap-to-pagination',
      s.carouselGapToPagination,
      'px',
    );
    addCssVar(
      'slideDisabledOpacity',
      '--whirli-slide-disabled-opacity',
      s.slideDisabledOpacity,
    );
    addCssVar('slideCursor', '--whirli-slide-cursor', s.slideCursor);
    addCssVar(
      'navInlineOffset',
      '--whirli-nav-inline-offset',
      s.navInlineOffset,
      'px',
    );
    addCssVar(
      'navBlockOffset',
      '--whirli-nav-block-offset',
      s.navBlockOffset,
      'px',
    );
    addCssVar('navColor', '--whirli-nav-color', s.navColor);
    addCssVar('navColorHover', '--whirli-nav-color-hover', s.navColorHover);
    addCssVar('navBackground', '--whirli-nav-background', s.navBackground);
    addCssVar(
      'navBackgroundHover',
      '--whirli-nav-background-hover',
      s.navBackgroundHover,
    );
    addCssVar('navBorder', '--whirli-nav-border', s.navBorder);
    addCssVar('navRadius', '--whirli-nav-radius', s.navRadius, 'px');
    addCssVar('navPadding', '--whirli-nav-padding', s.navPadding, 'px');
    addCssVar('navCursor', '--whirli-nav-cursor', s.navCursor);
    addCssVar(
      'navHiddenOpacity',
      '--whirli-nav-hidden-opacity',
      s.navHiddenOpacity,
    );
    addCssVar('navZIndex', '--whirli-nav-z-index', s.navZIndex);
    addCssVar('focusColor', '--whirli-focus-color', s.focusColor);
    addCssVar('focusWidth', '--whirli-focus-width', s.focusWidth, 'px');
    addCssVar('focusOffset', '--whirli-focus-offset', s.focusOffset, 'px');
    addCssVar(
      'paginationMarginBottom',
      '--whirli-pagination-margin-bottom',
      s.paginationMarginBottom,
    );
    addCssVar(
      'paginationColor',
      '--whirli-pagination-color',
      s.paginationColor,
    );
    addCssVar('paginationGap', '--whirli-pagination-gap', s.paginationGap, 'px');
    addCssVar(
      'paginationPadding',
      '--whirli-pagination-padding',
      s.paginationPadding,
      'px',
    );
    addCssVar(
      'paginationDotSize',
      '--whirli-pagination-dot-size',
      s.paginationDotSize,
      'px',
    );
    addCssVar(
      'paginationDotWidth',
      '--whirli-pagination-dot-width',
      s.paginationDotWidth,
      'px',
    );
    addCssVar(
      'paginationDotHeight',
      '--whirli-pagination-dot-height',
      s.paginationDotHeight,
      'px',
    );
    addCssVar(
      'paginationDotRadius',
      '--whirli-pagination-dot-radius',
      s.paginationDotRadius,
      'px',
    );
    addCssVar(
      'paginationDotColor',
      '--whirli-pagination-dot-color',
      s.paginationDotColor,
    );
    addCssVar(
      'paginationDotActiveColor',
      '--whirli-pagination-dot-active-color',
      s.paginationDotActiveColor,
    );
    addCssVar(
      'paginationDotOpacity',
      '--whirli-pagination-dot-opacity',
      s.paginationDotOpacity,
    );
    addCssVar(
      'paginationDotActiveOpacity',
      '--whirli-pagination-dot-active-opacity',
      s.paginationDotActiveOpacity,
    );
    addCssVar(
      'paginationDotActiveScale',
      '--whirli-pagination-dot-active-scale',
      s.paginationDotActiveScale,
    );
    addCssVar(
      'paginationDotNearScale',
      '--whirli-pagination-dot-near-scale',
      s.paginationDotNearScale,
    );
    addCssVar(
      'paginationDotFarScale',
      '--whirli-pagination-dot-far-scale',
      s.paginationDotFarScale,
    );
    addCssVar(
      'paginationTransitionDuration',
      '--whirli-pagination-transition-duration',
      s.paginationTransitionDuration,
      'ms',
    );
    addCssVar(
      'paginationFractionColor',
      '--whirli-pagination-fraction-color',
      s.paginationFractionColor,
    );
    addCssVar(
      'paginationFractionBackground',
      '--whirli-pagination-fraction-background',
      s.paginationFractionBackground,
    );
    addCssVar(
      'paginationFractionBorder',
      '--whirli-pagination-fraction-border',
      s.paginationFractionBorder,
    );
    addCssVar(
      'paginationFractionRadius',
      '--whirli-pagination-fraction-radius',
      s.paginationFractionRadius,
      'px',
    );
    addCssVar(
      'paginationFractionPadding',
      '--whirli-pagination-fraction-padding',
      s.paginationFractionPadding,
      'px',
    );
    addCssVar(
      'paginationFractionFontSize',
      '--whirli-pagination-fraction-font-size',
      s.paginationFractionFontSize,
      'px',
    );
    addCssVar(
      'paginationFractionFontWeight',
      '--whirli-pagination-fraction-font-weight',
      s.paginationFractionFontWeight,
    );
    addCssVar(
      'paginationProgressWidth',
      '--whirli-pagination-progress-width',
      s.paginationProgressWidth,
    );
    addCssVar(
      'paginationProgressHeight',
      '--whirli-pagination-progress-height',
      s.paginationProgressHeight,
      'px',
    );
    addCssVar(
      'paginationProgressColor',
      '--whirli-pagination-progress-color',
      s.paginationProgressColor,
    );
    addCssVar(
      'paginationProgressBackground',
      '--whirli-pagination-progress-background',
      s.paginationProgressBackground,
    );
    addCssVar(
      'paginationProgressBorder',
      '--whirli-pagination-progress-border',
      s.paginationProgressBorder,
    );
    addCssVar(
      'paginationProgressRadius',
      '--whirli-pagination-progress-radius',
      s.paginationProgressRadius,
      'px',
    );
    addCssVar(
      'paginationHostWidth',
      '--whirli-pagination-host-width',
      s.paginationHostWidth,
    );
    addCssVar(
      'paginationScrollbarWidth',
      '--whirli-pagination-scrollbar-width',
      s.paginationScrollbarWidth,
    );
    addCssVar(
      'paginationScrollbarHeight',
      '--whirli-pagination-scrollbar-height',
      s.paginationScrollbarHeight,
      'px',
    );
    addCssVar(
      'paginationScrollbarBackground',
      '--whirli-pagination-scrollbar-background',
      s.paginationScrollbarBackground,
    );
    addCssVar(
      'paginationScrollbarBorder',
      '--whirli-pagination-scrollbar-border',
      s.paginationScrollbarBorder,
    );
    addCssVar(
      'paginationScrollbarRadius',
      '--whirli-pagination-scrollbar-radius',
      s.paginationScrollbarRadius,
      'px',
    );
    addCssVar(
      'paginationScrollbarThumbColor',
      '--whirli-pagination-scrollbar-thumb-color',
      s.paginationScrollbarThumbColor,
    );
    addCssVar(
      'paginationScrollbarThumbBorder',
      '--whirli-pagination-scrollbar-thumb-border',
      s.paginationScrollbarThumbBorder,
    );
    addCssVar(
      'paginationScrollbarThumbRadius',
      '--whirli-pagination-scrollbar-thumb-radius',
      s.paginationScrollbarThumbRadius,
      'px',
    );
    addCssVar(
      'paginationPosition',
      '--whirli-pagination-position',
      s.paginationPosition,
    );
    addCssVar('paginationTop', '--whirli-pagination-top', s.paginationTop);
    addCssVar('paginationRight', '--whirli-pagination-right', s.paginationRight);
    addCssVar(
      'paginationBottom',
      '--whirli-pagination-bottom',
      s.paginationBottom,
    );
    addCssVar('paginationLeft', '--whirli-pagination-left', s.paginationLeft);
    addCssVar(
      'paginationMargin',
      '--whirli-pagination-margin',
      s.paginationMargin,
    );
    addCssVar('paginationAlign', '--whirli-pagination-align', s.paginationAlign);
    addCssVar('paginationZIndex', '--whirli-pagination-z-index', s.paginationZIndex);
    addCssVar(
      'thumbIndicatorHeight',
      '--whirli-thumb-indicator-height',
      s.thumbIndicatorHeight,
      'px',
    );
    addCssVar(
      'thumbIndicatorRadius',
      '--whirli-thumb-indicator-radius',
      s.thumbIndicatorRadius,
      'px',
    );
    addCssVar(
      'thumbIndicatorColor',
      '--whirli-thumb-indicator-color',
      s.thumbIndicatorColor,
    );
    addCssVar(
      'thumbIndicatorBottom',
      '--whirli-thumb-indicator-bottom',
      s.thumbIndicatorBottom,
      'px',
    );
    addCssVar(
      'thumbIndicatorZIndex',
      '--whirli-thumb-indicator-z-index',
      s.thumbIndicatorZIndex,
    );

    if (lines.length === 1) {
      return '/* No visual CSS override needed for the current carousel. */';
    }

    lines.push('}');
    return lines.join('\n');
  }

  private toCodeLiteral(value: unknown) {
    return JSON.stringify(value, null, 2).replace(/"([^"]+)":/g, '$1:');
  }

  private formatStateValue(value: unknown): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'string') return value === '' ? '""' : value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return JSON.stringify(value, this.stateJsonReplacer, 2);
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, this.stateJsonReplacer, 2);
    }
    return String(value);
  }

  private stateJsonReplacer = (_key: string, value: unknown) => {
    if (value instanceof HTMLElement) {
      return `<${value.tagName.toLowerCase()}>`;
    }
    if (value instanceof Element) {
      return `<${value.tagName.toLowerCase()}>`;
    }
    if (typeof value === 'function') {
      return '[function]';
    }
    return value;
  };

  trackEvent = (_: number, e: EventLogEntry) => e.id;
  trackName = (_: number, e: { name: string }) => e.name;

  // ── Live snapshot of internal state ──────────────────────────────────

  refreshSnapshot() {
    const c = this.carouselRef();
    if (!c) return;
    try {
      this.liveSnapshot.set({
        currentPosition: c.currentPosition(),
        currentRealPosition: c.currentRealPosition(),
        perceivedIndex: c.perceivedIndex(),
        currentTranslate: c.store.currentTranslate(),
        minTranslate: c.store.minTranslate(),
        maxTranslate: c.store.maxTranslate(),
        isDragging: c.store.isDragging(),
        fullWidth: c.store.fullWidth(),
        snapsDom: c.store.snapsDom(),
        slideTranslates: c.store.slideTranslates(),
        visualSlides: this.getVisualSlides(c),
        storeState: c.store.state(),
        firstSlideAnchor: c.firstSlideAnchor(),
        lastSlideAnchor: c.lastSlideAnchor(),
        totalSlides: c.totalSlides(),
        totalSlidesVisible: c.totalSlidesVisible(),
        hasReachedStart: c.hasReachedStart(),
        hasReachedEnd: c.hasReachedEnd(),
        peekEdgesOffset: c.peekEdgesOffset(),
        virtualStart: c.virtualStart(),
        layoutReady: c.layoutReady(),
      });
    } catch {
      // signals may not be ready yet
    }
  }

  private getVisualSlides(c: CarouselComponent): VisualSlideMarker[] {
    const track = c.store.allSlides()?.nativeElement;
    const wrapper = track?.parentElement;
    if (!track || !wrapper) return [];

    const axis = this.state().axis;
    const wrapperRect = wrapper.getBoundingClientRect();
    const snaps = c.store.snapsDom();
    const domSlides = c.store.domSlides();

    return snaps
      .map((snap) => {
        const slide = domSlides[snap.domIndex];
        if (!slide) return undefined;
        const slideRect = slide.getBoundingClientRect();
        return {
          logicalIndex: snap.logicalIndex,
          offset:
            axis === 'vertical'
              ? slideRect.top - wrapperRect.top
              : slideRect.left - wrapperRect.left,
          width: axis === 'vertical' ? slideRect.height : slideRect.width,
        };
      })
      .filter((item): item is VisualSlideMarker => !!item);
  }

  private translateToPercent(
    translate: number,
    minTranslate: number,
    maxTranslate: number,
  ) {
    const range = maxTranslate - minTranslate;
    if (!Number.isFinite(translate) || !range) return 0;
    return Math.max(
      0,
      Math.min(100, ((translate - minTranslate) / range) * 100),
    );
  }

  private isTranslateInRange(
    translate: number,
    minTranslate: number,
    maxTranslate: number,
  ) {
    const tolerance = 0.5;
    const min = Math.min(minTranslate, maxTranslate) - tolerance;
    const max = Math.max(minTranslate, maxTranslate) + tolerance;
    return translate >= min && translate <= max;
  }

  // ── URL persistence ─────────────────────────────────────────────────

  private readInitialState(): PlaygroundState {
    const encoded = this.route.snapshot.queryParamMap.get('s');
    const parsed = encoded ? this.decodeStateParam(encoded) : undefined;
    return { ...DEFAULT_STATE, ...(parsed ?? {}) };
  }

  private hydrateFromUrl() {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const queryState = this.decodeStateParam(url.searchParams.get('s'));
    const hashState = this.decodeHashState(url.hash);
    const parsed = queryState ?? hashState;
    if (parsed) {
      this.state.set({ ...DEFAULT_STATE, ...parsed });
    }
  }

  private syncUrl(state: PlaygroundState) {
    if (typeof window === 'undefined') return;
    // Only persist diffs from DEFAULT_STATE to keep the URL short.
    const diff: Record<string, unknown> = {};
    for (const k of Object.keys(state) as (keyof PlaygroundState)[]) {
      if (state[k] !== DEFAULT_STATE[k]) diff[k] = state[k];
    }
    const url = new URL(window.location.href);
    const encoded = this.encodeStateParam(diff);
    if (Object.keys(diff).length) {
      url.searchParams.set('s', encoded);
    } else {
      url.searchParams.delete('s');
    }
    url.hash = '';

    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (current !== next) {
      history.replaceState(null, '', next);
    }
  }

  private decodeHashState(hash: string) {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    return this.decodeStateParam(params.get('s'));
  }

  private decodeStateParam(
    encoded: string | null,
  ): Partial<PlaygroundState> | undefined {
    if (!encoded) return undefined;
    try {
      const json = this.decodeBase64(decodeURIComponent(encoded));
      return JSON.parse(json);
    } catch {
      return undefined;
    }
  }

  private encodeStateParam(state: Record<string, unknown>) {
    return this.encodeBase64(JSON.stringify(state));
  }

  private decodeBase64(value: string) {
    if (typeof atob === 'function') {
      return atob(value);
    }
    return Buffer.from(value, 'base64').toString('utf-8');
  }

  private encodeBase64(value: string) {
    if (typeof btoa === 'function') {
      return btoa(value);
    }
    return Buffer.from(value, 'utf-8').toString('base64');
  }

  copyShareLink() {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => {
        this.shareCopied.set(true);
        setTimeout(() => this.shareCopied.set(false), 1400);
      })
      .catch(() => undefined);
  }
}
