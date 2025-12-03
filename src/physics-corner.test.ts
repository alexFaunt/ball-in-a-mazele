import { describe, it, expect } from 'vitest';
import { updateBall, Ball, Config, InputState } from './physics';
import { Maze, Cell } from './maze';

const createTestMaze = (size: number): Maze => {
  const cells: Cell[][] = [];
  for (let y = 0; y < size; y++) {
    cells[y] = [];
    for (let x = 0; x < size; x++) {
      cells[y][x] = {
        x,
        y,
        walls: { north: false, east: false, south: false, west: false },
      };
    }
  }
  return {
    size,
    cells,
    holes: [],
    goal: { x: size - 1, y: size - 1 },
  };
};

const testConfig: Config = {
  GRID_SIZE: 3,
  GRAVITY: 1000,
  FRICTION: 0.98,
  BALL_RADIUS_RATIO: 0.4,
  HOLE_RADIUS_RATIO: 0.3,
  GOAL_RADIUS_RATIO: 0.35,
};

describe('Physics - Wall End/Corner Collision', () => {
  const cellSize = 100;
  const ballRadius = cellSize * testConfig.BALL_RADIUS_RATIO; // 40

  it('should block ball moving down when wall end is below ball', () => {
    const maze = createTestMaze(3);
    // Create vertical wall at x=100 between cells (runs from y=0 to y=100)
    maze.cells[0][0].walls.east = true;

    // Ball moving straight down, centered on wall (x=100)
    // Starting above wall end, should collide with wall end at y=100
    const ball: Ball = { x: 100, y: 20, vx: 0, vy: 0 };
    const input: InputState = { tiltX: 0, tiltY: 1 };

    // Run simulation - ball accelerates down towards wall end
    for (let i = 0; i < 20; i++) {
      const result = updateBall(ball, input, maze, testConfig, cellSize, 0.016);
      if (result.reset || result.won) break;
    }

    // Ball should be stopped by wall end at y=100
    // With radius 40, center should not pass y=100+40=140
    expect(ball.y).toBeLessThanOrEqual(140);
  });

  it('should block ball moving right when wall end is to the right', () => {
    const maze = createTestMaze(3);
    // Create horizontal wall at y=100 between cells (runs from x=0 to x=100)
    maze.cells[0][0].walls.south = true;

    // Ball moving straight right, centered on wall (y=100)
    // Starting left of wall end, should collide with wall end at x=100
    const ball: Ball = { x: 20, y: 100, vx: 0, vy: 0 };
    const input: InputState = { tiltX: 1, tiltY: 0 };

    // Run simulation
    for (let i = 0; i < 20; i++) {
      const result = updateBall(ball, input, maze, testConfig, cellSize, 0.016);
      if (result.reset || result.won) break;
    }

    // Ball should be stopped by wall end at x=100
    // With radius 40, center should not pass x=100+40=140
    expect(ball.x).toBeLessThanOrEqual(140);
  });

  it('should block ball moving horizontally when it spans cells with wall end', () => {
    const maze = createTestMaze(3);
    // Vertical wall at x=100 in cell[0][0] only (not in cell[1][0])
    maze.cells[0][0].walls.east = true;

    // Ball at y=95 with radius 40 spans y=55 to y=135 (crosses cell boundary at y=100)
    // Ball moving right should hit the wall end
    const ball: Ball = { x: 20, y: 95, vx: 0, vy: 0 };
    const input: InputState = { tiltX: 1, tiltY: 0 };

    // Run simulation
    for (let i = 0; i < 30; i++) {
      updateBall(ball, input, maze, testConfig, cellSize, 0.016);
    }

    // Ball should collide with wall end at x=100
    // Ball center should not pass x=100
    expect(ball.x).toBeLessThanOrEqual(100 + ballRadius);
  });

  it('should block ball moving horizontally near bottom of wall', () => {
    const maze = createTestMaze(3);
    // Vertical wall at x=200 in cell[0][1] only
    maze.cells[0][1].walls.east = true;

    // Ball at y=95 (near cell boundary) moving right
    const ball: Ball = { x: 120, y: 95, vx: 0, vy: 0 };
    const input: InputState = { tiltX: 1, tiltY: 0 };

    for (let i = 0; i < 30; i++) {
      updateBall(ball, input, maze, testConfig, cellSize, 0.016);
    }

    // Should stop at wall
    expect(ball.x).toBeLessThanOrEqual(300 - ballRadius);
  });
});
