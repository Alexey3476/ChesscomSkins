
const toggle = document.getElementById("toggle");
const skinSets = document.querySelectorAll("[data-skin]");
const effectSets = document.querySelectorAll("[data-effect]");

const SKIN_SET_IDS = ["set2", "none"];
const EFFECT_SET_IDS = [
  "native-ember",
  "native-frost",
  "native-neon",
  "legendary-ember",
  "minimal",
  "none"
];

const SKIN_PREVIEW_BASE = {
  set2: "../assets/Set2",
  none: "../assets/Set2"
};

chrome.storage.sync.get(["enabled", "activeSkin", "activeEffect", "activeSet"], data => {
  toggle.checked = !!data.enabled;
  updateUI(toggle.checked);

  let activeSkin = data.activeSkin;
  let activeEffect = data.activeEffect;

  if (data.activeSet && !activeSkin && !activeEffect) {
    if (SKIN_SET_IDS.includes(data.activeSet)) {
      activeSkin = data.activeSet;
    } else if (EFFECT_SET_IDS.includes(data.activeSet)) {
      activeEffect = data.activeSet;
    }
    chrome.storage.sync.set({ activeSkin, activeEffect });
  }

  if (activeSkin) {
    setActiveSkinUI(activeSkin);
    updateEffectPreviews(activeSkin);
  }
  if (activeEffect) setActiveEffectUI(activeEffect);
});

toggle.addEventListener("change", () => {
  if (!toggle.checked) {
    chrome.storage.sync.set({ enabled: false });
    updateUI(false);
  } else {
    chrome.storage.sync.get(["activeSkin", "activeEffect"], (data) => {
      chrome.storage.sync.set({ enabled: true });
      updateUI(true);
      setActiveSkinUI(data.activeSkin || null);
      setActiveEffectUI(data.activeEffect || null);
      updateEffectPreviews(data.activeSkin || "set2");
    });
  }
});

skinSets.forEach(set => {
  const setName = set.dataset.skin;

  set.querySelector("button").addEventListener("click", () => {
    if (!toggle.checked) return;

    chrome.storage.sync.set({ activeSkin: setName }, () => {
      setActiveSkinUI(setName);
      updateEffectPreviews(setName);
    });
  });
});

effectSets.forEach(set => {
  const setName = set.dataset.effect;

  set.querySelector("button").addEventListener("click", () => {
    if (!toggle.checked) return;

    chrome.storage.sync.set({ activeEffect: setName }, () => {
      setActiveEffectUI(setName);
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

function updateEffectPreviews(activeSkin) {
  const basePath = SKIN_PREVIEW_BASE[activeSkin] || SKIN_PREVIEW_BASE.set2;
  effectSets.forEach(set => {
    const previewPieces = (set.dataset.preview || "wq").split(" ");
    const images = set.querySelectorAll("img");
    images.forEach((img, index) => {
      const piece = previewPieces[index] || previewPieces[0];
      img.src = `${basePath}/${piece}.png`;
    });
  });
}
