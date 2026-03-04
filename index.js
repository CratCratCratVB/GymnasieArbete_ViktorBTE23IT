// nytt projekt: npm init -y i terminalen
// Installer express: npm i express i terminalen
// Sätta igång program om filen heter index.js: node --watch index
// --------------------------------------------------------------------
const express = require("express");
const { Server } = require("socket.io");
const fs = require("fs");

const bcrypt = require("bcryptjs");
const { createServer } = require('http');
const session = require("express-session");
const { json } = require("stream/consumers");

const app = express();
const server = createServer(app);

app.use(express.urlencoded({extended: true}));

app.set('trust proxy', 1) // trust first proxy
const seshMw = session({
  secret: 'CratChatSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax"
  }
});

app.use(seshMw);

// static files css, jpg, client-script
app.use(express.static("public"));


server.listen(3600, () => {
  console.log('server running');
});

// function checkAuth(req,res,next){
//   if(!req.session.user){
//     return res.status(403).send("You must be logged in to use function!");
//   }
//   next();
// },  WOULD check for req.session.user, sends message if no user is found, ex. for admin ting


//websockets stuff
const io = new Server(server);
io.engine.use(seshMw);

io.use((socket, next) => {  
  next();
});

// if connected, run addConnection
io.on("connection", addConnection);

function addConnection(socket){
    console.log("Connected");

    //join room
    socket.on("joinRoom", (roomName) => {
      const user = socket.request.session.user;

      if(!user){
        return socket.emit("notLogged",
          {message:"You must be logged in to use this function!"});
      }

      socket.join(roomName);
      console.log(`${socket.id} joined room ${roomName}`);

      socket.emit("roomJoined", {room: roomName});

      socket.to(roomName).emit("userJoined", {
        username: user.username,
        room: roomName
      });
    });

    //leaving room
    socket.on("leaveRoom", (roomName) =>{
      socket.leave(roomName);
      console.log(`${socket.id} left room ${roomName}`);

      socket.emit("roomLeft", {room: roomName});

      socket.to(roomName).emit("userLeftR", {
        username: socket.request.session.user?.username,
        room: roomName
      });
    });

    //room chatting (plz work :) )
    socket.on("roomChat", ({room, message}) => {
      handleRoomChat(room, message, socket);
    });

    //global chat
    socket.on("chat", (msg) => {
      handleChat(msg, socket);
    });
}


//room specific handler
function handleRoomChat(room, msg, socket){
  const user = socket.request.session.user;

  if(!user){
    return socket.emit("notLogged", {
      message: "You must be logged in to use this function!"
    });
  }

  io.to(room).emit("roomMessage",{
    username:
    user.username,
    message: msg,
    room: room,
    ToS: Date.now()
  });
}


//global handler
function handleChat(msg, socket){
    //console.log("client sent: ", msg); debuhh
    if(socket.request.session.user){
      const user = socket.request.session.user;

      // send msg to all connected users IF logged in
      return io.emit("globalChat",{
        username: user.username,
        message: msg,
        ToS: Date.now()
      });
    }

    if(!socket.request.session.user){
      return socket.emit("notLogged", {
        message: "You must be logged in to use this function!"
      });
    }
}


// home route + send user login state
app.get("/home", (req, res)=>{
  const loggedIn = !!req.session.user;
  res.sendFile(__dirname + "/public/index.html");
});

// second route to get login state
app.get("/auth_stats", (req, res) =>{
  res.json({loggedIn: !!req.session.user});
});


//user register and login
app.post("/register", (req,res) =>{

  const username = req.body.username;
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 12);
  const Id = "Id_" + Date.now();
  const role = "user";

  const users = JSON.parse(fs.readFileSync("users.json").toString());
  if (users.find(u => u.email == email)) return res.send("User already exists, please try again.");
  if (users.find(u => u.username == username)) return res.send("Username already taken, please try another");

  users.push({username, Id, email, password, role});
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

  res.redirect("/home/?User_Created");

});

app.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  const users = JSON.parse(fs.readFileSync("users.json").toString());
  const user = users.find(u => u.username == username);

  if(!user) return res.send("Incorrect Credentials, try again.");

  const checkP = bcrypt.compareSync(password, user.password);
  if(!checkP) return res.send("Incorrect Credentials, try again.");

  req.session.user = {username: user.username, Id: user.Id, email: user.email, role: user.role};
  res.redirect("/home/?Login_Succsess");
});

app.get("/logout", (req, res) => {
  req.session.destroy(err => {
     if (err){
      return res.send("Unable to log out or already logged out, please try again.")
     }
     res.clearCookie("connect.sid");
     res.redirect("/home/?Logged_Out");

  });
});