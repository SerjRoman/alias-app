import { Repository } from "typeorm";
import { IUserRepository } from "../application/user.repository.interface";
import { UserEntity } from "../domain/entities/user";
import { UserOrmEntity } from "./entities/user";
import { UserMapper } from "./mappers/user.mapper";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class UserRepository implements IUserRepository {
	constructor(
		@InjectRepository(UserOrmEntity)
		private readonly repository: Repository<UserOrmEntity>,
	) {}

	async findById(id: string): Promise<UserEntity | null> {
		const ormUser = await this.repository.findOne({ where: { id } });
		if (!ormUser) return null;
		return UserMapper.toDomain(ormUser);
	}

	async findByEmail(email: string): Promise<UserEntity | null> {
		const ormUser = await this.repository.findOne({ where: { email } });
		if (!ormUser) return null;
		return UserMapper.toDomain(ormUser);
	}

	async save(user: UserEntity): Promise<void> {
		const ormUser = UserMapper.toOrm(user);
		await this.repository.save(ormUser);
	}
}
