import { StorageOption, TargetType, File } from "./index";
import { Readable } from "stream";
import { FileInfo } from "busboy";

export declare class DiscStorage implements StorageOption {
	private target: TargetType;
	public isPersist: boolean;
	constructor(target: TargetType, isPersist?: boolean);
	process(name: string, stream: Readable, info: FileInfo): Promise<File>;
}