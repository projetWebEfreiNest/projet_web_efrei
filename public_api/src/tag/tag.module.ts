import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagResolver } from './tag.resolver';
import { TagController } from './tag.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TagController],
  providers: [TagResolver, TagService],
  exports: [TagService],
})
export class TagModule {}
