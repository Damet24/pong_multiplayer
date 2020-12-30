class MainScene extends Phaser.Scene {
  constructor(){
    super({key: 'MainScene'})
  }

  preload(){
    this.load.image('ball', '../assets/ball.png')
  }

  create(){

    this.cursor = this.input.keyboard.createCursorKeys()

    this.otherPlayers = this.physics.add.group()
    this.socket = io()

    this.socket.on('currentPlayers', players => {

      let playerList = Object.keys(players)

      playerList.forEach(id => {
        if(players[id].playerId === this.socket.id){
          this.addPlayer(players[id])
        }
        else { this.addOtherPlayers(players[id]) }
      })
    })

    this.socket.on('newPlayer',   playerInfo => {
      this.addOtherPlayers(playerInfo)
    })

    this.socket.on('user-disconnect', playerId => {
      let users = this.otherPlayers.getChildren()
      users.forEach(otherPlayer => {
        if(playerId === otherPlayer.playerId){
          otherPlayer.destroy()
        }
      })

    })

    this.socket.on('playerMoved', playerInfo => {
      this.otherPlayers.getChildren().forEach(otherPlayer => {
        if(playerInfo.playerId === otherPlayer.playerId){
          otherPlayer.setPosition(playerInfo.x, playerInfo.y)
        }
      })
    })
  }

  update(){


    if(this.ball){

      if(this.cursor.up.isDown){
        this.ball.setVelocityY(-100)
      }
      else if(this.cursor.down.isDown){
        this.ball.setVelocityY(100)
      }
      else if(this.cursor.left.isDown){
        this.ball.setVelocityX(-100)
      }
      else if(this.cursor.right.isDown){
        this.ball.setVelocityX(100)
      }

      let x = this.ball.x
      let y = this.ball.y

      if(this.ball.oldPosition && (x !== this.ball.oldPosition.x || y !== this.ball.oldPosition.y)){
        this.socket.emit('playerMovement', { x: this.ball.x, y: this.ball.y })
      }

      this.ball.oldPosition = { x: this.ball.x, y: this.ball.y }

    }

  }

  addPlayer(playerInfo){

    this.ball = this.physics.add.image(playerInfo.x, playerInfo.y, 'ball')
    this.ball.setBounce(0.5)
    this.ball.setDrag(100)
    this.ball.setCollideWorldBounds()
  }

  addOtherPlayers(playerInfo){
    const otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, 'ball')
    otherPlayer.playerId = playerInfo.playerId
    this.otherPlayers.add(otherPlayer)
  }

}

const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 600,
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
}

const Game = new Phaser.Game(config)
