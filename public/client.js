const socket = io();
// let messages = []; 
socket.on('message', data=>{
	const {message, user} = data;
	output(message, user); 
})

socket.on('remove-user', data=>{
})

socket.on('user-connected', usersOnline=>{
	$("li").remove();
	usersOnline.map(user=>{
		$("#users-view").append($('<li>').html(`<b>${user.fullname}</b>`));
	})
})

socket.on('user-disconnected', usersOnline=>{
	$("li").remove();
	usersOnline.map(user=>{
		$("#users-view").append($('<li>').html(`<b>${user.fullname}</b>`));
	})
})


$("#chat-form").submit(()=>{
	var messageToSend = $("#message-input").val(); 
	$("#message-input").val("");
	socket.emit("message", messageToSend); 
	return false; //Prevents the page from rerendering 
})

let output = (...args)=>{
	var messageToSend = args[0];
	const {fullname} = args[1]; 
	$("#messages-view").append($('<div>').html(`<b>${fullname}: ${messageToSend}</b>`));
}
