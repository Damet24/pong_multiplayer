const path = require('path')
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const app = express()

let games = {}

app.set('port', process.env.PORT || 5050 )
app.use(express.static(path.join(__dirname, 'public')))

const server = app.listen(app.get('port'), () => {
  console.log('server on port', app.get('port'))
})

const socketIO = require('socket.io')
const io = socketIO(server)

io.on('connect', socket => {
  console.log('new connection', socket.id)

  let room = uuidv4()
  let excRoom = ''
  let playerIndex = ''
  let player = {
    x: 0,
    y: 0,
    playerId: socket.id
  }

  function initPlayer(){
    games[room] = {}
    player.x = -30
    player.y = 200
    games[room]['player1'] = player
    playerIndex = 'player1'
    excRoom = room
  }

  if(Object.keys(games).length == 0){
    initPlayer()
  }
  else{

    let createNewRoom = true
    let rooms = Object.keys(games)

    for(index of rooms){
      if(Object.keys(games[index]).length == 1){
        createNewRoom = false
        player.x = 30
        player.y = 200
        games[index]['player2'] = player
        playerIndex = 'player2'
        excRoom = index

        console.log(games[index])
        let p1id = games[index].player1.playerId
        let p2id = games[index].player2.playerId

        io.to(p1id).emit('gameReady')
        io.to(p2id).emit('gameReady')
        break
      }
    }

    if(createNewRoom){
      initPlayer()
    }
  }

  socket.emit('currentPlayers', {roomId: excRoom, room: games[excRoom]})
  socket.broadcast.emit('newPlayer', games[excRoom]['player2'])

  socket.on('disconnect', () => {
    console.log(`user ${playerIndex} has disconnect`)

    if(playerIndex == 'player1'){

      if(Object.keys(games[excRoom]).length == 1){
        delete games[excRoom]
      }
      else {
        games[excRoom][playerIndex] = games[excRoom]['player2']
        delete games[excRoom]['player2']
        io.to(games[excRoom][playerIndex].playerId).emit('exitGame')
      }
    }
    else {
      if(Object.keys(games[excRoom]).length == 1){
        delete games[excRoom]
      }
      else {
        delete games[excRoom]['player2']
        io.to(games[excRoom]['player1'].playerId).emit('exitGame')
      }
    }

    io.emit('user-disconnect', socket.id)
  })

  // socket.on('playerMovement', movementData => {
    // players[socket.id].x = movementData.x
    // players[socket.id].y = movementData.y

    // socket.broadcast.emit('playerMoved', players[socket.id])
  // })
})
