import mongoose from "mongoose";
import dbConnect from "./dbConnect.js";
import crypto from 'crypto'

const Schema = new mongoose.Schema({
    usersIds:[],
    messages:{
        type:[{
            sender: String,
            content: String,
            timestamps: String,
        }],
        default: []
    }
})

const messages = new mongoose.model('message',Schema);

export const createMessagesDoc =async (...usersIds)=>{
    // let exist = false;
    let messagesId ;
    try {
        messagesId = await messages.find({ usersIds:{$all:[usersIds[0], usersIds[1]]} }, {_id:1}).then(messages=>
            /* messages.forEach(obj => {
                exist = obj.usersIds[0] === usersIds[0]? obj.usersIds[1] === usersIds[1]? true:false:
                obj.usersIds[0] === usersIds[1]? obj.usersIds[1] === usersIds[0]? true:false:false;
                if(exist)
                    messagesId = obj._id;
            }); */
            messages._id
        ).catch(()=>{
            throw null;
        });
        if(messagesId) return messagesId;
        else{
            return await new messages({usersIds}).save().then(mObj=>{
                return mObj._id
            }).catch(()=>{
                throw null
            })
        }
    } catch (err) {
        throw null;
    }
}
//  
const initVector = Buffer.from('c6df8ac6526ac643e96bc6df54d2e07b', 'hex');
const securityKey = Buffer.from('2239348ecdbfcc71dc17dcec5e99b7cda850a382f0b54f153bf4a1619269b957', 'hex');



export const getMessages = id =>{
    try {
        return dbConnect(async ()=>{
            return await messages.findById(id).then(msgObj=>{
                if(msgObj.messages.length){
                    msgObj.messages.forEach(msg=>{
                        if(msg.content !== "Deleted Message"){
                            const decipher = crypto.createDecipheriv('aes-256-cbc', securityKey, initVector)
                            let decryptedMsg = decipher.update(msg.content, 'hex', 'utf-8');
                            decryptedMsg += decipher.final('utf-8');
                            msg.content = decryptedMsg;
                        }
                    })
                }
                return msgObj
            }).catch(()=>{
                throw null
            })
        })
    } catch (err) {
        throw null
    }
}

export const saveMsg = (myId, FId, msg)=>{
    try {
        return dbConnect(async ()=>{
            const cipher = crypto.createCipheriv('aes-256-cbc', securityKey, initVector)
            let criptedMsg = cipher.update(msg, 'utf-8', 'hex');
            criptedMsg += cipher.final('hex');
            return await messages.findOneAndUpdate({usersIds:{$all:[myId, FId]}},
                {$push:{messages:{
                    sender:myId,
                    content:criptedMsg,
                    timestamps:new Date().toLocaleString('en-gb')
                }}
            }).then(msgObj=>{
                var values = msgObj.messages.pop();
                return {chatId: msgObj._id, msg:{_id:String(values._id), timestamps:values.timestamps, content:msg}}
            }).catch(()=>{
                throw null
            })
        })
    } catch (err) {
        throw null
    }
}

export const deleteMsgdb = data=>{
    try {
        return dbConnect(async ()=>{
            return await messages.updateOne({_id:data.chatId,'messages._id': data.msgId},
                {$set:{'messages.$.content': 'Deleted Message'}
            }).catch(()=>{
                throw null
            })
        })
    } catch (err) {
        throw null
    }
}