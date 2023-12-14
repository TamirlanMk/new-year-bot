// If modifying these scopes, delete token.json.
import path from "path";
import fs from "fs";
import {google} from "googleapis";
import appRoot from "app-root-path";
import {file} from "googleapis/build/src/apis/file/index.js";
import AppRoot from "app-root-path";

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const TOKEN_PATH = path.join(AppRoot.path, 'google/token.json');
const CREDENTIALS_PATH = path.join(AppRoot.path, 'google/credentials.json');

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH))

export async function authorize() {
    const jwtClient = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        SCOPES
    )

    await jwtClient.authorize()

    return jwtClient
}

export async function createOrFindFolder(authClient, name) {
    return new Promise(async (resolve, reject) => {
            try {
                const drive = google.drive({version: 'v3', auth: authClient});
                const fileMetaData = {
                    parents: ['1VorzQX5bbAv2cjMZ8_SqUBqZECEhG3E9']
                }

                let parentId = '1VorzQX5bbAv2cjMZ8_SqUBqZECEhG3E9'

                drive.files.emptyTrash({})

                const res = await drive.files.list({
                    q: `name='${name}' and trashed=false`,
                    fields: 'nextPageToken, files(id, name)',
                    spaces: 'drive',
                });

                let folderId = '';

                if (res.data.files.length > 0) {
                    console.log(res.data.files[0].id)
                    folderId = res.data.files[0].id
                } else {
                    let folder = await drive.files.create({
                        resource: {...fileMetaData, name: name, mimeType: 'application/vnd.google-apps.folder'}
                    }).then((res) => {
                        console.log(res.data)
                        return res.data
                    })
                    folderId = folder.id
                }

                resolve(folderId)
            } catch (e) {
                reject(e)
            }
        }
    )
}

export async function uploadFile(authClient, folderName, pathToVideo) {
    return new Promise(async (resolve, reject) => {
            try {
                const drive = google.drive({version: 'v3', auth: authClient});
                const fileMetaData = {
                    name: "",
                }

                let folderId = await createOrFindFolder(authClient, folderName)

                let fileId = await drive.files.create({
                    resource: {...fileMetaData, name: "video.mp4", parents: [folderId], role: "reader", type: "anyone"},
                    media: {
                        body: fs.createReadStream(pathToVideo),
                        mimeType: 'video/mp4'
                    },
                    fields: 'id'
                }).then((res) => {
                    // console.log(res)
                    return res.data.id
                }).catch(res => {
                    console.error(res)
                })

                let permissions = await drive.permissions.create({
                    fileId: fileId,
                    requestBody: {
                        role: 'reader',
                        type: 'anyone',
                    }
                }).then(res => {
                    // console.log(res)
                });

                resolve(`https://drive.google.com/file/d/${fileId}/view?usp=sharing`)
            } catch (e) {
                reject(e)
            }
        }
    )
}
