// Initialize Firebase
var config = {
apiKey: "AIzaSyADvAREo_quAUpIQuksVzEvPHBmOkFkxoQ",
authDomain: "rps-multiplayer-90877.firebaseapp.com",
databaseURL: "https://rps-multiplayer-90877.firebaseio.com",
projectId: "rps-multiplayer-90877",
storageBucket: "",
messagingSenderId: "2186547592"
};

firebase.initializeApp(config);

//create reference to firebase
database = firebase.database();

var connectedRef = database.ref(".info/connected");

var connectionsRef = database.ref("/connections");

var playersRef = database.ref("/players");

var messageRef = database.ref("/messages");

var player1Exists;
var player2Exists;

var playerNumber;
var userName;

//click event listener for name input
//listen for click of "#start" button
$("#start").on("click", function(event) {

    //prevent default
    event.preventDefault();

    //grab the value from "userNameInput" and assign it to a new variable
    userName = $("#userNameInput").val().trim();

    //remove the name input text box and start button
    $("#row1").remove();

    //add html tags for welcoming player and game status
    newRow = $("<div class='row'>");

    $(newRow).append("<div class='col-sm-12 d-flex justify-content-center align-items-center'><h5 class='mt-4' id='userName'></h5>" +
    "</div><div class='col-sm-12 d-flex justify-content-center align-items-center'><h5 class='mt-2 mb-4' id='gameStatus'></h5>" +
    "</div>");

    $("#gameComs").append(newRow);

    //read firebase players ref
    playersRef.once("value").then(function(snapshot) {

        //check for existance of player 1 and player 2
        player1Exists = snapshot.child("1").exists();
        player2Exists = snapshot.child("2").exists();

        //call function to add player to the game
        addPlayer();
    });
});

//listen for player to click on Rock, Paper, or Scissors button
$(document).on("click", ".rpsText", function() {

    var choice = this.value;

     //read firebase players/turn ref to see which players turn it is
    database.ref("/players/turn").once("value").then(function(snapshot) {

        var turn = snapshot.val();

        //actions to take if turn = 1
        if(turn=="1") {

            //load choice into firebase
            database.ref("players/1/choice").set(choice);
    
            //ensure that choice made is only visible to player 1
            if(playerNumber=="1") {
    
                //remove rps buttons for player 1
                $("#player1Choice").empty();
    
                //display image of choice
                $("#player1Choice").append("<img src='assets/images/" + choice + ".png' class='rpsImage' alt='" + choice + "'>");

            }
        
            //turn = 2 invoke results function
            database.ref("/players/turn").set("2");
            
        }
    
        //actions to take if turn = 2
        if(turn=="2") {
    
            //load choice into firebase
            database.ref("players/2/choice").set(choice);

            //remove rps buttons for player 1
            $("#player1Choice").empty();

            //remove rps buttons for player 2
            $("#player2Choice").empty();

        }
    });
});
 
//listen for value of turn to change
database.ref("/players/turn").on("value", function(snapshot){

    //actions to take if turn=1
    if(snapshot.val()=="1") {

        //remove any results still displayed from previous game
        $("#resultsCard").empty();

        //remove buttons from previous game
        $("#player1Choice").empty();
        $("#player2Choice").empty();

        //change border to indicate it's player 1's turn
        $("#player1Card").css("border", "4px solid yellow");
        $("#player2Card").css("border", "none");

        //ensures that only display for player 1 is changed
        if(playerNumber=="1") {
            //display rps buttons for player 1
            $("#player1Choice").append("<button type='button' class='btn btn:hover btn-block rpsText mb-0' value='Rock'>Rock</button>" +
            "<button type='button' class='btn btn:hover btn-block mt-0 rpsText ps mb-0' value='Paper'>Paper</button>" + 
            "<button type='button' class='btn btn:hover btn-block mt-0 rpsText ps mb-0' value='Scissors'>Scissors</button>");

            //turn status message to player 1
            $("#gameStatus").text("It's Your Turn!");
        }

        //read firebase players/2/name ref
        database.ref("/players/1/name").once("value").then(function(snapshot) {

            // retrieve name of player 1 from firebase
            var player1Name = snapshot.val();

            //ensures that only display for player 2 is changed
            if(playerNumber=="2") {

                //turn status message to player 2
                $("#gameStatus").text("Waiting for " + player1Name + " to choose.");
            }
        });
    }

     //actions to take if turn=2
    if(snapshot.val()=="2") {

        //change border to indicate it's player 2's turn
        $("#player2Card").css("border", "4px solid yellow");
        $("#player1Card").css("border", "none");

        //display rps buttons for player 21
        if(playerNumber=="2") {
            $("#player2Choice").append("<button type='button' class='btn btn:hover btn-block rpsText mb-0' value='Rock'>Rock</button>" +
            "<button type='button' class='btn btn:hover btn-block mt-0 rpsText ps mb-0' value='Paper'>Paper</button>" + 
            "<button type='button' class='btn btn:hover btn-block mt-0 rpsText ps mb-0' value='Scissors'>Scissors</button>");

            $("#gameStatus").text("It's Your Turn!");
        }

        //read firebase players/2/name ref
        database.ref("/players/2/name").once("value").then(function(snapshot) {

            // retrieve name of player 2 from firebase
            var player2Name = snapshot.val();

            //ensures that only display for player 1 is changed
            if(playerNumber=="1") {

                //turn status message to player 1
                $("#gameStatus").text("Waiting fo " + player2Name + " to choose.");
            }

        });

    }
});

//listen for player added and update display with userName
playersRef.on("child_added", function(snapshot) {

    //ensures that action is only taken if the child added is a new player
    if(snapshot.key == "1" || snapshot.key == "2") {

        //update display to indicate players name on head of player card
        $("#player" + snapshot.key).text(snapshot.val().name);

        //update display to show win/loss record for new player
        $("#p" + snapshot.key + "WL").text("wins: " + snapshot.val().wins + "  losses: " + snapshot.val().losses);
    }
});


//listen for player removed and clear player information from display
playersRef.on("child_removed", function(snapshot) {

    var childKey = snapshot.key;
    
    console.log(snapshot.key);

    if (childKey == "1" || childKey == "2") {

        //variable to capture the name of the player that disconnected
        var playersName = snapshot.child("name").val();

        //remove borders indicating whose turn it is
        $("#player1Card").css("border", "none");
        $("#player2Card").css("border", "none");

        //remove rps selection buttons
        $("#player1Choice").empty();
        $("#player2Choice").empty();

        //display message in text message box to indicate player disconnected
        $("#messageText").append("<p class='message'>" + playersName + " has disconnected.</p>");


        //remove player/turn ref from firebase
        database.ref("/players/turn").remove();

        //variable to capture disconnected players number
        var playerKey = snapshot.key;

        //actions to take if player 1 disconnected
        if (playerKey == "1") {

            //change boolean to indicate player 1 does not exist
            player1Exists == false;
        } 
        
        //actions to take if player 2 disconnected
        if (playerKey == "2") {

            //change boolean to indicate player 2 does not exist
            player2Exists == false;
        } 

        //actions to take for player that is still connected
        if (playerKey == "1" || playerKey == "2") {

            //display status to indicate that there is a need for another player
            $("#player" + playerKey).text("Waiting for player " + playerKey);

            //reset win/loss record
            $("#p" + playerKey + "WL").text("");
        }
    }
});

    //listend for child added to player 2
    database.ref("/players/2").on("child_added", function(snapshot) {

        //actions to take if player 2 has made a game choice
        if (snapshot.key == "choice") {
        
            //call function to retrieve game data for both players
            retrievePlayerData();
        }
}); 

//function to add a player to the game
function addPlayer() {

    //actions to take if neither player 1 nor player 2 exist
    if(!player1Exists && !player2Exists) {
    
        //assign new player to be player 1
        playerNumber = "1";

        //add child (1) for players and include userName, wins, losses, choice 
        database.ref("/players/1").set({
            name: userName,
            wins: 0,
            losses: 0,
        });

        //remove name input elements
        $("#addPlayer").remove();

        //message to welcome player 1
        $("#userName").text("Hi " + userName + "!  You are player 1");

        //call function to monitor connection for player 1
        monitorConnections();

    //actions to take if player 1 doesn't exist but player 2 does
    } else if (!player1Exists && player2Exists) {
    
        //assign new player to be player 1
        playerNumber = "1";

        //add child (1) for players and include userName, wins, losses, choice 
        database.ref("/players/1").set({
            name: userName,
            wins: 0,
            losses: 0,
        });

        //remove name input elements
        $("#addPlayer").remove();

        //message to welcome player 2
        $("#userName").text("Hi " + userName + "!  You are player 1");

        //call function to monitor connection for player 1
        monitorConnections();

        //set turn indicator to player 1
        database.ref("/players/turn").set("1");

    //actions to take if player 2 doesn't exist but player 1 does
    } else if (player1Exists && !player2Exists) {
    
        //assign new player to be player 2
        playerNumber = "2";

        //add child (1) for players and include userName, wins, losses, choice 
        database.ref("/players/2").set({
            name: userName,
            wins: 0,
            losses: 0,
        });

        //remove name input elements
        $("#addPlayer").remove();

        //message to welcome player 2
        $("#userName").text("Hi " + userName + "!  You are player 2");

        //call function to monitor connection for player 2
        monitorConnections();

        //set turn indicator to player 1
        database.ref("/players/turn").set("1");

    //actions to take if player both player 1 and player 2 exist
    } else {

        //remove name input elements
        $("#addPlayer").remove();

        //message that there are already 2 players
        $("#userName").text("Sorry but unfortunately there are already 2 players!  Try again later!");    
    }
}

//function to verify the state of the player's connection 
function monitorConnections() {

    // When the player's connection state changes...
    connectedRef.on("value", function(snap) {

        // If they are connected..
        if (snap.val()) {
        
            //actions to take upon disconnect
            database.ref("/players/" + playerNumber).onDisconnect().remove();
            database.ref("/players/turn").onDisconnect().remove();
            messageRef.onDisconnect().remove();
        }
    });
}

//function to retrieve player data after player 2 has made game choice
function retrievePlayerData() {

    //read once to firebase player ref
    playersRef.once("value").then(function(snapshot) {

        //variables to capture game data
        var player1Choice = snapshot.child("1").child("/choice").val();
        var player1Name = snapshot.child("1").child("/name").val();
        var player1Wins = snapshot.child("1").child("/wins").val();
        var player1Losses = snapshot.child("1").child("/losses").val();
        var player2Choice = snapshot.child("2").child("/choice").val();
        var player2Name = snapshot.child("2").child("/name").val();
        var player2Wins = snapshot.child("2").child("/wins").val();
        var player2Losses = snapshot.child("2").child("/losses").val();

        //object variable to hold game data
        var playerData={"player1Choice": player1Choice, "player1Name": player1Name, "player1Wins": player1Wins, "player1Losses": player1Losses, "player2Choice": player2Choice, "player2Name": player2Name, "player2Wins": player2Wins, "player2Losses": player2Losses};

        //call function to compute and display results
        displayResults(playerData);
    });    
}

//function to compute and display results
displayResults = function(myplayerData) {

    //read game data from object and assign to variables
    var player1Choice = myplayerData.player1Choice;
    var player2Choice = myplayerData.player2Choice;
    var player1Name = myplayerData.player1Name;
    var player2Name = myplayerData.player2Name;
    var player1Wins = myplayerData.player1Wins;
    var player2Wins = myplayerData.player2Wins;
    var player1Losses = myplayerData.player1Losses;
    var player2Losses = myplayerData.player2Losses;

    //remove rps buttons for player 1
    $("#player1Choice").empty();

    //display image of choice
    $("#player1Choice").append("<img src='assets/images/" + player1Choice + ".png' class='rpsImage' alt='" + player1Choice + "'>");

    //remove rps buttons for player 1
    $("#player2Choice").empty();

    //display image of choice
    $("#player2Choice").append("<img src='assets/images/" + player2Choice + ".png' class='rpsImage' alt='" + player2Choice + "'>");

    //game logic to determine who wins and actions to take

    if ((player1Choice === "Rock") && (player2Choice === "Scissors")) {

        player1Wins++;
        player2Losses++;
        playersRef.child("1/wins").set(player1Wins);
        playersRef.child("2/losses").set(player2Losses);
        $("#resultsCard").append("<h1 id='winner'>" + player1Name + "</h1><h1>Wins!</h1>");

    } else if ((player1Choice === "Rock") && (player2Choice === "Paper")) {

        player1Losses++;
        player2Wins++;
        playersRef.child("1/losses").set(player1Losses);
        playersRef.child("2/wins").set(player2Wins);
        $("#resultsCard").append("<h1 id='winner'>" + player2Name + "</h1><h1>Wins!</h1>");

    } else if ((player1Choice === "Scissors") && (player2Choice === "Rock")) {

        player1Losses++;
        player2Wins++;
        playersRef.child("1/losses").set(player1Losses);
        playersRef.child("2/wins").set(player2Wins);
        $("#resultsCard").append("<h1 id='winner'>" + player2Name + "</h1><h1>Wins!</h1>");

    } else if ((player1Choice === "Scissors") && (player2Choice === "Paper")) {
        
        player1Wins++;
        player2Losses++;
        playersRef.child("1/wins").set(player1Wins);
        playersRef.child("2/losses").set(player2Losses);
        $("#resultsCard").append("<h1 id='winner'>" + player1Name + "</h1><h1>Wins!</h1>");

    } else if ((player1Choice === "Paper") && (player2Choice === "Rock")) {

        player1Wins++;
        player2Losses++;
        playersRef.child("1/wins").set(player1Wins);
        playersRef.child("2/losses").set(player2Losses);
        $("#resultsCard").append("<h1 id='winner'>" + player1Name + "</h1><h1>Wins!</h1>");

    } else if ((player1Choice === "Paper") && (player2Choice === "Scissors")) {

        player1Losses++;
        player2Wins++;
        playersRef.child("1/losses").set(player1Losses);
        playersRef.child("2/wins").set(player2Wins);
        $("#resultsCard").append("<h1 id='winner'>" + player2Name + "</h1><h1>Wins!</h1>");

    } else if (player1Choice == player2Choice) {
        $("#resultsCard").append("<h1 id='winner'>Tie Game!</h1>");
    }

    $("#p1WL").text("wins: " + player1Wins + "  losses: " + player1Losses);
    $("#p2WL").text("wins: " + player2Wins + "  losses: " + player2Losses);

    //set 5 second timer before resetting display for next game
    setTimeout(function() {
        playersRef.child("turn").set("1");
        database.ref("/players/1/choice").remove();
        database.ref("/players/2/choice").remove();
    }, 5000);
}

//message function
//listen for click on "#send" button
$("#send").on("click", function() {

    //prevent default
    event.preventDefault();

    //grab text from messageInput box and assign it to a variable
    var message = $("#messageInput").val().trim();

    //clear message from input box
    $("#messageInput").val("");

    //store message in firebase
    var newMessage = messageRef.push({
        "playerNumber": playerNumber,
        "message": message
    });
});

//listen for a child added to message  
messageRef.on("child_added", function(snapshot) {
    
    //assign the value of the added child to a variable
    var message = snapshot.val().message;

    //assign the player number to a variable
    var player = snapshot.val().playerNumber;

    //action to take if player 1 is the player that sent the message
    //ensures that message will have the appropriate class for font color purposes
    if (player == "1") {

        //append message to "#messageText"
        $("#messageText").append("<p class='message1'>" + message + "</p>");

    //action to take if player 2 is the player that sent the message
    //ensures that message will have the appropriate class for font color purposes
    } else if (player == "2") {

        //append message to "#messageText"
        $("#messageText").append("<p class='message2'>" + message + "</p>");
    }
});