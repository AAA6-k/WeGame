// pages/shop/shop.js
const gameData = require('../../utils/gameData');

Page({
  data: {
    gold: 100,
    seeds: 3,
    cropConfig: {},
    cropTypes: ['wheat', 'carrot', 'tomato', 'corn'],
  },

  onLoad() {
    const app = getApp();
    this.setData({
      gold: app.globalData.gold,
      seeds: app.globalData.seeds,
      cropConfig: app.globalData.cropConfig,
    });
  },

  onShow() {
    const app = getApp();
    this.setData({
      gold: app.globalData.gold,
      seeds: app.globalData.seeds,
    });
  },

  // 购买种子
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

  // 跳转农场
  goFarm() {
    wx.switchTab({ url: '/pages/index/index' });
  },
});
