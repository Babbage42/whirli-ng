export interface AxisConfig {
  // DOM
  getContainerSize(el?: HTMLElement): number; // width or height
  getScrollSize(el?: HTMLElement): number; // scrollWidth / scrollHeight
  rectStart(rect: DOMRect): number; // left / top
  rectSize(el?: HTMLElement): number; // width / height

  // Pointers / drag
  pointerMainPos(pos: { x: number; y: number }): number; // x or y
  pointerCrossPos(pos: { x: number; y: number }): number; // y or x

  // Transform CSS for slides
  slidesTransform(translate: number): string;

  // Padding “peek” for container
  peekPadding(peek: number): Partial<CSSStyleDeclaration>;

  // Event Mouse
  mouseMainPos(event: MouseEvent): number;
  mouseCrossPos(event: MouseEvent): number;
  // Event Wheel
  wheelMainDelta(event: WheelEvent): number;
  wheelCrossDelta(event: WheelEvent): number;
}

export const HORIZONTAL_AXIS_CONFIG: AxisConfig = {
  getContainerSize: (el) =>
    el?.getBoundingClientRect?.()?.width ?? el?.clientWidth ?? 0,
  getScrollSize: (el) => el?.scrollWidth ?? 0,
  rectStart: (r) => r.left,
  rectSize: (el) => el?.getBoundingClientRect?.().width ?? 0,
  pointerMainPos: (p) => p.x,
  pointerCrossPos: (p) => p.y,
  slidesTransform: (t) => `translate3d(${t}px, 0, 0)`,
  peekPadding: (peek) => ({
    paddingLeft: `${peek}px`,
    paddingRight: `${peek}px`,
    paddingTop: '',
    paddingBottom: '',
  }),
  mouseMainPos: (event) => event.pageX,
  mouseCrossPos: (event) => event.pageY,
  wheelMainDelta: (event) => {
    const { deltaX, deltaY } = event;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return 0;
    }

    return deltaX;
  },
  wheelCrossDelta: (event) => event.pageY,
};

export const VERTICAL_AXIS_CONFIG: AxisConfig = {
  getContainerSize: (el) =>
    el?.getBoundingClientRect?.()?.height ?? el?.clientHeight ?? 0,
  getScrollSize: (el) => el?.scrollHeight ?? 0,
  rectStart: (r) => r.top,
  rectSize: (el) => el?.getBoundingClientRect?.().height ?? 0,
  pointerMainPos: (p) => p.y,
  pointerCrossPos: (p) => p.x,
  slidesTransform: (t) => `translate3d(0, ${t}px, 0)`,
  peekPadding: (peek) => ({
    paddingTop: `${peek}px`,
    paddingBottom: `${peek}px`,
    paddingLeft: '',
    paddingRight: '',
  }),
  mouseMainPos: (event) => event.pageY,
  mouseCrossPos: (event) => event.pageX,
  wheelMainDelta: (event) => event.deltaY,
  wheelCrossDelta: (event) => event.pageX,
};
