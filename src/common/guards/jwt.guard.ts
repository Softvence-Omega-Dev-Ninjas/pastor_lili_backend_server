import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  UseGuards,
  applyDecorators,
  CanActivate,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Roles } from '../decorators/roles.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    console.log('jwt auth guard', err, user, info);
    if (err || !user) throw err || new UnauthorizedException();
    return user;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.get<string[]>('roles', context.getHandler()) || [];
    if (!required.length) return true;
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    return user && required.includes(user.role);
  }
}

export function ValidateAuth(...roles: Role[]) {
  const decorators = [UseGuards(JwtAuthGuard, RolesGuard)];
  if (roles.length > 0) {
    decorators.push(Roles(...roles));
  }
  return applyDecorators(...decorators);
}

export function ValidateAdmin() {
  return ValidateAuth(Role.ADMIN, Role.SUPERADMIN);
}
