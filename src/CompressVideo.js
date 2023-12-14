import ExecPromise from "./ExecPromise.js";
import path from "path";

const compressVideo = (pathFile, pathDir, filenameSmall = 'small') => {
    const execPromise = new ExecPromise()

    return execPromise
        .execShellCommand(`ffmpeg -i ${pathFile} -c:v libx264 -crf 23 -c:a aac -strict experimental -b:a 192k -movflags faststart ${path.join(pathDir, `${filenameSmall}.mp4`)}`)
}
export default compressVideo