import Phaser from 'phaser'
import { CONFIG } from '../config.js'

export default class ShowHandScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShowHandScene' })
  }

  init(data) {
    console.log('[ShowHandScene] init() called with data:', data)
    this.currentCoins = data.coins || 0
    this.triggerAmount = data.trigger || 0
    this.onResult = data.onResult || null
    this.gameSceneKey = data.gameSceneKey || 'GameScene'
    this.isDestroyed = false
    this.selectedCoin = null
    this.isTrading = false
    this.tradeComplete = false  // 交易是否完成
    this.tradeResult = null     // 交易结果
    console.log('[ShowHandScene] init() complete, coins:', this.currentCoins)
  }

  create() {
    try {
      console.log('[ShowHandScene] create() started')
      const w = CONFIG.SCREEN_WIDTH
      const h = CONFIG.SCREEN_HEIGHT
      const cx = w / 2
      console.log('[ShowHandScene] Screen size:', w, 'x', h)

      // ESC键强制退出
      this.input.keyboard.on('keydown-ESC', () => {
        console.log('[ShowHandScene] ESC pressed')
        const resultCoins = this.tradeComplete ? this.tradeResult : this.currentCoins
        this.returnToGame(resultCoins, this.tradeComplete)
      })

      // 深色背景
      this.add.rectangle(0, 0, w, h, 0x0a0a15, 0.98).setOrigin(0).setDepth(99)
      console.log('[ShowHandScene] Background created')

      // 网格线
      const grid = this.add.graphics()
      grid.lineStyle(1, 0x00ffff, 0.04)
      for (let x = 0; x < w; x += 40) grid.lineBetween(x, 0, x, h)
      for (let y = 0; y < h; y += 40) grid.lineBetween(0, y, w, y)
      grid.setDepth(100)

      // 四角装饰
      this.createCorners(w, h)
      console.log('[ShowHandScene] Corners created')

      // 标题
      this.createHeader(cx, 40)
      console.log('[ShowHandScene] Header created')

      // 投资金额显示
      this.createInvestment(cx, 100)
      console.log('[ShowHandScene] Investment display created')

      // 币种选择网格 (5x2)
      this.createCoinGrid(cx, 340)
      console.log('[ShowHandScene] Coin grid created')

      // BUY 和 EXIT 按钮
      this.createButtons(cx, 530)
      console.log('[ShowHandScene] Buttons created')

      // 交易状态区域
      this.createTradingArea(cx, h - 50)
      console.log('[ShowHandScene] Trading area created')

      // 超时保护：30秒后强制退出
      this.time.delayedCall(30000, () => {
        console.log('[ShowHandScene] Timeout triggered!')
        if (!this.isDestroyed) {
          const resultCoins = this.tradeComplete ? this.tradeResult : this.currentCoins
          this.returnToGame(resultCoins, this.tradeComplete)
        }
      })

      console.log('[ShowHandScene] create() COMPLETE')
    } catch (e) {
      console.error('[ShowHandScene] ERROR in create():', e)
    }
  }

  createCorners(w, h) {
    const g = this.add.graphics()
    g.lineStyle(2, 0x00ffff, 0.5).setDepth(101)
    const s = 30, p = 15
    g.lineBetween(p-s, p, p, p); g.lineBetween(p, p, p, p-s)
    g.lineBetween(w-p, p-s, w-p, p); g.lineBetween(w-p, p, w-p+s, p)
    g.lineBetween(p-s, h-p, p, h-p); g.lineBetween(p, h-p, p, h-p+s)
    g.lineBetween(w-p, h-p, w-p+s, h-p); g.lineBetween(w-p, h-p+s, w-p, h-p)
  }

  createHeader(cx, y) {
    this.add.text(cx, y - 15, '⚡ CRYPTO TRADING ⚡', {
      fontSize: '26px', fontFamily: 'Arial Black', fill: '#ff00ff',
      stroke: '#00ffff', strokeThickness: 2
    }).setOrigin(0.5).setDepth(105)

    this.add.text(cx, y + 20, '选择币种 | 买入 | 等待开盘', {
      fontSize: '13px', fontFamily: 'Consolas', fill: '#888888'
    }).setOrigin(0.5).setDepth(105)

    // 分割线
    const line = this.add.graphics()
    line.lineStyle(1, 0xff00ff, 0.3)
    line.lineBetween(cx - 200, y + 40, cx + 200, y + 40).setDepth(105)
  }

  createInvestment(cx, y) {
    // 投资金额框
    this.add.rectangle(cx, y, 300, 60, 0x151525, 0.9)
      .setStrokeStyle(2, 0xffd700, 0.6).setDepth(101)

    this.add.text(cx, y - 12, '投资金额', {
      fontSize: '12px', fontFamily: 'Consolas', fill: '#888888'
    }).setOrigin(0.5).setDepth(102)

    this.investText = this.add.text(cx, y + 15, `${this.currentCoins.toLocaleString()} 💰`, {
      fontSize: '28px', fontFamily: 'Arial Black', fill: '#ffd700'
    }).setOrigin(0.5).setDepth(102)
  }

  createCoinGrid(cx, y) {
    const coins = CONFIG.SHOW_HAND.COINS
    const odds = CONFIG.SHOW_HAND.ODDS
    const btnW = 110
    const btnH = 58
    const hGap = 10
    const vGap = 10
    const cols = 5

    this.coinButtons = []
    const totalW = cols * btnW + (cols - 1) * hGap
    const sx = cx - totalW / 2 + btnW / 2

    coins.forEach((coin, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const bx = sx + col * (btnW + hGap)
      const by = y + row * (btnH + vGap)

      // 按钮容器
      const btn = this.add.rectangle(bx, by, btnW, btnH, coin.color, 0.9)
        .setStrokeStyle(1, 0x333333).setDepth(102)
        .setInteractive({ useHandCursor: true })

      // 币种名称
      this.add.text(bx, by - 14, coin.name, {
        fontSize: '15px', fontFamily: 'Arial Black', fill: coin.textColor
      }).setOrigin(0.5).setDepth(103)

      // 收益率
      const profit = `+${Math.round((coin.multiplier - 1) * 100)}%`
      this.add.text(bx, by + 2, profit, {
        fontSize: '12px', fontFamily: 'Consolas', fill: '#ffffff'
      }).setOrigin(0.5).setDepth(103)

      // 概率
      const chance = odds[coin.risk]
      this.add.text(bx, by + 16, `${chance}%`, {
        fontSize: '10px', fontFamily: 'Consolas', fill: '#aaaaaa'
      }).setOrigin(0.5).setDepth(103)

      // 风险指示点
      const dots = coin.risk <= 5 ? '●'.repeat(coin.risk) : '●●●●●+'
      this.add.text(bx, by + 26, dots, {
        fontSize: '8px', fontFamily: 'Consolas', fill: coin.textColor
      }).setOrigin(0.5).setDepth(103)

      btn.on('pointerover', () => {
        if (!this.isTrading) {
          btn.setStrokeStyle(2, 0xffffff, 0.8)
        }
      })
      btn.on('pointerout', () => {
        if (this.selectedCoin !== coin) {
          btn.setStrokeStyle(1, 0x333333, 1)
        }
      })
      btn.on('pointerdown', () => {
        if (!this.isTrading) {
          this.selectCoin(coin, btn)
        }
      })

      this.coinButtons.push({ btn, coin })
    })
  }

  selectCoin(coin, btn) {
    // 取消之前的选中
    this.coinButtons.forEach(({ btn: b }) => b.setStrokeStyle(1, 0x333333, 1))

    // 选中当前
    btn.setStrokeStyle(3, 0x00ffff, 1)
    this.selectedCoin = coin

    // 更新提示
    if (this.tipText) this.tipText.setText(`已选择: ${coin.name} (${coin.fullName})`)
  }

  createButtons(cx, y) {
    const btnW = 150
    const btnH = 50
    const gap = 30

    // BUY 按钮
    this.buyGlow = this.add.rectangle(cx - btnW/2 - gap/2, y, btnW, btnH, 0x00ff88, 0.15).setDepth(101)
    this.buyBtn = this.add.rectangle(cx - btnW/2 - gap/2, y, btnW, btnH, 0x151525)
      .setStrokeStyle(2, 0x00ff88).setDepth(102)
      .setInteractive({ useHandCursor: true })

    this.add.text(cx - btnW/2 - gap/2, y, '💎 BUY', {
      fontSize: '20px', fontFamily: 'Arial Black', fill: '#00ff88'
    }).setOrigin(0.5).setDepth(103)

    this.buyBtn.on('pointerover', () => {
      if (!this.isTrading) {
        this.buyBtn.setFillStyle(0x203020)
        this.buyGlow.setAlpha(0.4)
      }
    })
    this.buyBtn.on('pointerout', () => {
      this.buyBtn.setFillStyle(0x151525)
      this.buyGlow.setAlpha(0.15)
    })
    this.buyBtn.on('pointerdown', () => {
      if (!this.isTrading && this.selectedCoin) {
        this.startTrade()
      } else if (!this.selectedCoin) {
        if (this.tipText) this.tipText.setText('⚠️ 请先选择币种!')
      }
    })

    // EXIT 按钮 - 必须点击才能退出
    this.exitGlow = this.add.rectangle(cx + btnW/2 + gap/2, y, btnW, btnH, 0x666666, 0.15).setDepth(101)
    this.exitBtn = this.add.rectangle(cx + btnW/2 + gap/2, y, btnW, btnH, 0x151525)
      .setStrokeStyle(2, 0x666666).setDepth(102)
      .setInteractive({ useHandCursor: true })

    this.add.text(cx + btnW/2 + gap/2, y, '⏎ EXIT', {
      fontSize: '18px', fontFamily: 'Arial Black', fill: '#888888'
    }).setOrigin(0.5).setDepth(103)

    this.exitBtn.on('pointerover', () => {
      this.exitBtn.setFillStyle(0x252535)
      this.exitGlow.setAlpha(0.4)
    })
    this.exitBtn.on('pointerout', () => {
      this.exitBtn.setFillStyle(0x151525)
      this.exitGlow.setAlpha(0.15)
    })
    this.exitBtn.on('pointerdown', () => {
      // 必须点击EXIT才能退出
      const resultCoins = this.tradeComplete ? this.tradeResult : this.currentCoins
      this.returnToGame(resultCoins, this.tradeComplete)
    })

    // 提示文字
    this.tipText = this.add.text(cx, y + 40, '选择币种后点击 BUY', {
      fontSize: '12px', fontFamily: 'Consolas', fill: '#666688'
    }).setOrigin(0.5).setDepth(105)
  }

  createTradingArea(cx, y) {
    this.statusBg = this.add.rectangle(cx, y, 500, 40, 0x1a1a30, 0.9)
      .setStrokeStyle(1, 0x444466).setDepth(101)

    this.statusText = this.add.text(cx, y, '⏳ 等待交易...', {
      fontSize: '16px', fontFamily: 'Consolas', fill: '#888888'
    }).setOrigin(0.5).setDepth(102)

    this.countdownText = this.add.text(cx, y + 18, '', {
      fontSize: '11px', fontFamily: 'Consolas', fill: '#666688'
    }).setOrigin(0.5).setDepth(102)
  }

  startTrade() {
    if (this.isTrading) {
      console.log('[ShowHand] Trade already in progress')
      return
    }
    this.isTrading = true
    console.log('[ShowHand] Trade started')

    // 清空账户
    const invested = this.currentCoins
    const coin = this.selectedCoin
    this.investText.setText('0 💰')
    console.log('[ShowHand] Invested:', invested, 'Coin:', coin.name)

    // 禁用BUY按钮，但保持EXIT可点击
    this.buyBtn.disableInteractive()
    // EXIT保持可交互，只是样式变化

    // 更新状态
    this.statusText.setText(`📊 买入 ${coin.name}...`)
    this.statusText.setFill(coin.textColor)
    this.tipText.setText(`投资: ${invested.toLocaleString()} | 预期收益: ×${coin.multiplier}`)

    // 倒计时
    let countdown = CONFIG.SHOW_HAND.COUNTDOWN_SECONDS
    this.countdownText.setText(`${countdown}s 后开盘...`)
    console.log('[ShowHand] Countdown starting:', countdown)

    this.tradeTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        countdown--
        console.log('[ShowHand] Countdown tick:', countdown)
        if (countdown > 0) {
          this.countdownText.setText(`${countdown}s 后开盘...`)
        } else {
          this.tradeTimer.remove()
          console.log('[ShowHand] Opening trade...')
          this.openTrade(coin, invested)
        }
      },
      repeat: CONFIG.SHOW_HAND.COUNTDOWN_SECONDS - 1
    })

    // 闪烁效果
    this.tweens.add({
      targets: this.statusBg,
      alpha: { from: 0.9, to: 0.5 },
      duration: 500,
      yoyo: true,
      repeat: -1
    })
  }

  openTrade(coin, invested) {
    // 使用加权随机决定实际倍率
    const odds = CONFIG.SHOW_HAND.ODDS
    const coins = CONFIG.SHOW_HAND.COINS
    const weights = coins.map((c, i) => odds[c.risk])
    const totalWeight = weights.reduce((a, b) => a + b, 0)

    let random = Math.random() * totalWeight
    let selectedCoin = coins[0]
    let selectedRisk = 1

    for (let i = 0; i < coins.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        selectedCoin = coins[i]
        selectedRisk = selectedCoin.risk
        break
      }
    }

    // 计算收益
    const multiplier = selectedCoin.multiplier
    const newCoins = Math.floor(invested * multiplier)
    const profit = newCoins - invested

    // 停止闪烁
    this.tweens.killTweensOf(this.statusBg)
    this.statusBg.setAlpha(0.9)

    // 显示结果
    if (profit > 0) {
      this.statusText.setText(`🎉 ${selectedCoin.name} 上涨! +${Math.round(profit).toLocaleString()}`)
      this.statusText.setFill('#00ff88')
      this.tipText.setText(`收益: +${Math.round(profit).toLocaleString()} | 最终: ${newCoins.toLocaleString()}`)
      this.createParticles(CONFIG.SCREEN_WIDTH/2, 300, '#00ff88', 30)
    } else if (profit < 0) {
      this.statusText.setText(`💸 ${selectedCoin.name} 下跌! ${profit.toLocaleString()}`)
      this.statusText.setFill('#ff4444')
      this.tipText.setText(`亏损: ${profit.toLocaleString()}`)
    } else {
      this.statusText.setText(`📊 ${selectedCoin.name} 平仓 保本`)
      this.statusText.setFill('#888888')
      this.tipText.setText('保本出局')
    }

    // 交易完成，等待玩家点击EXIT
    this.tradeComplete = true
    this.tradeResult = newCoins
    this.exitGlow.setAlpha(0.4)
    this.tipText.setText('交易完成! 点击 EXIT 退出')

    // 启用并高亮EXIT按钮
    this.tweens.add({
      targets: this.exitGlow,
      alpha: 0.6,
      duration: 500,
      yoyo: true,
      repeat: -1
    })
  }

  createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const p = this.add.rectangle(
        x + Phaser.Math.Between(-80, 80),
        y + Phaser.Math.Between(-30, 30),
        Phaser.Math.Between(4, 10),
        Phaser.Math.Between(4, 10),
        color, 0.8
      ).setDepth(106)
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(50, 150),
        alpha: 0,
        duration: Phaser.Math.Between(500, 1000),
        onComplete: () => p.destroy()
      })
    }
  }

  returnToGame(newCoins, gambled) {
    console.log('[ShowHand] returnToGame called, isDestroyed:', this.isDestroyed, 'newCoins:', newCoins)
    if (this.isDestroyed) {
      console.log('[ShowHand] Already destroyed, skipping')
      return
    }
    this.isDestroyed = true

    // 清理计时器
    if (this.tradeTimer) {
      this.tradeTimer.remove()
      console.log('[ShowHand] Timer removed')
    }

    // 停止所有tweens
    this.tweens.killAll()
    console.log('[ShowHand] Tweens killed')

    if (this.onResult) {
      try {
        console.log('[ShowHand] Calling onResult callback')
        this.onResult(newCoins, gambled)
      } catch(e) {
        console.error('[ShowHand] onResult error:', e)
      }
    }

    console.log('[ShowHand] Resuming scene:', this.gameSceneKey)
    this.scene.resume(this.gameSceneKey)
    console.log('[ShowHand] Stopping self')
    this.scene.stop()
  }
}
