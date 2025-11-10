import { game, saveCurrentGame, scheduleAutosave } from './main.js';
import { getCurrentToolLabel, getCurrentTool } from './tools.js';
import {
  CROP_TYPES,
  getTotalSeedCount,
  getTotalCropCount,
  getCurrentSeedLabel,
} from './crops.js';
import { getRandomMathQuestion } from '../systems/mathCheck.js';
import { playInteractionSound } from '../systems/sound.js';

let hudEl;
let messageEl;
let inventoryPanelEl;
let marketPanelEl;
let marketStatusEl;
let marketCropTitleEl;
let marketCropCounterEl;
let marketInfoEl;
let marketSellBtn;
let marketBuyBtn;
let marketPrevBtn;
let marketNextBtn;
let marketControlsBtn;
let controlsPanelEl;
let controlsCloseBtn;
let messageTimeoutId = null;
let inventoryVisible = false;
let marketOpen = false;
let marketCropIndex = 0;
let marketCropList = Object.keys(CROP_TYPES);
let marketLockNavigation = false;
let marketContextName = null;
let marketPriceAdjust = { buy: 0, sell: 0 };
let marketMode = 'crops';
let tokenMarketConfig = null;
let tokenSelectionIndex = 0;
let controlsOpen = false;
let mathPanelEl;
let mathQuestionEl;
let mathOptionsEl;
let mathFeedbackEl;
let mathCloseBtn;
let mathSaveBtn;
let mathSaveFeedbackEl;
let pendingMathCallback = null;
let currentMathQuestion = null;
let mathPanelOpen = false;
let mathLockoutUntil = 0;
let mathLockoutTimerEl;
let lockoutIntervalId = null;

// Hotbar elements
let hotbarNoneEl;
let hotbarHoeEl;
let hotbarShovelEl;
let hotbarRakeEl;

export function setupUI() {
  hudEl = document.getElementById('hud');
  messageEl = document.getElementById('message');
  inventoryPanelEl = document.getElementById('inventory-panel');
  marketPanelEl = document.getElementById('market-panel');
  marketStatusEl = document.getElementById('market-status');

  hotbarNoneEl = document.getElementById('hotbar-none');
  hotbarHoeEl = document.getElementById('hotbar-hoe');
  hotbarShovelEl = document.getElementById('hotbar-shovel');
  hotbarRakeEl = document.getElementById('hotbar-rake');

  updateHotbarSelection();

  // Hook up market buttons
  marketCropTitleEl = document.getElementById('market-crop-title');
  marketCropCounterEl = document.getElementById('market-crop-counter');
  marketInfoEl = document.getElementById('market-info');
  marketSellBtn = document.getElementById('market-sell-crop-btn');
  marketBuyBtn = document.getElementById('market-buy-seed-btn');
  marketPrevBtn = document.getElementById('market-prev-crop-btn');
  marketNextBtn = document.getElementById('market-next-crop-btn');
  const closeBtn = document.getElementById('market-close-btn');
  marketControlsBtn = document.getElementById('market-controls-btn');
  controlsPanelEl = document.getElementById('controls-panel');
  controlsCloseBtn = document.getElementById('controls-close-btn');
  mathPanelEl = document.getElementById('math-panel');
  mathQuestionEl = document.getElementById('math-question-text');
  mathOptionsEl = document.getElementById('math-options-container');
  mathFeedbackEl = document.getElementById('math-feedback');
  mathCloseBtn = document.getElementById('math-close-btn');
  mathSaveBtn = document.getElementById('math-save-btn');
  mathSaveFeedbackEl = document.getElementById('math-save-feedback');
  mathLockoutTimerEl = document.getElementById('math-lockout-timer');
  mathLockoutTimerEl = document.getElementById('math-lockout-timer');

  if (marketSellBtn) {
    marketSellBtn.addEventListener('click', () => {
      if (marketMode === 'tokens') {
        handleSellTokenItem();
        return;
      }
      const crop = getCurrentMarketCropId();
      if (crop) handleSellCrop(crop);
    });
  }

  if (marketBuyBtn) {
    marketBuyBtn.addEventListener('click', () => {
      if (marketMode === 'tokens') {
        handleBuyTokenEntry();
        return;
      }
      const crop = getCurrentMarketCropId();
      if (crop) handleBuySeed(crop);
    });
  }

  if (marketPrevBtn) {
    marketPrevBtn.addEventListener('click', () => {
      cycleMarketSelection(-1);
    });
  }

  if (marketNextBtn) {
    marketNextBtn.addEventListener('click', () => {
      cycleMarketSelection(1);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeMarketUI();
    });
  }

  if (marketControlsBtn) {
    marketControlsBtn.addEventListener('click', () => {
      openControlsPanel();
    });
  }

  if (controlsCloseBtn) {
    controlsCloseBtn.addEventListener('click', () => {
      closeControlsPanel();
    });
  }

  if (mathCloseBtn) {
    mathCloseBtn.addEventListener('click', () => {
      cancelMathCheck();
    });
  }

  if (mathSaveBtn) {
    mathSaveBtn.addEventListener('click', () => {
      const ok = saveCurrentGame('manual_math_panel');
      if (mathSaveFeedbackEl) {
        mathSaveFeedbackEl.style.color = ok ? '#9de29d' : '#ff8a8a';
        mathSaveFeedbackEl.textContent = ok
          ? 'Progress saved!'
          : 'Save failed. Please try again.';
      }
      showMessage(
        ok ? 'Progress saved locally.' : 'Save failed. Storage disabled?',
        1400
      );
    });
  }

  updateMarketNavState();
}

export function updateHUD() {
  if (!hudEl) return;

  const cropCount = getTotalCropCount(game.inventory);
  const seedCount = getTotalSeedCount(game.inventory);
  const toolLabel = getCurrentToolLabel();
  const seedLabel = getCurrentSeedLabel();

  hudEl.innerText =
    `Day ${game.day} | $${game.money}` +
    ` | Seeds: ${seedCount} | Crops: ${cropCount}` +
    ` | Tool: ${toolLabel}` +
    ` | Seed: ${seedLabel}`;
}

// Show a temporary message near the bottom of the screen
export function showMessage(text, duration = 1500) {
  if (!messageEl) return;

  messageEl.textContent = text;
  messageEl.style.opacity = '1';

  if (messageTimeoutId) {
    clearTimeout(messageTimeoutId);
  }

  messageTimeoutId = setTimeout(() => {
    messageEl.style.opacity = '0';
  }, duration);
}

// ---------- Inventory panel ----------

export function updateInventoryUI() {
  if (!inventoryPanelEl) return;

  const inv = game.inventory || {};
  const lines = ['Inventory:'];
  let shown = 0;

  for (const [id, count] of Object.entries(inv)) {
    if (count > 0) {
      lines.push(`- ${id}: ${count}`);
      shown++;
    }
  }

  if (shown === 0) {
    lines.push('- (empty)');
  }

  inventoryPanelEl.innerText = lines.join('\n');
}

export function toggleInventoryUI() {
  if (!inventoryPanelEl) return;

  inventoryVisible = !inventoryVisible;

  if (inventoryVisible) {
    updateInventoryUI();
    inventoryPanelEl.style.display = 'block';
  } else {
    inventoryPanelEl.style.display = 'none';
  }
}

// ---------- Hotbar ----------

export function updateHotbarSelection() {
  const tool = getCurrentTool();
  const entries = [
    { id: 'none', el: hotbarNoneEl },
    { id: 'hoe', el: hotbarHoeEl },
    { id: 'shovel', el: hotbarShovelEl },
    { id: 'rake', el: hotbarRakeEl },
  ];

  for (const entry of entries) {
    if (!entry.el) continue;
    if (tool === entry.id) {
      entry.el.classList.add('selected');
    } else {
      entry.el.classList.remove('selected');
    }
  }
}

// ---------- Market UI ----------

export function openMarketUI(options = {}) {
  if (!marketPanelEl) return;
  applyMarketOptions(options);
  marketOpen = true;
  marketPanelEl.style.display = 'block';
  updateMarketUI();

  if (document.exitPointerLock) {
    document.exitPointerLock();
  }
}

export function closeMarketUI() {
  if (!marketPanelEl) return;
  marketOpen = false;
  marketPanelEl.style.display = 'none';
  resetMarketCropPool();
  updateMarketNavState();
  setMarketStatus('');
  closeControlsPanel();
}

export function isMarketOpen() {
  return marketOpen;
}

function resetMarketCropPool() {
  marketCropList = Object.keys(CROP_TYPES);
  marketLockNavigation = false;
  marketContextName = null;
  marketCropIndex = 0;
  marketPriceAdjust = { buy: 0, sell: 0 };
  marketMode = 'crops';
  tokenMarketConfig = null;
  tokenSelectionIndex = 0;
  controlsOpen = false;
  closeMathPanel();
}

function applyMarketOptions(options = {}) {
  resetMarketCropPool();

  if (options && options.mode === 'tokens') {
    marketMode = 'tokens';
    tokenMarketConfig = options.tokenOptions || null;
    marketContextName = options.vendorName || null;
    tokenSelectionIndex = 0;
  } else if (options && options.cropId && CROP_TYPES[options.cropId]) {
    marketCropList = [options.cropId];
    marketLockNavigation = Boolean(options.lockToCrop);
    marketContextName = options.vendorName || null;
  }

  if (options && options.priceAdjustments && marketMode === 'crops') {
    marketPriceAdjust = {
      buy: options.priceAdjustments.buy ?? 0,
      sell: options.priceAdjustments.sell ?? 0,
    };
  }

  if (marketContextName) {
    setMarketStatus(`Trading with ${marketContextName}.`);
  } else {
    setMarketStatus('');
  }

  updateMarketNavState();
}

export function updateMarketUI() {
  if (!marketPanelEl) return;

  if (marketMode === 'tokens') {
    updateTokenMarketUI();
    return;
  }

  const cropId = getCurrentMarketCropId();
  if (!cropId) {
    if (marketCropTitleEl) marketCropTitleEl.innerText = 'No Crops';
    if (marketInfoEl) {
      marketInfoEl.innerText = 'No crops available.';
    }
    if (marketCropCounterEl) marketCropCounterEl.innerText = '';
    if (marketSellBtn) marketSellBtn.disabled = true;
    if (marketBuyBtn) marketBuyBtn.disabled = true;
    return;
  }

  const orderLength = marketCropList.length;
  const def = CROP_TYPES[cropId];
  const inv = game.inventory || {};
  const seeds = inv[def.seedId] || 0;
  const crops = inv[def.cropId] || 0;
  const buyPrice = Math.max(0, def.seedPrice + marketPriceAdjust.buy);
  const sellPrice = Math.max(0, def.sellPrice + marketPriceAdjust.sell);

  if (marketCropTitleEl) {
    marketCropTitleEl.innerText = def.displayName;
  }

  if (marketCropCounterEl) {
    const safeLength = orderLength || 1;
    const displayIndex = orderLength ? marketCropIndex + 1 : 0;
    marketCropCounterEl.innerText = `${displayIndex} / ${safeLength}`;
  }

  if (marketInfoEl) {
    const lines = [
      `Money: $${game.money}`,
      '',
      `Seeds: ${seeds}`,
      `Crops: ${crops}`,
      `Buy seed: $${buyPrice}`,
      `Sell crop: $${sellPrice}`,
    ];
    marketInfoEl.innerText = lines.join('\n');
  }

  if (marketSellBtn) {
    marketSellBtn.disabled = false;
    marketSellBtn.innerText = `Sell 1 ${def.displayName} ($${sellPrice})`;
  }

  if (marketBuyBtn) {
    marketBuyBtn.disabled = false;
    marketBuyBtn.innerText = `Buy 1 ${def.displayName} Seed ($${buyPrice})`;
  }
}

function updateTokenMarketUI() {
  if (!marketPanelEl) return;
  const cfg = tokenMarketConfig;

  if (!cfg || !cfg.entries || cfg.entries.length === 0) {
    if (marketCropTitleEl) marketCropTitleEl.innerText = 'Token Vendor';
    if (marketInfoEl) marketInfoEl.innerText = 'No items available.';
    if (marketCropCounterEl) marketCropCounterEl.innerText = '';
    if (marketSellBtn) marketSellBtn.disabled = true;
    if (marketBuyBtn) marketBuyBtn.disabled = true;
    return;
  }

  const entries = cfg.entries;
  if (tokenSelectionIndex >= entries.length) {
    tokenSelectionIndex = 0;
  } else if (tokenSelectionIndex < 0) {
    tokenSelectionIndex = entries.length - 1;
  }

  const current = entries[tokenSelectionIndex];
  const inv = game.inventory || {};
  const tokens = inv[current.tokenId] || 0;
  const sellItem = cfg.sellItem || null;
  const products = sellItem ? inv[sellItem.id] || 0 : 0;
  const tokenPrice = current.tokenPrice || 0;
  const productPrice = sellItem ? sellItem.price || 0 : 0;

  if (marketCropTitleEl) {
    marketCropTitleEl.innerText = current.tokenName || 'Animal Token';
  }

  if (marketCropCounterEl) {
    marketCropCounterEl.innerText = `${tokenSelectionIndex + 1} / ${entries.length}`;
  }

  if (marketInfoEl) {
    const lines = [
      `Money: $${game.money}`,
      '',
      `${current.tokenName || 'Tokens'}: ${tokens}`,
      sellItem ? `${sellItem.name || 'Products'}: ${products}` : '',
      `Buy token: $${tokenPrice}`,
      sellItem ? `Sell product: $${productPrice}` : '',
    ];
    marketInfoEl.innerText = lines.filter(Boolean).join('\n');
  }

  if (marketSellBtn) {
    if (sellItem) {
      marketSellBtn.disabled = false;
      marketSellBtn.innerText = `Sell 1 ${sellItem.name || 'Product'} ($${productPrice})`;
    } else {
      marketSellBtn.disabled = true;
      marketSellBtn.innerText = 'Sell (N/A)';
    }
  }

  if (marketBuyBtn) {
    marketBuyBtn.disabled = false;
    marketBuyBtn.innerText = `Buy 1 ${current.tokenName || 'Token'} ($${tokenPrice})`;
  }
}

function getCurrentMarketCropId() {
  if (marketMode !== 'crops') return null;
  if (marketCropList.length === 0) return null;
  if (marketCropIndex >= marketCropList.length) {
    marketCropIndex = 0;
  } else if (marketCropIndex < 0) {
    marketCropIndex = marketCropList.length - 1;
  }
  return marketCropList[marketCropIndex];
}

function cycleMarketSelection(direction) {
  if (marketMode === 'tokens') {
    cycleTokenSelection(direction);
    return;
  }
  cycleMarketCrop(direction);
}

function cycleMarketCrop(direction) {
  if (!marketCropList.length || marketLockNavigation || marketCropList.length <= 1) {
    return;
  }
  marketCropIndex =
    (marketCropIndex + direction + marketCropList.length) %
    marketCropList.length;
  updateMarketUI();
}

// ----- Market actions -----

function updateMarketNavState() {
  let disableNav = true;

  if (marketMode === 'crops') {
    disableNav = marketLockNavigation || marketCropList.length <= 1;
  } else if (
    marketMode === 'tokens' &&
    tokenMarketConfig &&
    tokenMarketConfig.entries &&
    tokenMarketConfig.entries.length > 1
  ) {
    disableNav = false;
  }

  if (marketPrevBtn) {
    marketPrevBtn.disabled = disableNav;
    marketPrevBtn.style.opacity = disableNav ? '0.4' : '1';
  }

  if (marketNextBtn) {
    marketNextBtn.disabled = disableNav;
    marketNextBtn.style.opacity = disableNav ? '0.4' : '1';
  }
}

function setMarketStatus(text) {
  if (!marketStatusEl) return;
  marketStatusEl.innerText = text;
}

function handleSellCrop(cropType) {
  const def = CROP_TYPES[cropType];
  if (!def) return;
  const sellPrice = Math.max(0, def.sellPrice + marketPriceAdjust.sell);

  const count = game.inventory[def.cropId] || 0;
  if (count <= 0) {
    setMarketStatus(`You have no ${def.displayName} to sell.`);
    return;
  }

  game.inventory[def.cropId] = count - 1;
  game.money += sellPrice;

  setMarketStatus(
    `Sold 1 ${def.displayName} for $${sellPrice}.`
  );
  updateMarketUI();
  updateInventoryUI();
  updateHUD();
  scheduleAutosave('market_sell_crop');
}

function handleBuySeed(cropType) {
  const def = CROP_TYPES[cropType];
  if (!def) return;
  const seedPrice = Math.max(0, def.seedPrice + marketPriceAdjust.buy);

  const money = game.money;
  if (money < seedPrice) {
    setMarketStatus(
      `Not enough money. Need $${seedPrice} for ${def.displayName} seed.`
    );
    return;
  }

  game.money -= seedPrice;
  game.inventory[def.seedId] = (game.inventory[def.seedId] || 0) + 1;

  setMarketStatus(
    `Bought 1 ${def.displayName} seed for $${seedPrice}.`
  );
  updateMarketUI();
  updateInventoryUI();
  updateHUD();
  scheduleAutosave('market_buy_seed');
}

function handleSellTokenItem() {
  if (
    !tokenMarketConfig ||
    !tokenMarketConfig.sellItem ||
    !tokenMarketConfig.sellItem.id
  ) {
    return;
  }
  const sellItem = tokenMarketConfig.sellItem;
  const price = sellItem.price || 0;
  const key = sellItem.id;
  const name = sellItem.name || 'Product';
  const current = game.inventory[key] || 0;

  if (current <= 0) {
    setMarketStatus(`You have no ${name} to sell.`);
    return;
  }

  game.inventory[key] = current - 1;
  game.money += price;
  setMarketStatus(`Sold 1 ${name} for $${price}.`);
  updateMarketUI();
  updateInventoryUI();
  updateHUD();
  scheduleAutosave('market_sell_token');
}

function handleBuyTokenEntry() {
  if (!tokenMarketConfig || !tokenMarketConfig.entries) return;
  const entries = tokenMarketConfig.entries;
  if (!entries.length) return;
  const current = entries[tokenSelectionIndex] || entries[0];
  if (!current) return;
  const price = current.tokenPrice || 0;
  const key = current.tokenId;
  if (!key) return;
  const name = current.tokenName || 'Token';

  if (game.money < price) {
    setMarketStatus(`Not enough money. Need $${price} for ${name}.`);
    return;
  }

  game.money -= price;
  game.inventory[key] = (game.inventory[key] || 0) + 1;
  setMarketStatus(`Bought 1 ${name} for $${price}.`);
  updateMarketUI();
  updateInventoryUI();
  updateHUD();
  scheduleAutosave('market_buy_token');
}

function cycleTokenSelection(direction) {
  if (
    !tokenMarketConfig ||
    !tokenMarketConfig.entries ||
    tokenMarketConfig.entries.length <= 1
  ) {
    return;
  }

  const len = tokenMarketConfig.entries.length;
  tokenSelectionIndex = (tokenSelectionIndex + direction + len) % len;
  updateTokenMarketUI();
}

function openControlsPanel() {
  if (!controlsPanelEl) return;
  controlsPanelEl.style.display = 'block';
  controlsOpen = true;
}

export function closeControlsPanel() {
  if (!controlsPanelEl) return;
  if (!controlsOpen) return;
  controlsPanelEl.style.display = 'none';
  controlsOpen = false;
}

export function openMathCheck(onSuccess) {
  if (!mathPanelEl || mathPanelOpen) return;
  if (Date.now() < mathLockoutUntil) {
    playInteractionSound(false);
    showMathLockout();
    return;
  }
  pendingMathCallback = typeof onSuccess === 'function' ? onSuccess : null;
  mathPanelOpen = true;
  mathPanelEl.style.display = 'block';
  loadMathQuestion();
  if (document.exitPointerLock) {
    document.exitPointerLock();
  }
}

export function cancelMathCheck() {
  pendingMathCallback = null;
  closeMathPanel();
}

function loadMathQuestion() {
  if (!mathPanelEl || !mathQuestionEl || !mathOptionsEl) return;
  currentMathQuestion = getRandomMathQuestion();
  mathQuestionEl.textContent = currentMathQuestion.prompt;
  mathFeedbackEl.textContent = '';
  mathOptionsEl.innerHTML = '';
  if (mathSaveFeedbackEl) mathSaveFeedbackEl.textContent = '';

  const shuffled = currentMathQuestion.choices
    .map((choice, idx) => ({ choice, idx, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort);

  shuffled.forEach((entry) => {
    const btn = document.createElement('button');
    const label =
      typeof entry.choice === 'object' && entry.choice !== null
        ? entry.choice.text
        : entry.choice;
    btn.textContent = label || 'Choice';
    btn.addEventListener('click', () => handleMathAnswer(entry.idx));
    mathOptionsEl.appendChild(btn);
  });
}

function handleMathAnswer(choiceIndex) {
  if (!currentMathQuestion) return;
  if (choiceIndex === currentMathQuestion.answerIndex) {
    mathFeedbackEl.textContent = 'Correct! Advancing day...';
    const callback = pendingMathCallback;
    pendingMathCallback = null;
    closeMathPanel();
    if (callback) {
      callback();
    }
  } else {
    mathFeedbackEl.textContent = 'Incorrect. Locked out for 30 seconds.';
    playInteractionSound(false);
    startMathLockout();
    closeMathPanel();
  }
}

function closeMathPanel() {
  if (!mathPanelEl) return;
  mathPanelEl.style.display = 'none';
  mathPanelOpen = false;
  mathOptionsEl.innerHTML = '';
  mathFeedbackEl.textContent = '';
  if (mathSaveFeedbackEl) mathSaveFeedbackEl.textContent = '';
  currentMathQuestion = null;
}

function startMathLockout() {
  mathLockoutUntil = Date.now() + 30000;
  showMathLockout();
}

function showMathLockout() {
  if (!mathLockoutTimerEl) return;
  mathLockoutTimerEl.style.display = 'block';
  updateMathLockoutTimer();
  if (lockoutIntervalId) clearInterval(lockoutIntervalId);
  lockoutIntervalId = setInterval(updateMathLockoutTimer, 500);
}

function updateMathLockoutTimer() {
  if (!mathLockoutTimerEl) return;
  const remaining = Math.max(0, mathLockoutUntil - Date.now());
  if (remaining <= 0) {
    mathLockoutTimerEl.style.display = 'none';
    mathLockoutUntil = 0;
    if (lockoutIntervalId) {
      clearInterval(lockoutIntervalId);
      lockoutIntervalId = null;
    }
    return;
  }
  const seconds = Math.ceil(remaining / 1000);
  mathLockoutTimerEl.textContent = `Bed locked for ${seconds}s`;
}
