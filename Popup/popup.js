
const toggle = document.getElementById("toggle");
const skinSets = document.querySelectorAll("[data-skin]");
const effectSets = document.querySelectorAll("[data-effect]");
const targetSets = document.querySelectorAll("[data-target]");

const SKIN_SET_IDS = ["set2", "none"];
const EFFECT_SET_IDS = [
  "native-ember",
  "native-frost",
  "native-neon",
  "legendary-ember",
  "minimal",
  "none"
];
const TARGET_IDS = ["all", "royal"];

const SKIN_PREVIEW_BASE = {
  set2: "../assets/Set2",
  none: "../assets/Set2"
};

chrome.storage.sync.get(
  ["enabled", "activeSkin", "activeEffect", "activeTarget", "activeSet"],
  data => {
  toggle.checked = !!data.enabled;
  updateUI(toggle.checked);

  let activeSkin = data.activeSkin;
  let activeEffect = data.activeEffect;
  let activeTarget = data.activeTarget || "all";

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
    updateEffectPreviews(activeSkin);
  }
  if (activeEffect) setActiveEffectUI(activeEffect);
  if (activeTarget) setActiveTargetUI(activeTarget);
});

toggle.addEventListener("change", () => {
  if (!toggle.checked) {
    chrome.storage.sync.set({ enabled: false });
    updateUI(false);
  } else {
    chrome.storage.sync.get(["activeSkin", "activeEffect", "activeTarget"], (data) => {
      chrome.storage.sync.set({ enabled: true });
      updateUI(true);
      setActiveSkinUI(data.activeSkin || null);
      setActiveEffectUI(data.activeEffect || null);
      setActiveTargetUI(data.activeTarget || "all");
      updateEffectPreviews(data.activeSkin || "set2");
    });
  }
});

skinSets.forEach(set => {
  const setName = set.dataset.skin;

  set.querySelector("button").addEventListener("click", () => {
    if (!toggle.checked) return;

    const isActive = set.classList.contains("active");
    const nextSkin = isActive ? "none" : setName;

    chrome.storage.sync.set({ activeSkin: nextSkin }, () => {
      setActiveSkinUI(isActive ? null : setName);
      updateEffectPreviews(nextSkin === "none" ? "set2" : nextSkin);
    });
  });
});

effectSets.forEach(set => {
  const setName = set.dataset.effect;

  set.querySelector("button").addEventListener("click", () => {
    if (!toggle.checked) return;

    const isActive = set.classList.contains("active");
    const nextEffect = isActive ? "none" : setName;

    chrome.storage.sync.set({ activeEffect: nextEffect }, () => {
      setActiveEffectUI(isActive ? null : setName);
    });
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

function updateEffectPreviews(activeSkin) {
  const basePath = SKIN_PREVIEW_BASE[activeSkin] || SKIN_PREVIEW_BASE.set2;
  effectSets.forEach(set => {
    const previewPieces = (set.dataset.preview || "wq").split(" ");
    const images = set.querySelectorAll("img");
    const label = set.querySelector("button")?.textContent?.trim() || "";
    images.forEach((img, index) => {
      const piece = previewPieces[index] || previewPieces[0];
      img.src = `${basePath}/${piece}.png`;
      if (label) img.title = label;
    });
  });
}
