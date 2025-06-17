import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { PrismaService } from '../prisma.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthResolver, AuthService, PrismaService],
})
export class AuthModule {}
