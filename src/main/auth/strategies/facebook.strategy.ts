// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy, Profile, VerifyFunction } from 'passport-facebook';
// import { Injectable } from '@nestjs/common';
// import { AuthService } from '../auth.service';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
//   constructor(
//     private config: ConfigService,
//     private authService: AuthService,
//   ) {
//     super({
//       clientID: config.get<string>('FACEBOOK_CLIENT_ID')!,
//       clientSecret: config.get<string>('FACEBOOK_CLIENT_SECRET')!,
//       callbackURL: `${config.get<string>('FRONTEND_URL')}/auth/facebook/callback`,
//       profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
//       passReqToCallback: false, // ✅ must be false if you don't need req
//     });
//   }

//  async validate(
//   accessToken: string,
//   refreshToken: string,
//   profile: Profile,    // ✅ must be here
//   done: VerifyFunction
// ) {
//   const email = profile.emails?.[0]?.value;
//   if (!email) throw new Error('No email found in Facebook profile');

//   const id = profile.id;
//   const name = profile.displayName;
//   const picture = profile.photos?.[0]?.value;

//   const tokens = await this.authService.oauthLogin({
//     email,
//     id,
//     name,
//     picture,
//     provider: 'facebook',
//   });

//   done(null, tokens);
// }

// }

