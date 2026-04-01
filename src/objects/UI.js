import Phaser from 'phaser'
import { COLORS } from '../config'

export default class UI {
  constructor(scene) {
    this.scene = scene
    this.createUI()
  }

  createUI() {
    const width = this.scene.cameras.main.width
    const height = this.scene.cameras.main.height

    // 血条背景
    this.healthBarBg = this.scene.add.rectangle(70, 25, 140, 20, COLORS.UI_HEALTH_BG)
    this.healthBarBg.setOrigin(0, 0.5)
    this.healthBarBg.setStrokeStyle(2, 0xffffff)

    // 血条
    this.healthBar = this.scene.add.rectangle(70, 25, 136, 16, COLORS.UI_HEALTH)
    this.healthBar.setOrigin(0, 0.5)

    // 血量文字
    this.healthText = this.scene.add.text(10, 25, '❤️', { fontSize: '16px' })
    this.healthText.setOrigin(0, 0.5)

    this.healthValueText = this.scene.add.text(215, 25, '/100', { 
      fontSize: '14px', 
      fill: '#ffffff' 
    })
    this.healthValueText.setOrigin(0, 0.5)

    // 能量条背景
    this.energyBarBg = this.scene.add.rectangle(70, 50, 140, 12, 0x333366)
    this.energyBarBg.setOrigin(0, 0.5)
    this.energyBarBg.setStrokeStyle(1, 0x6666aa)

    // 能量条
    this.energyBar = this.scene.add.rectangle(70, 50, 136, 8, COLORS.UI_COMBO)
    this.energyBar.setOrigin(0, 0.5)

    // 能量文字
    this.scene.add.text(10, 50, '⚡', { fontSize: '14px' })

    // 金币显示
    this.coinIcon = this.scene.add.graphics()
    this.coinIcon.fillStyle(COLORS.COIN)
    this.coinIcon.fillCircle(16, height - 25, 10)
    this.coinIcon.fillStyle(0xffec8b)
    this.coinIcon.fillCircle(16, height - 25, 6)

    this.coinText = this.scene.add.text(30, height - 32, '0', {
      fontSize: '24px',
      fill: '#ffd700',
      fontFamily: 'Courier New'
    })

    // Combo 显示
    this.comboContainer = this.scene.add.container(width / 2, height / 2 - 100)
    this.comboContainer.setAlpha(0)

    this.comboText = this.scene.add.text(0, 0, '0', {
      fontSize: '48px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    })
    this.comboText.setOrigin(0.5)
    this.comboContainer.add(this.comboText)

    this.comboLabel = this.scene.add.text(0, 35, 'COMBO', {
      fontSize: '16px',
      fill: '#00ccff'
    })
    this.comboLabel.setOrigin(0.5)
    this.comboContainer.add(this.comboLabel)

    // Pending Coins
    this.pendingText = this.scene.add.text(0, 60, '+0', {
      fontSize: '18px',
      fill: '#ffd700'
    })
    this.pendingText.setOrigin(0.5)
    this.comboContainer.add(this.pendingText)

    // 市场状态指示器
    this.marketBg = this.scene.add.rectangle(width - 80, 30, 120, 30, COLORS.UI_BULL)
    this.marketBg.setOrigin(0.5)
    this.marketBg.setAlpha(0.8)

    this.marketText = this.scene.add.text(width - 80, 30, '📈 牛市', {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    })
    this.marketText.setOrigin(0.5)

    // 波次显示
    this.waveText = this.scene.add.text(width - 80, 60, 'WAVE 1', {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    })
    this.waveText.setOrigin(0.5)

    // 控制提示
    this.hintText = this.scene.add.text(width / 2, height - 20, 
      'WASD 移动 | 空格 攻击 | E 放置矿机(100金币)', {
      fontSize: '12px',
      fill: '#666666'
    })
    this.hintText.setOrigin(0.5)
  }

  update(state) {
    // 血量
    const healthPercent = state.health / state.maxHealth
    this.healthBar.width = 136 * healthPercent
    this.healthValueText.setText(`/${state.maxHealth}`)
    
    // 血量颜色变化
    if (healthPercent < 0.3) {
      this.healthBar.fillColor = 0xff0000
      // 低血量警告闪烁
      if (Math.random() > 0.7) {
        this.scene.cameras.main.flash(50, 255, 0, 0, false)
      }
    } else {
      this.healthBar.fillColor = COLORS.UI_HEALTH
    }

    // 能量
    const energyPercent = state.energy / state.maxEnergy
    this.energyBar.width = 136 * energyPercent

    // 金币
    this.coinText.setText(state.coins.toString())

    // Combo
    if (state.combo > 0) {
      this.comboContainer.setAlpha(1)
      this.comboText.setText(state.combo.toString())
      
      // Combo 颜色根据数值变化
      if (state.combo >= 50) {
        this.comboText.setStyle({ fill: '#ff00ff' })
      } else if (state.combo >= 20) {
        this.comboText.setStyle({ fill: '#ff6600' })
      } else if (state.combo >= 10) {
        this.comboText.setStyle({ fill: '#ffff00' })
      } else {
        this.comboText.setStyle({ fill: '#ffffff' })
      }

      this.pendingText.setText(`+${state.pendingCoins}`)
    } else {
      this.comboContainer.setAlpha(0)
    }

    // 波次
    this.waveText.setText(`WAVE ${state.wave}`)
  }

  showComboEffect(combo) {
    // Combo 特效
    this.scene.tweens.add({
      targets: this.comboContainer,
      scale: { from: 1.3, to: 1 },
      duration: 200,
      ease: 'Back.easeOut'
    })

    // 屏幕震动
    this.scene.cameras.main.shake(100, 0.003)
  }

  showComboBreak() {
    const text = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      'COMBO BREAK! -50%',
      {
        fontSize: '24px',
        fill: '#ff4444',
        fontStyle: 'bold'
      }
    )
    text.setOrigin(0.5)

    this.scene.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    })
  }

  showWaveUp(wave) {
    const text = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      `WAVE ${wave}`,
      {
        fontSize: '48px',
        fill: '#00ffff',
        fontStyle: 'bold'
      }
    )
    text.setOrigin(0.5)

    this.scene.tweens.add({
      targets: text,
      scale: { from: 0.5, to: 1.5 },
      alpha: 0,
      duration: 1500,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    })
  }

  updateMarketState(isBull) {
    const width = this.scene.cameras.main.width
    
    if (isBull) {
      this.marketBg.fillColor = COLORS.UI_BULL
      this.marketText.setText('📈 牛市')
    } else {
      this.marketBg.fillColor = COLORS.UI_BEAR
      this.marketText.setText('📉 熊市')
    }

    // 切换特效
    this.scene.tweens.add({
      targets: [this.marketBg, this.marketText],
      scale: { from: 1.3, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    })
  }

  showGameOver(wave, coins) {
    const width = this.scene.cameras.main.width
    const height = this.scene.cameras.main.height

    // 半透明遮罩
    const overlay = this.scene.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x000000, 0.8
    )

    // 游戏结束文字
    const titleText = this.scene.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      fontSize: '48px',
      fill: '#ff4444',
      fontStyle: 'bold'
    })
    titleText.setOrigin(0.5)

    const statsText = this.scene.add.text(width / 2, height / 2, 
      `存活波次: ${wave}\n获得金币: ${coins}`, {
      fontSize: '24px',
      fill: '#ffffff',
      align: 'center'
    })
    statsText.setOrigin(0.5)

    // 重新开始按钮
    const restartBtn = this.scene.add.text(width / 2, height / 2 + 80, '[ 按 R 重新开始 ]', {
      fontSize: '20px',
      fill: '#00ff88'
    })
    restartBtn.setOrigin(0.5)

    // 按钮闪烁
    this.scene.tweens.add({
      targets: restartBtn,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1
    })

    // 监听 R 键
    this.scene.input.keyboard.once('keydown-R', () => {
      this.scene.restartGame()
    })
  }

  showNotification(text) {
    const width = this.scene.cameras.main.width
    const height = this.scene.cameras.main.height

    const notification = this.scene.add.text(width / 2, height / 2 + 100, text, {
      fontSize: '20px',
      fill: '#00ff88',
      fontStyle: 'bold',
      backgroundColor: '#1a1a2e',
      padding: { x: 10, y: 5 }
    })
    notification.setOrigin(0.5)

    this.scene.tweens.add({
      targets: notification,
      y: height / 2 + 70,
      alpha: 0,
      duration: 1500,
      ease: 'Quad.easeOut',
      onComplete: () => notification.destroy()
    })
  }
}
