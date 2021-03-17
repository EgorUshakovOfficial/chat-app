require("dotenv").config(); 
const express = require("express"); 
const app = express(); 
const http = require("http").createServer(app); 
const mongoose = require("mongoose")
const routes = require('./routes');
const flash = require("connect-flash");
const session = require("express-session");  
const passport = require("passport"); 
const passportSocketIo = require("passport.socketio"); 
const cookieParser = require("cookie-parser");
const MongoStore = require('connect-mongo');
const io = require("socket.io")(http); 
const helmet = require("helmet")

app.set("view engine", "pug");
app.use('/public', express.static(__dirname + "/public")); 
app.use(express.urlencoded({ extended: true }));

//Functions 
let onAuthorizeSuccess = (data, accept)=>{
  console.log('successful connection to socket.io');
  accept(null, true);
}

let onAuthorizeFail = (data, message, error, accept)=>{
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}


require('./auth')(passport);

//Session 
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI})
}))

io.use(passportSocketIo.authorize({
	cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI}),
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
}))
app.use(passport.initialize());
app.use(passport.session());

// //Connect flash 
app.use(flash()); 

//Runs when client connects
io.on('connection', socket=>{
	//WHen user joins the chat 
	const {firstName, lastName} = socket.request.user
	socket.broadcast.emit('message', {message:`${firstName} ${lastName} has joined the chat`})
	//User leaves the chat
	socket.on("disconnect", ()=>{
		io.emit("message", {message:`${firstName} ${lastName} has left the chat`})
	})
	socket.on("message", message=>{
		io.emit("message", {message, user:socket.request.user});
	})

})

//Global variables 
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    next()
})

//Security 
app.use(helmet());

//Routes 
routes(app);


PORT = process.env.PORT || 5000;
http.listen(PORT, console.log(`Listening on port ${PORT}`)) 
