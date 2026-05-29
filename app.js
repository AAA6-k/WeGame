// app.js
App({
  globalData: {
    gold: 100,           // 金币
    seeds: 3,            // 种子库存
    lands: [],           // 土地数据
    landCount: 6,        // 土地数量
    selectedSeed: null,  // 当前选中的种子
    // 作物配置
    cropConfig: {
      wheat: { name: '小麦', growTime: 10, price: 15, seedPrice: 5, emoji: '🌾', color: '#F0C060' },
      carrot: { name: '胡萝卜', growTime: 12, price: 20, seedPrice: 8, emoji: '🥕', color: '#FF7043' },
      tomato: { name: '番茄', growTime: 14, price: 28, seedPrice: 10, emoji: '🍅', color: '#EF5350' },
      corn: { name: '玉米', growTime: 16, price: 35, seedPrice: 12, emoji: '🌽', color: '#FFCA28' },
    }
  },

  onLaunch() {
    this.initLands();
    // 从本地存储恢复数据
    const saved = wx.getStorageSync('farmGameData');
    if (saved) {
      this.globalData.gold = saved.gold || 100;
      this.globalData.seeds = saved.seeds || 3;
      this.globalData.lands = saved.lands || this.globalData.lands;
    }
  },

  initLands() {
    this.globalData.lands = [];
    for (let i = 0; i < this.globalData.landCount; i++) {
      this.globalData.lands.push({
        id: i,
        cropType: null,      // 作物类型
        stage: 0,            // 0=空地, 1=种子, 2=幼苗, 3=成长中, 4=成熟
        plantTime: 0,        // 种植时间戳
        growTime: 0,         // 总成长时间
        watered: false,      // 是否已浇水
        animState: '',       // 动画状态: 'planting','watering','harvesting','shaking',''
        coinFly: false,      // 金币飞入动画
      });
    }
  },

  saveData() {
    wx.setStorageSync('farmGameData', {
      gold: this.globalData.gold,
      seeds: this.globalData.seeds,
      lands: this.globalData.lands,
    });
  }
});
