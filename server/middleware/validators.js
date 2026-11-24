/**
 * validators.js — request input validation (express-validator)
 *
 * Each export is an array of middleware: the field checks followed by
 * `validate`, which stops the request with 400 if any check failed.
 * This makes sure fields have the right TYPE (e.g. email is a string, not an
 * object like {"$ne": null}), a sensible length, and allowed values only.
 */
const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const first = errors.array()[0];
  return res.status(400).json({
    message: first.msg,
    errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
  });
};

// ── Reusable field rules ─────────────────────────────────────────────────────
const mongoId = (field, where = body) =>
  where(field).isMongoId().withMessage(`${field} must be a valid id`);

const text = (field, { min = 1, max, optional = false } = {}) => {
  let chain = body(field);
  if (optional) chain = chain.optional({ values: 'null' });
  return chain
    .isString().withMessage(`${field} must be text`)
    .bail()
    .trim()
    .isLength({ min, max }).withMessage(
      min > 0 ? `${field} must be ${min}–${max} characters` : `${field} must be at most ${max} characters`
    );
};

// Skills arrive as string[] (old format) or {name, level}[] (new format)
const skillList = (field) =>
  body(field)
    .optional()
    .isArray({ max: 30 }).withMessage(`${field} must be a list of at most 30 skills`)
    .bail()
    .custom(list => list.every(s => {
      const name = typeof s === 'string' ? s : s && typeof s === 'object' ? s.name : null;
      return typeof name === 'string' && name.trim().length > 0 && name.length <= 50;
    }))
    .withMessage(`Each skill in ${field} must have a name of 1–50 characters`);

const role = body('role')
  .optional()
  .isIn(['Learner', 'Mentor']).withMessage('role must be Learner or Mentor');

const idParam = (name = 'id') => [mongoId(name, param), validate];

// ── Auth ─────────────────────────────────────────────────────────────────────
const registerRules = [
  text('name', { min: 1, max: 60 }),
  body('email').isString().withMessage('A valid email is required').bail().trim().isEmail().withMessage('A valid email is required'),
  body('password')
    .isString().withMessage('password must be text')
    .bail()
    .isLength({ min: 6, max: 128 }).withMessage('password must be 6–128 characters'),
  role,
  skillList('skillsOffered'),
  skillList('skillsWanted'),
  text('bio', { min: 0, max: 500, optional: true }),
  validate,
];

const loginRules = [
  body('email').isString().withMessage('A valid email is required').bail().trim().isEmail().withMessage('A valid email is required'),
  body('password').isString().withMessage('password is required').bail().notEmpty().withMessage('password is required'),
  validate,
];

// ── Users ────────────────────────────────────────────────────────────────────
const updateProfileRules = [
  text('name', { min: 1, max: 60, optional: true }),
  text('bio', { min: 0, max: 500, optional: true }),
  role,
  skillList('skillsOffered'),
  skillList('skillsWanted'),
  validate,
];

// ── Community ────────────────────────────────────────────────────────────────
const joinCommunityRules   = [mongoId('communityId'), validate];
const createCommunityRules = [text('name', { min: 2, max: 50 }), validate];

// ── Endorsements ─────────────────────────────────────────────────────────────
const endorseRules = [
  mongoId('toUserId'),
  mongoId('sessionId'),
  text('skill', { min: 1, max: 50 }),
  validate,
];

// ── Feedback ─────────────────────────────────────────────────────────────────
const feedbackRules = [
  mongoId('toUserId'),
  text('message', { min: 1, max: 1000 }),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be a whole number from 1 to 5').toInt(),
  validate,
];

// ── Mentorship ───────────────────────────────────────────────────────────────
const mentorshipRequestRules = [
  mongoId('receiverId'),
  text('message', { min: 0, max: 500, optional: true }),
  body('skillsRequested')
    .optional()
    .isArray({ max: 20 }).withMessage('skillsRequested must be a list of at most 20 skills')
    .bail()
    .custom(list => list.every(s => typeof s === 'string' && s.length <= 50))
    .withMessage('Each requested skill must be text of at most 50 characters'),
  validate,
];

const mentorshipRespondRules = [
  mongoId('requestId'),
  body('status').isIn(['Accepted', 'Rejected']).withMessage('status must be Accepted or Rejected'),
  validate,
];

// ── Messages ─────────────────────────────────────────────────────────────────
const sendMessageRules = [
  mongoId('receiverId'),
  text('text', { min: 1, max: 2000 }),
  validate,
];

// ── Posts ────────────────────────────────────────────────────────────────────
const createPostRules = [
  text('content', { min: 1, max: 3000 }),
  body('type')
    .optional()
    .isIn(['General', 'Achievement', 'Question', 'Resource'])
    .withMessage('type must be General, Achievement, Question or Resource'),
  validate,
];

const reactRules = [
  mongoId('id', param),
  text('emoji', { min: 1, max: 16 }),
  validate,
];

const commentRules = [
  mongoId('id', param),
  text('text', { min: 1, max: 1000 }),
  validate,
];

// ── Sessions ─────────────────────────────────────────────────────────────────
const sessionRequestRules = [
  mongoId('hostId'),
  text('topic', { min: 1, max: 100 }),
  body('date')
    .isString().bail()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be in YYYY-MM-DD format')
    .bail()
    .isISO8601({ strict: true }).withMessage('date must be a real calendar date'),
  body('time')
    .isString().bail()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('time must be in HH:MM (24-hour) format'),
  text('note', { min: 0, max: 500, optional: true }),
  validate,
];

const sessionRespondRules = [
  mongoId('id', param),
  body('status').isIn(['Accepted', 'Cancelled']).withMessage('status must be Accepted or Cancelled'),
  validate,
];

module.exports = {
  validate,
  idParam,
  registerRules,
  loginRules,
  updateProfileRules,
  joinCommunityRules,
  createCommunityRules,
  endorseRules,
  feedbackRules,
  mentorshipRequestRules,
  mentorshipRespondRules,
  sendMessageRules,
  createPostRules,
  reactRules,
  commentRules,
  sessionRequestRules,
  sessionRespondRules,
};
