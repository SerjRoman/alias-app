import { Injectable, Inject } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { plainToInstance } from "class-transformer";
import type { UserDto } from "@common/dto/user.dto";
import type { GameEngine } from "../../../domain/engine/game-engine";
import { RoomUseCase, type RoomNotification } from "../room.use-case";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import type { GetShopCatalogDto } from "../../dto/body/get-shop-catalog.dto";
import {
	ShopCatalogResponseDto,
	type ShopCatalogItemDto,
} from "../../dto/response/shop-catalog-response.dto";
import {
	SHOP_CATALOG,
	MAX_INVENTORY_SIZE,
} from "../../../domain/shop/shop.types";

@Injectable()
export class GetShopCatalogUseCase extends RoomUseCase<
	GetShopCatalogDto,
	ShopCatalogResponseDto
> {
	protected override readonly notify: readonly RoomNotification[] = [];
	protected override readonly skipSave = true;

	constructor(
		fifoQueue: RoomFifoQueueService,
		gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		gameRepository: IGameRepository,
		eventEmitter: EventEmitter2,
	) {
		super(fifoQueue, gameSharedService, gameRepository, eventEmitter);
	}

	protected override handle(
		engine: GameEngine,
		_dto: GetShopCatalogDto,
		_actor: UserDto,
	): ShopCatalogResponseDto {
		const state = engine.getState();
		const settings = state.settings;
		const isShopEnabled = settings?.isShopEnabled ?? true;

		const items: ShopCatalogItemDto[] = SHOP_CATALOG.map((item) => {
			const settingOk = item.requiresSetting
				? settings?.[item.requiresSetting] !== false
				: true;
			const isAvailable = isShopEnabled && settingOk;

			return {
				id: item.id,
				name: item.name,
				description: item.description,
				price: item.price,
				target: item.target,
				durationType: item.durationType,
				charges: item.charges,
				durationSeconds: item.durationSeconds,
				requiresSetting: item.requiresSetting,
				isAvailable,
			};
		});

		return plainToInstance(
			ShopCatalogResponseDto,
			{
				items,
				maxInventorySize: MAX_INVENTORY_SIZE,
				isShopEnabled,
			},
			{ excludeExtraneousValues: true },
		);
	}
}
