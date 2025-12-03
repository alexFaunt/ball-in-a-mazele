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
  x: number; // Cell x coordinate
  y: number; // Cell y coordinate
  offsetX?: number; // Random offset from center (-0.3 to 0.3)
  offsetY?: number; // Random offset from center (-0.3 to 0.3)
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

  const isAdjacentWithoutWall = (x1: number, y1: number, x2: number, y2: number): boolean => {
    // Check if cells are adjacent (horizontally or vertically)
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);

    if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) {
      return false; // Not adjacent
    }

    // Check if there's a wall between them
    if (x2 === x1 + 1) {
      // x2 is to the east of x1
      return !cells[y1][x1].walls.east;
    } else if (x2 === x1 - 1) {
      // x2 is to the west of x1
      return !cells[y1][x1].walls.west;
    } else if (y2 === y1 + 1) {
      // y2 is to the south of y1
      return !cells[y1][x1].walls.south;
    } else if (y2 === y1 - 1) {
      // y2 is to the north of y1
      return !cells[y1][x1].walls.north;
    }

    return false;
  };

  while (holes.length < holeCount) {
    const x = rng.nextInt(size);
    const y = rng.nextInt(size);
    const pos = key(x, y);

    if (usedPositions.has(pos)) continue;

    // Check if adjacent to any existing hole without a wall between
    let hasAdjacentHole = false;
    for (const hole of holes) {
      if (isAdjacentWithoutWall(x, y, hole.x, hole.y)) {
        hasAdjacentHole = true;
        break;
      }
    }

    if (!hasAdjacentHole) {
      // Random offset from center (max 0.3 in each direction to avoid walls)
      const offsetX = rng.nextFloat(-0.3, 0.3);
      const offsetY = rng.nextFloat(-0.3, 0.3);

      holes.push({ x, y, offsetX, offsetY });
      usedPositions.add(pos);
    }
  }

  // Goal hole at bottom-right (centered, no offset)
  const goal: Hole = { x: size - 1, y: size - 1 };

  return { size, cells, holes, goal };
}
