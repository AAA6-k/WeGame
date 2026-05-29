// js/renderer.js - Canvas 渲染引擎（美化版）
const CONFIG = require('./config.js');
const Player = require('./player.js');
const Farm = require('./farm.js');

var W = 0, H = 0;
var scale = 1;
var ctx = null;
var canvas = null;
var time = 0;

// 以375为基准
const BASE_W = 375;
const TOPBAR_H = 96;
const BOTTOMBAR_H = 72;

// 色板
const COL = {
  sky1: '#87CEEB', sky2: '#B2EBF2',
  grass1: '#8BC34A', grass2: '#689F38',
  dirt: '#C8A96E', dirtDark: '#A0845C',
  toolbarBg: 'rgba(34,34,34,0.92)',
  panelBg: '#ffffff',
  gold: '#FFB300',
  green: '#4CAF50',
  orange: '#FF9800',
  red: '#F44336',
  blue: '#2196F3',
  white: '#ffffff',
  text: '#333333',
  textLight: '#888888',
};

function init(c) {
  canvas = c;
  ctx = canvas.getContext('2d');
  resize();
}

function resize() {
  var sys = wx.getSystemInfoSync();
  W = sys.windowWidth;
  H = sys.windowHeight;
  scale = W / BASE_W;
  canvas.width = sys.pixelRatio * W;
  canvas.height = sys.pixelRatio * H;
  ctx.setTransform(sys.pixelRatio, 0, 0, sys.pixelRatio, 0, 0);
  ctx.textBaseline = 'middle';
}
function s(v) { return v * scale; }

// === 辅助绘制函数 ===
function roundRect(x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) { ctx.lineWidth = lw || s(2); ctx.stroke(); }
}
function circle(x, y, r, fill, stroke) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath();
  if (fill) ctx.fill(); if (stroke) ctx.stroke();
}
function shadow(blur, color, cb) {
  ctx.save();
  ctx.shadowColor = color || 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = blur || s(8);
  ctx.shadowOffsetY = s(2);
  cb();
  ctx.restore();
}
function setFont(size, weight, align) {
  ctx.font = (weight || '') + ' ' + s(size) + 'px sans-serif';
  if (align) ctx.textAlign = align;
}
function centerText(text, x, y) {
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

// === 土地布局计算 ===
function getLandRects() {
  var barH = s(TOPBAR_H);
  var bottomH = s(BOTTOMBAR_H);
  var availH = H - barH - bottomH;
  var gap = s(10);
  var mx = s(20);
  var my = s(30);

  var cellW = (W - 2 * mx - 2 * gap) / 3;
  var cellH = (availH - 3 * gap - 2 * my) / 4;
  var cellSize = Math.min(cellW, cellH);

  var gridW = 3 * cellSize + 2 * gap;
  var gridH = 4 * cellSize + 3 * gap;
  var startX = (W - gridW) / 2;
  var startY = barH + (availH - gridH) / 2;

  var rects = [];
  for (var i = 0; i < CONFIG.totalLandCount; i++) {
    var lo = CONFIG.landLayout[i];
    rects.push({
      x: startX + lo.col * (cellSize + gap),
      y: startY + lo.row * (cellSize + gap),
      w: cellSize, h: cellSize,
      cx: startX + lo.col * (cellSize + gap) + cellSize / 2,
      cy: startY + lo.row * (cellSize + gap) + cellSize / 2,
      col: lo.col, row: lo.row,
    });
  }
  return rects;
}

// === 绘制背景 ===
function drawBackground() {
  // 天空渐变
  var grad = ctx.createLinearGradient(0, 0, 0, H * 0.55);
  grad.addColorStop(0, COL.sky1);
  grad.addColorStop(1, COL.sky2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 太阳
  var sunX = W - s(55), sunY = s(65);
  ctx.fillStyle = 'rgba(255,235,59,0.25)';
  circle(sunX, sunY, s(50), true);
  ctx.fillStyle = 'rgba(255,245,157,0.5)';
  circle(sunX, sunY, s(35), true);
  ctx.fillStyle = '#FFF9C4';
  circle(sunX, sunY, s(22), true);

  // 云朵
  drawCloud(s(60), s(40), 0.9);
  drawCloud(s(180), s(30), 0.7);
  drawCloud(s(300), s(55), 0.8);

  // 远山
  ctx.fillStyle = '#AED581';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.48);
  for (var x = 0; x <= W; x += s(8)) {
    var y = H * 0.48 - Math.sin(x / W * Math.PI * 1.5 + 0.5) * s(30) - Math.sin(x / s(60)) * s(15);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // 地面渐变
  var gGrad = ctx.createLinearGradient(0, H * 0.52, 0, H);
  gGrad.addColorStop(0, COL.grass1);
  gGrad.addColorStop(0.5, COL.grass2);
  gGrad.addColorStop(1, '#558B2F');
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, H * 0.52, W, H * 0.48);

  // 地面纹理装饰
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (var i = 0; i < 15; i++) {
    var gx = (i * 137 + 50) % W;
    var gy = H * 0.55 + (i * 73) % (H * 0.4);
    circle(gx, gy, s(3 + i % 5), true);
  }
}

function drawCloud(cx, cy, sc) {
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  circle(cx, cy, s(18) * sc, true);
  circle(cx + s(22) * sc, cy - s(6) * sc, s(14) * sc, true);
  circle(cx - s(16) * sc, cy + s(4) * sc, s(12) * sc, true);
  circle(cx + s(8) * sc, cy + s(6) * sc, s(16) * sc, true);
}

// === 顶部状态栏 ===
function drawTopBar() {
  var d = Player.data();
  var barH = s(TOPBAR_H);
  var exp = d.exp;
  var need = Player.getLevelUpExp();
  var pct = Math.min(1, need > 0 ? exp / need : 1);

  // 背景玻璃效果
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(0, 0, W, barH);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(0, 0, W, barH);

  // 底部装饰线
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, barH - s(1), W, s(1));

  // 等级徽章
  var badgeX = s(12), badgeY = s(10), badgeR = s(20);
  ctx.fillStyle = '#4CAF50';
  circle(badgeX + s(24), badgeY + s(22), badgeR, true);
  ctx.fillStyle = '#fff';
  setFont(12, 'bold', 'center');
  centerText('Lv.' + d.level, badgeX + s(24), badgeY + s(22));

  // 金币
  setFont(15, 'bold', 'left');
  ctx.fillStyle = COL.text;
  ctx.fillText('🪙 ' + d.gold, badgeX + s(52), badgeY + s(6));

  // 种子
  setFont(13, '', 'left');
  ctx.fillStyle = COL.textLight;
  ctx.fillText('🌰 ' + d.seeds, badgeX + s(52), badgeY + s(30));

  // 技能点
  setFont(14, 'bold', 'right');
  ctx.fillStyle = COL.orange;
  ctx.fillText('🔷 ' + d.skillPoints, W - s(12), s(14));

  ctx.fillStyle = COL.textLight;
  setFont(11, '', 'right');
  ctx.fillText('收获 ' + d.harvestCount + '次', W - s(12), s(34));

  // 经验条
  var expX = W * 0.25, expW = W * 0.5, expY = s(64), expH = s(10);
  shadow(s(4), 'rgba(0,0,0,0.08)', function() {
    roundRect(expX, expY, expW, expH, s(5), true);
  });
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  roundRect(expX, expY, expW, expH, s(5), true);
  if (pct > 0) {
    var expColor = ctx.createLinearGradient(expX, 0, expX + expW, 0);
    expColor.addColorStop(0, '#4CAF50');
    expColor.addColorStop(1, '#8BC34A');
    ctx.fillStyle = expColor;
    roundRect(expX, expY, expW * pct, expH, s(5), true);
  }
  setFont(10, '', 'center');
  ctx.fillStyle = '#666';
  centerText(exp + ' / ' + need, expX + expW / 2, expY + expH / 2);

  ctx.textAlign = 'left';
}

// === 绘制土地 ===
function drawLandGrid() {
  var lands = Farm.lands();
  var rects = getLandRects();
  var d = Player.data();
  var maxLand = Player.getAvailableLandCount();

  for (var i = 0; i < lands.length; i++) {
    var land = lands[i];
    var r = rects[i];
    var unlocked = i < maxLand && d.level >= land.unlockLevel;
    var crop = land.cropType ? CONFIG.cropConfig[land.cropType] : null;

    // 阴影
    shadow(s(6), 'rgba(0,0,0,0.12)', function() {
      drawLandCell(land, r, unlocked, crop);
    });
  }
}

function drawLandCell(land, r, unlocked, crop) {
  var is = s(3); // 内部偏移
  var sel = land.selected;

  // 土地底框（木框效果）
  if (!unlocked) {
    ctx.fillStyle = '#9E9E9E';
  } else if (sel) {
    ctx.fillStyle = '#FFF8E1';
  } else if (land.stage === 0) {
    ctx.fillStyle = '#E8D5B7';
  } else {
    var lvl = Math.min(land.stage - 1, 3);
    var colors = ['#C8A96E', '#A0845C', '#8D6E4B', '#795548'];
    ctx.fillStyle = colors[lvl];
  }
  roundRect(r.x, r.y, r.w, r.h, s(12), true);

  // 边框木纹
  var borderColor = sel ? '#FF9800' : (unlocked ? 'rgba(139,90,43,0.4)' : 'rgba(150,150,150,0.5)');
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = sel ? s(3) : s(1.5);
  roundRect(r.x, r.y, r.w, r.h, s(12), false, true);

  if (!unlocked) {
    // 锁住的土地
    ctx.fillStyle = '#fff';
    setFont(22, '', 'center');
    centerText('🔒', r.cx, r.cy - s(10));
    ctx.fillStyle = '#666';
    setFont(12, 'bold', 'center');
    centerText('Lv.' + land.unlockLevel, r.cx, r.cy + s(18));
    ctx.textAlign = 'left';
  } else if (land.stage === 0) {
    // 空地 - 犁沟纹理
    ctx.strokeStyle = 'rgba(139,90,43,0.15)';
    ctx.lineWidth = s(1);
    for (var j = 0; j < 4; j++) {
      var ly = r.y + (j + 1) * r.h / 5;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.2, ly);
      ctx.lineTo(r.x + r.w * 0.8, ly);
      ctx.stroke();
    }
    // 提示
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    setFont(13, 'bold', 'center');
    centerText('点击种菜', r.cx, r.cy + s(4));
    ctx.textAlign = 'left';
  } else {
    // 作物绘制
    drawCropOnLand(land, r, crop);
  }

  // 杂交选中标记
  if (sel && land.stage === 4) {
    ctx.fillStyle = '#FF9800';
    roundRect(r.cx - s(22), r.y + s(3), s(44), s(18), s(9), true);
    ctx.fillStyle = '#fff';
    setFont(10, 'bold', 'center');
    centerText('✅ 已选', r.cx, r.y + s(12));
    ctx.textAlign = 'left';
  }
}

function drawCropOnLand(land, r, crop) {
  var emoji = crop ? crop.emoji : '🌱';
  var stage = land.stage;

  // 生长阶段背景点缀
  if (stage < 4) {
    var dots = stage === 1 ? 2 : (stage === 2 ? 4 : 6);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (var d = 0; d < dots; d++) {
      var dx = r.x + s(8) + (d % 3) * r.w / 3;
      var dy = r.y + s(8) + Math.floor(d / 3) * r.h / 3;
      circle(dx, dy, s(2), true);
    }
  }

  // 作物emoji
  setFont(32, '', 'center');
  ctx.fillStyle = '#fff';
  shadow(s(4), 'rgba(0,0,0,0.15)', function() {
    centerText(emoji, r.cx, r.cy - s(2));
  });

  // 名称
  if (crop) {
    setFont(11, 'bold', 'center');
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    centerText(crop.name, r.cx, r.cy + s(22));
  }

  // 生长期倒计时
  if (stage > 0 && stage < 4) {
    var remain = Farm.getRemainTime(land);
    var mins = Math.floor(remain / 60);
    var secs = remain % 60;
    var ts = mins > 0 ? mins + '分' + secs + '秒' : secs + '秒';

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(r.cx - s(28), r.y + r.h - s(20), s(56), s(18), s(9), true);
    ctx.fillStyle = '#fff';
    setFont(10, 'bold', 'center');
    centerText('⏳ ' + ts, r.cx, r.y + r.h - s(11));

    // 水滴标记
    if (land.watered) {
      ctx.fillStyle = '#4FC3F7';
      roundRect(r.x + r.w - s(28), r.y + s(4), s(24), s(16), s(8), true);
      setFont(9, 'bold', 'center');
      centerText('💧', r.x + r.w - s(16), r.y + s(12));
    }
  }

  // 成熟闪光
  if (stage === 4) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    circle(r.cx, r.cy, s(16), true);
    var twinkle = Math.abs(Math.sin(Date.now() / 800)) * 0.3;
    ctx.fillStyle = 'rgba(255,215,0,' + twinkle + ')';
    circle(r.cx, r.cy, s(20), true);
  }

  ctx.textAlign = 'left';
}

// === 底部工具栏 ===
function drawBottomBar(uiState) {
  var y = H - s(BOTTOMBAR_H);

  // 背景
  ctx.fillStyle = COL.toolbarBg;
  roundRect(0, y, W, s(BOTTOMBAR_H) + s(10), s(0), true);
  ctx.fillStyle = COL.toolbarBg;
  ctx.fillRect(0, y, W, s(BOTTOMBAR_H));

  var btns = [
    { label: '商店', icon: '🏪', key: 'shop' },
    { label: uiState.breedMode ? '杂交中' : '杂交', icon: '🧬', key: 'breed' },
    { label: '技能', icon: '⭐', key: 'skill' },
    { label: '厨房', icon: '🍳', key: 'kitchen' },
  ];

  var btnW = W / 4;
  for (var i = 0; i < btns.length; i++) {
    var bx = i * btnW;
    var b = btns[i];
    var active = uiState.activePanel === b.key || (b.key === 'breed' && uiState.breedMode);

    if (active) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(bx + s(2), y + s(3), btnW - s(4), s(BOTTOMBAR_H) - s(6));
      roundRect(bx + s(2), y + s(3), btnW - s(4), s(BOTTOMBAR_H) - s(6), s(8), true);
    }

    setFont(13, active ? 'bold' : '', 'center');
    ctx.fillStyle = active ? '#fff' : 'rgba(255,255,255,0.65)';
    centerText(b.icon, bx + btnW / 2, y + s(22));
    setFont(11, active ? 'bold' : '', 'center');
    centerText(b.label, bx + btnW / 2, y + s(48));
  }
  ctx.textAlign = 'left';
}

// === 商店面板 ===
function drawShopPanel() {
  var d = Player.data();
  var crops = Player.getAvailableCrops();
  var panelW = W - s(32);
  var panelH = Math.min(H - s(140), s(420));
  var px = s(16);
  var py = (H - panelH) / 2;
  var itemH = s(60);

  // 遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, W, H);

  // 面板
  shadow(s(20), 'rgba(0,0,0,0.25)', function() {
    ctx.fillStyle = COL.panelBg;
    roundRect(px, py, panelW, panelH, s(18), true);
  });

  // 标题栏
  var titleH = s(56);
  var titleGrad = ctx.createLinearGradient(0, py, 0, py + titleH);
  titleGrad.addColorStop(0, '#43A047');
  titleGrad.addColorStop(1, '#66BB6A');
  ctx.fillStyle = titleGrad;
  roundRect(px, py, panelW, titleH, s(18), true);
  ctx.fillRect(px, py + titleH - s(9), panelW, s(9));

  ctx.fillStyle = '#fff';
  setFont(18, 'bold', 'center');
  centerText('🏪 种子商店', px + panelW / 2, py + titleH / 2 - s(2));

  // 资源
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  setFont(12, '', 'center');
  centerText('🪙 ' + d.gold + '  |  🌰 ' + d.seeds, px + panelW / 2, py + s(48));
  ctx.textAlign = 'left';

  // 列表
  var listY = py + titleH + s(4);
  for (var i = 0; i < crops.length; i++) {
    var key = crops[i];
    var cfg = CONFIG.cropConfig[key];
    var seedPrice = Player.getSeedPrice(key);
    var iy = listY + i * itemH;
    if (iy + itemH > py + panelH - s(4)) break;

    ctx.fillStyle = i % 2 === 0 ? '#fafafa' : '#fff';
    ctx.fillRect(px + s(6), iy, panelW - s(12), itemH);

    ctx.fillStyle = '#fff';
    circle(px + s(38), iy + itemH / 2, s(20), true);
    setFont(26, '', 'center');
    ctx.fillStyle = '#333';
    centerText(cfg.emoji, px + s(38), iy + itemH / 2);

    ctx.textAlign = 'left';
    ctx.fillStyle = COL.text;
    setFont(15, 'bold', 'left');
    ctx.fillText(cfg.name, px + s(62), iy + s(16));

    ctx.fillStyle = COL.textLight;
    setFont(11, '', 'left');
    ctx.fillText(cfg.price + '金  经验' + cfg.expReward + '  生长' + cfg.growTime + 's', px + s(62), iy + s(40));

    var btnX = px + panelW - s(58);
    var btnY = iy + (itemH - s(28)) / 2;
    var canBuy = d.gold >= seedPrice;
    shadow(s(4), 'rgba(0,0,0,0.15)', function() {
      ctx.fillStyle = canBuy ? '#FF9800' : '#BDBDBD';
      roundRect(btnX, btnY, s(52), s(28), s(14), true);
    });
    setFont(12, 'bold', 'center');
    ctx.fillStyle = '#fff';
    centerText(seedPrice + '金', btnX + s(26), btnY + s(14));
    ctx.textAlign = 'left';
  }
}

// === 技能面板 ===
function drawSkillPanel() {
  var d = Player.data();
  var skills = CONFIG.skillTree;
  var keys = Object.keys(skills);
  var panelW = W - s(32);
  var panelH = Math.min(H - s(140), s(460));
  var px = s(16);
  var py = (H - panelH) / 2;
  var itemH = s(68);

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, W, H);

  shadow(s(20), 'rgba(0,0,0,0.25)', function() {
    ctx.fillStyle = COL.panelBg;
    roundRect(px, py, panelW, panelH, s(18), true);
  });

  var titleH = s(56);
  var titleGrad = ctx.createLinearGradient(0, py, 0, py + titleH);
  titleGrad.addColorStop(0, '#E65100');
  titleGrad.addColorStop(1, '#FF9800');
  ctx.fillStyle = titleGrad;
  roundRect(px, py, panelW, titleH, s(18), true);
  ctx.fillRect(px, py + titleH - s(9), panelW, s(9));

  ctx.fillStyle = '#fff';
  setFont(18, 'bold', 'center');
  centerText('⭐ 技能树  🔷' + d.skillPoints, px + panelW / 2, py + titleH / 2 - s(2));
  ctx.textAlign = 'left';

  var listY = py + titleH + s(4);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var skill = skills[key];
    var learned = d.learnedSkills[key] || 0;
    var iy = listY + i * itemH;

    ctx.fillStyle = i % 2 === 0 ? '#FFF8E1' : '#fff';
    ctx.fillRect(px + s(6), iy, panelW - s(12), itemH);

    // 图标
    ctx.fillStyle = '#FF9800';
    circle(px + s(38), iy + itemH / 2, s(22), true);
    setFont(26, '', 'center');
    ctx.fillStyle = '#fff';
    centerText(skill.emoji, px + s(38), iy + itemH / 2);

    // 名称
    ctx.textAlign = 'left';
    ctx.fillStyle = COL.text;
    setFont(15, 'bold', 'left');
    ctx.fillText(skill.name, px + s(68), iy + s(18));

    // 进度条
    var progX = px + s(68);
    var progY = iy + s(42);
    var progW = s(100);
    var progH = s(6);
    ctx.fillStyle = '#eee';
    roundRect(progX, progY, progW, progH, s(3), true);
    ctx.fillStyle = '#FF9800';
    roundRect(progX, progY, progW * (learned / 5), progH, s(3), true);
    setFont(10, '', 'left');
    ctx.fillStyle = COL.textLight;
    ctx.fillText('Lv.' + learned + '/5', progX + progW + s(8), progY + progH / 2 + s(1));

    // 下一级
    if (learned < 5) {
      var next = skill.levels[learned];
      var canBuy = d.skillPoints >= next.cost;
      var btnX = px + panelW - s(55);
      var btnY = iy + (itemH - s(26)) / 2;
      shadow(s(3), 'rgba(0,0,0,0.1)', function() {
        ctx.fillStyle = canBuy ? '#FF9800' : '#BDBDBD';
        roundRect(btnX, btnY, s(49), s(26), s(13), true);
      });
      setFont(11, 'bold', 'center');
      ctx.fillStyle = '#fff';
      centerText('🔷' + next.cost, btnX + s(24.5), btnY + s(13));

      // 当前效果
      setFont(10, '', 'left');
      ctx.fillStyle = COL.textLight;
      ctx.fillText(next.desc, px + s(68), iy + s(58));
    } else {
      setFont(13, 'bold', 'right');
      ctx.fillStyle = '#4CAF50';
      ctx.textAlign = 'right';
      ctx.fillText('已满级', px + panelW - s(18), iy + itemH / 2);
      ctx.textAlign = 'left';
    }
  }
}

// === 厨房面板 ===
function drawKitchenPanel(uiState) {
  var d = Player.data();
  var panelW = W - s(24);
  var panelH = Math.min(H - s(120), s(500));
  var px = s(12);
  var py = s(90);

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, W, H);

  shadow(s(20), 'rgba(0,0,0,0.25)', function() {
    ctx.fillStyle = '#FFFFFF';
    roundRect(px, py, panelW, panelH, s(18), true);
  });

  // 标题
  var titleH = s(44);
  var titleGrad = ctx.createLinearGradient(0, py, 0, py + titleH);
  titleGrad.addColorStop(0, '#E65100');
  titleGrad.addColorStop(1, '#FF9800');
  ctx.fillStyle = titleGrad;
  roundRect(px, py, panelW, titleH, s(18), true);
  ctx.fillRect(px, py + titleH - s(9), panelW, s(9));

  ctx.fillStyle = '#fff';
  setFont(17, 'bold', 'center');
  centerText('🍳 厨房', px + panelW / 2, py + titleH / 2 - s(1));
  ctx.textAlign = 'left';

  // 子tab
  var tabs = ['烹饪', '库存', '订单'];
  var tabW = panelW / 3;
  var tabY = py + titleH + s(6);
  for (var t = 0; t < tabs.length; t++) {
    var active = uiState.kitchenTab === t;
    var tx = px + t * tabW + s(8);
    ctx.fillStyle = active ? '#FF9800' : '#f0f0f0';
    roundRect(tx, tabY, tabW - s(16), s(30), s(6), true);
    setFont(13, active ? 'bold' : '', 'center');
    ctx.fillStyle = active ? '#fff' : '#666';
    centerText(tabs[t], tx + (tabW - s(16)) / 2, tabY + s(15));
  }
  ctx.textAlign = 'left';

  var contentY = tabY + s(38);
  var contentH = panelH - (contentY - py) - s(8);

  if (uiState.kitchenTab === 0) {
    drawCookingContent(px, contentY, panelW, contentH);
  } else if (uiState.kitchenTab === 1) {
    drawInventoryContent(px, contentY, panelW, contentH);
  } else {
    drawOrderContent(px, contentY, panelW, contentH);
  }
}

function drawCookingContent(x, y, w, h) {
  var recipes = CONFIG.cookingRecipes;
  var keys = Object.keys(recipes);
  var cols = 4;
  var cellW = (w - s(20)) / cols;
  var cellH = s(76);

  for (var i = 0; i < keys.length; i++) {
    var rid = keys[i];
    var r = recipes[rid];
    var unlocked = Player.data().level >= r.unlockLevel;
    var col = i % cols;
    var row = Math.floor(i / cols);
    var cx = x + s(8) + col * cellW;
    var cy = y + row * cellH;
    if (cy + cellH > y + h) break;

    ctx.fillStyle = unlocked ? '#fff' : '#f5f5f5';
    ctx.strokeStyle = unlocked ? '#eee' : '#ddd';
    ctx.lineWidth = s(1);
    roundRect(cx + s(2), cy + s(2), cellW - s(4), cellH - s(4), s(10), true, true);

    setFont(28, '', 'center');
    var alpha = unlocked ? 1 : 0.4;
    ctx.globalAlpha = alpha;
    centerText(r.emoji, cx + cellW / 2, cy + s(28));
    ctx.globalAlpha = 1;

    ctx.fillStyle = unlocked ? '#333' : '#bbb';
    setFont(11, '', 'center');
    centerText(r.name, cx + cellW / 2, cy + s(56));

    if (!unlocked) {
      ctx.fillStyle = '#ccc';
      setFont(10, '', 'center');
      centerText('Lv.' + r.unlockLevel, cx + cellW / 2, cy + s(70));
    }
    ctx.textAlign = 'left';
  }
}

function drawInventoryContent(x, y, w, h) {
  var inv = Player.data().inventory;
  var keys = Object.keys(inv);
  if (keys.length === 0) {
    ctx.fillStyle = '#bbb';
    setFont(15, '', 'center');
    centerText('库存为空，收获作物后获得原料', x + w / 2, y + h / 2 - s(10));
    centerText('点击厨房烹饪制作加工品', x + w / 2, y + h / 2 + s(16));
    ctx.textAlign = 'left';
    return;
  }

  var itemH = s(48);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var iy = y + i * itemH;
    if (iy + itemH > y + h) break;

    ctx.fillStyle = i % 2 === 0 ? '#FFF8E1' : '#fff';
    ctx.fillRect(x + s(6), iy, w - s(12), itemH);
    roundRect(x + s(6), iy, w - s(12), itemH, s(4), true);

    var name = key;
    var emoji = '📦';
    if (key.indexOf('cooked_') === 0) {
      var r = CONFIG.cookingRecipes[key.replace('cooked_', '')];
      if (r) { name = r.name; emoji = r.emoji; }
    } else {
      var c = CONFIG.cropConfig[key];
      if (c) { name = c.name; emoji = c.emoji; }
    }

    setFont(16, '', 'left');
    ctx.fillText(emoji + '  ' + name, x + s(18), iy + itemH / 2);

    ctx.fillStyle = '#FF9800';
    setFont(14, 'bold', 'right');
    ctx.textAlign = 'right';
    ctx.fillText('x' + inv[key], x + w - s(18), iy + itemH / 2);
    ctx.textAlign = 'left';
  }
}

function drawOrderContent(x, y, w, h) {
  var orders = Player.data().orders;
  var d = Player.data();

  // 刷新按钮
  var now = Date.now();
  var canRefresh = d.orderNextRefresh <= now;
  var refreshBtnY = y;
  ctx.fillStyle = canRefresh ? '#FF9800' : '#ccc';
  roundRect(x + w - s(75), refreshBtnY, s(70), s(28), s(14), true);
  setFont(11, 'bold', 'center');
  ctx.fillStyle = '#fff';
  centerText('刷新订单', x + w - s(40), refreshBtnY + s(14));
  ctx.textAlign = 'left';

  var listY = refreshBtnY + s(36);

  if (orders.length === 0) {
    ctx.fillStyle = '#bbb';
    setFont(15, '', 'center');
    centerText('暂无订单', x + w / 2, listY + h / 2 - s(10));
    centerText('点击刷新获取新订单', x + w / 2, listY + h / 2 + s(16));
    ctx.textAlign = 'left';
    return;
  }

  var itemH = s(64);
  for (var i = 0; i < orders.length; i++) {
    var order = orders[i];
    var iy = listY + i * itemH;
    if (iy + itemH > y + h) break;

    shadow(s(3), 'rgba(0,0,0,0.06)', function() {
      ctx.fillStyle = order.completed ? '#f5f5f5' : '#fff';
      roundRect(x + s(6), iy, w - s(12), itemH - s(4), s(10), true, true, s(1));
    });

    var name = '';
    var emo = '';
    if (order.itemType === 'cooked') {
      var r = CONFIG.cookingRecipes[order.itemId];
      if (r) { name = r.name; emo = r.emoji; }
    } else {
      var c = CONFIG.cropConfig[order.itemId];
      if (c) { name = c.name; emo = c.emoji; }
    }

    setFont(14, 'bold', 'left');
    ctx.fillStyle = COL.text;
    ctx.fillText(emo + ' ' + name + '  x' + order.count, x + s(18), iy + s(22));

    setFont(11, '', 'left');
    ctx.fillStyle = '#4CAF50';
    var rewardText = '经验+' + order.rewardExp;
    if (order.rewardSkill) rewardText += '  技能点+' + order.rewardSkill;
    ctx.fillText(rewardText, x + s(18), iy + s(48));

    if (!order.completed) {
      var btnX = x + w - s(60);
      shadow(s(3), 'rgba(0,0,0,0.1)', function() {
        ctx.fillStyle = '#4CAF50';
        roundRect(btnX, iy + s(12), s(52), s(28), s(14), true);
      });
      setFont(12, 'bold', 'center');
      ctx.fillStyle = '#fff';
      centerText('提交', btnX + s(26), iy + s(26));
    } else {
      setFont(12, 'bold', 'right');
      ctx.fillStyle = '#bbb';
      ctx.textAlign = 'right';
      ctx.fillText('已完成', x + w - s(18), iy + itemH / 2);
    }
    ctx.textAlign = 'left';
  }
}

// === 种植选择面板 ===
function drawPlantSelectPanel(uiState) {
  var crops = uiState.availableCrops;
  if (!crops || crops.length === 0) return;
  var panelW = W - s(50);
  var itemH = s(56);
  var panelH = crops.length * itemH + s(60);
  var px = s(25);
  var py = (H - panelH) / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, W, H);

  shadow(s(16), 'rgba(0,0,0,0.25)', function() {
    ctx.fillStyle = '#fff';
    roundRect(px, py, panelW, panelH, s(16), true);
  });

  ctx.fillStyle = '#333';
  setFont(17, 'bold', 'center');
  centerText('🌱 选择种植的作物', px + panelW / 2, py + s(28));
  ctx.fillStyle = '#999';
  setFont(12, '', 'center');
  centerText('点击选择作物进行种植', px + panelW / 2, py + s(48));
  ctx.textAlign = 'left';

  for (var i = 0; i < crops.length; i++) {
    var key = crops[i];
    var cfg = CONFIG.cropConfig[key];
    var iy = py + s(60) + i * itemH;

    ctx.fillStyle = i % 2 === 0 ? '#fafafa' : '#fff';
    roundRect(px + s(8), iy, panelW - s(16), itemH, s(8), true);

    ctx.fillStyle = '#4CAF50';
    circle(px + s(36), iy + itemH / 2, s(18), true);
    setFont(22, '', 'center');
    ctx.fillStyle = '#fff';
    centerText(cfg.emoji, px + s(36), iy + itemH / 2);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#333';
    setFont(15, 'bold', 'left');
    ctx.fillText(cfg.name, px + s(60), iy + s(16));
    ctx.fillStyle = '#999';
    setFont(11, '', 'left');
    ctx.fillText('生长' + cfg.growTime + 's  售价' + cfg.price + '金', px + s(60), iy + s(38));
  }
}

// === 杂交模式横幅 ===
function drawBreedOverlay() {
  var h = s(30);
  ctx.fillStyle = 'rgba(255,152,0,0.9)';
  ctx.fillRect(0, s(TOPBAR_H), W, h);
  setFont(13, 'bold', 'center');
  ctx.fillStyle = '#fff';
  centerText('🧬 杂交模式：点击2块相邻成熟作物进行杂交', W / 2, s(TOPBAR_H) + h / 2);
  ctx.textAlign = 'left';
}

// === Toast 提示 ===
function drawToast(msg) {
  if (!msg) return;
  var tw = Math.min(W - s(40), msg.length * s(12) + s(40));
  var th = s(42);
  var cx = (W - tw) / 2, cy = H / 2 - th / 2;
  shadow(s(12), 'rgba(0,0,0,0.3)', function() {
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    roundRect(cx, cy, tw, th, s(21), true);
  });
  setFont(15, '', 'center');
  ctx.fillStyle = '#fff';
  centerText(msg, W / 2, H / 2 - s(1));
  ctx.textAlign = 'left';
}

// === 升级特效 ===
function drawLevelUp(level) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, H);

  var pulse = Math.sin(Date.now() / 300) * 0.3 + 1;
  var badgeR = s(50) * pulse;
  ctx.fillStyle = '#FFD700';
  circle(W / 2, H / 2 - s(30), badgeR, true);
  ctx.fillStyle = '#FFF9C4';
  circle(W / 2, H / 2 - s(30), s(35) * pulse, true);

  setFont(36, 'bold', 'center');
  ctx.fillStyle = '#fff';
  centerText('🎉', W / 2, H / 2 - s(30));

  setFont(26, 'bold', 'center');
  ctx.fillStyle = '#FFD700';
  centerText('升级!', W / 2, H / 2 + s(30));

  setFont(20, 'bold', 'center');
  ctx.fillStyle = '#fff';
  centerText('Lv.' + level, W / 2, H / 2 + s(60));
  ctx.textAlign = 'left';
}

// === 配方详情弹窗 ===
function drawRecipeDetailPanel(uiState) {
  var detail = uiState.recipeDetail;
  if (!detail) return;
  var d = Player.data();
  var panelW = s(300);
  var panelH = s(240);
  var px = (W - panelW) / 2;
  var py = (H - panelH) / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, H);

  shadow(s(16), 'rgba(0,0,0,0.3)', function() {
    ctx.fillStyle = '#FFFFFF';
    roundRect(px, py, panelW, panelH, s(16), true);
  });

  // 标题栏
  var titleGrad = ctx.createLinearGradient(0, py, 0, py + s(44));
  titleGrad.addColorStop(0, '#E65100');
  titleGrad.addColorStop(1, '#FF9800');
  ctx.fillStyle = titleGrad;
  roundRect(px, py, panelW, s(44), s(16), true);
  ctx.fillRect(px, py + s(28), panelW, s(16));

  ctx.fillStyle = '#fff';
  setFont(17, 'bold', 'center');
  centerText(detail.emoji + ' ' + detail.name, px + panelW / 2, py + s(28));
  ctx.textAlign = 'left';

  // 关闭按钮
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  circle(px + panelW - s(22), py + s(22), s(10), true);
  ctx.fillStyle = '#fff';
  setFont(14, 'bold', 'center');
  centerText('✕', px + panelW - s(22), py + s(26));
  ctx.textAlign = 'left';

  // 所需材料标题
  var contentY = py + s(56);
  setFont(14, 'bold');
  ctx.fillStyle = '#333';
  ctx.fillText('所需材料：', px + s(16), contentY);

  // 材料列表
  var ingY = contentY + s(24);
  var ingKeys = Object.keys(detail.ingredients);
  for (var i = 0; i < ingKeys.length; i++) {
    var ing = ingKeys[i];
    var need = detail.ingredients[ing];
    var have = d.inventory[ing] || 0;
    var enough = have >= need;

    ctx.fillStyle = enough ? '#4CAF50' : '#F44336';
    setFont(13, 'normal');
    ctx.fillText('• ' + ing + '：需要 ' + need + ' 个', px + s(20), ingY + i * s(26));

    ctx.fillStyle = enough ? '#666' : '#F44336';
    setFont(12, 'normal', 'right');
    ctx.textAlign = 'right';
    ctx.fillText('拥有：' + have, px + panelW - s(16), ingY + i * s(26));
    ctx.textAlign = 'left';
  }

  // 消耗金币
  var costY = ingY + ingKeys.length * s(26) + s(8);
  ctx.fillStyle = '#FF9800';
  setFont(13, 'bold');
  ctx.fillText('💰 消耗金币：' + detail.cost, px + s(16), costY);

  // 经验奖励
  ctx.fillStyle = '#4CAF50';
  ctx.fillText('⭐ 经验奖励：' + detail.expReward, px + s(16), costY + s(22));

  // 确认按钮
  var btnW = s(120);
  var btnH = s(36);
  var btnX = px + (panelW - btnW) / 2;
  var btnY = py + panelH - btnH - s(12);
  var btnGrad = ctx.createLinearGradient(0, btnY, 0, btnY + btnH);
  btnGrad.addColorStop(0, '#FF9800');
  btnGrad.addColorStop(1, '#F57C00');
  ctx.fillStyle = btnGrad;
  roundRect(btnX, btnY, btnW, btnH, s(18), true);

  ctx.fillStyle = '#fff';
  setFont(15, 'bold', 'center');
  centerText('开始烹饪', btnX + btnW / 2, btnY + btnH / 2);
  ctx.textAlign = 'left';
}

// === 技能详情弹窗 ===
function drawSkillDetailPanel(uiState) {
  var detail = uiState.skillDetail;
  if (!detail || !detail.levels) return;
  var d = Player.data();
  var panelW = s(300);
  var panelH = s(260);
  var px = (W - panelW) / 2;
  var py = (H - panelH) / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, H);

  shadow(s(16), 'rgba(0,0,0,0.3)', function() {
    ctx.fillStyle = '#FFFFFF';
    roundRect(px, py, panelW, panelH, s(16), true);
  });

  // 标题栏
  var titleGrad = ctx.createLinearGradient(0, py, 0, py + s(44));
  titleGrad.addColorStop(0, '#2196F3');
  titleGrad.addColorStop(1, '#64B5F6');
  ctx.fillStyle = titleGrad;
  roundRect(px, py, panelW, s(44), s(16), true);
  ctx.fillRect(px, py + s(28), panelW, s(16));

  ctx.fillStyle = '#fff';
  setFont(17, 'bold', 'center');
  centerText('🎯 ' + detail.name, px + panelW / 2, py + s(28));
  ctx.textAlign = 'left';

  // 关闭按钮
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  circle(px + panelW - s(22), py + s(22), s(10), true);
  ctx.fillStyle = '#fff';
  setFont(14, 'bold', 'center');
  centerText('✕', px + panelW - s(22), py + s(26));
  ctx.textAlign = 'left';

  // 当前等级
  var contentY = py + s(56);
  setFont(14, 'bold');
  ctx.fillStyle = '#333';
  ctx.fillText('当前等级：Lv.' + detail.currentLevel + ' / ' + detail.maxLevel, px + s(16), contentY);

  // 等级详情列表
  var levelY = contentY + s(24);
  for (var i = 0; i < detail.levels.length; i++) {
    var level = detail.levels[i];
    var isCurrent = i === detail.currentLevel;
    var isLearned = i < detail.currentLevel;
    var isNext = i === detail.currentLevel && detail.currentLevel < detail.maxLevel;

    // 等级背景
    var levelBgY = levelY + i * s(32);
    ctx.fillStyle = isCurrent ? '#E3F2FD' : (isLearned ? '#F1F8E9' : '#F5F5F5');
    roundRect(px + s(12), levelBgY, panelW - s(24), s(28), s(6), true);

    // 等级标签
    setFont(12, 'bold');
    ctx.fillStyle = isCurrent ? '#2196F3' : (isLearned ? '#4CAF50' : '#999');
    ctx.fillText('Lv.' + (i + 1), px + s(20), levelBgY + s(18));

    // 属性加成
    setFont(11, 'normal');
    ctx.fillStyle = '#666';
    var descText = level.desc || '';
    if (descText.length > 18) descText = descText.substring(0, 18) + '...';
    ctx.fillText(descText, px + s(60), levelBgY + s(18));

    // 消耗技能点
    setFont(11, 'bold', 'right');
    ctx.textAlign = 'right';
    if (isLearned) {
      ctx.fillStyle = '#4CAF50';
      ctx.fillText('✓ 已学习', px + panelW - s(16), levelBgY + s(18));
    } else if (isNext) {
      ctx.fillStyle = '#FF9800';
      ctx.fillText('需要 ' + level.cost + ' 点', px + panelW - s(16), levelBgY + s(18));
    } else {
      ctx.fillStyle = '#999';
      ctx.fillText('需要 ' + level.cost + ' 点', px + panelW - s(16), levelBgY + s(18));
    }
    ctx.textAlign = 'left';
  }

  // 升级按钮（如果未满级）
  if (detail.currentLevel < detail.maxLevel) {
    var level = detail.levels[detail.currentLevel];
    var btnW = s(120);
    var btnH = s(36);
    var btnX = px + (panelW - btnW) / 2;
    var btnY = py + panelH - btnH - s(12);
    var canUpgrade = d.skillPoints >= level.cost;
    var btnGrad = ctx.createLinearGradient(0, btnY, 0, btnY + btnH);
    btnGrad.addColorStop(0, canUpgrade ? '#4CAF50' : '#9E9E9E');
    btnGrad.addColorStop(1, canUpgrade ? '#388E3C' : '#757575');
    ctx.fillStyle = btnGrad;
    roundRect(btnX, btnY, btnW, btnH, s(18), true);

    ctx.fillStyle = '#fff';
    setFont(15, 'bold', 'center');
    centerText(canUpgrade ? '升级' : '技能点不足', btnX + btnW / 2, btnY + btnH / 2);
    ctx.textAlign = 'left';
  } else {
    // 满级提示
    var msgY = py + panelH - s(40);
    setFont(14, 'bold', 'center');
    ctx.fillStyle = '#4CAF50';
    centerText('🎉 技能已满级！', px + panelW / 2, msgY);
    ctx.textAlign = 'left';
  }
}

// === 主绘制函数 ===
function fullDraw(uiState) {
  ctx.clearRect(0, 0, W, H);
  time = Date.now();

  drawBackground();
  drawLandGrid();
  drawTopBar();
  drawBottomBar(uiState);

  if (uiState.breedMode) drawBreedOverlay();
  if (uiState.activePanel === 'shop') drawShopPanel();
  if (uiState.activePanel === 'skill') drawSkillPanel();
  if (uiState.activePanel === 'kitchen') drawKitchenPanel(uiState);

  // 种植选择在最后以便在最上层
  if (uiState.activePanel === 'plantSelect') drawPlantSelectPanel(uiState);
  if (uiState.activePanel === 'recipeDetail') drawRecipeDetailPanel(uiState);
  if (uiState.activePanel === 'skillDetail') drawSkillDetailPanel(uiState);

  if (uiState.toast) drawToast(uiState.toast);
  if (uiState.levelUpFlash) drawLevelUp(uiState.levelUpFlash);
}

module.exports = { init: init, resize: resize, fullDraw: fullDraw, getLandRects: getLandRects, s: s };