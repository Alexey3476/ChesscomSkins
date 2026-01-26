
const PIECES = [
  "wk","wq","wr","wb","wn","wp",
  "bk","bq","br","bb","bn","bp"
];

const SKIN_DEFINITIONS = {
  "set2": {
    type: "image",
    path: "assets/Set2"
  },
  "none": {
    type: "none"
  }
};

const EFFECT_DEFINITIONS = {
  "native-ember": {
    type: "filter",
    filter: "hue-rotate(-18deg) saturate(1.4) brightness(1.05)",
    ringColor: "rgba(255,120,60,0.9)",
    ringColorSoft: "rgba(255,120,60,0.35)",
    ringGlow: "drop-shadow(0 0 18px rgba(255,120,60,0.65))"
  },
  "native-frost": {
    type: "filter",
    filter: "hue-rotate(190deg) saturate(1.35) brightness(1.1)",
    ringColor: "rgba(110,190,255,0.9)",
    ringColorSoft: "rgba(110,190,255,0.35)",
    ringGlow: "drop-shadow(0 0 18px rgba(110,190,255,0.65))"
  },
  "native-neon": {
    type: "filter",
    filter: "hue-rotate(280deg) saturate(1.6) brightness(1.1)",
    ringColor: "rgba(210,120,255,0.9)",
    ringColorSoft: "rgba(210,120,255,0.35)",
    ringGlow: "drop-shadow(0 0 18px rgba(210,120,255,0.7))"
  },
  "legendary-ember": {
    type: "filter",
    filter: "saturate(1.1) brightness(1.02)",
    ringColor: "rgba(255,130,70,0.95)",
    ringColorSoft: "rgba(255,130,70,0.45)",
    ringGlow: "drop-shadow(0 0 22px rgba(255,120,60,0.75))",
    ringColorOverrides: {
      wk: {
        ringColor: "rgba(255,210,120,0.95)",
        ringColorSoft: "rgba(255,210,120,0.45)",
        ringGlow: "drop-shadow(0 0 22px rgba(255,210,120,0.75))"
      },
      wq: {
        ringColor: "rgba(255,160,80,0.95)",
        ringColorSoft: "rgba(255,160,80,0.45)",
        ringGlow: "drop-shadow(0 0 22px rgba(255,160,80,0.75))"
      },
      bk: {
        ringColor: "rgba(120,180,255,0.95)",
        ringColorSoft: "rgba(120,180,255,0.45)",
        ringGlow: "drop-shadow(0 0 22px rgba(120,180,255,0.75))"
      },
      bq: {
        ringColor: "rgba(150,120,255,0.95)",
        ringColorSoft: "rgba(150,120,255,0.45)",
        ringGlow: "drop-shadow(0 0 22px rgba(150,120,255,0.75))"
      }
    }
  },
  "minimal": {
    type: "filter",
    filter: "saturate(1.02)",
    ringColor: "rgba(255,255,255,0.9)",
    ringColorSoft: "rgba(255,255,255,0.25)",
    ringOpacity: 0.7,
    ringInset: "-8%",
    ringAnimation: "ringSoft 2.6s ease-in-out infinite",
    ringGlow: "drop-shadow(0 0 12px rgba(255,255,255,0.45))"
  },
  "none": {
    type: "none"
  }
};

let skinStyleTag = null;
let effectStyleTag = null;
let lastAppliedSkin = null;
let lastAppliedEffect = null;
let lastAppliedTarget = null;
let overlayStyleTag = null;
let skinsEnabled = false;
let activeSkinPath = null;
let capturedObserver = null;

function applySkin(skinName, skinPath) {
  if (lastAppliedSkin === skinName && activeSkinPath === skinPath) return;
  lastAppliedSkin = skinName;

  if (skinStyleTag) skinStyleTag.remove();
  if (!skinName || skinName === "none") {
    activeSkinPath = null;
    return;
  }

  skinStyleTag = document.createElement("style");
  const definition = SKIN_DEFINITIONS[skinName];
  if ((!definition || definition.type === "none") && !skinPath) return;

  let css = "";
  const resolvedPath = skinPath || definition.path;
  if (resolvedPath) {
    activeSkinPath = resolvedPath;
    PIECES.forEach(piece => {
      const url = chrome.runtime.getURL(`${resolvedPath}/${piece}.png`);
      css += `
        .piece.${piece},
        .promotion-piece.${piece},
        .captured-pieces .piece.${piece},
        .captured-piece.${piece},
        .captured-piece .piece.${piece},
        .captured .piece.${piece},
        [class*="captured"] .piece.${piece},
        .captured-pieces [data-piece="${piece}"],
        .captured-pieces [class*="piece"][data-piece="${piece}"],
        [class*="captured"] [data-piece="${piece}"],
        .captured-piece[data-piece="${piece}"] {
          background-image: url("${url}") !important;
          background-size: contain !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
        }
      `;
    });
  }

  skinStyleTag.textContent = css;
  document.head.appendChild(skinStyleTag);
  updateCapturedImages();
  ensureCapturedObserver();
}

function ensureCapturedObserver() {
  if (capturedObserver) return;
  capturedObserver = new MutationObserver(() => updateCapturedImages());
  capturedObserver.observe(document.body, { childList: true, subtree: true });
}

function updateCapturedImages() {
  if (!activeSkinPath) return;
  const elements = document.querySelectorAll(
    ".captured-pieces [data-piece], [class*=\"captured\"] [data-piece], .captured-pieces .piece, [class*=\"captured\"] .piece"
  );
  elements.forEach((el) => {
    let piece = el.dataset?.piece;
    if (!piece) {
      const classMatch = PIECES.find((code) => el.classList.contains(code));
      piece = classMatch || null;
    }
    if (!piece) return;
    const url = chrome.runtime.getURL(`${activeSkinPath}/${piece}.png`);
    if (el.tagName === "IMG") {
      if (el.src !== url) el.src = url;
    } else {
      el.style.backgroundImage = `url("${url}")`;
      el.style.backgroundSize = "contain";
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundPosition = "center";
    }
  });
}

function applyEffect(effectName, targetName) {
  if (lastAppliedEffect === effectName && lastAppliedTarget === targetName) return;
  lastAppliedEffect = effectName;
  lastAppliedTarget = targetName;

  if (effectStyleTag) effectStyleTag.remove();
  if (!effectName || effectName === "none") return;

  effectStyleTag = document.createElement("style");
  const definition = EFFECT_DEFINITIONS[effectName];
  if (!definition || definition.type === "none") return;

  const ringAnimation = definition.ringAnimation || "glowBreath 3.4s ease-in-out infinite";
  const shimmerAnimation = definition.shimmerAnimation || "glowShimmer 4.2s ease-in-out infinite";

  const glowTargets = targetName === "royal"
    ? [".piece.wk", ".piece.wq", ".piece.bk", ".piece.bq"]
    : [".piece", ".promotion-piece"];
  const glowTargetSelector = glowTargets.join(", ");
  const glowTargetSelected = glowTargets.map((target) => `.selected ${target}`).join(", ");
  const glowTargetSelectedSelf = glowTargets.map((target) => `${target}.selected`).join(", ");
  const glowTargetLastMove = glowTargets.map((target) => `.last-move ${target}`).join(", ");
  const glowTargetMove = glowTargets.map((target) => `.move ${target}`).join(", ");
  const glowTargetHint = glowTargets.map((target) => `.hint ${target}`).join(", ");
  const glowTargetHighlight = glowTargets.map((target) => `.highlight ${target}`).join(", ");
  const glowTargetCheck = glowTargets.map((target) => `.check ${target}`).join(", ");
  const glowTargetCheckmate = glowTargets.map((target) => `.checkmate ${target}`).join(", ");
  const glowTargetMate = glowTargets.map((target) => `.mate ${target}`).join(", ");
  const glowTargetCapture = glowTargets.map((target) => `.capture ${target}`).join(", ");

  let css = `
    .piece,
    .promotion-piece {
      position: relative;
      filter: var(--piece-filter, none);
    }

    .piece::after,
    .promotion-piece::after {
      content: "";
      position: absolute;
      inset: var(--ring-inset, -16%);
      border-radius: 50%;
      pointer-events: none;
      opacity: 0;
      transform: scale(0.9);
      background: radial-gradient(circle,
        var(--ring-color, rgba(255,120,60,0.9)) 0%,
        var(--ring-color-soft, rgba(255,120,60,0.35)) 45%,
        rgba(0,0,0,0) 70%);
      filter: var(--ring-glow, drop-shadow(0 0 18px rgba(255,120,60,0.7)));
      transition: opacity 0.2s ease;
    }

    ${glowTargetSelector} {
      filter: var(--piece-filter, none);
    }

    ${glowTargetSelected},
    ${glowTargetSelectedSelf},
    ${glowTargetLastMove},
    ${glowTargetMove},
    ${glowTargetHint},
    ${glowTargetHighlight},
    ${glowTargetCheck},
    ${glowTargetCheckmate},
    ${glowTargetMate},
    ${glowTargetCapture} {
      will-change: transform, opacity;
    }

    .captured .piece,
    .captured-piece,
    .captured-pieces .piece,
    [class*="captured"] .piece {
      filter: var(--piece-filter, none) !important;
    }

    .captured .piece::after,
    .captured-piece::after,
    .captured-pieces .piece::after,
    [class*="captured"] .piece::after {
      animation: none !important;
      opacity: 0 !important;
    }

    @keyframes glowBreath {
      0% {
        opacity: 0.35;
        transform: scale(0.96);
      }
      60% {
        opacity: 0.95;
        transform: scale(1.08);
      }
      100% {
        opacity: 0.45;
        transform: scale(1.01);
      }
    }

    @keyframes glowShimmer {
      0% {
        opacity: 0.55;
      }
      50% {
        opacity: 1;
      }
      100% {
        opacity: 0.65;
      }
    }

    @keyframes ringSoft {
      0% {
        opacity: 0.45;
        transform: scale(0.98);
      }
      100% {
        opacity: 0.75;
        transform: scale(1.04);
      }
    }

    @keyframes fireworks {
      0% {
        transform: scale(0.96);
        opacity: 0.55;
      }
      40% {
        transform: scale(1.08);
        opacity: 1;
      }
      100% {
        transform: scale(1.02);
        opacity: 0.7;
      }
    }

    @keyframes checkPulse {
      0% {
        transform: scale(0.98);
        opacity: 0.7;
      }
      50% {
        transform: scale(1.08);
        opacity: 1;
      }
      100% {
        transform: scale(1);
        opacity: 0.8;
      }
    }

    @keyframes mateFlare {
      0% {
        transform: scale(0.92) rotate(0deg);
        opacity: 0.7;
      }
      50% {
        transform: scale(1.15) rotate(6deg);
        opacity: 1;
      }
      100% {
        transform: scale(1) rotate(0deg);
        opacity: 0.85;
      }
    }

    @keyframes captureBurst {
      0% {
        transform: scale(0.6);
        opacity: 0;
      }
      40% {
        transform: scale(1.05);
        opacity: 1;
      }
      100% {
        transform: scale(1.2);
        opacity: 0;
      }
    }

    @keyframes queenCapture {
      0% {
        transform: scale(1);
        opacity: 0.6;
      }
      50% {
        transform: scale(1.08);
        opacity: 1;
      }
      100% {
        transform: scale(1);
        opacity: 0.7;
      }
    }
  `;

  if (definition.type === "filter") {
    css += `
      .piece,
      .promotion-piece {
        --piece-filter: ${definition.filter};
        --ring-color: ${definition.ringColor};
        --ring-color-soft: ${definition.ringColorSoft || definition.ringColor};
        --ring-glow: ${definition.ringGlow || "drop-shadow(0 0 18px rgba(255,120,60,0.7))"};
        --ring-inset: ${definition.ringInset || "-16%"};
        --ring-opacity: ${definition.ringOpacity || 0.85};
      }
    `;

    if (definition.ringColorOverrides) {
      Object.entries(definition.ringColorOverrides).forEach(([piece, color]) => {
        if (typeof color === "string") {
          css += `
            .piece.${piece},
            .promotion-piece.${piece} {
              --ring-color: ${color};
              --ring-color-soft: ${color};
            }
          `;
          return;
        }
        css += `
          .piece.${piece},
          .promotion-piece.${piece} {
            ${color.ringColor ? `--ring-color: ${color.ringColor};` : ""}
            ${color.ringColorSoft ? `--ring-color-soft: ${color.ringColorSoft};` : ""}
            ${color.ringGlow ? `--ring-glow: ${color.ringGlow};` : ""}
          }
        `;
      });
    }
  }

  css += `
    ${glowTargetSelected}::after,
    ${glowTargetSelectedSelf}::after,
    ${glowTargetLastMove}::after,
    ${glowTargetMove}::after,
    ${glowTargetHint}::after,
    ${glowTargetHighlight}::after {
      opacity: var(--ring-opacity, 0.85);
      animation: ${ringAnimation}, ${shimmerAnimation};
    }

    ${glowTargetCheck}::after {
      opacity: 0.95;
      animation: checkPulse 1.4s ease-in-out infinite;
      --ring-color: rgba(255,70,70,0.95);
      --ring-color-soft: rgba(255,70,70,0.45);
      --ring-glow: drop-shadow(0 0 18px rgba(255,70,70,0.85));
    }

    ${glowTargetCheckmate}::after,
    ${glowTargetMate}::after {
      opacity: 1;
      animation: mateFlare 1.6s ease-in-out infinite, fireworks 2.2s ease-out infinite;
      --ring-color: rgba(255,200,60,0.95);
      --ring-color-soft: rgba(255,200,60,0.45);
      --ring-glow: drop-shadow(0 0 22px rgba(255,200,60,0.85));
    }

    ${glowTargetCapture}::after {
      opacity: 0.9;
      animation: captureBurst 1s ease-out;
    }

    .captured-pieces .piece.wq::after,
    .captured-pieces .piece.bq::after {
      opacity: 0.9;
      animation: queenCapture 1.6s ease-in-out 1;
    }
  `;

  effectStyleTag.textContent = css;
  document.head.appendChild(effectStyleTag);
}

function disableSkins() {
  if (skinStyleTag) skinStyleTag.remove();
  if (effectStyleTag) effectStyleTag.remove();
  skinStyleTag = null;
  effectStyleTag = null;
  lastAppliedSkin = null;
  lastAppliedEffect = null;
  lastAppliedTarget = null;
}

chrome.storage.sync.get(
  ["enabled", "activeSkin", "activeEffect", "activeTarget", "activeSkinPath", "activeSet"],
  (data) => {
  skinsEnabled = !!data.enabled;
  if (!skinsEnabled) return;

  let activeSkin = data.activeSkin;
  let activeEffect = data.activeEffect;
  const activeTarget = data.activeTarget || "all";
  const skinPath = data.activeSkinPath;

  if (data.activeSet && !activeSkin && !activeEffect) {
    if (SKIN_DEFINITIONS[data.activeSet]) {
      activeSkin = data.activeSet;
    } else if (EFFECT_DEFINITIONS[data.activeSet]) {
      activeEffect = data.activeSet;
    }
  }

  applySkin(activeSkin || "set2", skinPath || null);
  applyEffect(activeEffect || "native-ember", activeTarget);
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled && changes.enabled.newValue === false) {
    skinsEnabled = false;
    disableSkins();
  }

  if (changes.enabled && changes.enabled.newValue === true) {
    skinsEnabled = true;
    chrome.storage.sync.get(["activeSkin", "activeEffect", "activeTarget", "activeSkinPath"], (data) => {
      applySkin(data.activeSkin || "set2", data.activeSkinPath || null);
      applyEffect(data.activeEffect || "native-ember", data.activeTarget || "all");
    });
  }

  if (changes.activeSkin && changes.activeSkin.newValue) {
    chrome.storage.sync.get("enabled", (data) => {
      if (data.enabled) {
        chrome.storage.sync.get("activeSkinPath", (stored) => {
          applySkin(changes.activeSkin.newValue, stored.activeSkinPath || null);
        });
      }
    });
  }

  if (changes.activeEffect && changes.activeEffect.newValue) {
    chrome.storage.sync.get("enabled", (data) => {
      if (data.enabled) {
        chrome.storage.sync.get("activeTarget", (stored) => {
          applyEffect(changes.activeEffect.newValue, stored.activeTarget || "all");
        });
      }
    });
  }

  if (changes.activeSkinPath && changes.activeSkinPath.newValue) {
    chrome.storage.sync.get(["enabled", "activeSkin"], (data) => {
      if (data.enabled) {
        applySkin(data.activeSkin || "set2", changes.activeSkinPath.newValue || null);
      }
    });
  }

  if (changes.activeTarget && changes.activeTarget.newValue) {
    chrome.storage.sync.get("enabled", (data) => {
      if (data.enabled) {
        chrome.storage.sync.get("activeEffect", (stored) => {
          applyEffect(stored.activeEffect || "native-ember", changes.activeTarget.newValue);
        });
      }
    });
  }
});

let lastOverlayAt = 0;
let hasShownGoodLuck = false;
let goodLuckObserver = null;
let lastGoodLuckGameId = null;
const GOOD_LUCK_SESSION_KEY = "chesscomskins.goodLuckGameId";
const GOOD_LUCK_SESSION_ONCE_KEY = "chesscomskins.goodLuckShown";

function ensureOverlayStyles() {
  if (overlayStyleTag) return;
  overlayStyleTag = document.createElement("style");
  overlayStyleTag.textContent = `
    .good-luck-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      pointer-events: none;
      font-family: "Inter", sans-serif;
      font-size: clamp(32px, 6vw, 72px);
      font-weight: 700;
      color: rgba(255, 240, 210, 0.95);
      text-shadow: 0 0 20px rgba(255, 170, 80, 0.85);
      animation: goodLuckFade 3.2s ease-out forwards;
      background: radial-gradient(circle, rgba(20,10,0,0.35) 0%, rgba(0,0,0,0) 70%);
    }

    @keyframes goodLuckFade {
      0% { opacity: 0; transform: translateY(20px) scale(0.98); }
      20% { opacity: 1; transform: translateY(0) scale(1); }
      70% { opacity: 1; }
      100% { opacity: 0; transform: translateY(-10px) scale(1.02); }
    }
  `;
  document.head.appendChild(overlayStyleTag);
}

function showGoodLuckOverlay() {
  if (!skinsEnabled) return;
  if (hasShownGoodLuck) return;
  const now = Date.now();
  if (now - lastOverlayAt < 5000) return;
  lastOverlayAt = now;
  ensureOverlayStyles();

  const overlay = document.createElement("div");
  overlay.className = "good-luck-overlay";
  overlay.textContent = "Good luck";
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 3400);
  hasShownGoodLuck = true;
  if (lastGoodLuckGameId) {
    sessionStorage.setItem(GOOD_LUCK_SESSION_KEY, lastGoodLuckGameId);
  } else {
    sessionStorage.setItem(GOOD_LUCK_SESSION_ONCE_KEY, "true");
  }
  if (goodLuckObserver) {
    goodLuckObserver.disconnect();
    goodLuckObserver = null;
  }
}

function getCurrentGameId() {
  const pathMatch = window.location.pathname.match(/\/game\/(?:live|daily|computer)?\/?(\d+)/);
  if (pathMatch && pathMatch[1]) return pathMatch[1];
  const dataMatch = document.querySelector("[data-game-id]");
  if (dataMatch && dataMatch.dataset.gameId) return dataMatch.dataset.gameId;
  return null;
}

function isAnalysisPage() {
  return window.location.pathname.includes("/analysis");
}

function watchForGameStart() {
  if (isAnalysisPage()) return;
  const maybeShow = () => {
    const board = document.querySelector(".board, .board-area, .board-container, chess-board");
    if (!board) return;
    const gameId = getCurrentGameId();
    if (gameId) {
      lastGoodLuckGameId = gameId;
      const storedGameId = sessionStorage.getItem(GOOD_LUCK_SESSION_KEY);
      if (storedGameId === gameId) {
        hasShownGoodLuck = true;
        return;
      }
    } else if (sessionStorage.getItem(GOOD_LUCK_SESSION_ONCE_KEY)) {
      hasShownGoodLuck = true;
      return;
    }
    showGoodLuckOverlay();
  };

  maybeShow();
  if (!goodLuckObserver) {
    goodLuckObserver = new MutationObserver(() => maybeShow());
    goodLuckObserver.observe(document.body, { childList: true, subtree: true });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", watchForGameStart);
} else {
  watchForGameStart();
}
