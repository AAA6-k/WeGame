// pages/index/index.js
var gameData = require('../../utils/gameData');
var animalsUtil = require('../../utils/animals');

Page({
  data: {
    gold: 100,
    seeds: 3,
    level: 1,
    skillPoints: 0,
    exp: 0,
    expMax: 50,
    expPercent: 0,
    lands: [],
    cropConfig: {},
    availableCropTypes: [],
    breedMode: false,
    breedTargets: [],
    selectedSeed: null,
    showSeedPicker: false,
    showAnimalArea: false,
    animals: [],
    animalStatusText: '',
    // 特效相关
    coinAnimations: [],
    expAnimations: [],
    // 轻量通知（替代wx.showToast）
    notification: { show: false, text: '', icon: '' },
  },

  onLoad() {
    this.refreshData();
    this.startGrowthTimer();
    this.startAnimalTimer();
  },

  onShow() {
    this.refreshData();
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
    if (this.animalTimer) clearInterval(this.animalTimer);
  },

  refreshData() {
    var app = getApp();
    var expMax = app.getLevelUpExp();
    var expPercent = expMax > 0 ? Math.min(100, Math.floor(app.globalData.exp / expMax * 100)) : 100;
    var animals = app.globalData.animals || [];
    var showAnimalArea = animals.length > 0;
    
    // 计算动物剩余时间
    for (var i = 0; i < animals.length; i++) {
      var a = animals[i];
      a._r = animalsUtil.getAnimalRemainTime(a);
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
      animals: animals,
      showAnimalArea: showAnimalArea,
    });
  },

  startGrowthTimer() {
    var self = this;
    this.timer = setInterval(function() {
      var updates = gameData.updateGrowth();
      if (updates.length > 0) {
        self.setData({ lands: gameData.cloneLands() });
      }
    }, 500);
  },

  startAnimalTimer() {
    var self = this;
    this.animalTimer = setInterval(function() {
      var app = getApp();
      var animals = app.globalData.animals || [];
      if (animals.length === 0) return;
      animalsUtil.updateAnimals();
      // 更新每只动物的倒计时
      var changed = false;
      for (var i = 0; i < animals.length; i++) {
        var a = animals[i];
        var r = animalsUtil.getAnimalRemainTime(a);
        if (a._r !== r) { a._r = r; changed = true; }
      }
      if (changed) {
        self.setData({ animals: animals });
      }
    }, 1000);
  },

  // 点击土地
  onLandTap(e) {
    var landId = e.currentTarget.dataset.id;
    var land = this.data.lands[landId];
    var app = getApp();

    // 检查土地是否解锁
    if (app.globalData.level < land.unlockLevel) {
      wx.showToast({ title: 'Lv.' + land.unlockLevel + ' 解锁该土地', icon: 'none' });
      return;
    }

    // 检查土地是否已购买
    if (land.purchased === false) {
      wx.showToast({ title: '请先在商店购买该土地', icon: 'none' });
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
      this.setData({ showSeedPicker: true, selectedSeed: landId });
    } else if (land.stage >= 1 && land.stage <= 3) {
      if (!land.watered) {
        this.onWaterLand(landId);
      } else {
        var remain = gameData.getRemainTime(land);
        wx.showToast({ title: '已浇水，剩余 ' + remain + ' 秒成熟', icon: 'none' });
      }
    } else if (land.stage === 4) {
      this.onHarvestLand(landId);
    }
  },

  // 选择种子
  onSelectSeed(e) {
    var cropType = e.currentTarget.dataset.type;
    var landId = this.data.selectedSeed;
    var result = gameData.plantCrop(landId, cropType);
    if (result.success) {
      this.showNotification('种植成功！' + cropType, '🌱');
      this.setData({ lands: gameData.cloneLands(), seeds: getApp().globalData.seeds, showSeedPicker: false });
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  closeSeedPicker() {
    this.setData({ showSeedPicker: false });
  },

  // 轻量顶部通知（不遮挡操作区域）
  showNotification(text, icon) {
    var self = this;
    this.setData({ notification: { show: true, text: text, icon: icon || '' } });
    clearTimeout(this._notifyTimer);
    this._notifyTimer = setTimeout(function() {
      self.setData({ 'notification.show': false });
    }, 1500);
  },

  // 浇水
  onWaterLand(landId) {
    var result = gameData.waterLand(landId);
    if (result.success) {
      wx.showToast({ title: '浇水成功！', icon: 'success' });
      this.setData({ lands: gameData.cloneLands() });
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  // 收获
  onHarvestLand(landId) {
    var self = this;
    var result = gameData.harvestLand(landId);
    if (result.success) {
      var msg = '收获 ' + result.cropName + ' +' + result.reward + '💰';
      if (result.milestoneMsg) msg += result.milestoneMsg;
      this.showNotification(msg, '🎉');

      var app = getApp();
      var expMax = app.getLevelUpExp();
      var expPercent = expMax > 0 ? Math.min(100, Math.floor(app.globalData.exp / expMax * 100)) : 100;
      this.setData({
        lands: gameData.cloneLands(),
        gold: app.globalData.gold,
        exp: app.globalData.exp,
        expMax: expMax,
        expPercent: expPercent,
        level: app.globalData.level,
        skillPoints: app.globalData.skillPoints,
      });

      // 获取触摸点坐标作为特效起点
      wx.createSelectorQuery()
        .select('.status-gold')
        .boundingClientRect(function(goldRect) {
          wx.createSelectorQuery()
            .select('.exp-bar')
            .boundingClientRect(function(expRect) {
              // 获取土地位置作为起点
              wx.createSelectorQuery()
                .select('.land-cell[data-id="' + landId + '"]')
                .boundingClientRect(function(landRect) {
                  if (landRect && goldRect && expRect) {
                    // 计算土地中心点
                    var startX = landRect.left + landRect.width / 2;
                    var startY = landRect.top + landRect.height / 2;
                    
                    // 金币飞入特效
                    self.triggerCoinAnimation(startX, startY, goldRect.left + goldRect.width / 2, goldRect.top + goldRect.height / 2, result.reward);
                    // 经验飞入特效
                    if (result.expReward > 0) {
                      self.triggerExpAnimation(startX, startY, expRect.left + expRect.width / 2, expRect.top + expRect.height / 2, result.expReward);
                    }
                  }
                })
                .exec();
            })
            .exec();
        })
        .exec();

      if (result.leveledUp) {
        wx.showModal({
          title: '升级啦！',
          content: '恭喜升到 ' + result.newLevel + ' 级！获得 2 点技能点',
          showCancel: false,
        });
      }
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  // 触发金币飞入特效
  triggerCoinAnimation(startX, startY, endX, endY, amount) {
    var self = this;
    var coins = this.data.coinAnimations.slice();
    var id = Date.now() + Math.random();
    var dx = endX - startX;
    var dy = endY - startY;
    // 预计算弧线中点（避免CSS calc在微信webview中不兼容）
    var arcX = dx * 0.3;
    var arcY = dy * 0.3 - 20;
    coins.push({ 
      id: id, 
      startX: startX, 
      startY: startY,
      dx: dx,
      dy: dy,
      arcX: arcX,
      arcY: arcY,
      amount: amount, 
      visible: true 
    });
    this.setData({ coinAnimations: coins });
    setTimeout(function() {
      var updatedCoins = self.data.coinAnimations.filter(function(c) { return c.id !== id; });
      self.setData({ coinAnimations: updatedCoins });
    }, 1000);
  },

  // 触发经验飞入特效
  triggerExpAnimation(startX, startY, endX, endY, amount) {
    var self = this;
    var exps = this.data.expAnimations.slice();
    var id = Date.now() + Math.random();
    var dx = endX - startX;
    var dy = endY - startY;
    var arcX = dx * 0.3;
    var arcY = dy * 0.3 - 20;
    exps.push({ 
      id: id, 
      startX: startX, 
      startY: startY,
      dx: dx,
      dy: dy,
      arcX: arcX,
      arcY: arcY,
      amount: amount, 
      visible: true 
    });
    this.setData({ expAnimations: exps });
    setTimeout(function() {
      var updatedExps = self.data.expAnimations.filter(function(e) { return e.id !== id; });
      self.setData({ expAnimations: updatedExps });
    }, 1000);
  },

  // 杂交模式
  toggleBreedMode() {
    var newMode = !this.data.breedMode;
    this.setData({ breedMode: newMode, breedTargets: [] });
    if (newMode) {
      wx.showToast({ title: '杂交模式：选择2个成熟作物', icon: 'none' });
    }
  },

  onSelectBreedLand(landId) {
    var targets = this.data.breedTargets.slice();
    if (targets.indexOf(landId) >= 0) {
      targets = targets.filter(function(id) { return id !== landId; });
    } else {
      targets.push(landId);
    }
    this.setData({ breedTargets: targets });

    if (targets.length === 2) {
      this.doBreed(targets[0], targets[1]);
    }
  },

  doBreed(landA, landB) {
    var app = getApp();
    var land1 = app.globalData.lands[landA];
    var land2 = app.globalData.lands[landB];
    var result = app.getHybridResult(land1.cropType, land2.cropType);

    if (!result) {
      wx.showToast({ title: '这两个作物无法杂交', icon: 'none' });
      this.setData({ breedMode: false, breedTargets: [] });
      return;
    }
    if (result.locked) {
      wx.showToast({ title: '需要 Lv.' + result.needLevel + ' 解锁该杂交', icon: 'none' });
      this.setData({ breedMode: false, breedTargets: [] });
      return;
    }

    var bonuses = app.getAllBonuses();
    var chance = 0.5 + (bonuses.hybridChance || 0);
    if (Math.random() < chance) {
      gameData.resetLand(landA);
      gameData.resetLand(landB);
      wx.showToast({ title: '杂交成功！获得 ' + result.name, icon: 'success' });
    } else {
      gameData.resetLand(landA);
      gameData.resetLand(landB);
      wx.showToast({ title: '杂交失败，土地已清空', icon: 'none' });
    }
    this.setData({ lands: gameData.cloneLands(), breedMode: false, breedTargets: [] });
  },

  // 动物操作
  onAnimalTap(e) {
    var animalId = e.currentTarget.dataset.id;
    var app = getApp();
    var animals = app.globalData.animals || [];
    var animal = null;
    for (var i = 0; i < animals.length; i++) {
      if (animals[i].id === animalId) { animal = animals[i]; break; }
    }
    if (!animal) return;

    if (animal.productReady) {
      this.collectAnimalProduct(animal);
    } else {
      this.feedAnimal(animal);
    }
  },

  feedAnimal(animal) {
    var app = getApp();
    if (app.globalData.seeds <= 0) {
      wx.showToast({ title: '没有种子可以喂食（1颗种子=1份饲料）', icon: 'none' });
      return;
    }
    var result = animalsUtil.feedAnimal(animal.id);
    if (result.success) {
      wx.showToast({ title: '喂食成功！', icon: 'success' });
      var animals = app.globalData.animals;
      for (var i = 0; i < animals.length; i++) {
        animals[i]._r = animalsUtil.getAnimalRemainTime(animals[i]);
      }
      this.setData({ seeds: app.globalData.seeds, animals: animals });
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  collectAnimalProduct(animal) {
    var result = animalsUtil.collectProduct(animal.id);
    if (result.success) {
      wx.showToast({ title: '收取 ' + result.productName + ' x1！', icon: 'success' });
      var app = getApp();
      var animals = app.globalData.animals;
      for (var i = 0; i < animals.length; i++) {
        animals[i]._r = animalsUtil.getAnimalRemainTime(animals[i]);
      }
      this.setData({ gold: app.globalData.gold, animals: animals });
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  // 导航
  goShop() { wx.switchTab({ url: '/pages/shop/shop' }); },
  goSkill() { wx.switchTab({ url: '/pages/skill/skill' }); },
  goKitchen() { wx.switchTab({ url: '/pages/kitchen/kitchen' }); },
  goAnimals() { wx.switchTab({ url: '/pages/animals/animals' }); },
});