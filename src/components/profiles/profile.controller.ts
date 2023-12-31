import { pick } from 'lodash'
import Profile from './profile.model'
import { ErrorHandler } from '../../utils/error'
import User from '../users/user.model'
import Tweet from '../tweets/tweet.model'
import { Request,Response,NextFunction } from 'express';

export const getProfile = async (req : Request, res : Response) => {
  const { userId } = req.params;

  const profile = await Profile.findOne({
    user: userId,
  }).populate('user', ['name', 'username', 'avatar']);

  if (!profile) {
    throw new ErrorHandler(404, 'Profile not found');
  }

  res.json({ profile });
};

export const getProfiles = async (req : Request, res : Response) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const filters = pick(req.query, ['following', 'followers', 'likes', 'retweets']);

  if (filters.following && !(await User.exists({ _id: filters.following }))) {
    throw new ErrorHandler(404, 'User does not exists');
  }

  if (filters.followers && !(await User.exists({ _id: filters.followers }))) {
    throw new ErrorHandler(404, 'User does not exists');
  }

  if (filters.likes && !(await Tweet.exists({ _id: filters.likes }))) {
    throw new ErrorHandler(404, 'Tweet does not exists');
  }

  if (filters.retweets && !(await Tweet.exists({ _id: filters.retweets }))) {
    throw new ErrorHandler(404, 'Tweet does not exists');
  }

  (options as any).populate = {
    path: 'user',
    select: ['name', 'username', 'avatar'],
  };

  const profiles = await (Profile as any).paginate(filters, options);

  res.json(profiles);
};

export const updateProfile = async (req : Request, res : Response) => {
  const { userId } = req.params;

  const fields = ['bio', 'location', 'website', 'birthday', 'backgroundImage'];

  const newValues = pick(req.body, fields);

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ErrorHandler(404, 'Profile not found');
  }

  Object.assign(profile, newValues);

  await profile.save();

  res.json({ profile });
};

export const followProfile = async (req : Request, res : Response) => {
  const { userId } = req.params;
  const { _id: authUserId } = res.locals.user;

  if (userId === authUserId.toString()) {
    throw new ErrorHandler(400, 'You cannot follow your own profile');
  }

  const [authUserProfile, profileToFollow] = await Promise.all([
    Profile.findOne({ user: authUserId }),
    Profile.findOne({ user: userId }),
  ]);

  if (!profileToFollow) {
    throw new ErrorHandler(404, 'Profile does not exists');
  }

  if ((authUserProfile as any).isFollowing(userId)) {
    throw new ErrorHandler(400, 'You already follow that profile');
  }

  profileToFollow.followers.push(authUserId);

  await Promise.all([(authUserProfile as any).follow(userId), profileToFollow.save()]);

  return res.json({ profile: authUserProfile });
};

export const unfollowProfile = async (req : Request, res : Response) => {
  const { userId } = req.params;
  const { _id: authUserId } = res.locals.user;

  if (userId === authUserId.toString()) {
    throw new ErrorHandler(400, 'You cannot unfollow your own profile');
  }

  const [authUserProfile, profileToFollow] = await Promise.all([
    Profile.findOne({ user: authUserId }),
    Profile.findOne({ user: userId }),
  ]);

  if (!profileToFollow) {
    throw new ErrorHandler(404, 'Profile does not exists');
  }

  if (!(authUserProfile as any).isFollowing(userId)) {
    throw new ErrorHandler(400, 'You do not follow that profile');
  }

   (profileToFollow as any).followers.remove(authUserId);

  await Promise.all([(authUserProfile as any).unfollow(userId), profileToFollow.save()]);

  return res.json({ profile: authUserProfile });
};
