import { InputState } from './physics';

/**
 * Input manager for mouse and touch
 */
export class InputManager {
  private input: InputState = { tiltX: 0, tiltY: 0 };
  private isDragging = false;
  private startPos = { x: 0, y: 0 };
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupMouseInput();
  }

  private setupMouseInput() {
    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.startPos = { x: e.clientX, y: e.clientY };
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const dx = e.clientX - this.startPos.x;
      const dy = e.clientY - this.startPos.y;

      // Map to tilt range [-1, 1]
      this.input.tiltX = this.clamp(dx / 100, -1, 1);
      this.input.tiltY = this.clamp(dy / 100, -1, 1);
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.input.tiltX = 0;
        this.input.tiltY = 0;
      }
    });

    // Touch support for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isDragging = true;
      const touch = e.touches[0];
      this.startPos = { x: touch.clientX, y: touch.clientY };
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];

      const dx = touch.clientX - this.startPos.x;
      const dy = touch.clientY - this.startPos.y;

      this.input.tiltX = this.clamp(dx / 100, -1, 1);
      this.input.tiltY = this.clamp(dy / 100, -1, 1);
    });

    window.addEventListener('touchend', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.input.tiltX = 0;
        this.input.tiltY = 0;
      }
    });
  }

  getInput(): InputState {
    return this.input;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
