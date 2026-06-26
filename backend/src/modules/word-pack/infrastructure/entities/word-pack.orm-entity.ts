import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	OneToMany,
} from "typeorm";
import { WordOrmEntity } from "./word.orm-entity";

@Entity("word_packs")
export class WordPackOrmEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({ type: "text", nullable: true })
	description: string | null;

	@Column()
	language: string;

	@Column()
	type: string;

	@Column({ type: "int", default: 0 })
	wordCount: number;

	@Column({ type: "text", nullable: true })
	createdBy: string | null;

	@CreateDateColumn()
	createdAt: Date;

	@OneToMany(() => WordOrmEntity, (word) => word.pack, { cascade: true })
	words: WordOrmEntity[];
}
