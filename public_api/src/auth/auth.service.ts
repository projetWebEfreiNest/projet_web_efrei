import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAuthInput } from './dto/create-auth.input';
import { UpdateAuthInput } from './dto/update-auth.input';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async create(createAuthInput: CreateAuthInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createAuthInput.email },
    });
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(createAuthInput.password, 10);
    const createdUser = await this.prisma.user.create({
      data: {
        ...createAuthInput,
        password: hashedPassword,
      },
    });

    const payload = { sub: createdUser.id, email: createdUser.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);
    return user;
  }

  async update(id: number, updateAuthInput: UpdateAuthInput) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: updateAuthInput,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) return null;
    const { password: _, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async deleteUser(id: number) {
    return this.remove(id);
  }
}
