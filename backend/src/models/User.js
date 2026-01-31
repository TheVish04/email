import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLE_VALUES = ['IT', 'HR', 'Finance', 'Customer Support', 'Legal', 'Admin', 'Manager', 'Agent'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: {
      type: String,
      required: true,
      enum: ROLE_VALUES,
    },
    department: {
      type: String,
      default: null,
      enum: ROLE_VALUES,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);
