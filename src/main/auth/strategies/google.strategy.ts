import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private config: ConfigService, private authService: AuthService) {
   super({
  clientID: config.get<string>('GOOGLE_CLIENT_ID')!,
  clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET')!,
  callbackURL: `${config.get<string>('FRONTEND_URL')}/auth/google/callback`,
  scope: ['email', 'profile'],
  passReqToCallback: true, // now TypeScript is happy
});
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const email = profile.emails?.[0]?.value;
    const id = profile.id;
    const name = profile.displayName;
    const picture = profile.photos?.[0]?.value;
    const tokens = await this.authService.oauthLogin({ email, id, name, picture, provider: 'google' });
    done(null, tokens);
  }
}
