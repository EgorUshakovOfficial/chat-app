require("dotenv").config(); 
const express = require("express"); 
const app = express(); 
const http = require("http").createServer(app); 
const mongoose = require("mongoose")
const User     = require("./models/User");
const routes = require('./routes');
const flash = require("connect-flash");
const session = require("express-session");  
const passport = require("passport"); 
const passportSocketIo = require("passport.socketio"); 
const cookieParser = require("cookie-parser");
const MongoStore = require('connect-mongo');
const path = require('path')
const crypto = require('crypto')
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')

const io = require("socket.io")(http);
const sessionStore = MongoStore.create({ mongoUrl: process.env.MONGO_URI})  // Session Store 
const nsp = io.of('/chat');  // Namespace 

//Connect to MongoDB chat database 
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

//Initialize GridFs Stream 
const conn = mongoose.connection;
let gfs;
conn.once('open', ()=>{
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
})

//Initialize GridFs Storage 
const storage = new GridFsStorage({
  url:process.env.MONGO_URI,
  options:{ useUnifiedTopology: true},
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({storage});

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
    const {_id} = socket.request.user;
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

//Upload Route
app.route('/upload').post(upload.single("file"), (req, res)=>{  
  const {filename} = req.file; 
  gfs.files.findOne({filename}, (err, file)=>{
    if (!file || file.length===0){
      res.redirect("/profile");
    }
    else if (file.contentType==="image/jpeg" || file.contentType==="image/png"){
      User.findOne({_id:req.user._id})
          .then(user=>{
            user.picture = `/image/${file.filename}`;
            user.save()
                .then(savedData=>res.redirect("/profile")) 
                .catch(err=>console.log(err))
          })
          .catch(err=>console.log(err));
    }
    else{
      res.redirect("/profile")
    }
  })
})

//Download Route
app.route('/image/:filename').get((req, res)=>{
  gfs.files.findOne({filename:req.params.filename}, (err, file)=>{
    if (!file || file.length===0){
      res.redirect("/profile");
    }
    else if (file.contentType==="image/jpeg" || file.contentType==="image/png"){
      const readstream = gfs.createReadStream(file.filename); 
      readstream.pipe(res);
    }
    else{
      res.redirect("/profile");
    }
  })
})



PORT = process.env.PORT || 5000;
http.listen(PORT, console.log(`Listening on port ${PORT}`)) 
