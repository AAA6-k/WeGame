// js/player.js - 玩家数据管理
const CONFIG = require('./config.js');

let _data = null;
let _saveFn = null;

function init(saveFn) {
  _saveFn = saveFn;
  // 默认数据
  _data = {
    gold: 100,
    seeds: 3,
    level: 1,
    exp: 0,
    skillPoints: 0,
    harvestCount: 0,
    totalGoldEarned: 0,
    hybridDiscovered: [],
    harvestMilestone: CONFIG.harvestMilestone,
    goldMilestone: CONFIG.goldMilestone,
    inventory: {},
    orders: [],
    orderNextRefresh: 0,
    learnedSkills: { farming: 0, fishing: 0, mining: 0, cooking: 0 },
  };
}

function data() { return _data; }

function loadFrom(saved) {
  var d = _data;
  d.gold = saved.gold != null ? saved.gold : 100;
  d.seeds = saved.seeds != null ? saved.seeds : 3;
  d.level = saved.level || 1;
  d.exp = saved.exp || 0;
  d.skillPoints = saved.skillPoints || 0;
  d.learnedSkills = saved.learnedSkills || { farming: 0, fishing: 0, mining: 0, cooking: 0 };
  d.harvestCount = saved.harvestCount || 0;
  d.totalGoldEarned = saved.totalGoldEarned || 0;
  d.hybridDiscovered = saved.hybridDiscovered || [];
  d.harvestMilestone = saved.harvestMilestone || CONFIG.harvestMilestone;
  d.goldMilestone = saved.goldMilestone || CONFIG.goldMilestone;
  d.inventory = saved.inventory || {};
  d.orders = saved.orders || [];
  d.orderNextRefresh = saved.orderNextRefresh || 0;
}

function toSaveObj(lands) {
  var d = _data;
  return {
    gold: d.gold, seeds: d.seeds, level: d.level, exp: d.exp,
    skillPoints: d.skillPoints, learnedSkills: d.learnedSkills,
    harvestCount: d.harvestCount, totalGoldEarned: d.totalGoldEarned,
    hybridDiscovered: d.hybridDiscovered,
    harvestMilestone: d.harvestMilestone, goldMilestone: d.goldMilestone,
    inventory: d.inventory, orders: d.orders, orderNextRefresh: d.orderNextRefresh,
    lands: lands,
  };
}

function save(lands) {
  if (_saveFn) _saveFn(toSaveObj(lands));
}

function getLevelUpExp() {
  var idx = _data.level;
  if (idx >= CONFIG.levelExp.length) return 999999;
  return CONFIG.levelExp[idx];
}

function checkLevelUp() {
  var d = _data;
  var oldLevel = d.level;
  while (d.level < CONFIG.levelExp.length && d.exp >= CONFIG.levelExp[d.level]) {
    d.level++;
    d.skillPoints += 2;
  }
  return d.level > oldLevel;
}

function getAvailableLandCount() {
  var idx = Math.min(_data.level - 1, CONFIG.levelLands.length - 1);
  return CONFIG.levelLands[idx];
}

function getAvailableCrops() {
  return Object.keys(CONFIG.cropConfig).filter(function(k) {
    return CONFIG.cropConfig[k].unlockLevel <= _data.level;
  });
}

function getAllBonuses() {
  var bonuses = {};
  var tree = CONFIG.skillTree;
  var learned = _data.learnedSkills;
  Object.keys(tree).forEach(function(skillId) {
    var skill = tree[skillId];
    var lv = learned[skillId] || 0;
    for (var i = 0; i < lv; i++) {
      var lvData = skill.levels[i];
      if (lvData && lvData.bonus) {
        Object.keys(lvData.bonus).forEach(function(k) {
          if (typeof lvData.bonus[k] === 'number') {
            bonuses[k] = (bonuses[k] || 0) + lvData.bonus[k];
          } else {
            bonuses[k] = lvData.bonus[k];
          }
        });
      }
    }
  });
  return bonuses;
}

function getAppliedPrice(basePrice) {
  var b = getAllBonuses();
  var price = basePrice;
  if (b.priceDouble) price *= 2;
  if (b.harvestGoldBoost) price = Math.floor(price * (1 + b.harvestGoldBoost));
  if (b.harvestDoubleChance && Math.random() < b.harvestDoubleChance) price *= 2;
  if (b.harvestExtraGold) price += b.harvestExtraGold;
  return price;
}

function addGold(amount) {
  _data.gold += amount;
  _data.totalGoldEarned += amount;
  // 金币里程碑
  var gain = 0;
  while (_data.totalGoldEarned >= _data.goldMilestone) {
    _data.skillPoints++;
    gain++;
    _data.goldMilestone += CONFIG.goldMilestone;
  }
  return gain;
}

function addExp(amount) {
  var b = getAllBonuses();
  if (b.expBoost) amount = Math.floor(amount * (1 + b.expBoost));
  _data.exp += amount;
  var leveledUp = checkLevelUp();
  return leveledUp ? _data.level : false;
}

function getSeedPrice(cropType) {
  var config = CONFIG.cropConfig[cropType];
  var price = config.seedPrice;
  var b = getAllBonuses();
  if (b.seedFree) return 0;
  if (b.seedDiscount) price = Math.floor(price * (1 - b.seedDiscount));
  return price;
}

module.exports = {
  init: init, data: data, loadFrom: loadFrom, toSaveObj: toSaveObj,
  save: save, getLevelUpExp: getLevelUpExp, checkLevelUp: checkLevelUp,
  getAvailableLandCount: getAvailableLandCount,
  getAvailableCrops: getAvailableCrops,
  getAllBonuses: getAllBonuses, getAppliedPrice: getAppliedPrice,
  addGold: addGold, addExp: addExp, getSeedPrice: getSeedPrice,
};