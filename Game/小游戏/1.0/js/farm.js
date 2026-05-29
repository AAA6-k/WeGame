// js/farm.js - 农场土地管理
const CONFIG = require('./config.js');
const Player = require('./player.js');

let _lands = [];

function init() {
  _lands = [];
  var layout = CONFIG.landLayout;
  for (var i = 0; i < layout.length; i++) {
    var l = layout[i];
    _lands.push({
      id: i,
      col: l.col, row: l.row,
      unlockLevel: l.unlockLevel,
      cropType: null,
      stage: 0, // 0空 1幼苗 2生长 3开花 4成熟
      plantTime: 0,
      growTime: 0,
      watered: false,
      selected: false,
      animState: '',
      coinFly: false,
    });
  }
}

function lands() { return _lands; }

function getLand(id) { return _lands[id]; }

function getLandAt(col, row) {
  for (var i = 0; i < _lands.length; i++) {
    var l = _lands[i];
    if (l.col === col && l.row === row) return l;
  }
  return null;
}

function plant(landId, cropType) {
  var land = _lands[landId];
  if (!land || land.stage !== 0) return false;
  if (Player.data().level < land.unlockLevel) return false;
  
  var config = CONFIG.cropConfig[cropType];
  if (!config) return false;
  if (Player.data().level < config.unlockLevel) return false;
  
  land.cropType = cropType;
  land.stage = 1;
  land.plantTime = Date.now();
  
  var b = Player.getAllBonuses();
  var growTime = config.growTime;
  if (b.allGrowthReduce) growTime = growTime * (1 - b.allGrowthReduce);
  if (b.instantGrow) growTime = 1;
  land.growTime = Math.max(1, Math.floor(growTime));
  land.watered = false;
  land.animState = 'planting';
  
  if (b.plantExp) Player.addExp(b.plantExp);
  return true;
}

function water(landId) {
  var land = _lands[landId];
  if (!land || land.stage === 0 || land.stage === 4) return false;
  if (land.watered) return false;
  
  var b = Player.getAllBonuses();
  var waterEffect = 2 + (b.waterBonus || 0);
  land.watered = true;
  land.growTime = Math.max(0, land.growTime - waterEffect);
  land.animState = 'watering';
  return true;
}

function harvest(landId) {
  var land = _lands[landId];
  if (!land || land.stage !== 4) return null;
  
  var config = CONFIG.cropConfig[land.cropType];
  if (!config) return null;
  
  var price = Player.getAppliedPrice(config.price);
  Player.addGold(price);
  Player.data().harvestCount++;
  
  // 原料入库
  var inv = Player.data().inventory;
  inv[land.cropType] = (inv[land.cropType] || 0) + 1;
  
  // 收获里程碑
  var harvestGain = 0;
  while (Player.data().harvestCount >= Player.data().harvestMilestone) {
    Player.data().skillPoints++;
    harvestGain++;
    Player.data().harvestMilestone += CONFIG.harvestMilestone;
  }
  
  var leveledUp = Player.addExp(config.expReward);
  
  land.animState = 'harvesting';
  land.coinFly = true;
  setTimeout(function() { land.coinFly = false; }, 1000);
  
  // 重置土地
  land.cropType = null;
  land.stage = 0;
  land.plantTime = 0;
  land.growTime = 0;
  land.watered = false;
  land.selected = false;
  
  return {
    success: true,
    reward: price,
    cropName: config.name,
    leveledUp: leveledUp,
    newLevel: Player.data().level,
    harvestGain: harvestGain,
  };
}

function updateGrowth() {
  var now = Date.now();
  var updates = [];
  
  for (var i = 0; i < _lands.length; i++) {
    var land = _lands[i];
    if (land.stage === 0 || land.stage === 4) continue;
    var elapsed = (now - land.plantTime) / 1000;
    var remain = land.growTime - elapsed;
    
    if (remain <= 0) {
      if (land.stage !== 4) { land.stage = 4; updates.push({ id: i, stage: 4 }); }
    } else if (remain <= land.growTime * 0.3) {
      if (land.stage !== 3) { land.stage = 3; updates.push({ id: i, stage: 3 }); }
    } else if (remain <= land.growTime * 0.6) {
      if (land.stage !== 2) { land.stage = 2; updates.push({ id: i, stage: 2 }); }
    }
  }
  return updates;
}

function getRemainTime(land) {
  if (land.stage === 0 || land.stage === 4) return 0;
  return Math.max(0, Math.ceil(land.growTime - (Date.now() - land.plantTime) / 1000));
}

function getSelectedCount() {
  var cnt = 0;
  for (var i = 0; i < _lands.length; i++) {
    if (_lands[i].selected) cnt++;
  }
  return cnt;
}

module.exports = {
  init: init, lands: lands, getLand: getLand, getLandAt: getLandAt,
  plant: plant, water: water, harvest: harvest,
  updateGrowth: updateGrowth, getRemainTime: getRemainTime,
  getSelectedCount: getSelectedCount,
};