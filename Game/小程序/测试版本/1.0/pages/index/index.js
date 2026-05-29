// pages/index/index.js
const gameData = require('../../utils/gameData');

Page({
  data: {
    gold: 100,
    seeds: 3,
    lands: [],
    cropConfig: {},
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
    this.setData({
      gold: app.globalData.gold,
      seeds: app.globalData.seeds,
      lands: gameData.cloneLands(),
      cropConfig: app.globalData.cropConfig,
    });
    this.startGrowthTimer();
  },

  onShow() {
    const app = getApp();
    // 使用深拷贝确保 setData 能检测到变化并触发 UI 更新
    this.setData({
      gold: app.globalData.gold,
      seeds: app.globalData.seeds,
      lands: gameData.cloneLands(),
    });
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },

  // 启动生长定时器
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

    if (land.stage === 0) {
      // 空地 → 选择种子种植
      if (this.data.seeds <= 0) {
        wx.showToast({ title: '没有种子了，去商店购买吧', icon: 'none' });
        return;
      }
      this.setData({
        showSeedPicker: true,
        targetLandId: landId,
      });
    } else if (land.stage === 4) {
      // 成熟 → 收获
      this.harvestCrop(landId);
    } else {
      // 生长中 → 浇水
      this.waterCrop(landId);
    }
  },

  // 选择种子
  onSelectSeed(e) {
    const cropType = e.currentTarget.dataset.type;
    this.setData({ selectedCrop: cropType });
  },

  // 确认种植
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

    // 播放种菜动画
    this.playPlantAnimation(targetLandId);

    this.setData({
      showSeedPicker: false,
      selectedCrop: null,
      targetLandId: -1,
      seeds: gameData.getData().seeds,
      lands: gameData.cloneLands(),
    });
  },

  // 取消种植
  onCancelPlant() {
    this.setData({
      showSeedPicker: false,
      selectedCrop: null,
      targetLandId: -1,
    });
  },

  // 种菜动画
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
      // 动画结束后清除 animState
      const lands = gameData.cloneLands();
      if (lands[landId]) lands[landId].animState = '';
      gameData.getData().lands[landId].animState = '';
      gameData.save();
      this.setData({ lands });
    }, 1200);
  },

  // 浇水
  waterCrop(landId) {
    const result = gameData.waterLand(landId);
    if (!result.success) {
      wx.showToast({ title: result.msg, icon: 'none' });
      return;
    }

    // 播放浇水动画
    this.playWaterAnimation(landId);

    this.setData({ lands: gameData.cloneLands() });
  },

  // 浇水动画
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

  // 收获
  harvestCrop(landId) {
    const result = gameData.harvestLand(landId);
    if (!result.success) {
      wx.showToast({ title: result.msg, icon: 'none' });
      return;
    }

    // 播放收菜动画 + 金币飞入
    this.playHarvestAnimation(landId, result.reward);

    this.setData({
      lands: gameData.cloneLands(),
      gold: gameData.getData().gold,
    });
  },

  // 收菜动画
  playHarvestAnimation(landId, reward) {
    const anims = this.data.harvestAnimations;
    anims.push(landId);
    this.setData({ harvestAnimations: anims });

    // 金币飞入动画
    const coinAnims = this.data.coinAnimations;
    coinAnims.push({ id: landId, reward });
    this.setData({ coinAnimations: coinAnims });

    setTimeout(() => {
      // 清除收获动画
      const hIdx = this.data.harvestAnimations.indexOf(landId);
      if (hIdx > -1) {
        const newAnims = [...this.data.harvestAnimations];
        newAnims.splice(hIdx, 1);
        this.setData({ harvestAnimations: newAnims });
      }
      // 清除金币动画
      const cIdx = this.data.coinAnimations.findIndex(c => c.id === landId);
      if (cIdx > -1) {
        const newCoins = [...this.data.coinAnimations];
        newCoins.splice(cIdx, 1);
        this.setData({ coinAnimations: newCoins });
      }
      // 重置土地
      gameData.resetLand(landId);
      this.setData({ lands: gameData.cloneLands() });
    }, 1200);
  },

  // 获取阶段信息（WXML 中调用）
  getStageInfo(stage, cropType) {
    const config = this.data.cropConfig[cropType];
    return gameData.getStageInfo(stage, config);
  },

  // 获取剩余时间
  getRemainTime(land) {
    return gameData.getRemainTime(land);
  },

  // 阻止事件冒泡（空函数，供 catchtap 使用）
  noBubble() {},

  // 跳转商店
  goShop() {
    wx.switchTab({ url: '/pages/shop/shop' });
  },
});
