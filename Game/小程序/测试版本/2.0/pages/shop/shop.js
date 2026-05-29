// pages/shop/shop.js
const gameData = require('../../utils/gameData');

Page({
  data: {
    gold: 100,
    seeds: 3,
    level: 1,
    cropConfig: {},
    allCropTypes: ['wheat','carrot','tomato','corn','strawberry','watermelon','pumpkin','sunflower'],
  },

  onLoad() {
    const app = getApp();
    this.setData({
      gold: app.globalData.gold,
      seeds: app.globalData.seeds,
      level: app.globalData.level,
      cropConfig: app.globalData.cropConfig,
    });
  },

  onShow() {
    const app = getApp();
    this.setData({
      gold: app.globalData.gold,
      seeds: app.globalData.seeds,
      level: app.globalData.level,
    });
  },

  buySeed(e) {
    const cropType = e.currentTarget.dataset.type;
    const result = gameData.buySeed(cropType);

    if (result.success) {
      wx.showToast({ title: result.msg, icon: 'success' });
      this.setData({
        gold: gameData.getData().gold,
        seeds: gameData.getData().seeds,
      });
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  goFarm() {
    wx.switchTab({ url: '/pages/index/index' });
  },
});