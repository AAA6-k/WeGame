// pages/animals/animals.js
var animalsUtil = require('../../utils/animals');

Page({
  data: {
    gold: 100, seeds: 3, level: 1,
    animals: [], animalConfig: {},
    showBuyArea: false,
  },

  onLoad() {
    var self = this;
    this.refreshData();
    this.timer = setInterval(function() {
      var app = getApp();
      var list = app.globalData.animals || [];
      if (list.length === 0) return;
      animalsUtil.updateAnimals();
      self.refreshTimes();
    }, 1000);
  },

  onShow() { this.refreshData(); },

  onUnload() { if (this.timer) clearInterval(this.timer); },

  refreshData() {
    var app = getApp();
    animalsUtil.updateAnimals();
    this.setData({
      gold: app.globalData.gold, seeds: app.globalData.seeds,
      level: app.globalData.level, animals: app.globalData.animals || [],
      animalConfig: animalsUtil.animalConfig,
    });
    this.refreshTimes();
  },

  refreshTimes() {
    var animals = this.data.animals.slice();
    var changed = false;
    for (var i = 0; i < animals.length; i++) {
      var a = animals[i];
      var r = animalsUtil.getAnimalRemainTime(a);
      if (a._r !== r) { a._r = r; changed = true; }
    }
    if (changed) this.setData({ animals: animals });
  },

  onAnimalTap(e) {
    var idx = e.currentTarget.dataset.index;
    var animal = this.data.animals[idx];
    if (!animal) return;
    if (animal.productReady) this.collect(idx);
    else this.feed(idx);
  },

  feed(idx) {
    var app = getApp();
    if (app.globalData.seeds <= 0) {
      wx.showToast({ title: '没有种子可以喂食', icon: 'none' }); return;
    }
    var a = this.data.animals[idx];
    var r = animalsUtil.feedAnimal(a.id);
    if (r.success) {
      wx.showToast({ title: '喂食成功！', icon: 'success' });
      var animals = app.globalData.animals;
      for (var i = 0; i < animals.length; i++) {
        animals[i]._r = animalsUtil.getAnimalRemainTime(animals[i]);
      }
      this.setData({ seeds: app.globalData.seeds, animals: animals });
    } else wx.showToast({ title: r.msg, icon: 'none' });
  },

  collect(idx) {
    var a = this.data.animals[idx];
    var r = animalsUtil.collectProduct(a.id);
    if (r.success) {
      wx.showToast({ title: '收取 ' + r.productName + ' x1！', icon: 'success' });
      var animals = getApp().globalData.animals;
      for (var i = 0; i < animals.length; i++) {
        animals[i]._r = animalsUtil.getAnimalRemainTime(animals[i]);
      }
      this.setData({ gold: getApp().globalData.gold, animals: animals });
    } else wx.showToast({ title: r.msg, icon: 'none' });
  },

  toggleBuy() { this.setData({ showBuyArea: !this.data.showBuyArea }); },

  buyAnimal(e) {
    var t = e.currentTarget.dataset.type;
    var c = animalsUtil.animalConfig[t];
    if (!c) return;
    var app = getApp();
    var r = animalsUtil.buyAnimal(t);
    if (r.success) {
      wx.showToast({ title: r.msg, icon: 'success' });
      this.setData({ gold: app.globalData.gold, animals: app.globalData.animals, showBuyArea: false });
      this.refreshTimes();
    } else wx.showToast({ title: r.msg, icon: 'none' });
  },

  goShop() { wx.switchTab({ url: '/pages/shop/shop' }); },
});