import React, {
    useState,
    useContext
} from 'react';
import {
    useParams
} from 'react-router-dom';
import styled from 'styled-components';
import Header from '../general/Header';
import Footer from '../general/Footer';
import Com from './Comment';
import gql from "graphql-tag";
import noImage from "../../assets/images/noImage.png";
import {
    useQuery,
    useMutation
} from "@apollo/react-hooks";
import axios from 'axios';
import Countdown from 'react-countdown-now';
import { AuthContext } from "../../context/auth";
var _ = require('lodash');

export default function Movie() {

    const FETCH_INFO_TMDB = gql`
    query($id: ID!){
        getInfoTMDB(id: $id){
            id
            title
            poster_path
            vote_average
            overview
            release_date
            runtime
        }
    }`;

    const FETCH_INFO_YTS = gql`
    query($name: String!){
        getInfoYTS(name: $name){
            page_number
            movies {
                id
                title
                large_cover_image
                rating
                yt_trailer_code
                torrents {
                    url
                    hash
                    quality
                }
            }
        }
    }`;

    const FETCH_INFO_TPB = gql`
    query($name: String!){
        getInfoTPB(name: $name){
            name
            magnetLink
        }
    }`;

    const ADD_SEEN_MOVIE = gql`
        mutation addSeenMovie(
            $userId: ID!
            $movieId: String!
        ) {
            addSeenMovie(
                userId: $userId
                movieId: $movieId
            ) {
                id
            }
        }
    `;
    const movieID = useParams().id;
    const user = useContext(AuthContext);
    const userId = user.user.id;
    const [addMovie] = useMutation(ADD_SEEN_MOVIE);
    const [SubURLen, setSubURLen] = useState("");
    const [SubURLfr, setSubURLfr] = useState("");
    const [SubURLes, setSubURLes] = useState("");
    const movieLink = useState("");
    const [Show, setShow] = useState(false);
    const [Go, setGo] = useState(false);
    const [OnPlay, setOnPlay] = useState(false);
    const Finisheds = () => {
        console.log("Waiting ...");
    }
    const [Finished, setFinished] = useState(Finisheds);
    const [nameMovie, setNameMovie] = useState("");
    const infoTMDB = useQuery(FETCH_INFO_TMDB, {
        variables: {
            id: movieID
        }
    });

    const Tmdb = infoTMDB.data.getInfoTMDB;
    if (Tmdb && nameMovie === "") {
        setNameMovie(Tmdb.title);
    }

    const infoTpb = useQuery(FETCH_INFO_TPB, {
        variables: {
            name: nameMovie
        }
    });
    const infoYts = useQuery(FETCH_INFO_YTS, {
        variables: {
            name: nameMovie
        }
    });
    const ytsMovies = _.get(infoYts.data.getInfoYTS, 'movies');
    const tpbMovies = infoTpb.data.getInfoTPB;
    const yt_trailer_code = _.get(ytsMovies, '[0].yt_trailer_code')
    let ytsHash = "";
    if (ytsMovies) {
        let ytsMov = ytsMovies.find(e => e.title === nameMovie);
        if (ytsMov)
            ytsHash = _.get(ytsMov, 'torrents[0].hash');
    }

    let tpbHash = "";
    if (tpbMovies) {
        let tpbMov = tpbMovies.find(e => e.name.includes(nameMovie + " ("));
        if (tpbMov) {
            tpbHash = tpbMov.magnetLink.split(":")[3].split("&")[0];

        }
    }

    // let movie = infoYts.getInfoYTS;
    // console.log("mooovie " + JSON.stringify(movie))
    // movie = Object.assign({}, _.get(movie, 'data.movie'))
    // console.log("mooovie " + JSON.stringify(movie))
    // console.log("Hash is here => " + tpbHash + " " + ytsHash)
    if (!Tmdb) {
        return <h3> Loading... </h3>;
    }
    const renderer = ({ seconds, completed }) => {
        if (completed) {
            // Render a completed state
            setFinished(Finish())
            return <Completionist />;
        } else {
            // Render a countdown
            return <span>Wait ... {seconds}</span>;
        }
    };
    const Completionist = () => { if (Show) return <span>Enjoy Watching...</span>; else return <span>Let's START</span> };
    let Texton = <Countdown date={Date.now() + 40000} renderer={renderer} />

    function startDownloadingYTS() {
        setGo(true);
        addMovie({ variables: { userId: userId, movieId: Tmdb.id } });
        if (nameMovie) {
            console.log("name => " + nameMovie)
            axios.get(`http://localhost:5000/downloadSubtitles/${movieID}/${nameMovie}/en`).then(res => {
                // console.log(JSON.stringify(res.data.subtitlesEnBase64));
                const URL = window.URL || window.webkitURL;
                const Subtitles64 = window.atob(res.data.subtitlesEnBase64);
                const subtitlesBlob = new Blob([Subtitles64], {
                    type: "text/vtt"
                });
                const UrlSubtitlesEn = URL.createObjectURL(subtitlesBlob);
                setSubURLen(UrlSubtitlesEn);
                // console.log('sous titre' + Subtitles64)
            });
            axios.get(`http://localhost:5000/downloadSubtitles/${movieID}/${nameMovie}/fr`).then(res => {
                // console.log(JSON.stringify(res.data.subtitlesEnBase64));
                const URL = window.URL || window.webkitURL;
                const Subtitles64 = window.atob(res.data.subtitlesFrBase64);
                // console.log(Subtitles64);
                const subtitlesBlob = new Blob([Subtitles64], {
                    type: "text/vtt; charset=utf-8"
                });
                const UrlSubtitlesFr = URL.createObjectURL(subtitlesBlob);
                setSubURLfr(UrlSubtitlesFr);
                // console.log('sous titre' + Subtitles64)
            });
            axios.get(`http://localhost:5000/downloadSubtitles/${movieID}/${nameMovie}/es`).then(res => {
                // console.log(JSON.stringify(res.data.subtitlesEnBase64));
                const URL = window.URL || window.webkitURL;
                const Subtitles64 = window.atob(res.data.subtitlesEsBase64);
                const subtitlesBlob = new Blob([Subtitles64], {
                    type: "text/vtt; charset=utf-8"
                });
                const UrlSubtitlesEs = URL.createObjectURL(subtitlesBlob);
                setSubURLes(UrlSubtitlesEs);
                // console.log('sous titre' + Subtitles64)
            });
            axios.get(`http://localhost:5000/downloadMovie/${movieID}/${ytsHash}/${nameMovie}`)
        }

    }
    function startDownloadingTPB() {
        setGo(true);
        addMovie({ variables: { userId: userId, movieId: Tmdb.id } });
        if (tpbHash) {
            console.log("name => " + nameMovie)
            axios.get(`http://localhost:5000/downloadSubtitles/${movieID}/${nameMovie}/en`).then(res => {
                // console.log(JSON.stringify(res.data.subtitlesEnBase64));
                const URL = window.URL || window.webkitURL;
                const Subtitles64 = window.atob(res.data.subtitlesEnBase64);
                const subtitlesBlob = new Blob([Subtitles64], {
                    type: "text/vtt"
                });
                const UrlSubtitlesEn = URL.createObjectURL(subtitlesBlob);
                setSubURLen(UrlSubtitlesEn);
                // console.log('sous titre' + Subtitles64)
            });
            axios.get(`http://localhost:5000/downloadSubtitles/${movieID}/${nameMovie}/fr`).then(res => {
                // console.log(JSON.stringify(res.data.subtitlesEnBase64));
                const URL = window.URL || window.webkitURL;
                const Subtitles64 = window.atob(res.data.subtitlesFrBase64);
                const subtitlesBlob = new Blob([Subtitles64], {
                    type: "text/vtt; charset=utf-8"
                });
                const UrlSubtitlesFr = URL.createObjectURL(subtitlesBlob);
                setSubURLfr(UrlSubtitlesFr);
                // console.log('sous titre' + Subtitles64)
            });
            axios.get(`http://localhost:5000/downloadSubtitles/${movieID}/${nameMovie}/es`).then(res => {
                // console.log(JSON.stringify(res.data.subtitlesEnBase64));
                const URL = window.URL || window.webkitURL;
                const Subtitles64 = window.atob(res.data.subtitlesEsBase64);
                const subtitlesBlob = new Blob([Subtitles64], {
                    type: "text/vtt; charset=utf-8"
                });
                const UrlSubtitlesEs = URL.createObjectURL(subtitlesBlob);
                setSubURLes(UrlSubtitlesEs);
                // console.log('sous titre' + Subtitles64)
            });
            axios.get(`http://localhost:5000/downloadMovie/${movieID}/${tpbHash}/${nameMovie}`)
        }
    }
    const Finish = () => {
        setShow(true);
        setOnPlay(true);
    }
    var image;
    if (!Tmdb.poster_path)
        image = noImage
    else
        image = `https://image.tmdb.org/t/p/original${Tmdb.poster_path}`

    return (<MoviePage >
        <Header />
        <Content >
            <TextA>{Tmdb.title}</TextA>
            <Split >
                <Left> {yt_trailer_code && < Iframe src={"https://www.youtube.com/embed/" + yt_trailer_code}
                    frameborder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen > </Iframe>}
                    {!Show && <Video controls autoPlay loop="" >
                        <source src={movieLink} type="video/mp4" />
                    </Video>}

                    {Show && <Video controls autoPlay reload loop="" >
                        <source src={`http://localhost:5000/playMovie/${movieID}`} type="video/mp4" />
                        <source src={`http://localhost:5000/playMovie/${movieID}`} type="video/webm" />
                        {SubURLen && <track label="English" kind="captions" src={SubURLen} default />}
                        {SubURLfr && <track label="French" kind="captions" src={SubURLfr} />}
                        {SubURLes && <track label="Spanish" kind="captions" src={SubURLes} />}
                    </Video>}
                    <Text>Resume: </Text>
                    <Resumen>{Tmdb.overview}</Resumen>
                    <Text > Torrents:</Text>
                    {!Go && ytsHash && <span> <Link1 onClick={startDownloadingYTS}> YTS TORRENT </Link1></span>}
                    {!Go && tpbHash && <span> <Link1 onClick={startDownloadingTPB}> TPB TORRENT </Link1></span>}
                    {!tpbHash && !ytsHash && <span>Sorry !! No Torrents Founded</span>}
                    {!OnPlay && Go && <span> <Link2 onClick={Finished}>{Texton}</Link2></span>}
                    <Text >Comments: </Text>
                    <Com movie={movieID} />
                </Left>
                <Right>
                    <Picture src={image} alt={`${Tmdb.title}Image`} />
                    <Text>Release Date: {Tmdb.release_date}</Text>
                    <Text>Grade: {Tmdb.vote_average}</Text>
                    <Text>Duration: {Tmdb.runtime}min</Text>
                </Right>
            </Split>
        </Content>
        <Footer />
    </MoviePage >
    );
}

const Resumen = styled.p`
                justify-content: center;
                text-align: left;
                font-size: 14px;
                margin-left: 1rem;
                padding: 0 2rem;
    @media (max-width: 768px) {
                    font - size: 12px;
              }
          `

const Link2 = styled.button`
            width: 300px;
            height: 50px;
  background: ${props => props.theme.colors.ButtonT};
                border: none;
                font-size: 1rem;
  color: ${props => props.theme.colors.textColor};
                outline: 0;
                -webkit-border-radius: 5px;
                -moz-border-radius: 5px;
                border-radius: 5px;
  @media (max-width: 768px) {
                    width: 100%;
              }
            transition-duration: 0.3s;
  &:hover {
                    color: black;
    background-color: ${props => props.theme.colors.textColor};
                border-color: white
              }
            `;

const Link1 = styled.button`
                margin-bottom: 1rem;
                width: 300px;
                height: 50px;
    background: ${props => props.theme.colors.ButtonT};
                border: none;
                font-size: 1rem;
    color: ${props => props.theme.colors.textColor};
                outline: 0;
                -webkit-border-radius: 5px;
                -moz-border-radius: 5px;
                border-radius: 5px;
    @media (max-width: 768px) {
                    width: 100%;
            }
            transition-duration: 0.3s;
    &:hover {
                    color: black;
        background: ${props => props.theme.colors.textColor};
                border-color: white
            }
        `;

const MoviePage = styled.div`
            background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
    background-color: ${props => props.theme.colors.cardBackground};
                -webkit-background-size: cover;
                -moz-background-size: cover;
                -o-background-size: cover;
                background-size: cover;
                display: flex;
                min-height: 100vh;
                flex-direction: column;
                color: white;
            `
const Iframe = styled.iframe`
                margin: 0 auto 2rem;
                width: 60vmin;
                height: 30vmin;
            `;
// const HR = styled.hr`
//     border: 1px solid white;
// `
const Content = styled.div`
                display: flex;
                flex-direction: column;
                width: 90vmin;
                margin: 0 auto;
            `
const Split = styled.div`
                display: flex;
                justify-content: space-evenly;
                align-items: flex-start;
            `
const Left = styled.div`
                width: 70vmin;
                display: flex;
                flex-direction: column;
                text-align: center;
            `
const Video = styled.video`
                margin-top: 0;
                margin: 0 5vmin 5vmin 5vmin;
                width: 60vmin;
                height: 40vmin;
            `
const Right = styled.div`
                display: flex;
                flex-direction: column;
                /* width: 30vmin; */
            `

const Picture = styled.img`
                padding-bottom: 1rem;
                width: 25vmin;
                height: 25min;
                margin: 0 auto;
            `;

const Text = styled.span`
                font-weight: bold;
                margin: 0.5rem;
    @media (max-width: 768px) {
                    font - size: 12px;
            }
        `;

const TextA = styled.span`
            font-weight: bold;
            padding: 1rem;
            text-align: left;
            font-size: 2em;
            margin: 0.5rem;
`;