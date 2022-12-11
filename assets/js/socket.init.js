let socket = io();

const me = JSON.parse(document.querySelector('.me').value)

socket.on('connect',()=>{
    socket.emit('makeRoom',me._id)
    socket.emit('makeOnline',me._id)
})


socket.on('onlineUsers', onlineUsers=>{
    if(document.querySelector('.status')){
        document.querySelectorAll('.status').forEach(ele=>{
            if(onlineUsers[ele.classList[1]])
                ele.innerHTML = `<p class='text-success' >Online</p>`;
            else ele.innerHTML = `<p class='text-secondary' >Offline</p>`;
        })
    }
})

if(location.href.split('/').slice(-2,-1)[0]==='chats')
    window.scrollTo(0,document.body.scrollHeight)

const goToChat=async chatId =>{
    await fetch('/removeNotificatons').catch(()=>{console.error('internal server error')});
    location.assign('/chats/'+chatId);
}

socket.on('receiveMsg',(sender, msg, chatId)=>{
    if(sender){
        location.href.split('/').includes(chatId) ?
        document.querySelector(".messages form").innerHTML+=`
        <div class='msg-left position-relative pt-1 pb-1 ps-3 pe-3 bg-success ${msg.content==='Deleted Message'?"":`text-white`} rounded-pill' style="width:fit-content;">
            ${msg.content}
        </div>
        <p class='me-auto' style='width:fit-content; font-size:2px'>${msg.timestamps.split(", ")[1]}</p>
        `
        :
        document.querySelector('.toast-container').innerHTML += `
        <div class="toast show" onclick="goToChat('${chatId}')" style='cursor:pointer'>
            <div class="toast-header">
                <img class='me-3 rounded-circle' src='/${sender.image}' style='width:50px; height:50px'>
                <strong class="me-auto">New Message from ${sender.name}</strong>
                <small class="text-muted">just now</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body" style='text-overflow: ellipsis'>
                ${msg.content}
            </div>
        </div>
        `
    }else{
        document.querySelector(".messages form .loading").remove();
        document.querySelector(".messages form").innerHTML+=
            msg.content === 'Deleted Message'? `
            <div class='msg-rigth position-relative ms-auto pt-1 pb-1 ps-3 pe-3 bg-success rounded-pill' style="width:fit-content;">
                Deleted Message
            </div>
            <p class='ms-auto' style='width:fit-content; font-size:2px'>${msg.timestamps.split(", ")[1]}</p>
            ` :
            `
            <div class='d-flex justify-content-end'>
                <button class='btn-close' type="submit" name="msgId" value=${msg._id}></button>
                <div class='msg-rigth position-relative pt-1 pb-1 ps-3 pe-3 bg-success text-white rounded-pill' style="width:fit-content;">
                    ${msg.content}
                </div>
            </div>
            <p class='ms-auto' style='width:fit-content; font-size:2px'>${msg.timestamps.split(", ")[1]}</p>
            `;
    }
})

const assignUsersToDOM =(e, users)=>{
    e.target.nextSibling.innerHTML = null;
    if(users === 'Internal Server Error')
        e.target.nextSibling.innerHTML = `
        <li>
            <a class='dropdown-item d-flex' href= ''>
                ${users}
            </a>
        </li>
        `;
    else if(!users.length) 
        e.target.nextSibling.innerHTML = `
        <li>
            <a class='dropdown-item d-flex' href= ''>
                No users
            </a>
        </li>
        `;
    else
        users.forEach(user => {
            if(user._id !== me._id) 
                e.target.nextSibling.innerHTML += `
                <li>
                    <a class='dropdown-item d-flex align-items-center' href= '/profile/${user._id}'>
                        <img class='rounded-circle me-3' src='/${user.image}' style='width:50px; height:50px'>
                        <h5>${user.name}</h5>
                        <div class='status ${user._id} ms-auto'></div>
                    </a>
                </li>
                `
                socket.emit('refrechOnlines')
        });
}
let users = [];
document.querySelector('input[name="search"]').onfocus=async e=>{
    if(!users.length){
        users = await fetch("/getUsers")
        .then(res=>res.json())
        .then(res=>JSON.parse(res))
        .catch(()=>'Internal Server Error')
        assignUsersToDOM(e, users);
    }
}
let filteredUsers = [];
document.querySelector('input[name="search"]').onkeyup= e=>{
    e.target.value.split(' ').forEach(word=>{
        filteredUsers = users.filter(user=>{
            let userName = user.name.split('');
            return word.split('').map((char, i)=> {
                if(char.toLowerCase() !== userName[i]?.toLowerCase())
                    return false;
            }).includes(false)?false:true;
        })
    })
    assignUsersToDOM(e, filteredUsers);
}

document.querySelector('.modal-header .btn-close').onclick=()=>{
    document.querySelector('.btn[data-bs-toggle="modal"]').removeAttribute('disabled')
    document.querySelector('.btn[data-bs-toggle="modal"]').innerHTML = 'Edit Profile'
}

let changeProfileFun = e=>{
    if(e.target.value) document.querySelector('.modal-footer .btn').removeAttribute('disabled')
    else{
        var isAllNull = [];
        document.querySelectorAll('.modal-body input').forEach(input=>{isAllNull.push(input.value? false: true);})
        isAllNull.includes(false)? document.querySelector('.modal-footer .btn').removeAttribute('disabled'): document.querySelector('.modal-footer .btn').setAttribute('disabled','')
    }
} 
if(document.querySelector('.modal')){
    let changePassInputs = document.querySelectorAll('.modal-body input[type="password"]');

    document.querySelector('.modal-footer .btn').onclick= e=>{
        var isAllNull = [];
            document.querySelectorAll('.modal-body input').forEach(input=>{isAllNull.push(input.value? false: true);})
            isAllNull.includes(false)? e.target.removeAttribute('disabled'): e.target.setAttribute('disabled','')
    }
    
    document.querySelector('.modal-body input[type="file"]').onchange=e=>{
        changeProfileFun(e)
    }
    
    document.querySelector('.modal-body input[type="text"]').onkeyup= e=>{
        changeProfileFun(e)
    }
    
    changePassInputs?.forEach(input=>{
        input.onkeyup= e=>{
            e.target.innerHTML = `Save`
            changeProfileFun(e)
            if(e.target.value){
                e.target.hasAttribute('required')? '' :
                changePassInputs.forEach(input=>{input.setAttribute('required','')}) 
    
                if(changePassInputs[1].value !== changePassInputs[2].value){
                    changePassInputs[1].classList.add('border-danger')
                    changePassInputs[2].classList.add('border-danger')
                    document.querySelector('.modal-footer .btn').setAttribute('disabled','')
                    changePassInputs[2].nextSibling.classList.remove('d-none');
                }else {
                    changePassInputs[1].classList.remove('border-danger')
                    changePassInputs[2].classList.remove('border-danger')
                    changePassInputs[2].nextSibling.classList.add('d-none')
                };
            }else{
                e.target.hasAttribute('required')? changePassInputs.forEach(input=>{input.removeAttribute('required')}) : '';
            }
            
        }
    })
}

let fristTimeOnly = true;
document.addEventListener('click', e=>{
    let friendId ;
    if(e.target.classList.contains('btn')){
        if(e.target.parentElement.className !== 'modal-footer')
            e.target.setAttribute('disabled',null);
        e.target.innerHTML += `<span class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>`
        if(e.target.parentElement.className === 'modal-footer')
            e.target.parentElement.parentElement.submit
    }
    if(e.target.id.split('_')[0] === 'chat'){
        friendId = e.target.id.split("_")[1];
        location.assign('/chats/' + document.getElementById('chat_'+friendId).value);
    }else if(e.target.id === 'submitMsg'){
        friendId = document.querySelector('.status').classList[1];
        let msg = document.querySelector('textarea[name="msg"]').value;
        document.querySelector('textarea[name="msg"]').value = '';

        socket.emit('sendMsg', me, friendId, msg)

        document.querySelector(".messages form").innerHTML+=`
        <div class='loading msg-rigth position-relative text-white ms-auto pt-1 pb-1 ps-3 pe-3 bg-success rounded-pill' style="width:fit-content;">
            Loading...
        </div>
        `
    }
    else if(fristTimeOnly && e.target.parentElement.className === 'toast-header' && e.target.parentElement.querySelector('small').innerText !== 'just now' ){
        fristTimeOnly = false;
        fetch('/removeNotificatons').catch(()=>{console.error('internal server error')});
    }
    else
        socket.emit('send-'+e.target.id.split('_')[0]+'-Notify', e.target.value, me);
})

socket.on('messagesId',async (friendId, chatId)=>{
    setTimeout(() => {
        document.getElementById('chat_'+friendId).value = chatId;
    },200)

    fetch('/sessionUpdate',{
        method:'post',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({type:'addChatId',friendId, chatId})
    }).catch(err=>{console.error(err)})
});

const notificationEle =document.querySelector('.toast-container')
const content = document.querySelector('.toast-container .toast-body')


let editPage = (type, sender, id)=>{
    let btn ;
    switch (type) {
        case 'sendReq':
            
            if(sender === 'me'){
                btn= document.getElementById('add-friend_'+id);
                btn.parentElement.innerHTML += 
                `<button class='btn btn-danger h-100' id='cancel-req_${id}' value=${btn.value}> Cancel Request </button>`;
            }else{
                btn= document.getElementById('add-friend_'+id);
                btn.parentElement.innerHTML += 
                `<button class='btn btn-success h-100' id='accept_${id}' value=${btn.value}> Accept </button>
                <button class='btn btn-danger h-100' id='reject_${id}' value=${btn.value}> Reject </button>`;
            }
            document.getElementById('add-friend_'+id)?.remove();
            break;
        case 'deleteReq':
            if(sender === 'me'){
                btn = document.getElementById('cancel-req_'+id);
                
                btn.parentElement.innerHTML += 
                `<button class='btn btn-primary h-100' id="add-friend_${id}" value=${btn.value}> Add Friend </button>`
                document.getElementById('cancel-req_'+id)?.remove();
            }else{
                btn = document.getElementById('accept_'+id);
                
                btn.parentElement.innerHTML += 
                `<button class='btn btn-primary h-100' id="add-friend_${id}" value=${btn.value}> Add Friend </button>`
                document.getElementById('accept_'+id)?.remove()
                document.getElementById('reject_'+id)?.remove();
            }
            break;
        case 'rejectReq':
            if(sender === 'him'){
                btn = document.getElementById('reject_'+id);
                
                btn.parentElement.innerHTML += 
                `<button class='btn btn-primary h-100' id="add-friend_${id}" value=${btn.value}> Add Friend </button>`
                document.getElementById('reject_'+id)?.remove();
                document.getElementById('accept_'+id)?.remove()
            }
            else{
                btn = document.getElementById('cancel-req_'+id);
                
                btn.parentElement.innerHTML += 
                `<button class='btn btn-primary h-100' id="add-friend_${id}" value=${btn.value}> Add Friend </button>`
                document.getElementById('cancel-req_'+id)?.remove();
            }
            break;
        case 'acceptReq':
            if(sender === 'him'){
                btn = document.getElementById('accept_'+id);
                
                btn.parentElement.innerHTML += 
                `<button class='btn btn-primary h-100 me-3' id="chat_${id}" value=${btn.value}> Chat </button>
                <button class='btn btn-danger h-100' id="unfriend_${id}" value=${btn.value}> Unfriend </button>
                `
                document.getElementById('accept_'+id)?.remove()
                document.getElementById('reject_'+id)?.remove();
            }
            else{
                btn = document.getElementById('cancel-req_'+id);
                
                btn.parentElement.innerHTML += 
                `<button class='btn btn-primary me-3 h-100' id="chat_${id}" value=${btn.value}> Chat </button>
                <button class='btn btn-danger h-100' id="unfriend_${id}" value=${btn.value}> Unfriend </button>
                `
                document.getElementById('cancel-req_'+id)?.remove()
            }
            break;
        case 'unfriend':
            btn = document.getElementById('unfriend_'+id);
            
            btn.parentElement.innerHTML += 
            `<button class='btn btn-primary h-100' id="add-friend_${id}" value=${btn.value}> Add Friend </button>`
            document.getElementById('unfriend_'+id)?.remove();
            document.getElementById('chat_'+id)?.remove();
            break;
    }
}

socket.on('sessionEdit',async data=>{
    await fetch('/sessionUpdate',{
        method:'post',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
    }).then(()=>{
        editPage(data.type, data.value.sender, data.value.userId);
    }).catch(err=>{console.error(err)})
})

socket.on('friendReqNotify', friend=>{

    notificationEle.innerHTML += `
    <div class="toast show">
        <div class="toast-header">
            <img class="rounded-circle" src="/${friend.image}" style='width:50px; height:50px'>
            <strong class="me-auto">${friend.name}</strong>
            <small class="text-muted">just now</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body d-flex justify-content-between">
            <p>Accept friend request?</p>
            <div>
                <button class="btn btn-success" id="accept_${friend._id}" value=${JSON.stringify(friend)}> Accept </button>
                <button class="btn btn-danger" id="reject_${friend._id}" value=${JSON.stringify(friend)}> Reject </button>
            </div>
        </div>
    </div>
    `
})

socket.on('notify', msg=>{
    notificationEle.innerHTML += `
    <div class="toast show">
        <div class="toast-header">
            <strong class="me-auto">New Notifcation</strong>
            <small class="text-muted">just now</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${typeof msg === "string"? msg : "something went wrong"}
        </div>
    </div>
    `
})


