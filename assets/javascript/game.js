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

    $("#row1").remove();

    newRow = $("<div class='row'>");

    $(newRow).append("<div class='col-sm-12 d-flex justify-content-center align-items-center'><h5 class='mt-4' id='userName'></h5>" +
    "</div><div class='col-sm-12 d-flex justify-content-center align-items-center'><h5 class='mt-2 mb-4' id='gameStatus'></h5>" +
    "</div>");

    $("#gameComs").append(newRow);

    playersRef.once("value").then(function(snapshot) {

        //check for existance of player 1 and player 2
        player1Exists = snapshot.child("1").exists();
        player2Exists = snapshot.child("2").exists();

        //call function to add player to the game
        addPlayer();
    });
});

$(document).on("click", ".rpsText", function() {

    var choice = this.value;

    database.ref("/players/turn").once("value").then(function(snapshot) {

        var turn = snapshot.val();

        if(turn=="1") {

            //load choice into firebase
            database.ref("players/1/choice").set(choice);
    
            if(playerNumber=="1") {
    
                //remove rps buttons for player 1
                $("#player1Choice").empty();
    
                //display image of choice
                $("#player1Choice").append("<img src='assets/images/" + choice + ".png' class='rpsImage' alt='" + choice + "'>");

            }
        
            //turn = 2 invoke results function
            database.ref("/players/turn").set("2");
            
        }
    
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
 

database.ref("/players/turn").on("value", function(snapshot){

    if(snapshot.val()=="1") {

        $("#resultsCard").empty();

        $("#player1Choice").empty();

        $("#player2Choice").empty();

        //change border to indicate it's player 1's turn
        $("#player1Card").css("border", "4px solid yellow");
        $("#player2Card").css("border", "none");

        //display rps buttons for player 1
        if(playerNumber=="1") {
            $("#player1Choice").append("<button type='button' class='btn btn:hover btn-block rpsText mb-0' value='Rock'>Rock</button>" +
            "<button type='button' class='btn btn:hover btn-block mt-0 rpsText ps mb-0' value='Paper'>Paper</button>" + 
            "<button type='button' class='btn btn:hover btn-block mt-0 rpsText ps mb-0' value='Scissors'>Scissors</button>");

            $("#gameStatus").text("It's Your Turn!");
        }

        database.ref("/players/1/name").once("value").then(function(snapshot) {
            var player1Name = snapshot.val();

            if(playerNumber=="2") {
                $("#gameStatus").text("Waiting for " + player1Name + " to choose.");
            }
        });
    }

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

        database.ref("/players/2/name").once("value").then(function(snapshot) {
            var player2Name = snapshot.val();

            if(playerNumber=="1") {
                $("#gameStatus").text("Waiting fo " + player2Name + " to choose.");
            }

        });

    }
});

//listen for player added and update display with userName
playersRef.on("child_added", function(snapshot) {
    
    if(snapshot.key == "1" || snapshot.key == "2") {
    
        $("#player" + snapshot.key).text(snapshot.val().name);

        $("#p" + snapshot.key + "WL").text("wins: " + snapshot.val().wins + "  losses: " + snapshot.val().losses);
    }
});


//listen for player removed and clear player information from display
playersRef.on("child_removed", function(snapshot) {

    var playersName = snapshot.child("name").val();

    //remove borders indicating whose turn it is
    $("#player1Card").css("border", "none");
    $("#player2Card").css("border", "none");

    //remove rps selection buttons
    $("#player1Choice").empty();
    $("#player2Choice").empty();
    

    if (playersName != null) {

    $("#messageText").append("<p class='message'>" + playersName + " has disconnected.</p>");

    }

    database.ref("/players/turn").remove();

    var playerKey = snapshot.key;

    if (playerKey == "1") {
        player1Exists == false;
    } 
    
    if (playerKey == "2") {
        player2Exists == false;
    } 

    if (playerKey == "1" || playerKey == "2");

        $("#player" + playerKey).text("Waiting for player " + playerKey);

        $("#p" + playerKey + "WL").text("");

        $("#player" + playerKey + "Choice").css("border", "none");

});

database.ref("/players/2").on("child_added", function(snapshot) {

    if (snapshot.key == "choice") {
     
                retrievePlayerData();
    }
}); 

//function to add a player to the game
function addPlayer() {

    if(!player1Exists && !player2Exists) {
    
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

        monitorConnections();

    } else if (!player1Exists && player2Exists) {
    
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

        monitorConnections();

        database.ref("/players/turn").set("1");

    } else if (player1Exists && !player2Exists) {
    
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

        monitorConnections();

        database.ref("/players/turn").set("1");

    } else {

        //remove name input elements
        $("#addPlayer").remove();

        //message that there are already 2 players
        $("#userName").text("Sorry but unfortunately there are already 2 players!  Try again later!");    
    }
}

//function to verify the state of the client's connection 
function monitorConnections() {

    // When the client's connection state changes...
    connectedRef.on("value", function(snap) {

        // If they are connected..
        if (snap.val()) {
        
            database.ref("/players/" + playerNumber).onDisconnect().remove();

            database.ref("/players/turn").onDisconnect().remove();

            messageRef.onDisconnect().remove();

        }
    });
}

function retrievePlayerData() {

    playersRef.once("value").then(function(snapshot) {

        var player1Choice = snapshot.child("1").child("/choice").val();
        var player1Name = snapshot.child("1").child("/name").val();
        var player1Wins = snapshot.child("1").child("/wins").val();
        var player1Losses = snapshot.child("1").child("/losses").val();
        var player2Choice = snapshot.child("2").child("/choice").val();
        var player2Name = snapshot.child("2").child("/name").val();
        var player2Wins = snapshot.child("2").child("/wins").val();
        var player2Losses = snapshot.child("2").child("/losses").val();

        var playerData={"player1Choice": player1Choice, "player1Name": player1Name, "player1Wins": player1Wins, "player1Losses": player1Losses, "player2Choice": player2Choice, "player2Name": player2Name, "player2Wins": player2Wins, "player2Losses": player2Losses};

        displayResults(playerData);
    });    
}

displayResults = function(myplayerData) {

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

    if ((player1Choice === "Rock") && (player2Choice === "Scissors")) {

        player1Wins++;
        player2Losses++;
        playersRef.child("1/wins").set(player1Wins);
        playersRef.child("2/losses").set(player2Losses);
        $("#resultsCard").append("<h1>" + player1Name + "</h1><h1>Wins!</h1>");

    } else if ((player1Choice === "Rock") && (player2Choice === "Paper")) {

        player1Losses++;
        player2Wins++;
        playersRef.child("1/losses").set(player1Losses);
        playersRef.child("2/wins").set(player2Wins);
        $("#resultsCard").append("<h1>" + player2Name + "</h1><h1>Wins!</h1>");

    } else if ((player1Choice === "Scissors") && (player2Choice === "Rock")) {

        player1Losses++;
        player2Wins++;
        playersRef.child("1/losses").set(player1Losses);
        playersRef.child("2/wins").set(player2Wins);
        $("#resultsCard").append("<h1>" + player2Name + "</h1><h1>Wins!</h1>");

    } else if ((player1Choice === "Scissors") && (player2Choice === "Paper")) {
        
        player1Wins++;
        player2Losses++;
        playersRef.child("1/wins").set(player1Wins);
        playersRef.child("2/losses").set(player2Losses);
        $("#resultsCard").append("<h1>" + player1Name + "</h1><h1>Wins!</h1>");

    } else if ((player1Choice === "Paper") && (player2Choice === "Rock")) {

        player1Wins++;
        player2Losses++;
        playersRef.child("1/wins").set(player1Wins);
        playersRef.child("2/losses").set(player2Losses);
        $("#resultsCard").append("<h1>" + player1Name + "</h1><h1>Wins!</h1>");

    } else if ((player1Choice === "Paper") && (player2Choice === "Scissors")) {

        player1Losses++;
        player2Wins++;
        playersRef.child("1/losses").set(player1Losses);
        playersRef.child("2/wins").set(player2Wins);
        $("#resultsCard").append("<h1>" + player2Name + "</h1><h1>Wins!</h1>");

    } else if (player1Choice == player2Choice) {
        $("#resultsCard").append("<h1>Tie Game!</h1>");
    }

    $("#p1WL").text("wins: " + player1Wins + "  losses: " + player1Losses);
    $("#p2WL").text("wins: " + player2Wins + "  losses: " + player2Losses);

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

    var player = snapshot.val().playerNumber;

    console.log(message);

    if (player == "1") {

        //append message to "#messageText"
        $("#messageText").append("<p class='message1'>" + message + "</p>");

    } else if (player == "2") {

        //append message to "#messageText"
        $("#messageText").append("<p class='message2'>" + message + "</p>");
    }

    

});