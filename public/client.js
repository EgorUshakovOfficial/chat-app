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

socket.on('remove-user', idTag=>{
	document.getElementById(idTag).remove(); 
})


$("#chat-form").submit(()=>{
	var messageToSend = $("#message-input").val(); 
	socket.emit("message", messageToSend); 
	return false; //Prevents the page from rerendering 
})

let output = (...args)=>{
	if (args.length===1){
		var userOnline = args[0];
		var idTag = userOnline.split(" ").join("-").toLowerCase(); 
		$("#users-view").append($(`<li id=${idTag}>`).html(`<b>${userOnline}</b>`));
	}
	else{
		var messageToSend = args[0];
		const {fullname} = args[1]; 
		$("#messages-view").append($('<li>').html(`<b>${fullname}: ${messageToSend}</b>`));
	}
}
