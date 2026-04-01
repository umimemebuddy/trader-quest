import Phaser from 'phaser'
import { COLORS, GAME_CONFIG } from '../config'

export default class BullBearManager {
  constructor(scene) {
    this.scene = scene
    this.isBullMarket = true
    this.timer = null
    this.startBullPhase()
  }

  startBullPhase() {
    // 先停止旧的定时器
    if (this.timer) {
      this.timer.remove()
      this.timer = null
    }
    
    this.isBullMarket = true
    this.scene.setBullMarket(true)

    // 更新背景色调
    this.updateBackground(true)
    
    // 切换到牛市背景效果
    if (this.scene.activateMarketEffect) {
      this.scene.activateMarketEffect('BULL_WAVE')
    }

    // 显示牛市提示
    this.showMarketAnnouncement('📈 牛市来袭！金币 x3', COLORS.UI_BULL)

    this.timer = this.scene.time.delayedCall(
      GAME_CONFIG.BULL_BEAR.BULL_DURATION,
      () => this.startBearPhase()
    )
  }

  startBearPhase() {
    // 先停止旧的定时器
    if (this.timer) {
      this.timer.remove()
      this.timer = null
    }
    
    this.isBullMarket = false
    this.scene.setBullMarket(false)

    // 更新背景色调
    this.updateBackground(false)
    
    // 切换到熊市背景效果
    if (this.scene.activateMarketEffect) {
      this.scene.activateMarketEffect('BEAR_CRASH')
    }

    // 显示熊市提示
    this.showMarketAnnouncement('📉 熊市来了！敌人 x2', COLORS.UI_BEAR)

    this.timer = this.scene.time.delayedCall(
      GAME_CONFIG.BULL_BEAR.BEAR_DURATION,
      () => this.startBullPhase()
    )
  }

  updateBackground(isBull) {
    // 检查场景是否已暂停或销毁
    if (!this.scene || !this.scene.scene || this.scene.scene.isPaused()) return
    if (!this.scene.bgGraphics || !this.scene.cameras) return

    try {
      // 背景渐变效果
      const targetColor = isBull ? 0x0a1a0a : 0x1a0a0a

      this.scene.bgGraphics.fillStyle(targetColor)
      this.scene.bgGraphics.fillRect(
        0, 0,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height
      )

      // 重绘网格
      if (this.scene.createGrid) {
        this.scene.createGrid()
      }
    } catch (e) {
      // 静默处理错误
    }
  }

  showMarketAnnouncement(text, color) {
    const width = this.scene.cameras.main.width
    const height = this.scene.cameras.main.height

    const announcement = this.scene.add.text(width / 2, height / 2 - 150, text, {
      fontSize: '28px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: color,
      strokeThickness: 2
    })
    announcement.setOrigin(0.5)
    announcement.setAlpha(0)

    // 入场动画
    this.scene.tweens.add({
      targets: announcement,
      alpha: 1,
      y: height / 2 - 170,
      duration: 500,
      ease: 'Quad.easeOut'
    })

    // 2秒后淡出
    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: announcement,
        alpha: 0,
        y: height / 2 - 200,
        duration: 500,
        ease: 'Quad.easeIn',
        onComplete: () => announcement.destroy()
      })
    })

    // 屏幕边框闪烁
    const border = this.scene.add.rectangle(
      width / 2, height / 2,
      width, height,
      color, 0.1
    )
    border.setStrokeStyle(8, color)

    this.scene.tweens.add({
      targets: border,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => border.destroy()
    })
  }

  update() {
    // 可以在这里添加倒计时显示等
  }

  getCoinMultiplier() {
    if (this.isBullMarket) {
      return GAME_CONFIG.BULL_BEAR.BULL_COIN_MULT
    } else {
      return 1 - GAME_CONFIG.BULL_BEAR.BEAR_COIN_REDUCE
    }
  }

  getEnemyMultiplier() {
    if (this.isBullMarket) {
      return 1
    } else {
      return GAME_CONFIG.BULL_BEAR.BEAR_ENEMY_MULT
    }
  }

  getDamageReduction() {
    if (this.isBullMarket) {
      return GAME_CONFIG.BULL_BEAR.BULL_DAMAGE_REDUCE
    }
    return 0
  }
}
