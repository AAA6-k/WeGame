// utils/kitchen.js

function getAppIns() { return getApp(); }
function getData() { return getAppIns().globalData; }
function save() { getAppIns().saveData(); }

// 烹饪
function cook(recipeId) {
  var data = getData();
  var recipe = data.cookingRecipes[recipeId];
  if (!recipe) return { success: false, msg: '未知配方' };
  if (data.level < recipe.unlockLevel) return { success: false, msg: '需要达到 ' + recipe.unlockLevel + ' 级' };
  
  // 检查原料
  for (var crop in recipe.ingredients) {
    var need = recipe.ingredients[crop];
    var have = data.inventory[crop] || 0;
    if (have < need) return { success: false, msg: '缺少' + data.cropConfig[crop].name + ' x' + (need - have) };
  }
  
  // 检查金币
  if (data.gold < recipe.cost) return { success: false, msg: '金币不足（需要 ' + recipe.cost + '）' };
  
  // 扣除原料和金币
  for (var crop in recipe.ingredients) {
    data.inventory[crop] -= recipe.ingredients[crop];
    if (data.inventory[crop] <= 0) delete data.inventory[crop];
  }
  data.gold -= recipe.cost;
  
  // 获得产品（放入库存）
  var productKey = 'cooked_' + recipeId;
  data.inventory[productKey] = (data.inventory[productKey] || 0) + 1;
  
  // 获得经验
  var exp = recipe.expReward;
  var bonuses = getAppIns().getAllBonuses();
  if (bonuses.expBoost) exp = Math.floor(exp * (1 + bonuses.expBoost));
  data.exp += exp;
  
  var oldLevel = data.level;
  getAppIns().checkLevelUp();
  var leveledUp = data.level > oldLevel;
  
  save();
  return { success: true, msg: '成功制作 ' + recipe.name + '！获得经验 ' + exp, product: productKey, leveledUp: leveledUp };
}

// 出售产品
function sellProduct(productKey, count) {
  var data = getData();
  var have = data.inventory[productKey] || 0;
  if (have < count) return { success: false, msg: '库存不足' };
  
  var price = 0;
  if (productKey.startsWith('cooked_')) {
    var recipeId = productKey.replace('cooked_', '');
    var recipe = data.cookingRecipes[recipeId];
    if (!recipe) return { success: false, msg: '产品无效' };
    price = recipe.price;
  } else {
    // 原料
    var crop = data.cropConfig[productKey];
    if (!crop) return { success: false, msg: '未知物品' };
    price = crop.price;
  }
  
  // 技能加成
  var bonuses = getAppIns().getAllBonuses();
  if (bonuses.priceDouble) price = price * 2;
  if (bonuses.harvestGoldBoost) price = Math.floor(price * (1 + bonuses.harvestGoldBoost));
  if (bonuses.harvestExtraGold) price += bonuses.harvestExtraGold;
  
  var total = price * count;
  data.gold += total;
  data.totalGoldEarned += total;
  data.inventory[productKey] -= count;
  if (data.inventory[productKey] <= 0) delete data.inventory[productKey];
  
  // 金币里程碑
  var goldGain = 0;
  while (data.totalGoldEarned >= data.goldMilestone) {
    data.skillPoints += 1;
    goldGain += 1;
    data.goldMilestone += 500;
  }
  
  save();
  return { success: true, msg: '出售成功，获得 ' + total + ' 金币', goldGain: goldGain };
}

// 订单系统
function refreshOrders() {
  var data = getData();
  var now = Date.now();
  if (data.orderNextRefresh > now) return { success: false, msg: '订单尚未刷新' };
  
  data.orders = [];
  var possibleItems = [];
  // 原料
  for (var crop in data.cropConfig) {
    possibleItems.push({ type: 'crop', id: crop });
  }
  // 产品
  for (var recipeId in data.cookingRecipes) {
    possibleItems.push({ type: 'cooked', id: recipeId });
  }
  
  // 生成3个订单
  for (var i = 0; i < 3; i++) {
    var item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
    var count = Math.floor(Math.random() * 3) + 1;
    var rewardExp = Math.floor(Math.random() * 20) + 10;
    var rewardSkill = Math.random() < 0.3 ? 1 : 0;
    data.orders.push({
      id: 'order_' + i + '_' + now,
      itemType: item.type,
      itemId: item.id,
      count: count,
      rewardExp: rewardExp,
      rewardSkill: rewardSkill,
      completed: false
    });
  }
  
  data.orderNextRefresh = now + 2 * 60 * 60 * 1000; // 2小时后刷新
  save();
  return { success: true, msg: '订单已刷新', orders: data.orders };
}

function completeOrder(orderId) {
  var data = getData();
  var order = data.orders.find(o => o.id === orderId);
  if (!order) return { success: false, msg: '订单不存在' };
  if (order.completed) return { success: false, msg: '订单已完成' };
  
  var productKey = order.itemType === 'cooked' ? 'cooked_' + order.itemId : order.itemId;
  var have = data.inventory[productKey] || 0;
  if (have < order.count) return { success: false, msg: '库存不足' };
  
  // 扣除物品
  data.inventory[productKey] -= order.count;
  if (data.inventory[productKey] <= 0) delete data.inventory[productKey];
  
  // 奖励
  data.exp += order.rewardExp;
  if (order.rewardSkill > 0) data.skillPoints += order.rewardSkill;
  order.completed = true;
  
  var oldLevel = data.level;
  getAppIns().checkLevelUp();
  var leveledUp = data.level > oldLevel;
  
  save();
  return { success: true, msg: '订单完成！获得经验 ' + order.rewardExp + (order.rewardSkill > 0 ? '，技能点 +' + order.rewardSkill : ''), leveledUp: leveledUp };
}

module.exports = {
  cook: cook,
  sellProduct: sellProduct,
  refreshOrders: refreshOrders,
  completeOrder: completeOrder
};