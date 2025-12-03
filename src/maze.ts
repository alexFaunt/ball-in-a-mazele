import { seedRNG } from './utils';

export interface Cell {
  x: number;
  y: number;
  walls: {
    north: boolean;
    east: boolean;
    south: boolean;
    west: boolean;
  };
}

export interface Hole {
  x: number;
  y: number;
}

export interface Maze {
  size: number;
  cells: Cell[][];
  holes: Hole[];
  goal: Hole;
}

/**
 * Generate maze using recursive backtracker algorithm
 */
export function generateMaze(seed: number, size: number, holeCount: number): Maze {
  const rng = seedRNG(seed);

  // Initialize grid with all walls
  const cells: Cell[][] = [];
  for (let y = 0; y < size; y++) {
    cells[y] = [];
    for (let x = 0; x < size; x++) {
      cells[y][x] = {
        x,
        y,
        walls: { north: true, east: true, south: true, west: true },
      };
    }
  }

  // Recursive backtracker
  const stack: Cell[] = [];
  const visited = new Set<string>();

  const key = (x: number, y: number) => `${x},${y}`;

  const getNeighbors = (cell: Cell): Cell[] => {
    const neighbors: Cell[] = [];
    const { x, y } = cell;

    if (y > 0) neighbors.push(cells[y - 1][x]); // North
    if (x < size - 1) neighbors.push(cells[y][x + 1]); // East
    if (y < size - 1) neighbors.push(cells[y + 1][x]); // South
    if (x > 0) neighbors.push(cells[y][x - 1]); // West

    return neighbors;
  };

  const removeWall = (current: Cell, next: Cell) => {
    const dx = next.x - current.x;
    const dy = next.y - current.y;

    if (dx === 1) {
      current.walls.east = false;
      next.walls.west = false;
    } else if (dx === -1) {
      current.walls.west = false;
      next.walls.east = false;
    } else if (dy === 1) {
      current.walls.south = false;
      next.walls.north = false;
    } else if (dy === -1) {
      current.walls.north = false;
      next.walls.south = false;
    }
  };

  // Start at top-left
  const start = cells[0][0];
  stack.push(start);
  visited.add(key(start.x, start.y));

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getNeighbors(current).filter(
      (n) => !visited.has(key(n.x, n.y))
    );

    if (neighbors.length > 0) {
      const next = neighbors[rng.nextInt(neighbors.length)];
      removeWall(current, next);
      visited.add(key(next.x, next.y));
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  // Generate holes (avoid start and goal cells)
  const holes: Hole[] = [];
  const usedPositions = new Set<string>();
  usedPositions.add(key(0, 0)); // Start
  usedPositions.add(key(size - 1, size - 1)); // Goal

  while (holes.length < holeCount) {
    const x = rng.nextInt(size);
    const y = rng.nextInt(size);
    const pos = key(x, y);

    if (!usedPositions.has(pos)) {
      holes.push({ x, y });
      usedPositions.add(pos);
    }
  }

  // Goal hole at bottom-right
  const goal: Hole = { x: size - 1, y: size - 1 };

  return { size, cells, holes, goal };
}
