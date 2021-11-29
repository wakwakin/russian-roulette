const mongoose = require('mongoose')
const Schema = mongoose.Schema

const users = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  sr: {
    type: Number,
    required: true
  },
  matching: {
    type: String,
    required: true
  },
  online: {
    type: String
  },
  enemy: {
    type: String
  }
})

const Users = mongoose.model('user', users)
module.exports = Users
