import { UserEntity } from "../../domain/entities/user";
import { UserOrmEntity } from "../entities/user";

export class UserMapper {
	static toDomain(ormEntity: UserOrmEntity): UserEntity {
		return UserEntity.fromPrimitives({
			id: ormEntity.id,
			email: ormEntity.email,
			name: ormEntity.name,
			password: ormEntity.password,
			username: ormEntity.username,
			avatarUrl: ormEntity.avatarUrl,
			totalGamesPlayed: ormEntity.totalGamesPlayed,
			totalWins: ormEntity.totalWins,
			totalScore: ormEntity.totalScore,
			createdAt: ormEntity.createdAt.getTime(),
		});
	}

	static toOrm(entity: UserEntity): UserOrmEntity {
		const state = entity.toPrimitives();
		const ormEntity = new UserOrmEntity();
		ormEntity.id = state.id;
		ormEntity.name = state.name;
		ormEntity.email = state.email;
		ormEntity.password = state.password;
		ormEntity.username = state.username;
		ormEntity.avatarUrl = state.avatarUrl;
		ormEntity.totalGamesPlayed = state.totalGamesPlayed;
		ormEntity.totalWins = state.totalWins;
		ormEntity.totalScore = state.totalScore;
		ormEntity.createdAt = new Date(state.createdAt);
		return ormEntity;
	}
}
