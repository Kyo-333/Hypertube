import axios from 'axios';
var srt2vtt = require('srt-to-vtt');
const imdb = require('imdb-api');
const fs = require('fs');


// SUBTITLES
export default function getSubtitles(movieName, movieID) {
    imdb.search({ name: `${movieName}` }, { apiKey: 'db4c999a', timeout: 30000 }).then((search) => {
        const result = search.results[0];
        const imdbCode = result.imdbid;
        const OS = require('opensubtitles-api');

        const OpenSubtitles = new OS({
            useragent: "cnairi42",
        });

        OpenSubtitles.login()
            .then(res => {
                console.log("Subtitles token => " + res.token);
            })
            .catch(err => {
                console.log(err);
            });

        let subtitlesPath = __dirname + '/../Downloads/Subtitles';
        let srtenFilePath = subtitlesPath + `/en/subtitles.${movieID}.en.srt`;
        let vttenFilePath = subtitlesPath + `/en/subtitles.${movieID}.en.vtt`;
        let writerenSrtFile = fs.createWriteStream(srtenFilePath);
        let writerenVttFile = fs.createWriteStream(vttenFilePath);
        let srtfrFilePath = subtitlesPath + `/fr/subtitles.${movieID}.fr.srt`;
        let vttfrFilePath = subtitlesPath + `/fr/subtitles.${movieID}.fr.vtt`;
        let writerfrSrtFile = fs.createWriteStream(srtfrFilePath);
        let writerfrVttFile = fs.createWriteStream(vttfrFilePath);
        let srtesFilePath = subtitlesPath + `/es/subtitles.${movieID}.es.srt`;
        let vttesFilePath = subtitlesPath + `/es/subtitles.${movieID}.es.vtt`;
        let writeresSrtFile = fs.createWriteStream(srtesFilePath);
        let writeresVttFile = fs.createWriteStream(vttesFilePath);
        OpenSubtitles.search({
            sublanguageid: "eng, fre, spa",
            imdbid: `${imdbCode}`,
            limit: '1',
            extensions: ["srt", "vtt"]
        })
            .then(async (subtitles) => {
                // console.log(subtitles.en[0].url)
                if (subtitles.en && subtitles.en[0].url) {
                    await axios({
                        method: "get",
                        url: subtitles.en[0].url,
                        responseType: "stream"
                    })
                        .then(response => {
                            response.data.pipe(writerenSrtFile);
                            writerenSrtFile.on("finish", async function () {
                                let srtToVttFile = await fs
                                    .createReadStream(srtenFilePath)
                                    .pipe(srt2vtt())
                                    .pipe(writerenVttFile);
                                srtToVttFile.on("finish", async function () {
                                    console.log("Finish Downloading subtitles EN")
                                });
                            });
                        })
                        .catch(err => { console.log(err) });
                } if (subtitles.fr && subtitles.fr[0].url) {
                    await axios({
                        method: "get",
                        url: subtitles.fr[0].url,
                        responseType: "stream"
                    })
                        .then(async response => {
                            await response.data.pipe(writerfrSrtFile);
                            writerfrSrtFile.on("finish", async function () {
                                let srtToVttFile = await fs
                                    .createReadStream(srtfrFilePath)
                                    .pipe(srt2vtt())
                                    .pipe(writerfrVttFile);
                                srtToVttFile.on("finish", async function () {
                                    console.log("Finish Downloading subtitles FR")
                                });
                            });
                        })
                        .catch(err => { console.log(err) });
                }
                if (subtitles.es && subtitles.es[0].url) {
                    await axios({
                        method: "get",
                        url: subtitles.es[0].url,
                        responseType: "stream"
                    })
                        .then(async response => {
                            await response.data.pipe(writeresSrtFile);
                            writeresSrtFile.on("finish", async function () {
                                let srtToVttFile = await fs
                                    .createReadStream(srtesFilePath)
                                    .pipe(srt2vtt())
                                    .pipe(writeresVttFile);
                                srtToVttFile.on("finish", async function () {
                                    console.log("Finish Downloading subtitles ES")
                                });
                            });
                        })
                        .catch(err => { console.log(err) });
                }
            })
            .catch(err => { console.log("Error Subtitles " + err) });



    });
}


































