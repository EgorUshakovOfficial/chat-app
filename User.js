const mongoose = require("mongoose"); 
//Connect to Mongodb Atlas 
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});
//Create Schema 
const Schema = mongoose.Schema; 
//Create user schema 
const userSchema = new Schema({
	firstName:{type:String, required:true}, 
	lastName: {type:String, required:true},
	username:{type:String, required:true}, 
	password:{type:String, required:true}
})
const User = mongoose.model("User", userSchema);

module.exports = User; 