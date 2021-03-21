const mongoose = require("mongoose"); 

//Connect to Mongodb Atlas 
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

//User Schema 
const Schema = mongoose.Schema; 
const userSchema = new Schema({
	email:{type:String, required:true}, 
	fullname: {type:String, required:true},
	username:{type:String, required:true}, 
	password:{type:String, required:true}, 
	token:String, 
	tokenExpires:Date  
})

//User model
const User = mongoose.model("User", userSchema);

module.exports = User; 