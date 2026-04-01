import Phaser from 'phaser'
import { COLORS } from '../config'

export default class ShopManager {
  constructor(scene) {
    this.scene = scene
    this.isShopOpen = false
    this.shopItems = []

    // 随机出现商店
    this.scheduleShop()
  }

  scheduleShop() {
    // 30-60秒随机出现商店
    const delay = Phaser.Math.Between(30000, 60000)

    this.scene.time.delayedCall(delay, () => {
      if (!this.scene.gameState.isGameOver) {
        this.openShop()
      }
    })
  }

  openShop() {
    if (this.isShopOpen) return

    this.isShopOpen = true
    this.showShop()
  }

  showShop() {
    const width = this.scene.cameras.main.width
    const height = this.scene.cameras.main.height

    // 生成商店物品
    this.generateShopItems()

    // 商店背景
    const shopBg = this.scene.add.rectangle(
      width / 2, height / 2,
      300, 250,
      0x1a1a2e
    )
    shopBg.setStrokeStyle(3, COLORS.COIN)
    shopBg.setDepth(100)

    // 商店标题
    const shopTitle = this.scene.add.text(width / 2, height / 2 - 100, '🏪 神秘商人', {
      fontSize: '24px',
      fill: '#ffd700',
      fontStyle: 'bold'
    })
    shopTitle.setOrigin(0.5)
    shopTitle.setDepth(101)

    // 剩余时间提示
    const timeText = this.scene.add.text(width / 2, height / 2 - 70, '⏰ 10秒后消失!', {
      fontSize: '16px',
      fill: '#ff4444'
    })
    timeText.setOrigin(0.5)
    timeText.setDepth(101)

    // 显示物品
    this.shopItems.forEach((item, index) => {
      this.createShopItem(index, item, shopBg)
    })

    // 10秒后关闭商店
    this.scene.time.delayedCall(10000, () => {
      this.closeShop(shopBg, shopTitle, timeText)
    })
  }

  generateShopItems() {
    const items = [
      { name: '护盾', icon: '🛡️', price: 50, effect: '抵挡一次攻击' },
      { name: '肾上腺素', icon: '💊', price: 80, effect: '无敌3秒+加速' },
      { name: 'K线图', icon: '📈', price: 30, effect: '显示敌人血量' },
      { name: '能量饮料', icon: '🥤', price: 40, effect: '恢复30能量' },
      { name: '披萨', icon: '🍕', price: 60, effect: '恢复50血量' },
      { name: '杠杆药水', icon: '🧨', price: 100, effect: '伤害x2' }
    ]

    // 随机选3个
    this.shopItems = Phaser.Utils.Array.Shuffle(items).slice(0, 3)
  }

  createShopItem(index, item, shopBg) {
    const width = this.scene.cameras.main.width
    const height = this.scene.cameras.main.height
    const baseY = height / 2 - 20

    const y = baseY + index * 50

    // 物品背景
    const itemBg = this.scene.add.rectangle(width / 2, y, 260, 40, 0x2a2a3e)
    itemBg.setStrokeStyle(1, 0x666666)
    itemBg.setDepth(100)
    itemBg.setInteractive({ useHandCursor: true })

    // 物品图标
    const iconText = this.scene.add.text(width / 2 - 100, y, item.icon, {
      fontSize: '24px'
    })
    iconText.setOrigin(0.5)
    iconText.setDepth(101)

    // 物品名称和效果
    const nameText = this.scene.add.text(width / 2 - 50, y - 8, item.name, {
      fontSize: '16px',
      fill: '#ffffff'
    })

    const effectText = this.scene.add.text(width / 2 - 50, y + 8, item.effect, {
      fontSize: '12px',
      fill: '#888888'
    })

    // 价格
    const priceText = this.scene.add.text(width / 2 + 90, y, `${item.price}`, {
      fontSize: '16px',
      fill: '#ffd700',
      fontFamily: 'Courier New'
    })
    priceText.setOrigin(0.5)
    priceText.setDepth(101)

    // 点击购买
    itemBg.on('pointerdown', () => {
      if (this.scene.gameState.coins >= item.price) {
        this.scene.gameState.coins -= item.price
        this.applyItemEffect(item)
        this.showPurchaseEffect(itemBg, iconText, nameText, effectText, priceText)
      }
    })

    // 悬停效果
    itemBg.on('pointerover', () => {
      itemBg.setFillStyle(0x3a3a4e)
    })
    itemBg.on('pointerout', () => {
      itemBg.setFillStyle(0x2a2a3e)
    })
  }

  applyItemEffect(item) {
    switch (item.name) {
      case '护盾':
        // TODO: 实现护盾效果
        this.scene.ui.showNotification('获得护盾！')
        break
      case '肾上腺素':
        this.scene.player.invincible = true
        this.scene.time.delayedCall(3000, () => {
          this.scene.player.invincible = false
        })
        this.scene.ui.showNotification('无敌3秒！')
        break
      case 'K线图':
        // TODO: 实现K线图效果
        this.scene.ui.showNotification('显示敌人血量！')
        break
      case '能量饮料':
        this.scene.gameState.energy = Math.min(
          this.scene.gameState.energy + 30,
          100
        )
        this.scene.ui.showNotification('能量+30')
        break
      case '披萨':
        this.scene.gameState.health = Math.min(
          this.scene.gameState.health + 50,
          100
        )
        this.scene.ui.showNotification('生命+50')
        break
      case '杠杆药水':
        // TODO: 实现杠杆效果
        this.scene.ui.showNotification('伤害x2！')
        break
    }
  }

  showPurchaseEffect(bg, icon, name, effect, price) {
    const successText = this.scene.add.text(bg.x, bg.y, '已购买!', {
      fontSize: '14px',
      fill: '#00ff88',
      fontStyle: 'bold'
    })
    successText.setOrigin(0.5)

    this.scene.tweens.add({
      targets: successText,
      y: bg.y - 30,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => successText.destroy()
    })

    // 短暂禁用
    bg.disableInteractive()
  }

  closeShop(bg, title, timeText) {
    this.scene.tweens.add({
      targets: [bg, title, timeText],
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeIn',
      onComplete: () => {
        bg.destroy()
        title.destroy()
        timeText.destroy()
        
        // 销毁物品
        this.scene.children.list
          .filter(obj => obj.depth >= 100)
          .forEach(obj => obj.destroy())
      }
    })

    this.isShopOpen = false
    this.scheduleShop()
  }
}
