import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class VerifiedGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (user?.role === 'oficina' && !user.verified) {
            throw new ForbiddenException(
                'A sua oficina ainda não foi verificada. Contacte o administrador para activar a sua conta.'
            );
        }

        return true;
    }
}
