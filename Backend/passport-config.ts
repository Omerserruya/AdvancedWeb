import passport from 'passport';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import userModel, { IUser } from './src/models/user_model'; // Adjust the path to your user model

passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
  try {
    const user = await userModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID as string,
  clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
  callbackURL: "/auth/github/callback",
  scope: ['user:email'] // Request the user:email scope
}, async (accessToken: string, refreshToken: string, profile: GitHubProfile, done: (err: any, user?: any) => void) => {
  try {
    let user = await userModel.findOne({ githubId: profile.id });
    if (!user) {
      // Fetch the user's email addresses
      const emails = profile.emails || [];
      const primaryEmail = emails[0]?.value;

      user = await userModel.create({
        githubId: profile.id,
        username: profile.username,
        email: primaryEmail // Ensure email is set if available
      });
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));


// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  callbackURL: "/auth/google/callback"
}, async (token: string, tokenSecret: string, profile: GoogleProfile, done: (err: any, user?: any) => void) => {
  try {
    let user = await userModel.findOne({ googleId: profile.id });
    if (!user) {
      user = await userModel.create({ googleId: profile.id, username: profile.name?.givenName, email: profile.emails?.[0].value });
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

export default passport;