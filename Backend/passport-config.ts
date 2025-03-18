import passport from 'passport';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import userModel, { IUser } from './src/models/user_model'; // Adjust the path to your user model

// passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
//   try {
//     const user = await userModel.findById(id);
//     done(null, user);
//   } catch (err) {
//     done(err, null);
//   }
// });

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_CALLBACK_URL!,
    },
    async (accessToken: string, refreshToken: string, profile: GitHubProfile, done: (err: any, user?: any) => void) => {
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
    }
  )
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: (err: any, user?: any) => void) => {
      try {
        const existingUser = await userModel.findOne({ 
          email: profile.emails?.[0].value
        });
  
        if (existingUser) {
          // Check if user exists but doesn't have a googleId (registered with password or other method)
          if (!existingUser.googleId) {
            // User exists with email but hasn't used Google login before
            return done({ message: 'email_exists' }, false);
          }
          
          // User exists and has used Google login before - continue with login
          existingUser.googleId = profile.id;
          await existingUser.save();
          done(null, existingUser);
        }
        else
        {
          let user = await userModel.findOne({ googleId: profile.id });
          if (!user) {
            user = await userModel.create({ googleId: profile.id, username: profile.name?.givenName, email: profile.emails?.[0].value });
          }
          done(null, user);
        }
      } catch (err) {
        done(err, null);
      }
    }
  )
);

export default passport;