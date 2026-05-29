// js/input.js - 触摸输入处理
const CONFIG = require('./config.js');
const Player = require('./player.js');
const Farm = require('./farm.js');
const Renderer = require('./renderer.js');

function s(v) { return Renderer.s ? Renderer.s(v) : v * (wx.getSystemInfoSync().windowWidth / 375); }

function inRect(x, y, rx, ry, rw, rh) {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

function toast(uiState, msg, duration) {
  uiState.toast = msg;
  if (uiState._toastTimer) clearTimeout(uiState._toastTimer);
  uiState._toastTimer = setTimeout(function() { uiState.toast = null; }, duration || 1500);
}

function flashLevel(uiState, lv) {
  uiState.levelUpFlash = lv;
  if (uiState._flashTimer) clearTimeout(uiState._flashTimer);
  uiState._flashTimer = setTimeout(function() { uiState.levelUpFlash = null; }, 2000);
}

// ===== 面板布局（与 renderer.js 一致） =====
var P = {}; // 缓存各面板布局
function getPanelLayout(panelName, extra) {
  var W = wx.getSystemInfoSync().windowWidth;
  var H = wx.getSystemInfoSync().windowHeight;
  var key = panelName + '_' + W + '_' + H;
  if (P[key]) return P[key];

  var layout = { W: W, H: H, canvasW: W, canvasH: H };

  if (panelName === 'shop') {
    var panelW = W - s(32);
    var panelH = Math.min(H - s(140), s(420));
    layout.px = s(16);
    layout.py = (H - panelH) / 2;
    layout.panelW = panelW;
    layout.panelH = panelH;
    layout.titleH = s(56);
    layout.listY = layout.py + layout.titleH + s(4);
    layout.itemH = s(60);
    layout.btnW = s(52);
    layout.btnH = s(28);
  } else if (panelName === 'skill') {
    var panelW = W - s(32);
    var panelH = Math.min(H - s(140), s(460));
    layout.px = s(16);
    layout.py = (H - panelH) / 2;
    layout.panelW = panelW;
    layout.panelH = panelH;
    layout.titleH = s(56);
    layout.listY = layout.py + layout.titleH + s(4);
    layout.itemH = s(68);
    layout.btnW = s(49);
    layout.btnH = s(26);
  } else if (panelName === 'kitchen') {
    layout.px = s(12);
    layout.py = s(90);
    layout.panelW = W - s(24);
    layout.panelH = Math.min(H - s(120), s(500));
    layout.titleH = s(44);
    layout.tabY = layout.py + layout.titleH + s(6);
    layout.tabH = s(30);
    layout.tabW = layout.panelW / 3;
    layout.contentY = layout.tabY + s(38);
    layout.cellW = (layout.panelW - s(20)) / 4;
    layout.cellH = s(76);
    layout.invItemH = s(48);
    layout.orderItemH = s(64);
  } else if (panelName === 'plantSelect') {
    var crops = extra || [];
    var itemH = s(56);
    var panelH = crops.length * itemH + s(60);
    layout.px = s(25);
    layout.py = (H - panelH) / 2;
    layout.panelW = W - s(50);
    layout.panelH = panelH;
    layout.itemH = itemH;
    layout.listY = layout.py + s(60);
  }

  P[key] = layout;
  return layout;
}

// ===== 主入口 =====
function handleTouch(x, y, uiState) {
  var H = wx.getSystemInfoSync().windowHeight;
  var bottomH = s(72);

  // 关闭所有面板（点击面板外部）
  if (uiState.activePanel && !isInsidePanel(x, y, uiState)) {
    closePanel(uiState);
    return;
  }

  // Toast 期间只允许关闭面板
  if (uiState.toast) return;

  // 面板内交互
  if (uiState.activePanel) {
    handlePanelTouch(x, y, uiState);
    return;
  }

  // 底部工具栏
  if (y >= H - bottomH) {
    var btnW = wx.getSystemInfoSync().windowWidth / 4;
    var idx = Math.floor(x / btnW);
    if (idx === 0) uiState.activePanel = 'shop';
    else if (idx === 1) toggleBreedMode(uiState);
    else if (idx === 2) uiState.activePanel = 'skill';
    else if (idx === 3) { uiState.activePanel = 'kitchen'; uiState.kitchenTab = 0; }
    return;
  }

  // 杂交模式
  if (uiState.breedMode) {
    handleBreedTap(x, y, uiState);
    return;
  }

  // 点击土地
  handleLandTap(x, y, uiState);
}

// ===== 面板外部检测 =====
function isInsidePanel(x, y, uiState) {
  if (!uiState.activePanel) return false;
  var L;
  if (uiState.activePanel === 'kitchen') L = getPanelLayout('kitchen');
  else if (uiState.activePanel === 'plantSelect') L = getPanelLayout('plantSelect', uiState.availableCrops);
  else L = getPanelLayout('shop'); // shop & skill 布局相同

  return inRect(x, y, L.px, L.py, L.panelW, L.panelH);
}

function closePanel(uiState) {
  uiState.activePanel = null;
  // 如果来自杂交模式工具栏点击，也关闭杂交模式标记
  // 保留 breedMode 不变（通过工具栏切换）
}

// ===== 面板内触控分发 =====
function handlePanelTouch(x, y, uiState) {
  if (uiState.activePanel === 'shop') handleShopPanelTouch(x, y, uiState);
  else if (uiState.activePanel === 'skill') handleSkillPanelTouch(x, y, uiState);
  else if (uiState.activePanel === 'kitchen') handleKitchenPanelTouch(x, y, uiState);
  else if (uiState.activePanel === 'plantSelect') handlePlantSelectTouch(x, y, uiState);
  else if (uiState.activePanel === 'recipeDetail') handleRecipeDetailTouch(x, y, uiState);
  else if (uiState.activePanel === 'skillDetail') handleSkillDetailTouch(x, y, uiState);
}

// ===== 商店面板 =====
function handleShopPanelTouch(x, y, uiState) {
  var L = getPanelLayout('shop');
  var d = Player.data();
  // 展示所有作物（含未解锁）
  var allCrops = Object.keys(CONFIG.cropConfig);

  for (var i = 0; i < allCrops.length; i++) {
    var iy = L.listY + i * L.itemH;
    if (iy + L.itemH > L.py + L.panelH - s(4)) break;

    var cropType = allCrops[i];
    var cfg = CONFIG.cropConfig[cropType];
    var unlocked = Player.getAvailableCrops().indexOf(cropType) >= 0;
    if (!unlocked) continue; // 未解锁跳过（不显示购买按钮）

    var seedPrice = Player.getSeedPrice(cropType);
    var btnX = L.px + L.panelW - s(58);
    var btnY = iy + (L.itemH - L.btnH) / 2;

    if (inRect(x, y, btnX, btnY, L.btnW, L.btnH)) {
      if (d.gold < seedPrice) { toast(uiState, '金币不足！需要' + seedPrice + '金'); return; }
      d.gold -= seedPrice;
      d.seeds++;
      toast(uiState, '购买成功！获得 ' + cfg.name + ' 种子 x1');
      return;
    }
  }
}

// ===== 技能面板 =====
function handleSkillPanelTouch(x, y, uiState) {
  var L = getPanelLayout('skill');
  var d = Player.data();
  var skills = CONFIG.skillTree;
  var keys = Object.keys(skills);

  for (var i = 0; i < keys.length; i++) {
    var iy = L.listY + i * L.itemH;
    var key = keys[i];
    var learned = d.learnedSkills[key] || 0;

    // 点击技能项显示详情
    if (inRect(x, y, L.px + s(8), iy, L.panelW - s(16), L.itemH)) {
      uiState.activePanel = 'skillDetail';
      uiState.skillDetail = {
        key: key,
        name: skills[key].name,
        currentLevel: learned,
        maxLevel: 5,
        levels: skills[key].levels
      };
      return;
    }

    var btnX = L.px + L.panelW - s(55);
    var btnY = iy + (L.itemH - L.btnH) / 2;

    if (inRect(x, y, btnX, btnY, L.btnW, L.btnH)) {
      if (learned >= 5) { toast(uiState, skills[key].name + ' 已满级'); return; }
      var cost = skills[key].levels[learned].cost;
      if (d.skillPoints < cost) { toast(uiState, '技能点不足！（需要' + cost + '点）'); return; }
      d.skillPoints -= cost;
      d.learnedSkills[key] = learned + 1;
      toast(uiState, skills[key].name + ' 升级至 Lv.' + (learned + 1) + '!');
      return;
    }
  }
}

// ===== 配方详情面板 =====
function handleRecipeDetailTouch(x, y, uiState) {
  var s = Renderer.s;
  var W = wx.getSystemInfoSync().windowWidth;
  var H = wx.getSystemInfoSync().windowHeight;
  var d = Player.data();
  var detail = uiState.recipeDetail;
  
  // 面板位置
  var panelW = s(300);
  var panelH = s(240);
  var panelX = (W - panelW) / 2;
  var panelY = (H - panelH) / 2;
  
  // 关闭按钮
  var closeBtnX = panelX + panelW - s(30);
  var closeBtnY = panelY + s(10);
  if (inRect(x, y, closeBtnX, closeBtnY, s(20), s(20))) {
    uiState.activePanel = null;
    return;
  }
  
  // 确认按钮
  var confirmBtnX = panelX + (panelW - s(120)) / 2;
  var confirmBtnY = panelY + panelH - s(50);
  if (inRect(x, y, confirmBtnX, confirmBtnY, s(120), s(35))) {
    // 检查原料
    var missing = '';
    for (var ing in detail.ingredients) {
      if ((d.inventory[ing] || 0) < detail.ingredients[ing]) {
        missing += (missing ? ', ' : '') + ing + '不足';
      }
    }
    if (missing) { 
      toast(uiState, '原料不足：' + missing, 2000); 
      return; 
    }
    
    var Kitchen = require('./kitchen.js');
    var result = Kitchen.cook(detail.id);
    toast(uiState, result.msg, 2000);
    if (result.leveledUp) flashLevel(uiState, d.level);
    uiState.activePanel = null;
    return;
  }
}

// ===== 技能详情弹窗 =====
function handleSkillDetailTouch(x, y, uiState) {
  var s = Renderer.s;
  var W = wx.getSystemInfoSync().windowWidth;
  var H = wx.getSystemInfoSync().windowHeight;
  var d = Player.data();
  var detail = uiState.skillDetail;

  var panelW = s(300);
  var panelH = s(260);
  var panelX = (W - panelW) / 2;
  var panelY = (H - panelH) / 2;

  // 关闭按钮
  var closeBtnX = panelX + panelW - s(30);
  var closeBtnY = panelY + s(10);
  if (inRect(x, y, closeBtnX, closeBtnY, s(20), s(20))) {
    uiState.activePanel = null;
    return;
  }

  // 当前等级 < 满级时，显示升级按钮
  if (detail.currentLevel < detail.maxLevel) {
    var level = detail.levels[detail.currentLevel];
    var btnW = s(120);
    var btnH = s(36);
    var btnX = panelX + (panelW - btnW) / 2;
    var btnY = panelY + panelH - btnH - s(12);

    if (inRect(x, y, btnX, btnY, btnW, btnH)) {
      if (d.skillPoints < level.cost) {
        toast(uiState, '技能点不足！（需要' + level.cost + '点）');
        return;
      }
      d.skillPoints -= level.cost;
      d.learnedSkills[detail.key] = detail.currentLevel + 1;
      detail.currentLevel += 1;
      toast(uiState, detail.name + ' 升级至 Lv.' + detail.currentLevel + '!');
      if (detail.currentLevel >= detail.maxLevel) {
        uiState.activePanel = null;
      }
      return;
    }
  }
}

// ===== 厨房面板 =====
function handleKitchenPanelTouch(x, y, uiState) {
  var L = getPanelLayout('kitchen');
  var d = Player.data();

  // 子 Tab 点击
  if (inRect(x, y, L.px + s(8), L.tabY, L.tabW - s(16), L.tabH) && (x - L.px - s(8)) / (L.tabW - s(16)) < 1) {
    uiState.kitchenTab = 0;
    return;
  }
  if (inRect(x, y, L.px + L.tabW + s(8), L.tabY, L.tabW - s(16), L.tabH)) {
    uiState.kitchenTab = 1;
    return;
  }
  if (inRect(x, y, L.px + 2 * L.tabW + s(8), L.tabY, L.tabW - s(16), L.tabH)) {
    uiState.kitchenTab = 2;
    return;
  }

  // 烹饪 Tab
  if (uiState.kitchenTab === 0) {
    var recipes = CONFIG.cookingRecipes;
    var keys = Object.keys(recipes);
    for (var i = 0; i < keys.length; i++) {
      var col = i % 4, row = Math.floor(i / 4);
      var cx = L.px + s(8) + col * L.cellW;
      var cy = L.contentY + row * L.cellH;
      if (cy + L.cellH > L.py + L.panelH) break;

      if (inRect(x, y, cx + s(2), cy + s(2), L.cellW - s(4), L.cellH - s(4))) {
        var rid = keys[i];
        var r = recipes[rid];
        var unlocked = d.level >= r.unlockLevel;
        if (!unlocked) { toast(uiState, '需要 Lv.' + r.unlockLevel + ' 解锁'); return; }

        // 显示详情弹窗
        uiState.activePanel = 'recipeDetail';
        uiState.recipeDetail = {
          id: rid,
          name: r.name,
          emoji: r.emoji,
          ingredients: r.ingredients,
          cost: r.cost,
          expReward: r.expReward
        };
        return;
      }
    }
  }

  // 库存 Tab
  if (uiState.kitchenTab === 1) {
    var inv = Player.data().inventory;
    var invKeys = Object.keys(inv);
    for (var i = 0; i < invKeys.length; i++) {
      var iy = L.contentY + i * L.invItemH;
      if (iy + L.invItemH > L.py + L.panelH) break;
      if (inRect(x, y, L.px + s(8), iy, L.panelW - s(16), L.invItemH)) {
        var key = invKeys[i];
        var Kitchen = require('./kitchen.js');
        var result = Kitchen.sellProduct(key, 1);
        toast(uiState, result.msg);
        return;
      }
    }
    return;
  }

  // 订单 Tab
  if (uiState.kitchenTab === 2) {
    var orders = d.orders;

    // 刷新按钮
    var refreshBtnX = L.px + L.panelW - s(75);
    var refreshBtnY = L.contentY - s(34);
    if (inRect(x, y, refreshBtnX, refreshBtnY, s(70), s(28))) {
      var Kitchen = require('./kitchen.js');
      var result = Kitchen.refreshOrders();
      toast(uiState, result.success ? '订单已刷新！' : result.msg);
      return;
    }

    for (var i = 0; i < orders.length; i++) {
      var iy = L.contentY + i * L.orderItemH;
      if (iy + L.orderItemH > L.py + L.panelH) break;
      if (orders[i].completed) continue;

      var submitBtnX = L.px + L.panelW - s(60);
      if (inRect(x, y, submitBtnX, iy + s(12), s(52), s(28))) {
        var Kitchen = require('./kitchen.js');
        var result = Kitchen.completeOrder(orders[i].id);
        toast(uiState, result.msg, 2000);
        if (result.leveledUp) flashLevel(uiState, d.level);
        return;
      }
    }
    return;
  }
}

// ===== 种植选择面板 =====
function handlePlantSelectTouch(x, y, uiState) {
  var crops = uiState.availableCrops || Player.getAvailableCrops() || [];
  var L = getPanelLayout('plantSelect', crops);

  for (var i = 0; i < crops.length; i++) {
    var iy = L.listY + i * L.itemH;
    if (inRect(x, y, L.px + s(8), iy, L.panelW - s(16), L.itemH)) {
      var cropType = crops[i];
      var d = Player.data();
      if (d.seeds <= 0) { toast(uiState, '没有种子了！'); return; }
      var success = Farm.plant(uiState.plantTargetLand, cropType);
      if (success) {
        d.seeds--;
        toast(uiState, '种植成功！' + CONFIG.cropConfig[cropType].name);
      } else {
        toast(uiState, '种植失败');
      }
      uiState.activePanel = null;
      return;
    }
  }
}

// ===== 土地点击 =====
function handleLandTap(x, y, uiState) {
  var rects = Renderer.getLandRects();
  var lands = Farm.lands();
  var d = Player.data();
  var maxLand = Player.getAvailableLandCount();

  for (var i = 0; i < rects.length; i++) {
    var r = rects[i];
    if (!inRect(x, y, r.x, r.y, r.w, r.h)) continue;

    var land = lands[i];
    var unlocked = i < maxLand && d.level >= land.unlockLevel;
    if (!unlocked) { toast(uiState, '需要达到 Lv.' + land.unlockLevel); return; }

    if (land.stage === 0) {
      if (d.seeds <= 0) { toast(uiState, '没有种子了，去商店购买吧'); return; }
      uiState.activePanel = 'plantSelect';
      uiState.plantTargetLand = i;
      uiState.availableCrops = Player.getAvailableCrops() || [];
    } else if (land.stage === 4) {
      var result = Farm.harvest(i);
      if (result && result.success) {
        var msg = '收获 ' + result.cropName + '  +' + result.reward + '金';
        if (result.harvestGain > 0) msg += '  技能点+' + result.harvestGain;
        toast(uiState, msg, 1800);
        if (result.leveledUp) flashLevel(uiState, result.newLevel);
      }
    } else if (land.stage > 0 && land.stage < 4) {
      if (!land.watered) {
        Farm.water(i);
        toast(uiState, '浇水成功！生长加速');
      } else {
        toast(uiState, '已经浇过水了');
      }
    }
    return;
  }
}

// ===== 杂交模式 =====
function handleBreedTap(x, y, uiState) {
  var rects = Renderer.getLandRects();
  var lands = Farm.lands();
  var d = Player.data();
  var maxLand = Player.getAvailableLandCount();

  for (var i = 0; i < rects.length; i++) {
    var r = rects[i];
    if (!inRect(x, y, r.x, r.y, r.w, r.h)) continue;

    var land = lands[i];
    var unlocked = i < maxLand && d.level >= land.unlockLevel;
    if (!unlocked) { toast(uiState, '未解锁'); return; }
    if (land.stage !== 4) { toast(uiState, '需要成熟作物'); return; }

    if (!land.selected) {
      var selected = Farm.getSelectedCount();
      if (selected >= 2) { toast(uiState, '最多选择2块'); return; }
      land.selected = true;
      if (!uiState.breedTargets) uiState.breedTargets = [];
      uiState.breedTargets.push(i);

      if (uiState.breedTargets.length >= 2) {
        var idA = uiState.breedTargets[0];
        var idB = uiState.breedTargets[1];
        var Hybrid = require('./hybrid.js');
        var result = Hybrid.breed(idA, idB);
        toast(uiState, result.msg, 2000);
        resetBreedSelection(uiState);
      }
    }
    return;
  }
}

function toggleBreedMode(uiState) {
  uiState.breedMode = !uiState.breedMode;
  resetBreedSelection(uiState);
  if (!uiState.breedMode) uiState.activePanel = null;
}

function resetBreedSelection(uiState) {
  var lands = Farm.lands();
  for (var i = 0; i < lands.length; i++) lands[i].selected = false;
  uiState.breedTargets = [];
}

module.exports = { handleTouch: handleTouch, toggleBreedMode: toggleBreedMode };
