import Joi from "joi";

export const validatePost = (data) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    text: Joi.string().required(),
    mediaUrls: Joi.array().items(Joi.string()),
  });
  return schema.validate(data);
};
