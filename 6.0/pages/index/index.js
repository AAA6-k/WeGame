// pages/index/index.js
const gameData = require('../../utils/gameData');
const hybrid = require('../../utils/hybrid');

Page({
  data: {
    gold: 100,
    seeds: 3,
    level: 1,
    exp: 0,
    expMax: 50,
    expPercent: 0,
    lands: [],
    cropConfig: {},
    availableCropTypes: [],
    selectedCrop: null,
    showSeedPicker: false,
    targetLandId: -1,
    coinAnimations: [],
    waterAnimations: [],
    plantAnimations: [],
    harvestAnimations: [],
    breedMode: false,
    selectedLands: [],
  },

  timer: null,

  onLoad() {
    const app = getApp();
    this.refreshAllData(app);
    this.startGrowthTimer();
  },

  onShow() {
    const app = getApp();
    this.refreshAllData(app);
  },

  refreshAllData(app) {
    const expMax = app.getLevelUpExp();
    const prevExp = app.globalData.levelExp[app.globalData.level - 1] || 0;
    let expPercent = 0;
    if (expMax > prevExp) {
      expPercent = Math.min(100, Math.round((app.globalData.exp - prevExp) / (expMax - prevExp) * 100));
    }
    this.setData({
      gold: app.globalData.gold,
      seeds: app.globalData.seeds,
      level: app.globalData.level,
      skillPoints: app.globalData.skillPoints || 0,
      exp: app.globalData.exp,
      expMax: expMax,
      expPercent: expPercent,
      lands: gameData.cloneLands(),
      cropConfig: app.globalData.cropConfig,
      availableCropTypes: app.getAvailableCropTypes(),
    });
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },

  startGrowthTimer() {
    this.timer = setInterval(() => {
      const updates = gameData.updateGrowth();
      if (updates.length > 0) {
        this.setData({ lands: gameData.cloneLands() });
      }
    }, 500);
  },

  // 点击土地
  onLandTap(e) {
    const landId = e.currentTarget.dataset.id;
    const land = this.data.lands[landId];
    const app = getApp();

    // 检查土地是否解锁
    if (app.globalData.level < land.unlockLevel) {
      wx.showToast({ title: `Lv.${land.unlockLevel} 解锁该土地`, icon: 'none' });
      return;
    }

    // 杂交模式
    if (this.data.breedMode) {
      if (land.stage !== 4) {
        wx.showToast({ title: '只能选择成熟作物进行杂交', icon: 'none' });
        return;
      }
      this.onSelectBreedLand(landId);
      return;
    }

    if (land.stage === 0) {
      if (this.data.seeds <= 0) {
        wx.showToast({ title: '没有种子了，去商店购买吧', icon: 'none' });
        return;
      }
      this.setData({
        showSeedPicker: true,
        targetLandId: landId,
      });
    } else if (land.stage === 4) {
      this.harvestCrop(landId);
    } else {
      this.waterCrop(landId);
    }
  },

  onSelectSeed(e) {
    const cropType = e.currentTarget.dataset.type;
    this.setData({ selectedCrop: cropType });
  },

  onConfirmPlant() {
    const { targetLandId, selectedCrop } = this.data;
    if (!selectedCrop) {
      wx.showToast({ title: '请先选择种子', icon: 'none' });
      return;
    }
    const result = gameData.plantCrop(targetLandId, selectedCrop);
    if (!result.success) {
      wx.showToast({ title: result.msg, icon: 'none' });
      return;
    }
    this.playPlantAnimation(targetLandId);
    this.setData({
      showSeedPicker: false,
      selectedCrop: null,
      targetLandId: -1,
      seeds: gameData.getData().seeds,
      lands: gameData.cloneLands(),
    });
  },

  onCancelPlant() {
    this.setData({
      showSeedPicker: false,
      selectedCrop: null,
      targetLandId: -1,
    });
  },

  playPlantAnimation(landId) {
    const anims = this.data.plantAnimations;
    anims.push(landId);
    this.setData({ plantAnimations: anims });

    setTimeout(() => {
      const idx = this.data.plantAnimations.indexOf(landId);
      if (idx > -1) {
        const newAnims = [...this.data.plantAnimations];
        newAnims.splice(idx, 1);
        this.setData({ plantAnimations: newAnims });
      }
      const lands = gameData.cloneLands();
      if (lands[landId]) lands[landId].animState = '';
      gameData.getData().lands[landId].animState = '';
      gameData.save();
      this.setData({ lands });
    }, 1200);
  },

  waterCrop(landId) {
    const result = gameData.waterLand(landId);
    if (!result.success) {
      wx.showToast({ title: result.msg, icon: 'none' });
      return;
    }
    this.playWaterAnimation(landId);
    this.setData({ lands: gameData.cloneLands() });
  },

  playWaterAnimation(landId) {
    const anims = this.data.waterAnimations;
    anims.push(landId);
    this.setData({ waterAnimations: anims });

    setTimeout(() => {
      const idx = this.data.waterAnimations.indexOf(landId);
      if (idx > -1) {
        const newAnims = [...this.data.waterAnimations];
        newAnims.splice(idx, 1);
        this.setData({ waterAnimations: newAnims });
      }
      const lands = gameData.cloneLands();
      if (lands[landId]) lands[landId].animState = '';
      gameData.getData().lands[landId].animState = '';
      gameData.save();
      this.setData({ lands });
    }, 1500);
  },

  harvestCrop(landId) {
    const result = gameData.harvestLand(landId);
    if (!result.success) {
      wx.showToast({ title: result.msg, icon: 'none' });
      return;
    }
    this.playHarvestAnimation(landId, result.reward);

    // 升级提示
    if (result.leveledUp) {
      wx.showToast({ title: `升级到 Lv.${result.newLevel}！获得 2 技能点`, icon: 'none', duration: 2000 });
    }

    // 里程碑提示
    if (result.milestoneMsg) {
      setTimeout(() => {
        wx.showToast({ title: result.milestoneMsg, icon: 'none', duration: 2000 });
      }, 2200);
    }

    const app = getApp();
    this.refreshAllData(app);
  },

  playHarvestAnimation(landId, reward) {
    const anims = this.data.harvestAnimations;
    anims.push(landId);
    this.setData({ harvestAnimations: anims });

    const coinAnims = this.data.coinAnimations;
    coinAnims.push({ id: landId, reward });
    this.setData({ coinAnimations: coinAnims });

    setTimeout(() => {
      const hIdx = this.data.harvestAnimations.indexOf(landId);
      if (hIdx > -1) {
        const newAnims = [...this.data.harvestAnimations];
        newAnims.splice(hIdx, 1);
        this.setData({ harvestAnimations: newAnims });
      }
      const cIdx = this.data.coinAnimations.findIndex(c => c.id === landId);
      if (cIdx > -1) {
        const newCoins = [...this.data.coinAnimations];
        newCoins.splice(cIdx, 1);
        this.setData({ coinAnimations: newCoins });
      }
      gameData.resetLand(landId);
      const app = getApp();
      this.refreshAllData(app);
    }, 1200);
  },

  getStageInfo(stage, cropType) {
    const config = this.data.cropConfig[cropType];
    return gameData.getStageInfo(stage, config);
  },

  getRemainTime(land) {
    return gameData.getRemainTime(land);
  },

  noBubble() {},

  // 杂交模式开关
  toggleBreedMode() {
    const newMode = !this.data.breedMode;
    // 清除之前的选中状态
    if (!newMode) {
      const lands = gameData.cloneLands();
      lands.forEach(l => l.selected = false);
      gameData.getData().lands.forEach(l => l.selected = false);
      gameData.save();
      this.setData({ breedMode: false, selectedLands: [], lands });
    } else {
      this.setData({ breedMode: true, selectedLands: [] });
    }
  },

  // 杂交时选中一块土地
  onSelectBreedLand(landId) {
    let selectedLands = [...this.data.selectedLands];
    const idx = selectedLands.indexOf(landId);
    if (idx > -1) {
      selectedLands.splice(idx, 1);
    } else {
      if (selectedLands.length >= 2) {
        wx.showToast({ title: '最多选择2块土地', icon: 'none' });
        return;
      }
      selectedLands.push(landId);
    }

    // 更新 lands 的 selected 状态
    const lands = gameData.cloneLands();
    lands.forEach(l => { l.selected = selectedLands.indexOf(l.id) > -1; });
    gameData.getData().lands.forEach(l => { l.selected = selectedLands.indexOf(l.id) > -1; });
    gameData.save();

    this.setData({ selectedLands, lands });

    // 如果选了2块，检查相邻性并触发杂交
    if (selectedLands.length === 2) {
      const result = hybrid.breed(selectedLands[0], selectedLands[1]);
      if (!result.success) {
        wx.showToast({ title: result.msg || '杂交失败', icon: 'none' });
        // 取消选中
        const resetLands = gameData.cloneLands();
        resetLands.forEach(l => l.selected = false);
        gameData.getData().lands.forEach(l => l.selected = false);
        gameData.save();
        this.setData({ selectedLands: [], lands: resetLands });
        return;
      }

      wx.showToast({ title: `杂交成功！获得 ${result.cropName}` + (result.isNewDiscovery ? '，新配方+1技能点' : ''), icon: 'none', duration: 2000 });

      // 清空两块土地并种植新作物
      gameData.resetLand(selectedLands[0]);
      gameData.resetLand(selectedLands[1]);
      const plantResult = gameData.plantCrop(selectedLands[1], result.cropType);
      if (!plantResult.success) {
        gameData.plantCrop(selectedLands[0], result.cropType);
      }

      const app = getApp();
      this.refreshAllData(app);
    }
  },

  goShop() {
    wx.switchTab({ url: '/pages/shop/shop' });
  },
});