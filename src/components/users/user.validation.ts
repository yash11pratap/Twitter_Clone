import Joi from 'joi'
import { roles } from '../../config/roles'
import { objectId, password, username, url } from '../../utils/customValidation'
import validate from '../../middleware/validate'
import { Request,Response,NextFunction } from 'express'
/* 
  Defining validation as middleware functions gives access to
  information from request and response objects, allowing to change the schema
  based on criteria for example: if a user is an admin, it can also update the user role
*/

export const getUsers = (req : Request, res : Response, next: NextFunction) => {
  const schema = {
    query: Joi.object().keys({
      name: Joi.string(),
      role: Joi.string(),
      sortBy: Joi.string(),
      limit: Joi.number().integer(),
      page: Joi.number().integer(),
    }),
  };

  validate(schema)(req , res , next );
};

export const getUser = (req : Request, res : Response, next: NextFunction) => {
  const schema = {
    params: Joi.object().keys({
      userId: Joi.string().required().custom(objectId),
    }),
  };

  validate(schema)(req , res , next);
};

export const createUser = (req : Request, res : Response, next: NextFunction) => {
  const schema = {
    body: Joi.object().keys({
      name: Joi.string().required(),
      username: Joi.string().required().min(3).max(30).custom(username),
      email: Joi.string().required().email(),
      password: Joi.string().required().custom(password),
      role: Joi.string()
        .required()
        .valid(...roles),
      avatar: Joi.string().custom(url).max(255),
    }),
  };

  validate(schema)(req , res , next);
};

export const updateUser = (req : Request, res : Response, next) => {
  const schemaRules = {
    params: {
      userId: Joi.required().custom(objectId),
    },
    body: {
      name: Joi.string(),
      username: Joi.string().min(3).max(30).custom(username),
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      avatar: Joi.string().custom(url).max(255).allow(''),
    },
  };

  // Admin can also update user role
  if (res.locals.user.role === 'admin') {
    (schemaRules.body as any).role = Joi.string().valid(...roles);
  }

  validate(schemaRules)(req , res , next);
};

export const deleteUser = (req : Request, res : Response, next) => {
  const schema = {
    params: Joi.object().keys({
      userId: Joi.string().required().custom(objectId),
    }),
  };

  validate(schema)(req , res , next);
};


