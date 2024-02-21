const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    age:{
        type: Number,
        required: true
    },
    email: {
        type: String
    },
    mobile: {
        type: String
    },
    address: {
        type: String,
        required: true
    },
    aadharCardNumber: {
        type: Number,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['voter','admin'],
        default: 'voter'
    },
    isVoted: {
        type: Boolean,
        default: false
    }
});

userSchema.pre('save',async function(next){
    const person = this
    //hash the password only when it's been modified or is new.
    if(!person.isModified('password')) return next();
    try{
        //generate the salt
        const salt = await bcrypt.genSalt(10);
        //generate hash
        const hashedPassword = await bcrypt.hash(person.password,salt);
        person.password = hashedPassword;
    }catch(err){
        return next(err);
    }
    next();
})

userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        const isMatch = await bcrypt.compare(candidatePassword,this.password);
        return isMatch
    }catch(err){
        throw err
    }
}

const User = mongoose.model('User',userSchema);
module.exports = User;