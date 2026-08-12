/**
 * Returns a middleware that validates req[property] against a Zod schema.
 * On success, replaces req[property] with the parsed (coerced) value.
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    // SOLUTION [Level 1]: Zod request validation
    try {
      const parsed = schema.parse(req[property]);
      req[property] = parsed;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { validate };
