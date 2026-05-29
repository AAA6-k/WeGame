// pages/shop/shop.js
var gameData = require('../../utils/gameData');

Page({
  data: {
    gold: 100,
    seeds: 3,
    level: 1,
    cropConfig: {},
    tools: {},
    purchasedLands: 0,
    animalConfig: {
      chicken: { name: '鸡', emoji: '🐔', unlockLevel: 2, price: 300, product: '鸡蛋', produceInterval: 30, productPrice: 25 },
      cow: { name: '奶牛', emoji: '🐄', unlockLevel: 4, price: 800, product: '牛奶', produceInterval: 60, productPrice: 60 },
      sheep: { name: '绵羊', emoji: '🐑', unlockLevel: 5, price: 1200, product: '羊毛', produceInterval: 90, productPrice: 90 },
      pig: { name: '猪', emoji: '🐖', unlockLevel: 6, price: 2000, product: '猪肉', produceInterval: 120, productPrice: 150 },
    },
    allCropTypes: ['wheat','carrot','tomato','corn','strawberry','watermelon','pumpkin','sunflower','cotton','grape','coffee','melon'],
    currentTab: 'seed',
    landPrices: [200, 500, 1000, 2000, 3000, 4000, 5000, 6000],
    toolInfo: {
      wateringCan: { name: '洒水壶升级', emoji: '🪣', desc: '浇水效果 +1 秒/级', levels: [100, 200, 300], maxLevel: 3 },
      fertilizer: { name: '肥料', emoji: '🧪', desc: '生长时间 -20%/级', levels: [150, 250, 350], maxLevel: 3 },
      sprinkler: { name: '自动喷灌器', emoji: '💦', desc: '土地自动浇水', price: 800, maxLevel: 1 },
      goldenSickle: { name: '金镰刀', emoji: '🔪', desc: '收获金币 +30%', price: 1200, maxLevel: 1 },
    },
  },

  onLoad() {
    var app = getApp();
    this.setData({
      gold: app.globalData.gold,
      seeds: app.globalData.seeds,
      level: app.globalData.level,
      cropConfig: app.globalData.cropConfig,
      tools: app.globalData.tools,
      purchasedLands: app.globalData.purchasedLands || 0,
    });
  },

  onShow() {
    var app = getApp();
    this.setData({
      gold: app.globalData.gold,
      seeds: app.globalData.seeds,
      level: app.globalData.level,
      tools: app.globalData.tools,
      purchasedLands: app.globalData.purchasedLands || 0,
    });
  },

  switchTab: function(e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  buySeed: function(e) {
    var cropType = e.currentTarget.dataset.type;
    var result = gameData.buySeed(cropType);
    if (result.success) {
      wx.showToast({ title: result.msg, icon: 'success' });
      var app = getApp();
      this.setData({ gold: app.globalData.gold, seeds: app.globalData.seeds });
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  buyLand: function(e) {
    var landIndex = parseInt(e.currentTarget.dataset.index);
    var app = getApp();
    var data = app.globalData;
    var prices = this.data.landPrices;

    if (landIndex >= prices.length) {
      wx.showToast({ title: '没有更多土地了', icon: 'none' });
      return;
    }
    if (data.purchasedLands > landIndex) {
      wx.showToast({ title: '这块土地已经购买了', icon: 'none' });
      return;
    }
    if (data.purchasedLands !== landIndex) {
      wx.showToast({ title: '请按顺序购买土地', icon: 'none' });
      return;
    }
    if (data.level < 5) {
      wx.showToast({ title: '需要达到5级才能购买额外土地', icon: 'none' });
      return;
    }

    var price = prices[landIndex];
    if (data.gold < price) {
      wx.showToast({ title: '金币不足（需要 ' + price + '）', icon: 'none' });
      return;
    }

    data.gold -= price;
    data.purchasedLands = landIndex + 1;
    var landId = 12 + landIndex;
    if (data.lands[landId]) {
      data.lands[landId].purchased = true;
    }
    app.saveData();
    wx.showToast({ title: '成功购买第' + (13 + landIndex) + '块土地！', icon: 'success' });
    this.setData({ gold: data.gold, purchasedLands: data.purchasedLands });
  },

  buyTool: function(e) {
    var toolType = e.currentTarget.dataset.type;
    var app = getApp();
    var data = app.globalData;
    var tools = data.tools;
    var price = 0;
    var success = false;
    var msg = '';
    var toolInfo = this.data.toolInfo[toolType];

    if (toolType === 'wateringCan' || toolType === 'fertilizer') {
      if (tools[toolType] >= toolInfo.maxLevel) {
        msg = toolInfo.name + '已升到最高级';
      } else {
        price = toolInfo.levels[tools[toolType]];
        if (data.gold >= price) {
          data.gold -= price;
          tools[toolType] += 1;
          success = true;
          msg = toolInfo.name + '升级到' + tools[toolType] + '级！';
        } else {
          msg = '金币不足（需要 ' + price + '）';
        }
      }
    } else {
      if (tools[toolType]) {
        msg = '已经拥有' + toolInfo.name;
      } else {
        price = toolInfo.price;
        if (data.gold >= price) {
          data.gold -= price;
          tools[toolType] = true;
          success = true;
          msg = '购买' + toolInfo.name + '成功！';
        } else {
          msg = '金币不足（需要 ' + price + '）';
        }
      }
    }

    if (success) {
      app.saveData();
      wx.showToast({ title: msg, icon: 'success' });
      this.setData({ gold: data.gold, tools: Object.assign({}, tools) });
    } else {
      wx.showToast({ title: msg, icon: 'none' });
    }
  },

  buyAnimal: function(e) {
    // 先查看是否有动物页面需要的引入，这里做简单校验
    var animalType = e.currentTarget.dataset.type;
    var config = this.data.animalConfig[animalType];
    var app = getApp();
    var data = app.globalData;

    if (!config) {
      wx.showToast({ title: '未知动物类型', icon: 'none' });
      return;
    }
    if (data.level < config.unlockLevel) {
      wx.showToast({ title: '需要达到 ' + config.unlockLevel + ' 级', icon: 'none' });
      return;
    }
    if (data.gold < config.price) {
      wx.showToast({ title: '金币不足（需要 ' + config.price + '）', icon: 'none' });
      return;
    }
    if (data.animals.length >= 10) {
      wx.showToast({ title: '动物栏已满（最多10只）', icon: 'none' });
      return;
    }
    if (!data.animals) data.animals = [];

    data.gold -= config.price;
    data.animals.push({
      id: Date.now() + Math.random(),
      type: animalType,
      name: config.name,
      emoji: config.emoji,
      productReady: false,
      feedCount: 0,
      lastFeedTime: 0,
      produceInterval: config.produceInterval,
      product: 'animal_' + (animalType === 'chicken' ? 'egg' : animalType === 'cow' ? 'milk' : animalType === 'sheep' ? 'wool' : 'pork'),
      productName: config.product,
      productPrice: config.productPrice,
    });
    app.saveData();
    wx.showToast({ title: '成功购买了' + config.name + '！', icon: 'success' });
    this.setData({ gold: data.gold });
  },

  goFarm: function() {
    wx.switchTab({ url: '/pages/index/index' });
  },
});