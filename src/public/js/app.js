class Palette extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, type) {
    super(scene, x, y, type)
    scene.add.existing(this)
    scene.physics.world.enable(this)
    this.body.immovable = true
    this.body.setCollideWorldBounds(true)
  }
}

class HUD extends Phaser.Scene {
  constructor() {
    super({ key: 'hudScene', active: true })
  }
  create() {
    this.screenWidth = this.game.config.width
    this.screenHeight = this.game.config.height

    this.left = this.add.text((this.screenWidth / 2) - 100, 10, '0', { fontSize: '22pt', fill: '#fff' })
    this.right = this.add.text((this.screenWidth / 2) + 100, 10, '0', { fontSize: '22pt', fill: '#fff' })
  }
}

class Init extends Phaser.Scene {

  room = {}
  roomId = ''

  constructor() {
    super({ key: 'Init' })
    Game.socket = io()
  }

  preload(){
    this.scene.add('ScenePlay', new ScenePlay())
  }

  create(){

    this.add.text(10, 170, 'find for players...', { fontSize: '50px', fill: 'white' })

    Game.socket.on('currentPlayers', gameInfo => {
      this.roomId = gameInfo.roomId
      this.room = gameInfo.room
    })

    Game.socket.on('newPlayer', player => {
      this.room.player2 = player
    })

    Game.socket.on('gameReady', () => {
      console.log('game is ready')
    })
  }

  startGame(){
    this.scene.start('ScenePlay', { roomId: this.roomId, room: this.room })
  }
}

class ScenePlay extends Phaser.Scene {

  gameScore = { left: 0, right: 0 }
  gameState = { state: 'inGame', turn: 0 }
  gameRoom = {}

  constructor() {
    super({ key: 'ScenePlay' })
  }

  init(roomInfo){
    this.roomId = roomInfo.roomId
    this.gameRoom = roomInfo.room

    console.log(this.gameRoom)
    console.log(this.roomId)
  }

  create() {
    this.hud = this.scene.add('hudScene', new HUD)

    //set varibles
    this.screenWidth = this.game.config.width
    this.screenHeight = this.game.config.height

    // separator
    this.add.image(this.screenWidth / 2, this.screenHeight / 2, 'separator')

    //palettes
    this.left = new Palette(this, 30, this.screenHeight / 2, 'left', 'left')
    this.right = new Palette(this, this.screenWidth - 30, this.screenHeight / 2, 'right')

    //ball
    this.physics.world.setBoundsCollision(false, false, true, true)
    this.ball = this.physics.add.image(this.screenWidth / 2, this.screenHeight / 2, 'ball')
    this.ball.setBounce(1.1)
    this.ball.setCollideWorldBounds(true)
    this.setInit()

    //collisions
    this.physics.add.collider(this.ball, this.left, this.paletteColL, null, this)
    this.physics.add.collider(this.ball, this.right, this.paletteColR, null, this)

    this.leftCursor = this.input.keyboard.createCursorKeys()

    this.rightCursor = {}
    this.rightCursor.up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.rightCursor.down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)

    // socket events
    Game.socket.on('exitGame', () => {
      this.scene.start('Init')
    })
  }

  update() {
    if (this.ball.x < 0) {
      this.gameState.turn = 1
      this.hud.right.setText((this.gameScore.right += 1).toString())
      this.ball.x = this.screenWidth / 2
      this.ball.y = this.screenHeight / 2
      this.setInit()
    }
    else if (this.ball.x > this.screenWidth) {
      this.gameState.turn = -1
      this.gameScore.left += 1
      this.hud.left.setText((this.gameScore.left += 1).toString())
      this.ball.x = this.screenWidth / 2
      this.ball.y = this.screenHeight / 2
      this.setInit()
    }

    if (this.leftCursor.up.isDown) {
      this.right.body.setVelocityY(-300)
    }
    else if (this.leftCursor.down.isDown) {
      this.right.body.setVelocityY(300)
    }
    else {
      this.right.body.setVelocityY(0)
    }

    if (this.rightCursor.up.isDown) {
      this.left.body.setVelocityY(-300)
    }
    else if (this.rightCursor.down.isDown) {
      this.left.body.setVelocityY(300)
    }
    else {
      this.left.body.setVelocityY(0)
    }
  }

  setInit() {
    let R = Phaser.Math.Between(135, 225)
    let _R = 200

    if (this.gameState.turn == 0) {
      _R = Phaser.Math.Between(0, 1)
      _R = _R ? 200 : -200
    }
    else {
      _R *= this.gameState.turn
    }

    let v = this.degToVec(R, _R)
    this.ball.setVelocityX(v.x)
    this.ball.setVelocityY(-v.y)
  }

  degToVec(deg, vel) {
    let Vector = {}
    let pi = Math.PI
    deg = deg * (pi / 180)

    Vector.x = Math.cos(deg) * vel
    Vector.y = Math.sin(deg) * vel
    return Vector
  }

  paletteColR() { }
  paletteColL() { }
}

class BootLoader extends Phaser.Scene {
  constructor() {
    super({ key: 'BootLoader' })
  }
  preload() {
    this.load.image('ball', './assets/ball.png')
    this.load.image('left', './assets/left_pallete.png')
    this.load.image('right', './assets/right_pallete.png')
    this.load.image('separator', './assets/separator.png')
  }
  create() {
    this.scene.start('Init')
  }
}

const config = {
  type: Phaser.AUTO,
  width: 640,
  height: 400,
  physics: {
    default: 'arcade',
    arcade: { debug: true }
  },
  scene: [BootLoader, Init]
}

const Game = new Phaser.Game(config)
