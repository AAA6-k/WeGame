// app.js
App({
  globalData: {
    gold: 100,
    seeds: 3,
    level: 1,
    exp: 0,
    skillPoints: 0,
    harvestCount: 0,
    totalGoldEarned: 0,
    hybridDiscovered: [],
    harvestMilestone: 15,
    goldMilestone: 500,
    inventory: {},
    orders: [],
    orderNextRefresh: 0,
    lands: [],
    totalLandCount: 20,
    purchasedLands: 0,
    selectedSeed: null,
    breedingMode: false,
    breedingTargets: [],
    tools: { wateringCan: 0, fertilizer: 0, sprinkler: false, goldenSickle: false },
    animals: [],

    levelExp: [0, 50, 150, 350, 750, 1350, 2150],
    levelLands: [6, 8, 10, 12, 12, 12, 12],

    cropConfig: {
      wheat:    { name: '小麦',   growTime: 10, price: 15, seedPrice: 5,  unlockLevel: 1, expReward: 5,  emoji: '🌾', color: '#F0C060', type: 'base', mutation: { name: '金穗小麦', multiplier: 3, chance: 0.10, emoji: '✨' } },
      carrot:   { name: '胡萝卜', growTime: 12, price: 20, seedPrice: 8,  unlockLevel: 1, expReward: 8,  emoji: '🥕', color: '#FF7043', type: 'base', mutation: { name: '彩虹胡萝卜', multiplier: 3, chance: 0.10, emoji: '🌈' } },
      tomato:   { name: '番茄',   growTime: 14, price: 28, seedPrice: 10, unlockLevel: 2, expReward: 12, emoji: '🍅', color: '#EF5350', type: 'base', mutation: { name: '璀璨番茄', multiplier: 3, chance: 0.10, emoji: '💎' } },
      corn:     { name: '玉米',   growTime: 16, price: 35, seedPrice: 12, unlockLevel: 3, expReward: 15, emoji: '🌽', color: '#FFCA28', type: 'base', mutation: { name: '宝石玉米', multiplier: 3, chance: 0.08, emoji: '💠' } },
      strawberry: { name: '草莓', growTime: 18, price: 45, seedPrice: 15, unlockLevel: 4, expReward: 20, emoji: '🍓', color: '#E57373', type: 'base', mutation: { name: '白草莓', multiplier: 3, chance: 0.08, emoji: '🤍' } },
      watermelon: { name: '西瓜', growTime: 20, price: 55, seedPrice: 18, unlockLevel: 5, expReward: 25, emoji: '🍉', color: '#66BB6A', type: 'base', mutation: { name: '方形西瓜', multiplier: 3, chance: 0.05, emoji: '🟩' } },
      pumpkin:  { name: '南瓜',   growTime: 22, price: 65, seedPrice: 20, unlockLevel: 6, expReward: 30, emoji: '🎃', color: '#FF8F00', type: 'base', mutation: { name: '巨型南瓜', multiplier: 3, chance: 0.05, emoji: '🏆' } },
      sunflower: { name: '向日葵', growTime: 24, price: 80, seedPrice: 25, unlockLevel: 7, expReward: 40, emoji: '🌻', color: '#FFD600', type: 'base', mutation: { name: '双头向日葵', multiplier: 3, chance: 0.05, emoji: '☀️' } },
      cotton:   { name: '棉花',   growTime: 20, price: 60, seedPrice: 22, unlockLevel: 6, expReward: 28, emoji: '🧵', color: '#F5F5F5', type: 'base', mutation: { name: '彩棉', multiplier: 3, chance: 0.08, emoji: '🎨' } },
      grape:    { name: '葡萄',   growTime: 22, price: 70, seedPrice: 25, unlockLevel: 7, expReward: 35, emoji: '🍇', color: '#7B1FA2', type: 'base', mutation: { name: '水晶葡萄', multiplier: 3, chance: 0.05, emoji: '🔮' } },
      coffee:   { name: '咖啡',   growTime: 25, price: 85, seedPrice: 30, unlockLevel: 7, expReward: 40, emoji: '☕', color: '#5D4037', type: 'base', mutation: { name: '猫屎咖啡', multiplier: 3, chance: 0.05, emoji: '🐱' } },
      melon:    { name: '蜜瓜',   growTime: 24, price: 75, seedPrice: 28, unlockLevel: 7, expReward: 38, emoji: '🍈', color: '#8BC34A', type: 'base', mutation: { name: '黄金蜜瓜', multiplier: 3, chance: 0.05, emoji: '👑' } },
    },

    hybridRecipes: {
      "carrot_tomato":   { name: '彩椒萝卜', emoji: '🥕', growTime: 8,  price: 50,  expReward: 18, unlockLevel: 2 },
      "corn_wheat":      { name: '黄金麦穗', emoji: '🌾', growTime: 9,  price: 45,  expReward: 16, unlockLevel: 3 },
      "strawberry_tomato": { name: '樱桃番茄', emoji: '🍒', growTime: 7,  price: 60,  expReward: 22, unlockLevel: 4 },
      "corn_pumpkin":    { name: '金瓜玉米', emoji: '🎃', growTime: 11, price: 75,  expReward: 28, unlockLevel: 5 },
      "strawberry_watermelon": { name: '蜜瓜草莓', emoji: '🍈', growTime: 10, price: 85,  expReward: 32, unlockLevel: 5 },
      "pumpkin_sunflower": { name: '金阳南瓜', emoji: '🌟', growTime: 13, price: 100, expReward: 38, unlockLevel: 6 },
      "sunflower_tomato": { name: '阳光番茄', emoji: '⭐', growTime: 9,  price: 70,  expReward: 25, unlockLevel: 5 },
      "carrot_corn":     { name: '甜玉萝卜', emoji: '🌽', growTime: 10, price: 55,  expReward: 20, unlockLevel: 3 },
      "wheat_watermelon": { name: '水晶麦粒', emoji: '💎', growTime: 12, price: 90,  expReward: 35, unlockLevel: 5 },
      "tomato_wheat":    { name: '红麦',     emoji: '🔴', growTime: 8,  price: 42,  expReward: 15, unlockLevel: 2 },
    },

    cookingRecipes: {
      bread:       { name: '小麦面包', emoji: '🍞', ingredients: { wheat: 2 }, cost: 20, price: 55, unlockLevel: 1, expReward: 10, time: 5 },
      carrotSoup:  { name: '胡萝卜汤', emoji: '🍲', ingredients: { carrot: 2 }, cost: 25, price: 65, unlockLevel: 1, expReward: 12, time: 6 },
      tomatoSauce: { name: '番茄酱',   emoji: '🥫', ingredients: { tomato: 3 }, cost: 30, price: 90, unlockLevel: 2, expReward: 18, time: 8 },
      strawberryCake: { name: '草莓蛋糕', emoji: '🍰', ingredients: { strawberry: 2, wheat: 1 }, cost: 40, price: 110, unlockLevel: 3, expReward: 25, time: 10 },
      cornSoup:    { name: '玉米浓汤', emoji: '🥘', ingredients: { corn: 3 }, cost: 35, price: 85, unlockLevel: 3, expReward: 20, time: 7 },
      juiceMix:    { name: '混合果蔬汁', emoji: '🧃', ingredients: { tomato: 1, carrot: 1, wheat: 1 }, cost: 50, price: 140, unlockLevel: 4, expReward: 30, time: 12 },
      pumpkinPie:  { name: '南瓜派',   emoji: '🥧', ingredients: { pumpkin: 2, wheat: 1 }, cost: 45, price: 120, unlockLevel: 5, expReward: 28, time: 11 },
      sunflowerOil: { name: '葵花籽油', emoji: '🫗', ingredients: { sunflower: 3 }, cost: 55, price: 150, unlockLevel: 6, expReward: 35, time: 14 },
      watermelonJuice: { name: '西瓜汁', emoji: '🥤', ingredients: { watermelon: 2 }, cost: 30, price: 80, unlockLevel: 4, expReward: 18, time: 6 },
      feast:       { name: '丰收盛宴', emoji: '🎉', ingredients: { wheat: 2, tomato: 2, carrot: 2 }, cost: 100, price: 280, unlockLevel: 7, expReward: 50, time: 20 },
      friedEgg:    { name: '煎蛋', emoji: '🍳', ingredients: { animal_egg: 2 }, cost: 30, price: 80, unlockLevel: 2, expReward: 15, time: 5 },
      cheese:      { name: '奶酪', emoji: '🧀', ingredients: { animal_milk: 2 }, cost: 35, price: 95, unlockLevel: 4, expReward: 20, time: 6 },
      woolSweater: { name: '羊毛衫', emoji: '🧥', ingredients: { animal_wool: 2, cotton: 1 }, cost: 50, price: 160, unlockLevel: 6, expReward: 30, time: 10 },
      bbqFeast:    { name: '烤肉大餐', emoji: '🍖', ingredients: { animal_pork: 1, corn: 2, tomato: 1 }, cost: 80, price: 250, unlockLevel: 6, expReward: 40, time: 15 },
    },

    skillTree: {
      farming: {
        name: '农耕', emoji: '🌱',
        levels: [
          { level: 1, cost: 1, name: '初级农耕', desc: '作物生长速度 +10%', bonus: { growthBoost: 0.10 } },
          { level: 2, cost: 2, name: '中级农耕', desc: '收获金币 +15%', bonus: { harvestGoldBoost: 0.15 } },
          { level: 3, cost: 3, name: '高级农耕', desc: '生长速度再 +15%', bonus: { growthBoost: 0.15 } },
          { level: 4, cost: 4, name: '大师农耕', desc: '收获经验 +30%', bonus: { expBoost: 0.30 } },
          { level: 5, cost: 5, name: '农耕之神', desc: '所有作物价格翻倍', bonus: { priceDouble: true } },
        ]
      },
      fishing: {
        name: '钓鱼', emoji: '🎣',
        levels: [
          { level: 1, cost: 1, name: '初级钓鱼', desc: '每日自动 +10 金币', bonus: { dailyGold: 10 } },
          { level: 2, cost: 2, name: '中级钓鱼', desc: '每日自动再 +15 金币', bonus: { dailyGold: 15 } },
          { level: 3, cost: 3, name: '高级钓鱼', desc: '收获 20% 概率翻倍', bonus: { harvestDoubleChance: 0.20 } },
          { level: 4, cost: 4, name: '大师钓鱼', desc: '翻倍概率提升到 35%', bonus: { harvestDoubleChance: 0.15 } },
          { level: 5, cost: 5, name: '钓鱼之王', desc: '每次收获额外 +50 金币', bonus: { harvestExtraGold: 50 } },
        ]
      },
      mining: {
        name: '采矿', emoji: '⛏️',
        levels: [
          { level: 1, cost: 1, name: '初级采矿', desc: '种子购买 -10%', bonus: { seedDiscount: 0.10 } },
          { level: 2, cost: 2, name: '中级采矿', desc: '种子购买再 -10%', bonus: { seedDiscount: 0.10 } },
          { level: 3, cost: 3, name: '高级采矿', desc: '种植额外 +5 经验', bonus: { plantExp: 5 } },
          { level: 4, cost: 4, name: '大师采矿', desc: '杂交成功率 +25%', bonus: { hybridChance: 0.25 } },
          { level: 5, cost: 5, name: '采矿之王', desc: '全部种子免费', bonus: { seedFree: true } },
        ]
      },
      cooking: {
        name: '烹饪', emoji: '🍳',
        levels: [
          { level: 1, cost: 1, name: '初级烹饪', desc: '浇水效果 +1 秒', bonus: { waterBonus: 1 } },
          { level: 2, cost: 2, name: '中级烹饪', desc: '浇水效果再 +1 秒', bonus: { waterBonus: 1 } },
          { level: 3, cost: 3, name: '高级烹饪', desc: '生长时间 -15%', bonus: { allGrowthReduce: 0.15 } },
          { level: 4, cost: 4, name: '大师烹饪', desc: '生长时间再 -15%', bonus: { allGrowthReduce: 0.15 } },
          { level: 5, cost: 5, name: '厨神', desc: '作物瞬间成熟', bonus: { instantGrow: true } },
        ]
      },
    },

    learnedSkills: { farming: 0, fishing: 0, mining: 0, cooking: 0 },
  },

  onLaunch() {
    this.initLands();
    var saved = wx.getStorageSync('farmGameData');
    if (saved) {
      this.globalData.gold = saved.gold != null ? saved.gold : 100;
      this.globalData.seeds = saved.seeds != null ? saved.seeds : 3;
      this.globalData.level = saved.level || 1;
      this.globalData.exp = saved.exp || 0;
      this.globalData.skillPoints = saved.skillPoints || 0;
      this.globalData.learnedSkills = saved.learnedSkills || { farming: 0, fishing: 0, mining: 0, cooking: 0 };
      this.globalData.harvestCount = saved.harvestCount || 0;
      this.globalData.totalGoldEarned = saved.totalGoldEarned || 0;
      this.globalData.hybridDiscovered = saved.hybridDiscovered || [];
      this.globalData.harvestMilestone = saved.harvestMilestone || 15;
      this.globalData.goldMilestone = saved.goldMilestone || 500;
      this.globalData.inventory = saved.inventory || {};
      this.globalData.orders = saved.orders || [];
      this.globalData.orderNextRefresh = saved.orderNextRefresh || 0;
      this.globalData.purchasedLands = saved.purchasedLands || 0;
      this.globalData.tools = saved.tools || { wateringCan: 0, fertilizer: 0, sprinkler: false, goldenSickle: false };
      this.globalData.animals = saved.animals || [];
      if (saved.lands && saved.lands.length === this.globalData.totalLandCount) {
        this.globalData.lands = saved.lands;
      } else {
        this.saveData();
      }
    }
  },

  initLands() {
    this.globalData.lands = [];
    for (var i = 0; i < this.globalData.totalLandCount; i++) {
      var unlockLevel = 1;
      if (i >= 10) unlockLevel = 4;
      else if (i >= 8) unlockLevel = 3;
      else if (i >= 6) unlockLevel = 2;

      var purchased = true;
      if (i >= 12) {
        purchased = i < 12 + (this.globalData.purchasedLands || 0);
        unlockLevel = 5;
      }

      this.globalData.lands.push({
        id: i,
        cropType: null,
        stage: 0,
        plantTime: 0,
        growTime: 0,
        watered: false,
        animState: '',
        coinFly: false,
        unlockLevel: unlockLevel,
        purchased: purchased,
        selected: false,
      });
    }
  },

  getAvailableLandCount() {
    var idx = Math.min(this.globalData.level - 1, this.globalData.levelLands.length - 1);
    return this.globalData.levelLands[idx];
  },

  getLevelUpExp() {
    var idx = this.globalData.level;
    if (idx >= this.globalData.levelExp.length) return 999999;
    return this.globalData.levelExp[idx];
  },

  getAvailableCropTypes() {
    var cropConfig = this.globalData.cropConfig;
    var level = this.globalData.level;
    return Object.keys(cropConfig).filter(function(key) { return cropConfig[key].unlockLevel <= level; });
  },

  getHybridResult(parentA, parentB) {
    var key = [parentA, parentB].sort().join('_');
    var recipe = this.globalData.hybridRecipes[key];
    if (!recipe) return null;
    if (this.globalData.level < recipe.unlockLevel) return { locked: true, needLevel: recipe.unlockLevel };
    return recipe;
  },

  getSkillBonus(skillId) {
    var learned = this.globalData.learnedSkills[skillId] || 0;
    var tree = this.globalData.skillTree[skillId];
    if (!tree) return {};
    var bonuses = {};
    for (var i = 0; i < learned; i++) {
      var lv = tree.levels[i];
      if (lv && lv.bonus) Object.assign(bonuses, lv.bonus);
    }
    return bonuses;
  },

  getAllBonuses() {
    var all = {};
    var self = this;
    Object.keys(this.globalData.skillTree).forEach(function(key) {
      Object.assign(all, self.getSkillBonus(key));
    });
    var tools = this.globalData.tools;
    if (tools.wateringCan > 0) {
      all.waterBonus = (all.waterBonus || 0) + tools.wateringCan;
    }
    if (tools.fertilizer > 0) {
      all.growthBoost = (all.growthBoost || 0) + 0.2 * tools.fertilizer;
    }
    if (tools.goldenSickle) {
      all.harvestGoldBoost = (all.harvestGoldBoost || 0) + 0.3;
    }
    return all;
  },

  saveData() {
    wx.setStorageSync('farmGameData', {
      gold: this.globalData.gold,
      seeds: this.globalData.seeds,
      level: this.globalData.level,
      exp: this.globalData.exp,
      skillPoints: this.globalData.skillPoints,
      learnedSkills: this.globalData.learnedSkills,
      harvestCount: this.globalData.harvestCount,
      totalGoldEarned: this.globalData.totalGoldEarned,
      hybridDiscovered: this.globalData.hybridDiscovered,
      harvestMilestone: this.globalData.harvestMilestone,
      goldMilestone: this.globalData.goldMilestone,
      inventory: this.globalData.inventory,
      orders: this.globalData.orders,
      orderNextRefresh: this.globalData.orderNextRefresh,
      lands: this.globalData.lands,
      purchasedLands: this.globalData.purchasedLands,
      tools: this.globalData.tools,
      animals: this.globalData.animals,
    });
  },

  checkLevelUp() {
    var data = this.globalData;
    var levelExp = data.levelExp;
    while (data.level < levelExp.length && data.exp >= levelExp[data.level]) {
      data.level += 1;
      data.skillPoints += 2;
    }
  },
});