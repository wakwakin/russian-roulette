const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const httpServer = require('http').createServer(app)
const WebSocket = require('ws')

const server = new WebSocket.Server({ server: httpServer })
const Users = require('./models/users')
const Records = require('./models/records')

server.on('connection', socket => {
  app.post('/user/logout', async (req, res) => {
    await Users.findOneAndUpdate({ username: req.body.user }, { matching: false, online: false, enemy: '' })
    await Records.findOne({ match_id: req.body.match_id, winner: 'TBD' }).then(async username => {
      if (username) {
        if (username.username == req.body.user) {
          await Records.findOneAndUpdate({ match_id: req.body.match_id }, { winner: username.enemy })
          await Users.findOne({ username: username.enemy }).then(async winner_result => {
            await Users.findOneAndUpdate({ username: username.enemy }, { sr: winner_result.sr + 20 })
          })
          await Users.findOne({ username: username.username }).then(async loser_result => {
            if (loser_result.sr > 0 && loser_result.sr - 20 > 0) {
              await Users.findOneAndUpdate({ username: username.username }, { sr: loser_result.sr - 20 })
            }
          })
          socket.send(JSON.stringify({ match_id: req.body.match_id, player: req.body.player, dead: true, winner: username.enemy }))
        } else {
          await Records.findOneAndUpdate({ match_id: req.body.match_id }, { winner: username.username })
          await Users.findOne({ username: username.username }).then(async winner_result => {
            await Users.findOneAndUpdate({ username: username.username }, { sr: winner_result.sr + 20 })
          })
          await Users.findOne({ username: username.enemy }).then(async loser_result => {
            if (loser_result.sr > 0 && loser_result.sr - 20 >= 0) {
              await Users.findOneAndUpdate({ username: username.enemy }, { sr: loser_result.sr - 20 })
            }
          })
          socket.send(JSON.stringify({ match_id: req.body.match_id, player: req.body.player, dead: true, winner: username.username }))
        }
      }
    })
  })
  socket.on('message', message => {
    server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`${ message }`)
      }
    })
  })
})

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.use(express.static(__dirname + '/public'))
app.use(express.urlencoded({
  extended: false
}))

app.get('/', (req, res) => {
  res.render('index', {
    logged_in: false
  })
})

app.post('/user/find', async (req, res) => {
  if (!checkUser(req.body.username, req.body.password)) {
    return res.send({ success: false, message: 'Incomplete input' })
  }

  await Users.findOne({ username: req.body.username }).then(async result => {
    if (result) {
      await bcrypt.compare(req.body.password, result.password, async (err, hash) => {
        if (hash) {
          await Users.findOneAndUpdate({ username: req.body.user }, { online: true })
          return res.send({ success: true, message: 'Login successfully' })
        }
        return res.send({ success: false, message: 'Login failed' })
      })
    } else {
      return res.send({ success: false, message: 'No user found'})
    }
  })
})
app.post('/user/create', async (req, res) => {
  if (!checkUser(req.body.username, req.body.password)) {
    return res.send({ success: false, message: 'Incomplete input' })
  }
  await Users.findOne({ username: req.body.username }).then(async result => {
    if (result) return res.send({ success: false, message: 'User already exist'})

    await bcrypt.hash(req.body.password, 10, async (err, hash) => {
      if (err) console.log(err)

      const newUser = new Users({
        username: req.body.username,
        password: hash,
        sr: 0,
        matching: false
      })

      await newUser.save()
      return res.send({ success: true, message: 'Registration done' })
    })
  })
})
app.post('/user/matching', async (req, res) => {
  await Users.findOneAndUpdate({
    username: req.body.username
  }, {
    matching: req.body.matching
  })

  await Users.findOne({ username: req.body.username }).then(async result => {
    console.log(result)
    if (result.matching == 'true') {
      await Users.find({ matching: 'true' }).then(async users => {
        if (!users) return res.send({ success: false, enemy: 'NONE' })
        for (i = 0; i < users.length; i++) {
          if (users[i].username != req.body.username) {
            try {
              await Users.findOneAndUpdate({ username: users[i].username }, { enemy: req.body.username, matching: false })
              await Users.findOneAndUpdate({ username: req.body.username }, { enemy: users[i].username, matching: false })
              var bullet = [0, 0, 0, 0, 0, 0]
              const rnd = parseInt(Math.random() * bullet.length)
              bullet[rnd] = 1
              const id = Date.now()
              const newRecord = new Records({
                username: users[i].username,
                enemy: req.body.username,
                winner: 'TBD',
                bullets: bullet.toString(),
                match_id: id,
                turns: 0
              })
              await newRecord.save()
              return res.send({ success: true, enemy: users[i].username, match_id: id })
            } catch (e) {
              console.log(e)
              return res.send({ success: false })
            }
          }
        }
      })
    } else {
      res.send({ success: false, enemy: 'NONE' })
    }
  })
})
app.post('/user/set', async (req, res) => {
  await Records.findOne({ match_id: req.body.match_id }).then(async result => {
    const bullets = result.bullets.split(',')
    console.log('Match ID: ' + req.body.match_id + ' Turn: ' + result.turns)
    let theTurns = result.turns + 1
    if (result.player != req.body.player) {
      await Records.findOneAndUpdate({ match_id: req.body.match_id }, { player: req.body.player, turns: theTurns })
      if (bullets[theTurns - 1] == 0) {
        return res.send({ player: req.body.player, dead: false, winner: '', turn: theTurns })
      } else {
        await Records.findOne({ match_id: req.body.match_id }).then(async records => {
          let winner = ''
          let loser = ''
          if (records.username != req.body.player) {
            winner = records.username
            loser = records.enemy
          } else {
            winner = records.enemy
            loser = records.username
          }

          await Records.findOneAndUpdate({ match_id: req.body.match_id }, { winner: winner })
          await Users.findOne({ username: winner }).then(async winner_result => {
            await Users.findOneAndUpdate({ username: winner }, { sr: winner_result.sr + 20 })
          })
          await Users.findOne({ username: loser }).then(async loser_result => {
            if (loser_result.sr > 0 && loser_result.sr - 20 >= 0) {
              await Users.findOneAndUpdate({ username: loser }, { sr: loser_result.sr - 20 })
            }
          })
          return res.send({ player: req.body.player, dead: true, winner: winner, turn: theTurns })
        })
      }
    } else {
      return res.send({ player: '', winner: '', turn: theTurns })
    }
    res.destroy()
  })
})
app.post('/rankings', async (req, res) => {
  const username = []
  const sr = []
  const you = {}
  let findYou = false

  await Users.find({}).sort({ sr: -1 }).then(result => {
    let users = 50
    if (result.length < 50) users = result.length

    for (i = 0; i < users; i++) {
      if (result[i].username == req.body.username) {
        username.push(result[i].username + '(You)')
        sr.push(result[i].sr)
        you.username = result[i].username,
        you.sr = result[i].sr,
        you.rank = i + 1
        findYou = true
      } else {
        username.push(result[i].username)
        sr.push(result[i].sr)
      }
    }
  })

  if (!findYou) {
    await Users.findOne({ username: req.body.username }).then(result => {
      you.username = result.username,
      you.sr = result.sr,
      you.rank = 'UR'
    })
  }

  return res.send({
    username: username,
    sr: sr,
    you: you
  })
})

function checkUser(username, password) {
  if (username == '') return false
  if (password == '') return false
  return true
}

const mongoose = require('mongoose')
mongoose.connect(process.env.DB_URI).then(() => {
  console.log('MongoDB READY')
  httpServer.listen(process.env.PORT, console.log('Port READY'))
}).catch((error) => {
  console.log(error)
})
