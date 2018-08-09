var config = {
    apiKey: "AIzaSyCC0TkbJKOv7lysihSJglOuEwcRCOyJM7w",
    authDomain: "baahchat.firebaseapp.com",
    databaseURL: "https://baahchat.firebaseio.com",
    projectId: "baahchat",
    storageBucket: "baahchat.appspot.com",
    messagingSenderId: "107755763489"
  };
  firebase.initializeApp(config);
  
  var db = firebase.firestore();
  var auth = new firebase.auth.GoogleAuthProvider();
  auth.addScope('https://www.googleapis.com/auth/contacts.readonly');
  firebase.auth().useDeviceLanguage();
  
  var storage = firebase.storage();
  var storageRef = storage.ref();

  const settings = {timestampsInSnapshots: true};
  db.settings(settings);

  var chatSelector = document.getElementById("chatselector");

  var username = null;
  var uid = null;

  var unSubscribeOldChatListener = function(){};

firebase.auth().onAuthStateChanged((user) => {
    
    console.log(user);

    if(user)
    {
        console.log("Already logged in!");
        console.log(user.uid);

        uid = user.uid;

        db.collection("users").doc(uid).get().then(function(doc) {
            console.log(doc.data());
            if (doc.exists) {
                if (doc.data()["username"])
                {
                    username = doc.data()["username"];
                    console.log("Username: " + username);
                    load();
                }
                else
                {
                    createUsername();
                    load();
                }
            } else {
                console.log("User not yet registrated!");
                
                createUsername();
                load();
            }
        }).catch(function(error) {
            console.log("Error getting user data:", error);
        });
    }
});

function load()
{
    chatSelector.removeChild(chatSelector.childNodes[0]);

    if(username == null || username == "" || uid == null || uid == "")
    {
        alert("Please login first, before loading!");
        return;
    }

    db.collection("chats").where(uid, "==", true).get().then(function(querySnapshot) {
        console.log("Chat names:");

        while(chatSelector.childNodes.length > 0)
        {
            chatSelector.removeChild(chatSelector.childNodes[0]);
        }

        querySnapshot.forEach(function(doc) {
            if(doc.data()["chatname"])
            {
                var node = document.createElement("LI");
                var textnode = document.createTextNode(doc.data()["chatname"]);
                node.className = "mdl-menu__item";
                node.onclick = loadChat;
                node.appendChild(textnode);
                chatSelector.appendChild(node);
                console.log(doc.data()["chatname"]);
            }
        });
        console.log(" ");
    });
}

function createUsername()
{
    var tempusername = null;
    tempusername = prompt("Please enter a username:");
                
    while(true)
    {
        if(tempusername == null || tempusername == "")
            alert("You need to enter a username!");
        else if(tempusername.length < 6 || tempusername.length > 16)
            alert("You need to enter a username with minimum 6, maximum 16 characters!");
        else
            break;

        tempusername = prompt("Please enter a username:");
    }

    username = tempusername;

    console.log("Username: " + username);

    db.collection("users").doc(uid).set({
        username: username
    })
    .then(function() {
        console.log("User registrated");
    })
    .catch(function(error) {
        console.error("Error registrating user: ", error);
    });
}

function login()
{
    firebase.auth().signInWithPopup(auth).then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;

        uid = result.user.uid;

        console.log("uid: " + uid);

        db.collection("users").doc(uid).get().then(function(doc) {
            console.log(doc.data());
            if (doc.exists) {
                if (doc.data()["username"])
                {
                    username = doc.data()["username"];
                    console.log("Username: " + username);
                    load();
                }
                else
                {
                    createUsername();
                    load();
                }
            } else {
                console.log("User not yet registrated!");
                
                createUsername();
                load();
            }
        }).catch(function(error) {
            console.log("Error getting user data:", error);
        });

        console.log("Logged in!");
        
    }).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        var email = error.email;
        var credential = error.credential;
        console.log("Error logging in: " + errorMessage);
    });
}

function loadChat()
{
    console.log("LOAD!" + this.textContent);
    
    unSubscribeOldChatListener();

    var chat = "";

    document.getElementById("chatname").innerHTML = this.textContent;

    var elem = document.getElementById('chatlogs');
    elem.parentNode.removeChild(elem);

    var tempChatlogDiv = document.createElement('div');
    tempChatlogDiv.className = 'chatlogs';
    tempChatlogDiv.id = 'chatlogs';

    document.getElementById('chatbox').insertBefore(tempChatlogDiv, document.getElementById('chatbox').childNodes[0]);

    unSubscribeOldChatListener = db.collection("chats").doc(this.textContent).collection("messages").orderBy("sendtime", "asc")
    .onSnapshot(function(querySnapshot) {
        querySnapshot.docChanges().forEach(function(change) {
            if (change.type === "added") {
                chat = "";

                console.log(change.doc.data());

                var tempDiv = document.createElement('div');

                if(username == change.doc.data()["username"])
                    tempDiv.className = 'chat self';
                else
                    tempDiv.className = 'chat friend';

                if(change.doc.data()["username"])
                {
                    chat += change.doc.data()["username"] + ": ";
                }
                
                var tempImage = document.createElement('img');

                if(change.doc.data()["userid"])
                {
                    storageRef.child('profile-images/' + change.doc.data()["userid"]).getDownloadURL().then(function(url)                             {
                        tempImage.src = url;
                        
                      }).catch(function(error) {
                        console.error(error);
                      });

                      storageRef.child('profile-images/' + change.doc.data()["userid"])
                }

                var tempPhotoDiv = document.createElement('div');
                tempPhotoDiv.className = 'user-photo';
                tempPhotoDiv.align = "middle";
                
                tempPhotoDiv.appendChild(tempImage);
                tempDiv.appendChild(tempPhotoDiv);

                var imageMessageDiv = document.createElement('div');
                imageMessageDiv.className = 'image-message';
                
                var imageMessage = document.createElement('img');

                if(change.doc.data()["imgPath"])
                {

                    console.log(change.doc.data()["imgPath"]);
                    storageRef.child('test/' + change.doc.data()["imgPath"]).getDownloadURL().then(function(url)                             {
                        imageMessage.src = url;
                      }).catch(function(error) {
                        console.error(error);
                      });
                    
                    imageMessageDiv.appendChild(imageMessage)
                }

                if(change.doc.data()["text"])
                {
                    chat += change.doc.data()["text"] + "<br/>";
                }
                else
                {
                    chat += "<br/>";
                }

                var chatDiv = document.createElement('div');
                chatDiv.className = 'chat-message';

                var tempText = document.createElement('p');
                tempText.innerHTML = chat;
                tempText.className = 'chat-message-text';

                chatDiv.appendChild(tempText);

                if(imageMessageDiv.childElementCount > 0)
                    chatDiv.appendChild(imageMessageDiv);

                tempDiv.appendChild(chatDiv);

                document.getElementById("chatlogs").appendChild(tempDiv);
            }
            if (change.type === "modified") {
                console.log("Modified message: ", change.doc.data());
            }
            if (change.type === "removed") {
                console.log("Removed message: ", change.doc.data());
            }
        });

        var element = document.getElementById('chatlogs');
        element.scrollTop = element.scrollHeight;

    });
}

//Pressing enter will send the message
document.getElementById("message")
    .addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        sendMessage();
    }
});

function sendMessage()
{
    if(username == null || username == "" || uid == null || uid == "")
    {
        alert("Please login first!");
        return;
    }

    var message = document.getElementById("message").value;

    if(message == null || message == "")
        return;

    document.getElementById("message").value = "";
    console.log(message);

    var currentChat = document.getElementById("chatname").innerHTML;

    var d = new Date();
    var currentTime = d.getTime();

    db.collection("chats").doc(currentChat).collection("messages").doc().set({
        sendtime: currentTime,
        text: message,
        userid: uid,
        username: username
    })
    .then(function() {
        console.log("Message sent!");
    })
    .catch(function(error) {
        console.error("Error sending message: ", error);
    });

    var element = document.getElementById('chatlogs');
    element.scrollTop = element.scrollHeight;
}