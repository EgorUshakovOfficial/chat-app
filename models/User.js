const mongoose = require("mongoose"); 

//User Schema 
const Schema = mongoose.Schema; 
const userSchema = new Schema({
	email:{type:String, required:true}, 
	fullname: {type:String, required:true},
	username:{type:String, required:true}, 
	password:{type:String, required:true}, 
	token:String, 
	tokenExpires:Date, 
	connected:Boolean,
	picture:String,
	bio:String
})

//User model
const User = mongoose.model("User", userSchema);

module.exports = User; 