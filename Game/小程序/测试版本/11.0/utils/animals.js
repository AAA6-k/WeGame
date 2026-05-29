// utils/animals.js
// 动物养殖系统工具模块

function getAppIns() { return getApp(); }
function getData() { return getAppIns().globalData; }
function save() { getAppIns().saveData(); }

// 动物配置
var animalConfig = {
  chicken: { name: '鸡', emoji: '🐔', unlockLevel: 2, price: 300, product: '鸡蛋', productKey: 'animal_egg', produceInterval: 30, productPrice: 25 },
  cow: { name: '奶牛', emoji: '🐄', unlockLevel: 4, price: 800, product: '牛奶', productKey: 'animal_milk', produceInterval: 60, productPrice: 60 },
  sheep: { name: '绵羊', emoji: '🐑', unlockLevel: 5, price: 1200, product: '羊毛', productKey: 'animal_wool', produceInterval: 90, productPrice: 90 },
  pig: { name: '猪', emoji: '🐖', unlockLevel: 6, price: 2000, product: '猪肉', productKey: 'animal_pork', produceInterval: 120, productPrice: 150 },
};

function getAnimalConfig(type) {
  return animalConfig[type] || null;
}

function buyAnimal(animalType) {
  var data = getData();
  var config = animalConfig[animalType];
  if (!config) return { success: false, msg: '未知动物类型' };
  if (data.level < config.unlockLevel) return { success: false, msg: '需要达到 ' + config.unlockLevel + ' 级' };
  if (data.gold < config.price) return { success: false, msg: '金币不足（需要 ' + config.price + '）' };
  if (!data.animals) data.animals = [];
  if (data.animals.length >= 10) return { success: false, msg: '动物栏已满（最多10只）' };

  data.gold -= config.price;
  data.animals.push({
    id: Date.now() + Math.random(),
    type: animalType,
    name: config.name,
    emoji: config.emoji,
    productReady: false,
    feedCount: 0,
    lastFeedTime: 0,
    produceInterval: config.produceInterval,
    product: config.productKey,
    productName: config.product,
    productPrice: config.productPrice,
  });
  save();
  return { success: true, msg: '成功购买了' + config.name + '！' };
}

function feedAnimal(animalId) {
  var data = getData();
  if (!data.animals) return { success: false, msg: '没有动物' };
  if (data.seeds <= 0) return { success: false, msg: '没有种子可以喂食' };

  var animal = null;
  for (var i = 0; i < data.animals.length; i++) {
    if (data.animals[i].id === animalId) { animal = data.animals[i]; break; }
  }
  if (!animal) return { success: false, msg: '找不到该动物' };
  if (animal.productReady) return { success: false, msg: '产物已就绪，请先收取' };
  if (animal.lastFeedTime > 0) {
    var elapsed = (Date.now() - animal.lastFeedTime) / 1000;
    if (elapsed < animal.produceInterval) return { success: false, msg: '已经在产出了，请等待' };
  }

  data.seeds -= 1;
  animal.feedCount += 1;
  animal.lastFeedTime = Date.now();
  animal.productReady = false;
  save();
  return { success: true, msg: '喂食成功！' };
}

function collectProduct(animalId) {
  var data = getData();
  if (!data.animals) return { success: false, msg: '没有动物' };

  var animal = null;
  for (var i = 0; i < data.animals.length; i++) {
    if (data.animals[i].id === animalId) { animal = data.animals[i]; break; }
  }
  if (!animal) return { success: false, msg: '找不到该动物' };
  if (!animal.productReady) return { success: false, msg: '产物尚未就绪，请先喂食' };

  if (!data.inventory) data.inventory = {};
  data.inventory[animal.product] = (data.inventory[animal.product] || 0) + 1;
  animal.productReady = false;
  animal.feedCount = 0;
  animal.lastFeedTime = 0;
  save();
  return { success: true, msg: '收取 ' + animal.productName + ' x1！', productName: animal.productName, productKey: animal.product };
}

function updateAnimals() {
  var data = getData();
  if (!data.animals || data.animals.length === 0) return false;
  var now = Date.now();
  var changed = false;
  for (var i = 0; i < data.animals.length; i++) {
    var animal = data.animals[i];
    if (animal.productReady) continue;
    if (animal.lastFeedTime <= 0) continue;
    var elapsed = (now - animal.lastFeedTime) / 1000;
    if (elapsed >= animal.produceInterval) { animal.productReady = true; changed = true; }
  }
  if (changed) save();
  return changed;
}

function getAnimalRemainTime(animal) {
  if (animal.productReady) return 0;
  if (animal.lastFeedTime <= 0) return -1;
  var elapsed = (Date.now() - animal.lastFeedTime) / 1000;
  return Math.max(0, Math.ceil(animal.produceInterval - elapsed));
}

module.exports = {
  getAnimalConfig: getAnimalConfig, buyAnimal: buyAnimal,
  feedAnimal: feedAnimal, collectProduct: collectProduct,
  updateAnimals: updateAnimals, getAnimalRemainTime: getAnimalRemainTime,
  animalConfig: animalConfig,
};