import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientRepository } from './repositories/client.repository';
import { Client, ClientSchema } from './schemas/client.schema';
import {
  Requirement,
  RequirementSchema,
} from '../requirements/schemas/requirement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Requirement.name, schema: RequirementSchema },
    ]),
  ],
  controllers: [ClientsController],
  providers: [ClientsService, ClientRepository],
  exports: [ClientsService, ClientRepository],
})
export class ClientsModule {}
