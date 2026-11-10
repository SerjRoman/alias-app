import { RoomFifoQueueService } from "./room-fifo-queue.service";

describe("RoomFifoQueueService (TDD)", () => {
	let queue: RoomFifoQueueService;

	beforeEach(() => {
		queue = new RoomFifoQueueService();
	});

	describe("1. Strict FIFO execution order within the same room", () => {
		it("executes tasks sequentially in arrival order", async () => {
			const executionOrder: number[] = [];

			const task1 = () =>
				new Promise<void>((resolve) => {
					setTimeout(() => {
						executionOrder.push(1);
						resolve();
					}, 30);
				});

			const task2 = () =>
				new Promise<void>((resolve) => {
					setTimeout(() => {
						executionOrder.push(2);
						resolve();
					}, 10);
				});

			const task3 = () => {
				executionOrder.push(3);
				return "done";
			};

			// Enqueue all 3 tasks concurrently
			const p1 = queue.enqueue("room-1", task1);
			const p2 = queue.enqueue("room-1", task2);
			const p3 = queue.enqueue("room-1", task3);

			await Promise.all([p1, p2, p3]);

			// Task 2 had a shorter timeout (10ms vs 30ms),
			// but must wait for task 1 to finish first!
			expect(executionOrder).toEqual([1, 2, 3]);
		});
	});

	describe("2. Concurrency and isolation across different rooms", () => {
		it("executes tasks for different rooms in parallel without blocking", async () => {
			const executionOrder: string[] = [];

			// Slow task for room-A (40ms)
			const slowTaskA = () =>
				new Promise<void>((resolve) => {
					setTimeout(() => {
						executionOrder.push("room-A-slow");
						resolve();
					}, 40);
				});

			// Fast task for room-B (10ms)
			const fastTaskB = () =>
				new Promise<void>((resolve) => {
					setTimeout(() => {
						executionOrder.push("room-B-fast");
						resolve();
					}, 10);
				});

			const pA = queue.enqueue("room-A", slowTaskA);
			const pB = queue.enqueue("room-B", fastTaskB);

			await Promise.all([pA, pB]);

			// room-B must not wait for room-A
			expect(executionOrder[0]).toBe("room-B-fast");
			expect(executionOrder[1]).toBe("room-A-slow");
		});
	});

	describe("3. Error resilience and unblocking", () => {
		it("does not block the queue when a prior task rejects", async () => {
			const results: string[] = [];

			const failingTask = () =>
				new Promise((_, reject) => {
					setTimeout(
						() => reject(new Error("Database connection lost")),
						10,
					);
				});

			const succeedingTask = () => {
				results.push("task-2-success");
				return "ok";
			};

			const p1 = queue.enqueue("room-1", failingTask);
			const p2 = queue.enqueue("room-1", succeedingTask);

			// The failing task should reject with its original error
			await expect(p1).rejects.toThrow("Database connection lost");

			// The succeeding task must still execute and settle successfully
			const res2 = await p2;
			expect(res2).toBe("ok");
			expect(results).toEqual(["task-2-success"]);
		});

		it("properly propagates synchronous errors to the caller", async () => {
			const syncThrowTask = () => {
				throw new Error("Immediate sync validation failure");
			};

			await expect(
				queue.enqueue("room-1", syncThrowTask),
			).rejects.toThrow("Immediate sync validation failure");
		});
	});

	describe("4. Return value passing to caller", () => {
		it("returns the result of an asynchronous task", async () => {
			const result = await queue.enqueue("room-1", () => {
				return Promise.resolve({ score: 42, name: "Red Team" });
			});

			expect(result).toEqual({ score: 42, name: "Red Team" });
		});

		it("returns the result of a synchronous task", async () => {
			const result = await queue.enqueue(
				"room-1",
				() => "immediate-value",
			);

			expect(result).toBe("immediate-value");
		});
	});

	describe("5. Memory cleanup", () => {
		it("removes the room key from memory after all tasks finish", async () => {
			expect(queue.isProcessing("room-1")).toBe(false);

			const taskPromise = queue.enqueue("room-1", () => {
				return new Promise((resolve) => setTimeout(resolve, 20));
			});

			expect(queue.isProcessing("room-1")).toBe(true);

			await taskPromise;

			// Memory cleaned up after queue empties
			expect(queue.isProcessing("room-1")).toBe(false);
		});
	});

	describe("6. Concurrency stress test (Zero race conditions)", () => {
		it("reliably prevents race conditions across 50 concurrent operations", async () => {
			let sharedCounter = 0;

			// Create 50 tasks, each simulating read -> micro-delay -> write
			const tasks = Array.from({ length: 50 }, () => () => {
				return new Promise<number>((resolve) => {
					const current = sharedCounter;
					setTimeout(() => {
						sharedCounter = current + 1;
						resolve(sharedCounter);
					}, 1);
				});
			});

			// Dispatch all 50 tasks concurrently via Promise.all
			await Promise.all(
				tasks.map((task) => queue.enqueue("room-stress", task)),
			);

			// Without FIFO queuing, sharedCounter would be around 1-5 due to overwrites.
			// With the queue, it must strictly equal 50.
			expect(sharedCounter).toBe(50);
		});
	});
});
