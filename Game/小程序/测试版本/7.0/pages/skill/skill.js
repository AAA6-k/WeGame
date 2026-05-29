var skills = require('../../utils/skills.js');

Page({
  data: {
    skillPoints: 0,
    skillList: [],
    expandedSkill: null,
    harvestCount: 0,
    harvestMilestone: 15,
    totalGoldEarned: 0,
    goldMilestone: 500,
    hybridDiscovered: [],
    hybridTotal: 10,
  },

  onShow: function() {
    this.loadSkills();
  },

  loadSkills: function() {
    var app = getApp();
    var data = app.globalData;
    this.setData({
      skillPoints: data.skillPoints,
      skillList: skills.getAllSkills(),
      harvestCount: data.harvestCount,
      harvestMilestone: data.harvestMilestone,
      totalGoldEarned: data.totalGoldEarned,
      goldMilestone: data.goldMilestone,
      hybridDiscovered: data.hybridDiscovered,
    });
  },

  onLearnSkill: function(e) {
    var skillId = e.currentTarget.dataset.skill;
    var result = skills.learnSkill(skillId);
    if (result.success) {
      wx.showToast({ title: '学会 ' + result.levelName, icon: 'success', duration: 1500 });
      this.loadSkills();
    } else {
      wx.showToast({ title: result.msg, icon: 'none', duration: 2000 });
    }
  },

  toggleExpand: function(e) {
    var skillId = e.currentTarget.dataset.skill;
    this.setData({
      expandedSkill: this.data.expandedSkill === skillId ? null : skillId,
    });
  },
});
