/**
 * Returns a middleware that validates req[property] against a Zod schema.
 * On success, replaces req[property] with the parsed (coerced) value.
 *
 * TODO [Level 1]: Wire Zod validation
 * - Call schema.parse(req[property])
 * - Assign the parsed result back to req[property]
 * - On failure, pass the error to next(err) so the error handler can format it
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    // TODO [Level 1]: Implement Zod request validation
    // Currently validation is skipped so invalid payloads reach controllers.
    void schema;
    void property;
    return next();
  };
}

module.exports = { validate };
