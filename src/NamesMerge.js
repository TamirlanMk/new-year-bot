import ExecPromise from "./ExecPromise.js";
import path from "path";
import fs from "fs";
import AppRoot from "app-root-path";
import filesStore from "./FilesStore.js";
import AudioMerge from "./AudioMerge.js";
import VideoMerge from "./VideoMerge.js";

export default class NamesMerge {
    constructor(peoples, type, pathToNames, pathToTemp, namesStore) {
        this.peoples = peoples;
        this.type = type;
        this.pathToNames = pathToNames;
        this.pathToTemp = pathToTemp;
        this.namesStore = namesStore;
    }

    merge = async () => {
        try {
            let paths = [];

            this.peoples.forEach((person) => {
                paths.push(this._getAudioByNames(person.gender, person.name));
            })

            const execPromise = new ExecPromise();
            const transposedPaths = this._transposePaths(paths);

            for (let index = 0; index < transposedPaths.length; index++) {
                const filename = path.basename(transposedPaths[index][0])
                await execPromise.execShellCommand(`ffmpeg -y -i "concat:${transposedPaths[index].join('|')}" -c copy ${path.join(this.pathToTemp, `${filename}`)}`).then((res, err) => {
                   if (err) {
                       console.log(err)
                   }
                })
            }
        } catch (e) {
            console.error(e)
        }
    }

    _transposePaths = (paths) => {
        const transposedPaths = [];

        for (let colIndex = 0; colIndex < paths[0].length; colIndex++) {
            const newRow = [];
            for (let rowIndex = 0; rowIndex < paths.length; rowIndex++) {
                newRow.push(paths[rowIndex][colIndex]);
            }
            transposedPaths.push(newRow);
        }
        return transposedPaths;
    }

    _getAudioByNames = (gender, name) => {
        if (!fs.existsSync(path.join(this.pathToNames, `/${gender}/${name}`))) {
            throw `File is not available: ${path}`
        }
        return this.namesStore[this.type].map(filename => path.join(this.pathToNames, `/${gender}/${name}/${filename}`))
    }
}