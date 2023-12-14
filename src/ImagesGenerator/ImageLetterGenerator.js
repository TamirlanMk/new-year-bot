import path from "path";

import appRoot from 'app-root-path'
import ImageGenerator from "./ImageGenerator.js";

export default class ImageLetterGenerator extends ImageGenerator {
    _fontFamilyPath = `${appRoot.path}/assets/fonts/NexaScriptLight.ttf`
    _imagePathMale = `${appRoot.path}/assets/images/templates/male-mail-template.jpg`
    _imagePathFemale = `${appRoot.path}/assets/images/templates/female-mail-template.jpg`
    make = async (text, outputPath, fileName = 'letter', gender = 'male') => {
        const svg = Buffer.from(`
            <svg width="2480" height="3508" viewBox="0 0 2480 3508" fill="none" xmlns="http://www.w3.org/2000/svg">
                <style>
                    @font-face {
                        font-family: "Nexa Script"; 
                        src: url(${this._fontFamilyPath});
                    }
                </style>
                <text fill="#41477E" xml:space="preserve" style="white-space: pre" font-family="Nexa Script" font-size="52"
                      letter-spacing="0em"><tspan x="395" y="1161.86">${text}</tspan></text>
            </svg>
        `);

        try {
            return await this.generateBySvg(svg, gender === 'male' ? this._imagePathMale : this._imagePathFemale, outputPath, fileName, 'jpg').then(res => {
                return res;
            })
        } catch (e) {
            console.log(e)
        }
    }
}
