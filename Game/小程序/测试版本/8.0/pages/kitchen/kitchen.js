// pages/kitchen/kitchen.js
var kitchen = require('../../utils/kitchen');

// 动物产品显示映射
var animalProductMap = {
  animal_egg: { name: '鸡蛋', emoji: '🥚' },
  animal_milk: { name: '牛奶', emoji: '🥛' },
  animal_wool: { name: '羊毛', emoji: '🧶' },
  animal_pork: { name: '猪肉', emoji: '🥩' },
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
      if (key.indexOf('cooked_') === 0) {
        var recipeId = key.replace('cooked_', '');
        var recipe = data.cookingRecipes[recipeId];
        if (recipe) {
          item = { key: key, name: recipe.name, emoji: recipe.emoji, count: count, type: 'cooked' };
        }
      } else if (animalProductMap[key]) {
        var ap = animalProductMap[key];
        item = { key: key, name: ap.name, emoji: ap.emoji, count: count, type: 'animal' };
      } else {
        var crop = data.cropConfig[key];
        if (crop) {
          item = { key: key, name: crop.name, emoji: crop.emoji || '📦', count: count, type: 'crop' };
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

  sellProduct(e) {
    var key = e.currentTarget.dataset.key;
    var count = e.currentTarget.dataset.count || 1;
    var result = kitchen.sellProduct(key, count);
    if (result.success) {
      wx.showToast({ title: result.msg, icon: 'success' });
      this.refreshAll();
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  sellOne(e) {
    var key = e.currentTarget.dataset.key;
    var result = kitchen.sellProduct(key, 1);
    if (result.success) {
      wx.showToast({ title: result.msg, icon: 'success' });
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