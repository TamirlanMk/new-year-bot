import fs from "fs";
import sharp from "sharp";
import path from "path";

export default class ImageGenerator {
    generateBySvg = async (svgBuffer, imageFullPath, outputPath, filename = 'ready-image', fileExtension = 'jpg') => {
        const file = fs.existsSync(imageFullPath) ? await fs.promises.readFile(imageFullPath) : false;

        if (!file) {
            throw `File is not exist: ${imageFullPath}`;
        }

        const outputFullPath = path.join(`${outputPath}`, `/${filename}.${fileExtension}`)

        const img = sharp(file);
        const res = await img.composite([{input: svgBuffer}]).toBuffer()

        await fs.promises.writeFile(`${outputFullPath}`, res)

        return outputFullPath;
    }
}