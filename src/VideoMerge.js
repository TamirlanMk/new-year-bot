import ExecPromise from "./ExecPromise.js";
import path from "path";

export default class VideoMerge {
    constructor(peoples, type, pathToVideo, pathToTemp, videoStore) {
        this.peoples = peoples;
        this.type = type;
        this.pathToVideo = pathToVideo;
        this.pathToTemp = pathToTemp;
        this.videoStore = videoStore;
    }

    merge = async () => {
        let execPromise = new ExecPromise();
        let videoPath = path.join(this.pathToVideo, `${this.type}/${this.videoStore[this.type][this.peoples.length]}`)

        return await execPromise.execShellCommand(`ffmpeg -y -i ${path.join(this.pathToTemp, `full_audio.mp3`)}  -i "${videoPath}" -acodec copy -vcodec copy "${path.join(this.pathToTemp, `ready.mp4`)}"`);
    }

    addFrame = async (framePath) => {
        let execPromise = new ExecPromise();
        let videoPath = path.join(this.pathToTemp, `ready.mp4`)

        return await execPromise.execShellCommand(`ffmpeg -i ${path.join(this.pathToTemp, `ready.mp4`)} -i ${path.join(framePath)}  -filter_complex "[0:v][1:v] overlay=1:1:enable='between(t,63,68)'" -b:v 2500k -pix_fmt yuv420p -y "${path.join(this.pathToTemp, `ready_story.mp4`)}"`);
    }
}
