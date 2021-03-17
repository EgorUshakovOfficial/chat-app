const LocalStrategy = require("passport-local").Strategy; 
const bcrypt = require("bcrypt");
const User = require('./User'); 

module.exports = function(passport){
	passport.use(new LocalStrategy((username, password, done)=>{
		User.findOne({username})
			.then(user=>{
				if (!user){
					return done(null, false, {message:'Incorrect username'})
				}
				bcrypt.compare(password, user.password, (err, isMatch)=>{
					if (err) throw err;
					if (isMatch){
						return done(null, user)
					}
					else{
						done(null, false, {message:"Password is incorrect"})
					}
				})
			})
			.catch(err=>done(err))
	}))
	
	//Serialize and deserialize 
	passport.serializeUser((user, done)=>{
  		done(null, user.id);
	});

	passport.deserializeUser((id, done)=>{
  		User.findById(id, (err, user)=>{
    		done(err, user);
  		});
	});

}