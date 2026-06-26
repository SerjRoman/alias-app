import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	Unique,
} from "typeorm";
import { WordPackOrmEntity } from "./word-pack.orm-entity";

@Entity("words")
@Unique(["packId", "text"])
export class WordOrmEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	packId: string;

	@Column()
	text: string;

	@ManyToOne(() => WordPackOrmEntity, (pack) => pack.words, {
		onDelete: "CASCADE",
	})
	pack: WordPackOrmEntity;
}
