// ======================================================
// STRANDED — Survival Means Consequences
// ======================================================

// ------------------------------
// Player stats (0–10)
// ------------------------------
let player = {
  health: 10,
  trust: 0,
};

// ------------------------------
// Persistent consequences
// ------------------------------
let flags = {
  injured: false,
  injuryIgnoredTurns: 0,
  ranWhileInjured: 0,
  stoleFromNatives: false,
  allied: false,
};

// ------------------------------
let gameState = "instructions";
let pendingFeedback = null;

// ------------------------------
const choices = [
  { x: 400, y: 460, w: 460, h: 65, label: "", action: null },
  { x: 400, y: 540, w: 460, h: 65, label: "", action: null },
];

// ======================================================
function drawGame() {
  background(200, 235, 200);

  drawSceneBox();
  drawHUD();
  drawStory();
  drawChoices();

  cursor(choices.some((b) => isHover(b)) ? HAND : ARROW);
}

// ======================================================
function drawSceneBox() {
  rectMode(CENTER);
  noStroke();
  fill(170, 210, 170);
  rect(width / 2, 150, 520, 110, 16);

  fill(40, 80, 40);
  textAlign(CENTER, CENTER);
  textSize(24);

  let label = "🌿 Wilderness";
  if (gameState === "instructions") label = "🏝️ STRANDED";
  if (gameState === "natives") label = "🛖 Native Camp";
  if (gameState === "attack") label = "⚔️ Ambush";
  if (gameState === "ending") label = "🏁 Outcome";

  text(label, width / 2, 150);
}

// ======================================================
function drawHUD() {
  if (gameState === "instructions") return;

  fill(0);
  textAlign(LEFT, CENTER);
  textSize(22);
  text(`Health: ${player.health}`, 30, 40);
  text(`Trust: ${player.trust}`, 30, 70);
}

// ======================================================
function drawStory() {
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(26);

  let story = "";

  // ------------------------------
  // GLOBAL DELAYED DEATH CHECKS
  // ------------------------------
  if (flags.injuryIgnoredTurns >= 3) {
    player.health = 0;
    gameState = "ending";
  }

  if (flags.ranWhileInjured >= 2) {
    player.health = 0;
    gameState = "ending";
  }

  switch (gameState) {
    case "instructions":
      story =
        "STRANDED\n\nEvery decision matters.\nPoor choices will kill you.";
      setChoices("Continue", () => (gameState = "intro"), "", null);
      break;

    case "intro":
      story = "You wake on a deserted island.\nYour leg is injured.";
      setChoices(
        "Force yourself inland",
        () => {
          flags.injured = true;
          flags.injuryIgnoredTurns++;
          player.health -= 2;
          clampStats();
          queueFeedback(
            "You push through pain. Your injury worsens.",
            "jungle",
          );
        },
        "Stay still and assess",
        () => {
          flags.injured = true;
          queueFeedback("You realize your injury must be treated.", "shore");
        },
      );
      break;

    case "shore":
      story = "Wreckage lies along the shore.";
      setChoices(
        "Bandage your leg",
        () => {
          flags.injured = false;
          flags.injuryIgnoredTurns = 0;
          queueFeedback(
            "You treat your injury. You may survive longer.",
            "jungle",
          );
        },
        "Ignore injury",
        () => {
          flags.injuryIgnoredTurns++;
          player.health -= 1;
          clampStats();
          queueFeedback("Ignoring the injury drains your strength.", "jungle");
        },
      );
      break;

    case "jungle":
      story = "You hear voices ahead.";
      setChoices(
        "Approach carefully",
        () => (gameState = "natives"),
        "Run",
        () => (gameState = "run"),
      );
      break;

    case "run":
      if (flags.injured) flags.ranWhileInjured++;
      player.health -= flags.injured ? 3 : 1;
      clampStats();
      queueFeedback(
        "Running blindly exhausts you.",
        player.health <= 0 ? "ending" : "camp",
      );
      break;

    case "natives":
      story = "The natives surround you.";
      setChoices(
        "Greet peacefully",
        () => {
          player.trust += 2;
          clampStats();
          queueFeedback("Your calm behavior earns slight trust.", "dialogue");
        },
        "Steal supplies",
        () => {
          flags.stoleFromNatives = true;
          player.trust -= 4;
          clampStats();
          queueFeedback(
            "You steal from them. This will not be forgiven.",
            "attack",
          );
        },
      );
      break;

    case "dialogue":
      if (player.trust <= -5) {
        player.health = 0;
        gameState = "ending";
        break;
      }

      story = "The natives judge your intentions.";
      setChoices(
        "Accept their help",
        () => {
          flags.allied = true;
          player.trust += 2;
          clampStats();
          queueFeedback("They agree to help you escape.", "ending");
        },
        "Demand assistance",
        () => {
          player.trust -= 3;
          clampStats();
          queueFeedback("Your aggression seals your fate.", "attack");
        },
      );
      break;

    case "attack":
      // ATTACK IS FREQUENTLY FATAL
      if (player.health <= 5 || player.trust <= -3) {
        player.health = 0;
        gameState = "ending";
        break;
      }

      player.health -= 4;
      clampStats();
      queueFeedback("You are attacked and barely escape.", "camp");
      break;

    case "camp":
      story = "Night falls. You are weak.";
      setChoices(
        "Rest",
        () => {
          player.health += 1;
          clampStats();
          queueFeedback("You survive the night.", "ending");
        },
        "Keep moving",
        () => {
          player.health -= 2;
          clampStats();
          queueFeedback("You collapse from exhaustion.", "ending");
        },
      );
      break;

    case "feedback":
      story = pendingFeedback.text;
      setChoices(
        "Continue",
        () => {
          gameState = pendingFeedback.nextState;
          pendingFeedback = null;
        },
        "",
        null,
      );
      break;

    case "ending":
      drawEnding();
      return;
  }

  text(story, width / 2, 300);
}

// ======================================================
function drawEnding() {
  const dead =
    player.health <= 0 ||
    player.trust <= -5 ||
    flags.injuryIgnoredTurns >= 3 ||
    flags.ranWhileInjured >= 2;

  textAlign(CENTER, CENTER);
  textSize(30);
  textStyle(BOLD);

  if (dead) {
    fill(160, 0, 0);
    text(
      "Your decisions lead to your death.\nThe island claims you.",
      width / 2,
      height / 2 - 60,
    );
  } else if (flags.allied) {
    fill(20, 100, 40);
    text(
      "With the natives’ help,\nyou escape the island.",
      width / 2,
      height / 2 - 60,
    );
  } else {
    fill(0);
    text(
      "You survive… for now.\nBut the danger remains.",
      width / 2,
      height / 2 - 60,
    );
  }

  setChoices("Restart", resetGame, "", null);
  choices[0].y = height - 90;
}

// ======================================================
function drawChoices() {
  choices.forEach((btn) => {
    if (!btn.label) return;
    rectMode(CENTER);
    noStroke();
    fill(isHover(btn) ? 160 : 210);
    rect(btn.x, btn.y, btn.w, btn.h, 14);
    fill(0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text(btn.label, btn.x, btn.y);
  });
}

// ======================================================
function queueFeedback(text, nextState) {
  pendingFeedback = { text, nextState };
  gameState = "feedback";
}

function setChoices(l1, a1, l2, a2) {
  choices[0].label = l1;
  choices[0].action = a1;
  choices[1].label = l2;
  choices[1].action = a2;
}

function clampStats() {
  player.health = constrain(player.health, 0, 10);
  player.trust = constrain(player.trust, -10, 10);
}

function resetGame() {
  player.health = 10;
  player.trust = 0;
  flags = {
    injured: false,
    injuryIgnoredTurns: 0,
    ranWhileInjured: 0,
    stoleFromNatives: false,
    allied: false,
  };
  pendingFeedback = null;
  gameState = "instructions";
}

// ======================================================
function gameMousePressed() {
  choices.forEach((btn) => {
    if (btn.label && btn.action && isHover(btn)) btn.action();
  });
}

function gameKeyPressed() {}
