// ======================================================
// STRANDED – Interactive Decision Game
// ======================================================
// Uses:
// - mouse clicks for decisions
// - persistent player stats
// - branching story states
//
// DO NOT add setup() or draw()
// ======================================================

// ------------------------------
// Player stats
// ------------------------------
let player = {
  health: 100,
  trust: 0, // negative = hostile world, positive = allies
};

// ------------------------------
// Game state machine
// ------------------------------
let gameState = "intro";

// ------------------------------
// Choice buttons (reused)
// ------------------------------
const choices = [
  { x: 400, y: 420, w: 420, h: 70, label: "", action: null },
  { x: 400, y: 510, w: 420, h: 70, label: "", action: null },
];

// ------------------------------
// Main draw
// ------------------------------
function drawGame() {
  background(235, 225, 200);

  drawHUD();
  drawStory();
  drawChoices();

  cursor(choices.some((btn) => isHover(btn)) ? HAND : ARROW);
}

// ------------------------------
// HUD (stats)
// ------------------------------
function drawHUD() {
  fill(0);
  textSize(16);
  textAlign(LEFT, CENTER);

  text(`Health: ${player.health}`, 30, 40);
  text(`Trust: ${player.trust}`, 30, 65);
}

// ------------------------------
// Story text
// ------------------------------
function drawStory() {
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(28);

  let story = "";

  switch (gameState) {
    case "intro":
      story =
        "You wake up on a deserted island.\nYour ship is gone.\nYou are alone.";
      setChoices(
        "Start walking inland",
        () => (gameState = "beach"),
        "Stay near the shore",
        () => {
          player.health -= 10;
          gameState = "beach";
        },
      );
      break;

    case "beach":
      story = "You walk across the island.\nYou notice smoke in the distance.";
      setChoices(
        "Investigate the smoke",
        () => (gameState = "natives"),
        "Avoid it and hunt for food",
        () => {
          player.health += 10;
          gameState = "natives";
        },
      );
      break;

    case "natives":
      story = "You encounter a group of island natives.\nThey notice you.";
      setChoices(
        "Approach peacefully",
        () => {
          player.trust += 15;
          gameState = "interaction";
        },
        "Sneak away",
        () => {
          player.trust -= 10;
          gameState = "interaction";
        },
      );
      break;

    case "interaction":
      if (player.trust >= 10) {
        story = "The natives seem calm.\nThey wait for your next move.";
        setChoices(
          "Communicate and trade",
          () => {
            player.health += 15;
            gameState = "ending";
          },
          "Steal supplies",
          () => {
            player.trust -= 30;
            player.health -= 20;
            gameState = "ending";
          },
        );
      } else {
        story = "The natives are tense.\nWeapons are visible.";
        setChoices(
          "Run",
          () => {
            player.health -= 30;
            gameState = "ending";
          },
          "Attack first",
          () => {
            player.health -= 50;
            player.trust -= 40;
            gameState = "ending";
          },
        );
      }
      break;

    case "ending":
      drawEnding();
      return;
  }

  text(story, width / 2, 220);
}

// ------------------------------
// Endings
// ------------------------------
function drawEnding() {
  let endingText = "";

  if (player.health <= 0) {
    endingText = "You collapse from your wounds.\nYou did not survive.";
  } else if (player.trust >= 20) {
    endingText =
      "The natives help you.\nThey guide you to a rescue route.\nYou escape the island.";
  } else if (player.trust <= -20) {
    endingText =
      "You are forced into hiding.\nNo one trusts you.\nYou remain stranded.";
  } else {
    endingText = "You survive, but barely.\nThe island remains your prison.";
  }

  fill(0);
  textAlign(CENTER, CENTER);
  textSize(30);
  text(endingText, width / 2, height / 2);

  setChoices("Restart", resetGame, "", null);
}

// ------------------------------
// Choices
// ------------------------------
function drawChoices() {
  choices.forEach((btn) => {
    if (!btn.label) return;

    rectMode(CENTER);
    noStroke();
    fill(isHover(btn) ? 180 : 210);
    rect(btn.x, btn.y, btn.w, btn.h, 14);

    fill(0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text(btn.label, btn.x, btn.y);
  });
}

// ------------------------------
// Helpers
// ------------------------------
function setChoices(label1, action1, label2, action2) {
  choices[0].label = label1;
  choices[0].action = action1;

  choices[1].label = label2;
  choices[1].action = action2;
}

function resetGame() {
  player.health = 100;
  player.trust = 0;
  gameState = "intro";
}

// ------------------------------
// Input
// ------------------------------
function gameMousePressed() {
  choices.forEach((btn) => {
    if (btn.label && isHover(btn) && btn.action) {
      btn.action();
    }
  });
}

function gameKeyPressed() {
  // optional later
}
