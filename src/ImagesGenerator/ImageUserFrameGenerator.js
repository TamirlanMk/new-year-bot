import ImageGenerator from "./ImageGenerator.js";

import AppRoot from 'app-root-path'
import appRoot from 'app-root-path'
import path from "path";
import fs from "fs";
import sharp from "sharp";

export default class ImageUserFrameGenerator extends ImageGenerator {
    _fontFamilyPath = path.join(`${AppRoot.path}`, `/assets/fonts/NexaScriptLight.ttf`)
    _imageBackVerticalPath = path.join(`${AppRoot.path}`, `/assets/images/back-v.png`)
    _imageBackHorizontalPath = path.join(`${AppRoot.path}`, `/assets/images/back-h.png`)
    make = async (userImagePath, outputPath, orientation, fileName = 'frame') => {
        if (!fs.existsSync(userImagePath)) {
            throw `File not exist: ${userImagePath}`
        }
        let svg = null;
        let userImage = fs.readFileSync(userImagePath).toString('base64');

        if (orientation === 'h') {
            let back = fs.readFileSync(this._imageBackHorizontalPath).toString('base64')

            svg = `<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
                    <image style="transform: rotate(5deg);transform-origin: center;" x="538" y="340" width="342" height="228" href="data:image/jpeg;base64,${userImage}"/>
                    <image href="data:image/png;base64,${back}" x="0" y="0" width="1280" height="720"/>
            </svg>`

        } else if (orientation === 'v') {
            let back = fs.readFileSync(this._imageBackVerticalPath).toString('base64')

            svg = `
            <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
                <image style="transform: rotate(5deg);transform-origin: center;" x="596" y="220" width="271" height="341" href="data:image/jpeg;base64,${userImage}"/>
                <image href="data:image/png;base64,${back}" x="0" y="0" width="1280" height="720"/>
            </svg>`

        } else {
            throw 'Orientation should be "v" or "h"'
        }

        try {
            await sharp(Buffer.from(svg)).png().toFile(path.join(`${outputPath}`, `/${fileName}.jpg`)).then(r => console.log(`ImageUserFrameGenerator: ${r}`))

            return path.join(`${outputPath}`, `/${fileName}.jpg`)
        } catch (e) {
            console.log(e)
        }
    }
}