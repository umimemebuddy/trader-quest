import Phaser from 'phaser'
import GameScene from './scenes/GameScene'
import ShowHandScene from './scenes/ShowHandScene'
import { CONFIG } from './config.js'

console.log('[MAIN] Starting game initialization')

const config = {
  type: Phaser.AUTO,
  width: CONFIG.SCREEN_WIDTH,
  height: CONFIG.SCREEN_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [GameScene, ShowHandScene]
}

console.log('[MAIN] Config created, width:', CONFIG.SCREEN_WIDTH, 'height:', CONFIG.SCREEN_HEIGHT)

// 游戏就绪标志
window.gameReady = false

try {
  console.log('[MAIN] Creating Phaser.Game instance...')
  window.game = new Phaser.Game(config)
  window.gameReady = true
  console.log('[MAIN] Phaser.Game created successfully')
  
  // 等待玩家点击开始
  const startBtn = document.getElementById('start-btn')
  const loadingScreen = document.getElementById('loading-screen')
  const statusEl = document.querySelector('.loading-status')
  
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (loadingScreen) {
        loadingScreen.style.transition = 'opacity 0.8s ease'
        loadingScreen.style.opacity = '0'
        setTimeout(() => {
          loadingScreen.style.display = 'none'
        }, 800)
      }
    })
  }
  
  // 状态文字动画
  const loadingMessages = [
    'SYSTEM READY',
    'AWAITING PLAYER',
    'READY TO LAUNCH',
    'PRESS START'
  ]
  let msgIndex = 0
  if (statusEl) {
    setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingMessages.length
      statusEl.textContent = loadingMessages[msgIndex]
    }, 800)
  }
  
} catch (error) {
  console.error('Game initialization error:', error)
  document.body.innerHTML += `<div style="color:red;padding:20px;">Error: ${error.message}</div>`
}
