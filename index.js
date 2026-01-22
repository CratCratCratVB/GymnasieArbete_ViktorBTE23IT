// nytt projekt: npm init -y i terminalen
// Installer express: npm i express i terminalen
// Sätta igång program om filen heter index.js: node --watch index
// --------------------------------------------------------------------
const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require('http');

const app = express();
const server = createServer(app);


// static files css,jpg, client-script
app.use(express.static("public"));


server.listen(3600, () => {
  console.log('server running');
});


const io = new Server(server);

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