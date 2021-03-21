const socket = io();
// let messages = []; 
socket.on('message', data=>{
	const {message, user} = data; 
	if (!user){
		output(message); 
	}
	else{
		output(message, user); 
	}
})



$("#chat-form").submit(()=>{
	var messageToSend = $("#message-input").val(); 
	socket.emit("message", messageToSend); 
	return false; //Prevents the page from rerendering 
})

let output = (...args)=>{
	if (args.length===1){
		var messageToSend = args[0]; 
		$("#messages-view").append($('<li>').html(`<b>${messageToSend}</b>`));
	}
	else{
		var messageToSend = args[0];
		const {fullname} = args[1]; 
		$("#messages-view").append($('<li>').html(`<b>${fullname}: ${messageToSend}</b>`));
	}
}
