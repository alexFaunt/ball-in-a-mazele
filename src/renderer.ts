import { Maze } from './maze';
import { Ball, Config, InputState } from './physics';

interface RenderConfig extends Config {
  WALL_COLOR: string;
  BG_COLOR: string;
  HOLE_COLOR: string;
  GOAL_COLOR: string;
  BALL_COLOR: string;
}

/**
 * Render the game state to canvas
 */
export function render(
  ctx: CanvasRenderingContext2D,
  maze: Maze,
  ball: Ball,
  input: InputState,
  config: RenderConfig,
  cellSize: number,
  won: boolean,
  message: string | null
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Clear canvas
  ctx.fillStyle = config.BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  // Draw maze walls
  ctx.strokeStyle = config.WALL_COLOR;
  ctx.lineWidth = 3;

  for (let y = 0; y < maze.size; y++) {
    for (let x = 0; x < maze.size; x++) {
      const cell = maze.cells[y][x];
      const cellX = x * cellSize;
      const cellY = y * cellSize;

      ctx.beginPath();

      if (cell.walls.north) {
        ctx.moveTo(cellX, cellY);
        ctx.lineTo(cellX + cellSize, cellY);
      }
      if (cell.walls.east) {
        ctx.moveTo(cellX + cellSize, cellY);
        ctx.lineTo(cellX + cellSize, cellY + cellSize);
      }
      if (cell.walls.south) {
        ctx.moveTo(cellX, cellY + cellSize);
        ctx.lineTo(cellX + cellSize, cellY + cellSize);
      }
      if (cell.walls.west) {
        ctx.moveTo(cellX, cellY);
        ctx.lineTo(cellX, cellY + cellSize);
      }

      ctx.stroke();
    }
  }

  // Draw holes
  const holeRadius = cellSize * config.HOLE_RADIUS_RATIO;
  ctx.fillStyle = config.HOLE_COLOR;

  for (const hole of maze.holes) {
    const holeX = (hole.x + 0.5) * cellSize;
    const holeY = (hole.y + 0.5) * cellSize;

    ctx.beginPath();
    ctx.arc(holeX, holeY, holeRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw goal hole
  const goalRadius = cellSize * config.GOAL_RADIUS_RATIO;
  ctx.fillStyle = config.GOAL_COLOR;
  const goalX = (maze.goal.x + 0.5) * cellSize;
  const goalY = (maze.goal.y + 0.5) * cellSize;

  ctx.beginPath();
  ctx.arc(goalX, goalY, goalRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw ball
  const ballRadius = cellSize * config.BALL_RADIUS_RATIO;

  // Ball shadow for depth
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(ball.x + 2, ball.y + 2, ballRadius, 0, Math.PI * 2);
  ctx.fill();

  // Ball main
  ctx.fillStyle = config.BALL_COLOR;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
  ctx.fill();

  // Ball highlight for 3D effect
  const gradient = ctx.createRadialGradient(
    ball.x - ballRadius * 0.3,
    ball.y - ballRadius * 0.3,
    0,
    ball.x,
    ball.y,
    ballRadius
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw tilt debug indicator
  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.fillText(`Tilt X: ${input.tiltX.toFixed(2)} | Y: ${input.tiltY.toFixed(2)}`, 10, 20);

  // Draw crosshair showing tilt direction
  const crosshairX = width - 60;
  const crosshairY = 60;
  const crosshairSize = 40;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(crosshairX, crosshairY, crosshairSize / 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(crosshairX, crosshairY);
  ctx.lineTo(
    crosshairX + input.tiltX * crosshairSize / 2,
    crosshairY + input.tiltY * crosshairSize / 2
  );
  ctx.stroke();

  ctx.fillStyle = '#f44';
  ctx.beginPath();
  ctx.arc(
    crosshairX + input.tiltX * crosshairSize / 2,
    crosshairY + input.tiltY * crosshairSize / 2,
    4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Message display (win or oof)
  if (won || message) {
    const displayWidth = ctx.canvas.style.width ? parseFloat(ctx.canvas.style.width) : width;
    const displayHeight = ctx.canvas.style.height ? parseFloat(ctx.canvas.style.height) : height;
    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, centerY - 60, displayWidth, 120);

    ctx.textAlign = 'center';

    if (won) {
      ctx.fillStyle = '#2d5';
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText('You Won!', centerX, centerY);

      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.fillText("Tomorrow's maze at midnight UTC", centerX, centerY + 40);
    } else if (message) {
      ctx.fillStyle = '#f44';
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText(message, centerX, centerY);
    }

    ctx.textAlign = 'left';
  }
}

/**
 * Setup canvas with proper dimensions and HiDPI support
 */
export function setupCanvas(canvas: HTMLCanvasElement, size: number): number {
  const dpr = window.devicePixelRatio || 1;
  const maxSize = Math.min(window.innerWidth, window.innerHeight) * 0.95;

  const displaySize = Math.min(maxSize, 800);
  canvas.style.width = `${displaySize}px`;
  canvas.style.height = `${displaySize}px`;

  canvas.width = displaySize * dpr;
  canvas.height = displaySize * dpr;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  return displaySize / size;
}
