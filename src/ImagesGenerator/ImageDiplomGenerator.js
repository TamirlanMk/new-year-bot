import ImageGenerator from "./ImageGenerator.js";

import AppRoot from 'app-root-path'
import appRoot from 'app-root-path'
import path from "path";

export default class ImageDiplomGenerator extends ImageGenerator {
    _fontFamilyPath = path.join(`${AppRoot.path}`, `/assets/fonts/NexaScriptLight.ttf`)
    _imagePath = path.join(`${AppRoot.path}`, `/assets/images/templates/diplom-template.png`)
    make = async (text, outputPath, fileName = 'diplom') => {
        const svg = Buffer.from(`<svg width="2480" height="3508" viewBox="0 0 2480 3508" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>
                    @font-face {
                        font-family: "Nexa Script"; 
                        src: url(${this._fontFamilyPath});
                    }
                </style>
            <g id="text-group">
                <rect id="Rectangle 1" x="552" y="1959" width="1373" height="228" rx="72" fill="white"/>
                <text id="text-field" x="47.5%" y="2112.52" fill="#075587" xml:space="preserve" style="white-space: pre" font-family="Nexa Script"
                  font-size="128" letter-spacing="0em" text-anchor="middle">
                    ${text}
                </text>
            </g>
            </svg>`);

        try {
            return await this.generateBySvg(svg, this._imagePath, outputPath, fileName, 'jpg').then(res => {
                return res;
            })
        } catch (e) {
            console.log(e)
        }
    }
}
