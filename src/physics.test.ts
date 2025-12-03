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

describe('Physics - Wall Collision', () => {
  const cellSize = 100;

  it('should stop ball when hitting east wall from left', () => {
    const maze = createTestMaze(3);
    maze.cells[0][0].walls.east = true;

    const ball: Ball = { x: 50, y: 50, vx: 500, vy: 0 };
    const input: InputState = { tiltX: 1, tiltY: 0 };

    updateBall(ball, input, maze, testConfig, cellSize, 0.1);

    expect(ball.x).toBeLessThanOrEqual(100 - cellSize * testConfig.BALL_RADIUS_RATIO);
    expect(ball.vx).toBe(0);
  });

  it('should stop ball when hitting west wall from right', () => {
    const maze = createTestMaze(3);
    maze.cells[0][1].walls.west = true;

    const ball: Ball = { x: 150, y: 50, vx: -500, vy: 0 };
    const input: InputState = { tiltX: -1, tiltY: 0 };

    updateBall(ball, input, maze, testConfig, cellSize, 0.1);

    expect(ball.x).toBeGreaterThanOrEqual(100 + cellSize * testConfig.BALL_RADIUS_RATIO);
    expect(ball.vx).toBe(0);
  });

  it('should stop ball when hitting south wall from top', () => {
    const maze = createTestMaze(3);
    maze.cells[0][0].walls.south = true;

    const ball: Ball = { x: 50, y: 50, vx: 0, vy: 500 };
    const input: InputState = { tiltX: 0, tiltY: 1 };

    updateBall(ball, input, maze, testConfig, cellSize, 0.1);

    expect(ball.y).toBeLessThanOrEqual(100 - cellSize * testConfig.BALL_RADIUS_RATIO);
    expect(ball.vy).toBe(0);
  });

  it('should stop ball when hitting north wall from bottom', () => {
    const maze = createTestMaze(3);
    maze.cells[1][0].walls.north = true;

    const ball: Ball = { x: 50, y: 150, vx: 0, vy: -500 };
    const input: InputState = { tiltX: 0, tiltY: -1 };

    updateBall(ball, input, maze, testConfig, cellSize, 0.1);

    expect(ball.y).toBeGreaterThanOrEqual(100 + cellSize * testConfig.BALL_RADIUS_RATIO);
    expect(ball.vy).toBe(0);
  });

  it('should allow ball through open passage', () => {
    const maze = createTestMaze(3);
    // No walls between cells

    const ball: Ball = { x: 80, y: 50, vx: 100, vy: 0 };
    const input: InputState = { tiltX: 0, tiltY: 0 };

    updateBall(ball, input, maze, testConfig, cellSize, 0.016);

    expect(ball.x).toBeGreaterThan(80);
  });

  it('should handle diagonal movement with walls', () => {
    const maze = createTestMaze(3);
    maze.cells[0][0].walls.east = true;

    const ball: Ball = { x: 50, y: 50, vx: 500, vy: 500 };
    const input: InputState = { tiltX: 1, tiltY: 1 };

    updateBall(ball, input, maze, testConfig, cellSize, 0.1);

    expect(ball.vx).toBe(0);
    expect(ball.y).toBeGreaterThan(50);
  });

  it('should collide with wall end when approaching from north', () => {
    const maze = createTestMaze(3);
    // Vertical wall between cell[0][0] and cell[0][1] (from y=0 to y=100)
    maze.cells[0][0].walls.east = true;
    maze.cells[0][1].walls.west = true;

    // Ball at x=100 (wall position), approaching from above with radius 40
    // Ball center at wall, so edges at 60 and 140
    const ballRadius = cellSize * testConfig.BALL_RADIUS_RATIO;
    const ball: Ball = { x: 100, y: 30, vx: 0, vy: 300 };
    const input: InputState = { tiltX: 0, tiltY: 0 };

    // Multiple small steps to simulate continuous movement
    for (let i = 0; i < 5; i++) {
      updateBall(ball, input, maze, testConfig, cellSize, 0.016);
    }

    // Ball should NOT pass through the wall end at y=100
    // With radius 40, ball center should stop before y=100-40=60 or after y=100+40=140
    const wallEndY = 100;
    const crossedWallEnd = ball.y > wallEndY + ballRadius;
    expect(crossedWallEnd).toBe(false);
  });

  it('should collide with wall end when approaching from south', () => {
    const maze = createTestMaze(3);
    // Wall between cell[0][0] and cell[0][1]
    maze.cells[0][0].walls.east = true;
    maze.cells[0][1].walls.west = true;

    // Ball approaching wall from below (south) at the wall end
    const ball: Ball = { x: 100, y: 150, vx: 0, vy: -200 };
    const input: InputState = { tiltX: 0, tiltY: -1 };

    updateBall(ball, input, maze, testConfig, cellSize, 0.1);

    // Ball should hit the wall end and not pass through
    expect(ball.y).toBeGreaterThan(100);
  });

  it('should collide with horizontal wall end when approaching from west', () => {
    const maze = createTestMaze(3);
    // Horizontal wall between cell[0][0] and cell[1][0]
    maze.cells[0][0].walls.south = true;
    maze.cells[1][0].walls.north = true;

    // Ball approaching wall from west at the wall end
    const ball: Ball = { x: 50, y: 100, vx: 200, vy: 0 };
    const input: InputState = { tiltX: 1, tiltY: 0 };

    updateBall(ball, input, maze, testConfig, cellSize, 0.1);

    // Ball should hit the wall end and not pass through
    expect(ball.x).toBeLessThan(100);
  });

  it('should collide with horizontal wall end when approaching from east', () => {
    const maze = createTestMaze(3);
    // Horizontal wall between cell[0][0] and cell[1][0]
    maze.cells[0][0].walls.south = true;
    maze.cells[1][0].walls.north = true;

    // Ball approaching wall from east at the wall end
    const ball: Ball = { x: 150, y: 100, vx: -200, vy: 0 };
    const input: InputState = { tiltX: -1, tiltY: 0 };

    updateBall(ball, input, maze, testConfig, cellSize, 0.1);

    // Ball should hit the wall end and not pass through
    expect(ball.x).toBeGreaterThan(100);
  });
});

describe('Physics - Holes', () => {
  const cellSize = 100;

  it('should reset when ball falls in regular hole', () => {
    const maze = createTestMaze(3);
    maze.holes = [{ x: 1, y: 1 }];

    const ball: Ball = { x: 150, y: 150, vx: 0, vy: 0 };
    const input: InputState = { tiltX: 0, tiltY: 0 };

    const result = updateBall(ball, input, maze, testConfig, cellSize, 0.016);

    expect(result.reset).toBe(true);
    expect(result.won).toBe(false);
  });

  it('should win when ball reaches goal', () => {
    const maze = createTestMaze(3);
    maze.goal = { x: 2, y: 2 };

    const ball: Ball = { x: 250, y: 250, vx: 0, vy: 0 };
    const input: InputState = { tiltX: 0, tiltY: 0 };

    const result = updateBall(ball, input, maze, testConfig, cellSize, 0.016);

    expect(result.won).toBe(true);
    expect(result.reset).toBe(false);
  });
});

describe('Physics - Bounds', () => {
  const cellSize = 100;

  it('should stop ball at left boundary', () => {
    const maze = createTestMaze(3);

    const ball: Ball = { x: 10, y: 150, vx: -500, vy: 0 };
    const input: InputState = { tiltX: -1, tiltY: 0 };

    updateBall(ball, input, maze, testConfig, cellSize, 0.1);

    expect(ball.x).toBeGreaterThanOrEqual(cellSize * testConfig.BALL_RADIUS_RATIO);
    expect(ball.vx).toBe(0);
  });

  it('should stop ball at right boundary', () => {
    const maze = createTestMaze(3);

    const ball: Ball = { x: 290, y: 150, vx: 500, vy: 0 };
    const input: InputState = { tiltX: 1, tiltY: 0 };

    updateBall(ball, input, maze, testConfig, cellSize, 0.1);

    expect(ball.x).toBeLessThanOrEqual(maze.size * cellSize - cellSize * testConfig.BALL_RADIUS_RATIO);
    expect(ball.vx).toBe(0);
  });
});
