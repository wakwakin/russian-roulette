const socket = new WebSocket(`ws://${ window.location.hostname }:${ window.location.port }`)
let logged_in = ''
var your_match_id = ''
let turns = []
let canClick = false
const pew = document.getElementById('pew')
const oof = document.getElementById('oof')
const reload = document.getElementById('reload')
const yeahboi = document.getElementById('yeahboi')
const idle = document.getElementById('idle')

socket.onmessage = ({ data }) => {
  try {
    const received = JSON.parse(data)
    if (received.enemy == logged_in || received.you == logged_in) {
      your_match_id = received.match_id
      turns = []
      $('.rr-modal').css('display', 'block')
      $('.rr-modal span').text('Match found!')
      $('.rr-play-result span').text('Press the gun to fire!')
      setTimeout(function() {
        $('.rr-modal').css('display', 'none')
      }, 1000)
      $('#rr-find-match').text('Match found!')
      $('#rr-find-match').attr('disabled', 'true')
      $('.rr-rounds').css('display', 'block')
      $('.rr-label').css('display', 'block')
      $('#rr-gun').css('display', 'block')
      for (var i = 1; i <= 6; i++) {
        $(`#rr-${ i }`).removeClass('fa-check')
        $(`#rr-${ i }`).removeClass('fa-skull')
        $(`#rr-${ i }`).addClass('fa-minus')
        $(`#rr-${ i }`).css('color', '#000')
      }
      $('.rr-label span').text('Adding bullet to the gun')
      setTimeout(function() {
        $('#rr-find-match').css('display', 'none')
        $('#rr-gun').removeClass('rr-default')
        $('#rr-gun').addClass('rr-reload-2')
        reload.pause()
        reload.currentTime = 0
        reload.play()
        setTimeout(function() {
          $('#rr-gun').removeClass('rr-reload-2')
          $('#rr-gun').addClass('rr-reload-3')
          setTimeout(function() {
            $('#rr-gun').removeClass('rr-reload-3')
            $('#rr-gun').addClass('rr-reload-4')
            setTimeout(function() {
              $('#rr-gun').removeClass('rr-reload-4')
              $('#rr-gun').addClass('rr-reload-3')
              setTimeout(function() {
                $('#rr-gun').removeClass('rr-reload-3')
                $('#rr-gun').addClass('rr-reload-2')
                setTimeout(function() {
                  $('#rr-gun').removeClass('rr-reload-2')
                  $('#rr-gun').addClass('rr-reload-1')
                  setTimeout(function() {
                    $('#rr-gun').removeClass('rr-reload-1')
                    $('#rr-gun').addClass('rr-default')
                    setTimeout(function() {
                      $('.rr-label span').text('READY!!!')
                    },500)
                  }, 500)
                }, 500)
              }, 500)
            }, 500)
          }, 500)
        }, 500)
      }, 500)
    }
    if (received.match_id == your_match_id) {
      $('#rr-gun').removeClass('rr-default')
      if (!received.dead && received.winner == '') {
        $('#rr-gun').addClass('rr-miss')
        $(`#rr-${ received.turn }`).removeClass('fa-minus')
        $(`#rr-${ received.turn }`).addClass('fa-check')
        $(`#rr-${ received.turn }`).css('color', '#00FF00')
      } else if (received.dead && received.winner != '') {
        your_match_id = ''
        turns = []
        $('#rr-gun').addClass('rr-shot')
        $(`#rr-${ received.turn }`).removeClass('fa-minus')
        $(`#rr-${ received.turn }`).addClass('fa-skull')
        $(`#rr-${ received.turn }`).css('color', '#FF0000')
      }
      setTimeout(function() {
        $('#rr-gun').removeClass('rr-miss')
        $('#rr-gun').removeClass('rr-shot')
        $('#rr-gun').addClass('rr-default')
      }, 500)
      if (received.player != undefined) {
        $('.rr-label span').text(received.player + ' fired the gun')
      }
      if (received.dead && your_match_id == '') {
        if (received.winner == logged_in) {
          $('.rr-modal span').text('WINNER')
          $('.rr-label span').text('WINNER')
        } else {
          $('.rr-modal span').text('LOSER')
          $('.rr-label span').text('LOSER')
        }
        setTimeout(function() {
          $('.rr-modal').css('display', 'none')
        }, 1000)
        $('.rr-modal').css('display', 'block')
        // $('.rr-rounds').css('display', 'none')
        // $('.rr-label').css('display', 'none')
        $('#rr-gun').css('display', 'none')
        $('#rr-find-match').text('Find match')
        $('#rr-find-match').attr('playing', 'false')
        $('#rr-find-match').css('display', 'block')
        $('#rr-find-match').removeAttr('disabled')
        canClick = false
      } else if (!received.dead && your_match_id != '') {
        canClick = true
      }
    }
  } catch (error) {
    console.log(data)
  }
}

document.addEventListener('visibilitychange', function() {
  if (document.visibilityState == 'hidden') {
    $.ajax({
      url: '/user/logout',
      method: 'POST',
      data: {
        user: logged_in,
        match_id: your_match_id
      },
      success: function(result) {
        console.log(result)
      }
    })
  }
})

$(document).ready(function() {
  $('#rr-logout').css('display', 'none')
  $("#rr-username").keypress(function(e) {
    if (e.which === 32) return false
  })
  $('#rr-login').click(function() {
    if (checkInputs()) {
      $('#rr-error-message').css('display', 'inline')
      $('#rr-error-message').text('Incomplete input')
    } else {
      const user = $('#rr-username').val()
      $.ajax({
        url: '/user/find',
        method: 'POST',
        data: {
          username: user,
          password: $('#rr-password').val()
        },
        success: function(result) {
          $('#rr-error-message').css('display', 'inline')
          $('#rr-error-message').text(result.message)

          if (result.success) {
            logged_in = user
            $('#rr-rankings').click(function() {
              hideAll()
              $('.rr-rankings-page').css('display', 'block')
            })
            $('#rr-matching-online').click(function() {
              hideAll()
              $('.rr-matching-online-page').css('display', 'block')
            })
            $('#rr-logout').css('display', 'block')
            $('#rr-logout').click(function() {
              $.ajax({
                url: '/user/logout',
                method: 'POST',
                data: {
                  user: logged_in
                },
                success: function(result) {
                  console.log(result)
                }
              })
              location.replace('/')
              hideAll()
            })
            $('.rr-rankings-page').css('display', 'block')
            $('.rr-form-wrapper').css('display', 'none')
            fetchRankings(user)
            $('#rr-find-match').click(function() {
              if ($(this).attr('playing') == 'false') {
                $('#rr-find-match').text('Finding match...')
                $('#rr-find-match').attr('playing', 'true')
                $.ajax({
                  url: '/user/matching',
                  method: 'POST',
                  data: {
                    username: user,
                    matching: true
                  },
                  success: function(result) {
                    if (result.success) {
                      your_match_id = result.match_id
                      socket.send(
                        JSON.stringify ({
                          enemy: result.enemy,
                          you: user,
                          match_id: result.match_id
                        })
                      )
                    } else {
                      $('.rr-modal').css('display', 'block')
                      $('.rr-modal span').text('Encountered an error!')
                      setTimeout(function() {
                        $('.rr-modal').css('display', 'none')
                      }, 1000)
                    }
                  }
                })
              } else {
                $.ajax({
                  url: '/user/matching',
                  method: 'POST',
                  data: {
                    username: user,
                    matching: false
                  },
                  success: function(result) {
                    $('#rr-find-match').text('Matching stopped')
                    $('#rr-find-match').attr('disabled', 'true')
                    $('#rr-find-match').attr('playing', 'false')

                    setTimeout(function() {
                      $($('#rr-find-match')).text('Find match')
                      $($('#rr-find-match')).removeAttr('disabled')
                    }, 1500)
                  }
                })
              }
            })
          }
        }
      })
    }
  })
  $('#rr-register').click(function() {
    if (checkInputs()) {
      $('#rr-error-message').css('display', 'inline')
      $('#rr-error-message').text('Incomplete input')
    } else {
      $.ajax({
        url: '/user/create',
        method: 'POST',
        data: {
          username: $('#rr-username').val(),
          password: $('#rr-password').val()
        },
        success: function(result) {
          $('#rr-error-message').css('display', 'inline')
          $('#rr-error-message').text(result.message)
        }
      })
    }
  })
})

$('#rr-gun').click(function() {
  if (canClick = true) {
    fireBullet(your_match_id, logged_in)
    $('.rr-play-result span').text('')
  }
})
function checkInputs() {
  if ($('#rr-username').val() == '') return true
  if ($('#rr-password').val() == '') return true
  return false
}
function hideAll() {
  $('.rr-rankings-page').css('display', 'none')
  $('.rr-matching-online-page').css('display', 'none')
}
function fetchRankings(user) {
  $.ajax({
    url: '/rankings',
    method: 'POST',
    data: {
      username: user
    },
    success: function(result) {
      $('#rr-ranking-table').html('\
        <tr>\
          <th>Rank</th>\
          <th>Name</th>\
          <th>SR</th>\
        </tr>\
      ')
      for (var i = 0; i < result.username.length; i++) {
        $('#rr-ranking-table').append(`\
          <tr>\
            <th>#${ i + 1 }</th>\
            <th>${ result.username[i] }</th>\
            <th>${ result.sr[i] }</th>\
          </tr>\
        `)
      }
      if (result.you.rank == 'UR') {
        $('#rr-ranking-table').append(`\
          <tr>\
            <th>${ result.you.rank }</th>
            <th>${ result.you.username }(You)</th>
            <th>${ result.you.sr }</th>
          </tr>\
        `)
      } else {
        $('#rr-ranking-table').append(`\
          <tr>\
            <th>#${ result.you.rank }</th>
            <th>${ result.you.username }(You)</th>
            <th>${ result.you.sr }</th>
          </tr>\
        `)
      }
    }
  })
}
setInterval(function() {
  if (logged_in != '') {
    fetchRankings(logged_in)
  }
}, 1000)
function fireBullet(your_match_id, logged_in) {
  $.ajax({
    url: '/user/set',
    method: 'POST',
    data: {
      match_id: your_match_id,
      player: logged_in
    },
    success: function(result) {
      if (result.player != '') {
        $('.rr-label span').text(result.player + ' fired the gun')
        if (!result.dead) {
          $('#rr-gun').removeClass('rr-default')
          $('#rr-gun').addClass('rr-miss')
          pew.pause()
          pew.currentTime = 0
          pew.play()
        } else {
          $('#rr-gun').removeClass('rr-default')
          $('#rr-gun').addClass('rr-shot')
        }
        socket.send(
          JSON.stringify ({
            match_id: your_match_id,
            player: result.player,
            dead: result.dead,
            winner: result.winner,
            turn: result.turn
          })
        )
      } else {
        $('.rr-label span').text('Wait your turn')
      }
    }
  })
}
