import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SECRET_ACCESS_TOKEN } from '../app.js';
import RoleSchema from './Role.js';
const userSchema = new mongoose.Schema({
      username:{
        type: String,
        required: [true, 'Username required!'],
        unique: true,
      },
        password:{
            type: String,
            required: [true, 'Password required!'],
        },
        feiid:{
            type: String,
            required: [true, 'FEI-ID required!'],
        unique: true,
        },
       Role:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'roles',
            required: [true, 'Role required!'],
        },
        
},{ timestamps: true });

userSchema.pre("save", function (next) {
    const user = this;

    if (!user.isModified("password")) return next();
    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) return next(err);

            user.password = hash;
            next();
        });
    });
});

userSchema.methods.generateAccessJWT = function () {
  let payload = {
    id: this._id,
  };
  return jwt.sign(payload, SECRET_ACCESS_TOKEN, {
    expiresIn: '20m',
  });
};
const User = mongoose.model('users', userSchema);
export default User;