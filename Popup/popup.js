
const toggle = document.getElementById("toggle");
const skinList = document.getElementById("skin-list");
const effectList = document.getElementById("effect-list");
const effectPreviewImg = document.getElementById("effect-preview-img");
const effectPreviewLabel = document.getElementById("effect-preview-label");
const skinSets = [];
const effectSets = Array.from(effectList.querySelectorAll("[data-effect]"));
const targetSets = document.querySelectorAll("[data-target]");

const SKIN_SET_IDS = [];
const EFFECT_SET_IDS = [
  "native-ember",
  "native-frost",
  "native-neon",
  "legendary-ember",
  "minimal",
  "none"
];
const SKIN_PREVIEW_BASE = {};
let activeEffectLabel = "Glow preview";
let activeEffectName = null;
const EFFECT_CLASS_MAP = {
  "native-ember": "effect-ember",
  "native-frost": "effect-frost",
  "native-neon": "effect-neon",
  "legendary-ember": "effect-legendary",
  "minimal": "effect-minimal"
};

function renderSkins(skins) {
  skinList.innerHTML = "";
  skins.forEach((skin) => {
    const wrapper = document.createElement("div");
    wrapper.className = "set festive disabled";
    wrapper.dataset.skin = skin.id;
    wrapper.dataset.path = skin.path;

    const button = document.createElement("button");
    button.textContent = skin.label;
    button.title = skin.label;

    const preview = document.createElement("div");
    preview.className = "preview dark";

    const previewPieces = ["wk","wq","wr","wb","wn","wp","bk","bq","br","bb","bn","bp"];
    previewPieces.forEach((piece) => {
      const img = document.createElement("img");
      img.src = `${skin.path}/${piece}.png`;
      img.title = skin.label;
      preview.appendChild(img);
    });

    wrapper.appendChild(button);
    wrapper.appendChild(preview);
    skinList.appendChild(wrapper);

    SKIN_SET_IDS.push(skin.id);
    SKIN_PREVIEW_BASE[skin.id] = skin.path;
    skinSets.push(wrapper);
  });
}

async function loadSkins() {
  try {
    const response = await fetch("../assets/skins.json");
    if (!response.ok) throw new Error("skins.json not found");
    const data = await response.json();
    if (Array.isArray(data.skins)) {
      renderSkins(data.skins);
      bindSkinHandlers();
      initState();
    }
  } catch (error) {
    renderSkins([
      { id: "set2", label: "Festive Classic", path: "../assets/Set2" }
    ]);
    bindSkinHandlers();
    initState();
  }
}

function initState() {
  chrome.storage.sync.get(
    ["enabled", "activeSkin", "activeEffect", "activeTarget", "activeSkinPath", "activeSet"],
    data => {
    toggle.checked = !!data.enabled;
    updateUI(toggle.checked);

  let activeSkin = data.activeSkin;
  let activeEffect = data.activeEffect;
  let activeTarget = data.activeTarget || "all";
  const activeSkinPath = data.activeSkinPath;

  if (data.activeSet && !activeSkin && !activeEffect) {
    if (SKIN_SET_IDS.includes(data.activeSet)) {
      activeSkin = data.activeSet;
    } else if (EFFECT_SET_IDS.includes(data.activeSet)) {
      activeEffect = data.activeSet;
    }
    chrome.storage.sync.set({ activeSkin, activeEffect, activeTarget });
  }

  if (activeSkin) {
    setActiveSkinUI(activeSkin);
    updateEffectPreviews(activeSkin, activeSkinPath);
  }
  if (activeEffect) {
    setActiveEffectUI(activeEffect);
    const activeButton = effectList.querySelector(`[data-effect="${activeEffect}"]`);
    if (activeButton) updateEffectPreviewLabel(activeButton.textContent.trim(), true);
    updateEffectPreviewClass(activeEffect);
  }
    if (activeTarget) setActiveTargetUI(activeTarget);
  });
}

toggle.addEventListener("change", () => {
  if (!toggle.checked) {
    chrome.storage.sync.set({ enabled: false });
    updateUI(false);
  } else {
    chrome.storage.sync.get(["activeSkin", "activeEffect", "activeTarget", "activeSkinPath"], (data) => {
      chrome.storage.sync.set({ enabled: true });
      updateUI(true);
      setActiveSkinUI(data.activeSkin || null);
      setActiveEffectUI(data.activeEffect || null);
      setActiveTargetUI(data.activeTarget || "all");
      updateEffectPreviews(data.activeSkin || "set2", data.activeSkinPath);
      updateEffectPreviewClass(data.activeEffect);
      if (data.activeEffect) {
        const activeButton = effectList.querySelector(`[data-effect="${data.activeEffect}"]`);
        if (activeButton) updateEffectPreviewLabel(activeButton.textContent.trim(), true);
      }
    });
  }
});

function bindSkinHandlers() {
  skinSets.forEach(set => {
    const setName = set.dataset.skin;
    const setPath = set.dataset.path;

    set.querySelector("button").addEventListener("click", () => {
      if (!toggle.checked) return;

      const isActive = set.classList.contains("active");
      const nextSkin = isActive ? "none" : setName;
      const nextPath = isActive ? null : setPath;

      chrome.storage.sync.set({ activeSkin: nextSkin, activeSkinPath: nextPath }, () => {
        setActiveSkinUI(isActive ? null : setName);
        updateEffectPreviews(nextSkin === "none" ? "set2" : nextSkin, nextPath);
      });
    });
  });
}

effectSets.forEach(set => {
  const setName = set.dataset.effect;

  set.addEventListener("click", () => {
    if (!toggle.checked) return;

    const isActive = set.classList.contains("active");
    const nextEffect = isActive ? "none" : setName;

    chrome.storage.sync.set({ activeEffect: nextEffect }, () => {
      setActiveEffectUI(isActive ? null : setName);
      updateEffectPreviewLabel(setName, !isActive);
      updateEffectPreviewClass(isActive ? null : setName);
      activeEffectName = isActive ? null : setName;
    });
  });

  set.addEventListener("mouseenter", () => {
    const label = set.textContent.trim();
    updateEffectPreviewLabel(label, false);
    updateEffectPreviewClass(setName);
  });
  set.addEventListener("mouseleave", () => {
    updateEffectPreviewLabel(activeEffectLabel, true);
    updateEffectPreviewClass(activeEffectName);
  });
});

targetSets.forEach(set => {
  const setName = set.dataset.target;

  set.querySelector("button").addEventListener("click", () => {
    if (!toggle.checked) return;

    chrome.storage.sync.set({ activeTarget: setName }, () => {
      setActiveTargetUI(setName);
    });
  });
});

function updateUI(enabled) {
  skinSets.forEach(set => {
    set.classList.toggle("disabled", !enabled);
  });
  effectSets.forEach(set => {
    set.classList.toggle("disabled", !enabled);
  });
  targetSets.forEach(set => {
    set.classList.toggle("disabled", !enabled);
  });
}

function setActiveSkinUI(activeID) {
  skinSets.forEach(set => {
    set.classList.toggle("active", activeID && set.dataset.skin === activeID);
  });
}

function setActiveEffectUI(activeID) {
  effectSets.forEach(set => {
    set.classList.toggle("active", activeID && set.dataset.effect === activeID);
  });
}

function setActiveTargetUI(activeID) {
  targetSets.forEach(set => {
    set.classList.toggle("active", activeID && set.dataset.target === activeID);
  });
}

function updateEffectPreviews(activeSkin, activeSkinPath) {
  const basePath = activeSkinPath || SKIN_PREVIEW_BASE[activeSkin] || SKIN_PREVIEW_BASE.set2;
  effectPreviewImg.src = `${basePath}/wk.png`;
  effectPreviewImg.title = effectPreviewLabel.textContent;
}

function updateEffectPreviewLabel(label, force) {
  if (!label) {
    effectPreviewLabel.textContent = "Glow preview";
    effectPreviewImg.title = "Glow preview";
    return;
  }
  if (force || label) {
    effectPreviewLabel.textContent = label;
    effectPreviewImg.title = label;
    if (force) activeEffectLabel = label;
  }
}

function updateEffectPreviewClass(effectName) {
  effectPreviewImg.parentElement.classList.remove(
    "effect-ember",
    "effect-frost",
    "effect-neon",
    "effect-legendary",
    "effect-minimal"
  );
  if (!effectName) return;
  activeEffectName = effectName;
  const className = EFFECT_CLASS_MAP[effectName];
  if (className) {
    effectPreviewImg.parentElement.classList.add(className);
  }
}

loadSkins();
