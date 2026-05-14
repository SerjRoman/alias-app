import { type UserEntity } from "../domain/entities/user";

export interface IUserRepository {
	findById(id: string): Promise<UserEntity | null>;
	findByEmail(email: string): Promise<UserEntity | null>;
	findManyByIds(ids: string[]): Promise<UserEntity[]>;

	save(user: UserEntity): Promise<void>;
	saveMany(users: UserEntity[]): Promise<void>;
}

export const USER_REPOSITORY = "UserRepository";
