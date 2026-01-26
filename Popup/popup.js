const PIECES = [
  "wk","wq","wr","wb","wn","wp",
  "bk","bq","br","bb","bn","bp"
];

const EFFECTS = [
  { id: "native-ember", label: "Ember Glow", className: "effect-ember" },
  { id: "native-frost", label: "Frost Aura", className: "effect-frost" },
  { id: "native-neon", label: "Neon Pulse", className: "effect-neon" },
  { id: "legendary-ember", label: "Legendary Ember", className: "effect-legendary" },
  { id: "minimal", label: "Minimal Halo", className: "effect-minimal" }
];

const toggle = document.getElementById("toggle");
const effectsPreview = document.getElementById("effects-preview");
const skinList = document.getElementById("skin-list");
const selectableItems = new Set();
const activeState = { activeSkin: null, activeEffect: null };

init();

function init() {
  renderEffects();
  loadSkins();
  chrome.storage.sync.get(["enabled", "activeSet", "activeSkin", "activeEffect"], data => {
    toggle.checked = !!data.enabled;
    updateUI(toggle.checked);
    activeState.activeSkin = data.activeSkin || data.activeSet;
    activeState.activeEffect = data.activeEffect || data.activeSet;
    setActiveUI(activeState);
  });
}

toggle.addEventListener("change", () => {
  if (!toggle.checked) {
    chrome.storage.sync.set({ enabled: false });
    updateUI(false);
  } else {
    chrome.storage.sync.set({ enabled: true });
    updateUI(true);
  }
});

function renderEffects() {
  effectsPreview.innerHTML = "";
  EFFECTS.forEach(effect => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `effect-item ${effect.className}`;
    button.dataset.set = effect.id;
    button.dataset.type = "effect";
    button.dataset.label = effect.label;

    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("assets/Set2/wk.png");
    img.alt = effect.label;
    button.appendChild(img);

    button.addEventListener("click", () => {
      if (!toggle.checked) return;
      chrome.storage.sync.set({ activeEffect: effect.id, activeSet: effect.id }, () => {
        setActiveUI({ activeEffect: effect.id });
      });
    });

    effectsPreview.appendChild(button);
    selectableItems.add(button);
  });
}

async function loadSkins() {
  skinList.innerHTML = "";
  const directories = await listAssetDirectories();
  const skins = await Promise.all(directories.map(async (dir) => {
    const hasPieces = await directoryHasPieces(dir);
    if (!hasPieces) return null;
    return {
      id: dir.name,
      label: formatLabel(dir.name),
      path: `assets/${dir.name}`
    };
  }));

  skins.filter(Boolean).forEach((skin) => {
    const card = document.createElement("div");
    card.className = "set";
    card.dataset.set = skin.id;
    card.dataset.type = "skin";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = skin.label;
    button.addEventListener("click", () => {
      if (!toggle.checked) return;
      chrome.storage.sync.set(
        { activeSkin: skin.id, activeSkinPath: skin.path, activeSet: skin.id },
        () => setActiveUI({ activeSkin: skin.id })
      );
    });

    const preview = document.createElement("div");
    preview.className = "preview dark";
    PIECES.forEach(piece => {
      const img = document.createElement("img");
      img.src = chrome.runtime.getURL(`${skin.path}/${piece}.png`);
      img.alt = piece;
      preview.appendChild(img);
    });

    card.appendChild(button);
    card.appendChild(preview);
    skinList.appendChild(card);
    selectableItems.add(card);
  });

  updateUI(toggle.checked);
  setActiveUI(activeState);
}

function updateUI(enabled) {
  selectableItems.forEach(item => {
    item.classList.toggle("disabled", !enabled);
  });
}

function setActiveUI({ activeSkin, activeEffect }) {
  selectableItems.forEach(item => {
    const type = item.dataset.type;
    if (type === "skin") {
      item.classList.toggle("active", activeSkin && item.dataset.set === activeSkin);
    } else if (type === "effect") {
      item.classList.toggle("active", activeEffect && item.dataset.set === activeEffect);
    }
  });
}

function listAssetDirectories() {
  return new Promise((resolve) => {
    chrome.runtime.getPackageDirectoryEntry((root) => {
      root.getDirectory("assets", {}, (dir) => {
        const reader = dir.createReader();
        const entries = [];
        const readEntries = () => {
          reader.readEntries((results) => {
            if (!results.length) {
              resolve(entries.filter(entry => entry.isDirectory));
              return;
            }
            entries.push(...results);
            readEntries();
          });
        };
        readEntries();
      }, () => resolve([]));
    });
  });
}

function directoryHasPieces(dirEntry) {
  return Promise.all(
    PIECES.map(piece => new Promise(resolve => {
      dirEntry.getFile(`${piece}.png`, {}, () => resolve(true), () => resolve(false));
    }))
  ).then(results => results.every(Boolean));
}

function formatLabel(name) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
