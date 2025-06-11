var choiceOptions = ["Rock", "Paper", "Scissors"];
      var userScore = 0;
      var computerScore = 0;
      var drawScore = 0;
      var userInput;
      var computerInput;

      document.getElementById("rock-btn").addEventListener("click", userRock);
      document.getElementById("paper-btn").addEventListener("click", userPaper);
      document.getElementById("scissors-btn").addEventListener("click", userScissors);

      function computerChoice(items) {
          return computerInput = items[Math.floor(Math.random()*items.length)];   
      };

      function userRock(){
        userInput = "Rock";
        score(userInput, computerChoice(choiceOptions))
        document.getElementById("user-label").innerHTML = userInput
        document.getElementById("computer-label").innerHTML = computerInput
        document.getElementById("user-score").innerHTML = userScore
        document.getElementById("computer-score").innerHTML = computerScore
        document.getElementById("draw-score").innerHTML = drawScore
      };
      function userPaper(){
        userInput = "Paper";
        score(userInput, computerChoice(choiceOptions))
        document.getElementById("user-label").innerHTML = userInput
        document.getElementById("computer-label").innerHTML = computerInput
        document.getElementById("user-score").innerHTML = userScore
        document.getElementById("computer-score").innerHTML = computerScore
        document.getElementById("draw-score").innerHTML = drawScore
      };
      function userScissors(){
        userInput = "Scissors";
        score(userInput, computerChoice(choiceOptions))
        document.getElementById("user-label").innerHTML = userInput
        document.getElementById("computer-label").innerHTML = computerInput
        document.getElementById("user-score").innerHTML = userScore
        document.getElementById("computer-score").innerHTML = computerScore
        document.getElementById("draw-score").innerHTML = drawScore
      };

      function score(userResponse, computerResponse) {
        document.getElementById("win").innerHTML = ""
        document.getElementById("lose").innerHTML = ""
        document.getElementById("draw").innerHTML = ""
        if (userResponse === "Rock" && computerResponse === "Paper") {
          document.getElementById("lose").innerHTML = "You Loose"
          return computerScore += 1
        } else if (userResponse === "Paper" && computerResponse === "Scissors") {
          document.getElementById("lose").innerHTML = "You Loose"
          return computerScore += 1
        } else if (userResponse === "Scissors" && computerResponse === "Rock") {
          document.getElementById("lose").innerHTML = "You Loose"
          return computerScore += 1
        } else if (userResponse === computerResponse) {
          document.getElementById("draw").innerHTML = "Draw"
          return drawScore += 1
        } else {
          document.getElementById("win").innerHTML = "You Win"
          return userScore += 1
        }
      };