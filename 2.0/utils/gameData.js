// utils/gameData.js - 游戏数据管理工具

function getAppIns() {
  return getApp();
}

function getData() {
  return getAppIns().globalData;
}

function cloneLands() {
  return JSON.parse(JSON.stringify(getData().lands));
}

function save() {
  getAppIns().saveData();
}

/**
 * 购买种子
 */
function buySeed(cropType) {
  const data = getData();
  const config = data.cropConfig[cropType];
  if (!config) return { success: false, msg: '未知作物' };
  if (data.level < config.unlockLevel) return { success: false, msg: `需要达到 ${config.unlockLevel} 级才能购买` };
  if (data.gold < config.seedPrice) return { success: false, msg: '金币不足' };
  data.gold -= config.seedPrice;
  data.seeds += 1;
  save();
  return { success: true, msg: `购买成功！获得${config.name}种子 x1` };
}

/**
 * 种植作物
 */
function plantCrop(landId, cropType) {
  const data = getData();
  const land = data.lands[landId];
  if (!land || land.stage !== 0) return { success: false, msg: '该土地不可种植' };
  if (data.level < land.unlockLevel) return { success: false, msg: `需要达到 ${land.unlockLevel} 级才能解锁该土地` };
  if (data.seeds <= 0) return { success: false, msg: '没有种子了' };
  const config = data.cropConfig[cropType];
  if (!config) return { success: false, msg: '未知作物' };
  if (data.level < config.unlockLevel) return { success: false, msg: `需要达到 ${config.unlockLevel} 级才能种植` };

  data.seeds -= 1;
  land.cropType = cropType;
  land.stage = 1;
  land.plantTime = Date.now();
  land.growTime = config.growTime;
  land.watered = false;
  land.animState = 'planting';

  save();
  return { success: true, land, config };
}

/**
 * 浇水
 */
function waterLand(landId) {
  const data = getData();
  const land = data.lands[landId];
  if (!land || land.stage === 0 || land.stage === 4) return { success: false, msg: '该土地不需要浇水' };
  if (land.watered) return { success: false, msg: '已经浇过水了' };

  land.watered = true;
  land.growTime = Math.max(0, land.growTime - 2);
  land.animState = 'watering';

  save();
  return { success: true, land };
}

/**
 * 收获作物
 */
function harvestLand(landId) {
  const data = getData();
  const land = data.lands[landId];
  if (!land || land.stage !== 4) return { success: false, msg: '作物未成熟' };

  const config = data.cropConfig[land.cropType];
  if (!config) return { success: false, msg: '作物配置异常' };

  land.animState = 'harvesting';
  data.gold += config.price;

  // 增加经验
  data.exp += config.expReward;
  const oldLevel = data.level;
  checkLevelUp();

  const reward = config.price;
  const cropName = config.name;
  const leveledUp = data.level > oldLevel;

  save();
  return { success: true, land, reward, cropName, leveledUp, newLevel: data.level };
}

/**
 * 检查升级
 */
function checkLevelUp() {
  const data = getData();
  const levelExp = data.levelExp;
  while (data.level < levelExp.length && data.exp >= levelExp[data.level]) {
    data.level += 1;
  }
}

/**
 * 重置土地为空地
 */
function resetLand(landId) {
  const data = getData();
  const land = data.lands[landId];
  if (!land) return;
  land.cropType = null;
  land.stage = 0;
  land.plantTime = 0;
  land.growTime = 0;
  land.watered = false;
  land.animState = '';
  land.coinFly = false;
  save();
}

/**
 * 更新所有土地的生长状态
 */
function updateGrowth() {
  const data = getData();
  const now = Date.now();
  const updates = [];

  data.lands.forEach((land, index) => {
    if (land.stage === 0 || land.stage === 4) return;

    const elapsed = (now - land.plantTime) / 1000;
    const remainTime = land.growTime - elapsed;

    if (remainTime <= 0) {
      if (land.stage !== 4) {
        land.stage = 4;
        land.animState = 'shaking';
        updates.push({ id: index, stage: 4 });
      }
    } else if (remainTime <= land.growTime * 0.3) {
      if (land.stage !== 3) {
        land.stage = 3;
        land.animState = '';
        updates.push({ id: index, stage: 3 });
      }
    } else if (remainTime <= land.growTime * 0.6) {
      if (land.stage !== 2) {
        land.stage = 2;
        land.animState = '';
        updates.push({ id: index, stage: 2 });
      }
    }
  });

  if (updates.length > 0) save();
  return updates;
}

function getStageInfo(stage, cropConfig) {
  if (!cropConfig) return { label: '空地', emoji: '🟫', class: 'land-empty' };
  const stages = [
    { label: '空地', emoji: '🟫', class: 'land-empty' },
    { label: '种子', emoji: '🌰', class: 'land-seed' },
    { label: '幼苗', emoji: '🌱', class: 'land-sprout' },
    { label: '成长中', emoji: '🌿', class: 'land-growing' },
    { label: '成熟', emoji: cropConfig.emoji, class: 'land-mature' },
  ];
  return stages[stage] || stages[0];
}

function getRemainTime(land) {
  if (land.stage === 0 || land.stage === 4) return 0;
  const elapsed = (Date.now() - land.plantTime) / 1000;
  return Math.max(0, Math.ceil(land.growTime - elapsed));
}

module.exports = {
  getData,
  save,
  cloneLands,
  buySeed,
  plantCrop,
  waterLand,
  harvestLand,
  resetLand,
  updateGrowth,
  getStageInfo,
  getRemainTime,
  checkLevelUp,
};