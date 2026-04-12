import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type, Exclude } from "class-transformer";
import { WordResponseDto } from "./word-response.dto";
import { RoundStatus } from "../../domain/entities/round.entity";

export class RoundResponseDto {
	@ApiProperty({ example: "uuid-round-1" })
	@Expose()
	id: string;

	@ApiProperty({
		example: "uuid-player-1",
		description: "ID of the player explaining words",
	})
	@Expose()
	guesserId: string;

	@ApiProperty({ example: "uuid-team-1" })
	@Expose()
	teamId: string;

	@ApiProperty({
		example: "number",
		description: "Unix time left in seconds",
	})
	@Expose()
	endTime: number;

	@ApiProperty({ enum: RoundStatus })
	@Expose()
	status: RoundStatus;

	@ApiPropertyOptional({ type: WordResponseDto, nullable: true })
	@Exclude()
	@Type(() => WordResponseDto)
	currentWord: WordResponseDto | null;

	@ApiProperty({ type: [WordResponseDto] })
	@Type(() => WordResponseDto)
	@Expose()
	words: WordResponseDto[];
}



Да, внедрить CQRS здесь **определенно стоит**. 

Сейчас твой `GameService` — это классический "God Object" (Божественный объект). Он знает всё: как создавать игру, как двигать игроков по командам, как работает таймер и как читать стейт. По мере роста проекта поддерживать и тестировать такой класс станет очень сложно.

CQRS (в NestJS обычно реализуется через пакет `@nestjs/cqrs`) позволит разбить этот огромный сервис на маленькие, независимые и легко тестируемые классы (Use Cases).

### Как это будет выглядеть:

**1. Установка пакета**
```bash
npm install @nestjs/cqrs
```

**2. Создание Command (Изменение состояния)**
Вместо метода `joinGame` в сервисе, создается два файла: сама команда и ее обработчик.

```typescript
// join-game.command.ts
export class JoinGameCommand {
  constructor(
    public readonly roomId: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly code?: string,
  ) {}
}
```

```typescript
// join-game.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(JoinGameCommand)
export class JoinGameHandler implements ICommandHandler<JoinGameCommand> {
  constructor(
    @Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: JoinGameCommand) {
    // Вся логика из твоего текущего метода joinGame
    const room = await this.repository.findGameById(command.roomId);
    if (!room) throw new RoomNotFoundError(command.roomId);
    
    // ... логика проверок и добавления игрока ...

    await this.repository.saveGame(room);
    this.eventEmitter.emit(GAME_UPDATED, { room: room.toPrimitives() });
    
    return room.toPrimitives();
  }
}
```

**3. Создание Query (Чтение состояния)**
Для методов вроде `findOne` или `findAll` создаются Query.

```typescript
// get-game.query.ts
export class GetGameQuery {
  constructor(public readonly gameId: string) {}
}

// get-game.handler.ts
@QueryHandler(GetGameQuery)
export class GetGameHandler implements IQueryHandler<GetGameQuery> {
  constructor(@Inject(GAME_REPOSITORY) private readonly repo: IGameRepository) {}

  async execute(query: GetGameQuery) {
    const game = await this.repo.findGameById(query.gameId);
    return game?.toPrimitives();
  }
}
```

**4. Использование в Контроллере/Gateway**
Твой контроллер больше не зависит от огромного `GameService`, он использует только `CommandBus` и `QueryBus`.

```typescript
@Controller('games')
export class GameController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post(':id/join')
  async joinGame(@Param('id') id: string, @Body() dto: JoinGameDto, @GetUser() user: UserDto) {
    return this.commandBus.execute(
      new JoinGameCommand(id, user.id, user.name, dto.code)
    );
  }

  @Get(':id')
  async getGame(@Param('id') id: string) {
    return this.queryBus.execute(new GetGameQuery(id));
  }
}
```

### Преимущества такого подхода для твоего кода:
1. **Тотальный SRP:** Логика таймеров переедет в `StartRoundHandler` и `FinishRoundHandler`, а логика перемещения в команды — в `MoveToTeamHandler`. Зависимости (например `SchedulerRegistry`) будут инжектиться только там, где они реально нужны, а не "висеть" в конструкторе огромного сервиса.
2. **Простое тестирование:** Тебе придется мокать только те зависимости, которые нужны конкретному хендлеру.
3. **Отвязка от DTO:** Команды становятся чистым контрактом Application слоя, избавляя бизнес-логику от Express/Socket.io DTO.