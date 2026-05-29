var skills = require('../../utils/skills.js');

Page({
  data: {
    skillPoints: 0,
    skillList: [],
    expandedSkill: null,
  },

  onShow: function() {
    this.loadSkills();
  },

  loadSkills: function() {
    var app = getApp();
    this.setData({
      skillPoints: app.globalData.skillPoints,
      skillList: skills.getAllSkills(),
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
