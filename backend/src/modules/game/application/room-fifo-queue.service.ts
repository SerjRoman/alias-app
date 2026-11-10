import { Injectable } from "@nestjs/common";

/**
 * Per-room FIFO sequential queue service.
 * Guarantees strictly sequential execution of operations within a single room,
 * preventing race conditions and lost updates in Redis.
 * Operations across different rooms run concurrently without delay.
 */
@Injectable()
export class RoomFifoQueueService {
	private readonly queues = new Map<string, Promise<unknown>>();

	/**
	 * Enqueues a task for the specified room.
	 * If the room queue is idle, the task executes immediately.
	 * If another task is already executing for the room, the new task is queued
	 * and executes strictly after the previous task settles.
	 *
	 * @param roomId Room identifier
	 * @param task The task function (sync or async)
	 * @returns The result of the task execution
	 */
	async enqueue<T>(roomId: string, task: () => Promise<T> | T): Promise<T> {
		const current = this.queues.get(roomId) ?? Promise.resolve();

		// Promise chain:
		// .catch() ensures a rejection in a previous task does not stall the queue
		// .then(() => task()) triggers the task strictly after the current promise settles
		const next = current
			.catch(() => {
				// Suppress previous rejection in the chain to unblock subsequent tasks
			})
			.then(() => task());

		this.queues.set(roomId, next);

		try {
			return await next;
		} finally {
			// Clean up map entry when the settled task is the last one in the queue
			if (this.queues.get(roomId) === next) {
				this.queues.delete(roomId);
			}
		}
	}

	/**
	 * Convenience alias for enqueue.
	 */
	async run<T>(roomId: string, task: () => Promise<T> | T): Promise<T> {
		return this.enqueue(roomId, task);
	}

	/**
	 * Checks whether a task is currently executing or queued for the specified room.
	 */
	isProcessing(roomId: string): boolean {
		return this.queues.has(roomId);
	}
}
