export function getPointerPosition(event: MouseEvent | TouchEvent): {
  x: number;
  y: number;
  isTouch: boolean;
} {
  if (event instanceof MouseEvent) {
    return { x: event.pageX, y: event.pageY, isTouch: false };
  }

  const touch = event.touches[0] ?? event.changedTouches[0];

  return {
    x: touch.pageX,
    y: touch.pageY,
    isTouch: true,
  };
}
