import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryColumn,
	PrimaryGeneratedColumn,
} from "typeorm";

@Entity("users")
export class UserOrmEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({ unique: true })
	email: string;

	@Column()
	password: string;

	@Column()
	username: string;

	@Column({ default: "default-avatar.png" })
	avatarUrl: string;

	@Column({ default: 0 }) totalGamesPlayed: number;
	@Column({ default: 0 }) totalWins: number;
	@Column({ default: 0 }) totalScore: number;

	@CreateDateColumn() createdAt: Date;
}

@Entity("friendships")
export class FriendshipOrmEntity {
	@PrimaryGeneratedColumn("uuid") id: string;

	@Column() requesterId: string;
	@Column() addresseeId: string;

	@Column() status: "PENDING" | "ACCEPTED" | "DECLINED";

	@CreateDateColumn() createdAt: Date;
}

@Entity("achievements_dictionary")
export class AchievementOrmEntity {
	@PrimaryColumn() code: string;
	@Column() title: string;
	@Column() description: string;
	@Column() iconUrl: string;
}

@Entity("user_achievements")
export class UserAchievementOrmEntity {
	@PrimaryGeneratedColumn("uuid") id: string;
	@Column() userId: string;
	@Column() achievementCode: string;
	@CreateDateColumn() unlockedAt: Date;
}
