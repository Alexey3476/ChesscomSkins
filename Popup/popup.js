
const toggle = document.getElementById("toggle");
const sets = document.querySelectorAll(".set");
const effectPreviewImages = document.querySelectorAll(".effect-preview");
let currentActiveSet = null;

const SKIN_PREVIEW_SOURCES = {
  set2: "../assets/Set2/wk.png"
};

function updateEffectPreviews(activeSkin) {
  const src = SKIN_PREVIEW_SOURCES[activeSkin] || SKIN_PREVIEW_SOURCES.set2;
  effectPreviewImages.forEach((img) => {
    img.src = src;
  });
}

chrome.storage.sync.get(["enabled", "activeSet", "activeSkinPreview"], data => {
  toggle.checked = !!data.enabled;
  updateUI(toggle.checked);

  if (data.activeSet) {
    currentActiveSet = data.activeSet === "none" ? null : data.activeSet;
    setActiveUI(currentActiveSet);
  }

  updateEffectPreviews(data.activeSkinPreview || "set2");
});

toggle.addEventListener("change", () => {
  if (!toggle.checked) {
    chrome.storage.sync.set({ enabled: false });
    updateUI(false);
  } else {
    chrome.storage.sync.get(["activeSet", "activeSkinPreview"], (data) => {
      chrome.storage.sync.set({ enabled: true });
      updateUI(true);
      currentActiveSet = data.activeSet === "none" ? null : data.activeSet;
      setActiveUI(currentActiveSet);
      updateEffectPreviews(data.activeSkinPreview || "set2");
    });
  }
});

sets.forEach(set => {
  const setName = set.dataset.set;
  const setType = set.dataset.type;

  set.querySelector("button").addEventListener("click", () => {
    if (!toggle.checked) return;

    const isSame = currentActiveSet === setName;
    const nextSet = isSame ? "none" : setName;

    const storageUpdate = { activeSet: nextSet };
    if (!isSame && setType === "skin") {
      storageUpdate.activeSkinPreview = setName;
    }

    chrome.storage.sync.set(storageUpdate, () => {
      currentActiveSet = isSame ? null : setName;
      setActiveUI(currentActiveSet);
      if (!isSame && setType === "skin") {
        updateEffectPreviews(setName);
      }
    });
  });
});

function updateUI(enabled) {
  sets.forEach(set => {
    set.classList.toggle("disabled", !enabled);
  });
}

function setActiveUI(activeID) {
  sets.forEach(set => {
    set.classList.toggle("active", activeID && set.dataset.set === activeID);
  });
}
