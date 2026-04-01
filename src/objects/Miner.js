import Phaser from 'phaser'

export default class Miner extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y)
    
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.health = 50
    this.maxHealth = 50

    this.setOrigin(0.5, 0.5)
    this.body.setSize(28, 28)
    this.body.setOffset(-14, -14)
    this.body.setImmovable(true)

    this.draw()
  }

  draw() {
    // 矿机底座
    const base = this.scene.add.rectangle(0, 2, 28, 20, 0x444444)
    base.setOrigin(0.5)
    this.add(base)
    
    // 指示灯
    const light1 = this.scene.add.circle(-8, 2, 5, 0x00ff88)
    light1.setOrigin(0.5)
    this.add(light1)
    
    const light2 = this.scene.add.circle(8, 2, 5, 0x00ff88)
    light2.setOrigin(0.5)
    this.add(light2)
    
    // 风扇
    const fan = this.scene.add.circle(0, -4, 10, 0x666666)
    fan.setOrigin(0.5)
    this.add(fan)
    
    const fanCenter = this.scene.add.circle(0, -4, 6, 0x333333)
    fanCenter.setOrigin(0.5)
    this.add(fanCenter)
    
    // 天线
    const ant1 = this.scene.add.rectangle(-6, -20, 2, 12, 0x888888)
    ant1.setOrigin(0.5)
    this.add(ant1)
    
    const ant2 = this.scene.add.rectangle(6, -20, 2, 12, 0x888888)
    ant2.setOrigin(0.5)
    this.add(ant2)
    
    // 红灯
    const redLight1 = this.scene.add.circle(-6, -24, 3, 0xff0000)
    redLight1.setOrigin(0.5)
    this.add(redLight1)
    
    const redLight2 = this.scene.add.circle(6, -24, 3, 0xff0000)
    redLight2.setOrigin(0.5)
    this.add(redLight2)

    // 闪烁动画
    this.scene.tweens.add({
      targets: [light1, light2],
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    })
  }

  takeDamage(amount) {
    this.health -= amount
    
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true
    })

    if (this.health <= 0) {
      this.explode()
    }
  }

  explode() {
    this.scene.tweens.add({
      targets: this,
      scale: 2,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.destroy()
      }
    })
  }
}
