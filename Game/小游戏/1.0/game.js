// game.js - 快乐农场 小游戏版
const CONFIG = require('./js/config.js');
const Player = require('./js/player.js');
const Farm = require('./js/farm.js');
const Renderer = require('./js/renderer.js');
const Input = require('./js/input.js');

// 游戏状态
var uiState = {
  activePanel: null,       // 'shop' | 'skill' | 'kitchen' | 'plantSelect'
  kitchenTab: 0,          // 0烹饪 1库存 2订单
  breedMode: false,
  breedTargets: [],
  toast: null,
  levelUpFlash: null,
  plantTargetLand: -1,
  availableCrops: [],
  lastFrame: 0,
};

// 从存档加载
function loadSave() {
  try {
    var saved = wx.getStorageSync('farmGameDataGame');
    if (saved) {
      Player.loadFrom(saved);
      if (saved.lands && saved.lands.length === CONFIG.totalLandCount) {
        // 需要把保存的土地映射到 Farm
        var lands = Farm.lands();
        for (var i = 0; i < saved.lands.length && i < lands.length; i++) {
          lands[i].cropType = saved.lands[i].cropType;
          lands[i].stage = saved.lands[i].stage;
          lands[i].plantTime = saved.lands[i].plantTime;
          lands[i].growTime = saved.lands[i].growTime;
          lands[i].watered = saved.lands[i].watered;
          lands[i].unlockLevel = saved.lands[i].unlockLevel || lands[i].unlockLevel;
        }
      }
    }
  } catch (e) {
    console.log('加载存档失败', e);
  }
}

function saveGame() {
  var lands = Farm.lands();
  var landData = [];
  for (var i = 0; i < lands.length; i++) {
    landData.push({
      cropType: lands[i].cropType,
      stage: lands[i].stage,
      plantTime: lands[i].plantTime,
      growTime: lands[i].growTime,
      watered: lands[i].watered,
      unlockLevel: lands[i].unlockLevel,
    });
  }
  wx.setStorageSync('farmGameDataGame', Player.toSaveObj(landData));
}

// 游戏循环
function gameLoop(timestamp) {
  if (!uiState.lastFrame) uiState.lastFrame = timestamp;
  var dt = timestamp - uiState.lastFrame;
  uiState.lastFrame = timestamp;
  
  // 每500ms更新生长
  if (!uiState._lastGrowth || timestamp - uiState._lastGrowth > 500) {
    uiState._lastGrowth = timestamp;
    Farm.updateGrowth();
  }
  
  // 自动存档（每10秒）
  if (!uiState._lastSave || timestamp - uiState._lastSave > 10000) {
    uiState._lastSave = timestamp;
    saveGame();
  }
  
  // 渲染
  Renderer.fullDraw(uiState);
  
  // 植物选择面板自定义绘制
  if (uiState.activePanel === 'plantSelect') {
    drawPlantSelectPanel();
  }
  
  requestAnimationFrame(gameLoop);
}

// 植物选择面板
function drawPlantSelectPanel() {
  var ctx = wx.createCanvas().getContext('2d'); // 用主canvas的ctx
  var canvas = Renderer._canvas || null;
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  
  var W = wx.getSystemInfoSync().windowWidth;
  var H = wx.getSystemInfoSync().windowHeight;
  var s = Renderer.s;
  var crops = uiState.availableCrops;
  var panelW = W - s(60);
  var px = s(30);
  var py = s(180);
  var itemH = s(64);
  
  // 遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, 0, W, H);
  
  // 面板
  ctx.fillStyle = '#fff';
  roundRectCtx(ctx, px, py, panelW, crops.length * itemH + s(50), s(16));
  
  ctx.fillStyle = '#333';
  ctx.font = 'bold ' + s(18) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('选择种植的作物', px + panelW / 2, py + s(30));
  ctx.textAlign = 'left';
  
  for (var i = 0; i < crops.length; i++) {
    var key = crops[i];
    var cfg = CONFIG.cropConfig[key];
    var iy = py + s(44) + i * itemH;
    
    ctx.fillStyle = i % 2 === 0 ? '#fafafa' : '#fff';
    ctx.fillRect(px + s(10), iy, panelW - s(20), itemH);
    
    ctx.font = s(24) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.emoji, px + s(45), iy + itemH / 2);
    
    ctx.textAlign = 'left';
    ctx.fillStyle = '#333';
    ctx.font = 'bold ' + s(16) + 'px sans-serif';
    ctx.fillText(cfg.name, px + s(75), iy + s(18));
    
    ctx.fillStyle = '#888';
    ctx.font = s(12) + 'px sans-serif';
    ctx.fillText('生长 ' + cfg.growTime + 's | 售价 ' + cfg.price + '金', px + s(75), iy + s(42));
  }
}

function roundRectCtx(ctx, x, y, w, h, r) {
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
  ctx.fill();
}

// 初始化
var canvas = wx.createCanvas();
Renderer._canvas = canvas;

Player.init(function(savedObj) {
  wx.setStorageSync('farmGameDataGame', savedObj);
});

Farm.init();
loadSave();
Renderer.init(canvas);

// 触摸事件
canvas.addEventListener('touchstart', function(e) {
  if (!e.touches || e.touches.length === 0) return;
  var touch = e.touches[0];
  Input.handleTouch(touch.clientX, touch.clientY, uiState);
});

// 开始游戏循环
requestAnimationFrame(gameLoop);

console.log('快乐农场 小游戏版 启动完成');