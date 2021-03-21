const User = require("../models/User"); 

module.exports = {

	//Checkis if password and confirm password match
	isPasswordCorrect(req, res, next){
		if (req.body.password===req.body.confirmPassword){
			next()
		}
		else{
			req.flash("error_msg", "Passwords do not match")
			res.redirect("/register")
		}
	}, 

	// Checks if username exists in the database 
	isEmailTaken(req, res, next){
		User.findOne({email:req.body.email})
			.then(data=>{ 
				if (data){
					req.flash("error_msg", "Email already used with another account")
					res.redirect("/register")
				}
				else{
					next()
				}
			})
			.catch(err=>console.log(err)) 
	}, 

	//Checks if username is taken in the database
	isUsernameTaken(req, res, next){
		User.findOne({username:req.body.username})
		    .then(data=>{
		    	if (data){
		    		req.flash("error_msg", "Username is already taken")
		    		res.redirect("/register")
		    	}
		    	else{
		   	    	next()
		    	}
		    })
		    .catch(err=>console.log(err))
	}

} 

