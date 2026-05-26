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
    // Initial position and movement
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
      Math.PI * 2,
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
      Math.PI * 2,
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
      Math.PI * 2,
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
// Game objects and state variables
let player = new Player();
let platforms = [];
let genericObjects = [];
let hills = [];
let coins = [];

// Keyboard input tracking
const Keys = {
  right: { pressed: false },
  left: { pressed: false },
};

// Variables for procedural generation and scoring
let nextPlatformX = 0;
let nextHillX = 0;
let score = 0;
let highScore = localStorage.getItem("endlessHighScore") || 0;

// Spawn a new random platform and coins
function spawnRandomPlatform() {
  // Randomize platform size and position
  const width = Math.random() * 250 + 150; // Width between 150px and 400px
  const height = 200;
  const y = Math.random() * 130 + 360; // Heights varying safely between 360px and 490px

  platforms.push(new Platform({ x: nextPlatformX, y, width, height }));

  // Spawn 0-3 coins above the platform
  const coinCount = Math.floor(Math.random() * 4); // 0 to 3 coins
  for (let i = 0; i < coinCount; i++) {
    const coinX = nextPlatformX + (width / (coinCount + 1)) * (i + 1);
    const coinY = y - 35; // Suspended slightly above grass level
    coins.push(new Coin({ x: coinX, y: coinY }));
  }

  // Move next platform further right
  const gap = Math.random() * 100 + 100; // Gap between 100px and 200px
  nextPlatformX += width + gap;
}

// Spawn a new random hill for background
function spawnRandomHill() {
  const radius = Math.random() * 150 + 150; // Random sizes
  hills.push(new Hill({ x: nextHillX, y: 576, radius }));

  // Move next hill further right
  const separation = Math.random() * 300 + 400;
  nextHillX += separation;
}

// Reset game state to start or restart
function init() {
  player = new Player();
  score = 0;

  // Create starting platform
  platforms = [new Platform({ x: -100, y: 470, width: 700, height: 125 })];

  // Place initial coins
  coins = [new Coin({ x: 300, y: 420 }), new Coin({ x: 450, y: 420 })];

  // Place initial hills
  hills = [
    new Hill({ x: 200, y: 576, radius: 200 }),
    new Hill({ x: 700, y: 576, radius: 250 }),
  ];

  // Add background image
  genericObjects = [
    new GenericObject({ x: -1, y: -1, image: backgroundImage }),
  ];

  // Set initial positions for procedural generation
  nextPlatformX = 600 + Math.random() * 100 + 100;
  nextHillX = 1100;
}

// Main game loop
function animate() {
  requestAnimationFrame(animate);

  // Clear screen
  c.fillStyle = "white";
  c.fillRect(0, 0, canvas.width, canvas.height);

  // 1. Draw background, hills, platforms
  genericObjects.forEach((genericObject) => genericObject.draw());
  hills.forEach((hill) => hill.draw());
  platforms.forEach((platform) => platform.draw());

  // 2. Draw and check for coin collection
  coins.forEach((coin, index) => {
    coin.draw();

    // Check collision with player
    const distX = Math.abs(
      coin.position.x - (player.position.x + player.width / 2),
    );
    const distY = Math.abs(
      coin.position.y - (player.position.y + player.height / 2),
    );

    if (
      distX < player.width / 2 + coin.radius &&
      distY < player.height / 2 + coin.radius
    ) {
      coins.splice(index, 1);
      score += 1;
      // Update high score if needed
      if (score > highScore) {
        highScore = score;
        localStorage.setItem("endlessHighScore", highScore);
      }
    }
  });

  // Update player position
  player.update();

  // 3. Draw HUD (score and high score)
  c.fillStyle = "black";
  c.font = "bold 22px Arial";
  c.textAlign = "left";
  c.fillText(`Coins: ${score}`, 25, 45);
  c.fillStyle = "#555";
  c.fillText(`Best: ${highScore}`, 25, 75);

  // 4. Generate new platforms/hills as needed
  while (nextPlatformX < canvas.width + 500) {
    spawnRandomPlatform();
  }
  while (nextHillX < canvas.width + 500) {
    spawnRandomHill();
  }

  // 5. Remove off-screen objects to save memory
  platforms = platforms.filter((p) => p.position.x + p.width > -200);
  coins = coins.filter((c) => c.position.x + c.radius > -100);
  hills = hills.filter((h) => h.position.x + h.radius > -400);

  // 6. Handle player movement and world scrolling
  if (Keys.right.pressed && player.position.x < 400) {
    player.velocity.x = player.speed;
  } else if (Keys.left.pressed && player.position.x > 100) {
    player.velocity.x = -player.speed;
  } else {
    player.velocity.x = 0;

    // Scroll world left/right if player at edge
    if (Keys.right.pressed) {
      platforms.forEach((p) => (p.position.x -= player.speed));
      coins.forEach((c) => (c.position.x -= player.speed));
      hills.forEach((h) => (h.position.x -= player.speed * 0.5)); // Parallax
      genericObjects.forEach((obj) => (obj.position.x -= player.speed * 0.1)); // Slow Sky

      nextPlatformX -= player.speed;
      nextHillX -= player.speed * 0.5;
    } else if (Keys.left.pressed) {
      // Move world right if going left
      platforms.forEach((p) => (p.position.x += player.speed));
      coins.forEach((c) => (c.position.x += player.speed));
      hills.forEach((h) => (h.position.x += player.speed * 0.5));
      genericObjects.forEach((obj) => (obj.position.x += player.speed * 0.1));

      nextPlatformX += player.speed;
      nextHillX += player.speed * 0.5;
    }
  }

  // 7. Collision detection with platforms (landing)
  platforms.forEach((platform) => {
    if (
      player.position.y + player.height <= platform.position.y &&
      player.position.y + player.height + player.velocity.y >=
        platform.position.y &&
      player.position.x + player.width >= platform.position.x &&
      player.position.x <= platform.position.x + platform.width
    ) {
      player.velocity.y = 0;
    }
  });

  // 8. Reset game if player falls off screen
  if (player.position.y > canvas.height) {
    init();
  }
}

// --- CONTROLS ---
// Keyboard controls for movement and jumping
addEventListener("keydown", ({ keyCode }) => {
  switch (keyCode) {
    case 65: // A - move left
      Keys.left.pressed = true;
      break;
    case 68: // D - move right
      Keys.right.pressed = true;
      break;
    case 87: // W - jump
      if (player.velocity.y === 0) {
        player.velocity.y = -12;
      }
      break;
  }
});

addEventListener("keyup", ({ keyCode }) => {
  switch (keyCode) {
    case 65: // A - stop left
      Keys.left.pressed = false;
      break;
    case 68: // D - stop right
      Keys.right.pressed = false;
      break;
  }
});
