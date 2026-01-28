// nytt projekt: npm init -y i terminalen
// Installer express: npm i express i terminalen
// Sätta igång program om filen heter index.js: node --watch index
// --------------------------------------------------------------------
const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require('http');
const session = require("express-session");

const app = express();
const server = createServer(app);

app.set('trust proxy', 1) // trust first proxy
const seshMw = session({
  secret: 'Hunhow',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
});

app.use(seshMw);

// static files css,jpg, client-script
app.use(express.static("public"));


server.listen(3600, () => {
  console.log('server running');
});


const io = new Server(server);
io.engine.use(seshMw);

// if connected, run addConnection
io.on("connection", addConnection);

function addConnection(socket){

    console.log("Connected");

    socket.on("chat", handleChat);


}

function handleChat(msg){
    console.log("client sent: " + msg)
    // send msg to all connected users

    io.emit("globalChat", "Sent from server: "+msg)
}

app.get("/", (req, res)=>{
  res.sendFile(__dirname + "/public/index.html");
});