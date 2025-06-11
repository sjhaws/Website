var answerResistance
var answerPercentage
var keyResistance
var keyPercentage
var questionValue
var score = 0
var highscore1 = null
var highscore2 = null
var highscore3 = null
var highscore4 = null
var highscore5 = null
var timerVar
var totalSeconds
var seconds
var key1
var key2
var key3
var key4
var color1
var color2
var color3
var color4


function generateAnswer() {
  document.getElementById("menu").style.display = "none"
  document.getElementById("highScore").style.display = "none"
  document.getElementById("rules").style.display = "none"
  document.getElementById("game").style.display = "block"
  document.getElementById("rulesButton").style.display = "none"
  document.getElementById("highScoreButton").style.display = "none"
  document.getElementById("exitGameButton").style.display = "inline"
  document.getElementById("exitGameButton").innerHTML = "Exit Game"
  document.getElementById("verifiedScores").style.display = "none"
  document.getElementById("footer").style.display = "none"

  document.getElementById("one").classList.remove(color1)
  document.getElementById("labelOne").innerHTML = ""
  document.getElementById("two").classList.remove(color2)
  document.getElementById("labelTwo").innerHTML = ""
  document.getElementById("three").classList.remove(color3)
  document.getElementById("labelThree").innerHTML = ""
  document.getElementById("four").classList.remove(color4)
  document.getElementById("labelFour").innerHTML = ""
  
  document.getElementById("resistance").value=""
  document.getElementById("percentage").value=""
  
  questionValue = 5

  key1 = null
  key2 = null
  key3 = null
  key4 = null
  
  key1 = Math.floor(Math.random() * 9);
  key2 = Math.floor(Math.random() * 10);
  key3 = Math.floor(Math.random() * 10);
  key4 = Math.floor(Math.random() * 2);
  
  keyResistance = (((key1+1) * 10)+key2)*(10**key3)
  if (key4 === 0) {
    keyPercentage = 5
  } else {
    keyPercentage = 10
  }

  // document.getElementById("resistance").value=keyResistance
  // document.getElementById("percentage").value=keyPercentage
  
  if (key1 === 0){
    color1 = "brown"
  } else if (key1 === 1){
    color1 = "red"
  } else if (key1 === 2){
    color1 = "orange"
  } else if (key1 === 3){
    color1 = "yellow"
  } else if (key1 === 4){
    color1 = "green"
  } else if (key1 === 5){
    color1 = "blue"
  } else if (key1 === 6){
    color1 = "violet"
  } else if (key1 === 7){
    color1 = "grey"
  } else if (key1 === 8){
    color1 = "white"
  } else {
    color1 = "aliceblue"
  }
  
  if (key2 === 0){
    color2 = "black"
  } else if (key2 === 1){
    color2 = "brown"
  } else if (key2 === 2){
    color2 = "red"
  } else if (key2 === 3){
    color2 = "orange"
  } else if (key2 === 4){
    color2 = "yellow"
  } else if (key2 === 5){
    color2 = "green"
  } else if (key2 === 6){
    color2 = "blue"
  } else if (key2 === 7){
    color2 = "violet"
  } else if (key2 === 8){
    color2 = "grey"
  } else if (key2 === 9){
    color2 = "white"
  } else {
    color2 = "aliceblue"
  }
  
  if (key3 === 0){
    color3 = "black"
  } else if (key3 === 1){
    color3 = "brown"
  } else if (key3 === 2){
    color3 = "red"
  } else if (key3 === 3){
    color3 = "orange"
  } else if (key3 === 4){
    color3 = "yellow"
  } else if (key3 === 5){
    color3 = "green"
  } else if (key3 === 6){
    color3 = "blue"
  } else if (key3 === 7){
    color3 = "violet"
  } else if (key3 === 8){
    color3 = "grey"
  } else if (key3 === 9){
    color3 = "white"
  } else {
    color3 = "aliceblue"
  }
  
  if (key4 === 0){
    color4 = "gold"
  } else if (key4 === 1){
    color4 = "silver"
  } else {
    color4 = "aliceblue"
  }

  resistorColor()
  // submitAnswer(1,2)
}

function countTimer() {
  if (totalSeconds < 60) {
  ++totalSeconds;
  var minute = Math.floor((totalSeconds)/60);
  var seconds = totalSeconds;
  var seconds = totalSeconds - (minute*60);
  document.getElementById("timer").innerHTML = "Timer: " + seconds;
  } else {
    alert("Game Over. Your score was: " + score)
    scores()
    clearInterval(timerVar)
    if (score >= highscore1) {
      highscore5 = highscore4
      highscore4 = highscore3
      highscore3 = highscore2
      highscore2 = highscore1
      highscore1 = score
      renderHighScores()

    } else if (score >= highscore2) {
      highscore5 = highscore4
      highscore4 = highscore3
      highscore3 = highscore2
      highscore2 = score
      renderHighScores()

    } else if (score >= highscore3) {
      highscore5 = highscore4
      highscore4 = highscore3
      highscore3 = score
      renderHighScores()

    } else if (score >= highscore4) {
      highscore5 = highscore4
      highscore4 = score
      renderHighScores()

    } else if (score >= highscore5) {
      highscore5 = score
      renderHighScores()

    } else {
      renderHighScores()
    }
  }
};

function renderHighScores() {
  document.getElementById("firstScore").innerHTML = highscore1
  document.getElementById("secondScore").innerHTML = highscore2
  document.getElementById("thirdScore").innerHTML = highscore3
  document.getElementById("fourthScore").innerHTML = highscore4
  document.getElementById("fifthScore").innerHTML = highscore5
}

function verifyScores(){
  renderHighScores()
  document.getElementById("verifiedScores").style.display = "block"
}

function resistorColor() {
  document.getElementById("one").classList.add(color1)
  document.getElementById("labelOne").innerHTML = color1
  document.getElementById("two").classList.add(color2)
  document.getElementById("labelTwo").innerHTML = color2
  document.getElementById("three").classList.add(color3)
  document.getElementById("labelThree").innerHTML = color3
  document.getElementById("four").classList.add(color4)
  document.getElementById("labelFour").innerHTML = color4
}

function submitAnswer(answerResistance, answerPercentage) {
  answerResistance = document.getElementById("resistance").value
  answerPercentage = document.getElementById("percentage").value
  if (answerResistance == keyResistance && answerPercentage == keyPercentage){
    // alert("You are Correct")
    if (questionValue === 5) {
      score = score + questionValue
      document.getElementById("score").innerHTML = "Score: " + score
      document.getElementById("incorrect").style.display = "none"
      totalSeconds = totalSeconds - 1
      generateAnswer()
    } else {
      score = score + questionValue
      document.getElementById("score").innerHTML = "Score: " + score
      document.getElementById("incorrect").style.display = "none"
      generateAnswer()
    }
    document.getElementById("resistance").focus();

  } else {
    // alert("Try again")
    document.getElementById("incorrect").style.display = "block"
    if (questionValue > 1) {
      questionValue = questionValue - 1
      document.getElementById("resistance").focus();
    } else {

    }
  } 
}

function newGame() {
  document.getElementById("incorrect").style.display = "none"
  document.getElementById("footer").style.display = "none"
  score = 0
  totalSeconds = 0
  document.getElementById("score").innerHTML = "Score: " + score
  generateAnswer()
  clearInterval(timerVar)
  timerVar = setInterval(countTimer, 1000);
  document.getElementById("resistance").focus();
}

function exitGame(){
  document.getElementById("menu").style.display = "block"
  document.getElementById("highScore").style.display = "none"
  document.getElementById("rules").style.display = "none"
  document.getElementById("game").style.display = "none"
  document.getElementById("rulesButton").style.display = "inline"
  document.getElementById("highScoreButton").style.display = "inline"
  document.getElementById("exitGameButton").style.display = "none"
  document.getElementById("verifiedScores").style.display = "none"
  document.getElementById("footer").style.display = "inline-block"
  document.getElementById("timer").innerHTML = ""
  clearInterval(timerVar)
  totalSeconds=0
}

function rules() {
  document.getElementById("menu").style.display = "none"
  document.getElementById("highScore").style.display = "none"
  document.getElementById("rules").style.display = "block"
  document.getElementById("game").style.display = "none"
  document.getElementById("exitGameButton").style.display = "inline"
  document.getElementById("exitGameButton").innerHTML = "Main Menu"
  document.getElementById("verifiedScores").style.display = "none"
  document.getElementById("footer").style.display = "none"
}

function scores() { 
  document.getElementById("menu").style.display = "none"
  document.getElementById("highScore").style.display = "block"
  document.getElementById("rules").style.display = "none"
  document.getElementById("game").style.display = "none"
  document.getElementById("exitGameButton").style.display = "inline"
  document.getElementById("exitGameButton").innerHTML = "Main Menu"
  document.getElementById("verifiedScores").style.display = "none"
  document.getElementById("footer").style.display = "none"
}

document.getElementById("newGameButton").addEventListener("click", newGame);
document.getElementById("next").addEventListener("click", submitAnswer)
document.getElementById("exitGameButton").addEventListener("click", exitGame)
document.getElementById("rulesButton").addEventListener("click", rules)
document.getElementById("highScoreButton").addEventListener("click", scores)
document.getElementById("recalculate").addEventListener("click", verifyScores)

var input = document.getElementById("percentage");

input.addEventListener("keyup", function(event) {
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    document.getElementById("next").click();
  }
});
