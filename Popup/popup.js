
const toggle = document.getElementById("toggle");
const skinSets = document.querySelectorAll(".set[data-type=\"skin\"]");
const effectKings = document.querySelectorAll(".effect-king");
const effectPreviewImages = document.querySelectorAll(".effect-preview");
let currentActiveSkin = null;
let currentActiveEffect = null;

const SKIN_PREVIEW_SOURCES = {
  set2: "../assets/Set2/wk.png"
};

function updateEffectPreviews(activeSkin) {
  const src = SKIN_PREVIEW_SOURCES[activeSkin] || SKIN_PREVIEW_SOURCES.set2;
  effectPreviewImages.forEach((img) => {
    img.src = src;
  });
}

chrome.storage.sync.get(["enabled", "activeSet", "activeSkin", "activeEffect"], data => {
  toggle.checked = !!data.enabled;
  updateUI(toggle.checked);

  const activeSet = data.activeSet && data.activeSet !== "none" ? data.activeSet : null;
  const activeSkin = data.activeSkin && data.activeSkin !== "none" ? data.activeSkin : null;
  const activeEffect = data.activeEffect && data.activeEffect !== "none" ? data.activeEffect : null;

  currentActiveSkin = activeSkin || (activeSet && skinSets.length ? activeSet : null);
  currentActiveEffect = activeEffect;
  setActiveSkinUI(currentActiveSkin);
  setActiveEffectUI(currentActiveEffect);
  updateEffectPreviews(currentActiveSkin || "set2");
});

toggle.addEventListener("change", () => {
  if (!toggle.checked) {
    chrome.storage.sync.set({ enabled: false });
    updateUI(false);
  } else {
    chrome.storage.sync.get(["activeSet", "activeSkin", "activeEffect"], (data) => {
      chrome.storage.sync.set({ enabled: true });
      updateUI(true);
      const activeSet = data.activeSet && data.activeSet !== "none" ? data.activeSet : null;
      const activeSkin = data.activeSkin && data.activeSkin !== "none" ? data.activeSkin : null;
      const activeEffect = data.activeEffect && data.activeEffect !== "none" ? data.activeEffect : null;
      currentActiveSkin = activeSkin || (activeSet && skinSets.length ? activeSet : null);
      currentActiveEffect = activeEffect;
      setActiveSkinUI(currentActiveSkin);
      setActiveEffectUI(currentActiveEffect);
      updateEffectPreviews(currentActiveSkin || "set2");
    });
  }
});

skinSets.forEach(set => {
  const setName = set.dataset.set;
  const button = set.querySelector("button");
  if (!button) return;

  button.addEventListener("click", () => {
    if (!toggle.checked) return;

    const isSame = currentActiveSkin === setName;
    const nextSkin = isSame ? "none" : setName;
    const nextSet = isSame ? "none" : setName;

    chrome.storage.sync.set({ activeSet: nextSet, activeSkin: nextSkin }, () => {
      currentActiveSkin = isSame ? null : setName;
      setActiveSkinUI(currentActiveSkin);
      updateEffectPreviews(currentActiveSkin || "set2");
    });
  });
});

effectKings.forEach((king) => {
  const effectName = king.dataset.effect;
  if (!effectName) return;

  king.addEventListener("click", () => {
    if (!toggle.checked) return;

    const isSame = currentActiveEffect === effectName;
    const nextEffect = isSame ? "none" : effectName;

    chrome.storage.sync.set({ activeSet: nextEffect, activeEffect: nextEffect }, () => {
      currentActiveEffect = isSame ? null : effectName;
      setActiveEffectUI(currentActiveEffect);
    });
  });
});

function updateUI(enabled) {
  skinSets.forEach(set => {
    set.classList.toggle("disabled", !enabled);
  });
  const effectContainer = document.querySelector(".set[data-type=\"effect\"]");
  if (effectContainer) {
    effectContainer.classList.toggle("disabled", !enabled);
  }
}

function setActiveSkinUI(activeID) {
  skinSets.forEach(set => {
    set.classList.toggle("active", activeID && set.dataset.set === activeID);
  });
}

function setActiveEffectUI(activeID) {
  effectKings.forEach((king) => {
    king.classList.toggle("active", activeID && king.dataset.effect === activeID);
  });
}
