const {
    ApolloServer,
    PubSub
} = require('apollo-server-express');
const mongoose = require('mongoose');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const {
    MONGODB,
    keys
} = require('./config.js');
import express from 'express';
const pubsub = new PubSub();
const port = process.env.port || 5000;
const pathGQL = '/graphql';
import FacebookStrategy from 'passport-facebook';
import passport from 'passport';
import uuid from 'uuid/v4';
import User from './models/User';
const cookieSession = require('cookie-session');
// const checkAuth = require('./util/check-auth');
const jwt = require('jsonwebtoken');
const {
    SECRET_KEY
} = require('./config');
var FortyTwoStrategy = require('passport-42').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config()
const torrentStream = require('torrent-stream');
const path = require('path');
const fs = require('fs');
var cors = require('cors');
import getTorrent from './Torrent';
import Filetimer from './filetime'
import getSubtitles from './Subtitles';
var schedule = require('node-schedule');

// every 5 second test
// schedule.scheduleJob('*/5 * * * * *', function(){
schedule.scheduleJob('0 0 1 * *', function () {
    // “At 00:00 on day-of-month 1.”
    // console.log("5 second");
    Filetimer();
});

// fs.readdir(__dirname + `/../Downloads`, (err, files) => {
//     files.forEach(file => {
//     //   console.log(file);
//         fs.stat(__dirname + `/../Downloads/${file}`, function (err, stats) {
//             // console.log(stats.atime);
//             let timerFile = stats.atime;
//             let fileH = timerFile.getHours();
//             let fileM = timerFile.getMinutes();
//             let fileMonth = timerFile.getMonth();
//             let d = new Date();
//             let m = d.getMinutes();
//             let h = d.getHours();
//             let monthNow = d.getMonth();
//             console.log("ficheros:   " + fileH + ":" + fileM);
//             console.log ("fecha now:  " + h + ":" + m);
//             // if (h > fileH && m >= fileM) {
//             if (monthNow > fileMonth) {
//                 fs.unlink(__dirname + `/../Downloads/${file}`,function(err){
//                     if(err) return console.log(err);
//                     console.log('file deleted successfully');
//                 });
//             }
//             if (err) {
//                 return console.error(err);
//             }
//         });
//     });
// });

const facebookOptions = {
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_KEY,
    callbackURL: 'http://localhost:5000/auth/facebook/callback',
    profileFields: ['id', 'email', 'first_name', 'last_name']
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_KEY,
    callbackURL: 'http://localhost:5000/auth/google/callback',
    profileFields: ['id', 'email', 'first_name', 'last_name']
},
    function (accessToken, refreshToken, profile, done) {
        User.findOne({
            googleId: profile.id
        }).then(currentUser => {
            if (currentUser) {
                console.log("ok");
                done(null, currentUser);
            } else {
                var newUser = new User({
                    id: uuid(),
                    googleId: profile.id,
                    fortytwoId: "",
                    facebookId: "",
                    username: profile.displayName,
                    prenom: profile.name.givenName,
                    nom: profile.name.familyName,
                    email: 'not specified',
                    createdAt: new Date().toISOString(),
                    image: "/static/media/profilePic1.62db51f5.png",
                    seenMovies: []
                })
                    .save()
                    .then(newUser => {
                        done(null, newUser);
                    });
            }
        });
    }
));

passport.use(new FortyTwoStrategy({
    clientID: process.env.FORTYTWO_ID,
    clientSecret: process.env.FORTYTWO_KEY,
    callbackURL: 'http://localhost:5000/auth/42/callback'
},
    function (accessToken, refreshToken, profile, done) {
        User.findOne({
            fortytwoId: profile.id
        }).then(currentUser => {
            if (currentUser) {
                done(null, currentUser);
            } else {
                var newUser = new User({
                    id: uuid(),
                    fortytwoId: profile.id,
                    googleId: "",
                    facebookId: "",
                    username: profile.username,
                    prenom: profile.name.givenName,
                    nom: profile.name.familyName,
                    createdAt: new Date().toISOString(),
                    seenMovies: [],
                    image: "/static/media/profilePic1.62db51f5.png",
                    email: profile.emails &&
                        profile.emails[0] &&
                        profile.emails[0].value
                })
                    .save()
                    .then(newUser => {
                        done(null, newUser);
                    });
            }
        });
    }));

const facebookCallback = (accessToken, refreshToken, profile, done) => {
    User.findOne({
        facebookId: profile.id
    }).then(currentUser => {
        // console.log(profile.id);
        // console.log(User);

        // console.log(currentUser);
        if (currentUser) {
            // console.log("ok");
            // console.log(currentUser);
            done(null, currentUser);
            // console.log('ok');
        } else {
            // console.log('new user');
            var newUser = new User({
                id: uuid(),
                facebookId: profile.id,
                fortytwoId: "",
                googleId: "",
                email: profile.emails &&
                    profile.emails[0] &&
                    profile.emails[0].value,
                username: profile.name.givenName,
                prenom: profile.name.givenName,
                nom: profile.name.familyName,
                password: "null",
                createdAt: new Date().toISOString(),
                image: "/static/media/profilePic1.62db51f5.png",
                seenMovies: []
            })
                .save()
                .then(newUser => {
                    done(null, newUser);
                });
        }
    });
};

passport.use(new FacebookStrategy(facebookOptions, facebookCallback));
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
        done(null, user);
    });
});

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({
        req
    }) => ({
        req,
        pubsub
    }),
    playground: {
        settings: {
            'request.credentials': 'same-origin'
        }
    }
});
const app = express();

//*******STREAM ROUTE********//
app.use(cors())
app.get('/downloadSubtitles/:movieID/:movieName/:lang', getSubtitles);
app.get('/downloadMovie/:movieID/:torrentHash/:movieName', function (req, res) {
    const movieID = req.params.movieID;
    const torrentHash = req.params.torrentHash;
    const movieName = req.params.movieName;
    console.log("movie Id " + movieID + " torrent ici " + torrentHash)
    if (!movieID || !torrentHash)
        res.send({
            status: "Error!!",
            message: "movieID or Hash doesn't exist..."
        })
    const magnetLink = `magnet:?xt=urn:btih:${torrentHash}`;
    getTorrent(movieID, magnetLink, req, res);
});

app.get('/playMovie/:movieID', function (req, res) {
    const movieID = req.params.movieID;
    let pathTest1 = __dirname + `/../Downloads/${movieID}.mp4`;
    let pathTest2 = __dirname + `/../Downloads/${movieID}.webm`;
    fs.access(pathTest1, (err) => {
        if (!err) {
            const path = __dirname + `/../Downloads/${movieID}.mp4`;
            const stat = fs.statSync(path)
            const fileSize = stat.size
            const range = req.headers.range
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-")
                const start = parseInt(parts[0], 10)
                const end = parts[1] ?
                    parseInt(parts[1], 10) :
                    fileSize - 1
                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(path, {
                    start,
                    end
                })
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                }
                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                }
                res.writeHead(200, head)
                fs.createReadStream(path).pipe(res)
            }
            return;
        }
        fs.access(pathTest2, (err) => {
            if (!err) {
                const path = __dirname + `/../Downloads/${movieID}.webm`;
                const stat = fs.statSync(path)
                const fileSize = stat.size
                const range = req.headers.range
                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-")
                    const start = parseInt(parts[0], 10)
                    const end = parts[1] ?
                        parseInt(parts[1], 10) :
                        fileSize - 1
                    const chunksize = (end - start) + 1;
                    const file = fs.createReadStream(path, {
                        start,
                        end
                    })
                    const head = {
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunksize,
                        'Content-Type': 'video/webm',
                    }
                    res.writeHead(206, head);
                    file.pipe(res);
                } else {
                    const head = {
                        'Content-Length': fileSize,
                        'Content-Type': 'video/webm',
                    }
                    res.writeHead(200, head)
                    fs.createReadStream(path).pipe(res)
                }
                return;
            }
            console.log("Path non trouve baby")
            res.send({ status: "Error", message: "File doesn't exist" })
        });
    });
});

if (!fs.existsSync("Downloads")) {
    fs.mkdirSync("Downloads");
}
if (!fs.existsSync("Downloads/Subtitles")) {
    fs.mkdirSync("Downloads/Subtitles");
}
if (!fs.existsSync("Downloads/Subtitles/en")) {
    fs.mkdirSync("Downloads/Subtitles/en");
}
if (!fs.existsSync("Downloads/Subtitles/fr")) {
    fs.mkdirSync("Downloads/Subtitles/fr");
}
if (!fs.existsSync("Downloads/Subtitles/es")) {
    fs.mkdirSync("Downloads/Subtitles/es");
}
//*******STREAM ROUTE********//


app.use(
    cookieSession({
        maxAge: 24 * 60 * 60,
        keys: [keys]
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/42',
    passport.authenticate('42'));

app.get('/auth/42/callback',
    passport.authenticate('42', {
        failureRedirect: 'http://localhost:3000/login'
    }),
    // Successful authentication, redirect home.
    function (req, res) {
        var token = jwt.sign({
            id: req.user.id,
            email: req.user.email,
            username: req.user.username
        },
            SECRET_KEY, {
            expiresIn: '3h'
        }
        );
        try {
            res.cookie('auth', token);
            return res.redirect('http://localhost:3000/SocialAuthRedirect');
        } catch (e) {
            console.log(err);
        }
    });

app.get(
    '/auth/facebook',
    passport.authenticate('facebook', {
        scope: ['email']
    })
);
app.get(
    '/auth/facebook/callback',
    passport.authenticate('facebook', {
        failureRedirect: 'http://localhost:3000/login'
    }),
    function (req, res) {
        var token = jwt.sign({
            id: req.user.id,
            email: req.user.email,
            username: req.user.username
        },
            SECRET_KEY, {
            expiresIn: '3h'
        }
        );
        try {
            // var decoded = jwt.verify(token, SECRET_KEY);
            // console.log(decoded);
            res.cookie('auth', token);
            return res.redirect('http://localhost:3000/SocialAuthRedirect');
            // return decoded;
        } catch (e) {
            console.log(err);
        }
        // console.log(token);
        // successRedirect: 'http://localhost:3000/';
    });



app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile']
    }));

app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: 'http://localhost:3000/login'
    }),
    function (req, res) {
        var token = jwt.sign({
            id: req.user.id,
            email: '',
            username: req.user.username
        },
            SECRET_KEY, {
            expiresIn: '3h'
        }
        );
        try {
            res.cookie('auth', token);
            return res.redirect('http://localhost:3000/SocialAuthRedirect');
        } catch (e) {
            console.log(err);
        }
    });

const connection = mongoose.connect(MONGODB, {
    useNewUrlParser: true
});
connection
    .then(db => {
        db;
        console.log('MongoDB Connected');
    })
    .catch(err => {
        console.log(err);
    });
mongoose.set('useFindAndModify', false);
server.applyMiddleware({
    app,
    path: '/',
    cors: true,
    onHealthCheck: () =>
        new Promise((resolve, reject) => {
            if (mongoose.connection.readyState > 0) {
                resolve();
            } else {
                reject();
            }
        })
});
app.listen({
    port,
    pathGQL
}, () => {
    console.log(`Server listening on port http://localhost:${port}${pathGQL}`);
});