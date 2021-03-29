 //Socket.Io
const socket = io("/chat");
 
socket.on('message', data=>{
	const {message, user} = data;
	output(message, user); 
})


socket.on('connected', usersOnline=>{
	$("li").remove();
	usersOnline.map(user=>{
		$("#users-view").append($('<li>').html(`<b>${user.fullname}</b>`));
	})
})

socket.on('disconnected', usersOnline=>{
	$("li").remove();
	usersOnline.map(user=>{
		$("#users-view").append($('<li>').html(`<b>${user.fullname}</b>`));
	})
})

$("#chat-form").submit(()=>{
	var messageToSend = $("#message-input").val(); 
	$("#message-input").val("");
	console.log(socket);
	socket.emit("message", messageToSend); 
	return false; //Prevents the page from rerendering 
})

//Clickable Events
$("#profile-pic").click(()=>{
	$("#upload-form").css("opacity", "100%");
	$("#pic-submit").attr("disabled", false);
})
$("#add-bio").click(()=>{
	$("#bio-form").css("opacity", "100%");
	$("#bio-submit").attr("disabled", false)
	$("#cancel").attr("disabled", false)
})

$("#cancel").click(()=>{
	$("#bio-form").css("opacity", "0%");
	$("#bio-submit").attr("disabled", true);
	$("#cancel").attr("disabled", true);
})

$("#chat-pic").click(()=>{
	window.location.href = '/profile';
})

//Functions 
let output = (...args)=>{
	var messageToSend = args[0];
	const {fullname} = args[1]; 
	$("#messages-view").append($('<div class="message">').html(`<b>${fullname} at ${new Date().toTimeString().substring(0, 5)}: ${messageToSend}</b>`));
}
