import mongoose from 'mongoose'
import dbConnect from './dbConnect.js'
import bcrypt from "bcrypt"
import {createMessagesDoc} from './chats.js'

const uSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    image:{
        type:String,
        default: "user.png"
    },
    friends:{
        type:[{userId:String, name:String, image:String}],
        default:[]
    },
    friendsReqs:{
        type:[{userId:String, name:String, image:String, sender:String}],
        default:[]
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
    notifications:{
        type: [{Ntype: String, msg: String, timestamps: String, sender: Object}],
        default:[]
    },
    chats:{
        type:[{friendId:String, chatId:{type: mongoose.Schema.Types.ObjectId, ref: "message"}}],
        default:[]
    }
})

const usersModel = new mongoose.model('user',uSchema)


export const createUser =  async data =>{
    let encrypted;
    await bcrypt.hash(data.password, 10).then( val=>{
        data.password = val;
        encrypted = true;
    }).catch(()=>{
        encrypted= false;
    })
    if(encrypted){
        try {
            return dbConnect(async ()=>{
                return await new usersModel(data).save().then(()=>null).catch(()=>{
                    throw null
                })
            })
        } catch (err) {
            throw null
        }
    }else throw false;
}

export const authUser = data =>{
    let value;
    let user; 
    try {
        return dbConnect(async ()=>{
            let isErr = false;
            user = await usersModel.findOneAndUpdate({ email: data.email },{$set:{isOnline:true}})
            .catch(()=>{
                isErr = true;
                throw null
            });
            if(isErr) throw null;
            else if(!user) value = "there is no account match this email";
            else {
                value = await bcrypt.compare(data.password, user.password)
                .then(valid =>{
                    if(!valid) return "email and password not matched"
                    else{
                        user.password = null;
                        user.email = null;
                        return user;
                    }
                }).catch(()=>{
                    throw null;
                })
            }
            return value
        })
    } catch (err) {
        throw null
    }
}

export const makeOffline = id =>{
    try {
        return dbConnect(async()=>{
            return await usersModel.findByIdAndUpdate(id, {$set:{isOnline:false}}).then((()=>null))
            .catch(()=>{
                throw null
            })
        })
    } catch (err) {
        throw null
    }
}

export const getUser = id=>{
    try {
        return dbConnect(async()=>{
            let isErr = false;
            let value = await usersModel.findById(id, {email:false, password:false, friendsReqs:false})
            .catch(()=>{
                isErr = true;
                throw null
            })
            if(isErr) throw null;
            else return value
        })
    } catch (err) {
        throw null
    }
}

export const getAllUsers = ()=>{
    try {
        return dbConnect(async()=>{
            let isErr = false;
            let value = await usersModel.find({}, {name: true, image: true})
            .catch(()=>{
                isErr = true;
                throw null
            })
            if(isErr) throw null;
            else return value
        })
    } catch (err) {
        throw null
    }
}

export const updateProfile = data=>{
    try {
        return dbConnect(async()=>{
            let changed = {};
            let isErr = false;
            let error = false;
            if(data.name){
                console.log(data.friendsIds)
                await usersModel.updateOne(
                    {_id:data.userId},
                    {$set:{name:data.name}}
                ).then(()=>{
                    changed.name = data.name;
                }).catch((err)=>{
                    isErr = true;
                    error = err
                })
                if(data.friendsIds)
                    await usersModel.updateMany(
                        {_id:{$in:JSON.parse(data.friendsIds)},'friends.userId':data.userId},
                        {$set:{'friends.$.name':data.name}}
                    ).then(()=>{
                        changed.name = data.name;
                    }).catch((err)=>{
                        isErr = true;
                        error = err
                    })
                if(data.friendsReqsIds)
                    await usersModel.updateMany(
                        {_id:{$in:JSON.parse(data.friendsReqsIds)},'friendsReqs.userId':data.userId},
                        {$set:{'friendsReqs.$.name':data.name}}
                    ).then(()=>{
                        changed.name = data.name;
                    }).catch((err)=>{
                        isErr = true;
                        error = err
                    })
            }
            if(data.filename){
                await usersModel.updateOne({_id:data.userId}, {$set:{image:data.filename}}).then(()=>{
                    changed.image = data.filename;
                }).catch(()=>{
                    isErr = true;
                })
                if(data.friendsIds)
                    await usersModel.updateMany(
                        {_id:{$in:JSON.parse(data.friendsIds)},'friends.userId':data.userId}, 
                        {$set:{'friends.$.image':data.filename}}
                    ).then(()=>{
                        changed.image = data.filename;
                    }).catch(()=>{
                        isErr = true;
                    })
                if(data.friendsReqsIds)
                    await usersModel.updateMany(
                        {_id:{$in:JSON.parse(data.friendsReqsIds)},'friendsReqs.userId':data.userId}, 
                        {$set:{'friendsReqs.$.image':data.filename}}
                    ).then(()=>{
                        changed.image = data.filename;
                    }).catch(()=>{
                        isErr = true;
                    })
            }
            if(data.oldPass){
                await usersModel.findById(data.userId,{password:true}).then(async obj=>{
                    await bcrypt.compare(data.oldPass, obj.password).then(async matched=>{
                        if(matched){
                            let newPass = data.newPass1;
                            await bcrypt.hash(newPass, 10).then(async password=>{
                                await usersModel.updateOne({_id:data.userId}, {$set:{password}})
                                .catch(()=>{
                                    isErr = true;
                                })
                            }).catch(()=>{
                                isErr = true;
                            })
                        }else {
                            isErr = true;
                            error = 'the password is wrong';
                        }
                    }).catch((err)=>{
                        isErr = true;
                        error = err
                    })
                }).catch((err)=>{
                    isErr = true;
                    error = err
                })}
            console.log(error)
            if(isErr) throw error  ? error : null;
            else return Object.keys(changed).length? changed : null;
            })
    } catch (err) {
        throw null
    }
}

export const sendReq = data =>{
    try{
        return dbConnect(async()=>{
            let isErr= false;
            await usersModel.updateOne({_id:data.friendId},{$push:{friendsReqs:{
                userId:data.myId,
                name:data.myName,
                image:data.myImg,
                sender:"him"
            }}}).catch(()=>{
                isErr = true;
            })
            await usersModel.updateOne({_id:data.myId},{$push:{friendsReqs:{
                userId:data.friendId,
                name:data.friendName,
                image:data.friendImg,
                sender:"me"
            }}}).catch(()=>{
                isErr = true;
            })
            if(isErr) throw null
            else return null
        })
    }catch (err){
        throw null
    }
}
export const deleteReq = data =>{
    try{    
        return dbConnect(async()=>{
            let isErr= false;
            await usersModel.updateOne({_id:data.friendId},{$pull:{friendsReqs:{
                userId:data.myId
            }}}).catch(()=>{
                isErr = true;
            })
            await usersModel.updateOne({_id:data.myId},{$pull:{friendsReqs:{
                userId:data.friendId
            }}}).catch(()=>{
                isErr = true;
            })
            if(isErr) throw null
            else return null
        })
    }catch (err){
        throw null
    }
}

export const addFriend = data =>{
    try{
        return dbConnect(async()=>{
            let value;
            let isErr= false;
            await usersModel.updateOne({_id:data.friendId},
                {
                    $push:{friends:{
                        userId:data.myId,
                        name:data.myName,
                        image:data.myImg
                    }},
                    $pull:{friendsReqs:{
                        userId:data.myId
                    }}
                }
            ).catch(()=>{
                isErr = true;
            })
            await usersModel.updateOne({_id:data.myId},
                {
                    $push:{friends:{
                        userId:data.friendId,
                        name:data.friendName,
                        image:data.friendImg
                    }},
                    $pull:{friendsReqs:{
                        userId:data.friendId
                    }}
                }
            ).catch(()=>{
                isErr = true;
            })
            await createMessagesDoc(data.myId, data.friendId).then(async chatId=>{
                await usersModel.updateOne({_id:data.myId}, {$push:{chats:{friendId: data.friendId, chatId} }})
                .catch(()=>{
                    isErr = true;
                });
                await usersModel.updateOne({_id:data.friendId}, {$push:{chats:{friendId: data.myId, chatId} }})
                .catch(()=>{
                    isErr = true;
                });
                value = chatId;
            }).catch(()=>{
                throw null;
            })
            if(isErr) throw null
            else return value;
        })
    }catch (err){
        throw null
    }
}

export const deleteFriend = data=>{
    try{
        return dbConnect(async()=>{
            let isErr= false;
            await usersModel.updateOne({_id:data.friendId},{$pull:{
                friends:{
                    userId:data.myId
                },
                chats:{
                    friendId:data.myId
                }
            }}).catch(()=>{
                isErr = true;
            })
            await usersModel.updateOne({_id:data.myId},{$pull:{
                friends:{
                    userId:data.friendId
                },
                chats:{
                    friendId: data.friendId
                }
            }}).catch(()=>{
                isErr = true;
            })
            if(isErr) throw null
            else return null
        })
    }catch (err){
        throw null
    }
}

export const saveNotify = (id, Ntype, msg)=>{
    try {
        return dbConnect(async()=>{
            return await usersModel.updateOne({_id:id}, {$push:{notifications:{Ntype, msg, timestamps:new Date().toLocaleString("en")}}}).then(()=> null)
            .catch(()=>{throw null});
        })
    } catch (err) {
        throw null
    }
}

export const storeMsgNotify = (sender, receiverId, msg)=>{
    try {
        return dbConnect(async()=>{
            return await usersModel.updateOne({_id:receiverId}, {$push:{notifications:{Ntype:"newMsg", msg, timestamps:new Date().toLocaleString("en"), sender}}}).then(()=> null)
            .catch(()=>{throw null});
        })
    } catch (err) {
        throw null
    }
}

export const deleteNotificatons = id =>{
    try {
        return dbConnect(async()=>{
            return await usersModel.updateOne({_id:id}, {$set:{notifications:[] }}).then(()=>null)
            .catch(()=>{throw null});
        })
    } catch (err) {
        throw null
    }
}
