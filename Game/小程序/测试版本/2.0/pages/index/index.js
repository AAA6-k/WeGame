// pages/index/index.js
const gameData = require('../../utils/gameData');

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
      wx.showToast({ title: `🎉 升级到 Lv.${result.newLevel}！解锁新土地/新作物`, icon: 'none', duration: 2000 });
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

  goShop() {
    wx.switchTab({ url: '/pages/shop/shop' });
  },
});