import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAuthInput } from './dto/create-auth.input';
import { UpdateAuthInput } from './dto/update-auth.input';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
      private readonly prisma: PrismaService,
      private jwtService: JwtService
) {}

  async create(createAuthInput: CreateAuthInput) {
    const hashedPassword = await bcrypt.hash(createAuthInput.password, 10);
    return this.prisma.user.create({
      data: {
        ...createAuthInput,
        password: hashedPassword,
      },
    });
  }

  findAll() {
    console.log('Fetching all users');
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  update(id: number, updateAuthInput: UpdateAuthInput) {
    return this.prisma.user.update({
      where: { id },
      data: updateAuthInput,
    });
  }

  remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) return null;

    const { password: _, ...result } = user;
    console.log('User validated:', result);
    return result;
  }

  async login(email: string, password: string) {
    console.log('Attempting to log in user:', email);
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Email ou mot de passe invalide');
    const payload = { sub: user.id, email: user.email };
    console.log('User logged in:', user);
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async deleteUser(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

}
