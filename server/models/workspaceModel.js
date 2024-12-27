const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
    name: {
        type: String,
       
      
    },
    phoneNumber: {
        type: String,
       
      
    },
    domainName: {
        type: String,
       
      
    },
    email: {
        type: String,
       
    },
    password: {
        type: String,
       
    },
    otp: {
        type: Number,
       
    },
    isOtpVerified:{
        type:Boolean,
        default:false
    },
    isVerifiedUser:{
        type:Boolean,
        default:false
    },
    isDomainVerified:{
        type:Boolean,
        default:false
    },
    databaseName:{
        type:String,
    },
    databaseStatus:{
        type:String,
        enum:["Run","Stop"],
        default:"Run"
    },
    otpExpiresAt: {
        type: Date, 
    },
   
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active',
    },
  
}
,{
    timestamps: true,
    collection: "Workspace", 
});



const workSpace = mongoose.model('Workspace', workspaceSchema);
module.exports = workSpace;
