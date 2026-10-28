import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SavedSearchesController } from './saved-searches.controller';
import { SavedSearchesService } from './saved-searches.service';
import { SavedSearchesRepository } from './repositories/saved-searches.repository';
import { SavedSearch, SavedSearchSchema } from './schemas/saved-search.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SavedSearch.name, schema: SavedSearchSchema },
    ]),
  ],
  controllers: [SavedSearchesController],
  providers: [SavedSearchesService, SavedSearchesRepository],
  exports: [SavedSearchesService, SavedSearchesRepository],
})
export class SavedSearchesModule {}
