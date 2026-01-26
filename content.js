
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
    ringColor: "rgba(255,120,60,0.9)"
  },
  "native-frost": {
    type: "filter",
    filter: "hue-rotate(190deg) saturate(1.35) brightness(1.1)",
    ringColor: "rgba(110,190,255,0.9)"
  },
  "native-neon": {
    type: "filter",
    filter: "hue-rotate(280deg) saturate(1.6) brightness(1.1)",
    ringColor: "rgba(210,120,255,0.9)"
  },
  "legendary-ember": {
    type: "filter",
    filter: "saturate(1.1) brightness(1.02)",
    ringColor: "rgba(255,130,70,0.95)",
    ringGlow: "0 0 18px rgba(255,120,60,0.7)",
    ringColorOverrides: {
      wk: "rgba(255,210,120,0.95)",
      wq: "rgba(255,160,80,0.95)",
      bk: "rgba(120,180,255,0.95)",
      bq: "rgba(150,120,255,0.95)"
    }
  },
  "minimal": {
    type: "filter",
    filter: "saturate(1.02)",
    ringColor: "rgba(255,255,255,0.9)",
    ringOpacity: 0.75,
    ringBorder: "2px",
    ringInset: "12%",
    ringAnimation: "ringSoft 1.6s ease-in-out infinite",
    ringGlow: "0 0 12px rgba(255,255,255,0.55)"
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

function applySkin(skinName) {
  if (lastAppliedSkin === skinName) return;
  lastAppliedSkin = skinName;

  if (skinStyleTag) skinStyleTag.remove();
  if (!skinName || skinName === "none") return;

  skinStyleTag = document.createElement("style");
  const definition = SKIN_DEFINITIONS[skinName];
  if (!definition || definition.type === "none") return;

  let css = "";
  if (definition.type === "image") {
    PIECES.forEach(piece => {
      const url = chrome.runtime.getURL(`${definition.path}/${piece}.png`);
      css += `
        .piece.${piece},
        .promotion-piece.${piece},
        .captured-pieces .piece.${piece},
        .captured-piece.${piece},
        .captured-piece .piece.${piece},
        .captured .piece.${piece},
        [class*="captured"] .piece.${piece},
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

  const ringInset = definition.ringInset || "8%";
  const ringBorder = definition.ringBorder || "2px";
  const ringOpacity = typeof definition.ringOpacity === "number" ? definition.ringOpacity : 1;
  const ringGlow = definition.ringGlow || "0 0 22px rgba(0,0,0,0.25)";
  const ringAnimation = definition.ringAnimation || "ringPulse 1.2s ease-in-out infinite";
  const boostedOpacity = Math.min(ringOpacity * 1.3, 1);

  const glowTargets = targetName === "royal"
    ? [".piece.wk", ".piece.wq", ".piece.bk", ".piece.bq"]
    : [".piece", ".promotion-piece"];
  const glowTargetSelector = glowTargets.join(", ");
  const glowTargetBefore = glowTargets.map((target) => `${target}::before`).join(", ");
  const glowTargetAfter = glowTargets.map((target) => `${target}::after`).join(", ");
  const glowTargetSelectedAfter = glowTargets.map((target) => `.selected ${target}::after`).join(", ");
  const glowTargetSelectedSelfAfter = glowTargets.map((target) => `${target}.selected::after`).join(", ");
  const glowTargetLastMoveAfter = glowTargets.map((target) => `.last-move ${target}::after`).join(", ");
  const glowTargetMoveAfter = glowTargets.map((target) => `.move ${target}::after`).join(", ");
  const glowTargetHintAfter = glowTargets.map((target) => `.hint ${target}::after`).join(", ");
  const glowTargetHighlightAfter = glowTargets.map((target) => `.highlight ${target}::after`).join(", ");
  const glowTargetCheckAfter = glowTargets.map((target) => `.check ${target}::after`).join(", ");
  const glowTargetCheckmateAfter = glowTargets.map((target) => `.checkmate ${target}::after`).join(", ");
  const glowTargetMateAfter = glowTargets.map((target) => `.mate ${target}::after`).join(", ");
  const glowTargetCaptureAfter = glowTargets.map((target) => `.capture ${target}::after`).join(", ");
  const glowTargetCheckmateBefore = glowTargets.map((target) => `.checkmate ${target}::before`).join(", ");
  const glowTargetMateBefore = glowTargets.map((target) => `.mate ${target}::before`).join(", ");

  let css = `
    .piece,
    .promotion-piece {
      position: relative;
      will-change: transform, filter;
    }

    ${glowTargetBefore} {
      content: "";
      position: absolute;
      inset: 5%;
      border-radius: 50%;
      opacity: 0.12;
      pointer-events: none;
      background: radial-gradient(circle, var(--ring-color, rgba(255,140,80,0.5)) 0%, rgba(0,0,0,0) 65%);
      animation: glowShift 2.8s ease-in-out infinite;
      mix-blend-mode: screen;
      z-index: 1;
    }

    ${glowTargetAfter} {
      content: "";
      position: absolute;
      inset: ${ringInset};
      border-radius: 50%;
      opacity: 0;
      pointer-events: none;
      border: ${ringBorder} solid var(--ring-color, rgba(255,120,60,0.85));
      box-shadow:
        0 0 10px var(--ring-color, rgba(255,120,60,0.85)),
        ${ringGlow},
        0 0 18px var(--ring-color, rgba(255,120,60,0.6));
      animation: ${ringAnimation};
      mix-blend-mode: screen;
      z-index: 2;
    }

    .captured .piece::before,
    .captured .piece::after,
    .captured-piece::before,
    .captured-piece::after,
    .captured-pieces .piece::before,
    .captured-pieces .piece::after,
    [class*="captured"] .piece::before,
    [class*="captured"] .piece::after {
      opacity: 0 !important;
      animation: none !important;
    }

    @keyframes ringPulse {
      0% {
        transform: scale(0.9);
        box-shadow: 0 0 6px var(--ring-color, rgba(255,120,60,0.85));
      }
      70% {
        transform: scale(1.08);
        box-shadow: 0 0 14px var(--ring-color, rgba(255,120,60,0.85));
      }
      100% {
        transform: scale(1);
        box-shadow: 0 0 10px var(--ring-color, rgba(255,120,60,0.85));
      }
    }

    @keyframes ringSoft {
      0% {
        transform: scale(0.98);
        box-shadow: 0 0 4px var(--ring-color, rgba(255,255,255,0.65));
      }
      100% {
        transform: scale(1.03);
        box-shadow: 0 0 8px var(--ring-color, rgba(255,255,255,0.65));
      }
    }

    @keyframes glowShift {
      0% { transform: scale(0.96); opacity: 0.1; }
      50% { transform: scale(1.04); opacity: 0.22; }
      100% { transform: scale(0.98); opacity: 0.12; }
    }

    @keyframes shimmer {
      0% { background-position: 0% 50%; opacity: 0.1; }
      50% { background-position: 100% 50%; opacity: 0.28; }
      100% { background-position: 0% 50%; opacity: 0.12; }
    }

    @keyframes fireworks {
      0% { transform: scale(0.6); opacity: 0; }
      40% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1.4); opacity: 0; }
    }

    @keyframes checkPulse {
      0% { transform: scale(0.95); box-shadow: 0 0 8px rgba(255,70,70,0.8); }
      50% { transform: scale(1.1); box-shadow: 0 0 18px rgba(255,70,70,0.95); }
      100% { transform: scale(1); box-shadow: 0 0 10px rgba(255,70,70,0.8); }
    }

    @keyframes mateFlare {
      0% { transform: scale(0.9) rotate(0deg); box-shadow: 0 0 10px rgba(255,200,60,0.9); }
      50% { transform: scale(1.15) rotate(6deg); box-shadow: 0 0 26px rgba(255,200,60,1); }
      100% { transform: scale(1) rotate(0deg); box-shadow: 0 0 14px rgba(255,200,60,0.9); }
    }

    @keyframes captureBurst {
      0% { transform: scale(0.6); opacity: 0; box-shadow: 0 0 0 rgba(255,120,60,0.7); }
      40% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 18px rgba(255,120,60,0.85); }
      100% { transform: scale(1.2); opacity: 0; box-shadow: 0 0 30px rgba(255,120,60,0); }
    }

    @keyframes queenCapture {
      0% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(255,190,90,0.7)); }
      50% { transform: scale(1.08); filter: drop-shadow(0 0 12px rgba(255,190,90,1)); }
      100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(255,190,90,0.8)); }
    }
  `;

  if (definition.type === "filter") {
    css += `
      .piece,
      .promotion-piece {
        filter: ${definition.filter} !important;
        --ring-color: ${definition.ringColor};
        --ring-opacity: ${boostedOpacity};
      }
    `;

    if (definition.ringColorOverrides) {
      Object.entries(definition.ringColorOverrides).forEach(([piece, color]) => {
        css += `
          .piece.${piece},
          .promotion-piece.${piece} {
            --ring-color: ${color};
          }
        `;
      });
    }
  }

  css += `
    ${glowTargetSelectedAfter},
    ${glowTargetSelectedSelfAfter},
    ${glowTargetLastMoveAfter},
    ${glowTargetMoveAfter},
    ${glowTargetHintAfter},
    ${glowTargetHighlightAfter} {
      opacity: var(--ring-opacity, 1);
    }

    ${glowTargetCheckAfter} {
      opacity: 1;
      animation: checkPulse 1s ease-in-out infinite;
      --ring-color: rgba(255,70,70,0.9);
    }

    ${glowTargetCheckmateAfter},
    ${glowTargetMateAfter} {
      opacity: 1;
      animation: mateFlare 1.4s ease-in-out infinite;
      --ring-color: rgba(255,200,60,0.95);
    }

    ${glowTargetCaptureAfter} {
      animation: captureBurst 0.9s ease-out;
    }

    .captured-pieces .piece.wq,
    .captured-pieces .piece.bq {
      animation: queenCapture 1.4s ease-in-out 1;
    }

    ${glowTargetBefore} {
      background-image: linear-gradient(120deg, rgba(255,255,255,0.05), var(--ring-color, rgba(255,140,80,0.5)), rgba(255,255,255,0.05));
      background-size: 200% 200%;
      animation: shimmer 3.2s ease-in-out infinite;
    }

    ${glowTargetCheckmateBefore},
    ${glowTargetMateBefore} {
      background-image:
        radial-gradient(circle, rgba(255,210,80,0.9) 0%, rgba(255,210,80,0) 60%),
        radial-gradient(circle, rgba(255,120,80,0.7) 0%, rgba(255,120,80,0) 70%);
      animation: fireworks 1.2s ease-out infinite;
      opacity: 0.8;
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

chrome.storage.sync.get(["enabled", "activeSkin", "activeEffect", "activeTarget", "activeSet"], (data) => {
  if (!data.enabled) return;

  let activeSkin = data.activeSkin;
  let activeEffect = data.activeEffect;
  const activeTarget = data.activeTarget || "all";

  if (data.activeSet && !activeSkin && !activeEffect) {
    if (SKIN_DEFINITIONS[data.activeSet]) {
      activeSkin = data.activeSet;
    } else if (EFFECT_DEFINITIONS[data.activeSet]) {
      activeEffect = data.activeSet;
    }
  }

  applySkin(activeSkin || "set2");
  applyEffect(activeEffect || "native-ember", activeTarget);
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled && changes.enabled.newValue === false) {
    disableSkins();
  }

  if (changes.enabled && changes.enabled.newValue === true) {
    chrome.storage.sync.get(["activeSkin", "activeEffect", "activeTarget"], (data) => {
      applySkin(data.activeSkin || "set2");
      applyEffect(data.activeEffect || "native-ember", data.activeTarget || "all");
    });
  }

  if (changes.activeSkin && changes.activeSkin.newValue) {
    chrome.storage.sync.get("enabled", (data) => {
      if (data.enabled) {
        applySkin(changes.activeSkin.newValue);
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
  const now = Date.now();
  if (now - lastOverlayAt < 5000) return;
  lastOverlayAt = now;
  ensureOverlayStyles();

  const overlay = document.createElement("div");
  overlay.className = "good-luck-overlay";
  overlay.textContent = "Good luck";
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 3400);
}

function watchForGameStart() {
  const maybeShow = () => {
    const board = document.querySelector(".board, .board-area, .board-container, chess-board");
    if (board) showGoodLuckOverlay();
  };

  maybeShow();
  const observer = new MutationObserver(() => maybeShow());
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", watchForGameStart);
} else {
  watchForGameStart();
}
