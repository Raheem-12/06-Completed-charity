const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let playerX = 40;
let playerY = canvas.height - 40;
let playerVY = 0;
let isJumping = false;
const gravity = 0.6;
const jumpPower = -14;
const playerRadius = 24;
let gameRunning = false;

let drops = [];
let obstacles = [];
const dropRadius = 16;
const obstacleRadius = 20;

// Hippo obstacle properties
const hippo = {
  x: canvas.width / 2,
  y: canvas.height - 40,
  width: 60,
  height: 32,
  active: true
};

let score = 0;
const waterFacts = [
  "1 in 10 people lack access to clean water.",
  "Women and girls spend 200 million hours every day collecting water.",
  "Access to clean water can improve health and education.",
  "Every $1 invested in clean water can yield $4–$12 in economic returns."
];

// Spawn drops at random intervals
function spawnDrop() {
  if (!gameRunning) return;
  let x;
  let safe = false;
  let attempts = 0;
  while (!safe && attempts < 10) {
    x = Math.random() * (canvas.width - dropRadius * 2) + dropRadius;
    // Ensure no obstacle is within 80px horizontally
    safe = obstacles.every(obs => Math.abs(obs.x - x) > dropRadius + obstacleRadius + 40);
    attempts++;
  }
  drops.push({ x, y: -dropRadius });
  setTimeout(spawnDrop, 1200 + Math.random() * 600);
}

// Spawn obstacles at random intervals (falling obstacles)
function spawnObstacle() {
  if (!gameRunning) return;
  let x;
  // Try to spawn obstacle far from the last drop
  let safe = false;
  let attempts = 0;
  while (!safe && attempts < 10) {
    x = Math.random() * (canvas.width - obstacleRadius * 2) + obstacleRadius;
    // Ensure no drop is within 80px horizontally
    safe = drops.every(drop => Math.abs(drop.x - x) > dropRadius + obstacleRadius + 40);
    attempts++;
  }
  obstacles.push({ x, y: -obstacleRadius });
  setTimeout(spawnObstacle, 3000 + Math.random() * 1000); // slower spawn
}

// Draw drops
function drawDrops() {
  ctx.fillStyle = "#00bcd4";
  drops.forEach(drop => {
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, dropRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Draw obstacles (falling)
function drawObstacles() {
  ctx.fillStyle = "#ff7043";
  obstacles.forEach(obs => {
    ctx.beginPath();
    ctx.arc(obs.x, obs.y, obstacleRadius, 0, Math.PI * 2);
    ctx.fill();
    // Draw a red square for extra challenge
    ctx.fillStyle = "#d32f2f";
    ctx.fillRect(obs.x - 10, obs.y - 10, 20, 20);
    ctx.fillStyle = "#ff7043";
  });
}

// Draw hippo obstacle on ground
function drawHippo() {
  if (!hippo.active) return;
  ctx.save();
  ctx.fillStyle = "#795548";
  ctx.fillRect(hippo.x - hippo.width / 2, hippo.y, hippo.width, hippo.height);
  // Simple face
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(hippo.x - 15, hippo.y + 10, 6, 0, Math.PI * 2);
  ctx.arc(hippo.x + 15, hippo.y + 10, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Collision detection
function checkCollisions() {
  // Drops
  drops = drops.filter(drop => {
    const dx = drop.x - playerX;
    const dy = drop.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < dropRadius + playerRadius) {
      score++;
      document.getElementById('score').textContent = "Score: " + score;
      showScoreFeedback("+1");
      if (score === 5 || score === 10) {
        document.getElementById('fact-box').textContent = waterFacts[Math.floor(Math.random()*waterFacts.length)];
      }
      return false;
    }
    return drop.y < canvas.height + dropRadius;
  });
  // Falling obstacles
  obstacles = obstacles.filter(obs => {
    const dx = obs.x - playerX;
    const dy = obs.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < obstacleRadius + playerRadius) {
      score = Math.max(0, score - 1);
      document.getElementById('score').textContent = "Score: " + score;
      showScoreFeedback("-1", "#ff7043");
      return false;
    }
    return obs.y < canvas.height + obstacleRadius;
  });
  // Hippo collision (only if player is on ground and overlapping horizontally)
  if (
    hippo.active &&
    !isJumping && // Only collide if not jumping
    playerY + playerRadius >= hippo.y && // Player at ground level
    playerX + playerRadius > hippo.x - hippo.width / 2 &&
    playerX - playerRadius < hippo.x + hippo.width / 2
  ) {
    score = Math.max(0, score - 1);
    document.getElementById('score').textContent = "Score: " + score;
    showScoreFeedback("-1", "#ff7043");
    hippo.active = false; // Only hit once per pass
    setTimeout(() => { hippo.active = true; }, 2000); // Hippo reappears after 2s
  }
}

// Move drops and obstacles
function updateDropsAndObstacles() {
  drops.forEach(drop => drop.y += 1);
  obstacles.forEach(obs => obs.y += 1);
}

// Show feedback
function showScoreFeedback(text, color="#00bcd4") {
  const feedback = document.createElement("div");
  feedback.textContent = text;
  feedback.style.position = "absolute";
  feedback.style.left = "50%";
  feedback.style.top = "60%";
  feedback.style.transform = "translate(-50%, -50%)";
  feedback.style.fontSize = "2em";
  feedback.style.color = color;
  feedback.style.fontWeight = "bold";
  feedback.style.pointerEvents = "none";
  feedback.style.transition = "opacity 0.8s";
  feedback.style.opacity = "1";
  document.getElementById('game-container').appendChild(feedback);
  setTimeout(() => { feedback.style.opacity = "0"; }, 400);
  setTimeout(() => { feedback.remove(); }, 900);
}

// Confetti effect
function showConfetti() {
  for (let i = 0; i < 80; i++) {
    const conf = document.createElement("div");
    conf.style.position = "absolute";
    conf.style.left = Math.random() * 100 + "%";
    conf.style.top = "-10px";
    conf.style.width = "8px";
    conf.style.height = "16px";
    conf.style.background = ["#00bcd4", "#ffd600", "#fff", "#0288d1"][Math.floor(Math.random()*4)];
    conf.style.opacity = "0.8";
    conf.style.borderRadius = "3px";
    conf.style.transform = `rotate(${Math.random()*360}deg)`;
    conf.style.transition = "top 1.2s linear";
    document.body.appendChild(conf);
    setTimeout(() => { conf.style.top = "90%"; }, 10);
    setTimeout(() => { conf.remove(); }, 1300);
  }
}

// Reset game
function resetGame() {
  score = 0;
  document.getElementById('score').textContent = "Score: 0";
  drops = [];
  obstacles = [];
  playerX = 40;
  playerY = canvas.height - 40;
  playerVY = 0;
  isJumping = false;
  hippo.active = true;
  document.getElementById('fact-box').textContent = "Welcome to Water Run!";
  clearCanvas();
  drawPlayer();
}

// Add Reset button logic
document.getElementById('restart-btn').addEventListener('click', () => {
  gameRunning = false;
  resetGame();
  document.getElementById('game-over').style.display = "none";
  setTimeout(() => {
    gameRunning = true;
    spawnDrop();
    spawnObstacle();
    requestAnimationFrame(gameLoop);
  }, 100);
});
document.getElementById('reset-btn').addEventListener('click', () => {
  gameRunning = false;
  resetGame();
});

// Start Game button
document.getElementById('start-btn').addEventListener('click', () => {
  if (!gameRunning) {
    gameRunning = true;
    resetGame();
    document.getElementById('game-over').style.display = "none";
    spawnDrop();
    spawnObstacle();
    requestAnimationFrame(gameLoop);
  }
});

let playerVX = 1; // normal speed
const normalSpeed = 1;
const jumpSpeed = 2.5; // faster speed while jumping

// Main game loop
function gameLoop() {
  if (!gameRunning) return;
  clearCanvas();

  // Move player left to right
  if (isJumping) {
    playerX += jumpSpeed;
  } else {
    playerX += normalSpeed;
  }
  if (playerX - playerRadius > canvas.width) {
    playerX = -playerRadius;
  }

  // Update jump physics
  if (isJumping) {
    playerVY += gravity;
    playerY += playerVY;
    if (playerY >= canvas.height - 40) {
      playerY = canvas.height - 40;
      playerVY = 0;
      isJumping = false;
    }
  }

  updateDropsAndObstacles();
  checkCollisions();
  drawDrops();
  drawObstacles();
  drawHippo();
  drawPlayer();

  // Win condition: score 3
  if (score >= 3) {
    gameRunning = false; // Stop the game loop
    document.getElementById('game-over').style.display = "block";
    document.getElementById('final-score').textContent = "Congratulations! You collected 3 clean water drops!";
    document.getElementById('encouraging-message').textContent = "Every drop counts. Learn more at charitywater.org";
    showConfetti(); // Show confetti effect
    return;
  }

  requestAnimationFrame(gameLoop);
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
  ctx.save();
  ctx.fillStyle = "#0288d1";
  ctx.beginPath();
  ctx.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Jump on spacebar or tap
document.addEventListener('keydown', function(e) {
  if ((e.code === 'Space' || e.key === ' ') && !isJumping && gameRunning) {
    isJumping = true;
    playerVY = jumpPower;
  }
});
canvas.addEventListener('touchstart', function(e) {
  if (!isJumping && gameRunning) {
    isJumping = true;
    playerVY = jumpPower;
  }
});