import type {
	AudioProcessorOptions,
	Room,
	Track,
	TrackProcessor,
} from "livekit-client";
import type { KrispNoiseFilterProcessor } from "@livekit/krisp-noise-filter";

export class MicGainProcessor
	implements TrackProcessor<Track.Kind.Audio, AudioProcessorOptions>
{
	readonly name = "mic-gain-processor";
	processedTrack?: MediaStreamTrack;

	private audioContext?: AudioContext;
	private sourceNode?: MediaStreamAudioSourceNode;
	private gainNode?: GainNode;
	private destinationNode?: MediaStreamAudioDestinationNode;
	private gainValue: number;
	private upstream?: KrispNoiseFilterProcessor;

	constructor(initialGain = 1, upstream?: KrispNoiseFilterProcessor) {
		this.gainValue = initialGain;
		this.upstream = upstream;
	}

	async init(opts: AudioProcessorOptions): Promise<void> {
		let inputTrack = opts.track;
		if (this.upstream) {
			await this.upstream.init(opts);
			inputTrack = this.upstream.processedTrack ?? opts.track;
		}
		this.setupAudioGraph(opts.audioContext, inputTrack);
	}

	async restart(opts: AudioProcessorOptions): Promise<void> {
		let inputTrack = opts.track;
		if (this.upstream) {
			await this.upstream.restart(opts);
			inputTrack = this.upstream.processedTrack ?? opts.track;
		}
		this.disconnectGraph();
		this.setupAudioGraph(opts.audioContext, inputTrack);
	}

	async onPublish(room: Room): Promise<void> {
		if (this.upstream) {
			await this.upstream.onPublish(room);
		}
	}

	setGain(gain: number): void {
		this.gainValue = gain;
		if (this.gainNode && this.audioContext) {
			this.gainNode.gain.setTargetAtTime(
				gain,
				this.audioContext.currentTime,
				0.015,
			);
		}
	}

	async destroy(): Promise<void> {
		this.disconnectGraph();
		if (this.upstream) {
			await this.upstream.destroy();
			this.upstream = undefined;
		}
	}

	private setupAudioGraph(
		audioContext: AudioContext,
		inputTrack: MediaStreamTrack,
	): void {
		this.audioContext = audioContext;
		const stream = new MediaStream([inputTrack]);
		this.sourceNode = audioContext.createMediaStreamSource(stream);
		this.gainNode = audioContext.createGain();
		this.gainNode.gain.value = this.gainValue;
		this.destinationNode = audioContext.createMediaStreamDestination();

		this.sourceNode.connect(this.gainNode);
		this.gainNode.connect(this.destinationNode);
		this.processedTrack = this.destinationNode.stream.getAudioTracks()[0];
	}

	private disconnectGraph(): void {
		this.sourceNode?.disconnect();
		this.gainNode?.disconnect();
		this.destinationNode?.disconnect();
		this.sourceNode = undefined;
		this.gainNode = undefined;
		this.destinationNode = undefined;
		this.processedTrack = undefined;
	}
}
