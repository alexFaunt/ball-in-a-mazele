import * as THREE from 'three';
import { Maze } from './maze';
import { Ball, Config, InputState } from './physics';

interface RenderConfig extends Config {
  WALL_COLOR: string;
  BG_COLOR: string;
  HOLE_COLOR: string;
  GOAL_COLOR: string;
  BALL_COLOR: string;
}

export class Renderer3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private ballMesh: THREE.Mesh;
  private wallMeshes: THREE.Mesh[] = [];
  private holeMeshes: THREE.Mesh[] = [];
  private goalMesh: THREE.Mesh;
  private basePlane: THREE.Mesh;
  private mazeGroup: THREE.Group;

  constructor(private canvas: HTMLCanvasElement, private cellSize: number) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1a1a1a');

    // Camera
    const aspect = canvas.width / canvas.height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 400, 400);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Group to hold maze (for tilting)
    this.mazeGroup = new THREE.Group();
    this.scene.add(this.mazeGroup);

    // Initialize placeholders
    this.ballMesh = new THREE.Mesh();
    this.goalMesh = new THREE.Mesh();
    this.basePlane = new THREE.Mesh();
  }

  initialize(maze: Maze, config: RenderConfig) {
    // Clear existing meshes
    this.wallMeshes.forEach(m => this.mazeGroup.remove(m));
    this.holeMeshes.forEach(m => this.mazeGroup.remove(m));
    this.wallMeshes = [];
    this.holeMeshes = [];

    const mazeSize = maze.size * this.cellSize;

    // Base plane
    const planeGeometry = new THREE.PlaneGeometry(mazeSize, mazeSize);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: config.BG_COLOR,
      side: THREE.DoubleSide
    });
    this.basePlane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.basePlane.rotation.x = -Math.PI / 2;
    this.basePlane.position.set(mazeSize / 2, 0, mazeSize / 2);
    this.mazeGroup.add(this.basePlane);

    // Create walls
    const wallHeight = 20;
    const wallThickness = 3;
    const wallMaterial = new THREE.MeshStandardMaterial({ color: config.WALL_COLOR });

    for (let y = 0; y < maze.size; y++) {
      for (let x = 0; x < maze.size; x++) {
        const cell = maze.cells[y][x];
        const cellX = x * this.cellSize;
        const cellZ = y * this.cellSize;

        // North wall
        if (cell.walls.north) {
          const geometry = new THREE.BoxGeometry(this.cellSize, wallHeight, wallThickness);
          const wall = new THREE.Mesh(geometry, wallMaterial);
          wall.position.set(cellX + this.cellSize / 2, wallHeight / 2, cellZ);
          this.mazeGroup.add(wall);
          this.wallMeshes.push(wall);
        }

        // South wall
        if (cell.walls.south) {
          const geometry = new THREE.BoxGeometry(this.cellSize, wallHeight, wallThickness);
          const wall = new THREE.Mesh(geometry, wallMaterial);
          wall.position.set(cellX + this.cellSize / 2, wallHeight / 2, cellZ + this.cellSize);
          this.mazeGroup.add(wall);
          this.wallMeshes.push(wall);
        }

        // West wall
        if (cell.walls.west) {
          const geometry = new THREE.BoxGeometry(wallThickness, wallHeight, this.cellSize);
          const wall = new THREE.Mesh(geometry, wallMaterial);
          wall.position.set(cellX, wallHeight / 2, cellZ + this.cellSize / 2);
          this.mazeGroup.add(wall);
          this.wallMeshes.push(wall);
        }

        // East wall
        if (cell.walls.east) {
          const geometry = new THREE.BoxGeometry(wallThickness, wallHeight, this.cellSize);
          const wall = new THREE.Mesh(geometry, wallMaterial);
          wall.position.set(cellX + this.cellSize, wallHeight / 2, cellZ + this.cellSize / 2);
          this.mazeGroup.add(wall);
          this.wallMeshes.push(wall);
        }
      }
    }

    // Create holes
    const holeRadius = this.cellSize * config.HOLE_RADIUS_RATIO;
    const holeMaterial = new THREE.MeshStandardMaterial({ color: config.HOLE_COLOR });

    for (const hole of maze.holes) {
      const holeX = (hole.x + 0.5 + (hole.offsetX || 0)) * this.cellSize;
      const holeZ = (hole.y + 0.5 + (hole.offsetY || 0)) * this.cellSize;

      const geometry = new THREE.CylinderGeometry(holeRadius, holeRadius, 2, 32);
      const holeMesh = new THREE.Mesh(geometry, holeMaterial);
      holeMesh.position.set(holeX, -1, holeZ);
      this.mazeGroup.add(holeMesh);
      this.holeMeshes.push(holeMesh);
    }

    // Create goal
    const goalRadius = this.cellSize * config.GOAL_RADIUS_RATIO;
    const goalMaterial = new THREE.MeshStandardMaterial({ color: config.GOAL_COLOR });
    const goalGeometry = new THREE.CylinderGeometry(goalRadius, goalRadius, 2, 32);
    this.goalMesh = new THREE.Mesh(goalGeometry, goalMaterial);
    const goalX = (maze.goal.x + 0.5) * this.cellSize;
    const goalZ = (maze.goal.y + 0.5) * this.cellSize;
    this.goalMesh.position.set(goalX, -1, goalZ);
    this.mazeGroup.add(this.goalMesh);

    // Create ball
    const ballRadius = this.cellSize * config.BALL_RADIUS_RATIO;
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: config.BALL_COLOR });
    this.ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    this.mazeGroup.add(this.ballMesh);

    // Center camera on maze
    this.camera.position.set(mazeSize / 2, 400, mazeSize / 2 + 300);
    this.camera.lookAt(mazeSize / 2, 0, mazeSize / 2);
  }

  render(ball: Ball, input: InputState) {
    // Update ball position
    const ballRadius = this.ballMesh.geometry.parameters.radius;
    this.ballMesh.position.set(ball.x, ballRadius, ball.y);

    // Apply tilt to maze group
    const maxTilt = 0.15; // radians (~8.6 degrees)
    this.mazeGroup.rotation.x = input.tiltY * maxTilt;
    this.mazeGroup.rotation.z = -input.tiltX * maxTilt;

    this.renderer.render(this.scene, this.camera);
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    this.renderer.dispose();
  }
}
