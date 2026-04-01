import Phaser from 'phaser'
import { COLORS, GAME_CONFIG } from '../config'

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'LEEK') {
    super(scene, x, y)
    
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.type = type
    this.config = GAME_CONFIG.ENEMY[type]

    this.health = this.config.HEALTH
    this.damage = this.config.DAMAGE
    this.speed = this.config.SPEED * (1 + scene.gameState.wave * 0.05)

    this.setOrigin(0.5, 0.5)
    this.setCollideWorldBounds(true)
    this.body.setSize(20, 20)
    this.body.setOffset(-10, -10)

    this.draw()
  }

  draw() {
    if (this.type === 'KOL') {
      // KOL - 粉色
      const body = this.scene.add.rectangle(0, 0, 24, 24, COLORS.ENEMY_KOL)
      body.setOrigin(0.5)
      this.add(body)
      
      // 脸
      const face = this.scene.add.rectangle(0, -2, 16, 12, 0xffb6c1)
      face.setOrigin(0.5)
      this.add(face)
      
      // 眼睛
      const eyeL = this.scene.add.rectangle(-4, -2, 5, 5, 0xffffff)
      eyeL.setOrigin(0.5)
      this.add(eyeL)
      const eyeR = this.scene.add.rectangle(4, -2, 5, 5, 0xffffff)
      eyeR.setOrigin(0.5)
      this.add(eyeR)
      
      // 麦克风
      const mic = this.scene.add.rectangle(16, 0, 8, 4, 0x333333)
      mic.setOrigin(0.5)
      this.add(mic)
      
    } else {
      // 韭菜 - 绿色
      const body = this.scene.add.rectangle(0, 0, 18, 18, COLORS.ENEMY_LEEK)
      body.setOrigin(0.5)
      this.add(body)
      
      // 恐慌表情
      const eyeL = this.scene.add.rectangle(-4, -2, 4, 4, 0xffffff)
      eyeL.setOrigin(0.5)
      this.add(eyeL)
      const eyeR = this.scene.add.rectangle(4, -2, 4, 4, 0xffffff)
      eyeR.setOrigin(0.5)
      this.add(eyeR)
      
      // 恐慌的嘴
      const mouth = this.scene.add.rectangle(0, 5, 8, 4, 0x000000)
      mouth.setOrigin(0.5)
      this.add(mouth)
      
      // 韭菜叶
      const leaf1 = this.scene.add.rectangle(-3, -12, 4, 6, 0x228b22)
      leaf1.setOrigin(0.5)
      this.add(leaf1)
      const leaf2 = this.scene.add.rectangle(3, -12, 4, 6, 0x228b22)
      leaf2.setOrigin(0.5)
      this.add(leaf2)
    }
  }

  takeDamage(amount) {
    this.health -= amount

    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 50,
      yoyo: true,
      repeat: 2
    })

    const angle = Phaser.Math.Angle.Between(
      this.scene.player.x, this.scene.player.y,
      this.x, this.y
    )
    this.x += Math.cos(angle) * 10
    this.y += Math.sin(angle) * 10

    if (this.health <= 0) {
      this.die()
    }
  }

  die() {
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.destroy()
      }
    })
  }
}
