const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require("./utils/users");
const helmet = require("helmet");
var escape = require("escape-html");

var debug = require("debug")("chatnow:server");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const botName = "ChatNow";

// User helmet
app.use(helmet());

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Run when client connected
io.on("connection", socket => {
  console.log("New IO connection");

  socket.on("joinRoom", ({
    username,
    room
  }) => {
    const escapedUsername = escape(username);
    const escapedRoom = escape(room);
    const user = userJoin(socket.id, escapedUsername, escapedRoom);

    socket.join(user.room);
    socket.emit("message", formatMessage(botName, "Welcome to ChatNow!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${escapedUsername} has joined ${escapedRoom} `)
      );

    //Send users in room info

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Emit to all in the message event

  // io.emit();

  // Broadcast when user connects to all the users except the emitent user

  // Listen for typing

  socket.on('typing', data => {
    const user = getCurrentUser(socket.id);
    if (data.typing == true) {
      socket.broadcast.to(user.room).emit('displayTyping', data);
    } else {
      socket.broadcast.to(user.room).emit('displayTyping', data);
    }
  })

  //Listen for chatMessage
  socket.on("chatMessage", message => {
    var html = escape(message);
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, html));
  });

  // Runs when user disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      // Emit to ALL the users

      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat!`)
      );
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: {}
  });
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

const PORT = normalizePort(process.env.PORT || "80");

server.listen(PORT, err => {
  if (err) {
    onError(err);
  }
  console.log("Server is listening...");
});

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}