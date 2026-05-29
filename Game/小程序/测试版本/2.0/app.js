// app.js
App({
  globalData: {
    gold: 100,           // 金币
    seeds: 3,            // 种子库存
    level: 1,            // 当前等级
    exp: 0,              // 当前经验
    lands: [],           // 土地数据
    totalLandCount: 12,  // 总土地数（随等级解锁）
    selectedSeed: null,
    // 每级所需经验（数组索引=等级-1）
    levelExp: [0, 50, 150, 350, 750, 1350, 2150],
    // 各等级解锁的土地数（数组索引=等级-1）
    levelLands: [6, 8, 10, 12, 12, 12, 12],
    // 作物配置：unlockLevel 解锁等级
    cropConfig: {
      wheat:    { name: '小麦',   growTime: 10, price: 15, seedPrice: 5,  unlockLevel: 1, expReward: 5,  emoji: '🌾', color: '#F0C060' },
      carrot:   { name: '胡萝卜', growTime: 12, price: 20, seedPrice: 8,  unlockLevel: 1, expReward: 8,  emoji: '🥕', color: '#FF7043' },
      tomato:   { name: '番茄',   growTime: 14, price: 28, seedPrice: 10, unlockLevel: 2, expReward: 12, emoji: '🍅', color: '#EF5350' },
      corn:     { name: '玉米',   growTime: 16, price: 35, seedPrice: 12, unlockLevel: 3, expReward: 15, emoji: '🌽', color: '#FFCA28' },
      strawberry: { name: '草莓', growTime: 18, price: 45, seedPrice: 15, unlockLevel: 4, expReward: 20, emoji: '🍓', color: '#E57373' },
      watermelon: { name: '西瓜', growTime: 20, price: 55, seedPrice: 18, unlockLevel: 5, expReward: 25, emoji: '🍉', color: '#66BB6A' },
      pumpkin:  { name: '南瓜',   growTime: 22, price: 65, seedPrice: 20, unlockLevel: 6, expReward: 30, emoji: '🎃', color: '#FF8F00' },
      sunflower: { name: '向日葵', growTime: 24, price: 80, seedPrice: 25, unlockLevel: 7, expReward: 40, emoji: '🌻', color: '#FFD600' },
    },
  },

  onLaunch() {
    this.initLands();
    const saved = wx.getStorageSync('farmGameData');
    if (saved) {
      this.globalData.gold = saved.gold != null ? saved.gold : 100;
      this.globalData.seeds = saved.seeds != null ? saved.seeds : 3;
      this.globalData.level = saved.level || 1;
      this.globalData.exp = saved.exp || 0;
      // 只接受 12 块土地的存档，旧版 6 块土地的存档丢弃
      if (saved.lands && saved.lands.length === this.globalData.totalLandCount) {
        this.globalData.lands = saved.lands;
      } else {
        this.saveData();
      }
    }
  },

  initLands() {
    this.globalData.lands = [];
    for (let i = 0; i < this.globalData.totalLandCount; i++) {
      // 每块土地设置解锁等级
      let unlockLevel = 1;
      if (i >= 10) unlockLevel = 4;
      else if (i >= 8) unlockLevel = 3;
      else if (i >= 6) unlockLevel = 2;

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
      });
    }
  },

  // 当前等级可用土地数
  getAvailableLandCount() {
    const idx = Math.min(this.globalData.level - 1, this.globalData.levelLands.length - 1);
    return this.globalData.levelLands[idx];
  },

  // 当前等级升级所需经验
  getLevelUpExp() {
    const idx = this.globalData.level;
    if (idx >= this.globalData.levelExp.length) return 999999;
    return this.globalData.levelExp[idx];
  },

  // 获取当前等级已解锁的作物类型列表
  getAvailableCropTypes() {
    const cropConfig = this.globalData.cropConfig;
    const level = this.globalData.level;
    return Object.keys(cropConfig).filter(key => cropConfig[key].unlockLevel <= level);
  },

  saveData() {
    wx.setStorageSync('farmGameData', {
      gold: this.globalData.gold,
      seeds: this.globalData.seeds,
      level: this.globalData.level,
      exp: this.globalData.exp,
      lands: this.globalData.lands,
    });
  },
});