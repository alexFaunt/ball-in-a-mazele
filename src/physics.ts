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
  GOAL_RADIUS_RATIO: number;
}

export interface InputState {
  tiltX: number; // -1 to 1
  tiltY: number;
}

/**
 * Update ball physics based on tilt input
 */
/**
 * Check if circle collides with line segment
 */
function circleLineCollision(
  cx: number, cy: number, radius: number,
  x1: number, y1: number, x2: number, y2: number
): { collides: boolean; nx?: number; ny?: number } {
  // Find closest point on line segment to circle center
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    // Line segment is a point
    const distSq = (cx - x1) * (cx - x1) + (cy - y1) * (cy - y1);
    return { collides: distSq <= radius * radius };
  }

  // Project circle center onto line
  let t = ((cx - x1) * dx + (cy - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  const distX = cx - closestX;
  const distY = cy - closestY;
  const distSq = distX * distX + distY * distY;

  if (distSq <= radius * radius) {
    const dist = Math.sqrt(distSq);
    return {
      collides: true,
      nx: dist > 0 ? distX / dist : 0,
      ny: dist > 0 ? distY / dist : 0,
    };
  }

  return { collides: false };
}

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

  // Additional check: collision with all wall segments (handles corners/ends)
  const minCellX = Math.max(0, Math.floor((ball.x - ballRadius) / cellSize));
  const maxCellX = Math.min(maze.size - 1, Math.floor((ball.x + ballRadius) / cellSize));
  const minCellY = Math.max(0, Math.floor((ball.y - ballRadius) / cellSize));
  const maxCellY = Math.min(maze.size - 1, Math.floor((ball.y + ballRadius) / cellSize));

  for (let cy = minCellY; cy <= maxCellY; cy++) {
    for (let cx = minCellX; cx <= maxCellX; cx++) {
      const cell = maze.cells[cy][cx];
      const cellX = cx * cellSize;
      const cellY = cy * cellSize;

      // Check each wall as a line segment
      if (cell.walls.north) {
        const col = circleLineCollision(
          ball.x, ball.y, ballRadius,
          cellX, cellY, cellX + cellSize, cellY
        );
        if (col.collides && col.nx !== undefined && col.ny !== undefined) {
          // Find distance from ball to closest point on line
          const dx = cellX + cellSize - cellX;
          const dy = cellY - cellY;
          const t = Math.max(0, Math.min(1, ((ball.x - cellX) * dx + (ball.y - cellY) * dy) / (dx * dx + dy * dy)));
          const closestX = cellX + t * dx;
          const closestY = cellY + t * dy;
          const dist = Math.sqrt((ball.x - closestX) ** 2 + (ball.y - closestY) ** 2);
          const overlap = ballRadius - dist;
          if (overlap > 0) {
            ball.x += col.nx * overlap;
            ball.y += col.ny * overlap;
            ball.vy = 0;
          }
        }
      }

      if (cell.walls.south) {
        const col = circleLineCollision(
          ball.x, ball.y, ballRadius,
          cellX, cellY + cellSize, cellX + cellSize, cellY + cellSize
        );
        if (col.collides && col.nx !== undefined && col.ny !== undefined) {
          const dx = cellX + cellSize - cellX;
          const dy = (cellY + cellSize) - (cellY + cellSize);
          const t = Math.max(0, Math.min(1, ((ball.x - cellX) * dx + (ball.y - (cellY + cellSize)) * dy) / (dx * dx + dy * dy)));
          const closestX = cellX + t * dx;
          const closestY = cellY + cellSize + t * dy;
          const dist = Math.sqrt((ball.x - closestX) ** 2 + (ball.y - closestY) ** 2);
          const overlap = ballRadius - dist;
          if (overlap > 0) {
            ball.x += col.nx * overlap;
            ball.y += col.ny * overlap;
            ball.vy = 0;
          }
        }
      }

      if (cell.walls.west) {
        const col = circleLineCollision(
          ball.x, ball.y, ballRadius,
          cellX, cellY, cellX, cellY + cellSize
        );
        if (col.collides && col.nx !== undefined && col.ny !== undefined) {
          const dx = cellX - cellX;
          const dy = cellY + cellSize - cellY;
          const t = Math.max(0, Math.min(1, ((ball.x - cellX) * dx + (ball.y - cellY) * dy) / (dx * dx + dy * dy)));
          const closestX = cellX + t * dx;
          const closestY = cellY + t * dy;
          const dist = Math.sqrt((ball.x - closestX) ** 2 + (ball.y - closestY) ** 2);
          const overlap = ballRadius - dist;
          if (overlap > 0) {
            ball.x += col.nx * overlap;
            ball.y += col.ny * overlap;
            ball.vx = 0;
          }
        }
      }

      if (cell.walls.east) {
        const col = circleLineCollision(
          ball.x, ball.y, ballRadius,
          cellX + cellSize, cellY, cellX + cellSize, cellY + cellSize
        );
        if (col.collides && col.nx !== undefined && col.ny !== undefined) {
          const dx = (cellX + cellSize) - (cellX + cellSize);
          const dy = cellY + cellSize - cellY;
          const t = Math.max(0, Math.min(1, ((ball.x - (cellX + cellSize)) * dx + (ball.y - cellY) * dy) / (dx * dx + dy * dy)));
          const closestX = cellX + cellSize + t * dx;
          const closestY = cellY + t * dy;
          const dist = Math.sqrt((ball.x - closestX) ** 2 + (ball.y - closestY) ** 2);
          const overlap = ballRadius - dist;
          if (overlap > 0) {
            ball.x += col.nx * overlap;
            ball.y += col.ny * overlap;
            ball.vx = 0;
          }
        }
      }
    }
  }

  // Check holes
  const holeRadius = cellSize * config.HOLE_RADIUS_RATIO;
  const goalRadius = cellSize * config.GOAL_RADIUS_RATIO;

  // Check goal hole
  const goalX = (maze.goal.x + 0.5) * cellSize;
  const goalY = (maze.goal.y + 0.5) * cellSize;
  const distToGoal = Math.sqrt(
    (ball.x - goalX) ** 2 + (ball.y - goalY) ** 2
  );

  if (distToGoal < goalRadius) {
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
