const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); 
const User = require('./User'); 
const passport = require('passport'); 
const {ensureAuthenticated} = require('./authenticated'); 

module.exports = function(app){
	app.route('/').get((req, res)=>{
 		res.render('index')
	})
	
	app.route('/register').get((req, res)=>{
		res.render('registration')
	})
	
	app.route('/register').post((req, res)=>{
		const newUser = new User(req.body);  
		const saltRounds = 10; 
		// Hash password and save new use in the database 
		bcrypt.genSalt(saltRounds, (err, salt)=>{
    		bcrypt.hash(newUser.password, salt, (err, hash)=>{
        		newUser.password = hash;
        		newUser.save()
        	    	.then(user=>{
        	    		req.flash("success_msg", "You are now registered and can log in")
        	    		res.redirect('/')
        			})
        			.catch(err=>console.log(err)); 
    		});
		});
	})

	app.route('/logout').get((req, res)=>{
		req.logout(); 
		res.redirect('/')
	})

	app.route('/home').get(ensureAuthenticated, (req, res)=>{
		const {firstName, lastName} = req.user; 
		res.render('home', {firstName, lastName})
	}); 

	app.route('/login').post((req, res, next)=>{
		passport.authenticate('local', {
			successRedirect: '/home', 
			failureRedirect: '/', 
			failureFlash: true
		})(req, res, next); 
	}); 
}