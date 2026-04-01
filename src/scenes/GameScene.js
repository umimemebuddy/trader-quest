import Phaser from 'phaser'
import { CONFIG } from '../config.js'

export default class GameScene extends Phaser.Scene {
  // 空投道具图标定义
  static AIRDROP_ICONS = {
    heal: { icon: '💊', color: 0x00ff00, name: '治疗药水' },
    energy: { icon: '⚡', color: 0x0088ff, name: '能量饮料' },
    damage: { icon: '⚔️', color: 0xff6600, name: '攻击增强' },
    shield: { icon: '🛡️', color: 0x00ffff, name: '护盾' },
    weapon_upgrade: { icon: '🔫', color: 0xff00ff, name: '武器升级' },
    spread_shot: { icon: '🔺', color: 0xffff00, name: '散弹' },
    laser_shot: { icon: '⚡', color: 0x00ffff, name: '激光' }
  }

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    try {
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 疯狂市场背景系统
    this.createMadMarketBackground(w, h)
    
    // 科技感背景层
    this.createTechBackground()
    
    // 背景层顺序：madBgLayer -> techBgLayer (数值越大越上层)

    // 游戏状态
    this.state = {
      coins: 0,
      wave: 1,
      health: CONFIG.PLAYER.MAX_HEALTH,
      energy: CONFIG.PLAYER.ENERGY_MAX,
      combo: 0,
      lastKillTime: 0,
      isGameOver: false,
      bullMarket: true,
      minerCount: 0,
      damageBoost: 0,
      shieldActive: false,
      shieldValue: 0,
      weaponLevel: 0,
      fomoWarnings: 0,
      noKillTimer: 0,
      airDrop: null,
      aimAngle: 0,
      spreadShot: false,
      laserShot: false,
      frozen: false,       // 冻结状态
      frozenUntil: 0,      // 冻结结束时间
      randomEvents: [],  // 随机事件数组
      eventWarnings: [],  // 事件警告提示
      showHandTriggered: [],  // 已触发的ShowHand阈值
      showHandActive: false,  // ShowHand进行中
      seenEnemyTypes: new Set()  // 已遭遇的敌人类型
    }

    // 创建玩家
    this.createPlayer()
    this.createUI()
    this.createGroups()
    this.startTimers()

    // 设置相机跟随
    this.cameras.main.setBounds(0, 0, w, h)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setDeadzone(50, 50)  // 添加死区防止边界抖动

    // 输入
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    })
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)

    // 鼠标射击
    this.input.on('pointerdown', () => this.shoot())

    // 手动按键状态追踪（修复键盘锁死问题）
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false
    }

    // 监听所有按键事件
    this.input.keyboard.on('keydown', (event) => {
      const code = event.code || event.key
      // 左右键
      if (code === 'ArrowLeft' || code === 'Left' || code === 'KeyA' || code === 'a' || code === 'A') {
        this.keys.left = true
      }
      if (code === 'ArrowRight' || code === 'Right' || code === 'KeyD' || code === 'd' || code === 'D') {
        this.keys.right = true
      }
      // 上下键
      if (code === 'ArrowUp' || code === 'Up' || code === 'KeyW' || code === 'w' || code === 'W') {
        this.keys.up = true
      }
      if (code === 'ArrowDown' || code === 'Down' || code === 'KeyS' || code === 's' || code === 'S') {
        this.keys.down = true
      }
    })

    this.input.keyboard.on('keyup', (event) => {
      const code = event.code || event.key
      // 左右键
      if (code === 'ArrowLeft' || code === 'Left' || code === 'KeyA' || code === 'a' || code === 'A') {
        this.keys.left = false
      }
      if (code === 'ArrowRight' || code === 'Right' || code === 'KeyD' || code === 'd' || code === 'D') {
        this.keys.right = false
      }
      // 上下键
      if (code === 'ArrowUp' || code === 'Up' || code === 'KeyW' || code === 'w' || code === 'W') {
        this.keys.up = false
      }
      if (code === 'ArrowDown' || code === 'Down' || code === 'KeyS' || code === 's' || code === 'S') {
        this.keys.down = false
      }
    })

    // 窗口失焦时重置所有按键，防止卡死
    window.addEventListener('blur', () => {
      this.keys.left = false
      this.keys.right = false
      this.keys.up = false
      this.keys.down = false
    })

    // 射击冷却
    this.lastShotTime = 0

    // 开始第一波
    this.spawnWave()
    } catch (error) {
      console.error('GameScene create error:', error)
      this.add.text(400, 300, `Error: ${error.message}`, { 
        fontSize: '20px', 
        fill: '#ff0000',
        backgroundColor: '#000000'
      }).setOrigin(0.5).setDepth(999)
    }
  }

  createPlayer() {
    this.player = this.add.container(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2)
    this.player.setDepth(50) // 确保主角在背景效果之上
    
    // === 外层金色链环 ===
    const chainRing = this.add.circle(0, 0, 32, 0x000000, 0)
    chainRing.setStrokeStyle(2, 0xffd700, 0.6)
    this.player.add(chainRing)
    
    // 链节点装饰
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const nodeX = Math.cos(angle) * 32
      const nodeY = Math.sin(angle) * 32
      const chainNode = this.add.circle(nodeX, nodeY, 3, 0xffd700, 0.8)
      this.player.add(chainNode)
    }
    
    // 外层光环 - 紫色能量场
    const glowRing = this.add.circle(0, 0, 28, 0x8b5cf6, 0.25)
    this.player.add(glowRing)
    
    // === 六边形主体区块 ===
    const body = this.add.polygon(0, 0, [0,-24, 21,-12, 21,12, 0,24, -21,12, -21,-12], 0x1a1a2e)
    body.setStrokeStyle(3, 0xffd700)
    this.player.add(body)
    
    // 区块边框发光
    const bodyGlow = this.add.polygon(0, 0, [0,-26, 23,-13, 23,13, 0,26, -23,13, -23,-13], 0x000000, 0)
    bodyGlow.setStrokeStyle(1, 0xffd700, 0.3)
    this.player.add(bodyGlow)
    
    // === 内部数据网格 ===
    const gridBg = this.add.rectangle(0, 0, 30, 30, 0x0a0a15, 0.8)
    this.player.add(gridBg)
    
    // 网格线 - 横向
    for (let i = -1; i <= 1; i++) {
      const hLine = this.add.rectangle(0, i * 10, 28, 1, 0xffd700, 0.3)
      this.player.add(hLine)
    }
    // 网格线 - 纵向
    for (let i = -1; i <= 1; i++) {
      const vLine = this.add.rectangle(i * 10, 0, 1, 28, 0xffd700, 0.3)
      this.player.add(vLine)
    }
    
    // === 中心₿符号 ===
    const btSymbol = this.add.text(0, -2, '₿', {
      fontSize: '20px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.player.add(btSymbol)
    
    // === 区块哈希显示 (简化版) ===
    const hashText = this.add.text(0, 12, '0x' + Math.random().toString(16).substr(2, 4).toUpperCase(), {
      fontSize: '7px',
      fill: '#00ffaa',
      fontFamily: 'monospace'
    }).setOrigin(0.5)
    this.player.add(hashText)
    
    // 存储哈希引用用于更新动画
    this.playerHash = hashText
    this.playerBtSymbol = btSymbol
    
    this.player.hitRadius = 24
    
    // === 动画效果 ===
    // 链环旋转
    this.tweens.add({
      targets: chainRing,
      angle: 360,
      duration: 8000,
      repeat: -1,
      ease: 'Linear'
    })
    
    // 光环脉冲
    this.tweens.add({
      targets: glowRing,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.1,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // ₿符号脉冲
    this.tweens.add({
      targets: btSymbol,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // 哈希闪烁 (确认动画)
    this.tweens.add({
      targets: hashText,
      alpha: 0.5,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // 边框光效
    this.tweens.add({
      targets: bodyGlow,
      scaleX: 1.05,
      scaleY: 1.05,
      alpha: 0.8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // 随机更新哈希
    this.time.addEvent({
      delay: 2000,
      callback: () => {
        if (this.playerHash && this.playerHash.active) {
          this.playerHash.setText('0x' + Math.random().toString(16).substr(2, 6).toUpperCase())
        }
      },
      loop: true
    })
  }

  createCornerDecorations(w, h) {
    // 四个角落装饰
    const corners = [
      { x: 80, y: 120 },
      { x: w - 80, y: 120 },
      { x: 80, y: h - 120 },
      { x: w - 80, y: h - 120 }
    ]
    
    corners.forEach(pos => {
      // 装饰圆点
      const dot = this.add.circle(pos.x, pos.y, 4, 0x00ffff, 0.4)
      dot.setDepth(6)
      
      this.tweens.add({
        targets: dot,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0.2,
        duration: 1500,
        yoyo: true,
        repeat: -1
      })
    })
  }

  createTechBackground() {
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 深色背景
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x050510)
    bg.setDepth(0)
    
    // 科技网格层
    this.createTechGrid(w, h)
    
    // 六边形网格
    this.createHexGrid(w, h)
    
    // 电路线条
    this.createCircuitLines(w, h)
    
    // 动态光晕
    this.createAmbientGlows(w, h)
    
    // 数据流效果
    this.createDataStreams(w, h)
    
    // 扫描线
    this.createScanLines(w, h)
    
    // 角落装饰
    this.createCornerDecorations(w, h)
    
    // 精美边框
    this.createTechBorder(w, h)
    
    // 浮动粒子
    this.createFloatingParticles(w, h)
    
    // 科技节点
    this.createTechNodes(w, h)
  }

  // ========================================
  // 疯狂市场背景系统
  // ========================================
  
  createMadMarketBackground(w, h) {
    // 背景层容器
    this.marketBgLayer = this.add.container(0, 0)
    this.marketBgLayer.setDepth(0.1)
    
    // 当前激活的特效
    this.activeMarketEffect = null
    this.effectTimers = []
    this.effectObjects = []
    
    // 初始化默认牛市背景
    this.activateMarketEffect('BULL_WAVE')
  }
  
  // 激活市场效果
  activateMarketEffect(effectType) {
    // 清除旧效果
    this.clearMarketEffect()
    
    this.activeMarketEffect = effectType
    
    switch(effectType) {
      case 'BULL_WAVE': this.createBullWaveEffect(); break
      case 'BEAR_CRASH': this.createBearCrashEffect(); break
      case 'THUNDERSTORM': this.createThunderStormEffect(); break
      case 'TOXIC_FOG': this.createToxicFogEffect(); break
      case 'INFERNO': this.createInfernoEffect(); break
      case 'GOLD_RAIN': this.createGoldRainEffect(); break
      case 'MATRIX_RAIN': this.createMatrixRainEffect(); break
      case 'SPACE_WARP': this.createSpaceWarpEffect(); break
      case 'FOMO_PANIC': this.createFomoPanicEffect(); break
      case 'DEFI_HACK': this.createDefiHackEffect(); break
    }
  }
  
  // 清除市场效果
  clearMarketEffect() {
    // 停止所有定时器
    this.effectTimers.forEach(timer => {
      if (timer && timer.remove) timer.remove()
    })
    this.effectTimers = []
    
    // 先停止所有与效果对象相关的 tweens，然后销毁
    this.effectObjects.forEach(obj => {
      if (obj && obj.active !== false) {
        this.tweens.killTweensOf(obj)
        if (obj.destroy) obj.destroy()
      }
    })
    this.effectObjects = []
    
    this.activeMarketEffect = null
  }
  
  // 1. 牛市K线浪潮
  createBullWaveEffect() {
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 绿色渐变背景
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x001a00)
    bg.setDepth(0.1)
    this.effectObjects.push(bg)
    
    // 创建飞升的K线
    const createKLine = () => {
      const x = Phaser.Math.Between(0, w)
      const startY = h + 50
      const segments = Phaser.Math.Between(5, 12)
      const points = [{x: 0, y: 0}]
      
      let currentY = 0
      for (let i = 0; i < segments; i++) {
        const isUp = Math.random() > 0.3
        const jump = Phaser.Math.Between(30, 80)
        currentY -= isUp ? jump : -jump * 0.4
        points.push({x: (i + 1) * 20, y: currentY})
      }
      
      const line = this.add.graphics()
      line.lineStyle(3, 0x00ff88, 0.8)
      line.beginPath()
      line.x = x
      line.y = startY
      line.path = line.path || new Phaser.Curves.Path(x, startY)
      line.clear()
      
      const startX = x
      const path = new Phaser.Curves.Path(startX, startY)
      points.forEach(p => path.lineTo(startX + p.x, startY + p.y))
      
      // 绘制K线
      line.lineStyle(4, 0x00ff88)
      path.draw(line)
      
      // K线实体
      points.forEach((p, i) => {
        if (i < points.length - 1) {
          const next = points[i + 1]
          const isGreen = next.y < p.y
          const bar = this.add.rectangle(
            startX + p.x + 10, 
            startY + p.y + (next.y - p.y) / 2,
            15, 
            Math.abs(next.y - p.y),
            isGreen ? 0x00ff88 : 0xff4444,
            0.7
          )
          this.effectObjects.push(bar)
        }
      })
      
      this.effectObjects.push(line)
      
      // 向上飞升动画
      this.tweens.add({
        targets: line,
        y: -200,
        alpha: 0,
        duration: Phaser.Math.Between(4000, 7000),
        ease: 'Linear',
        onComplete: () => {
          line.destroy()
          this.effectObjects = this.effectObjects.filter(o => o !== line)
        }
      })
    }
    
    // 每隔一小段时间生成新的K线
    const timer = this.time.addEvent({
      delay: 300,
      callback: createKLine,
      loop: true
    })
    this.effectTimers.push(timer)
    
    // 初始生成一批 - 减少数量
    for (let i = 0; i < 5; i++) {
      const delayTimer = this.time.delayedCall(i * 200, createKLine)
      this.effectTimers.push(delayTimer)
    }
    
    // 添加"🚀 TO THE MOON"文字
    const moonText = this.add.text(w/2, h - 100, '🚀 TO THE MOON', {
      fontSize: '48px',
      fill: '#00ff88',
      fontStyle: 'bold',
      stroke: '#004400',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0.3).setDepth(2)
    this.effectObjects.push(moonText)
    
    this.tweens.add({
      targets: moonText,
      y: h - 150,
      alpha: 0.5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }
  
  // 2. 熊市崩盘
  createBearCrashEffect() {
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 血红背景
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x1a0000)
    bg.setDepth(0.1)
    this.effectObjects.push(bg)
    
    // 坠落的K线
    const createFallingKLine = () => {
      const x = Phaser.Math.Between(0, w)
      const points = [{x: 0, y: 0}]
      const segments = Phaser.Math.Between(5, 10)
      
      let currentY = 0
      for (let i = 0; i < segments; i++) {
        const isDown = Math.random() > 0.3
        const drop = Phaser.Math.Between(30, 70)
        currentY += isDown ? drop : -drop * 0.3
        points.push({x: (i + 1) * 15, y: currentY})
      }
      
      const line = this.add.graphics()
      const startX = x
      const startY = -100
      const path = new Phaser.Curves.Path(startX, startY)
      points.forEach(p => path.lineTo(startX + p.x, startY + p.y))
      
      line.lineStyle(4, 0xff4444)
      path.draw(line)
      this.effectObjects.push(line)
      
      // 向下坠落动画
      this.tweens.add({
        targets: line,
        y: h + 100,
        alpha: 0,
        duration: Phaser.Math.Between(3000, 5000),
        ease: 'Linear',
        onComplete: () => {
          line.destroy()
          this.effectObjects = this.effectObjects.filter(o => o !== line)
        }
      })
    }
    
    const timer = this.time.addEvent({
      delay: 200,
      callback: createFallingKLine,
      loop: true
    })
    this.effectTimers.push(timer)
    
    // 初始生成 - 减少数量
    for (let i = 0; i < 4; i++) {
      const delayTimer = this.time.delayedCall(i * 150, createFallingKLine)
      this.effectTimers.push(delayTimer)
    }
    
    // 警告文字
    const warningText = this.add.text(w/2, h/2, '💀 CRASH 💀', {
      fontSize: '64px',
      fill: '#ff0000',
      fontStyle: 'bold',
      stroke: '#440000',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0.4).setDepth(2)
    this.effectObjects.push(warningText)
    
    this.tweens.add({
      targets: warningText,
      alpha: 0.8,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1
    })
    
    // 红色闪烁边框
    this.createPanicBorder(0xff0000, 0x440000)
  }
  
  // 3. 雷暴闪电
  createThunderStormEffect() {
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 深紫黑暗背景
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x0a001a)
    bg.setDepth(0.1)
    this.effectObjects.push(bg)
    
    // 闪电函数
    const createLightning = () => {
      const startX = Phaser.Math.Between(50, w - 50)
      const startY = 0
      const endY = h
      
      let points = [{x: startX, y: startY}]
      let currentX = startX
      let currentY = startY
      
      // 生成闪电路径
      while (currentY < endY - 50) {
        currentX += Phaser.Math.Between(-80, 80)
        currentY += Phaser.Math.Between(40, 100)
        points.push({x: Math.max(20, Math.min(w - 20, currentX)), y: currentY})
      }
      points.push({x: currentX, y: endY})
      
      // 绘制闪电 - 使用 lineBetween 方式
      const lightning = this.add.graphics()
      lightning.lineStyle(3, 0xffffff, 1)
      for (let i = 1; i < points.length; i++) {
        lightning.lineBetween(points[i-1].x, points[i-1].y, points[i].x, points[i].y)
      }
      lightning.setDepth(2)
      
      // 闪电发光
      const glow = this.add.graphics()
      glow.lineStyle(8, 0x8b5cf6, 0.5)
      for (let i = 1; i < points.length; i++) {
        glow.lineBetween(points[i-1].x, points[i-1].y, points[i].x, points[i].y)
      }
      glow.setDepth(2)
      
      this.effectObjects.push(lightning, glow)
      
      // 快速闪烁后销毁
      this.tweens.add({
        targets: [lightning, glow],
        alpha: 0,
        duration: 100,
        delay: 50,
        onComplete: () => {
          if (lightning && lightning.active) lightning.destroy()
          if (glow && glow.active) glow.destroy()
          this.effectObjects = this.effectObjects.filter(o => o !== lightning && o !== glow)
        }
      })
      
      // 全屏闪白
      const flash = this.add.rectangle(w/2, h/2, w, h, 0xffffff, 0.3)
      flash.setDepth(99)
      flash._isFlash = true // 标记为需要特殊清理
      this.effectObjects.push(flash)
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 150,
        onComplete: () => {
          if (flash && flash.active) flash.destroy()
          this.effectObjects = this.effectObjects.filter(o => o !== flash)
        }
      })
    }
    
    // 随机闪电 - 降低频率避免性能问题
    const timer = this.time.addEvent({
      delay: 3000,
      callback: () => {
        if (Math.random() > 0.3) createLightning()
      },
      loop: true
    })
    this.effectTimers.push(timer)
    
    // 雨滴效果 - 降低频率避免卡顿
    const createRain = () => {
      const drop = this.add.rectangle(
        Phaser.Math.Between(0, w),
        -20,
        2,
        Phaser.Math.Between(15, 30),
        0x4488ff,
        0.6
      )
      drop.setDepth(1)
      this.effectObjects.push(drop)
      
      this.tweens.add({
        targets: drop,
        y: h + 50,
        duration: Phaser.Math.Between(500, 1000),
        onComplete: () => {
          if (drop && drop.active) drop.destroy()
          this.effectObjects = this.effectObjects.filter(o => o !== drop)
        }
      })
    }
    
    const rainTimer = this.time.addEvent({
      delay: 80,
      callback: createRain,
      loop: true
    })
    this.effectTimers.push(rainTimer)
    
    // 雷暴文字
    const stormText = this.add.text(w/2, 80, '⛈️ 雷暴来袭 ⛈️', {
      fontSize: '36px',
      fill: '#8b5cf6',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2)
    this.effectObjects.push(stormText)
  }
  
  // 4. 毒雾弥漫
  createToxicFogEffect() {
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 紫色毒雾背景
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x1a001a)
    bg.setDepth(0.1)
    this.effectObjects.push(bg)
    
    // 毒气漩涡 - 使用 lineBetween 替代 pathMoveTo/pathLineTo
    const createSwirl = (x, y) => {
      const swirl = this.add.graphics()
      swirl.lineStyle(3, 0x9933ff, 0.6)
      swirl.setDepth(2)
      
      // 使用 lineBetween 绘制螺旋
      const points = []
      for (let i = 0; i < 36; i++) {
        const angle = (i / 36) * Math.PI * 4
        const radius = 20 + i * 3
        points.push({
          x: x + Math.cos(angle) * radius,
          y: y + Math.sin(angle) * radius
        })
      }
      
      // 使用 strokePoints 绘制
      swirl.strokePoints(points, false)
      this.effectObjects.push(swirl)
      
      this.tweens.add({
        targets: swirl,
        angle: 360,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 3000,
        onComplete: () => {
          if (swirl && swirl.active) swirl.destroy()
          this.effectObjects = this.effectObjects.filter(o => o !== swirl)
        }
      })
    }
    
    // 生成毒气漩涡 - 减少数量以提高性能
    const swirlTimer = this.time.addEvent({
      delay: 2000,
      callback: () => createSwirl(Phaser.Math.Between(100, w-100), Phaser.Math.Between(100, h-100)),
      loop: true
    })
    this.effectTimers.push(swirlTimer)
    
    // 毒雾文字
    const toxicText = this.add.text(w/2, h - 80, '☠️ 毒雾弥漫 ☠️', {
      fontSize: '42px',
      fill: '#9933ff',
      fontStyle: 'bold',
      stroke: '#330066',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0.6).setDepth(2)
    this.effectObjects.push(toxicText)
    
    // 简化毒气效果 - 减少对象创建
    const createFogParticle = () => {
      const x = Phaser.Math.Between(0, w)
      const y = Phaser.Math.Between(0, h)
      const size = Phaser.Math.Between(40, 100)
      const fog = this.add.circle(x, y, size, Phaser.Math.RND.pick([0x9933ff, 0x6600cc, 0xaa44ff]), 0.15)
      fog.setDepth(1)
      this.effectObjects.push(fog)
      
      this.tweens.add({
        targets: fog,
        x: x + Phaser.Math.Between(-80, 80),
        y: y + Phaser.Math.Between(-50, 50),
        alpha: 0,
        duration: Phaser.Math.Between(4000, 8000),
        onComplete: () => {
          if (fog && fog.active) fog.destroy()
          this.effectObjects = this.effectObjects.filter(o => o !== fog)
        }
      })
    }
    
    const fogTimer = this.time.addEvent({
      delay: 1000,
      callback: createFogParticle,
      loop: true
    })
    this.effectTimers.push(fogTimer)
  }
  
  // 5. 火焰地狱
  createInfernoEffect() {
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 岩浆背景
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x330000)
    bg.setDepth(0.1)
    this.effectObjects.push(bg)
    
    // 创建火焰粒子
    const createFlame = () => {
      const x = Phaser.Math.Between(0, w)
      const flame = this.add.graphics()
      
      // 火焰形状
      const flameHeight = Phaser.Math.Between(40, 100)
      const flameWidth = Phaser.Math.Between(20, 40)
      
      flame.fillStyle(Phaser.Math.RND.pick([0xff4400, 0xff6600, 0xffaa00, 0xff0000]), 0.9)
      flame.fillTriangle(
        x, h + flameHeight,
        x - flameWidth/2, h,
        x + flameWidth/2, h
      )
      
      // 内焰
      flame.fillStyle(0xffdd00, 0.7)
      flame.fillTriangle(
        x, h + flameHeight * 0.7,
        x - flameWidth/4, h,
        x + flameWidth/4, h
      )
      
      flame.setDepth(0.2)
      this.effectObjects.push(flame)
      
      // 摇曳动画
      this.tweens.add({
        targets: flame,
        x: `+=${Phaser.Math.Between(-20, 20)}`,
        y: -20,
        alpha: 0,
        scaleX: 1.3,
        duration: Phaser.Math.Between(1500, 2500),
        ease: 'Quad.easeOut',
        onComplete: () => {
          flame.destroy()
          this.effectObjects = this.effectObjects.filter(o => o !== flame)
        }
      })
    }
    
    // 持续生成火焰
    const timer = this.time.addEvent({
      delay: 100,
      callback: createFlame,
      loop: true
    })
    this.effectTimers.push(timer)
    
    // 岩浆波浪
    const lavaWave = this.add.graphics()
    this.effectObjects.push(lavaWave)
    
    const updateLava = () => {
      lavaWave.clear()
      lavaWave.fillStyle(0xff4400, 0.8)
      lavaWave.beginPath()
      lavaWave.moveTo(0, h)
      
      for (let x = 0; x <= w; x += 20) {
        const y = h - 50 + Math.sin((x + Date.now() * 0.01) * 0.05) * 20
        lavaWave.lineTo(x, y)
      }
      lavaWave.lineTo(w, h)
      lavaWave.closePath()
      lavaWave.fill()
      
      // 发光效果
      lavaWave.fillStyle(0xffaa00, 0.3)
      lavaWave.beginPath()
      lavaWave.moveTo(0, h)
      for (let x = 0; x <= w; x += 20) {
        const y = h - 40 + Math.sin((x + Date.now() * 0.015) * 0.05) * 15
        lavaWave.lineTo(x, y)
      }
      lavaWave.lineTo(w, h)
      lavaWave.closePath()
      lavaWave.fill()
    }
    
    const lavaTimer = this.time.addEvent({
      delay: 50,
      callback: updateLava,
      loop: true
    })
    this.effectTimers.push(lavaTimer)
    
    // 火焰文字
    const infernoText = this.add.text(w/2, 80, '🔥 火焰地狱 🔥', {
      fontSize: '48px',
      fill: '#ff6600',
      fontStyle: 'bold',
      stroke: '#660000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(2)
    this.effectObjects.push(infernoText)
  }
  
  // 6. 金币雨
  createGoldRainEffect() {
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 奢华金色背景
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x1a1500)
    bg.setDepth(0.1)
    this.effectObjects.push(bg)
    
    // 金色光晕
    const glow = this.add.circle(w/2, h/2, 200, 0xffd700, 0.1)
    glow.setDepth(0.15)
    this.effectObjects.push(glow)
    
    this.tweens.add({
      targets: glow,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.2,
      duration: 2000,
      yoyo: true,
      repeat: -1
    })
    
    // 创建金币
    const createCoin = () => {
      const coinTypes = ['💰', '🪙', '💎', '🏆', '👑']
      const x = Phaser.Math.Between(0, w)
      const coin = this.add.text(x, -30, Phaser.Math.RND.pick(coinTypes), {
        fontSize: Phaser.Math.Between(20, 40) + 'px'
      }).setOrigin(0.5)
      coin.setDepth(0.3)
      this.effectObjects.push(coin)
      
      // 下落+旋转
      this.tweens.add({
        targets: coin,
        y: h + 50,
        x: x + Phaser.Math.Between(-100, 100),
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(2000, 4000),
        ease: 'Quad.easeIn',
        onComplete: () => {
          coin.destroy()
          this.effectObjects = this.effectObjects.filter(o => o !== coin)
        }
      })
    }
    
    const timer = this.time.addEvent({
      delay: 150,
      callback: createCoin,
      loop: true
    })
    this.effectTimers.push(timer)
    
    // 初始生成一批 - 减少数量
    for (let i = 0; i < 10; i++) {
      const delayTimer = this.time.delayedCall(i * 100, createCoin)
      this.effectTimers.push(delayTimer)
    }
    
    // 财富文字
    const wealthText = this.add.text(w/2, h - 100, '💎 财富自由 💎', {
      fontSize: '52px',
      fill: '#ffd700',
      fontStyle: 'bold',
      stroke: '#664400',
      strokeThickness: 5
    }).setOrigin(0.5)
    wealthText.setDepth(2)
    this.effectObjects.push(wealthText)
    
    this.tweens.add({
      targets: wealthText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1
    })
  }
  
  // 7. Matrix黑客帝国数字雨
  createMatrixRainEffect() {
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 深绿黑色背景
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x001100)
    bg.setDepth(0.1)
    this.effectObjects.push(bg)
    
    // Matrix字符
    const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
    
    // 创建数字列
    const createColumn = (x) => {
      const column = []
      const charCount = Phaser.Math.Between(10, 30)
      
      for (let i = 0; i < charCount; i++) {
        const char = this.add.text(x, i * 25 - 50, Phaser.Math.RND.pick(matrixChars), {
          fontSize: '20px',
          fontFamily: 'monospace',
          fill: '#00ff00'
        }).setOrigin(0.5)
        char.setDepth(0.25)
        this.effectObjects.push(char)
        column.push(char)
      }
      
      // 头部高亮
      if (column.length > 0) {
        column[0].setFill('#ffffff')
        column[0].setScale(1.2)
      }
      
      // 瀑布下落
      const updateChar = () => {
        column.forEach((char, i) => {
          if (i > 0) {
            char.y += 25
            // 渐变效果
            const alpha = 1 - (i / column.length)
            char.setAlpha(alpha * 0.8)
          }
        })
        
        // 移动第一个字符到底部
        const first = column.shift()
        first.y = -50
        first.setAlpha(1)
        column.push(first)
        
        // 随机变换字符
        first.setText(Phaser.Math.RND.pick(matrixChars))
      }
      
      const timer = this.time.addEvent({
        delay: 100,
        callback: updateChar,
        loop: true
      })
      this.effectTimers.push(timer)
    }
    
    // 创建多列 - 减少列数并保存定时器
    for (let x = 30; x < w; x += 40) {
      const delayTimer = this.time.delayedCall(Math.random() * 2000, () => createColumn(x))
      this.effectTimers.push(delayTimer)
    }
    
    // 黑客文字
    const hackText = this.add.text(w/2, 60, '💚 入侵中... 💚', {
      fontSize: '32px',
      fontFamily: 'monospace',
      fill: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2)
    this.effectObjects.push(hackText)
    
    // 闪烁效果
    this.tweens.add({
      targets: hackText,
      alpha: 0.5,
      duration: 200,
      yoyo: true,
      repeat: -1
    })
  }
  
  // 8. 太空虫洞
  createSpaceWarpEffect() {
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 深空背景
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x000022)
    bg.setDepth(0.1)
    this.effectObjects.push(bg)
    
    // 星星
    const createStar = (x, y, size) => {
      const star = this.add.circle(x, y, size, 0xffffff, Math.random())
      star.setDepth(0.15)
      this.effectObjects.push(star)
      
      if (size > 1) {
        this.tweens.add({
          targets: star,
          alpha: Math.random(),
          duration: Phaser.Math.Between(500, 2000),
          yoyo: true,
          repeat: -1
        })
      }
    }
    
    // 生成星星
    for (let i = 0; i < 200; i++) {
      createStar(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Math.random() * 2
      )
    }
    
    // 虫洞效果 - 向中心飞行的粒子
    const createWarpParticle = () => {
      const angle = Math.random() * Math.PI * 2
      const startDist = Math.max(w, h)
      const x = w/2 + Math.cos(angle) * startDist
      const y = h/2 + Math.sin(angle) * startDist
      
      const particle = this.add.circle(x, y, Phaser.Math.Between(2, 5), 0x00ffff)
      particle.setDepth(0.2)
      this.effectObjects.push(particle)
      
      const targetX = w/2 + (Math.random() - 0.5) * 100
      const targetY = h/2 + (Math.random() - 0.5) * 100
      
      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        scale: 0,
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        ease: 'Quad.easeIn',
        onComplete: () => {
          particle.destroy()
          this.effectObjects = this.effectObjects.filter(o => o !== particle)
        }
      })
    }
    
    const timer = this.time.addEvent({
      delay: 50,
      callback: createWarpParticle,
      loop: true
    })
    this.effectTimers.push(timer)
    
    // 虫洞漩涡
    const wormhole = this.add.graphics()
    this.effectObjects.push(wormhole)
    
    const drawWormhole = () => {
      wormhole.clear()
      for (let i = 0; i < 5; i++) {
        const radius = 80 + i * 30
        const alpha = 0.5 - i * 0.1
        wormhole.lineStyle(2, 0x8b5cf6, alpha)
        wormhole.strokeCircle(w/2, h/2, radius)
      }
    }
    
    const wormTimer = this.time.addEvent({
      delay: 100,
      callback: drawWormhole,
      loop: true
    })
    this.effectTimers.push(wormTimer)
    
    this.tweens.add({
      targets: wormhole,
      angle: 360,
      duration: 10000,
      repeat: -1
    })
    
    // 太空文字
    const spaceText = this.add.text(w/2, h - 60, '🌌 太空跳跃 🌌', {
      fontSize: '38px',
      fill: '#8b5cf6',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2)
    this.effectObjects.push(spaceText)
  }
  
  // 9. FOMO恐慌
  createFomoPanicEffect() {
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 疯狂红紫背景
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x1a0010)
    bg.setDepth(0.1)
    this.effectObjects.push(bg)
    
    // 警告条纹
    const stripes = this.add.graphics()
    stripes.setDepth(0.15)
    this.effectObjects.push(stripes)
    
    const drawStripes = () => {
      stripes.clear()
      stripes.fillStyle(0xff0000, 0.1)
      for (let x = -100; x < w + 100; x += 60) {
        stripes.fillTriangle(x, 0, x + 30, 0, x + 60, h)
      }
    }
    drawStripes()
    
    this.tweens.add({
      targets: stripes,
      alpha: 0.5,
      duration: 300,
      yoyo: true,
      repeat: -1
    })
    
    // 闪烁警告
    const createWarning = (x, y) => {
      const texts = ['FOMO!', '🚨快买!', '来不及了!', '错过!💔', '赶紧!⏰', '上车!🚀']
      const warning = this.add.text(x, y, Phaser.Math.RND.pick(texts), {
        fontSize: Phaser.Math.Between(20, 40) + 'px',
        fill: '#ffff00',
        fontStyle: 'bold',
        stroke: '#ff0000',
        strokeThickness: 2
      }).setOrigin(0.5)
      warning.setDepth(0.35)
      this.effectObjects.push(warning)
      
      this.tweens.add({
        targets: warning,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: Phaser.Math.Between(1000, 2000),
        onComplete: () => {
          warning.destroy()
          this.effectObjects = this.effectObjects.filter(o => o !== warning)
        }
      })
    }
    
    const warningTimer = this.time.addEvent({
      delay: 500,
      callback: () => createWarning(Phaser.Math.Between(50, w-50), Phaser.Math.Between(50, h-50)),
      loop: true
    })
    this.effectTimers.push(warningTimer)
    
    // 恐慌文字
    const fomoText = this.add.text(w/2, h/2, '⚠️ FOMO ⚠️', {
      fontSize: '80px',
      fill: '#ff0000',
      fontStyle: 'bold',
      stroke: '#440000',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(2)
    this.effectObjects.push(fomoText)
    
    this.tweens.add({
      targets: fomoText,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.7,
      duration: 200,
      yoyo: true,
      repeat: -1
    })
    
    // 边框警告
    this.createPanicBorder(0xff0000, 0xff4400)
  }
  
  // 10. DEFI被盗警报
  createDefiHackEffect() {
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 黑客红黑背景
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x0a0000)
    bg.setDepth(0.1)
    this.effectObjects.push(bg)
    
    // 警报闪烁
    const alertOverlay = this.add.rectangle(w/2, h/2, w, h, 0xff0000, 0)
    alertOverlay.setDepth(0.15)
    this.effectObjects.push(alertOverlay)
    
    this.tweens.add({
      targets: alertOverlay,
      fillAlpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    })
    
    // 滚动代码
    const codeChars = '!@#$%^&*()_+-=[]{}|;:,.<>?0123456789ABCDEF'
    
    const createCodeLine = (y) => {
      let code = ''
      for (let i = 0; i < 80; i++) {
        code += Phaser.Math.RND.pick(codeChars)
      }
      
      const codeText = this.add.text(0, y, code, {
        fontSize: '14px',
        fontFamily: 'monospace',
        fill: '#00ff00'
      }).setAlpha(0.7)
      codeText.setDepth(0.2)
      this.effectObjects.push(codeText)
      
      this.tweens.add({
        targets: codeText,
        x: -w,
        duration: Phaser.Math.Between(5000, 10000),
        onComplete: () => {
          codeText.destroy()
          this.effectObjects = this.effectObjects.filter(o => o !== codeText)
        }
      })
    }
    
    const codeTimer = this.time.addEvent({
      delay: 200,
      callback: () => createCodeLine(Phaser.Math.Between(0, h)),
      loop: true
    })
    this.effectTimers.push(codeTimer)
    
    // 警告框
    const warningBox = this.add.graphics()
    warningBox.setDepth(2)
    this.effectObjects.push(warningBox)
    
    const drawWarningBox = () => {
      warningBox.clear()
      warningBox.lineStyle(4, 0xff0000)
      warningBox.strokeRect(w/2 - 300, h/2 - 80, 600, 160)
      warningBox.lineStyle(2, 0xffaa00)
      warningBox.strokeRect(w/2 - 290, h/2 - 70, 580, 140)
    }
    drawWarningBox()
    
    // 警报文字
    const hackText = this.add.text(w/2, h/2 - 20, '🚨 安全警报 🚨', {
      fontSize: '42px',
      fill: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2)
    this.effectObjects.push(hackText)
    
    const hackSubtext = this.add.text(w/2, h/2 + 30, '检测到异常交易!', {
      fontSize: '24px',
      fill: '#ffff00',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(2)
    this.effectObjects.push(hackSubtext)
    
    this.tweens.add({
      targets: [hackText, hackSubtext],
      alpha: 0.5,
      duration: 300,
      yoyo: true,
      repeat: -1
    })
  }
  
  // 恐慌边框 - 设置为7确保在UI之下
  createPanicBorder(color1, color2) {
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    const border = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0)
    border.setStrokeStyle(6, color1)
    border.setDepth(7)
    this.effectObjects.push(border)
    
    this.tweens.add({
      targets: border,
      strokeColor: { from: color1, to: color2 },
      duration: 200,
      yoyo: true,
      repeat: -1
    })
  }
  
  // 市场效果与事件联动
  triggerEventEffect(eventType) {
    switch(eventType) {
      case 'thunder':
        this.activateMarketEffect('THUNDERSTORM')
        this.time.delayedCall(10000, () => {
          if (this.state.randomEvents.length === 0) {
            this.activateMarketEffect(this.state.bullMarket ? 'BULL_WAVE' : 'BEAR_CRASH')
          }
        })
        break
      case 'toxic':
        this.activateMarketEffect('TOXIC_FOG')
        this.time.delayedCall(12000, () => {
          if (this.state.randomEvents.length === 0) {
            this.activateMarketEffect(this.state.bullMarket ? 'BULL_WAVE' : 'BEAR_CRASH')
          }
        })
        break
      case 'fire':
        this.activateMarketEffect('INFERNO')
        this.time.delayedCall(8000, () => {
          if (this.state.randomEvents.length === 0) {
            this.activateMarketEffect(this.state.bullMarket ? 'BULL_WAVE' : 'BEAR_CRASH')
          }
        })
        break
      case 'gold':
        this.activateMarketEffect('GOLD_RAIN')
        this.time.delayedCall(10000, () => {
          if (this.state.randomEvents.length === 0) {
            this.activateMarketEffect(this.state.bullMarket ? 'BULL_WAVE' : 'BEAR_CRASH')
          }
        })
        break
      case 'fomo':
        this.activateMarketEffect('FOMO_PANIC')
        this.time.delayedCall(8000, () => {
          if (this.state.randomEvents.length === 0) {
            this.activateMarketEffect(this.state.bullMarket ? 'BULL_WAVE' : 'BEAR_CRASH')
          }
        })
        break
    }
  }
  
  createTechGrid(w, h) {
    // 主网格
    const grid = this.add.grid(w/2, h/2, w, h, 150, 150, 0x0a2040, 0.5)
    grid.setDepth(1)
    
    // 细网格
    const subGrid = this.add.grid(w/2, h/2, w, h, 50, 50, 0x0a1525, 0.2)
    subGrid.setDepth(1)
    
    // 垂直扫描带
    for (let x = 0; x < w; x += 300) {
      const scanBand = this.add.rectangle(x + 75, h/2, 30, h, 0x00ffff, 0.02)
      scanBand.setDepth(1)
      
      this.tweens.add({
        targets: scanBand,
        x: x + 150,
        duration: 8000,
        repeat: -1,
        ease: 'Linear'
      })
    }
    
    // 水平扫描带
    for (let y = 0; y < h; y += 300) {
      const hBand = this.add.rectangle(w/2, y + 75, w, 20, 0x00ff88, 0.015)
      hBand.setDepth(1)
      
      this.tweens.add({
        targets: hBand,
        y: y + 150,
        duration: 10000,
        repeat: -1,
        ease: 'Linear'
      })
    }
  }
  
  createHexGrid(w, h) {
    const hexSize = 60
    const hexHeight = hexSize * Math.sqrt(3)
    
    // 创建六边形网格装饰
    for (let row = 0; row < h / hexHeight + 2; row++) {
      for (let col = 0; col < w / (hexSize * 1.5) + 2; col++) {
        const offsetX = (row % 2) * hexSize * 0.75
        const x = col * hexSize * 1.5 + offsetX
        const y = row * hexHeight
        
        // 六边形边框
        const hex = this.add.polygon(x, y, this.getHexPoints(hexSize), 0x00ffff, 0)
        hex.setStrokeStyle(1, 0x00ffff, 0.08)
        hex.setDepth(0.5)
        
        // 随机闪烁
        if (Math.random() > 0.85) {
          this.tweens.add({
            targets: hex,
            alpha: 0.02,
            duration: Phaser.Math.Between(2000, 5000),
            yoyo: true,
            repeat: -1
          })
        }
      }
    }
  }
  
  getHexPoints(size) {
    const points = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      points.push(Math.cos(angle) * size)
      points.push(Math.sin(angle) * size)
    }
    return points
  }
  
  createCircuitLines(w, h) {
    const graphics = this.add.graphics()
    graphics.setDepth(2)
    
    // 电路板风格线条
    const lineColor = 0x00ff88
    const lineAlpha = 0.15
    
    // 水平主线
    for (let y = 200; y < h; y += 400) {
      const startX = Phaser.Math.Between(0, 200)
      const segments = Phaser.Math.Between(3, 6)
      let currentX = startX
      
      graphics.lineStyle(2, lineColor, lineAlpha)
      graphics.beginPath()
      graphics.moveTo(currentX, y)
      
      for (let i = 0; i < segments; i++) {
        const segLength = Phaser.Math.Between(100, 300)
        const goRight = Math.random() > 0.5
        currentX += goRight ? segLength : -segLength
        
        if (currentX < 50) currentX = 50
        if (currentX > w - 50) currentX = w - 50
        
        graphics.lineTo(currentX, y)
        
        // 垂直连接
        if (i < segments - 1) {
          const vLength = Phaser.Math.Between(50, 150) * (Math.random() > 0.5 ? 1 : -1)
          graphics.lineTo(currentX, y + vLength)
        }
      }
      
      graphics.strokePath()
      
      // 节点
      graphics.fillStyle(lineColor, lineAlpha * 2)
      graphics.fillCircle(startX, y, 4)
      graphics.fillCircle(currentX, y, 4)
    }
    
    // 垂直主线
    for (let x = 200; x < w; x += 400) {
      const startY = Phaser.Math.Between(0, 200)
      const segments = Phaser.Math.Between(3, 6)
      let currentY = startY
      
      graphics.lineStyle(2, 0x00ffff, lineAlpha * 0.8)
      graphics.beginPath()
      graphics.moveTo(x, currentY)
      
      for (let i = 0; i < segments; i++) {
        const segLength = Phaser.Math.Between(100, 300)
        const goDown = Math.random() > 0.5
        currentY += goDown ? segLength : -segLength
        
        if (currentY < 50) currentY = 50
        if (currentY > h - 50) currentY = h - 50
        
        graphics.lineTo(x, currentY)
        
        if (i < segments - 1) {
          const hLength = Phaser.Math.Between(50, 150) * (Math.random() > 0.5 ? 1 : -1)
          graphics.lineTo(x + hLength, currentY)
        }
      }
      
      graphics.strokePath()
      graphics.fillStyle(0x00ffff, lineAlpha * 2)
      graphics.fillCircle(x, startY, 4)
      graphics.fillCircle(x, currentY, 4)
    }
  }
  
  createDataStreams(w, h) {
    // 移动的数据流效果
    for (let i = 0; i < 15; i++) {
      const isHorizontal = Math.random() > 0.5
      const stream = this.add.graphics()
      stream.setDepth(3)
      
      const color = Phaser.Math.RND.pick([0x00ffff, 0x00ff88, 0xff6600])
      const y = isHorizontal ? Phaser.Math.Between(50, h - 50) : Phaser.Math.Between(50, h - 50)
      const x = isHorizontal ? Phaser.Math.Between(50, w - 50) : Phaser.Math.Between(50, w - 50)
      
      // 数据点
      const points = []
      const count = Phaser.Math.Between(5, 15)
      
      for (let j = 0; j < count; j++) {
        const px = isHorizontal ? x + j * 20 : x
        const py = isHorizontal ? y : y + j * 20
        const size = Phaser.Math.Between(2, 5)
        points.push({ x: px, y: py, size })
      }
      
      points.forEach((p, idx) => {
        const dot = this.add.circle(p.x, p.y, p.size, color, 0.6)
        dot.setDepth(3)
        
        // 依次点亮动画
        this.tweens.add({
          targets: dot,
          alpha: 0,
          delay: idx * 100,
          duration: 200,
          ease: 'Linear',
          repeat: -1,
          repeatDelay: Phaser.Math.Between(2000, 5000)
        })
      })
    }
  }
  
  createScanLines(w, h) {
    // 扫描线
    this.scanLine = this.add.rectangle(w/2, 0, w, 3, 0x00ffff, 0.2)
    this.scanLine.setDepth(5)
    this.tweens.add({
      targets: this.scanLine,
      y: h,
      duration: 5000,
      repeat: -1,
      ease: 'Linear'
    })
    
    // 第二条扫描线
    this.scanLine2 = this.add.rectangle(w/2, h, w, 2, 0xff6600, 0.12)
    this.scanLine2.setDepth(5)
    this.tweens.add({
      targets: this.scanLine2,
      y: 0,
      duration: 7000,
      repeat: -1,
      ease: 'Linear'
    })
    
    // 第三条扫描线
    this.scanLine3 = this.add.rectangle(0, h/2, w, 2, 0x00ff88, 0.1)
    this.scanLine3.setDepth(5)
    this.tweens.add({
      targets: this.scanLine3,
      x: w,
      duration: 10000,
      repeat: -1,
      ease: 'Linear'
    })
  }
  
  createAmbientGlows(w, h) {
    const glowPositions = [
      { x: 400, y: 350, color: 0x00ff88 },
      { x: w - 500, y: 400, color: 0x00ffff },
      { x: w/2, y: h - 350, color: 0xff6600 },
      { x: 300, y: h - 250, color: 0xff00ff },
      { x: w - 300, y: h - 450, color: 0x0088ff },
      { x: w/2, y: 300, color: 0xffff00 }
    ]
    
    glowPositions.forEach((glow, i) => {
      // 大光晕
      const glow1 = this.add.ellipse(glow.x, glow.y, 500, 350, glow.color, 0.04)
      glow1.setDepth(0.8)
      
      // 中光晕
      const glow2 = this.add.ellipse(glow.x, glow.y, 250, 180, glow.color, 0.06)
      glow2.setDepth(0.8)
      
      // 脉冲
      this.tweens.add({
        targets: [glow1, glow2],
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0.02,
        duration: 2500 + i * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    })
  }
  
  createFloatingParticles(w, h) {
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, w)
      const y = Phaser.Math.Between(0, h)
      const size = Phaser.Math.Between(1, 4)
      const color = Phaser.Math.RND.pick([0x00ffff, 0x00ff88, 0xffd700, 0xff6600, 0xff00ff])
      
      const particle = this.add.circle(x, y, size, color, 0.5)
      particle.setDepth(4)
      
      const duration = Phaser.Math.Between(2000, 5000)
      const destX = x + Phaser.Math.Between(-150, 150)
      const destY = y + Phaser.Math.Between(-150, 150)
      
      this.tweens.add({
        targets: particle,
        x: destX,
        y: destY,
        alpha: 0.1,
        duration: duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
  }
  
  createTechNodes(w, h) {
    // 科技节点装饰
    const nodePositions = [
      { x: 200, y: 200 }, { x: w - 200, y: 200 },
      { x: 200, y: h - 200 }, { x: w - 200, y: h - 200 },
      { x: w/2, y: 150 }, { x: w/2, y: h - 150 },
      { x: 150, y: h/2 }, { x: w - 150, y: h/2 }
    ]
    
    nodePositions.forEach((pos, i) => {
      // 外圈
      const outerRing = this.add.circle(pos.x, pos.y, 25, 0x00ffff, 0)
      outerRing.setStrokeStyle(2, 0x00ffff, 0.3)
      outerRing.setDepth(6)
      
      // 中圈
      const midRing = this.add.circle(pos.x, pos.y, 15, 0x00ff88, 0)
      midRing.setStrokeStyle(1, 0x00ff88, 0.4)
      midRing.setDepth(6)
      
      // 中心点
      const center = this.add.circle(pos.x, pos.y, 4, 0x00ffff, 0.8)
      center.setDepth(6)
      
      // 旋转动画
      this.tweens.add({
        targets: outerRing,
        angle: 360,
        duration: 8000 + i * 500,
        repeat: -1,
        ease: 'Linear'
      })
      
      this.tweens.add({
        targets: midRing,
        angle: -360,
        duration: 5000 + i * 300,
        repeat: -1,
        ease: 'Linear'
      })
      
      // 脉冲动画
      this.tweens.add({
        targets: [outerRing, midRing, center],
        scaleX: 1.2,
        scaleY: 1.2,
        alpha: 0.3,
        duration: 1500,
        yoyo: true,
        repeat: -1
      })
    })
  }

  createTechBorder(w, h) {
    // 边框
    const borderColor = 0x00ffff
    const borderAlpha = 0.2
    
    // 顶部
    const topBar = this.add.rectangle(w/2, 20, w, 40, borderColor, borderAlpha * 0.5)
    topBar.setDepth(10)
    
    // 底部
    const bottomBar = this.add.rectangle(w/2, h - 20, w, 40, borderColor, borderAlpha * 0.5)
    bottomBar.setDepth(10)
    
    // 左右
    const leftBar = this.add.rectangle(20, h/2, 40, h, borderColor, borderAlpha * 0.5)
    leftBar.setDepth(10)
    
    const rightBar = this.add.rectangle(w - 20, h/2, 40, h, borderColor, borderAlpha * 0.5)
    rightBar.setDepth(10)
    
    // 内边框
    this.add.rectangle(w/2, 60, w - 40, 2, 0x00ff88, 0.3).setDepth(10)
    this.add.rectangle(w/2, h - 60, w - 40, 2, 0x00ff88, 0.3).setDepth(10)
    this.add.rectangle(60, h/2, 2, h - 40, 0x00ff88, 0.3).setDepth(10)
    this.add.rectangle(w - 60, h/2, 2, h - 40, 0x00ff88, 0.3).setDepth(10)
    
    // 角落装饰
    const corners = [
      { x: 40, y: 80 }, { x: w - 40, y: 80 },
      { x: 40, y: h - 80 }, { x: w - 40, y: h - 80 }
    ]
    
    corners.forEach((pos, i) => {
      // 三角形装饰
      const tri1 = this.add.triangle(pos.x, pos.y, 0, -20, -15, 15, 15, 15, 0x00ff88, 0.4)
      const tri2 = this.add.triangle(pos.x, pos.y, 0, 20, -15, -15, 15, -15, 0x00ffff, 0.3)
      tri1.setDepth(10)
      tri2.setDepth(10)
      
      this.tweens.add({
        targets: [tri1, tri2],
        alpha: 0.1,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 1200 + i * 200,
        yoyo: true,
        repeat: -1
      })
    })
  }

  createUI() {
    const sw = CONFIG.SCREEN_WIDTH
    const sh = CONFIG.SCREEN_HEIGHT
    
    // === 顶部状态栏背景 ===
    const topBg = this.add.rectangle(sw/2, 28, sw - 20, 56, 0x0d1117, 0.98)
    topBg.setDepth(100).setScrollFactor(0)
    topBg.setStrokeStyle(1, 0x30363d, 1)
    
    // 顶部渐变光条
    const topLine = this.add.rectangle(sw/2, 0, sw, 3, 0x238636, 1)
    topLine.setDepth(100).setScrollFactor(0)

    // === 第一行：核心状态 ===
    const row1Y = 16
    
    // 💰 金币 - 卡片式
    this.createStatCard(50, row1Y, 90, 28, 0x1a1a2e, 0xffd700)
    this.add.text(25, row1Y, '💵', { fontSize: '14px' }).setOrigin(0.5).setDepth(103).setScrollFactor(0)
    this.coinText = this.add.text(65, row1Y, '0', {
      fontSize: '16px', fill: '#ffd700', fontStyle: 'bold', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // ❤️ HP条
    const hpX = 160
    this.createStatCard(hpX, row1Y, 120, 28, 0x1a1a2e, 0x3fb950)
    this.add.text(hpX - 45, row1Y, 'HP', { fontSize: '11px', fill: '#3fb950', fontStyle: 'bold' }).setOrigin(0.5).setDepth(103).setScrollFactor(0)
    this.healthBar = this.add.rectangle(hpX - 5, row1Y, 85, 14, 0x3fb950, 0.9).setDepth(101).setScrollFactor(0)
    this.healthText = this.add.text(hpX - 5, row1Y, '100', { fontSize: '10px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // ⚡ 能量条
    const enX = 305
    this.createStatCard(enX, row1Y, 100, 28, 0x1a1a2e, 0x58a6ff)
    this.add.text(enX - 38, row1Y, 'EN', { fontSize: '11px', fill: '#58a6ff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(103).setScrollFactor(0)
    this.energyBar = this.add.rectangle(enX, row1Y, 70, 14, 0x58a6ff, 0.9).setDepth(101).setScrollFactor(0)
    this.energyText = this.add.text(enX, row1Y, '100', { fontSize: '10px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // ⛏️ 矿机数量
    const minerX = 430
    this.createStatCard(minerX, row1Y, 70, 28, 0x1a1a2e, 0xf08830)
    this.add.text(minerX - 20, row1Y, '⛏️', { fontSize: '14px' }).setOrigin(0.5).setDepth(103).setScrollFactor(0)
    this.minerText = this.add.text(minerX + 8, row1Y, '0', {
      fontSize: '14px', fill: '#f08830', fontStyle: 'bold', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // 🏆 波次
    this.createStatCard(530, row1Y, 90, 28, 0x1a1a2e, 0xbc8cff)
    this.waveText = this.add.text(530, row1Y, 'WAVE 1', {
      fontSize: '13px', fill: '#bc8cff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // 🔥 COMBO
    this.createStatCard(635, row1Y, 80, 28, 0x1a1a2e, 0xff6b35)
    this.comboText = this.add.text(635, row1Y, '0x', {
      fontSize: '14px', fill: '#ff6b35', fontStyle: 'bold', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // 👾 敌人数量
    this.createStatCard(735, row1Y, 85, 28, 0x1a1a2e, 0xff7b72)
    this.enemyInfoText = this.add.text(735, row1Y, '0', {
      fontSize: '14px', fill: '#ff7b72', fontStyle: 'bold', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0)
    this.add.text(695, row1Y, '👾', { fontSize: '14px' }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // === 第二行：市场与状态 ===
    const row2Y = 44

    // 📊 市场状态
    this.createStatCard(75, row2Y, 100, 24, 0x1a1a2e, 0x3fb950)
    this.marketText = this.add.text(75, row2Y, '📈 牛市', {
      fontSize: '12px', fill: '#3fb950', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // 🔥 FOMO
    this.createStatCard(205, row2Y, 90, 24, 0x1a1a2e, 0xff6b35)
    this.fomoText = this.add.text(205, row2Y, 'FOMO: -', {
      fontSize: '11px', fill: '#ff6b35', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // ⚡ 随机事件
    this.createStatCard(320, row2Y, 100, 24, 0x1a1a2e, 0x79c0ff)
    this.eventText = this.add.text(320, row2Y, '✓ 无事件', {
      fontSize: '11px', fill: '#79c0ff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // 📦 空投
    this.createStatCard(450, row2Y, 80, 24, 0x1a1a2e, 0xd2a8ff)
    this.airDropText = this.add.text(450, row2Y, '📦 -', {
      fontSize: '11px', fill: '#d2a8ff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // 🎯 武器升级
    this.createStatCard(565, row2Y, 120, 24, 0x1a1a2e, 0x7ee787)
    this.weaponText = this.add.text(565, row2Y, 'Q: Lv.1', {
      fontSize: '11px', fill: '#7ee787', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // 升级价格
    this.createStatCard(695, row2Y, 100, 24, 0x1a1a2e, 0xffd700)
    this.upgradeCostText = this.add.text(695, row2Y, '💎 80$', {
      fontSize: '11px', fill: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // E:矿机
    this.createStatCard(805, row2Y, 80, 24, 0x1a1a2e, 0xf08830)
    this.add.text(805, row2Y, 'E: 矿机', {
      fontSize: '11px', fill: '#f08830', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0)

    // === 底部控制提示 ===
    const bottomY = sh - 18
    this.add.text(sw/2, bottomY, 'WASD/方向键移动 | 空格射击 | Q升级武器 | E放置矿机 | P暂停', {
      fontSize: '11px', fill: '#6e7681', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0)
  }

  // 创建统一风格的统计卡片
  createStatCard(x, y, w, h, bgColor, borderColor) {
    const card = this.add.rectangle(x, y, w, h, bgColor, 1)
    card.setDepth(100).setScrollFactor(0).setStrokeStyle(1, borderColor, 0.6)
    return card
  }

  createGroups() {
    this.enemies = this.add.group()
    this.projectiles = this.add.group()
    this.coins = this.add.group()
    this.miners = this.add.group()
    this.minerProjectiles = this.add.group()  // 矿机子弹
  }

  startTimers() {
    // 能量恢复
    this.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.state.energy < CONFIG.PLAYER.ENERGY_MAX) {
          this.state.energy = Math.min(CONFIG.PLAYER.ENERGY_MAX, this.state.energy + CONFIG.PLAYER.ENERGY_REGEN / 10)
          this.energyBar.scaleX = this.state.energy / CONFIG.PLAYER.ENERGY_MAX
        }
      },
      callbackScope: this,
      loop: true
    })

    // COMBO检查
    this.time.addEvent({
      delay: 500,
      callback: this.checkComboTimeout,
      callbackScope: this,
      loop: true
    })

    // 牛熊切换
    this.time.addEvent({
      delay: CONFIG.BULL_BEAR.INTERVAL,
      callback: this.toggleMarket,
      callbackScope: this,
      loop: true
    })

    // 敌人生成
    this.time.addEvent({
      delay: CONFIG.WAVE.SPAWN_INTERVAL,
      callback: this.spawnWave,
      callbackScope: this,
      loop: true
    })

    // 空投生成 - 频繁掉落
    this.time.addEvent({
      delay: 5000,
      callback: this.spawnAirDrop,
      callbackScope: this,
      loop: true
    })

    // 随机事件生成
    this.time.addEvent({
      delay: 12000,
      callback: this.trySpawnRandomEvent,
      callbackScope: this,
      loop: true
    })
  }

  toggleMarket() {
    if (this.state.isGameOver) return
    
    this.state.bullMarket = !this.state.bullMarket
    
    if (this.state.bullMarket) {
      this.marketText.setText('BULL').setColor('#00ff88')
    } else {
      this.marketText.setText('BEAR').setColor('#ff4444')
    }
  }

  spawnWave() {
    if (this.state.isGameOver) return
    
    const count = CONFIG.WAVE.BASE_ENEMIES + this.state.wave * CONFIG.WAVE.ENEMIES_PER_WAVE
    
    // 限制每波敌人数量的上限，避免性能问题
    const maxEnemies = Math.min(count, 15)
    
    for (let i = 0; i < maxEnemies; i++) {
      this.time.delayedCall(i * 400, () => {
        if (!this.state.isGameOver) this.spawnEnemy()
      })
    }
    
    this.waveText.setText(`WAVE ${this.state.wave}`)
  }

  spawnEnemy() {
    // 限制全局敌人数量，避免卡顿
    if (this.enemies.getChildren().length >= 30) {
      return
    }

    // 根据波次和矿机数量选择敌人类型
    let config
    const roll = Math.random()
    
    // BOSS敌人：高波次出现
    if (this.state.wave >= CONFIG.ENEMY.BOSS.SPAWN_WAVE && roll > 0.95) {
      config = CONFIG.ENEMY.BOSS
    }
    // 黑客敌人：矿机>=10台时出现
    else if (this.state.minerCount >= CONFIG.ENEMY.HACKER.MIN_MINERS && roll > 0.88) {
      config = CONFIG.ENEMY.HACKER
    }
    // 幽灵敌人：可穿墙
    else if (this.state.wave >= CONFIG.ENEMY.GHOST.SPAWN_WAVE && roll > 0.90) {
      config = CONFIG.ENEMY.GHOST
    }
    // 自爆敌人
    else if (this.state.wave >= CONFIG.ENEMY.BOMBER.SPAWN_WAVE && roll > 0.85) {
      config = CONFIG.ENEMY.BOMBER
    }
    // 闪电攻击者
    else if (this.state.wave >= CONFIG.ENEMY.LIGHTNING.SPAWN_WAVE && roll > 0.80) {
      config = CONFIG.ENEMY.LIGHTNING
    }
    // 审计员：冻结玩家技能
    else if (this.state.wave >= CONFIG.ENEMY.AUDITOR.SPAWN_WAVE && roll > 0.87) {
      config = CONFIG.ENEMY.AUDITOR
    }
    // 迷雾隐身敌人
    else if (this.state.wave >= CONFIG.ENEMY.MIST.SPAWN_WAVE && roll > 0.75) {
      config = CONFIG.ENEMY.MIST
    }
    // 配送员 - 偷金币
    else if (this.state.wave >= CONFIG.ENEMY.DELIVERY.SPAWN_WAVE && roll > 0.78) {
      config = CONFIG.ENEMY.DELIVERY
    }
    // DEFI能量吸取
    else if (this.state.wave >= CONFIG.ENEMY.DEFI.SPAWN_WAVE && roll > 0.72) {
      config = CONFIG.ENEMY.DEFI
    }
    // NFT分裂
    else if (this.state.wave >= CONFIG.ENEMY.NFT.SPAWN_WAVE && roll > 0.68) {
      config = CONFIG.ENEMY.NFT
    }
    // SVIP
    else if (this.state.wave >= CONFIG.ENEMY.SVIP.SPAWN_WAVE && roll > 0.60) {
      config = CONFIG.ENEMY.SVIP
    }
    // 传销者
    else if (this.state.wave >= CONFIG.ENEMY.Pyramid.SPAWN_WAVE && roll > 0.55) {
      config = CONFIG.ENEMY.Pyramid
    }
    // 鲸鱼
    else if (this.state.wave >= CONFIG.ENEMY.WHALE.SPAWN_WAVE && roll > 0.70) {
      config = CONFIG.ENEMY.WHALE
    }
    // 矿工
    else if (this.state.wave >= CONFIG.ENEMY.MINER.SPAWN_WAVE && roll > 0.50) {
      config = CONFIG.ENEMY.MINER
    }
    // KOL
    else if (roll > 0.3) {
      config = CONFIG.ENEMY.KOL
    }
    // 韭菜
    else {
      config = CONFIG.ENEMY.TRADER
    }
    
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    const side = Phaser.Math.Between(0, 3)
    let x = -30, y = -30
    
    switch (side) {
      case 0: x = Phaser.Math.Between(50, w - 50); y = -30; break
      case 1: x = w + 30; y = Phaser.Math.Between(100, h - 100); break
      case 2: x = Phaser.Math.Between(50, w - 50); y = h + 30; break
      case 3: x = -30; y = Phaser.Math.Between(100, h - 100); break
    }

    const enemy = this.add.container(x, y)
    
    // 根据敌人类型使用不同的造型
    if (config === CONFIG.ENEMY.TRADER) {
      // 韭菜：独特的钱包形状，绿色渐变
      const walletBody = this.add.rectangle(0, 0, config.SIZE, config.SIZE * 0.8, 0x90ee90)
      walletBody.setStrokeStyle(2, 0x66cc66)
      enemy.add(walletBody)
      
      // 韭菜的"伤心眼睛"
      const eye1 = this.add.rectangle(-4, -2, 3, 3, 0xff6666)
      const eye2 = this.add.rectangle(4, -2, 3, 3, 0xff6666)
      enemy.add(eye1)
      enemy.add(eye2)
      
      // 标签
      const text = this.add.text(0, 5, '韭', {
        fontSize: '10px', fill: '#228822', fontStyle: 'bold'
      }).setOrigin(0.5)
      enemy.add(text)
      
      // 上下晃动的动画
      this.tweens.add({
        targets: enemy,
        y: enemy.y + 3,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
      
    } else if (config === CONFIG.ENEMY.KOL) {
      // KOL：麦克风造型
      const body = this.add.rectangle(0, 0, config.SIZE * 0.7, config.SIZE, 0xff69b4)
      body.setStrokeStyle(2, 0xffffff)
      enemy.add(body)
      
      const mic = this.add.circle(0, -5, 6, 0x333333)
      enemy.add(mic)
      
      const text = this.add.text(0, 6, 'KOL', {
        fontSize: '8px', fill: '#fff', fontStyle: 'bold'
      }).setOrigin(0.5)
      enemy.add(text)
      
    } else if (config === CONFIG.ENEMY.WHALE) {
      // 鲸鱼：大圆形
      const body = this.add.circle(0, 0, config.SIZE / 2, config.COLOR)
      body.setStrokeStyle(3, 0xffd700)
      enemy.add(body)
      
      const text = this.add.text(0, 0, '鲸', {
        fontSize: '14px', fill: '#fff', fontStyle: 'bold'
      }).setOrigin(0.5)
      enemy.add(text)
      
    } else if (config === CONFIG.ENEMY.MINER) {
      // 矿工：方形齿轮
      const body = this.add.rectangle(0, 0, config.SIZE, config.SIZE, config.COLOR)
      body.setStrokeStyle(2, 0xffcc00)
      enemy.add(body)
      
      const gear = this.add.text(0, 0, '⚙', { fontSize: '14px' }).setOrigin(0.5)
      enemy.add(gear)
      
      this.tweens.add({
        targets: gear,
        angle: 360,
        duration: 2000,
        repeat: -1
      })
      
    } else if (config === CONFIG.ENEMY.HACKER) {
      // 黑客：三角形危险造型
      const body = this.add.triangle(0, 5, 0, -15, -18, 15, 18, 15, config.COLOR)
      body.setStrokeStyle(2, 0xff8888)
      enemy.add(body)
      
      const skull = this.add.text(0, 3, '☠', { fontSize: '12px' }).setOrigin(0.5)
      enemy.add(skull)
      
      // 闪烁效果
      this.tweens.add({
        targets: enemy,
        alpha: 0.7,
        duration: 200,
        yoyo: true,
        repeat: -1
      })
      
    } else if (config === CONFIG.ENEMY.BOSS) {
      // BOSS：矿霸 - 巨大圆形带皇冠
      const body = this.add.circle(0, 0, config.SIZE / 2, config.COLOR)
      body.setStrokeStyle(4, 0xffd700)
      enemy.add(body)
      
      // 皇冠
      const crown = this.add.text(0, -config.SIZE/2 - 5, '👑', { fontSize: '18px' }).setOrigin(0.5)
      enemy.add(crown)
      
      const text = this.add.text(0, 0, 'BOSS', {
        fontSize: '14px', fill: '#ffd700', fontStyle: 'bold'
      }).setOrigin(0.5)
      enemy.add(text)
      
      // 威慑动画
      this.tweens.add({
        targets: enemy,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1
      })
      
    } else if (config === CONFIG.ENEMY.GHOST) {
      // 幽灵：半透明飘渺造型
      const body = this.add.circle(0, 0, config.SIZE / 2, config.COLOR, 0.5)
      body.setStrokeStyle(2, 0xffffff)
      enemy.add(body)
      
      const text = this.add.text(0, 0, '👻', { fontSize: '14px' }).setOrigin(0.5)
      enemy.add(text)
      
      // 飘渺动画
      this.tweens.add({
        targets: enemy,
        y: enemy.y - 5,
        alpha: 0.6,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
      
    } else if (config === CONFIG.ENEMY.BOMBER) {
      // 自爆兵：炸弹造型
      const body = this.add.circle(0, 0, config.SIZE / 2, config.COLOR)
      body.setStrokeStyle(2, 0xffff00)
      enemy.add(body)
      
      const fuse = this.add.text(0, -5, '💣', { fontSize: '12px' }).setOrigin(0.5)
      enemy.add(fuse)
      
      // 危险闪烁
      this.tweens.add({
        targets: enemy,
        alpha: 0.5,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
        yoyo: true,
        repeat: -1
      })
      
    } else if (config === CONFIG.ENEMY.LIGHTNING) {
      // 闪电攻击者：电光造型
      const body = this.add.rectangle(0, 0, config.SIZE, config.SIZE, config.COLOR)
      body.setStrokeStyle(2, 0xffffff)
      enemy.add(body)
      
      const bolt = this.add.text(0, 0, '⚡', { fontSize: '14px' }).setOrigin(0.5)
      enemy.add(bolt)
      
      // 电光闪烁
      this.tweens.add({
        targets: enemy,
        alpha: 0.7,
        duration: 100,
        yoyo: true,
        repeat: -1
      })
      
    } else if (config === CONFIG.ENEMY.AUDITOR) {
      // 审计员：冻结玩家技能 - 天平造型
      const body = this.add.polygon(0, 0, [0, -config.SIZE/2, config.SIZE/2, config.SIZE/3, -config.SIZE/2, config.SIZE/3], config.COLOR)
      body.setStrokeStyle(2, 0xffffff)
      enemy.add(body)
      
      // 天平图标
      const scale = this.add.text(0, -2, '⚖️', { fontSize: '16px' }).setOrigin(0.5)
      enemy.add(scale)
      
      // 审计眼睛闪烁
      this.tweens.add({
        targets: enemy,
        alpha: 0.8,
        duration: 500,
        yoyo: true,
        repeat: -1
      })
      
      // 审计冷却计时器
      enemy.freezeCooldown = 0
      
    } else if (config === CONFIG.ENEMY.MIST) {
      // 迷雾：隐身效果
      const body = this.add.circle(0, 0, config.SIZE / 2, config.COLOR, 0.3)
      body.setStrokeStyle(2, 0x9966ff)
      enemy.add(body)
      
      const mist = this.add.text(0, 0, '💨', { fontSize: '14px' }).setOrigin(0.5)
      enemy.add(mist)
      
      // 雾气飘动
      this.tweens.add({
        targets: enemy,
        x: enemy.x + 5,
        alpha: 0.2,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
      
    } else if (config === CONFIG.ENEMY.DELIVERY) {
      // 配送员：黄色骑手造型
      const body = this.add.rectangle(0, 0, config.SIZE, config.SIZE * 1.2, config.COLOR)
      body.setStrokeStyle(2, 0xff8800)
      enemy.add(body)
      
      const icon = this.add.text(0, 0, '📦', { fontSize: '12px' }).setOrigin(0.5)
      enemy.add(icon)
      
      // 快速移动动画
      this.tweens.add({
        targets: enemy,
        rotation: Math.PI * 2,
        duration: 1000,
        repeat: -1,
        ease: 'Linear'
      })
      
      enemy.stealCooldown = 0
      
    } else if (config === CONFIG.ENEMY.SVIP) {
      // SVIP：金色VIP造型，有护盾
      const body = this.add.star(0, 0, 5, config.SIZE * 0.4, config.SIZE * 0.7, config.COLOR)
      body.setStrokeStyle(3, 0xffffff)
      enemy.add(body)
      
      const icon = this.add.text(0, 0, '👑', { fontSize: '16px' }).setOrigin(0.5)
      enemy.add(icon)
      
      // 金色光环
      const glow = this.add.circle(0, 0, config.SIZE * 0.9, config.COLOR, 0.3)
      enemy.addAt(glow, 0)
      
      this.tweens.add({
        targets: glow,
        scaleX: 1.2,
        scaleY: 1.2,
        alpha: 0.1,
        duration: 600,
        yoyo: true,
        repeat: -1
      })
      
      enemy.shield = config.SHIELD
      enemy.shieldActive = true
      
    } else if (config === CONFIG.ENEMY.NFT) {
      // NFT：彩色方块造型
      const body = this.add.rectangle(0, 0, config.SIZE, config.SIZE, config.COLOR)
      body.setStrokeStyle(2, 0xffffff)
      enemy.add(body)
      
      const icon = this.add.text(0, 0, '#', {
        fontSize: '14px', fill: '#000', fontStyle: 'bold'
      }).setOrigin(0.5)
      enemy.add(icon)
      
      // 炫彩动画
      this.tweens.add({
        targets: body,
        tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00],
        duration: 500,
        yoyo: true,
        repeat: -1
      })
      
    } else if (config === CONFIG.ENEMY.DEFI) {
      // DEFI：紫色DeFi协议造型
      const body = this.add.circle(0, 0, config.SIZE / 2, config.COLOR)
      body.setStrokeStyle(2, 0xffffff)
      enemy.add(body)
      
      const icon = this.add.text(0, 0, '📊', { fontSize: '14px' }).setOrigin(0.5)
      enemy.add(icon)
      
      // 吸收光环
      const aura = this.add.circle(0, 0, config.DRAIN_RANGE, config.COLOR, 0.1)
      aura.setStrokeStyle(1, config.COLOR, 0.3)
      enemy.addAt(aura, 0)
      
      enemy.drainCooldown = 0
      
    } else if (config === CONFIG.ENEMY.Pyramid) {
      // 传销者：红色金字塔造型
      const body = this.add.triangle(0, 5, 0, -config.SIZE/2, config.SIZE/2, config.SIZE/2, -config.SIZE/2, config.SIZE/2, config.COLOR)
      body.setStrokeStyle(2, 0xffffff)
      enemy.add(body)
      
      const icon = this.add.text(0, -3, '🏛️', { fontSize: '14px' }).setOrigin(0.5)
      enemy.add(icon)
      
      // 吸引光环
      const aura = this.add.circle(0, 0, config.AURA_RANGE, config.COLOR, 0.1)
      aura.setStrokeStyle(1, config.COLOR, 0.3)
      enemy.addAt(aura, 0)
      
      // 光环脉动
      this.tweens.add({
        targets: aura,
        scaleX: 1.1,
        scaleY: 1.1,
        alpha: 0.2,
        duration: 800,
        yoyo: true,
        repeat: -1
      })
      
    } else {
      // 默认方形
      const body = this.add.rectangle(0, 0, config.SIZE, config.SIZE, config.COLOR)
      body.setStrokeStyle(2, 0xffffff)
      enemy.add(body)
      
      const text = this.add.text(0, 0, '敌', {
        fontSize: '10px', fill: '#fff', fontStyle: 'bold'
      }).setOrigin(0.5)
      enemy.add(text)
    }
    
    enemy.config = config
    enemy.health = config.HEALTH
    enemy.attackCooldown = 0
    enemy.setDepth(30) // 敌人在玩家(50)之下，背景效果(0.1-2)之上

    this.enemies.add(enemy)
  }

  update(time, delta) {
    // 防止卡死的保护措施
    try {
      // 安全检查：确保player存在
      if (!this.player || !this.player.active) return

      // R键重开（游戏结束时）
      if (this.state.isGameOver) {
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R))) {
          this.scene.restart()
        }
        return
      }

      // 安全检查：如果没有任何按键被按下但状态显示有按键，强制重置
      const anyKeyPressed = this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)) ||
                           this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)) ||
                           this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP)) ||
                           this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)) ||
                           this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)) ||
                           this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)) ||
                           this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)) ||
                           this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D))
      
      // 如果没有任何物理按键按下但this.keys显示有按键，重置
      if (!anyKeyPressed && (this.keys.left || this.keys.right || this.keys.up || this.keys.down)) {
        // 检查按键状态持续时间
        if (!this.keyStuckTime) this.keyStuckTime = 0
        this.keyStuckTime += delta
        if (this.keyStuckTime > 100) { // 超过100ms没有物理按键输入
          this.keys.left = false
          this.keys.right = false
          this.keys.up = false
          this.keys.down = false
          this.keyStuckTime = 0
        }
      } else {
        this.keyStuckTime = 0
      }

      // 移动 - 使用手动按键状态追踪
      const speed = CONFIG.PLAYER.SPEED * delta / 1000
      let vx = 0, vy = 0

      // 使用手动追踪的按键状态
      if (this.keys.left) {
        vx = -speed
      } else if (this.keys.right) {
        vx = speed
      }

      if (this.keys.up) {
        vy = -speed
      } else if (this.keys.down) {
        vy = speed
      }

      // 对角线移动速度归一化
      if (vx !== 0 && vy !== 0) {
        const norm = Math.sqrt(2)
        vx /= norm
        vy /= norm
      }

      // 安全移动，防止越界
      let newX = this.player.x + vx
      let newY = this.player.y + vy
      newX = Math.max(25, Math.min(CONFIG.GAME_WIDTH - 25, newX))
      newY = Math.max(75, Math.min(CONFIG.GAME_HEIGHT - 25, newY))
      this.player.x = newX
      this.player.y = newY

      // 自动瞄准：朝敌人最密集方向
      this.updateAimAngle(delta)
    
    // 检测冻结状态
    if (this.state.frozen) {
      if (Date.now() > this.state.frozenUntil) {
        this.state.frozen = false
        this.showNotification('✅ 冻结解除!', '#00ff88')
      }
    }
    
    // 射击（冻结时不能射击）
    if (!this.state.frozen && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.shoot()
    }

    // 放置矿机（冻结时不能放置）
    if (!this.state.frozen && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (this.state.coins >= CONFIG.MINER.COST) {
        this.state.coins -= CONFIG.MINER.COST
        this.coinText.setText(String(this.state.coins))
        this.placeMiner()
      }
    }

    // 武器升级
    if (Phaser.Input.Keyboard.JustDown(this.qKey)) {
      this.upgradeWeapon()
    }

    // FOMO计时器
    this.state.noKillTimer += delta
    if (this.state.noKillTimer > 8000 && this.enemies.getChildren().length > 3) {
      this.state.noKillTimer = 0
      this.triggerFOMO()
    }
    
    // 更新FOMO状态显示
    const fomoTime = Math.max(0, 8 - this.state.noKillTimer / 1000)
    if (fomoTime > 5) {
      this.fomoText.setText(`🔥FOMO: ${fomoTime.toFixed(1)}s`).setColor('#ff0000')
    } else if (fomoTime > 2) {
      this.fomoText.setText(`⚠️FOMO: ${fomoTime.toFixed(1)}s`).setColor('#ff6600')
    } else {
      this.fomoText.setText(`FOMO: ${fomoTime.toFixed(1)}s`).setColor('#ffff00')
    }
    
    // 更新市场事件状态
    if (this.state.randomEvents.length > 0) {
      const activeEvent = this.state.randomEvents[0]
      if (activeEvent.type === 'LIGHTNING_STORM') {
        this.eventText.setText(`⚡⚡⚡雷暴`).setColor('#ffff00')
      } else if (activeEvent.type === 'POISON_ZONE') {
        this.eventText.setText(`☠️毒雾区域`).setColor('#9933ff')
      } else if (activeEvent.type === 'FIRE_CIRCLE') {
        this.eventText.setText(`🔥🔥火焰阵`).setColor('#ff4400')
      } else if (activeEvent.type === 'ENERGY_DRAIN') {
        this.eventText.setText(`💀能量吸取`).setColor('#ff0088')
      } else if (activeEvent.type === 'COIN_RAIN') {
        this.eventText.setText(`💰💰金币雨`).setColor('#ffd700')
      }
    } else {
      this.eventText.setText('✓ 无事件').setColor('#00ff88')
    }
    
    // 更新敌人数量和图鉴
    const enemyCount = this.enemies.getChildren().length
    this.enemyInfoText.setText(`👾 敌人: ${enemyCount}`)
    
    // 矿机被动金币收入
    const minerCount = this.miners.getChildren().length
    if (minerCount > 0 && !this.state.isGameOver) {
      if (!this.minerIncomeTimer) this.minerIncomeTimer = 0
      this.minerIncomeTimer += delta
      if (this.minerIncomeTimer >= 1000) { // 每秒结算一次
        this.minerIncomeTimer = 0
        const incomeRate = CONFIG.MINER.INCOME_RATE * minerCount
        const mult = this.state.bullMarket ? 3 : 1
        const income = Math.floor(incomeRate * mult)
        this.state.coins += income
        this.coinText.setText(String(this.state.coins))
        // 检查NPC交易所
        this.checkNPCEncounter()
      }
    }
    
    // 追踪出现的敌人类型
    if (this.state.seenEnemyTypes instanceof Set) {
      this.enemies.getChildren().forEach(enemy => {
        if (enemy.config) {
          this.state.seenEnemyTypes.add(enemy.config)
        }
      })
    }
    
    // 显示已遭遇的敌人类型（最多显示4个图标）
    const enemyIcons = []
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.TRADER)) enemyIcons.push('🌱')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.KOL)) enemyIcons.push('🎤')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.WHALE)) enemyIcons.push('🐋')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.MINER)) enemyIcons.push('⛏️')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.HACKER)) enemyIcons.push('💻')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.BOSS)) enemyIcons.push('👹')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.GHOST)) enemyIcons.push('👻')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.BOMBER)) enemyIcons.push('💣')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.LIGHTNING)) enemyIcons.push('⚡')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.AUDITOR)) enemyIcons.push('⚖️')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.MIST)) enemyIcons.push('💨')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.DELIVERY)) enemyIcons.push('📦')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.DEFI)) enemyIcons.push('📊')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.NFT)) enemyIcons.push('💎')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.SVIP)) enemyIcons.push('👑')
    if (this.state.seenEnemyTypes.has(CONFIG.ENEMY.Pyramid)) enemyIcons.push('🏛️')
    
    // 更新升级价格
    const level = this.state.weaponLevel
    if (level < CONFIG.WEAPON.UPGRADE_COST.length) {
      const cost = CONFIG.WEAPON.UPGRADE_COST[level]
      this.upgradeCostText.setText(`💎 升级: ${cost}$`)
    } else {
      this.upgradeCostText.setText('👑 满级!').setColor('#ffd700')
    }

    // 更新敌人
    // 先收集要处理的敌人和要爆炸的炸弹
    const toExplode = []
    this.enemies.getChildren().forEach(enemy => {
      let targetX = this.player.x
      let targetY = this.player.y
      
      // 黑客敌人优先攻击矿机
      if (enemy.config === CONFIG.ENEMY.HACKER) {
        let closestMiner = null
        let minDist = 500  // 最大搜索范围
        this.miners.getChildren().forEach(miner => {
          const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, miner.x, miner.y)
          if (d < minDist) {
            minDist = d
            closestMiner = miner
          }
        })
        
        if (closestMiner) {
          targetX = closestMiner.x
          targetY = closestMiner.y
        }
      }
      
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY)
      // 传销者加速效果
      const speedMult = enemy.speedMultiplier || 1
      const moveSpeed = enemy.config.SPEED * speedMult * delta / 1000
      enemy.x += Math.cos(angle) * moveSpeed
      enemy.y += Math.sin(angle) * moveSpeed
      
      // 幽灵敌人穿墙
      if (enemy.config.PHASE) {
        if (enemy.x < 0) enemy.x = CONFIG.GAME_WIDTH
        if (enemy.x > CONFIG.GAME_WIDTH) enemy.x = 0
        if (enemy.y < 70) enemy.y = CONFIG.GAME_HEIGHT - 20
        if (enemy.y > CONFIG.GAME_HEIGHT - 20) enemy.y = 70
      }
      
      // 迷雾敌人隐身效果
      if (enemy.config.INVISIBLE && enemy.getAt(0)) {
        enemy.getAt(0).setAlpha(0.2)
      }
      
      // 自爆兵检测是否接近玩家（先收集，不在循环中销毁）
      if (enemy.config.EXPLOSION_DAMAGE) {
        const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y)
        if (distToPlayer < enemy.config.EXPLOSION_RADIUS) {
          toExplode.push(enemy)
        }
      }
      
      // 审计员：冻结玩家技能
      if (enemy.config === CONFIG.ENEMY.AUDITOR) {
        // 更新冷却计时器
        if (enemy.freezeCooldown > 0) {
          enemy.freezeCooldown -= delta
        }
        
        // 检测是否在冻结范围内且冷却完毕
        if (!this.state.frozen && enemy.freezeCooldown <= 0) {
          const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y)
          if (distToPlayer < enemy.config.FREEZE_RANGE) {
            // 冻结玩家！
            this.state.frozen = true
            this.state.frozenUntil = Date.now() + enemy.config.FREEZE_DURATION
            enemy.freezeCooldown = enemy.config.FREEZE_COOLDOWN
            
            // 冻结特效
            this.showFreezeEffect()
            this.showEventWarning('⚠️ 被审计! 技能冻结3秒!', '#8888ff')
          }
        }
      }
    })

    // 处理要爆炸的炸弹（在循环结束后处理，避免修改迭代中的数组）
    toExplode.forEach(bomber => {
      if (bomber.active) {
        this.bomberExplode(bomber)
      }
    })

    // 更新子弹
    const deadProjectiles = []
    this.projectiles.getChildren().forEach(proj => {
      proj.x += proj.vx * delta / 1000
      proj.y += proj.vy * delta / 1000
      proj.lifespan -= delta

      if (proj.lifespan <= 0 || proj.x < -20 || proj.x > CONFIG.GAME_WIDTH + 20 || proj.y < -20 || proj.y > CONFIG.GAME_HEIGHT + 20) {
        deadProjectiles.push(proj)
      }
    })
    deadProjectiles.forEach(p => {
      this.projectiles.remove(p)
      p.destroy()
    })

    // 矿机攻击 - 发射子弹
    this.miners.getChildren().forEach(miner => {
      miner.attackTimer -= delta
      if (miner.attackTimer <= 0) {
        miner.attackTimer = CONFIG.MINER.ATTACK_INTERVAL
        
        // 找到最近的敌人
        let closest = null
        let minDist = miner.range
        this.enemies.getChildren().forEach(e => {
          const d = Phaser.Math.Distance.Between(miner.x, miner.y, e.x, e.y)
          if (d < minDist) {
            minDist = d
            closest = e
          }
        })
        
        if (closest) {
          // 发射子弹
          const angle = Phaser.Math.Angle.Between(miner.x, miner.y, closest.x, closest.y)
          const proj = this.add.container(miner.x, miner.y)
          proj.setDepth(40) // 与玩家子弹同深度
          
          const bullet = this.add.rectangle(0, 0, 6, 6, 0xffaa00)
          bullet.setStrokeStyle(1, 0xffd700)
          proj.add(bullet)
          
          proj.vx = Math.cos(angle) * 300
          proj.vy = Math.sin(angle) * 300
          proj.damage = miner.damage
          proj.lifespan = 1500
          proj.fromMiner = true
          
          this.minerProjectiles.add(proj)
        }
      }
    })

    // 更新矿机子弹
    const deadMinerProj = []
    this.minerProjectiles.getChildren().forEach(proj => {
      proj.x += proj.vx * delta / 1000
      proj.y += proj.vy * delta / 1000
      proj.lifespan -= delta
      
      if (proj.lifespan <= 0 || proj.x < -20 || proj.x > CONFIG.GAME_WIDTH + 20 || proj.y < -20 || proj.y > CONFIG.GAME_HEIGHT + 20) {
        deadMinerProj.push(proj)
      }
    })
    deadMinerProj.forEach(p => {
      this.minerProjectiles.remove(p)
      p.destroy()
    })

    // 空投检测
    this.checkAirDrop()

    // 碰撞检测
    this.checkCollisions(delta)
    } catch (error) {
      console.error('Update error:', error)
    }
  }

  checkCollisions(delta) {
    // 玩家子弹vs敌人
    const projectilesToRemove = []
    const enemiesToKill = []
    this.projectiles.getChildren().forEach(proj => {
      let hit = false
      this.enemies.getChildren().forEach(enemy => {
        if (hit) return
        const dist = Phaser.Math.Distance.Between(proj.x, proj.y, enemy.x, enemy.y)
        if (dist < 15 + enemy.config.SIZE / 2) {
          hit = true
          const damage = (proj.damage || 10) + this.state.damageBoost
          
          // SVIP护盾处理
          if (enemy.config === CONFIG.ENEMY.SVIP && enemy.shieldActive && enemy.shield > 0) {
            enemy.shield -= damage
            // 护盾被攻击特效
            const shieldHit = this.add.circle(enemy.x, enemy.y, 25, 0xffd700, 0.5)
            this.tweens.add({
              targets: shieldHit,
              scaleX: 2,
              scaleY: 2,
              alpha: 0,
              duration: 200,
              onComplete: () => shieldHit.destroy()
            })
            
            if (enemy.shield <= 0) {
              enemy.shieldActive = false
              this.showNotification('👑 SVIP护盾破碎!', '#ff6600')
            }
          } else {
            enemy.health -= damage
          }
          
          // 命中特效
          this.tweens.add({
            targets: enemy,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: 50,
            yoyo: true
          })
          
          // 激光穿透，不销毁子弹
          if (!proj.isLaser) {
            projectilesToRemove.push(proj)
          }
          
          if (enemy.health <= 0) enemiesToKill.push({ enemy, fromProjectile: true })
        }
      })
    })
    
    // 移除非激光子弹
    projectilesToRemove.forEach(p => {
      this.projectiles.remove(p)
      p.destroy()
    })
    // 在循环外处理击杀
    enemiesToKill.forEach(item => {
      if (item.enemy.active) this.killEnemy(item.enemy, item.fromProjectile)
    })

    // 矿机子弹vs敌人
    const minersToRemove = []
    const minerEnemiesToKill = []
    this.minerProjectiles.getChildren().forEach(proj => {
      let hit = false
      this.enemies.getChildren().forEach(enemy => {
        if (hit) return
        const dist = Phaser.Math.Distance.Between(proj.x, proj.y, enemy.x, enemy.y)
        if (dist < 12 + enemy.config.SIZE / 2) {
          hit = true
          const damage = proj.damage || 5
          enemy.health -= damage
          
          this.tweens.add({
            targets: enemy,
            scaleX: 0.85,
            scaleY: 0.85,
            duration: 50,
            yoyo: true
          })
          
          minersToRemove.push(proj)
          
          if (enemy.health <= 0) minerEnemiesToKill.push(enemy)
        }
      })
    })
    // 在循环外处理删除和击杀
    minersToRemove.forEach(proj => {
      this.minerProjectiles.remove(proj)
      proj.destroy()
    })
    minerEnemiesToKill.forEach(enemy => {
      if (enemy.active) this.killEnemy(enemy)
    })

    // 敌人vs玩家
    if (!this.state.shieldActive) {
      this.enemies.getChildren().forEach(enemy => {
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, enemy.x, enemy.y
        )
        if (dist < this.player.hitRadius + enemy.config.SIZE / 2) {
          this.takeDamage(enemy.config.DAMAGE)
          
          // 击退
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y)
          enemy.x += Math.cos(angle) * 60
          enemy.y += Math.sin(angle) * 60
        }
      })
    }
    
    // 黑客敌人vs矿机 - 强化攻击能力
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.config !== CONFIG.ENEMY.HACKER) return
      
      // 黑客攻击冷却
      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown -= delta
        return
      }
      
      // 找到范围内所有矿机
      const nearbyMiners = []
      this.miners.getChildren().forEach(miner => {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, miner.x, miner.y)
        if (dist < enemy.config.ATTACK_RANGE * 2) {  // 扩大攻击范围
          nearbyMiners.push({ miner, dist })
        }
      })
      
      // 按距离排序
      nearbyMiners.sort((a, b) => a.dist - b.dist)
      
      // 黑客攻击1-5台矿机（根据范围内矿机数量）
      const targetCount = Math.min(nearbyMiners.length, Phaser.Math.Between(1, 5))
      
      if (targetCount > 0) {
        enemy.attackCooldown = 1500  // 1.5秒冷却
        
        // 显示黑客攻击特效
        this.showHackerAttackEffect(enemy)
        
        for (let i = 0; i < targetCount; i++) {
          const { miner } = nearbyMiners[i]
          
          // 造成大量伤害（50-100）
          const damage = Phaser.Math.Between(50, 100)
          miner.hp -= damage
          
          // 爆炸特效
          this.createExplosion(miner.x, miner.y)
          
          // 伤害数字
          const dmgText = this.add.text(miner.x, miner.y - 30, `-${damage}`, {
            fontSize: '16px',
            fill: '#ff0000',
            fontStyle: 'bold',
            stroke: '#fff',
            strokeThickness: 2
          }).setOrigin(0.5).setDepth(160)
          
          this.tweens.add({
            targets: dmgText,
            y: miner.y - 60,
            alpha: 0,
            duration: 800,
            onComplete: () => dmgText.destroy()
          })
          
          // 矿机被摧毁（大部分会直接爆掉）
          if (miner.hp <= 0) {
            this.destroyMiner(miner)
          }
        }
        
        // 黑客攻击提示
        this.showNotification(`⚠️ 黑客入侵! ${targetCount}台矿机被攻击!`, '#ff0000')
      }
    })
    
    // 配送员偷金币
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.config !== CONFIG.ENEMY.DELIVERY) return
      
      enemy.stealCooldown -= delta
      if (enemy.stealCooldown > 0) return
      
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y)
      if (dist < enemy.config.SIZE + 30) {
        const stolen = Math.min(this.state.coins, enemy.config.STEAL_AMOUNT)
        this.state.coins -= stolen
        this.coinText.setText(String(this.state.coins))
        enemy.stealCooldown = enemy.config.STEAL_COOLDOWN
        
        this.showNotification(`📦 被偷了${stolen}金币!`, '#ffc107')
        
        // 逃跑动画
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y)
        enemy.x += Math.cos(angle) * 100
        enemy.y += Math.sin(angle) * 100
      }
    })
    
    // SVIP护盾恢复
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.config !== CONFIG.ENEMY.SVIP) return
      
      if (!enemy.shieldActive || enemy.shield < enemy.config.SHIELD) {
        enemy.shield += enemy.config.SHIELD_REGEN * delta / 1000
        enemy.shield = Math.min(enemy.shield, enemy.config.SHIELD)
        
        // 更新护盾显示
        if (enemy.getAt(0)) {
          enemy.getAt(0).alpha = enemy.shield / enemy.config.SHIELD
        }
      }
    })
    
    // DEFI能量吸取
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.config !== CONFIG.ENEMY.DEFI) return
      
      enemy.drainCooldown -= delta
      if (enemy.drainCooldown > 0) return
      
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y)
      if (dist < enemy.config.DRAIN_RANGE) {
        this.state.energy = Math.max(0, this.state.energy - enemy.config.DRAIN_AMOUNT)
        this.energyBar.scaleX = this.state.energy / CONFIG.PLAYER.ENERGY_MAX
        enemy.drainCooldown = enemy.config.DRAIN_COOLDOWN
        
        this.showNotification(`📊 能量被吸取! -${enemy.config.DRAIN_AMOUNT}`, '#9966cc')
        
        // 吸取特效
        const line = this.add.line(0, 0, enemy.x, enemy.y, this.player.x, this.player.y, 0x9966cc, 0.6)
        line.setDepth(100)
        this.tweens.add({
          targets: line,
          alpha: 0,
          duration: 300,
          onComplete: () => line.destroy()
        })
      }
    })
    
    // 传销者：给周围敌人加速
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.config !== CONFIG.ENEMY.Pyramid) return
      
      // 为范围内的其他敌人增加速度
      this.enemies.getChildren().forEach(other => {
        if (other === enemy || other.boostedByPyramid) return
        
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, other.x, other.y)
        if (dist < enemy.config.AURA_RANGE) {
          other.boostedByPyramid = true
          other.speedMultiplier = enemy.config.SPEED_BOOST
          
          // 加速特效
          const boostCircle = this.add.circle(other.x, other.y, other.config.SIZE * 1.5, 0xff3366, 0.2)
          boostCircle.setDepth(90)
          this.tweens.add({
            targets: boostCircle,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => boostCircle.destroy()
          })
        }
      })
    })
  }
  
  showHackerAttackEffect(hacker) {
    // 黑客攻击时的视觉效果
    const circle = this.add.circle(hacker.x, hacker.y, 80, 0xff0000, 0.4)
    circle.setDepth(100)
    
    this.tweens.add({
      targets: circle,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 400,
      onComplete: () => circle.destroy()
    })
  }
  
  createExplosion(x, y) {
    // 爆炸粒子效果 - 限制数量防止卡顿
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i
      const particle = this.add.rectangle(x, y, 6, 6, 0xff6600)
      particle.setDepth(140)
      
      const dist = Phaser.Math.Between(20, 40)
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      })
    }
    
    // 中心闪光
    const flash = this.add.rectangle(x, y, 20, 20, 0xffff00)
    flash.setDepth(141)
    this.tweens.add({
      targets: flash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy()
    })
  }
  
  bomberExplode(bomber) {
    const cfg = bomber.config
    const x = bomber.x
    const y = bomber.y
    
    // 移除炸弹敌人
    this.enemies.remove(bomber)
    bomber.destroy()
    
    // 大爆炸特效
    const explosion = this.add.circle(x, y, cfg.EXPLOSION_RADIUS, 0xff6600, 0.5)
    explosion.setStrokeStyle(4, 0xffff00)
    explosion.setDepth(120)
    
    // 爆炸扩散动画
    this.tweens.add({
      targets: explosion,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => explosion.destroy()
    })
    
    // 对玩家造成伤害
    const dist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y)
    if (dist < cfg.EXPLOSION_RADIUS) {
      this.takeDamage(cfg.EXPLOSION_DAMAGE)
      this.showNotification(`炸弹! -${cfg.EXPLOSION_DAMAGE}HP`, '#ff6600')
    }
    
    // 对范围内敌人造成伤害（友军伤害）
    this.enemies.getChildren().forEach(enemy => {
      if (enemy === bomber) return
      const d = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y)
      if (d < cfg.EXPLOSION_RADIUS) {
        enemy.health -= cfg.EXPLOSION_DAMAGE * 0.5  // 对其他敌人造成一半伤害
        if (enemy.health <= 0) this.killEnemy(enemy)
      }
    })
    
    this.showEventWarning('💥 炸弹自爆!', '#ff6600')
    
    // 检查波次完成
    if (this.enemies.getChildren().length === 0) {
      this.completeWave()
    }
  }
  
  updateAimAngle(delta) {
    const enemies = this.enemies.getChildren()
    if (enemies.length === 0) return
    
    // 计算敌人密度最高的扇形方向
    const sectorCount = 8
    const sectorAngle = (Math.PI * 2) / sectorCount
    const sectorCounts = new Array(sectorCount).fill(0)
    const maxRange = 400  // 只计算范围内的敌人
    
    enemies.forEach(enemy => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y)
      if (dist < maxRange) {
        const angleToEnemy = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y)
        const normalizedAngle = angleToEnemy < 0 ? angleToEnemy + Math.PI * 2 : angleToEnemy
        const sector = Math.floor(normalizedAngle / sectorAngle) % sectorCount
        sectorCounts[sector]++
      }
    })
    
    // 找到敌人最多的方向
    let maxCount = 0
    let targetSector = 0
    sectorCounts.forEach((count, i) => {
      if (count > maxCount) {
        maxCount = count
        targetSector = i
      }
    })
    
    // 如果有敌人，渐变调整瞄准方向
    if (maxCount > 0) {
      const targetAngle = targetSector * sectorAngle + sectorAngle / 2
      
      // 角度插值（快速响应）
      let diff = targetAngle - this.state.aimAngle
      // 确保走最短路径
      if (diff > Math.PI) diff -= Math.PI * 2
      if (diff < -Math.PI) diff += Math.PI * 2
      
      this.state.aimAngle += diff * 0.3  // 快速追踪，值越大响应越快
    }
  }

  destroyMiner(miner) {
    // 停止所有与该矿机相关的 tweens
    this.tweens.killTweensOf(miner)
    miner.getAll().forEach(child => {
      if (child) this.tweens.killTweensOf(child)
    })
    
    this.miners.remove(miner)
    miner.destroy()
    this.state.minerCount--
    this.minerText.setText(`矿机: ${this.state.minerCount}`)
    this.minerText.setX(this.cameras.main.scrollX + CONFIG.SCREEN_WIDTH / 2)
    
    this.showNotification('矿机被摧毁!', '#ff0000')
  }

  shoot() {
    const weapon = CONFIG.WEAPON.LEVELS[this.state.weaponLevel]
    const now = this.time.now
    if (now - this.lastShotTime < weapon.cooldown) return
    if (this.state.energy < CONFIG.PLAYER.ATTACK_COST) return
    
    this.lastShotTime = now
    this.state.energy -= CONFIG.PLAYER.ATTACK_COST
    this.energyBar.scaleX = this.state.energy / CONFIG.PLAYER.ENERGY_MAX

    // 使用自动瞄准角度射击
    const baseAngle = this.state.aimAngle

    // 使用武器配置中的颜色
    const weaponColor = weapon.color || 0x00ffff
    
    // 散弹模式
    if (this.state.spreadShot) {
      const spreadCount = 5
      const spreadAngle = 0.3  // 散射角度
      for (let i = 0; i < spreadCount; i++) {
        const angle = baseAngle - spreadAngle * (spreadCount - 1) / 2 + spreadAngle * i
        this.createBullet(angle, weapon, weaponColor)
      }
    } 
    // 普通/激光模式
    else {
      this.createBullet(baseAngle, weapon, weaponColor)
    }
  }
  
  createBullet(angle, weapon, color) {
    const proj = this.add.container(this.player.x, this.player.y)
    
    // 激光模式用更长的子弹
    const isLaser = this.state.laserShot
    const weaponLevel = this.state.weaponLevel
    
    // 根据武器等级调整子弹大小
    const baseSize = 6 + weaponLevel * 2
    const bulletSize = isLaser ? baseSize + 10 : baseSize
    
    // 创建子弹发光效果
    const glow = this.add.circle(0, 0, bulletSize + 4, color, 0.3)
    proj.add(glow)
    
    // 子弹核心
    const bullet = this.add.rectangle(0, 0, bulletSize, isLaser ? bulletSize * 0.6 : bulletSize, color)
    bullet.setStrokeStyle(isLaser ? 2 : 1, isLaser ? 0xffffff : 0xffffff)
    proj.add(bullet)
    
    // 子弹尾部拖尾
    const trail = this.add.graphics()
    trail.lineStyle(3, color, 0.5)
    trail.lineBetween(-bulletSize * 2, 0, -bulletSize / 2, 0)
    proj.add(trail)
    
    // 高等级武器添加文字效果
    if (weaponLevel >= 5) {
      const text = this.add.text(0, 0, weapon.text || 'SELL', {
        fontSize: `${8 + weaponLevel}px`,
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 1
      }).setOrigin(0.5)
      proj.add(text)
    }
    
    proj.vx = Math.cos(angle) * weapon.speed * (isLaser ? 1.5 : 1)
    proj.vy = Math.sin(angle) * weapon.speed * (isLaser ? 1.5 : 1)
    proj.damage = weapon.damage * (isLaser ? 0.6 : 1)
    proj.lifespan = isLaser ? 1500 : 2000
    proj.isLaser = isLaser
    proj.weaponColor = color
    proj.glow = glow
    proj.setDepth(40) // 子弹在玩家(50)之下，敌人(30)之上

    // 子弹脉冲动画
    this.tweens.add({
      targets: [glow, bullet],
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true
    })

    this.projectiles.add(proj)
  }

  killEnemy(enemy, fromProjectile = false) {
    // NFT分裂逻辑
    if (enemy.config === CONFIG.ENEMY.NFT && fromProjectile) {
      this.spawnNFTMinions(enemy.x, enemy.y)
    }
    
    // 停止所有与该敌人相关的 tweens，防止内存泄漏
    this.tweens.killTweensOf(enemy)
    enemy.getAll().forEach(child => {
      if (child && child.tweenTarget) {
        this.tweens.killTweensOf(child)
      }
    })
    
    this.enemies.remove(enemy)
    enemy.destroy()

    // 重置FOMO计时器
    this.state.noKillTimer = 0
    
    // COMBO
    this.state.combo++
    this.state.lastKillTime = Date.now()
    this.comboText.setText(this.state.combo >= 2 ? `${this.state.combo}x` : '')

    // 金币 - 大幅提升倍率
    let value = enemy.config.COIN_VALUE
    // 全局金币倍率加成
    value = Math.floor(value * 2.5)
    
    // 牛市/熊市调整（提高熊市倍率）
    const mult = this.state.bullMarket ? 5 : 2
    value = Math.floor(value * mult)
    
    // 连杀加成（降低触发门槛，更容易获得高加成）
    let comboMult = 1
    if (this.state.combo >= 30) comboMult = 8
    else if (this.state.combo >= 20) comboMult = 5
    else if (this.state.combo >= 10) comboMult = 3
    else if (this.state.combo >= 5) comboMult = 2
    else if (this.state.combo >= 3) comboMult = 1.5

    value = Math.floor(value * comboMult)
    this.state.coins += value
    this.coinText.setText(String(this.state.coins))

    // 检查是否遇到NPC交易所
    this.checkNPCEncounter()

    // 飘字提示
    const coinText = this.add.text(enemy.x, enemy.y - 20, `+${value}`, {
      fontSize: '16px',
      fill: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(150)
    
    this.tweens.add({
      targets: coinText,
      y: enemy.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => coinText.destroy()
    })

    // 检查波次完成
    if (this.enemies.getChildren().length === 0) {
      this.completeWave()
    }
  }
  
  // NFT分裂生成小NFT
  spawnNFTMinions(x, y) {
    const config = CONFIG.ENEMY.NFT
    const count = config.SPLIT_COUNT || 2
    
    this.showNotification(`💎 NFT分裂!`, '#00ffcc')
    
    for (let i = 0; i < count; i++) {
      const offsetX = (i === 0 ? -1 : 1) * 30
      const offsetY = Phaser.Math.Between(-20, 20)
      
      const minion = this.add.container(x + offsetX, y + offsetY)
      const body = this.add.rectangle(0, 0, 16, 16, 0x00ffcc)
      body.setStrokeStyle(2, 0xffffff)
      minion.add(body)
      
      const text = this.add.text(0, 0, '#', {
        fontSize: '10px', fill: '#000', fontStyle: 'bold'
      }).setOrigin(0.5)
      minion.add(text)
      
      minion.config = {
        ...config,
        SIZE: 16,
        HEALTH: config.SPLIT_HEALTH,
        COIN_VALUE: 8
      }
      minion.health = config.SPLIT_HEALTH
      minion.attackCooldown = 0
      
      this.enemies.add(minion)
      
      // 分裂特效
      const splitFx = this.add.circle(offsetX, offsetY, 20, 0x00ffcc, 0.5)
      this.tweens.add({
        targets: splitFx,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 300,
        onComplete: () => splitFx.destroy()
      })
    }
  }

  completeWave() {
    this.state.wave++
    const bonus = CONFIG.WAVE.WAVE_CLEAR_BONUS * this.state.wave
    this.state.coins += bonus
    this.coinText.setText(String(this.state.coins))
    
    this.showNotification(`波次完成! +${bonus}金币`, '#00ff88')
  }

  checkComboTimeout() {
    if (this.state.combo > 0 && Date.now() - this.state.lastKillTime > CONFIG.COMBO.TIMEOUT) {
      if (this.state.combo >= 5) {
        const lost = Math.floor(this.state.coins * CONFIG.COMBO.DECAY_PENALTY)
        this.state.coins = Math.max(0, this.state.coins - lost)
        this.coinText.setText(String(this.state.coins))
        this.showNotification(`COMBO断! -${lost}`, '#ff4444')
      }
      this.state.combo = 0
      this.comboText.setText('')
    }
  }

  takeDamage(amount) {
    this.state.health -= amount
    const pct = Math.max(0, this.state.health / CONFIG.PLAYER.MAX_HEALTH)
    this.healthBar.scaleX = pct
    
    if (pct < 0.3) this.healthBar.setFillStyle(0xff0000)
    else if (pct < 0.6) this.healthBar.setFillStyle(0xffff00)

    // 屏幕闪红
    const flash = this.add.rectangle(CONFIG.SCREEN_WIDTH/2, CONFIG.SCREEN_HEIGHT/2, CONFIG.SCREEN_WIDTH, CONFIG.SCREEN_HEIGHT, 0xff0000, 0.3)
    flash.setDepth(200).setScrollFactor(0)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy()
    })

    if (this.state.health <= 0) {
      this.state.isGameOver = true
      this.gameOverCleanup()
      this.showGameOver()
    }
  }

  placeMiner() {
    const miner = this.add.container(this.player.x, this.player.y)
    miner.setDepth(25) // 矿机在敌人(30)之下
    
    const base = this.add.rectangle(0, 0, 35, 35, 0x666666)
    base.setStrokeStyle(3, 0xffd700)
    miner.add(base)
    
    const gear = this.add.text(0, 0, '⚙', { fontSize: '20px' }).setOrigin(0.5)
    miner.add(gear)

    miner.damage = CONFIG.MINER.DAMAGE
    miner.range = CONFIG.MINER.RANGE
    miner.attackTimer = 0
    miner.hp = 80  // 矿机生命值（容易被黑客摧毁）

    this.tweens.add({
      targets: gear,
      angle: 360,
      duration: 2000,
      repeat: -1
    })

    this.miners.add(miner)
    this.state.minerCount++
    this.minerText.setText(`矿机: ${this.state.minerCount}`)
    
    this.showNotification('矿机已放置!', '#ffaa00')
  }

  upgradeWeapon() {
    if (this.state.weaponLevel >= CONFIG.WEAPON.LEVELS.length - 1) {
      this.showNotification('武器已满级!', '#ffd700')
      return
    }
    
    const cost = CONFIG.WEAPON.UPGRADE_COST[this.state.weaponLevel]
    if (this.state.coins < cost) {
      this.showNotification(`金币不足! 需要 ${cost}`, '#ff4444')
      return
    }
    
    this.state.coins -= cost
    this.state.weaponLevel++
    this.coinText.setText(String(this.state.coins))
    
    const newWeapon = CONFIG.WEAPON.LEVELS[this.state.weaponLevel]
    // 武器等级对应的交易主题图标
    const weaponIcons = ['📊', '📈', '📉', '🚀', '💰', '🔪', '🐋', '🏆', '🪙', '👑']
    const weaponIcon = weaponIcons[this.state.weaponLevel] || '📊'
    this.weaponText.setText(`${weaponIcon} ${newWeapon.text} [Lv.${this.state.weaponLevel + 1}]`)
    
    // 根据武器等级显示不同颜色特效
    const colors = ['#90ee90', '#00ff88', '#00ffff', '#ffd700', '#ff6600', '#ff3366', '#9932cc', '#ff00ff', '#ffff00', '#ffffff']
    const upgradeColor = colors[this.state.weaponLevel] || '#00ffff'
    
    this.showNotification(`${newWeapon.text || '升级'}! 伤害+${newWeapon.damage}`, upgradeColor)
    
    // 炫酷升级特效
    // 1. 屏幕闪光
    const flash = this.add.rectangle(CONFIG.SCREEN_WIDTH/2, CONFIG.SCREEN_HEIGHT/2, CONFIG.SCREEN_WIDTH, CONFIG.SCREEN_HEIGHT, 0xffffff, 0.3)
    flash.setDepth(200).setScrollFactor(0)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy()
    })
    
    // 2. 武器名称大字显示
    const bigText = this.add.text(CONFIG.SCREEN_WIDTH/2, CONFIG.SCREEN_HEIGHT/2 - 50, newWeapon.text || 'UPGRADE!', {
      fontSize: '48px',
      fill: upgradeColor,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(201).setScrollFactor(0).setAlpha(0)
    
    this.tweens.add({
      targets: bigText,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: bigText,
          alpha: 0,
          y: CONFIG.SCREEN_HEIGHT/2 - 100,
          duration: 800,
          delay: 500,
          onComplete: () => bigText.destroy()
        })
      }
    })
    
    // 3. 武器升级光环效果
    const glowX = this.player.x
    const glowY = this.player.y
    const glowRing = this.add.circle(glowX, glowY, 30, 0xffffff, 0.6)
    glowRing.setDepth(150)
    
    this.tweens.add({
      targets: glowRing,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => glowRing.destroy()
    })
    
    // 4. 屏幕震动
    this.cameras.main.shake(200, 0.008)
  }

  triggerFOMO() {
    this.state.fomoWarnings++
    
    // 屏幕震动
    this.cameras.main.shake(200, 0.01)
    
    // 随机FOMO事件
    const events = [
      { text: '⚠️ 市场恐慌!', color: '#ff4444' },
      { text: '🚨 庄家砸盘!', color: '#ff6600' },
      { text: '💀 KOL跑路!', color: '#ff0000' },
      { text: '📉 币价暴跌!', color: '#ff4444' }
    ]
    
    const event = events[Phaser.Math.Between(0, events.length - 1)]
    this.showNotification(event.text, event.color)
    
    // 生成更多敌人 - 减少数量避免性能问题
    for (let i = 0; i < 2; i++) {
      this.time.delayedCall(i * 200, () => {
        if (!this.state.isGameOver) this.spawnEnemy()
      })
    }
  }

  // 随机事件系统
  trySpawnRandomEvent() {
    if (this.state.isGameOver) return
    if (Math.random() > 0.35) return

    const events = [
      { type: 'LIGHTNING_STORM', weight: 1 },
      { type: 'POISON_ZONE', weight: 1 },
      { type: 'FIRE_CIRCLE', weight: 1 },
      { type: 'ENERGY_DRAIN', weight: 1 },
      { type: 'COIN_RAIN', weight: 2 }
    ]

    // 权重随机选择
    const totalWeight = events.reduce((sum, e) => sum + e.weight, 0)
    let roll = Math.random() * totalWeight
    let selectedEvent = events[events.length - 1].type

    for (const event of events) {
      roll -= event.weight
      if (roll <= 0) {
        selectedEvent = event.type
        break
      }
    }

    switch (selectedEvent) {
      case 'LIGHTNING_STORM':
        this.triggerEventEffect('thunder')
        this.startLightningStorm()
        break
      case 'POISON_ZONE':
        this.triggerEventEffect('toxic')
        this.spawnPoisonZone()
        break
      case 'FIRE_CIRCLE':
        this.triggerEventEffect('fire')
        this.spawnFireCircle()
        break
      case 'ENERGY_DRAIN':
        this.triggerEventEffect('fomo')
        this.startEnergyDrain()
        break
      case 'COIN_RAIN':
        this.triggerEventEffect('gold')
        this.startCoinRain()
        break
    }
  }

  startLightningStorm() {
    const cfg = CONFIG.RANDOM_EVENTS.LIGHTNING_STORM
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    this.showEventWarning('⚡ 闪电风暴来袭!', '#ffff00')
    
    // 持续闪电攻击
    const strikeEvent = this.time.addEvent({
      delay: cfg.INTERVAL,
      callback: () => {
        if (this.state.isGameOver) {
          strikeEvent.remove()
          return
        }
        
        // 在玩家附近随机位置闪电
        const strikeX = this.player.x + Phaser.Math.Between(-200, 200)
        const strikeY = this.player.y + Phaser.Math.Between(-200, 200)
        
        this.createLightning(strikeX, strikeY)
        
        // 检测玩家是否在闪电范围内
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, strikeX, strikeY)
        if (dist < 100) {
          this.takeDamage(cfg.DAMAGE)
          this.showNotification(`闪电命中! -${cfg.DAMAGE}HP`, '#ffff00')
        }
      },
      repeat: Math.floor(cfg.DURATION / cfg.INTERVAL),
      callbackScope: this
    })

    // 事件结束时从 randomEvents 中移除（使用 delayedCall 替代不存在的 on() 方法）
    this.time.delayedCall(cfg.DURATION, () => {
      const index = this.state.randomEvents.indexOf(strikeEvent)
      if (index > -1) {
        this.state.randomEvents.splice(index, 1)
      }
    })
    
    this.state.randomEvents.push(strikeEvent)
  }

  createLightning(x, y) {
    // 创建闪电视觉效果
    const line = this.add.graphics()
    line.lineStyle(3, 0xffff00, 0.8)
    
    let lx = x
    let ly = 0
    while (ly < y) {
      const nx = lx + Phaser.Math.Between(-30, 30)
      const ny = Math.min(ly + Phaser.Math.Between(20, 40), y)
      line.lineBetween(lx, ly, nx, ny)
      lx = nx
      ly = ny
    }
    
    line.setDepth(150)
    
    // 闪电闪光
    const flash = this.add.circle(x, y, 40, 0xffff00, 0.5)
    flash.setDepth(149)
    
    this.tweens.add({
      targets: [line, flash],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        line.destroy()
        flash.destroy()
      }
    })
  }

  spawnPoisonZone() {
    const cfg = CONFIG.RANDOM_EVENTS.POISON_ZONE
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 在地图随机位置创建毒雾区
    const x = Phaser.Math.Between(100, w - 100)
    const y = Phaser.Math.Between(100, h - 100)
    
    this.showEventWarning('☠️ 毒雾区域出现!', '#9933ff')
    
    // 创建毒雾视觉效果
    const zone = this.add.container(x, y)
    const circle = this.add.circle(0, 0, cfg.RADIUS, 0x9933ff, 0.3)
    circle.setStrokeStyle(3, 0x9933ff, 0.6)
    zone.add(circle)
    zone.setDepth(50)
    
    // 毒雾动画
    this.tweens.add({
      targets: circle,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    })
    
    // 持续伤害计时器
    const damageEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.state.isGameOver) {
          damageEvent.remove()
          return
        }
        
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y)
        if (dist < cfg.RADIUS) {
          this.takeDamage(cfg.DAMAGE)
          this.showNotification(`毒雾! -${cfg.DAMAGE}HP`, '#9933ff')
        }
      }
    })
    
    // 区域消失
    this.time.delayedCall(cfg.DURATION, () => {
      circle.destroy()
      damageEvent.remove()
      this.tweens.killTweensOf(circle)
    })
  }

  spawnFireCircle() {
    const cfg = CONFIG.RANDOM_EVENTS.FIRE_CIRCLE
    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 在玩家附近创建火圈
    const x = this.player.x + Phaser.Math.Between(-100, 100)
    const y = this.player.y + Phaser.Math.Between(-100, 100)
    
    this.showEventWarning('🔥 火圈! 远离!', '#ff6600')
    
    // 创建火圈视觉效果
    const circle = this.add.circle(x, y, cfg.RADIUS, 0xff3300, 0.3)
    circle.setStrokeStyle(4, 0xff6600, 0.8)
    circle.setDepth(50)
    
    // 火圈收缩动画
    const shrinkEvent = this.time.addEvent({
      delay: 500,
      callback: () => {
        if (circle.scaleX > 0.5) {
          circle.setScale(circle.scaleX - 0.05)
        }
      },
      repeat: 20
    })
    
    // 持续伤害
    const damageEvent = this.time.addEvent({
      delay: 800,
      callback: () => {
        if (this.state.isGameOver) {
          damageEvent.remove()
          return
        }
        
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y)
        if (dist < cfg.RADIUS * circle.scaleX) {
          this.takeDamage(cfg.DAMAGE)
          this.showNotification(`火焰! -${cfg.DAMAGE}HP`, '#ff6600')
        }
      }
    })
    
    // 火圈消失
    this.time.delayedCall(cfg.DURATION, () => {
      shrinkEvent.remove()
      damageEvent.remove()
      circle.destroy()
    })
  }

  startEnergyDrain() {
    const cfg = CONFIG.RANDOM_EVENTS.ENERGY_DRAIN
    
    this.showEventWarning('⚠️ 能量流失场!', '#0088ff')
    
    const drainEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.state.isGameOver) {
          drainEvent.remove()
          return
        }
        
        this.state.energy = Math.max(0, this.state.energy - cfg.DRAIN)
        this.energyBar.scaleX = this.state.energy / CONFIG.PLAYER.ENERGY_MAX
        this.showNotification(`能量-${cfg.DRAIN}`, '#0088ff')
      },
      repeat: Math.floor(cfg.DURATION / 1000) - 1
    })

    // 事件结束时从 randomEvents 中移除（使用 delayedCall 替代不存在的 on() 方法）
    this.time.delayedCall(cfg.DURATION, () => {
      const index = this.state.randomEvents.indexOf(drainEvent)
      if (index > -1) {
        this.state.randomEvents.splice(index, 1)
      }
    })
    
    this.state.randomEvents.push(drainEvent)
  }

  startCoinRain() {
    const cfg = CONFIG.RANDOM_EVENTS.COIN_RAIN
    
    this.showEventWarning('💰 金币雨!', '#ffd700')
    
    // 在玩家附近生成金币
    for (let i = 0; i < cfg.COUNT; i++) {
      this.time.delayedCall(i * 200, () => {
        const cx = this.player.x + Phaser.Math.Between(-150, 150)
        const cy = this.player.y + Phaser.Math.Between(-150, 150)
        
        const coin = this.add.container(cx, cy)
        const c = this.add.rectangle(0, 0, 15, 15, 0xffd700)
        c.setStrokeStyle(2, 0xffaa00)
        coin.add(c)
        coin.setDepth(100)
        
        // 金币掉落动画
        this.tweens.add({
          targets: coin,
          y: cy + 30,
          alpha: 0,
          duration: 1500,
          onComplete: () => {
            coin.destroy()
            this.state.coins += cfg.AMOUNT / cfg.COUNT
            this.coinText.setText(String(Math.floor(this.state.coins)))
          }
        })
      })
    }
  }

  // 冻结特效
  showFreezeEffect() {
    const sw = CONFIG.SCREEN_WIDTH
    const sh = CONFIG.SCREEN_HEIGHT
    const px = this.player.x
    const py = this.player.y
    
    // 1. 屏幕蓝色滤镜
    const freezeOverlay = this.add.rectangle(sw/2, sh/2, sw, sh, 0x8888ff, 0.15)
    freezeOverlay.setDepth(200).setScrollFactor(0)
    this.tweens.add({
      targets: freezeOverlay,
      alpha: 0,
      duration: 1000,
      onComplete: () => freezeOverlay.destroy()
    })
    
    // 2. 玩家周围冰晶效果
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i
      const dist = 50
      const cx = px + Math.cos(angle) * dist
      const cy = py + Math.sin(angle) * dist
      
      const ice = this.add.text(cx, cy, '❄', { fontSize: '20px' }).setOrigin(0.5).setDepth(150)
      
      this.tweens.add({
        targets: ice,
        alpha: 0,
        y: cy - 20,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 1500,
        delay: i * 50,
        onComplete: () => ice.destroy()
      })
    }
    
    // 3. 玩家闪烁效果
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5
    })
    
    // 4. 屏幕震动
    this.cameras.main.shake(300, 0.01)
    
    // 5. 冻结计时提示（持续显示直到解除）
    const freezeTimer = this.add.text(sw/2, sh/2 + 100, '🚫 技能冻结中...', {
      fontSize: '24px',
      fill: '#8888ff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
      backgroundColor: '#000000aa'
    }).setOrigin(0.5).setDepth(201).setScrollFactor(0)
    
    // 3秒后移除提示
    this.time.delayedCall(3000, () => {
      if (freezeTimer.active) freezeTimer.destroy()
    })
  }

  showEventWarning(text, color) {
    const sw = CONFIG.SCREEN_WIDTH
    
    // 创建警告文字
    const warning = this.add.text(sw / 2, 150, text, {
      fontSize: '20px',
      fill: color,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
      backgroundColor: '#000000aa'
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0)
    
    // 警告动画
    this.tweens.add({
      targets: warning,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: warning,
          y: 120,
          alpha: 0,
          duration: 1000,
          onComplete: () => warning.destroy()
        })
      }
    })
  }

  spawnAirDrop() {
    if (this.state.isGameOver) return
    if (this.state.airDrop) return  // 已有空投

    const w = CONFIG.GAME_WIDTH
    const h = CONFIG.GAME_HEIGHT
    
    // 随机位置（不在边缘）
    const x = Phaser.Math.Between(150, w - 150)
    const y = Phaser.Math.Between(150, h - 150)

    // 随机选择道具
    const allItems = CONFIG.SHOP.ITEMS
    const item = allItems[Phaser.Math.Between(0, allItems.length - 1)]
    const iconData = GameScene.AIRDROP_ICONS[item.effect] || { icon: '📦', color: 0xffd700, name: '空投' }
    
    const airDrop = this.add.container(x, y)
    airDrop.item = item
    
    // 光芒效果
    const glow = this.add.circle(0, 0, 40, iconData.color, 0.2)
    airDrop.add(glow)
    
    // 脉冲动画
    this.tweens.add({
      targets: glow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.1,
      duration: 600,
      yoyo: true,
      repeat: -1
    })
    
    // 降落伞
    const chute = this.add.triangle(0, -30, 0, -15, -22, 0, 22, 0, iconData.color)
    airDrop.add(chute)
    
    // 吊绳
    const rope1 = this.add.line(0, -15, -15, 0, 0, 0, 0x888888)
    const rope2 = this.add.line(0, -15, 15, 0, 0, 0, 0x888888)
    airDrop.add(rope1)
    airDrop.add(rope2)
    
    // 宝箱主体 - 根据道具颜色
    const box = this.add.rectangle(0, 0, 35, 30, iconData.color)
    box.setStrokeStyle(3, 0xffffff)
    airDrop.add(box)
    
    // 道具图标
    const icon = this.add.text(0, 0, iconData.icon, { fontSize: '22px' }).setOrigin(0.5)
    airDrop.add(icon)
    
    // 边框装饰
    const border = this.add.rectangle(0, 0, 45, 40, iconData.color, 0)
    border.setStrokeStyle(2, iconData.color, 0.5)
    airDrop.add(border)
    
    // 整体闪烁动画
    this.tweens.add({
      targets: airDrop,
      alpha: 0.7,
      duration: 400,
      yoyo: true,
      repeat: -1
    })
    
    // 上下浮动动画
    this.tweens.add({
      targets: airDrop,
      y: y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // 旋转边框
    this.tweens.add({
      targets: border,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: 'Linear'
    })

    airDrop.lifespan = 12000  // 12秒后消失

    this.state.airDrop = airDrop
    this.airDropText.setText(`${iconData.icon}${iconData.name}!`).setColor('#' + iconData.color.toString(16).padStart(6, '0'))
  }

  applyItem(item) {
    switch (item.effect) {
      case 'heal':
        this.state.health = Math.min(CONFIG.PLAYER.MAX_HEALTH, this.state.health + item.value)
        this.healthBar.scaleX = this.state.health / CONFIG.PLAYER.MAX_HEALTH
        this.healthBar.setFillStyle(0x00ff00)
        this.showNotification(`+${item.value}HP`, '#00ff00')
        break
      case 'energy':
        this.state.energy = Math.min(CONFIG.PLAYER.ENERGY_MAX, this.state.energy + item.value)
        this.energyBar.scaleX = this.state.energy / CONFIG.PLAYER.ENERGY_MAX
        this.showNotification(`+${item.value}能量`, '#0088ff')
        break
      case 'damage':
        this.state.damageBoost += item.value
        this.showNotification(`攻击+${item.value}!`, '#ff6600')
        this.time.delayedCall(item.duration, () => {
          this.state.damageBoost -= item.value
        })
        break
      case 'shield':
        this.state.shieldActive = true
        this.showNotification('护盾激活!', '#00ffff')
        this.time.delayedCall(item.duration, () => {
          this.state.shieldActive = false
          this.showNotification('护盾消失', '#888888')
        })
        break
      case 'weapon_upgrade':
        if (this.state.weaponLevel < CONFIG.WEAPON.LEVELS.length - 1) {
          this.state.weaponLevel += item.value
          const newWeapon = CONFIG.WEAPON.LEVELS[this.state.weaponLevel]
          const weaponIcons = ['📊', '📈', '📉', '🚀', '💰', '🔪', '🐋', '🏆', '🪙', '👑']
          const weaponIcon = weaponIcons[this.state.weaponLevel] || '📊'
          this.weaponText.setText(`${weaponIcon} ${newWeapon.text} [Lv.${this.state.weaponLevel + 1}]`)
          this.showNotification(`${newWeapon.text}! 伤害${newWeapon.damage}`, '#ff00ff')
          
          // 升级特效
          const glowRing = this.add.circle(this.player.x, this.player.y, 30, 0xff00ff, 0.6)
          glowRing.setDepth(150)
          this.tweens.add({
            targets: glowRing,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 400,
            onComplete: () => glowRing.destroy()
          })
        } else {
          this.showNotification('武器已满级!', '#ffd700')
        }
        break
      case 'spread_shot':
        this.state.spreadShot = true
        this.showNotification('散弹武器! 30秒', '#ffff00')
        this.time.delayedCall(item.duration, () => {
          this.state.spreadShot = false
        })
        break
      case 'laser_shot':
        this.state.laserShot = true
        this.showNotification('激光武器! 穿透!', '#00ffff')
        this.time.delayedCall(item.duration, () => {
          this.state.laserShot = false
        })
        break
    }
  }

  showNotification(text, color = '#fff') {
    const sw = CONFIG.SCREEN_WIDTH
    const notif = this.add.text(sw / 2, 520, text, {
      fontSize: '16px',
      fill: color,
      fontStyle: 'bold',
      backgroundColor: '#000aa',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0)

    this.tweens.add({
      targets: notif,
      y: 500,
      alpha: 0,
      duration: 2000,
      onComplete: () => notif.destroy()
    })
  }

  checkAirDrop() {
    if (!this.state.airDrop) return

    const airDrop = this.state.airDrop
    airDrop.lifespan -= 16

    // 倒计时
    const timeLeft = Math.ceil(airDrop.lifespan / 1000)
    const iconData = GameScene.AIRDROP_ICONS[airDrop.item.effect] || { icon: '📦', name: '空投' }
    this.airDropText.setText(`${iconData.icon} ${timeLeft}s`)

    // 超时消失
    if (airDrop.lifespan <= 0) {
      this.airDropText.setText('')
      airDrop.destroy()
      this.state.airDrop = null
      return
    }

    // 玩家接近自动拾取
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      airDrop.x, airDrop.y
    )

    if (dist < 55) {
      const item = airDrop.item
      const colorHex = '#' + (iconData.color || 0xffd700).toString(16).padStart(6, '0')
      
      // 应用道具效果
      this.applyItem(item)
      
      // 拾取特效 - 根据道具类型
      this.createAirDropPickupEffect(airDrop.x, airDrop.y, iconData)
      
      // 提示文字
      let tipText = ''
      switch (item.effect) {
        case 'heal': tipText = `+${item.value} HP`; break
        case 'energy': tipText = `+${item.value} 能量`; break
        case 'damage': tipText = `攻击+${item.value}!`; break
        case 'shield': tipText = `护盾激活!`; break
        case 'weapon_upgrade': tipText = `武器升级!`; break
        case 'spread_shot': tipText = `散弹模式!`; break
        case 'laser_shot': tipText = `激光模式!`; break
        default: tipText = `获得道具!`
      }
      this.showNotification(`${iconData.icon} ${tipText}`, colorHex)

      airDrop.destroy()
      this.state.airDrop = null
      this.airDropText.setText('')
    }
  }

  // 空投拾取特效
  createAirDropPickupEffect(x, y, iconData) {
    // 光环爆炸
    const ring = this.add.circle(x, y, 20, iconData.color || 0xffd700, 0.6)
    ring.setDepth(150)
    this.tweens.add({
      targets: ring,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    })
    
    // 粒子爆发
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i
      const particle = this.add.circle(x, y, 5, iconData.color || 0xffd700)
      particle.setDepth(150)
      
      const destX = x + Math.cos(angle) * 60
      const destY = y + Math.sin(angle) * 60
      
      this.tweens.add({
        targets: particle,
        x: destX,
        y: destY,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      })
    }
    
    // 道具图标飞向屏幕中央
    const flyIcon = this.add.text(x, y, iconData.icon, { fontSize: '30px' }).setOrigin(0.5).setDepth(160)
    this.tweens.add({
      targets: flyIcon,
      x: CONFIG.SCREEN_WIDTH / 2,
      y: CONFIG.SCREEN_HEIGHT / 2 - 80,
      scaleX: 0.3,
      scaleY: 0.3,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeIn',
      onComplete: () => flyIcon.destroy()
    })
  }

  // 检查是否遇到NPC交易所
  checkNPCEncounter() {
    if (this.state.showHandActive) return

    // 每秒有2%概率遇到NPC交易所 (提高了约7倍)
    if (Math.random() < 0.02) {
      this.triggerNPCTrade()
    }
  }

  // 触发NPC交易所
  triggerNPCTrade() {
    console.log('[GameScene] triggerNPCTrade() called')
    if (this.state.showHandActive) return
    this.state.showHandActive = true

    // 暂停游戏
    this.scene.pause()
    console.log('[GameScene] Scene paused')

    // 屏幕闪烁提示
    this.createNPCAlert()
    console.log('[GameScene] NPCAlert created, launching ShowHandScene in 800ms...')

    // 保存this引用，避免setTimeout中的上下文问题
    const self = this
    const coinsToTrade = this.state.coins

    // 启动ShowHand场景 - 使用window.setTimeout代替this.time.delayedCall
    window.setTimeout(function() {
      console.log('[GameScene] setTimeout fired, launching ShowHandScene')
      self.scene.launch('ShowHandScene', {
        coins: coinsToTrade,
        trigger: 0,
        gameSceneKey: 'GameScene',
        isNPCEncounter: true,
        onResult: function(newCoins, gambled) {
          console.log('[GameScene] NPC Trade result callback, newCoins:', newCoins)
          const prevCoins = self.state.coins
          self.state.coins = newCoins
          self.state.showHandActive = false
          console.log('[GameScene] showHandActive set to false')
          self.coinText.setText(String(newCoins))

          if (newCoins > prevCoins) {
            self.showNotification(`💰 交易成功! +${(newCoins - prevCoins).toLocaleString()} 金币`, '#00ff88')
          } else if (newCoins === prevCoins) {
            self.showNotification('📊 交易平仓', '#888888')
          } else {
            self.showNotification(`💸 交易亏损! -${(prevCoins - newCoins).toLocaleString()} 金币`, '#ff4444')
          }
        }
      })
    }, 800)
  }

  // 创建NPC出现时的屏幕提示
  createNPCAlert() {
    console.log('[GameScene] createNPCAlert() started')
    const sw = CONFIG.SCREEN_WIDTH
    const sh = CONFIG.SCREEN_HEIGHT

    // 全屏闪烁
    const flash = this.add.rectangle(sw/2, sh/2, sw, sh, 0xff00ff, 0.3)
    flash.setDepth(200)
    console.log('[GameScene] Flash created')

    // 渐变消失
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy()
    })

    // 中央提示文字
    const alertText = this.add.text(sw/2, sh/2, '🎭 发现神秘交易员!', {
      fontSize: '36px',
      fontFamily: 'Arial Black',
      fill: '#ff00ff',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(201).setAlpha(0).setScale(0.5)

    // 缩放动画
    this.tweens.add({
      targets: alertText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.out',
      onComplete: () => {
        // 1秒后消失
        this.tweens.add({
          targets: alertText,
          alpha: 0,
          y: sh/2 - 30,
          duration: 500,
          delay: 300,
          onComplete: () => alertText.destroy()
        })
      }
    })

    // 装饰线条
    const lineTop = this.add.rectangle(sw/2, sh/2 - 60, 400, 3, 0xff00ff, 0.8)
      .setDepth(201).setAlpha(0)
    const lineBottom = this.add.rectangle(sw/2, sh/2 + 60, 400, 3, 0xff00ff, 0.8)
      .setDepth(201).setAlpha(0)

    this.tweens.add({
      targets: [lineTop, lineBottom],
      alpha: 1,
      duration: 200,
      delay: 100,
      onComplete: () => {
        this.tweens.add({
          targets: [lineTop, lineBottom],
          alpha: 0,
          duration: 500,
          delay: 500,
          onComplete: () => {
            lineTop.destroy()
            lineBottom.destroy()
          }
        })
      }
    })

    // 粒子效果
    for (let i = 0; i < 20; i++) {
      const px = Phaser.Math.Between(100, sw - 100)
      const py = Phaser.Math.Between(100, sh - 100)
      const p = this.add.rectangle(px, py, 4, 4, 0xff00ff, 0.8)
        .setDepth(201)

      this.tweens.add({
        targets: p,
        y: py - 50,
        alpha: 0,
        duration: 800,
        delay: i * 30,
        onComplete: () => p.destroy()
      })
    }
    console.log('[GameScene] createNPCAlert() COMPLETE')
  }

  showGameOver() {
    const sw = CONFIG.SCREEN_WIDTH
    const sh = CONFIG.SCREEN_HEIGHT
    
    const overlay = this.add.rectangle(sw/2, sh/2, sw, sh, 0x000000, 0.8)
    overlay.setDepth(500).setScrollFactor(0)

    this.add.text(sw/2, sh/2 - 60, 'GAME OVER', {
      fontSize: '48px', fill: '#ff4444', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(501).setScrollFactor(0)

    this.add.text(sw/2, sh/2, `波次:${this.state.wave} 金币:${this.state.coins}`, {
      fontSize: '20px', fill: '#fff'
    }).setOrigin(0.5).setDepth(501).setScrollFactor(0)

    const restart = this.add.text(sw/2, sh/2 + 60, '[ 按 R 重开 ]', {
      fontSize: '24px', fill: '#00ff88', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(501).setScrollFactor(0)

    this.tweens.add({
      targets: restart,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1
    })
  }

  // 清理所有资源
  shutdown() {
    // 停止所有定时器
    this.time.removeAllEvents()

    // 停止所有tweens
    this.tweens.killAll()

    // 清理市场效果
    if (this.clearMarketEffect) {
      this.clearMarketEffect()
    }

    // 清理BullBearManager
    if (this.bullBearManager && this.bullBearManager.timer) {
      this.bullBearManager.timer.remove()
      this.bullBearManager.timer = null
    }

    // 清理ShopManager
    if (this.shopManager) {
      this.shopManager.hide()
    }
  }

  // 游戏结束时的清理
  gameOverCleanup() {
    this.shutdown()
  }
}
