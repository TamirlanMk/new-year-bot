import fs from "fs";
import path from "path";
import {Markup, session, Telegraf} from "telegraf";
import ffmpeg from "fluent-ffmpeg";
import {path as ffmpegPath} from "@ffmpeg-installer/ffmpeg"

import {path as ffprobePath} from '@ffprobe-installer/ffprobe'
import filesStore from "./src/FilesStore.js";
import appRoot from "app-root-path";
import NewYearVideo from "./src/NewYearVideo.js";
import ImageDiplomGenerator from "./src/ImagesGenerator/ImageDiplomGenerator.js";
import ImageLetterGenerator from "./src/ImagesGenerator/ImageLetterGenerator.js";
import axios from "axios";
import sharp from "sharp";
import ImageUserFrameGenerator from "./src/ImagesGenerator/ImageUserFrameGenerator.js";
import {authorize, uploadFile} from "./google/GoogleDrive.js";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const bot = new Telegraf('6668047539:AAEBms0SdZOszjtC5c44tUOp7xemvzvZ7hE', {
    handlerTimeout: Infinity
});

bot.telegram.setMyCommands([
    {
        command: 'generate',
        description: 'Start generating greetings'
    }
])

// Step 0 = Start,
// Step 1 = Set Number of Kids,
// Step 2 = Set Names of Kids,
// Step 3 = Set Gender
// Step 4 = Generation or
// Step 5 = Making New Video
// Step 6 = Video ready
const defaultSession = {
    step: 0, type: null, quantity: null, storyImage: null, peoples: [],
}

bot.use(session({
    defaultSession: () => (defaultSession)
}))

const btns = {
    start: [{
        text: 'Сгенерировать поздравление', data: 'new-congratulation'
    }], newCongratulation: [{
        text: 'Поздравление, часть 1', data: 'part-1'
    }, {
        text: 'Поздравление, часть 2', data: 'part-2'
    }, {
        text: 'Поздравление, часть 3', data: 'part-3'
    }, {
        text: 'Поздравление, часть 4', data: 'part-4'
    }, {
        text: 'Поздравление, часть 5', data: 'part-5'
    }, {
        text: 'Сказка "Колобок"', data: 'story-kolobok'
    }],
    gender: [{
        text: 'Мальчик', data: 'male'
    }, {
        text: 'Девочка', data: 'female'
    },]
    , kids: [{
        text: '1', data: 'one-kid'
    }, {
        text: '2', data: 'two-kids'
    }, {
        text: '3', data: 'three-kids'
    },], people: [{
        text: 'Первый человек', data: 'first-person'
    }, {
        text: 'Второй человек', data: 'second-person'
    }, {
        text: 'Третий человек', data: 'third-person'
    }],
    generate: [
        {
            text: 'Сгенерировать видео',
            data: 'generate-video'
        },
        {
            text: 'Ввести другие имена',
            data: 'set-new-names'
        }
    ]
}

async function startHandle(ctx) {
    ctx.session.step = 0;
    ctx.session.type = null;
    ctx.session.quantity = null;
    ctx.session.peoples = [];

    const user = ctx.from;
    const senderName = user.first_name || 'пользователь';

    console.log(`User ${ctx.chat.id} start...`);

    await ctx.reply(`Здравствуй ${senderName}, вас приветсвует бот для создания новогодних поздравлений!`, Markup.inlineKeyboard(btns.start.map(btn => {
        return [Markup.button.callback(btn.text, btn.data)]
    })));
}

bot.command('generate', startHandle);
bot.start(startHandle);

// Начало генерации поздравления
bot.action('new-congratulation', async (ctx) => {
    await ctx.editMessageText('Создаем поздравление...', {
        reply_markup: {inline_keyboard: []}, // Пустая клавиатура
    });

    console.log(`User ${ctx.chat.id} selecting type...`)

    await ctx.reply(`Выберите какое поздравление вы хотите создать:`, Markup.inlineKeyboard(btns.newCongratulation.map(btn => {
        return [Markup.button.callback(btn.text, btn.data)]
    })));
});

// Выбор типа поздравления
btns.newCongratulation.map(btn => {
    bot.action(btn.data, async (ctx) => {
        ctx.session.step = 1
        ctx.session.type = btn.data

        ctx.editMessageText(`Вы выбрали: ${btn.text}`, {
            reply_markup: {inline_keyboard: []}, // Пустая клавиатура
        });

        console.log(`User ${ctx.chat.id} selecting quantity...`)

        ctx.reply('Выберите сколько человек вы хотите поздравить:', Markup.inlineKeyboard(btns.kids.map(btn => {
            return Markup.button.callback(btn.text, btn.data)
        })))
    })
})

// Количество людей
btns.kids.map((btn, index) => {
    bot.action(btn.data, async (ctx) => {
        ctx.session.step = 2;
        ctx.session.quantity = index + 1;

        ctx.editMessageText(`Количество, ${ctx.session.quantity}`, {
            reply_markup: {inline_keyboard: []}, // Пустая клавиатура
        });

        console.log(`User ${ctx.chat.id} input name...`)

        ctx.session.step = 3;
        await ctx.reply('Введите имя: ')
    })
})

// Заполнение людей
btns.people.map((btn, index) => {
    bot.action(btn.data, async (ctx) => {
        ctx.session.step = 3;

        ctx.editMessageText(`Заполните имена людей которых вы хотите поздравить, ${ctx.session.quantity}`, {
            reply_markup: {inline_keyboard: []}, // Пустая клавиатура
        });

        ctx.reply('Введите имя: ')
    })
})

btns.gender.map((btn, index) => {
    bot.action(btn.data, async (ctx) => {
        ctx.session.peoples[ctx.session.peoples.length - 1].gender = btn.data;

        ctx.editMessageText(`${ctx.session.peoples.length}: ${ctx.session.peoples[ctx.session.peoples.length - 1].name}, ${btn.data === 'male' ? 'Мальчик' : 'Девочка'}`, {
            reply_markup: {inline_keyboard: []}, // Пустая клавиатура
        });

        if (ctx.session.quantity !== ctx.session.peoples.length) {
            await ctx.reply('Введите имя:');
        } else {
            let pathNames = '';

            if (ctx.session.type.includes('part')) {
                pathNames = path.join(`${appRoot.path}`, 'assets/names/congratulation');
            } else {
                pathNames = path.join(`${appRoot.path}`, 'assets/names/story');
            }

            let hasError = false;
            let errorText = '';

            ctx.session.peoples.forEach(people => {
                if (!fs.existsSync(path.join(pathNames, `${people.gender}/${people.name}`))) {
                    errorText += `Имя: ${people.name} недоступно. `
                    hasError = true
                }
            })

            if (hasError) {
                ctx.session.step = 3
                ctx.session.peoples = [];

                await ctx.reply(`${errorText} Попробуйте еще раз, или введите другое имя. \nВведите имя:`);
            } else if (ctx.session.type.includes('story')) {
                ctx.session.step = 4;
                await ctx.reply(ctx.session.quantity > 1 ? `Загрузите общую фотографию:` : `Загрузите фотографию:`)
            } else {
                ctx.session.step = 5

                let generateBtns = btns.generate.map(btn => {
                    return Markup.button.callback(btn.text, btn.data)
                })
                let names = ctx.session.peoples.map(people => people.name);

                await ctx.reply(`Введенные имена: ${names.join(', ')}`,
                    Markup.inlineKeyboard(generateBtns)
                )
            }
        }
    })
})

btns.generate.map((btn, index) => {
    bot.action(btn.data, async (ctx) => {
        try {
            if (btn.data === 'set-new-names') {
                ctx.session.step = 3;
                ctx.session.peoples = [];

                ctx.editMessageText('Выберите сколько человек вы хотите поздравить:', Markup.inlineKeyboard(btns.kids.map(btn => {
                    return Markup.button.callback(btn.text, btn.data)
                })))
            } else {
                ctx.session.step = 6;
                ctx.editMessageText(`Выполняется генерация видео, пожалуйста подождите 5 - 10 минут...`, {
                    reply_markup: {inline_keyboard: []}, // Пустая клавиатура
                });

                let temp = path.join(`${appRoot.path}/temp/`, `temp-${ctx.chat.id}`);

                fs.readdir(temp, (err, files) => {
                    if (err) throw err;

                    let filesToDel = files.filter(file => file !== 'frame.jpg');

                    for (const file of filesToDel) {
                        fs.unlink(path.join(temp, file), (err) => {
                            if (err) throw err;
                        });
                    }
                });

                let result = await generateVideo(ctx.chat.id, ctx.session).then(() => {
                    return true
                }).catch(() => {
                    return false
                })

                let images = [];
                const diplomGenerator = new ImageDiplomGenerator();
                const letterGenerator = new ImageLetterGenerator();

                for (let person of ctx.session.peoples) {
                    const letterText = person.gender === 'male' ? `Дорогой ${person.name}!` : `Дорогая ${person.name}!`
                    let diplom = await diplomGenerator.make(person.name, temp, `diplom-${person.name}`)
                    let letter = await letterGenerator.make(letterText, temp, `letter-${person.name}`, person.gender)

                    images.push(diplom, letter)
                }

                if (result) {
                    try {
                        const mediaGroup = images.map((imagePath) => ({
                            media: {
                                source: fs.createReadStream(imagePath)
                            },
                            type: 'photo'
                        }))
                        ctx.replyWithMediaGroup(mediaGroup)
                    } catch (e) {
                        console.log(e)
                        ctx.reply(`Произошла ошибка во время генерации дипломов`)
                    }

                    let videoPath = path.join(temp, ctx.session.storyImage == null ? '/ready.mp4' : '/ready_story.mp4')
                    try {
                        await authorize().then((client) => {
                            uploadFile(client, ctx.chat.id, videoPath).then(async url => {
                                await ctx.editMessageText('Видео, диплом и письмо готовы к скачиванию.')
                                await ctx.reply(`Видео доступно по ссылке: `,
                                    Markup.inlineKeyboard([
                                        [Markup.button.url('Видео', url)]
                                    ]));

                                fs.readdir(temp, (err, files) => {
                                    if (err) throw err;

                                    for (const file of files) {
                                        fs.unlink(path.join(temp, file), (err) => {
                                            if (err) throw err;
                                        });
                                    }
                                });
                            })
                        }).catch(res => console.log(res))
                    } catch (error) {
                        console.error('Произошла ошибка во время отправки видео:', error);
                    }
                }
            }
        } catch (e) {
            console.log(e)
            ctx.editMessageText('Произошла ошибка во время генерации видео...')
        }
    })
})

bot.on('text', async ctx => {
    switch (ctx.session.step) {
        case 3:
            const name = await ctx.message.text;

            ctx.session.peoples.push({
                name: name.trim().charAt(0).toUpperCase() + name.trim().slice(1),
                gender: null
            })

            ctx.reply('Выберите пол:',
                Markup.inlineKeyboard(btns.gender.map(btn => {
                    return Markup.button.callback(btn.text, btn.data)
                })))
            break;
    }
})

bot.on('photo', async ctx => {
    switch (ctx.session.step) {
        case 4:
            try {
                ctx.session.step = 5

                let temp = path.join(`${appRoot.path}/temp/`, `temp-${ctx.chat.id}`);
                const files = ctx.update.message.photo;
                const fileHref = await ctx.telegram.getFileLink(files[1].file_id).then(res => {
                    return res.href
                })

                const image = await axios.get(fileHref, {responseType: 'arraybuffer'});
                const {width, height} = await sharp(image.data).metadata();
                const imageBuffer = await sharp(image.data);
                const localPathImage = path.join(temp, `user-image.jpg`)

                await fs.promises.writeFile(localPathImage, imageBuffer)

                let imageGenerator = new ImageUserFrameGenerator()

                ctx.session.storyImage = await imageGenerator.make(localPathImage, temp, width > height ? 'h' : 'v', 'frame').then(res => res)

                let names = ctx.session.peoples.map(people => people.name);
                let generateBtns = btns.generate.map(btn => {
                    return Markup.button.callback(btn.text, btn.data)
                })

                await ctx.reply(`Введенные имена: ${names.join(', ')}`,
                    Markup.inlineKeyboard(generateBtns)
                )
            } catch (e) {
                ctx.reply(`Произошла ошибка во время генерации фотографии`)
                console.error(e)
            }
    }
})

async function generateVideo(id, session) {
    try {
        let video = new NewYearVideo(id, session.type, session.peoples, filesStore, session.storyImage).make();

        return video.then((result) => {
            console.log(`Video for user ${id} ready`)
        }).catch(e => {
            console.log(e)
        });

    } catch (e) {
        console.log(e);
    }
}

bot.launch().then(r => console.log(r)).catch(e => {
    console.log("aaaaaaaaaaaaaaaaaaaa");
});
