import Phaser from 'phaser'
import { COLORS } from '../config'

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, angle, damage) {
    super(scene, x, y)
    
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.damage = damage
    this.speed = 400

    this.setOrigin(0.5, 0.5)
    this.body.setSize(12, 6)
    this.body.setOffset(-6, -3)

    this.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    )

    this.rotation = angle
    this.draw()
  }

  draw() {
    // 现金子弹
    const body = this.scene.add.rectangle(0, 0, 12, 6, COLORS.PLAYER)
    body.setOrigin(0.5)
    this.add(body)
    
    // 高光
    const highlight = this.scene.add.rectangle(0, -2, 12, 2, 0x66ffaa)
    highlight.setOrigin(0.5)
    this.add(highlight)
  }
}
