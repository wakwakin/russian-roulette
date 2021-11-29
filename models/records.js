const mongoose = require('mongoose')
const Schema = mongoose.Schema

const records = new Schema({
  username: {
    type: String
  },
  enemy: {
    type: String
  },
  winner: {
    type: String
  },
  bullets: {
    type: String
  },
  match_id: {
    type: String
  },
  turns: {
    type: Number
  },
  player: {
    type: String
  }
})

const Records = mongoose.model('record', records)
module.exports = Records
