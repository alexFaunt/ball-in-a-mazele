import { getTodaySeed } from './utils';
import { generateMaze, Maze } from './maze';
import { Ball, updateBall, resetBall } from './physics';
import { render, setupCanvas } from './renderer';
import { InputManager } from './input';

// Configuration
const CONFIG = {
  GRID_SIZE: 10,
  GRAVITY: 1200,
  FRICTION: 0.98,
  BALL_RADIUS_RATIO: 0.3,
  HOLE_COUNT: 16,
  HOLE_RADIUS_RATIO: 0.2,
  GOAL_RADIUS_RATIO: 0.3,
  WALL_COLOR: '#d4a760',
  BG_COLOR: '#f4e8d0',
  HOLE_COLOR: '#2a2a2a',
  GOAL_COLOR: '#2d5',
  BALL_COLOR: '#456',
};

// Game state
let maze: Maze;
let ball: Ball;
let cellSize: number;
let inputManager: InputManager;
let won = false;
let lastTime = 0;
let message: string | null = null;
let messageEndTime = 0;

/**
 * Initialize game
 */
function init() {
  // Get canvas
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get 2D context');
    return;
  }

  // Setup canvas
  cellSize = setupCanvas(canvas, CONFIG.GRID_SIZE);

  // Generate maze from today's seed
  const seed = getTodaySeed();
  maze = generateMaze(seed, CONFIG.GRID_SIZE, CONFIG.HOLE_COUNT);

  // Initialize ball at center of top-left cell
  ball = {
    x: cellSize * 0.5,
    y: cellSize * 0.5,
    vx: 0,
    vy: 0,
  };

  // Setup input
  inputManager = new InputManager(canvas);

  // Handle window resize
  window.addEventListener('resize', () => {
    cellSize = setupCanvas(canvas, CONFIG.GRID_SIZE);
  });

  // Start game loop
  requestAnimationFrame(gameLoop);
}

/**
 * Game loop
 */
function gameLoop(time: number) {
  const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0;
  lastTime = time;

  // Clear message if expired
  if (message && time >= messageEndTime) {
    message = null;
  }

  if (!won) {
    // Update physics
    const input = inputManager.getInput();
    const result = updateBall(ball, input, maze, CONFIG, cellSize, dt);

    if (result.won) {
      won = true;
    } else if (result.reset) {
      message = 'oof';
      messageEndTime = time + 1000;
      resetBall(ball, cellSize);
    }
  }

  // Render
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  render(ctx, maze, ball, inputManager.getInput(), CONFIG, cellSize, won, message);

  requestAnimationFrame(gameLoop);
}

// Start game when page loads
init();
