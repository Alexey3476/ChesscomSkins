
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
    ringColor: "rgba(255,255,255,0.75)",
    ringOpacity: 0.5,
    ringBorder: "1px",
    ringInset: "14%",
    ringAnimation: "ringSoft 1.6s ease-in-out infinite",
    ringGlow: "0 0 8px rgba(255,255,255,0.35)"
  },
  "none": {
    type: "none"
  }
};

let skinStyleTag = null;
let effectStyleTag = null;
let lastAppliedSkin = null;
let lastAppliedEffect = null;

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
        .captured .piece.${piece} {
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

function applyEffect(effectName) {
  if (lastAppliedEffect === effectName) return;
  lastAppliedEffect = effectName;

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

  let css = `
    .piece,
    .promotion-piece {
      position: relative;
      will-change: transform, filter;
    }

    .piece::after,
    .promotion-piece::after {
      content: "";
      position: absolute;
      inset: ${ringInset};
      border-radius: 50%;
      opacity: 0;
      pointer-events: none;
      border: ${ringBorder} solid var(--ring-color, rgba(255,120,60,0.85));
      box-shadow:
        0 0 10px var(--ring-color, rgba(255,120,60,0.85)),
        ${ringGlow};
      animation: ${ringAnimation};
      mix-blend-mode: screen;
      z-index: 2;
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
        --ring-opacity: ${ringOpacity};
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
    .selected .piece::after,
    .selected .promotion-piece::after,
    .piece.selected::after,
    .promotion-piece.selected::after,
    .last-move .piece::after,
    .last-move .promotion-piece::after,
    .move .piece::after,
    .move .promotion-piece::after,
    .hint .piece::after,
    .hint .promotion-piece::after,
    .highlight .piece::after,
    .highlight .promotion-piece::after {
      opacity: var(--ring-opacity, 1);
    }

    .check .piece::after,
    .check .promotion-piece::after {
      opacity: 1;
      animation: checkPulse 1s ease-in-out infinite;
      --ring-color: rgba(255,70,70,0.9);
    }

    .checkmate .piece::after,
    .checkmate .promotion-piece::after,
    .mate .piece::after,
    .mate .promotion-piece::after {
      opacity: 1;
      animation: mateFlare 1.4s ease-in-out infinite;
      --ring-color: rgba(255,200,60,0.95);
    }

    .capture .piece::after,
    .capture .promotion-piece::after,
    .captured .piece::after,
    .captured .promotion-piece::after {
      animation: captureBurst 0.9s ease-out;
    }

    .captured-pieces .piece.wq,
    .captured-pieces .piece.bq {
      animation: queenCapture 1.4s ease-in-out 1;
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
}

chrome.storage.sync.get(["enabled", "activeSkin", "activeEffect", "activeSet"], (data) => {
  if (!data.enabled) return;

  let activeSkin = data.activeSkin;
  let activeEffect = data.activeEffect;

  if (data.activeSet && !activeSkin && !activeEffect) {
    if (SKIN_DEFINITIONS[data.activeSet]) {
      activeSkin = data.activeSet;
    } else if (EFFECT_DEFINITIONS[data.activeSet]) {
      activeEffect = data.activeSet;
    }
  }

  applySkin(activeSkin || "set2");
  applyEffect(activeEffect || "native-ember");
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled && changes.enabled.newValue === false) {
    disableSkins();
  }

  if (changes.enabled && changes.enabled.newValue === true) {
    chrome.storage.sync.get(["activeSkin", "activeEffect"], (data) => {
      applySkin(data.activeSkin || "set2");
      applyEffect(data.activeEffect || "native-ember");
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
        applyEffect(changes.activeEffect.newValue);
      }
    });
  }
});
