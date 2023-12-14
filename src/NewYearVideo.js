import fs from "fs";
import path from "path";
import appRoot from "app-root-path";

import VideoMerge from "./VideoMerge.js";
import AudioMerge from "./AudioMerge.js";
import NamesMerge from "./NamesMerge.js";
import AppRoot from "app-root-path";

export default class NewYearVideo {

    _appDirPath = appRoot.path;

    _videoDirPath = path.join(this._appDirPath, 'assets/video');
    _audioDirPath = path.join(this._appDirPath, 'assets/audio');
    _namesDirPath = path.join(this._appDirPath, 'assets/names/congratulation'); // todo: Rename folder to greetings

    _tempDirPath = path.join(this._appDirPath, `temp`);
    _userTempDirPath = '';

    constructor(userID, type, peoples, filesStore, additionalFrame = null) {
        this.userID = userID;
        this.peoples = peoples;
        this.type = type;
        this.filesStore = filesStore;
        this.additionalFrame = additionalFrame;
        this._userTempDirPath = path.join(this._tempDirPath, `temp-${this.userID}`);

        //При вызове MainAudioMerge передать туда FilesStore.audio, аналогично для video
        try {

            this._checkPathsExist([
                this._videoDirPath,
                this._audioDirPath,
                this._namesDirPath,
                this._tempDirPath
            ]);

            if (!fs.existsSync(this._userTempDirPath)) {
                fs.promises.mkdir(path.join(appRoot.path, `temp/temp-${this.userID}`)).then(() => {
                    console.log(this._userTempDirPath)
                });
            }

        } catch (e) {
            console.error(e);
        }
    }

    make = async () => {
        let namesMerge = new NamesMerge(
            this.peoples,
            this.type,
            this._namesDirPath,
            this._userTempDirPath,
            this.filesStore.names
        )

        let audioMerge = new AudioMerge(
            this.peoples,
            this.type,
            this._audioDirPath,
            this._userTempDirPath,
            this.filesStore.audio,
            this.filesStore.names
        )

        let videoMerge = new VideoMerge(
            this.peoples,
            this.type,
            this._videoDirPath,
            this._userTempDirPath,
            this.filesStore.video
        )

        let prom = await namesMerge.merge().then(async (namesRes) => {
            console.log('Names merged successfully')
            await audioMerge.merge()
                .then(async (audioRes) => {
                    console.log('Audio merged')
                    await videoMerge.merge().then(async (videoRes) => {
                        console.log('Video merged')
                        if (this.additionalFrame !== null) {
                            console.log('Frame Merging...')
                            await videoMerge.addFrame(this.additionalFrame).then(res => {
                                console.log('Frame Added')
                            });
                        }
                    })
                })
        })
    }

    _checkPathsExist = (paths) => {
        paths.map(path => {
            if (!fs.existsSync(path)) {
                throw `File is not exist: ${path}`;
            }
        })
    }
}