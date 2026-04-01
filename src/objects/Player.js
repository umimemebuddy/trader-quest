import Phaser from 'phaser'
import { COLORS, GAME_CONFIG } from '../config'

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y)
    
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setOrigin(0.5, 0.5)
    this.setCollideWorldBounds(true)
    this.body.setSize(24, 24)
    this.body.setOffset(-12, -12)

    // 属性
    this.health = GAME_CONFIG.PLAYER.HEALTH
    this.facingAngle = 0
    this.invincible = false
    this.invincibleTimer = null

    // 绘制角色
    this.draw()
  }

  draw() {
    // 身体
    const body = this.scene.add.rectangle(0, 0, 24, 24, COLORS.PLAYER)
    body.setOrigin(0.5)
    this.add(body)
    
    // 高光
    const highlight = this.scene.add.rectangle(0, -6, 24, 8, 0x66ffaa)
    highlight.setOrigin(0.5)
    this.add(highlight)
    
    // 眼睛
    const eyeL = this.scene.add.rectangle(-5, 0, 5, 5, 0xffffff)
    eyeL.setOrigin(0.5)
    this.add(eyeL)
    
    const eyeR = this.scene.add.rectangle(5, 0, 5, 5, 0xffffff)
    eyeR.setOrigin(0.5)
    this.add(eyeR)
    
    // 瞳孔
    const pupilL = this.scene.add.rectangle(-4, 1, 3, 3, 0x000000)
    pupilL.setOrigin(0.5)
    this.add(pupilL)
    
    const pupilR = this.scene.add.rectangle(6, 1, 3, 3, 0x000000)
    pupilR.setOrigin(0.5)
    this.add(pupilR)

    // 背包
    const backpack = this.scene.add.rectangle(14, 0, 8, 14, COLORS.PLAYER_DARK)
    backpack.setOrigin(0.5)
    this.add(backpack)
    
    // HODL 文字
    const h = this.scene.add.rectangle(-3, 8, 4, 3, 0xffd700)
    h.setOrigin(0.5)
    this.add(h)
    const o = this.scene.add.rectangle(2, 8, 4, 3, 0xffd700)
    o.setOrigin(0.5)
    this.add(o)
    const l = this.scene.add.rectangle(7, 8, 4, 3, 0xffd700)
    l.setOrigin(0.5)
    this.add(l)
  }

  updateFacing() {
    if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
      this.facingAngle = Math.atan2(this.body.velocity.y, this.body.velocity.x)
    }
  }

  attack() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 50,
      yoyo: true,
      ease: 'Quad.easeOut'
    })
  }

  takeDamage(amount) {
    if (this.invincible) return

    this.health -= amount
    
    this.invincible = true
    this.setAlpha(0.5)

    if (this.invincibleTimer) {
      this.invincibleTimer.remove()
    }

    this.invincibleTimer = this.scene.time.delayedCall(1000, () => {
      this.invincible = false
      this.setAlpha(1)
    })
  }

  heal(amount) {
    this.health = Math.min(this.health + amount, GAME_CONFIG.PLAYER.HEALTH)
  }
}
