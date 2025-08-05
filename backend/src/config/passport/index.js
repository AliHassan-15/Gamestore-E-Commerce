const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../../models');
const { logger } = require('../../utils/logger');

// Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findByEmail(email);
    
    if (!user) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return done(null, false, { message: 'Account is deactivated' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    return done(null, user);
  } catch (error) {
    logger.error('Local strategy error:', error);
    return done(error);
  }
}));

// Google OAuth Strategy (only initialize if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({
        where: { google_id: profile.id }
      });

      if (!user) {
        // Check if user exists with same email
        user = await User.findOne({
          where: { email: profile.emails[0].value }
        });

        if (user) {
          // Link Google account to existing user
          await user.update({ google_id: profile.id });
        } else {
          // Create new user
          user = await User.create({
            email: profile.emails[0].value,
            first_name: profile.name.givenName,
            last_name: profile.name.familyName,
            google_id: profile.id,
            email_verified: true, // Google emails are verified
            password: Math.random().toString(36).slice(-8) // Generate random password
          });
        }
      }

      return done(null, user);
    } catch (error) {
      logger.error('Google strategy error:', error);
      return done(error);
    }
  }));
  
  logger.info('Google OAuth strategy initialized');
} else {
  logger.warn('Google OAuth credentials not provided - Google OAuth disabled');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    done(null, user);
  } catch (error) {
    logger.error('Deserialize user error:', error);
    done(error);
  }
});

// Initialize passport
const initializePassport = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());
};

module.exports = {
  passport,
  initializePassport
}; 