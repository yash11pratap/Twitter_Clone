import validator from 'validator';
import { User } from '../users'
import Profile from '../profiles/profile.model'
import { pick } from 'lodash'
import { ErrorHandler } from '../../utils/error'
import { Request,Response,NextFunction } from 'express';

export const registerUser = async (req : Request, res : Response) => {
  const userBody = pick(req.body, ['name', 'email', 'password', 'username', 'avatar']);

  if (await User.isEmailTaken(userBody.email)) {
    throw new ErrorHandler(400, 'Email already taken');
  }

  if (await User.isUsernameTaken(userBody.username)) {
    throw new ErrorHandler(400, 'Username already taken');
  }

  const user = await User.create(userBody);

  const [token] = await Promise.all([
    user.generateAuthToken(),
    // Create user profile
    Profile.create({ user: user._id }),
  ]);

  return res.status(201).json({ user, token });
};

export const loginUser = async (req : Request, res : Response) => {
  const { username, password } = req.body;

  const isEmail = validator.isEmail(username);

  const user = await User.findByCredentials(username, password, isEmail);
  const token = await user.generateAuthToken();

  return res.status(200).json({ user, token });
};
