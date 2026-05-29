// pages/kitchen/kitchen.js
const kitchen = require('../../utils/kitchen.js');
const gameData = require('../../utils/gameData.js');

Page({
  data: {
    inventory: {},
    cookingRecipes: {},
    selectedRecipe: null,
    orders: [],
    orderRefreshTime: 0,
    gold: 0,
    level: 1,
    skillPoints: 0,
    exp: 0,
    totalExp: 0,
    cropConfig: {},
    tab: 'cook' // cook / inventory / orders
  },

  onLoad() {
    this.loadData();
    this.setData({ cookingRecipes: getApp().globalData.cookingRecipes });
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const app = getApp();
    const data = app.globalData;
    const now = Date.now();
    const refreshTime = data.orderNextRefresh || 0;
    const canRefresh = refreshTime <= now;
    const timeLeft = canRefresh ? 0 : Math.ceil((refreshTime - now) / 1000 / 60);
    
    // 处理库存数据，将烹饪品转换为可显示格式
    const inventory = data.inventory || {};
    const inventoryList = [];
    for (const key in inventory) {
      const count = inventory[key];
      let item = {};
      if (key.startsWith('cooked_')) {
        const recipeId = key.replace('cooked_', '');
        const recipe = data.cookingRecipes[recipeId];
        if (recipe) {
          item = {
            key: key,
            name: recipe.name,
            emoji: recipe.emoji,
            count: count,
            type: 'cooked'
          };
        }
      } else {
        const crop = data.cropConfig[key];
        if (crop) {
          item = {
            key: key,
            name: crop.name,
            emoji: crop.emoji || '📦',
            count: count,
            type: 'crop'
          };
        }
      }
      if (item.key) {
        inventoryList.push(item);
      }
    }
    
    this.setData({
      inventory: inventory,
      inventoryList: inventoryList,
      orders: data.orders || [],
      orderRefreshTime: refreshTime,
      orderTimeLeft: timeLeft,
      orderCanRefresh: canRefresh,
      gold: data.gold,
      level: data.level,
      skillPoints: data.skillPoints,
      exp: data.exp,
      totalExp: data.levelExp[data.level] || 999,
      cropConfig: data.cropConfig
    });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ tab });
  },

  // 烹饪
  selectRecipe(e) {
    const recipeId = e.currentTarget.dataset.id;
    const recipe = this.data.cookingRecipes[recipeId];
    if (!recipe) return;
    this.setData({ selectedRecipe: recipeId });
  },

  cook() {
    if (!this.data.selectedRecipe) {
      wx.showToast({ title: '请选择配方', icon: 'none' });
      return;
    }
    const result = kitchen.cook(this.data.selectedRecipe);
    if (result.success) {
      wx.showToast({ title: result.msg, icon: 'success' });
      this.loadData();
      if (result.leveledUp) {
        wx.showModal({ title: '升级啦！', content: '恭喜升到 ' + getApp().globalData.level + ' 级！', showCancel: false });
      }
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  // 库存管理
  sellItem(e) {
    const { key, name } = e.currentTarget.dataset;
    const have = this.data.inventory[key] || 0;
    if (have <= 0) {
      wx.showToast({ title: '库存为空', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '出售 ' + name,
      content: `当前库存: ${have}\n出售多少？`,
      editable: true,
      placeholderText: '数量',
      success: (res) => {
        if (res.confirm && res.content) {
          const count = parseInt(res.content);
          if (isNaN(count) || count <= 0 || count > have) {
            wx.showToast({ title: '数量无效', icon: 'none' });
            return;
          }
          const result = kitchen.sellProduct(key, count);
          if (result.success) {
            wx.showToast({ title: result.msg, icon: 'success' });
            this.loadData();
            if (result.goldGain > 0) {
              wx.showModal({ title: '技能点+', content: '金币收入达到里程碑，获得 ' + result.goldGain + ' 技能点！', showCancel: false });
            }
          } else {
            wx.showToast({ title: result.msg, icon: 'none' });
          }
        }
      }
    });
  },

  // 订单
  refreshOrders() {
    const result = kitchen.refreshOrders();
    if (result.success) {
      wx.showToast({ title: result.msg, icon: 'success' });
      this.loadData();
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  completeOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    const result = kitchen.completeOrder(orderId);
    if (result.success) {
      wx.showToast({ title: result.msg, icon: 'success' });
      this.loadData();
      if (result.leveledUp) {
        wx.showModal({ title: '升级啦！', content: '恭喜升到 ' + getApp().globalData.level + ' 级！', showCancel: false });
      }
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  formatTime(seconds) {
    if (seconds <= 0) return '可刷新';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  }
});