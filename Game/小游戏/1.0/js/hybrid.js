// js/hybrid.js - 杂交系统
const CONFIG = require('./config.js');
const Player = require('./player.js');
const Farm = require('./farm.js');

function breed(parentAId, parentBId) {
  var landA = Farm.getLand(parentAId);
  var landB = Farm.getLand(parentBId);
  if (!landA || !landB) return { success: false, msg: '土地无效' };
  if (landA.stage !== 4 || landB.stage !== 4) return { success: false, msg: '需要两块成熟作物' };
  
  // 检查相邻
  var dr = Math.abs(landA.row - landB.row);
  var dc = Math.abs(landA.col - landB.col);
  if (!(dr + dc === 1)) return { success: false, msg: '需要相邻土地' };
  
  var key = [landA.cropType, landB.cropType].sort().join('_');
  var recipe = CONFIG.hybridRecipes[key];
  if (!recipe) return { success: false, msg: '这两种作物无法杂交' };
  if (Player.data().level < recipe.unlockLevel) return { success: false, msg: '需要达到 ' + recipe.unlockLevel + ' 级' };
  
  // 成功率
  var b = Player.getAllBonuses();
  var chance = 0.6 + (b.hybridChance || 0);
  var success = Math.random() < chance;
  
  if (!success) {
    // 失败：重置两块地
    landA.cropType = null; landA.stage = 0; landA.plantTime = 0; landA.growTime = 0; landA.watered = false; landA.selected = false;
    landB.cropType = null; landB.stage = 0; landB.plantTime = 0; landB.growTime = 0; landB.watered = false; landB.selected = false;
    return { success: false, msg: '杂交失败，作物枯萎了' };
  }
  
  // 成功：在A地生成杂交作物
  landA.cropType = key;
  landA.stage = 4;
  landA.plantTime = Date.now();
  landA.growTime = 0;
  landA.watered = false;
  landA.selected = false;
  
  // B地重置
  landB.cropType = null; landB.stage = 0; landB.plantTime = 0; landB.growTime = 0; landB.watered = false; landB.selected = false;
  
  // 首次发现奖励
  var isNew = false;
  if (Player.data().hybridDiscovered.indexOf(key) === -1) {
    Player.data().hybridDiscovered.push(key);
    Player.data().skillPoints++;
    isNew = true;
  }
  
  return { success: true, msg: '杂交成功！获得 ' + recipe.name, isNewDiscovery: isNew, recipe: recipe };
}

module.exports = { breed: breed };