import { Maze } from './maze';

export interface Ball {
  x: number; // World coordinates (pixels)
  y: number;
  vx: number; // Velocity
  vy: number;
}

export interface Config {
  GRID_SIZE: number;
  GRAVITY: number;
  FRICTION: number;
  BALL_RADIUS_RATIO: number;
  HOLE_RADIUS_RATIO: number;
}

export interface InputState {
  tiltX: number; // -1 to 1
  tiltY: number;
}

/**
 * Update ball physics based on tilt input
 */
export function updateBall(
  ball: Ball,
  input: InputState,
  maze: Maze,
  config: Config,
  cellSize: number,
  dt: number
): { reset: boolean; won: boolean } {
  // Apply gravity based on tilt
  const ax = input.tiltX * config.GRAVITY;
  const ay = input.tiltY * config.GRAVITY;

  // Update velocity
  ball.vx += ax * dt;
  ball.vy += ay * dt;

  // Apply friction
  ball.vx *= config.FRICTION;
  ball.vy *= config.FRICTION;

  // Ball radius in pixels
  const ballRadius = cellSize * config.BALL_RADIUS_RATIO;

  // Store old position
  const oldX = ball.x;
  const oldY = ball.y;

  // Update X position
  ball.x += ball.vx * dt;

  // Check all walls the ball might be passing through
  // For X direction, check all cell boundaries between old and new position
  if (ball.vx !== 0) {
    const minX = Math.min(oldX - ballRadius, ball.x - ballRadius);
    const maxX = Math.max(oldX + ballRadius, ball.x + ballRadius);

    const cellY = Math.floor(ball.y / cellSize);

    for (let x = Math.floor(minX / cellSize); x < Math.ceil(maxX / cellSize); x++) {
      if (x < 0 || x >= maze.size || cellY < 0 || cellY >= maze.size) continue;

      const cell = maze.cells[cellY][x];

      // Check east wall
      if (ball.vx > 0 && cell.walls.east) {
        const wallX = (x + 1) * cellSize;
        if (oldX + ballRadius <= wallX && ball.x + ballRadius > wallX) {
          ball.x = wallX - ballRadius;
          ball.vx = 0;
          break;
        }
      }

      // Check west wall
      if (ball.vx < 0 && cell.walls.west) {
        const wallX = x * cellSize;
        if (oldX - ballRadius >= wallX && ball.x - ballRadius < wallX) {
          ball.x = wallX + ballRadius;
          ball.vx = 0;
          break;
        }
      }
    }
  }

  // Update Y position
  ball.y += ball.vy * dt;

  // Check all walls the ball might be passing through
  // For Y direction, check all cell boundaries between old and new position
  if (ball.vy !== 0) {
    const minY = Math.min(oldY - ballRadius, ball.y - ballRadius);
    const maxY = Math.max(oldY + ballRadius, ball.y + ballRadius);

    const cellX = Math.floor(ball.x / cellSize);

    for (let y = Math.floor(minY / cellSize); y < Math.ceil(maxY / cellSize); y++) {
      if (y < 0 || y >= maze.size || cellX < 0 || cellX >= maze.size) continue;

      const cell = maze.cells[y][cellX];

      // Check south wall
      if (ball.vy > 0 && cell.walls.south) {
        const wallY = (y + 1) * cellSize;
        if (oldY + ballRadius <= wallY && ball.y + ballRadius > wallY) {
          ball.y = wallY - ballRadius;
          ball.vy = 0;
          break;
        }
      }

      // Check north wall
      if (ball.vy < 0 && cell.walls.north) {
        const wallY = y * cellSize;
        if (oldY - ballRadius >= wallY && ball.y - ballRadius < wallY) {
          ball.y = wallY + ballRadius;
          ball.vy = 0;
          break;
        }
      }
    }
  }

  // Bounds check
  if (ball.x - ballRadius < 0) {
    ball.x = ballRadius;
    ball.vx = 0;
  }
  if (ball.x + ballRadius > maze.size * cellSize) {
    ball.x = maze.size * cellSize - ballRadius;
    ball.vx = 0;
  }
  if (ball.y - ballRadius < 0) {
    ball.y = ballRadius;
    ball.vy = 0;
  }
  if (ball.y + ballRadius > maze.size * cellSize) {
    ball.y = maze.size * cellSize - ballRadius;
    ball.vy = 0;
  }

  // Check holes
  const holeRadius = cellSize * config.HOLE_RADIUS_RATIO;

  // Check goal hole
  const goalX = (maze.goal.x + 0.5) * cellSize;
  const goalY = (maze.goal.y + 0.5) * cellSize;
  const distToGoal = Math.sqrt(
    (ball.x - goalX) ** 2 + (ball.y - goalY) ** 2
  );

  if (distToGoal < holeRadius) {
    return { reset: false, won: true };
  }

  // Check other holes
  for (const hole of maze.holes) {
    const holeX = (hole.x + 0.5) * cellSize;
    const holeY = (hole.y + 0.5) * cellSize;
    const distToHole = Math.sqrt(
      (ball.x - holeX) ** 2 + (ball.y - holeY) ** 2
    );

    if (distToHole < holeRadius) {
      return { reset: true, won: false };
    }
  }

  return { reset: false, won: false };
}

/**
 * Reset ball to starting position
 */
export function resetBall(ball: Ball, cellSize: number) {
  ball.x = cellSize * 0.5;
  ball.y = cellSize * 0.5;
  ball.vx = 0;
  ball.vy = 0;
}
