// nytt projekt: npm init -y i terminalen
// Installer express: npm i express i terminalen
// Sätta igång program om filen heter index.js: node --watch index
// --------------------------------------------------------------------
const express = require("express");
const { Server } = require("socket.io");
const fs = require("fs");
const escape = require("escape-html");

const bcrypt = require("bcryptjs");
const { createServer } = require('http');
const session = require("express-session");
const { getData, saveData } = require("./db");
//const { json } = require("stream/consumers");



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

//load + save rooms to JSON
function loadRooms(){
  if(!fs.existsSync("rooms.json")){
    fs.writeFileSync("rooms.json", "[]");
  }
  return JSON.parse(fs.readFileSync("rooms.json").toString());
}

function saveRooms(rooms){
  fs.writeFileSync("rooms.json", JSON.stringify(rooms, null, 2))
}

// get rooms
app.get("/api/rooms", (req,res) => {
  const rooms = loadRooms();
  res.json(rooms);
});


// function checkauth(req,res,next){
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
    socket.on("joinRoom", async (roomName) => {
      const user = socket.request.session.user;

      if(!user){
        return socket.emit("notLogged",
          {message:"You must be logged in to use this function!"});
      }


//loading room history (old messages)
      socket.join(roomName);


      const allMes = await getData("roomMessages.json");
      const roomMesHistory = allMes[roomName] || [];

      socket.emit("roomHistory", {
        room: roomName,
        history: roomMesHistory
      });

      //console.log(`${socket.id} joined room ${roomName}`); logging for user join

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

    //message editor (server)
    socket.on("editMes", async ({ room, mesID, newText}) => {
      const user = socket.request.session.user;
      if (!user) return socket.emit("notLogged", { message: "You must be logged in to use this function!" });
    
      const allMes = await getData("roomMessages.json");
      const roomMessages = allMes[room] || [];
    
      const msg = roomMessages.find(m => m.id === mesID);
      if (!msg) return;
      if (msg.username !== user.username) return;
    
      msg.message = newText;
      msg.edited = true;
    
      await saveData("roomMessages.json", allMes);
    
      io.to(room).emit("messageEdit", {
        id: mesID,
        newText: msg.message,
        room: room
      });
    });


    //delete message (server)
    socket.on("messageDel", async ({ room, mesID }) => {
      const user = socket.request.session.user;
      if (!user) return socket.emit("notLogged", { message: "You must be logged in to use this function!" });
    
      const allMes = await getData("roomMessages.json");
      const roomMessages = allMes[room] || [];
    
      const msgIndex = roomMessages.findIndex(m => m.id === mesID);
      if (msgIndex === -1) return;
    
      if (roomMessages[msgIndex].username !== user.username) return;
    
      roomMessages.splice(msgIndex, 1);
    
      await saveData("roomMessages.json", allMes);
    
      io.to(room).emit("messageDel", {
        id: mesID,
        room: room
      });
    });
}


//room specific handler
async function handleRoomChat(room, msg, socket){
  const user = socket.request.session.user;
  const mesID = "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2);

  if(!user){
    return socket.emit("notLogged", {
      message: "You must be logged in to use this function!"
    });
  }


  //adding new messages to file / loading from file
  const allMes = await getData("roomMessages.json");
  if (!allMes[room]) allMes[room] = [];

  //add new message
  allMes[room].push({
    id: mesID,
    username: user.username,
    message: msg,
    ToS: Date.now()
  });

  //save updated messages
  await saveData("roomMessages.json", allMes);

  io.to(room).emit("roomMessage",{
    id: mesID,
    username: user.username,
    message: msg,
    room: room,
    ToS: Date.now()
  });
}

// home route + send user login state
app.get("/home", (req, res)=>{
  const loggedIn = !!req.session.user;
  res.sendFile(__dirname + "/public/index.html");
});

// second route to get login state
app.get("/auth_stats", (req, res) =>{
  res.json({loggedIn: !!req.session.user,
    username: req.session.user?.username || null
  });
});

app.get("/auth_stats", (req, res) => {
  res.json({
    loggedIn: !!req.session.user,
    username: req.session.user?.username || null
  });
});


//user register and login
app.post("/register", (req,res) =>{

  const username = req.body.username;
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 12);
  const id = "Id_" + Date.now();
  const role = "user";

  const users = JSON.parse(fs.readFileSync("users.json").toString());
  if (users.find(u => u.email == email)) return res.send("User already exists, please try again.");
  if (users.find(u => u.username == username)) return res.send("Username already taken, please try another");

  if (!username){
    return res.status(400).send("Username required.")
  }
  if (!email){
    return res.status(400).send("Email required.")
  }
  if (!password){
    return res.status(400).send("Password required.")
  }

  users.push({username, id, email, password, role});
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

  res.redirect("/home/?User_Created");

});

app.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  const users = JSON.parse(fs.readFileSync("users.json").toString());
  const user = users.find(u => u.username == username);

  if(!user) return res.send("Incorrect Credentials, try again.");

  if(!username){
    return res.status(400).send("Username required.")
  }

  if(!password){
    return res.status(400).send("Password required.")
  }

  const checkP = bcrypt.compareSync(password, user.password);
  if(!checkP) return res.send("Incorrect Credentials, try again.");

  req.session.user = {username: user.username, id: user.id, email: user.email, role: user.role};
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

app.post("/createRoom", (req, res) => {
  if(!req.session.user){
    return res.status(403).send("You must be logged in to use this function!")
  }

  const roomName = req.body.roomName;
  if(!roomName || !roomName.trim()){
    return res.status(400).send("Room name is required.");
  }

  const rooms = loadRooms();
  if(rooms.find(r => r.name === roomName)){
    return res.status(400).send("Room name already exists");
  }

  const newRoom = {
    id: "Room_" + Date.now(),
    name: roomName.trim(),
    ownerid: req.session.user.id,
    createdDate: Date.now()
  };

  rooms.push(newRoom);
  saveRooms(rooms);
  
  console.log("CreateRoom request received: ", req.body);

  res.json({
    success: true,
    room: newRoom
  });
});
