import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WordPackOrmEntity, WordOrmEntity } from "./infrastructure/entities";
import { WORD_PACK_REPOSITORY } from "./application/word-pack.repository.interface";
import { PgWordPackRepository } from "./infrastructure/pg-word-pack.repository";
import { WordPackService } from "./application/word-pack.service";
import { WordPackController } from "./presentation/word-pack.controller";

@Module({
	imports: [TypeOrmModule.forFeature([WordPackOrmEntity, WordOrmEntity])],
	providers: [
		{
			provide: WORD_PACK_REPOSITORY,
			useClass: PgWordPackRepository,
		},
		WordPackService,
	],
	controllers: [WordPackController],
	exports: [WordPackService],
})
export class WordPackModule {}
