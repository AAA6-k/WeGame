// utils/skills.js

function getAppIns() { return getApp(); }

function learnSkill(skillId) {
  var app = getAppIns();
  var data = app.globalData;
  var tree = data.skillTree[skillId];
  if (!tree) return { success: false, msg: '未知技能' };

  var currentLv = data.learnedSkills[skillId] || 0;
  if (currentLv >= tree.levels.length) return { success: false, msg: '该技能已满级' };

  var nextLv = tree.levels[currentLv];
  if (data.skillPoints < nextLv.cost) return { success: false, msg: '技能点不足，需要 ' + nextLv.cost + ' 点' };

  data.skillPoints -= nextLv.cost;
  data.learnedSkills[skillId] = currentLv + 1;
  app.saveData();

  return {
    success: true,
    skillId: skillId,
    newLevel: currentLv + 1,
    skillName: tree.name,
    levelName: nextLv.name,
    desc: nextLv.desc,
  };
}

function getSkillDetail(skillId) {
  var app = getAppIns();
  var tree = app.globalData.skillTree[skillId];
  if (!tree) return null;
  var learned = app.globalData.learnedSkills[skillId] || 0;
  return {
    name: tree.name,
    emoji: tree.emoji,
    learned: learned,
    maxLevel: tree.levels.length,
    levels: tree.levels.map(function(lv, i) {
      return {
        level: lv.level,
        cost: lv.cost,
        name: lv.name,
        desc: lv.desc,
        learned: i < learned,
        current: i === learned,
        locked: i > learned,
      };
    }),
  };
}

function getAllSkills() {
  var app = getAppIns();
  return Object.keys(app.globalData.skillTree).map(function(key) {
    var detail = getSkillDetail(key);
    detail.key = key;
    return detail;
  });
}

function getBonusSummary(app) {
  var bonuses = app.getAllBonuses();
  var lines = [];
  if (bonuses.growthBoost) lines.push('生长速度 +' + Math.round(bonuses.growthBoost * 100) + '%');
  if (bonuses.harvestGoldBoost) lines.push('收获金币 +' + Math.round(bonuses.harvestGoldBoost * 100) + '%');
  if (bonuses.expBoost) lines.push('经验 +' + Math.round(bonuses.expBoost * 100) + '%');
  if (bonuses.priceDouble) lines.push('价格翻倍');
  if (bonuses.dailyGold) lines.push('每日金币 +' + bonuses.dailyGold);
  if (bonuses.harvestDoubleChance) lines.push('双倍概率 +' + Math.round(bonuses.harvestDoubleChance * 100) + '%');
  if (bonuses.harvestExtraGold) lines.push('额外金币 +' + bonuses.harvestExtraGold);
  if (bonuses.seedDiscount) lines.push('种子折扣 ' + Math.round(bonuses.seedDiscount * 100) + '%');
  if (bonuses.seedFree) lines.push('种子免费');
  if (bonuses.plantExp) lines.push('种植经验 +' + bonuses.plantExp);
  if (bonuses.hybridChance) lines.push('杂交成功率 +' + Math.round(bonuses.hybridChance * 100) + '%');
  if (bonuses.waterBonus) lines.push('浇水效果 +' + bonuses.waterBonus + '秒');
  if (bonuses.allGrowthReduce) lines.push('生长时间 -' + Math.round(bonuses.allGrowthReduce * 100) + '%');
  if (bonuses.instantGrow) lines.push('瞬间成熟');
  return lines;
}

module.exports = { learnSkill: learnSkill, getSkillDetail: getSkillDetail, getAllSkills: getAllSkills, getBonusSummary: getBonusSummary };
