require("dotenv").config(); 
const express = require("express"); 
const app = express(); 
const http = require("http").createServer(app); 
const mongoose = require("mongoose")
const User    = require("./models/User");
const routes = require('./routes');
const flash = require("connect-flash");
const session = require("express-session");  
const passport = require("passport"); 
const passportSocketIo = require("passport.socketio"); 
const cookieParser = require("cookie-parser");
const MongoStore = require('connect-mongo');
const io = require("socket.io")(http);
const sessionStore = MongoStore.create({ mongoUrl: process.env.MONGO_URI})  // Session Store 
const nsp = io.of('/home');  // Namespace 

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

//Passport authentication middleware
require('./authentication/passportauth')(passport);

//Session 
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge:60*60*1000},
  key: 'express.sid',
  store: sessionStore
}))
app.use(passport.initialize());
app.use(passport.session());

//Using passportSocketIo, we have access to user object 
nsp.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
}))

//Run when client connects
nsp.on('connection', socket=>{
  const {fullname, _id, connected} = socket.request.user
  User.findOne({_id})
      .then(user=>{
        user.connected = true; 
        user.save()
            .then(savedUser=>{
              User.find({connected:true})
                  .then(usersOnline=>nsp.emit("connected", usersOnline))
                  .catch(err=>console.log(err))
            })
            .catch(err=>console.log(err))
      })
      .catch(err=>console.log(err))
  //Sends every user conneected a message about the user leaving the chat 
  socket.on("disconnect", ()=>{
    User.findOne({_id})
      .then(user=>{
        user.connected = false; 
        user.save()
            .then(savedUser=>{
              User.find({connected:true})
                  .then(usersOnline=>nsp.emit("disconnected", usersOnline))
                  .catch(err=>console.log(err))
            })
            .catch(err=>console.log(err))
      })
      .catch(err=>console.log(err))
  })
  socket.on("message", message=>{
    nsp.emit("message", {message, user:socket.request.user});
  })

})

//Connect flash 
app.use(flash()); 

//Global variables 
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    next()
})

//Routes 
routes(app);


PORT = process.env.PORT || 5000;
http.listen(PORT, console.log(`Listening on port ${PORT}`)) 
