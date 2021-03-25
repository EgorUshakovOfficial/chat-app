const socket = io("/home");
 
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

let output = (...args)=>{
	var messageToSend = args[0];
	const {fullname} = args[1]; 
	$("#messages-view").append($('<div class="message">').html(`<b>${fullname} at ${new Date().toTimeString().substring(0, 5)}: ${messageToSend}</b>`));
}
