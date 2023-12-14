import AudioMerge from "./src/AudioMerge.js";
import path from "path";
import AppRoot from "app-root-path";
import filesStore from "./src/FilesStore.js";
import VideoMerge from "./src/VideoMerge.js";
import NamesMerge from "./src/NamesMerge.js";


let audioMerge = new AudioMerge(
    [
        {
            name: 'Тамерлан',
            gender: 'male'
        }
    ],
    'story-kolobok',
    path.join(AppRoot.path, 'assets/audio'),
    path.join(AppRoot.path, `temp/temp-12412421421421`),
    filesStore.audio,
    filesStore.names
)


let videoMerge = new VideoMerge(
    [
        {
            name: 'Тамерлан',
            gender: 'male'
        }
    ],
    'story-kolobok',
    path.join(AppRoot.path, 'assets/video'),
    path.join(AppRoot.path, `temp/temp-12412421421421`),
    filesStore.video,
)

let namesMerge = new NamesMerge(
    [
        {
            name: 'Тамерлан',
            gender: 'male'
        }
    ],
    'story-kolobok',
    path.join(AppRoot.path, 'assets/names/congratulation'),
    path.join(AppRoot.path, `temp/temp-12412421421421`),
    filesStore.names
).merge().then(async (namesRes) => {
    console.log('Names merged successfully')
    await audioMerge.merge()
        .then(async (audioRes) => {
            console.log('Audio merged')
            await videoMerge.merge()
        })
})
