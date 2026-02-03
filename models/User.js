import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SECRET_ACCESS_TOKEN } from '../app.js';
import { JWT_CONFIG } from '../config/index.js';
import RoleSchema from './Role.js';
const userSchema = new mongoose.Schema({
      username:{
        type: String,
        required: [true, 'Username required!'],
        unique: true,
      },
      fullname:{
        type: String,
        required: [true, 'Fullname required!'],
      },
        password:{
            type: String,
            required: [true, 'Password required!'],
        },

        feiid:{
            type: String,
            minlength: [8, 'FEI ID must be at 8 characters!'],
            maxlength: [8, 'FEI ID must be at 8 characters!'],
            default: '00000000',
        unique: true,
        },
        active:{
          type: Boolean,
          default: true,
          required: [true, 'Active status required']
        },
       role:{
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
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
  });
};
const User = mongoose.model('users', userSchema);
export default User;