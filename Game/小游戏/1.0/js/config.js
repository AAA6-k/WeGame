// js/config.js - 游戏静态配置
module.exports = {
  version: '1.0.0',
  
  levelExp: [0, 50, 150, 350, 750, 1350, 2150],
  levelLands: [6, 8, 10, 12, 12, 12, 12],

  cropConfig: {
    wheat:    { name: '小麦',   growTime: 10, price: 15, seedPrice: 5,  unlockLevel: 1, expReward: 5,  emoji: '🌾', color: '#F0C060', type: 'base' },
    carrot:   { name: '胡萝卜', growTime: 12, price: 20, seedPrice: 8,  unlockLevel: 1, expReward: 8,  emoji: '🥕', color: '#FF7043', type: 'base' },
    tomato:   { name: '番茄',   growTime: 14, price: 28, seedPrice: 10, unlockLevel: 2, expReward: 12, emoji: '🍅', color: '#EF5350', type: 'base' },
    corn:     { name: '玉米',   growTime: 16, price: 35, seedPrice: 12, unlockLevel: 3, expReward: 15, emoji: '🌽', color: '#FFCA28', type: 'base' },
    strawberry: { name: '草莓', growTime: 18, price: 45, seedPrice: 15, unlockLevel: 4, expReward: 20, emoji: '🍓', color: '#E57373', type: 'base' },
    watermelon: { name: '西瓜', growTime: 20, price: 55, seedPrice: 18, unlockLevel: 5, expReward: 25, emoji: '🍉', color: '#66BB6A', type: 'base' },
    pumpkin:  { name: '南瓜',   growTime: 22, price: 65, seedPrice: 20, unlockLevel: 6, expReward: 30, emoji: '🎃', color: '#FF8F00', type: 'base' },
    sunflower: { name: '向日葵', growTime: 24, price: 80, seedPrice: 25, unlockLevel: 7, expReward: 40, emoji: '🌻', color: '#FFD600', type: 'base' },
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
    bread:       { name: '小麦面包', emoji: '🍞', ingredients: { wheat: 2 }, cost: 20, price: 55, unlockLevel: 1, expReward: 10 },
    carrotSoup:  { name: '胡萝卜汤', emoji: '🍲', ingredients: { carrot: 2 }, cost: 25, price: 65, unlockLevel: 1, expReward: 12 },
    tomatoSauce: { name: '番茄酱',   emoji: '🥫', ingredients: { tomato: 3 }, cost: 30, price: 90, unlockLevel: 2, expReward: 18 },
    strawberryCake: { name: '草莓蛋糕', emoji: '🍰', ingredients: { strawberry: 2, wheat: 1 }, cost: 40, price: 110, unlockLevel: 3, expReward: 25 },
    cornSoup:    { name: '玉米浓汤', emoji: '🥘', ingredients: { corn: 3 }, cost: 35, price: 85, unlockLevel: 3, expReward: 20 },
    juiceMix:    { name: '混合果蔬汁', emoji: '🧃', ingredients: { tomato: 1, carrot: 1, wheat: 1 }, cost: 50, price: 140, unlockLevel: 4, expReward: 30 },
    pumpkinPie:  { name: '南瓜派',   emoji: '🥧', ingredients: { pumpkin: 2, wheat: 1 }, cost: 45, price: 120, unlockLevel: 5, expReward: 28 },
    sunflowerOil: { name: '葵花籽油', emoji: '🫗', ingredients: { sunflower: 3 }, cost: 55, price: 150, unlockLevel: 6, expReward: 35 },
    watermelonJuice: { name: '西瓜汁', emoji: '🥤', ingredients: { watermelon: 2 }, cost: 30, price: 80, unlockLevel: 4, expReward: 18 },
    feast:       { name: '丰收盛宴', emoji: '🎉', ingredients: { wheat: 2, tomato: 2, carrot: 2 }, cost: 100, price: 280, unlockLevel: 7, expReward: 50 },
  },

  skillTree: {
    farming: {
      name: '农耕', emoji: '🌱',
      levels: [
        { level: 1, cost: 1, name: '初级农耕', desc: '生长+10%', bonus: { growthBoost: 0.10 } },
        { level: 2, cost: 2, name: '中级农耕', desc: '金币+15%', bonus: { harvestGoldBoost: 0.15 } },
        { level: 3, cost: 3, name: '高级农耕', desc: '生长+15%', bonus: { growthBoost: 0.15 } },
        { level: 4, cost: 4, name: '大师农耕', desc: '经验+30%', bonus: { expBoost: 0.30 } },
        { level: 5, cost: 5, name: '农耕之神', desc: '价格翻倍', bonus: { priceDouble: true } },
      ]
    },
    fishing: {
      name: '钓鱼', emoji: '🎣',
      levels: [
        { level: 1, cost: 1, name: '初级钓鱼', desc: '+10金币/天', bonus: { dailyGold: 10 } },
        { level: 2, cost: 2, name: '中级钓鱼', desc: '+15金币/天', bonus: { dailyGold: 15 } },
        { level: 3, cost: 3, name: '高级钓鱼', desc: '20%双倍', bonus: { harvestDoubleChance: 0.20 } },
        { level: 4, cost: 4, name: '大师钓鱼', desc: '35%双倍', bonus: { harvestDoubleChance: 0.15 } },
        { level: 5, cost: 5, name: '钓鱼之王', desc: '额外+50金', bonus: { harvestExtraGold: 50 } },
      ]
    },
    mining: {
      name: '采矿', emoji: '⛏️',
      levels: [
        { level: 1, cost: 1, name: '初级采矿', desc: '种子-10%', bonus: { seedDiscount: 0.10 } },
        { level: 2, cost: 2, name: '中级采矿', desc: '种子-10%', bonus: { seedDiscount: 0.10 } },
        { level: 3, cost: 3, name: '高级采矿', desc: '种植+5经验', bonus: { plantExp: 5 } },
        { level: 4, cost: 4, name: '大师采矿', desc: '杂交+25%', bonus: { hybridChance: 0.25 } },
        { level: 5, cost: 5, name: '采矿之王', desc: '种子免费', bonus: { seedFree: true } },
      ]
    },
    cooking: {
      name: '烹饪', emoji: '🍳',
      levels: [
        { level: 1, cost: 1, name: '初级烹饪', desc: '浇水+1秒', bonus: { waterBonus: 1 } },
        { level: 2, cost: 2, name: '中级烹饪', desc: '浇水+1秒', bonus: { waterBonus: 1 } },
        { level: 3, cost: 3, name: '高级烹饪', desc: '生长-15%', bonus: { allGrowthReduce: 0.15 } },
        { level: 4, cost: 4, name: '大师烹饪', desc: '生长-15%', bonus: { allGrowthReduce: 0.15 } },
        { level: 5, cost: 5, name: '厨神', desc: '瞬间成熟', bonus: { instantGrow: true } },
      ]
    },
  },

  // 土地布局：3列4行
  landLayout: [
    { col: 0, row: 0, unlockLevel: 1 }, { col: 1, row: 0, unlockLevel: 1 }, { col: 2, row: 0, unlockLevel: 1 },
    { col: 0, row: 1, unlockLevel: 1 }, { col: 1, row: 1, unlockLevel: 1 }, { col: 2, row: 1, unlockLevel: 1 },
    { col: 0, row: 2, unlockLevel: 2 }, { col: 1, row: 2, unlockLevel: 2 }, { col: 2, row: 2, unlockLevel: 3 },
    { col: 0, row: 3, unlockLevel: 3 }, { col: 1, row: 3, unlockLevel: 4 }, { col: 2, row: 3, unlockLevel: 4 },
  ],

  totalLandCount: 12,
  cols: 3,
  rows: 4,
  harvestMilestone: 15,
  goldMilestone: 500,
  orderRefreshInterval: 2 * 60 * 60 * 1000, // 2小时
};