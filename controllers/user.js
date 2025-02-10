import {sendReq, deleteReq, addFriend, deleteFriend, saveNotify, storeMsgNotify} from '../models/users.js'

export const add = (io, friendObj, me) =>{
    const friend = JSON.parse(friendObj);
    const friendId = friend.userId? friend.userId : friend._id
    sendReq({
        friendId:friendId, friendName:friend.name, friendImg:friend.image,
        myId:me._id, myName:me.name, myImg: me.image
    }).then(()=>{
        io.to(me._id).emit('sessionEdit',{type:'sendReq',value:{userId:friendId, name:friend.name, image:friend.image, sender:'me'}})
        
        if(io.onlineUsers[friendId]){
            io.to(friendId).emit('sessionEdit',{type:'receiveReq',value:{userId:me._id, name:me.name, image:me.image, sender:'him'}})
            io.to(friendId).emit('friendReqNotify',me)
        }else saveNotify(friendId, 'friendReqNotify', JSON.stringify(me))
        
        io.to(me._id).emit('notify','your friend request sent')
    }).catch(()=>{
        io.to(me._id).emit('notify','internal server error');
    })
}

export const pullReq = (io, friendObj, me) =>{
    const friend = JSON.parse(friendObj);
    const friendId = friend.userId? friend.userId : friend._id
    deleteReq({friendId, myId:me._id}).then(()=>{
        io.to(me._id).emit('sessionEdit',{type:'deleteReq',value:{userId:friendId, sender:'me'}})
        
        if(io.onlineUsers[friendId]) io.to(friendId).emit('sessionEdit',{type:'deleteReq',value:{userId:me._id, sender:'him'}});

        io.to(me._id).emit('notify','request canceled successfully')
    }).catch(()=>{
        io.to(me._id).emit('notify','internal server error');
    })
}

export const acceptReq = async (io, friendObj, me) =>{
    const friend = JSON.parse(friendObj);
    const friendId = friend.userId? friend.userId : friend._id
    await addFriend({
        friendId, friendName:friend.name, friendImg:friend.image,
        myId:me._id, myName:me.name, myImg: me.image
    }).then(chatId=>{

        io.to(me._id).emit('sessionEdit',{type:'acceptReq',value:{userId:friendId, name:friend.name, image:friend.image,sender:'him'}})

        if(io.onlineUsers[friendId]){
            io.to(friendId).emit('sessionEdit',{type:'acceptReq',value:{userId:me._id, name:me.name, image:me.image,sender:'me'}})
            io.to(friendId).emit('notify',me.name+' accept your friend request')
        }else saveNotify(friendId, 'notify', me.name+' accept your friend request')

        io.to(me._id).emit('notify',friend.name+' and you become friends')
        io.to(me._id).emit('messagesId', friendId, chatId)
        io.to(friendId).emit('messagesId', me._id, chatId)
    }).catch(()=>{
        io.to(me._id).emit('notify','internal server error');
    })
}

export const rejectReq = (io, friendObj, me) =>{
    const friend = JSON.parse(friendObj);
    const friendId = friend.userId? friend.userId : friend._id
    deleteReq({friendId, myId:me._id}).then(()=>{
        io.to(me._id).emit('sessionEdit',{type:'rejectReq',value:{userId:friendId, sender:'him'}})
        
        if(io.onlineUsers[friendId]){
            io.to(friendId).emit('sessionEdit',{type:'rejectReq',value:{userId:me._id, sender:'me'}})
            io.to(friendId).emit('notify',me.name+' reject your friend request')
        }else saveNotify(friendId, 'notify', me.name+' reject your friend request')

        io.to(me._id).emit('notify','request rejected successfully')
    }).catch(()=>{
        io.to(me._id).emit('notify','internal server error');
    })
}

export const remove = (io, friendObj, me) =>{
    const friend = JSON.parse(friendObj);
    const friendId = friend.userId? friend.userId : friend._id
    deleteFriend({friendId, myId:me._id}).then(()=>{
        io.to(me._id).emit('sessionEdit',{type:'unfriend',value:{userId:friendId}})
        
        if(io.onlineUsers[friendId]){
            io.to(friendId).emit('sessionEdit',{type:'unfriend',value:{userId:me._id}})
            io.to(friendId).emit('notify',me.name+' removed you from friends')
        }else saveNotify(friendId, 'notify', me.name+' removed you from friends')

        io.to(me._id).emit('notify',friend.name+' removed from your friends')
    }).catch(()=>{
        io.to(me._id).emit('notify','internal server error');
    })
}

export const storeNewMsgNotify =async (sender, receiverId, msg)=>{
    storeMsgNotify(sender, receiverId, msg).catch(()=>{})
}