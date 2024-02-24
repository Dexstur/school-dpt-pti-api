import Joi from "joi";

export const registrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  middleName: Joi.string().allow("").optional(),
  schoolId: Joi.string().required(),
  adminKey: Joi.string().allow("").optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const userUpdateSchema = Joi.object({
  firstName: Joi.string().allow("").optional(),
  lastName: Joi.string().allow("").optional(),
  middleName: Joi.string().allow("").optional(),
  schoolId: Joi.string().allow("").optional(),
});

export const courseCreation = Joi.object({
  name: Joi.string().min(6).required(),
  code: Joi.string().required(),
  lecturer: Joi.string().optional(),
});

export const taskCreation = Joi.object({
  name: Joi.string().min(3).required(),
  description: Joi.string().allow("").optional(),
  document: Joi.string().required(),
  deadline: Joi.string().allow("").optional(),
});
