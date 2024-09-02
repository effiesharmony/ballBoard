'use strict'

const WALL = 'WALL'
const FLOOR = 'FLOOR'
const COOKIE = 'COOKIE'
const GAMER = 'GAMER'
const GLUE = 'GLUE'
const PORTAL = 'PORTAL'

const GAMER_IMG = '<img src="img/kitty.png">'
const COOKIE_IMG = '<img src="img/cookie.png">'
const GLUE_IMG = '<img src="img/glue.png">'

// Model:
var gCookieInter
var gGlueInter
var gBoard
var gGamerPos
var gCookieCounter = 0
var gIsVictory = false
var gYayAudio = new Audio('audio/yay-6120.mp3')
var gUhOhAudio = new Audio('audio/e-oh-91679.mp3')
var gIsStuck = false


function onInitGame() {
    gGamerPos = { i: 2, j: 9 }
    gBoard = buildBoard()
    gCookieInter = setInterval(addCookie, 2000)
    gGlueInter = setInterval(addGlue, 5000)
    renderBoard(gBoard)
}

function restart() {
    var elVictory = document.querySelector('.victory')
    elVictory.style.display = 'none'
    gCookieCounter = 0
    var elCookiesCounter = document.querySelector('.cookiecounter')
    elCookiesCounter.innerText = gCookieCounter
    gIsVictory = false
    onInitGame()
}

function buildBoard() {
    // DONE: Create the Matrix 10 * 12 
    // DONE: Put FLOOR everywhere and WALL at edges
    // DONE: Place the gamer and two balls
    const board = []
    const rowsCount = 10
    const colsCount = 12
    for (var i = 0; i < rowsCount; i++) {
        board[i] = []
        for (var j = 0; j < colsCount; j++) {
            board[i][j] = { type: FLOOR, gameElement: null }
            if (i === 0 || i === rowsCount - 1 ||
                j === 0 || j === colsCount - 1) {
                board[i][j].type = WALL
            }
        }
    }

    board[0][5].type = PORTAL
    board[0][5].gameElement = null
    board[9][5].type = PORTAL
    board[9][5].gameElement = null
    board[5][0].type = PORTAL
    board[5][0].gameElement = null
    board[5][11].type = PORTAL
    board[5][11].gameElement = null

    board[gGamerPos.i][gGamerPos.j].gameElement = GAMER

    board[5][5].gameElement = COOKIE
    board[7][2].gameElement = COOKIE
    return board
}

function findEmptyCells() {
    var emptyCells = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].gameElement === null && gBoard[i][j].type === FLOOR) {
                emptyCells.push({ i: i, j: j })
            }
        }
    }
    return emptyCells
}

function addCookie() {
    var emptyCells = findEmptyCells()
    var cookiePos = emptyCells.splice(getRandomIntInclusive(0, emptyCells.length - 1), 1)[0]

    gBoard[cookiePos.i][cookiePos.j].gameElement = COOKIE
    renderCell(cookiePos, COOKIE_IMG)
    countNegs()
}

function addGlue() {
    var emptyCells = findEmptyCells()
    var gluePos = emptyCells.splice(getRandomIntInclusive(0, emptyCells.length - 1), 1)[0]
    gBoard[gluePos.i][gluePos.j].gameElement = GLUE
    renderCell(gluePos, GLUE_IMG)
    setTimeout(() => {
        if (gGamerPos.i !== gluePos.i && gGamerPos.j !== gluePos.j) {
            gBoard[gluePos.i][gluePos.j].gameElement = null
            renderCell(gluePos, '')
        }
    }, 3000)
}

//* Render the board to an HTML table
function renderBoard(board) {

    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            const currCell = board[i][j]
            var cellClass = getClassName({ i: i, j: j }) // cell-i-j floor

            if (currCell.type === FLOOR) cellClass += ' floor'
            else if (currCell.type === WALL) {
                cellClass += ' wall'
            } else if (currCell.type === PORTAL) {
                cellClass += ' portal'
            }


            strHTML += `<td class="cell ${cellClass}" onclick="moveTo(${i}, ${j})" >`

            if (currCell.gameElement === GAMER) {
                strHTML += GAMER_IMG
            } else if (currCell.gameElement === COOKIE) {
                strHTML += COOKIE_IMG
            }

            strHTML += '</td>'
        }
        strHTML += '</tr>'
    }
    // console.log(strHTML)
    const elBoard = document.querySelector('.board')
    elBoard.innerHTML = strHTML
}

function moveInPortals(i, j) {
    if (i < 0) i = 9
    if (i > 9) i = 0
    if (j < 0) j = gBoard[i].length - 1
    if (j > gBoard[i].length - 1) j = 0
    return { i, j }
}


//* Move the player to a specific location
function moveTo(i, j) {

    if (!gIsStuck) {

        if (i < 0 || j < 0 || i > gBoard.length - 1 || j > gBoard.length - 1) {
            const newPos = moveInPortals(i, j)
            i = newPos.i
            j = newPos.j
        }

        const targetCell = gBoard[i][j]
        if (targetCell.type === WALL) return

        if (targetCell.gameElement === GLUE) {
            gUhOhAudio.play()
            gIsStuck = true
            setTimeout(() => { gIsStuck = false }, 3000)
        }

        //* Calculate distance to make sure we are moving to a neighbor cell
        const iAbsDiff = Math.abs(i - gGamerPos.i)
        const jAbsDiff = Math.abs(j - gGamerPos.j)

        //* If the clicked Cell is one of the four allowed
        if ((iAbsDiff === 1 && jAbsDiff === 0) || (jAbsDiff === 1 && iAbsDiff === 0) || targetCell.type === PORTAL) {

            if (targetCell.gameElement === COOKIE) {
                gYayAudio.play()
                gCookieCounter++
                var elCookieCounter = document.querySelector('.cookiecounter')
                elCookieCounter.innerText = gCookieCounter
                gIsVictory = checkVictory()
            }

            //* REMOVE FROM LAST CELL
            // update the MODEl
            gBoard[gGamerPos.i][gGamerPos.j].gameElement = null
            // update the DOM
            renderCell(gGamerPos, '')


            //* ADD TO NEXT CELL
            // update the MODEl
            gBoard[i][j].gameElement = GAMER
            gGamerPos = { i, j }
            // update the DOM
            renderCell(gGamerPos, GAMER_IMG)

        } else {
            console.log('TOO FAR', iAbsDiff, jAbsDiff)
        }
        countNegs()
        victoryMsg()
    }
}

function victoryMsg() {
    if (checkVictory()) {
        clearInterval(gCookieInter)
        clearInterval(gGlueInter)
        var elVictory = document.querySelector('.victory')
        elVictory.style.display = 'block'
    }
}

function checkVictory() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++)
            if (gBoard[i][j].gameElement === COOKIE) {
                return false
            }
    }
    return true
}

//* Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
    const cellSelector = '.' + getClassName(location)
    const elCell = document.querySelector(cellSelector)
    elCell.innerHTML = value
}

//* Move the player by keyboard arrows
function onKey(ev) {
    const i = gGamerPos.i
    const j = gGamerPos.j
    // console.log('ev.code:', ev.code)
    switch (ev.code) {
        case 'ArrowLeft':
            moveTo(i, j - 1)
            break
        case 'ArrowRight':
            moveTo(i, j + 1)
            break
        case 'ArrowUp':
            moveTo(i - 1, j)
            break
        case 'ArrowDown':
            moveTo(i + 1, j)
            break
    }
}

//* Returns the class name for a specific cell
function getClassName(location) {
    const cellClass = `cell-${location.i}-${location.j}`
    return cellClass
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}


function countNegs() {

    var negsCount = 0
    for (var i = gGamerPos.i - 1; i <= gGamerPos.i + 1; i++) {
        for (var j = gGamerPos.j - 1; j <= gGamerPos.j + 1; j++) {
            if (gBoard[i][j].gameElement === COOKIE) negsCount++
        }
    }
    var elNeighborCookies = document.querySelector('.negscount')
    elNeighborCookies.innerText = negsCount
}