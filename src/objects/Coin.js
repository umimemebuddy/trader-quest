import Phaser from 'phaser'
import { COLORS } from '../config'

export default class Coin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, value, source = 'enemy') {
    super(scene, x, y)
    
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.value = value
    this.source = source

    this.setOrigin(0.5, 0.5)
    this.setDepth(35) // 金币在子弹(40)和敌人(30)之间
    this.body.setSize(16, 16)
    this.body.setOffset(-8, -8)

    this.draw()
  }

  draw() {
    // 金币外圈
    const outer = this.scene.add.circle(0, 0, 8, COLORS.COIN)
    outer.setOrigin(0.5)
    this.add(outer)
    
    // 金币内圈
    const inner = this.scene.add.circle(0, 0, 5, 0xffec8b)
    inner.setOrigin(0.5)
    this.add(inner)
    
    // $ 符号
    const line = this.scene.add.rectangle(0, 0, 2, 10, COLORS.COIN)
    line.setOrigin(0.5)
    this.add(line)
    
    // 添加旋转动画
    this.scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 1000,
      repeat: -1
    })
  }
}
