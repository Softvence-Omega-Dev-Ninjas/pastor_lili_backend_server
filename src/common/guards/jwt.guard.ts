import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    console.log("jwt auth guard", err);
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
