// utils/hybrid.js

function getAppIns() { return getApp(); }

function isAdjacent(landIdA, landIdB) {
  const cols = 4;
  const rowA = Math.floor(landIdA / cols);
  const colA = landIdA % cols;
  const rowB = Math.floor(landIdB / cols);
  const colB = landIdB % cols;
  return Math.abs(rowA - rowB) + Math.abs(colA - colB) === 1;
}

function breed(landIdA, landIdB) {
  const app = getAppIns();
  const data = app.globalData;
  const landA = data.lands[landIdA];
  const landB = data.lands[landIdB];

  if (!landA || !landB) return { success: false, msg: '土地数据异常' };
  if (landA.stage !== 4 || landB.stage !== 4) return { success: false, msg: '两块土地都必须是成熟作物' };
  if (!isAdjacent(landIdA, landIdB)) return { success: false, msg: '两块土地必须相邻' };

  const result = app.getHybridResult(landA.cropType, landB.cropType);
  if (!result) return { success: false, msg: '这两种作物无法杂交' };
  if (result.locked) return { success: false, msg: '需要达到 Lv.' + result.needLevel + ' 才能解锁该杂交配方' };

  var cost = Math.floor(result.price * 0.3);
  if (data.gold < cost) return { success: false, msg: '杂交需要 ' + cost + ' 金币' };
  data.gold -= cost;

  var bonuses = app.getAllBonuses();
  var baseChance = 0.7;
  var extraChance = bonuses.hybridChance || 0;
  var success = Math.random() < (baseChance + extraChance);

  if (!success) {
    landA.cropType = null; landA.stage = 0; landA.plantTime = 0; landA.growTime = 0; landA.watered = false; landA.animState = '';
    landB.cropType = null; landB.stage = 0; landB.plantTime = 0; landB.growTime = 0; landB.watered = false; landB.animState = '';
    app.saveData();
    return { success: false, msg: '杂交失败，两种作物已消耗', failed: true };
  }

  var newCropKey = 'hybrid_' + landIdA + '_' + landIdB + '_' + Date.now();
  data.cropConfig[newCropKey] = {
    name: result.name, emoji: result.emoji, growTime: result.growTime,
    price: result.price, seedPrice: 0, unlockLevel: 1,
    expReward: result.expReward, color: '#FFD700', type: 'hybrid',
    hybrid: true, parents: [landA.cropType, landB.cropType],
  };

  landA.cropType = newCropKey;
  landA.stage = 1;
  landA.plantTime = Date.now();
  landA.growTime = result.growTime;
  landA.watered = false;
  landA.animState = 'planting';

  landB.cropType = null; landB.stage = 0; landB.plantTime = 0; landB.growTime = 0; landB.watered = false; landB.animState = '';

  app.saveData();
  return { success: true, hybrid: result, landId: landIdA, cropKey: newCropKey };
}

module.exports = { isAdjacent: isAdjacent, breed: breed };
