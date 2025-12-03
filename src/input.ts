import { InputState } from './physics';

/**
 * Input manager for mouse and device orientation
 */
export class InputManager {
  private input: InputState = { tiltX: 0, tiltY: 0 };
  private isDragging = false;
  private startPos = { x: 0, y: 0 };
  private canvas: HTMLCanvasElement;
  private orientationEnabled = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupMouseInput();
    this.setupOrientationInput();
  }

  private setupMouseInput() {
    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.startPos = { x: e.clientX, y: e.clientY };
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging || this.orientationEnabled) return;

      const dx = e.clientX - this.startPos.x;
      const dy = e.clientY - this.startPos.y;

      // Map to tilt range [-1, 1]
      this.input.tiltX = this.clamp(dx / 100, -1, 1);
      this.input.tiltY = this.clamp(dy / 100, -1, 1);
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging && !this.orientationEnabled) {
        this.isDragging = false;
        this.input.tiltX = 0;
        this.input.tiltY = 0;
      }
    });

    // Touch support for mobile mouse-like drag
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.orientationEnabled) return;
      e.preventDefault();
      this.isDragging = true;
      const touch = e.touches[0];
      this.startPos = { x: touch.clientX, y: touch.clientY };
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || this.orientationEnabled) return;
      e.preventDefault();
      const touch = e.touches[0];

      const dx = touch.clientX - this.startPos.x;
      const dy = touch.clientY - this.startPos.y;

      this.input.tiltX = this.clamp(dx / 100, -1, 1);
      this.input.tiltY = this.clamp(dy / 100, -1, 1);
    });

    window.addEventListener('touchend', () => {
      if (this.isDragging && !this.orientationEnabled) {
        this.isDragging = false;
        this.input.tiltX = 0;
        this.input.tiltY = 0;
      }
    });
  }

  private setupOrientationInput() {
    window.addEventListener('deviceorientation', (e) => {
      if (!this.orientationEnabled) return;

      // beta: front-back tilt (-180 to 180)
      // gamma: left-right tilt (-90 to 90)
      const beta = e.beta || 0;
      const gamma = e.gamma || 0;

      // Map to tilt range [-1, 1]
      // Adjust sensitivity as needed
      this.input.tiltX = this.clamp(gamma / 45, -1, 1);
      this.input.tiltY = this.clamp(beta / 45, -1, 1);
    });
  }

  async enableOrientation(): Promise<boolean> {
    // Check if DeviceOrientationEvent exists
    if (!window.DeviceOrientationEvent) {
      console.warn('DeviceOrientationEvent not supported');
      return false;
    }

    // iOS 13+ requires permission
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          this.orientationEnabled = true;
          return true;
        }
      } catch (error) {
        console.error('Error requesting orientation permission:', error);
        return false;
      }
    } else {
      // Non-iOS or older browsers
      this.orientationEnabled = true;
      return true;
    }

    return false;
  }

  getInput(): InputState {
    return this.input;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  isOrientationEnabled(): boolean {
    return this.orientationEnabled;
  }
}
