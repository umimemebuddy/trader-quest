export const CONFIG = {
  GAME_WIDTH: 3000,
  GAME_HEIGHT: 2200,
  SCREEN_WIDTH: 1200,
  SCREEN_HEIGHT: 800,

  PLAYER: {
    SIZE: 30,
    SPEED: 250,
    MAX_HEALTH: 100,
    ENERGY_MAX: 100,
    ENERGY_REGEN: 30,
    ATTACK_COST: 8,
    ATTACK_COOLDOWN: 100
  },

  ENEMY: {
    // 原有敌人
    KOL: {
      SIZE: 26,
      SPEED: 60,
      HEALTH: 20,
      DAMAGE: 8,
      COIN_VALUE: 35,
      COLOR: 0xff69b4
    },
    TRADER: {
      SIZE: 20,
      SPEED: 90,
      HEALTH: 10,
      DAMAGE: 5,
      COIN_VALUE: 20,
      COLOR: 0x90ee90
    },
    WHALE: {
      SIZE: 40,
      SPEED: 40,
      HEALTH: 60,
      DAMAGE: 15,
      COIN_VALUE: 100,
      COLOR: 0x9932cc,
      SPAWN_WAVE: 3
    },
    MINER: {
      SIZE: 24,
      SPEED: 50,
      HEALTH: 25,
      DAMAGE: 0,
      COIN_VALUE: 45,
      COLOR: 0xffa500,
      SPAWN_WAVE: 5
    },
    HACKER: {
      SIZE: 35,
      SPEED: 150,
      HEALTH: 80,
      DAMAGE: 30,
      COIN_VALUE: 120,
      COLOR: 0xff0000,
      SPAWN_WAVE: 1,
      MIN_MINERS: 10,
      ATTACK_RANGE: 150,
      ATTACK_COUNT: [2, 5],
      MINER_DAMAGE: [60, 120]
    },
    // 新增敌人
    BOSS: {
      SIZE: 55,
      SPEED: 35,
      HEALTH: 150,
      DAMAGE: 25,
      COIN_VALUE: 250,
      COLOR: 0x8b0000,
      SPAWN_WAVE: 8
    },
    GHOST: {
      SIZE: 28,
      SPEED: 80,
      HEALTH: 15,
      DAMAGE: 12,
      COIN_VALUE: 55,
      COLOR: 0xaaeeff,
      SPAWN_WAVE: 4,
      PHASE: true  // 可穿墙
    },
    BOMBER: {
      SIZE: 22,
      SPEED: 100,
      HEALTH: 30,
      DAMAGE: 0,
      COIN_VALUE: 30,
      COLOR: 0xff6600,
      SPAWN_WAVE: 6,
      EXPLOSION_DAMAGE: 40,
      EXPLOSION_RADIUS: 80
    },
    LIGHTNING: {
      SIZE: 24,
      SPEED: 120,
      HEALTH: 18,
      DAMAGE: 20,
      COIN_VALUE: 60,
      COLOR: 0xffff00,
      SPAWN_WAVE: 3
    },
    // 审计员 - 冻结玩家技能
    AUDITOR: {
      SIZE: 30,
      SPEED: 45,
      HEALTH: 35,
      DAMAGE: 0,
      COIN_VALUE: 25,
      COLOR: 0x8888ff,
      SPAWN_WAVE: 4,
      FREEZE_DURATION: 3000,  // 冻结3秒
      FREEZE_COOLDOWN: 8000,  // 8秒后才能再次冻结
      FREEZE_RANGE: 100      // 冻结范围
    },
    MIST: {
      SIZE: 30,
      SPEED: 45,
      HEALTH: 40,
      DAMAGE: 0,
      COIN_VALUE: 65,
      COLOR: 0x9966ff,
      SPAWN_WAVE: 5,
      INVISIBLE: true  // 隐身效果
    },
    // 配送员 - 快速偷金币
    DELIVERY: {
      SIZE: 22,
      SPEED: 180,
      HEALTH: 15,
      DAMAGE: 0,
      COIN_VALUE: 25,
      COLOR: 0xffc107,
      SPAWN_WAVE: 2,
      STEAL_AMOUNT: 15,  // 偷取金币
      STEAL_COOLDOWN: 5000
    },
    // SVIP - 需要打破护盾才能造成伤害
    SVIP: {
      SIZE: 32,
      SPEED: 50,
      HEALTH: 40,
      DAMAGE: 20,
      COIN_VALUE: 100,
      COLOR: 0xffd700,
      SPAWN_WAVE: 6,
      SHIELD: 80,
      SHIELD_REGEN: 5
    },
    // NFT - 击杀后分裂
    NFT: {
      SIZE: 28,
      SPEED: 70,
      HEALTH: 30,
      DAMAGE: 10,
      COIN_VALUE: 75,
      COLOR: 0x00ffcc,
      SPAWN_WAVE: 4,
      SPLIT_COUNT: 2,
      SPLIT_HEALTH: 10
    },
    // DEFI - 吸取玩家能量
    DEFI: {
      SIZE: 26,
      SPEED: 60,
      HEALTH: 25,
      DAMAGE: 0,
      COIN_VALUE: 55,
      COLOR: 0x9966cc,
      SPAWN_WAVE: 3,
      DRAIN_AMOUNT: 15,
      DRAIN_RANGE: 120,
      DRAIN_COOLDOWN: 3000
    },
    // 传销者 - 吸引周围敌人加速
    Pyramid: {
      SIZE: 30,
      SPEED: 40,
      HEALTH: 45,
      DAMAGE: 0,
      COIN_VALUE: 85,
      COLOR: 0xff3366,
      SPAWN_WAVE: 7,
      AURA_RANGE: 150,
      SPEED_BOOST: 2.0
    }
  },

  // 随机事件配置
  RANDOM_EVENTS: {
    LIGHTNING_STORM: {
      DAMAGE: 15,
      DURATION: 8000,
      INTERVAL: 500
    },
    POISON_ZONE: {
      DAMAGE: 5,
      DURATION: 10000,
      RADIUS: 150
    },
    FIRE_CIRCLE: {
      DAMAGE: 8,
      DURATION: 6000,
      RADIUS: 100
    },
    ENERGY_DRAIN: {
      DRAIN: 20,
      DURATION: 5000
    },
    COIN_RAIN: {
      AMOUNT: 50,
      COUNT: 10
    }
  },

  // 武器等级 - 交易主题
  WEAPON: {
    LEVELS: [
      { damage: 15, speed: 450, cooldown: 150, name: '韭菜刀', color: 0x90ee90, text: 'BUY' },
      { damage: 25, speed: 500, cooldown: 130, name: '分析师', color: 0x00ff88, text: 'HODL' },
      { damage: 40, speed: 560, cooldown: 110, name: '交易员', color: 0x00ffff, text: 'SELL' },
      { damage: 60, speed: 620, cooldown: 95, name: '鲸鱼炮', color: 0xffd700, text: 'MOON' },
      { damage: 90, speed: 700, cooldown: 80, name: '庄家', color: 0xff6600, text: 'PUMP' },
      { damage: 130, speed: 800, cooldown: 65, name: '镰刀王', color: 0xff3366, text: 'DUMP' },
      { damage: 180, speed: 900, cooldown: 50, name: '巨鲸', color: 0x9932cc, text: 'WHALE' },
      { damage: 250, speed: 1000, cooldown: 40, name: '币神', color: 0xff00ff, text: 'TO THE MOON' },
      { damage: 350, speed: 1150, cooldown: 30, name: '中本聪', color: 0xffff00, text: 'BITCOIN' },
      { damage: 500, speed: 1300, cooldown: 20, name: '神级', color: 0xffffff, text: '$$$WIN$$$' }
    ],
    UPGRADE_COST: [80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480]  // 升级成本
  },

  WAVE: {
    BASE_ENEMIES: 3,
    ENEMIES_PER_WAVE: 2,
    SPAWN_INTERVAL: 3000,
    WAVE_CLEAR_BONUS: 30
  },

  COIN: {
    SIZE: 12,
    VALUE: 5,
    LIFETIME: 8000,
    FADE_START: 6000
  },

  MINER: {
    COST: 80,
    SIZE: 35,
    RANGE: 200,
    DAMAGE: 15,
    ATTACK_INTERVAL: 600,
    INCOME_RATE: 8  // 每秒被动金币收入
  },

  BULL_BEAR: {
    INTERVAL: 25000,
    COIN_MULTIPLIER: {
      BULL: 3,
      NEUTRAL: 1,
      BEAR: 0.5
    }
  },

  SHOP: {
    APPEAR_CHANCE: 0.5,
    DURATION: 15000,
    ITEMS: [
      { name: '治疗药水', cost: 30, effect: 'heal', value: 40 },
      { name: '治疗药剂', cost: 60, effect: 'heal', value: 80 },
      { name: '能量饮料', cost: 25, effect: 'energy', value: 60 },
      { name: '能量结晶', cost: 50, effect: 'energy', value: 100 },
      { name: '攻击增强', cost: 60, effect: 'damage', value: 3, duration: 20000 },
      { name: '超级攻击', cost: 120, effect: 'damage', value: 8, duration: 15000 },
      { name: '护盾', cost: 50, effect: 'shield', value: 50, duration: 15000 },
      { name: '无敌护盾', cost: 100, effect: 'shield', value: 100, duration: 20000 },
      { name: '武器升级', cost: 150, effect: 'weapon_upgrade', value: 1 },
      { name: '散弹武器', cost: 100, effect: 'spread_shot', duration: 30000 },
      { name: '激光武器', cost: 200, effect: 'laser_shot', duration: 20000 }
    ]
  },

  COMBO: {
    TIMEOUT: 4000,
    MULTIPLIERS: { 5: 1.5, 10: 2, 20: 3, 50: 5 },
    DECAY_PENALTY: 0.3
  },

  COLORS: {
    BULL: 0x00ff88,
    BEAR: 0xff4444,
    NEUTRAL: 0xffaa00,
    UI_BG: 0x1a1a2e,
    UI_TEXT: 0xffffff,
    COIN: 0xffd700
  },

  // Show Hand 梭哈模式配置 - 买币交易
  SHOW_HAND: {
    TRIGGERS: [10000, 30000, 50000, 100000],
    COUNTDOWN_SECONDS: 5,
    COINS: [
      // 低风险稳健币
      { id: 'btc', name: 'BTC', fullName: 'Bitcoin', multiplier: 1.3, color: 0x2d5a27, textColor: '#6fcf97', risk: 1 },
      { id: 'eth', name: 'ETH', fullName: 'Ethereum', multiplier: 1.5, color: 0x3d6a37, textColor: '#6fcf97', risk: 2 },
      { id: 'bnb', name: 'BNB', fullName: 'Binance', multiplier: 1.8, color: 0x4d7a47, textColor: '#f2c94c', risk: 3 },
      { id: 'sol', name: 'SOL', fullName: 'Solana', multiplier: 2.2, color: 0x5d8a57, textColor: '#f2c94c', risk: 4 },
      { id: 'ada', name: 'ADA', fullName: 'Cardano', multiplier: 2.5, color: 0x6d9a67, textColor: '#f2c94c', risk: 5 },
      // 中等风险
      { id: 'dot', name: 'DOT', fullName: 'Polkadot', multiplier: 3.0, color: 0x8d8a47, textColor: '#f2994a', risk: 6 },
      { id: 'avax', name: 'AVAX', fullName: 'Avalanche', multiplier: 4.0, color: 0x9d7a57, textColor: '#f2994a', risk: 7 },
      // 高风险高收益
      { id: 'doge', name: 'DOGE', fullName: 'Dogecoin', multiplier: 5.0, color: 0xad5a47, textColor: '#eb5757', risk: 8 },
      { id: 'shib', name: 'SHIB', fullName: 'Shiba', multiplier: 8.0, color: 0xbd4a57, textColor: '#eb5757', risk: 9 },
      { id: 'pepe', name: 'PEPE', fullName: 'Pepecoin', multiplier: 10.0, color: 0xcd3a67, textColor: '#eb5757', risk: 10 }
    ],
    // 概率权重（按multiplier排序，低倍率高中奖率）
    ODDS: {
      1: 25,   // ×1.3
      2: 20,   // ×1.5
      3: 18,   // ×1.8
      4: 14,   // ×2.2
      5: 10,   // ×2.5
      6: 7,    // ×3.0
      7: 4,    // ×4.0
      8: 1.5,  // ×5.0
      9: 0.4,  // ×8.0
      10: 0.1  // ×10.0
    }
  }
}
