import mongoose from "mongoose";

export default cb=>{
        return new Promise(async (resolve, reject)=>{
                await mongoose.connect('mongodb+srv://AhmedMagdy:LKcTDdxmvtIV2yoY@cluster0.kbcoecs.mongodb.net/Chatting-App?retryWrites=true&w=majority')
                .then(()=>{
                        return cb()
                        .then( resalt =>{
                                resalt? resolve(resalt) : resolve();
                        }).catch(err=>{
                                err? reject(err) : reject()
                        })
                })
                .catch(err=>{
                        err? reject(err) : reject()
                })
                mongoose.disconnect();
        })
}