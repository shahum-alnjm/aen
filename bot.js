// Modules
const Telegraf = require('telegraf');
const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl');

// Other Files
// Init winston logger (logger.js)
var outplaced = require(`${__dirname}/logger.js`);
var logger = outplaced.logger;

// Files
const config = require(`${__dirname}/config.json`);

// Global Vars
var VID_ID = 1;
var DOWN_URL = "https://www.youtube.com/watch?v=";
const DIRECTORY = `${__dirname}/cache`;

// Bot setup
const bot = new Telegraf(config.token);
logger.log('info', "Bot is running;; TOKEN: " + config.token);
bot.start((ctx) => ctx.reply('Hey there!'));
bot.help((ctx) => ctx.reply('Send me a link and I will send you the vid :) \n cmds: \n \n /video {videoID or shortened yt link}'));
bot.startPolling();

// Catch all errors from bot
bot.catch(function (err) { logger.log('info', err) });

// Commands
bot.command('/video', async (ctx) => {
    try {
        let userID = ctx.from["id"];

        let input = ctx.message["text"];
        let subText = input.split(" ");
        let subSplit;
        let videoURL;

        logger.log('info', `-----------NEW_DOWNLOAD_BY_${userID}-----------`);

        if (subText[1].includes("https://youtu.be/")) {
            subSplit = subText.split(".be/");
            videoURL = DOWN_URL + subSplit[1]
        } else {
            videoURL = DOWN_URL + subText[1];
        }
        logger.log('info', `Youtube video URL: ${videoURL}`);

        // Remove previous video from cache!
        if (fs.existsSync(`${__dirname}/cache/${userID}.mp4`)) {
            fs.unlink(`${__dirname}/cache/${userID}.mp4`, (err) => {
                if (err) logger.log('info', err);
                logger.log('info', `${__dirname}/cache/${userID}.mp4 was deleted`);
            });
        }

        // Get Video
        var video = youtubedl(videoURL,
            // Optional arguments passed to youtube-dl.
            ['--format=18'],
            // Additional options can be given for calling `child_process.execFile()`.
            { cwd: __dirname });

        // Will be called when the download starts.
        let title;
        let size;
        video.on('info', function (info) {
            logger.log('info', 'Download started');
            logger.log('info', 'filename: ' + info._filename);
            logger.log('info', 'size: ' + info.size);
            title = info._filename;
            size = info.size;
        });
        video.pipe(fs.createWriteStream(`${__dirname}/cache/${userID}.mp4`));

        // Send Video after 3 Seconds!
        setTimeout(function () {
            ctx.reply(`Video gets Send! - This might take a few Seconds! \n \n Title: \n ${title} \n \n Size: ${size}`);
            logger.log('info', `Video gets Send! - This might take a few Seconds! \n Title: ${title}, Size: ${size}`);
            ctx.replyWithVideo({
                source: fs.createReadStream(`${__dirname}/cache/${userID}.mp4`)
            })
        }, 3000);
    } catch (err) {
        logger.log('info', '!!!ERROR!!!');
        ctx.reply('!!!ERROR!!!');
    }
})