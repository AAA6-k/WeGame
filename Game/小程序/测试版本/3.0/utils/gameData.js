// utils/gameData.js

function getAppIns() { return getApp(); }
function getData() { return getAppIns().globalData; }
function cloneLands() { return JSON.parse(JSON.stringify(getData().lands)); }
function save() { getAppIns().saveData(); }

function buySeed(cropType) {
  var data = getData();
  var config = data.cropConfig[cropType];
  if (!config) return { success: false, msg: '未知作物' };
  if (data.level < config.unlockLevel) return { success: false, msg: '需要达到 ' + config.unlockLevel + ' 级才能购买' };

  var bonuses = getAppIns().getAllBonuses();
  var price = config.seedPrice;
  if (bonuses.seedFree) price = 0;
  else if (bonuses.seedDiscount) price = Math.floor(price * (1 - bonuses.seedDiscount));

  if (data.gold < price) return { success: false, msg: '金币不足（折后 ' + price + '）' };
  data.gold -= price;
  data.seeds += 1;
  save();
  return { success: true, msg: '购买成功！获得' + config.name + '种子 x1' };
}

function plantCrop(landId, cropType) {
  var data = getData();
  var land = data.lands[landId];
  if (!land || land.stage !== 0) return { success: false, msg: '该土地不可种植' };
  if (data.level < land.unlockLevel) return { success: false, msg: '需要达到 ' + land.unlockLevel + ' 级' };
  if (data.seeds <= 0) return { success: false, msg: '没有种子了' };
  var config = data.cropConfig[cropType];
  if (!config) return { success: false, msg: '未知作物' };
  if (data.level < config.unlockLevel) return { success: false, msg: '需要达到 ' + config.unlockLevel + ' 级' };

  data.seeds -= 1;
  land.cropType = cropType;
  land.stage = 1;
  land.plantTime = Date.now();

  var bonuses = getAppIns().getAllBonuses();
  var growTime = config.growTime;
  if (bonuses.allGrowthReduce) growTime = growTime * (1 - bonuses.allGrowthReduce);
  if (bonuses.instantGrow) growTime = 1;
  land.growTime = Math.max(1, Math.floor(growTime));
  land.watered = false;
  land.animState = 'planting';

  if (bonuses.plantExp) { data.exp += bonuses.plantExp; checkLevelUp(); }

  save();
  return { success: true, land: land, config: config };
}

function waterLand(landId) {
  var data = getData();
  var land = data.lands[landId];
  if (!land || land.stage === 0 || land.stage === 4) return { success: false, msg: '该土地不需要浇水' };
  if (land.watered) return { success: false, msg: '已经浇过水了' };

  var bonuses = getAppIns().getAllBonuses();
  var waterEffect = 2 + (bonuses.waterBonus || 0);
  land.watered = true;
  land.growTime = Math.max(0, land.growTime - waterEffect);
  land.animState = 'watering';

  save();
  return { success: true, land: land };
}

function harvestLand(landId) {
  var data = getData();
  var land = data.lands[landId];
  if (!land || land.stage !== 4) return { success: false, msg: '作物未成熟' };

  var config = data.cropConfig[land.cropType];
  if (!config) return { success: false, msg: '作物配置异常' };

  var bonuses = getAppIns().getAllBonuses();
  var price = config.price;
  if (bonuses.priceDouble) price = price * 2;
  if (bonuses.harvestGoldBoost) price = Math.floor(price * (1 + bonuses.harvestGoldBoost));
  if (bonuses.harvestDoubleChance && Math.random() < bonuses.harvestDoubleChance) price = price * 2;
  if (bonuses.harvestExtraGold) price += bonuses.harvestExtraGold;

  land.animState = 'harvesting';
  data.gold += price;

  var expReward = config.expReward;
  if (bonuses.expBoost) expReward = Math.floor(expReward * (1 + bonuses.expBoost));
  data.exp += expReward;

  var oldLevel = data.level;
  checkLevelUp();

  var leveledUp = data.level > oldLevel;
  save();
  return { success: true, land: land, reward: price, cropName: config.name, leveledUp: leveledUp, newLevel: data.level };
}

function checkLevelUp() {
  var data = getData();
  var levelExp = data.levelExp;
  while (data.level < levelExp.length && data.exp >= levelExp[data.level]) {
    data.level += 1;
    data.skillPoints += 1;
  }
}

function resetLand(landId) {
  var data = getData();
  var land = data.lands[landId];
  if (!land) return;
  land.cropType = null; land.stage = 0; land.plantTime = 0;
  land.growTime = 0; land.watered = false; land.animState = ''; land.selected = false;
  save();
}

function updateGrowth() {
  var data = getData();
  var now = Date.now();
  var updates = [];

  data.lands.forEach(function(land, index) {
    if (land.stage === 0 || land.stage === 4) return;
    var elapsed = (now - land.plantTime) / 1000;
    var remainTime = land.growTime - elapsed;

    if (remainTime <= 0) {
      if (land.stage !== 4) { land.stage = 4; updates.push({ id: index, stage: 4 }); }
    } else if (remainTime <= land.growTime * 0.3) {
      if (land.stage !== 3) { land.stage = 3; updates.push({ id: index, stage: 3 }); }
    } else if (remainTime <= land.growTime * 0.6) {
      if (land.stage !== 2) { land.stage = 2; updates.push({ id: index, stage: 2 }); }
    }
  });

  if (updates.length > 0) save();
  return updates;
}

function getRemainTime(land) {
  if (land.stage === 0 || land.stage === 4) return 0;
  return Math.max(0, Math.ceil(land.growTime - (Date.now() - land.plantTime) / 1000));
}

module.exports = {
  getData: getData, save: save, cloneLands: cloneLands, buySeed: buySeed,
  plantCrop: plantCrop, waterLand: waterLand, harvestLand: harvestLand,
  resetLand: resetLand, updateGrowth: updateGrowth,
  getRemainTime: getRemainTime, checkLevelUp: checkLevelUp,
};
