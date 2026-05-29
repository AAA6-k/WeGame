// js/kitchen.js - 厨房：烹饪+订单
const CONFIG = require('./config.js');
const Player = require('./player.js');

function cook(recipeId) {
  var data = Player.data();
  var recipe = CONFIG.cookingRecipes[recipeId];
  if (!recipe) return { success: false, msg: '未知配方' };
  if (data.level < recipe.unlockLevel) return { success: false, msg: '需要达到 ' + recipe.unlockLevel + ' 级' };
  
  for (var crop in recipe.ingredients) {
    var need = recipe.ingredients[crop];
    var have = data.inventory[crop] || 0;
    if (have < need) return { success: false, msg: '缺少原料' };
  }
  if (data.gold < recipe.cost) return { success: false, msg: '金币不足' };
  
  for (var crop in recipe.ingredients) {
    data.inventory[crop] -= recipe.ingredients[crop];
    if (data.inventory[crop] <= 0) delete data.inventory[crop];
  }
  data.gold -= recipe.cost;
  
  var productKey = 'cooked_' + recipeId;
  data.inventory[productKey] = (data.inventory[productKey] || 0) + 1;
  
  var leveledUp = Player.addExp(recipe.expReward);
  return { success: true, msg: '制作成功！' + recipe.name, product: productKey, leveledUp: leveledUp };
}

function sellProduct(productKey, count) {
  var data = Player.data();
  var have = data.inventory[productKey] || 0;
  if (have < count) return { success: false, msg: '库存不足' };
  
  var price = 0;
  if (productKey.indexOf('cooked_') === 0) {
    var recipe = CONFIG.cookingRecipes[productKey.replace('cooked_', '')];
    if (!recipe) return { success: false, msg: '产品无效' };
    price = recipe.price;
  } else {
    var crop = CONFIG.cropConfig[productKey];
    if (!crop) return { success: false, msg: '未知物品' };
    price = crop.price;
  }
  price = Player.getAppliedPrice(price);
  
  var total = price * count;
  var goldGain = Player.addGold(total);
  data.inventory[productKey] -= count;
  if (data.inventory[productKey] <= 0) delete data.inventory[productKey];
  
  return { success: true, msg: '出售成功！+ ' + total + ' 金币', goldGain: goldGain };
}

function refreshOrders() {
  var data = Player.data();
  var now = Date.now();
  if (data.orderNextRefresh > now) return { success: false, msg: '订单尚未刷新' };
  
  data.orders = [];
  var items = [];
  for (var crop in CONFIG.cropConfig) items.push({ type: 'crop', id: crop });
  for (var rid in CONFIG.cookingRecipes) items.push({ type: 'cooked', id: rid });
  
  for (var i = 0; i < 3; i++) {
    var item = items[Math.floor(Math.random() * items.length)];
    data.orders.push({
      id: 'order_' + i + '_' + now,
      itemType: item.type, itemId: item.id,
      count: Math.floor(Math.random() * 3) + 1,
      rewardExp: Math.floor(Math.random() * 20) + 10,
      rewardSkill: Math.random() < 0.3 ? 1 : 0,
      completed: false,
    });
  }
  data.orderNextRefresh = now + CONFIG.orderRefreshInterval;
  return { success: true, orders: data.orders };
}

function completeOrder(orderId) {
  var data = Player.data();
  var order = null;
  for (var i = 0; i < data.orders.length; i++) {
    if (data.orders[i].id === orderId) { order = data.orders[i]; break; }
  }
  if (!order) return { success: false, msg: '订单不存在' };
  if (order.completed) return { success: false, msg: '已完成' };
  
  var pkey = order.itemType === 'cooked' ? 'cooked_' + order.itemId : order.itemId;
  var have = data.inventory[pkey] || 0;
  if (have < order.count) return { success: false, msg: '库存不足' };
  
  data.inventory[pkey] -= order.count;
  if (data.inventory[pkey] <= 0) delete data.inventory[pkey];
  
  var leveledUp = Player.addExp(order.rewardExp);
  if (order.rewardSkill) data.skillPoints += order.rewardSkill;
  order.completed = true;
  
  return { success: true, msg: '订单完成！', leveledUp: leveledUp };
}

module.exports = { cook: cook, sellProduct: sellProduct, refreshOrders: refreshOrders, completeOrder: completeOrder };