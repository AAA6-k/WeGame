// pages/kitchen/kitchen.js
var kitchen = require('../../utils/kitchen');

// 动物产品显示映射
var animalProductMap = {
  animal_egg: { name: '鸡蛋', emoji: '🥚', price: 25 },
  animal_milk: { name: '牛奶', emoji: '🥛', price: 60 },
  animal_wool: { name: '羊毛', emoji: '🧶', price: 90 },
  animal_pork: { name: '猪肉', emoji: '🥩', price: 150 },
};

Page({
  data: {
    tab: 'cook',
    cookingRecipes: {},
    inventory: {},
    inventoryList: [],
    orders: [],
    orderRefreshTime: 0,
    orderTimeLeft: 0,
    orderCanRefresh: false,
    selectedRecipe: null,
    gold: 0, level: 1, skillPoints: 0,
    exp: 0, totalExp: 0, cropConfig: {},
    // 出售弹窗
    showSellModal: false,
    sellItem: null,
    sellCount: 1,
    sellPrice: 0,
  },

  onLoad() {
    this.refreshAll();
  },

  onShow() {
    this.refreshAll();
  },

  refreshAll() {
    var app = getApp();
    var data = app.globalData;
    var now = Date.now();
    var refreshTime = data.orderNextRefresh || 0;
    var canRefresh = refreshTime <= now;
    var timeLeft = canRefresh ? 0 : Math.ceil((refreshTime - now) / 1000 / 60);

    var inventory = data.inventory || {};
    var inventoryList = [];
    for (var key in inventory) {
      var count = inventory[key];
      var item = {};
      var price = 0;
      if (key.indexOf('cooked_') === 0) {
        var recipeId = key.replace('cooked_', '');
        var recipe = data.cookingRecipes[recipeId];
        if (recipe) {
          price = recipe.price;
          item = { key: key, name: recipe.name, emoji: recipe.emoji, count: count, type: 'cooked', price: price };
        }
      } else if (animalProductMap[key]) {
        var ap = animalProductMap[key];
        price = ap.price;
        item = { key: key, name: ap.name, emoji: ap.emoji, count: count, type: 'animal', price: price };
      } else {
        var crop = data.cropConfig[key];
        if (crop) {
          price = crop.price;
          item = { key: key, name: crop.name, emoji: crop.emoji || '📦', count: count, type: 'crop', price: price };
        }
      }
      if (item.key) inventoryList.push(item);
    }

    this.setData({
      inventory: inventory, inventoryList: inventoryList,
      orders: data.orders || [], orderRefreshTime: refreshTime,
      orderTimeLeft: timeLeft, orderCanRefresh: canRefresh,
      gold: data.gold, level: data.level, skillPoints: data.skillPoints,
      exp: data.exp, totalExp: data.levelExp[data.level] || 999,
      cropConfig: data.cropConfig, cookingRecipes: data.cookingRecipes,
    });
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  selectRecipe(e) {
    var recipeId = e.currentTarget.dataset.id;
    var recipe = this.data.cookingRecipes[recipeId];
    if (!recipe) return;
    this.setData({ selectedRecipe: recipeId });
  },

  doCook(e) {
    var recipeId = e.currentTarget.dataset.id;
    var result = kitchen.cook(recipeId);
    if (result.success) {
      wx.showToast({ title: result.msg, icon: 'success' });
      this.refreshAll();
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  // 出售弹窗
  openSellModal(e) {
    var idx = e.currentTarget.dataset.index;
    var item = this.data.inventoryList[idx];
    if (!item) return;
    var count = 1;
    var totalPrice = item.price * count;
    this.setData({
      showSellModal: true,
      sellItem: item,
      sellCount: count,
      sellPrice: totalPrice,
    });
  },

  closeSellModal() {
    this.setData({ showSellModal: false, sellItem: null, sellCount: 1, sellPrice: 0 });
  },

  onSellCountInput(e) {
    var val = parseInt(e.detail.value) || 0;
    var item = this.data.sellItem;
    if (val < 1) val = 1;
    if (val > item.count) val = item.count;
    this.setData({ sellCount: val, sellPrice: item.price * val });
  },

  confirmSell() {
    var item = this.data.sellItem;
    var count = this.data.sellCount;
    var result = kitchen.sellProduct(item.key, count);
    if (result.success) {
      wx.showToast({ title: result.msg, icon: 'success' });
      this.setData({ showSellModal: false, sellItem: null, sellCount: 1, sellPrice: 0 });
      this.refreshAll();
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  refreshOrders() {
    var result = kitchen.refreshOrders();
    if (result.success) {
      wx.showToast({ title: result.msg, icon: 'success' });
      this.refreshAll();
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  completeOrder(e) {
    var orderId = e.currentTarget.dataset.id;
    var result = kitchen.completeOrder(orderId);
    if (result.success) {
      wx.showToast({ title: result.msg, icon: 'success' });
      this.refreshAll();
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },
});