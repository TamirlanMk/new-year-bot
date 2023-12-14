import path from "path";
import ExecPromise from "./ExecPromise.js";
import fs from "fs";

export default class AudioMerge {

    _outputFileName = 'full_audio.mp3'

    constructor(peoples, type, pathToAudio, pathToTemp, audioStore, namesStore) {
        this.peoples = peoples;
        this.type = type;
        this.pathToAudio = pathToAudio;
        this.pathToTemp = pathToTemp;
        this.audioStore = audioStore;
        this.namesStore = namesStore;
    }

    merge = async () => {
        try {
            let audioPath = '';
            let timestamps = '';
            const audio = this.audioStore[this.type];

            // Создаем массив с путями до файлов в папке temp-{userID}
            let paths = this.namesStore[this.type].map(filename => path.join(this.pathToTemp, filename))

            // Проверяем существуют ли файлы по данным путям,
            // если один из файлов недоступен, то выводится exception File not exist
            this._checkPathsExist(paths);

            audioPath = path.join(this.pathToAudio, `${this.type}/${this.peoples.length > 1 ? audio[this.peoples.length] : audio[this.peoples[0].gender]}`)
            timestamps = audio.timestamps[this.peoples.length];

            return await this._mergeFullAudio(audioPath, this.pathToAudio, paths, timestamps, this.pathToTemp);
        } catch (e) {
            console.error(e)
            throw e
        }
    }

    _mergeFullAudio = async (pathMainAudio, pathMainAudioDir, paths, timestamps, tempPath) => {
        this._checkPathsExist([pathMainAudioDir]);

        let filter = [];
        const execPromise = new ExecPromise();
        const inputs = `-i ${pathMainAudio} ${paths.map(path => `-i ${path}`).join(' ')}`

        paths.forEach((path, index) => {
            filter.push(`[${index + 1}:a]adelay=${timestamps[`${index + 1}`]}|${timestamps[`${index + 1}`]}[a${index + 1}];`)

        })

        const complexFilter = filter.join('') + `[0:a]${paths.map((path, index) => `[a${index + 1}]`).join('')}amix=inputs=${paths.length + 1}[aout]`

        return await execPromise.execShellCommand(`ffmpeg -y  ${inputs} -filter_complex "${complexFilter}" -map "[aout]" ${path.join(tempPath, this._outputFileName)}`);
    }

    _checkPathsExist = (paths) => {
        paths.map(path => {
            if (!fs.existsSync(path)) {
                throw `File is not exist: ${path}`;
            }
        })
    }
}
