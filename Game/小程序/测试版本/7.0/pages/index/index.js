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
      var changed = animalsUtil.updateAnimals();
      if (changed) {
        self.setData({ animals: app.globalData.animals });
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
      wx.showToast({ title: '种植成功！', icon: 'success' });
      this.setData({ lands: gameData.cloneLands(), seeds: getApp().globalData.seeds, showSeedPicker: false });
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  closeSeedPicker() {
    this.setData({ showSeedPicker: false });
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
    var result = gameData.harvestLand(landId);
    if (result.success) {
      var msg = '收获 ' + result.cropName + '，获得 ' + result.reward + ' 金币';
      if (result.milestoneMsg) msg += result.milestoneMsg;
      wx.showToast({ title: msg, icon: 'success', duration: 2000 });

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
      this.setData({ seeds: app.globalData.seeds, animals: app.globalData.animals });
    } else {
      wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  collectAnimalProduct(animal) {
    var result = animalsUtil.collectProduct(animal.id);
    if (result.success) {
      wx.showToast({ title: '收取 ' + result.productName + ' x1！', icon: 'success' });
      var app = getApp();
      this.setData({ gold: app.globalData.gold, animals: app.globalData.animals });
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