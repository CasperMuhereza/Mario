// Get canvas and context
const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

// Set canvas size
canvas.width = 1024;
canvas.height = 576;

// Gravity constant for jumping/falling
const gravity = 0.5;

// Load background image and start game when ready
const backgroundImage = new Image();
backgroundImage.onload = () => {
  init();
  animate();
};
backgroundImage.src = "./images/background.png";

// --- CLASSES ---

// Player class for the main character
class Player {
  constructor() {
    this.position = { x: 100, y: 100 };
    this.velocity = { x: 0, y: 0 };
    this.width = 30;
    this.height = 30;
    this.speed = 8;
  }

  // Draw the player (robot)
  draw() {
    // Robot Body
    c.fillStyle = "#00BFFF";
    c.fillRect(this.position.x, this.position.y, this.width, this.height);

    // Robot Antenna
    c.strokeStyle = "#FFFFFF";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(this.position.x + this.width / 2, this.position.y);
    c.lineTo(this.position.x + this.width / 2, this.position.y - 10);
    c.stroke();

    // Antenna glowing tip
    c.fillStyle = "red";
    c.beginPath();
    c.arc(
      this.position.x + this.width / 2,
      this.position.y - 10,
      3,
      0,
      Math.PI * 2
    );
    c.fill();

    // Robot Eye
    c.fillStyle = "white";
    c.beginPath();
    c.arc(
      this.position.x + this.width / 2,
      this.position.y + 12,
      8,
      0,
      Math.PI * 2
    );
    c.fill();

    // Pupil (looks left/right when moving)
    let lookOffset = 0;
    if (this.velocity.x > 0) lookOffset = 3;
    if (this.velocity.x < 0) lookOffset = -3;

    c.fillStyle = "black";
    c.beginPath();
    c.arc(
      this.position.x + this.width / 2 + lookOffset,
      this.position.y + 12,
      4,
      0,
      Math.PI * 2
    );
    c.fill();
  }

  // Update player position and apply gravity
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Only apply gravity if above ground
    if (this.position.y + this.height + this.velocity.y <= canvas.height) {
      this.velocity.y += gravity;
    }
  }
}

// Platform class for ground and ledges
class Platform {
  constructor({ x, y, width, height }) {
    this.position = { x, y };
    this.width = width;
    this.height = height;
  }
  // Draw the platform (brown with green top)
  draw() {
    c.fillStyle = "#654321";
    c.fillRect(this.position.x, this.position.y, this.width, this.height);
    c.fillStyle = "#4CAF50";
    c.fillRect(this.position.x, this.position.y, this.width, 15);
  }
}

// Hill class for background scenery
class Hill {
  constructor({ x, y, radius }) {
    this.position = { x, y };
    this.radius = radius;
  }
  // Draw a green hill
  draw() {
    c.fillStyle = "#2E8B57";
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, Math.PI, 0, false);
    c.fill();
  }
}

// GenericObject for background images
class GenericObject {
  constructor({ x, y, image }) {
    this.position = { x, y };
    this.image = image;
  }
  draw() {
    if (this.image) {
      c.drawImage(this.image, this.position.x, this.position.y);
    }
  }
}

// Coin class for collectible coins
class Coin {
  constructor({ x, y }) {
    this.position = { x, y };
    this.radius = 12;
  }
  // Draw a gold coin with a $ sign
  draw() {
    c.fillStyle = "gold";
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = "#B8860B";
    c.lineWidth = 2;
    c.stroke();

    c.fillStyle = "#B8860B";
    c.font = "bold 14px Arial";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("$", this.position.x, this.position.y);
  }
}

// --- GAME STATE ---
// Game objects and state variables (Application Stage: Memory allocation)
let player = new Player();
let platforms = [];
let genericObjects = [];
let hills = [];
let coins = [];

// Keyboard input tracking (Application Stage: I/O Event Handling)
const Keys = {
  right: { pressed: false },
  left: { pressed: false },
};

// Variables for procedural generation and scoring
let nextPlatformX = 0;
let nextHillX = 0;
let score = 0;
let highScore = localStorage.getItem("endlessHighScore") || 0;

// --- UI OVERLAY LOGIC ---
let gameStarted = false; 
const overlay = document.getElementById("instruction-overlay");
const startButton = document.getElementById("start-btn");

// Function to hide the UI and start the game engine
function startGame() {
  if (!gameStarted) {
    gameStarted = true;
    overlay.classList.add("hidden"); 
  }
}

// Listen for mouse click on the start button
startButton.addEventListener("click", startGame);

// Spawn a new random platform and coins (Application Stage: Algorithmic Scene Generation)
function spawnRandomPlatform() {
  const width = Math.random() * 250 + 150; 
  const height = 200;
  const y = Math.random() * 130 + 360; 

  platforms.push(new Platform({ x: nextPlatformX, y, width, height }));

  const coinCount = Math.floor(Math.random() * 4); 
  for (let i = 0; i < coinCount; i++) {
    const coinX = nextPlatformX + (width / (coinCount + 1)) * (i + 1);
    const coinY = y - 35; 
    coins.push(new Coin({ x: coinX, y: coinY }));
  }

  const gap = Math.random() * 100 + 100; 
  nextPlatformX += width + gap;
}

function spawnRandomHill() {
  const radius = Math.random() * 150 + 150; 
  hills.push(new Hill({ x: nextHillX, y: 576, radius }));

  const separation = Math.random() * 300 + 400;
  nextHillX += separation;
}

function init() {
  player = new Player();
  score = 0;

  platforms = [new Platform({ x: -100, y: 470, width: 700, height: 125 })];
  coins = [new Coin({ x: 300, y: 420 }), new Coin({ x: 450, y: 420 })];
  hills = [
    new Hill({ x: 200, y: 576, radius: 200 }),
    new Hill({ x: 700, y: 576, radius: 250 }),
  ];
  genericObjects = [
    new GenericObject({ x: -1, y: -1, image: backgroundImage }),
  ];

  nextPlatformX = 600 + Math.random() * 100 + 100;
  nextHillX = 1100;
}

// Main game loop (The continuous Pipeline Driver)
function animate() {
  requestAnimationFrame(animate);

  // Freeze game logic and rendering if game hasn't started yet
  if (!gameStarted) {
    c.fillStyle = "#111";
    c.fillRect(0, 0, canvas.width, canvas.height);
    genericObjects.forEach((genericObject) => genericObject.draw());
    return; 
  }

  /* RASTERIZATION: FRAME BUFFER CLEARING
   c.fillRect takes a color and fills the entire canvas frame buffer with it,
      effectively clearing the previous frame's pixels.
        */
  c.fillStyle = "white";
  c.fillRect(0, 0, canvas.width, canvas.height);

  // 1. EXECUTE DRAW CALLS (Passes geometry representations down to the Rasterizer)
  genericObjects.forEach((genericObject) => genericObject.draw());
  hills.forEach((hill) => hill.draw());
  platforms.forEach((platform) => platform.draw());

  // 2. Draw and check for coin collection (Application Stage: AABB Collision Logic)
  coins.forEach((coin, index) => {
    coin.draw();

    const distX = Math.abs(coin.position.x - (player.position.x + player.width / 2));
    const distY = Math.abs(coin.position.y - (player.position.y + player.height / 2));

    if (distX < player.width / 2 + coin.radius && distY < player.height / 2 + coin.radius) {
      coins.splice(index, 1);
      score += 1;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem("endlessHighScore", highScore);
      }
    }
  });

  player.update();

  // 3. Draw HUD text (Rasterization: Glyph rasterization mapping)
  c.fillStyle = "black";
  c.font = "bold 22px Arial";
  c.textAlign = "left";
  c.fillText(`Coins: ${score}`, 25, 45);
  c.fillStyle = "#555";
  c.fillText(`Best: ${highScore}`, 25, 75);

  // 4. Generate data (Application Stage: Scene Graph Updates)
  while (nextPlatformX < canvas.width + 500) {
    spawnRandomPlatform();
  }
  while (nextHillX < canvas.width + 500) {
    spawnRandomHill();
  }

  /* GEOMETRY STAGE: CPU-SIDE VIEWPORT FRUSTUM CLIPPING
        Filtering out arrays of data that have completely shifted outside our 
        view matrix boundaries so we aren't wasting GPU rasterization cycles on invisible geometry.
   */
  platforms = platforms.filter((p) => p.position.x + p.width > -200);
  coins = coins.filter((c) => c.position.x + c.radius > -100);
  hills = hills.filter((h) => h.position.x + h.radius > -400);

  /* GEOMETRY STAGE: WORLD-SPACE TO VIEW-SPACE MATRIX TRANSFORMATION
        When a player moves, instead of moving the player in world space, we alter 
        the position coordinates of the world objects relative to the viewport window camera.
   */
  if (Keys.right.pressed && player.position.x < 400) {
    player.velocity.x = player.speed;
  } else if (Keys.left.pressed && player.position.x > 100) {
    player.velocity.x = -player.speed;
  } else {
    player.velocity.x = 0;

    if (Keys.right.pressed) {
      platforms.forEach((p) => (p.position.x -= player.speed));
      coins.forEach((c) => (c.position.x -= player.speed));
      hills.forEach((h) => (h.position.x -= player.speed * 0.5)); // Matrix scale factor (0.5x Parallax)
      genericObjects.forEach((obj) => (obj.position.x -= player.speed * 0.1)); 

      nextPlatformX -= player.speed;
      nextHillX -= player.speed * 0.5;
    } else if (Keys.left.pressed) {
      platforms.forEach((p) => (p.position.x += player.speed));
      coins.forEach((c) => (c.position.x += player.speed));
      hills.forEach((h) => (h.position.x += player.speed * 0.5));
      genericObjects.forEach((obj) => (obj.position.x += player.speed * 0.1));

      nextPlatformX += player.speed;
      nextHillX += player.speed * 0.5;
    }
  }

  // 7. Collision detection with platforms (Application Stage: Physics Collision Solver)
  platforms.forEach((platform) => {
    if (
      player.position.y + player.height <= platform.position.y &&
      player.position.y + player.height + player.velocity.y >= platform.position.y &&
      player.position.x + player.width >= platform.position.x &&
      player.position.x <= platform.position.x + platform.width
    ) {
      player.velocity.y = 0;
    }
  });

  // 8. Reset scene graph data structure if threshold passed
  if (player.position.y > canvas.height) {
    init();
  }
}

// --- CONTROLS ---
addEventListener("keydown", ({ keyCode }) => {
  // Start the game if spacebar (32) is pressed and the game hasn't started
  if (keyCode === 32 && !gameStarted) {
    startGame();
    return;
  }

  // Ignore actual player movements if game hasn't actively initialized execution
  if (!gameStarted) return;

  switch (keyCode) {
    case 65: // A
      Keys.left.pressed = true;
      break;
    case 68: // D
      Keys.right.pressed = true;
      break;
    case 87: // W
      if (player.velocity.y === 0) {
        player.velocity.y = -12;
      }
      break;
  }
});

addEventListener("keyup", ({ keyCode }) => {
  if (!gameStarted) return;

  switch (keyCode) {
    case 65: // A
      Keys.left.pressed = false;
      break;
    case 68: // D
      Keys.right.pressed = false;
      break;
  }
});