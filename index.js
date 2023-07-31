const axios = require('axios');
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const client = new Discord.Client({ intents: [1, 512, 32768, 2, 128] });
const { Client, Intents, message } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { url } = require('inspector');


const twitchToken = process.env.TWITCH_TOKEN;
const twitchClientId = process.env.TWITCH_CLIENT_ID;
const discordBotToken = process.env.DISCORD_BOT_TOKEN;
const twitchChannelName = 'belrodrigues';
const discordChannelName = '🔔・sininho';
const youtubeChannelIds = ['UC3TYvpGVVD9DrqRQAMUqK1A', 'UCb1prWGgxoiUDlHr6ymRQOw', 'UCQYICpjv48JHjylajtI45Bw'];

const twitchApiUrl = `https://api.twitch.tv/helix/streams?user_login=${twitchChannelName}`;



//Youtube

const youtubeApiUrls = youtubeChannelIds.map((channelId) =>
  `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=1&order=date&type=video&key=${process.env.YOUTUBE_API_KEY}`
);

function lerUltimosVideos() {
  try {
    const data = fs.readFileSync('lastVideoIds.json');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler o arquivo de IDs:', error.message);
    return [];
  }
}

function salvarUltimosVideos(videoIds) {
  try {
    fs.writeFileSync('lastVideoIds.json', JSON.stringify(videoIds));
  } catch (error) {
    console.error('Erro ao salvar o arquivo de IDs:', error.message);
  }
}

const cargo1Id = '671405516953616385';
const cargo2Id = '1135076791418110065';

//cortes
const emojicortes1 = 'sparks1';
const idcortes1 = '1128512504461545492';
const emojicortes2 = 'p2';
const idcortes2 = '1109187577157791805';
const emojicortes3 = 'cortes';
const idcortes3 = '1135085382619369492';
// bel rodrigues
const emojibel1 = 'book2';
const idbel1 = '1128512491601805373';
const emojibel2 = 's2a';
const idbel2 = '895784445393641542';
// bel no controle
const emojijogos1 = 'derrotah';
const idjogos1 = '650781017509986314';
const emojijogos2 = 's2pink';
const idjogos2 = '1023498446990233620'
// seta
const emojilive1 = 'belapinscher';
const idlive1 = '1042279893326635049';
const emojilive2 = 'kcarcinha';
const idlive2 = '771449788406300702'


const gifCortes = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGU0bXh3bjVkcHljMGVpemdpYWtoeG42djJlMGM4YzV4bTV4ZnNjbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Plh21syPqvSfZZIJNh/giphy.gif';

const youtubeChannels = [
  { id: 'UC3TYvpGVVD9DrqRQAMUqK1A', name: 'Cortes da Bel' },
  { id: 'UCb1prWGgxoiUDlHr6ymRQOw', name: 'Bel Rodrigues' },
  { id: 'UCQYICpjv48JHjylajtI45Bw', name: 'Bel no Controle' }
];

let youtubeRateLimitReset = 0;
let youtubeRateLimitRemaining = 1;
let youtubeCache = {};
let twitchRateLimitReset = 0;
let twitchRateLimitRemaining = 1;
let isLiveNotified = false;

function checkYouTubeVideosAndNotify() {
  if (Date.now() < youtubeRateLimitReset && youtubeRateLimitRemaining === 0) {
    console.log('Aguardando a taxa de solicitação do YouTube ser redefinida...');
    return;
  }

  const lastVideoIds = lerUltimosVideos();

  youtubeChannels.forEach((channel) => {
    const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&maxResults=1&order=date&type=video&key=${process.env.YOUTUBE_API_KEY}`;

    if (youtubeCache[youtubeApiUrl]) {
      const { data, timestamp } = youtubeCache[youtubeApiUrl];
      if (Date.now() - timestamp < 20 * 60 * 1000) {
        processYouTubeData(data, lastVideoIds, channel);
        return;
      }
    }

    axios
      .get(youtubeApiUrl)
      .then((response) => {
        youtubeRateLimitRemaining = response.headers['x-quota-remaining'];
        youtubeRateLimitReset = response.headers['x-quota-reset'] * 1000;

        return response.data;
      })
      .then((data) => {
        youtubeCache[youtubeApiUrl] = { data, timestamp: Date.now() };
        processYouTubeData(data, lastVideoIds, channel);
      })
      .catch((error) => {
        console.error(`Erro ao verificar vídeos do canal ${channel.name} do YouTube:`, error);
      });
  });
}
function checkTwitchStatusAndNotify() {
  if (Date.now() < twitchRateLimitReset && twitchRateLimitRemaining === 0) {
    console.log('Aguardando a taxa de solicitação da Twitch ser redefinida...');
    return;
  }

  axios
    .get(twitchApiUrl, {
      headers: {
        Authorization: `Bearer ${twitchToken}`,
        'Client-ID': twitchClientId,
      },
    })
    .then((response) => {
      twitchRateLimitRemaining = response.headers['ratelimit-remaining'];
      twitchRateLimitReset = response.headers['ratelimit-reset'] * 1000;

      return response.data;
    })
    .then((data) => {
      if (data.data && data.data.length > 0 && !isLiveNotified) {
        isLiveNotified = true;

        const streamData = data.data[0];
        const liveURL = `https://www.twitch.tv/${streamData.user_login}`;
        const tituloDaLive = streamData.title;
        const canalId = '1133880944911208449';
        const tituloFormatado = `[**${tituloDaLive}**](${liveURL})`;

        const embed = new Discord.EmbedBuilder()
          .setColor('#9146ff')
          .setAuthor({ name: 'belrodrigues', iconURL: 'https://static-cdn.jtvnw.net/jtv_user_pictures/17058dd4-dfbb-4120-ab20-23e365701be4-profile_image-70x70.png', url: liveURL })
          .setDescription(tituloFormatado)
          .setThumbnail('https://static-cdn.jtvnw.net/jtv_user_pictures/17058dd4-dfbb-4120-ab20-23e365701be4-profile_image-70x70.png')
          .setImage('https://cdn.discordapp.com/attachments/1134368525734121542/1135559166635815042/thumbnail.png');



        const channel = client.channels.cache.get(canalId);
        channel.send(`bela rodriga provavelmente está gritando no momento... <:${emojilive1}:${idlive1}>\n\na live tá on, vem! <:${emojilive2}:${idlive2}> <@&${cargo1Id}>`);
        channel.send({ embeds: [embed] });
      } else if (data.data && data.data.length === 0) {
        // Quando estiver offlive
        isLiveNotified = false;
        console.log('O canal da Twitch está offline.');
      }
    })
    .catch((error) => {
      console.error('Erro ao verificar o status da Twitch:', error);
    });
}

function processYouTubeData(data, lastVideoIds, channelInfo) {
  const { id, name } = channelInfo;

  if (data.items && data.items.length > 0) {
    const videoId = data.items[0].id.videoId;
    if (!lastVideoIds.includes(videoId)) {
      const videoTitle = data.items[0].snippet.title;

      // Verifica qual canal do YouTube é esse e personaliza a mensagem de acordo
      if (name === 'Bel Rodrigues') {
        enviarMensagemDiscord(`oi <@&${cargo1Id}>, tem vídeo novo no canal principal! <:${emojibel1}:${idbel1}> \n\nbora assistir! https://www.youtube.com/watch?v=${videoId} <:${emojibel2}:${idbel2}>`);
      } else if (name === 'Bel no Controle') {
        enviarMensagemDiscord(`ALÔ <@&${cargo1Id}>, bel no controle passou vergonha mais uma vez! <:${emojijogos1}:${idjogos1}> \n\nvem ver o vídeo novo https://www.youtube.com/watch?v=${videoId} <:${emojijogos2}:${idjogos2}>`);
      } else if (name === 'Cortes da Bel') {
        enviarMensagemDiscord(`ei, <@&${cargo2Id}>, o fã da bel trabalhou mais um pouco...<:${emojicortes1}:${idcortes1}>\n\n<:${emojicortes2}:${idcortes2}> https://www.youtube.com/watch?v=${videoId} <:${emojicortes3}:${idcortes3}>`);
      } else {
        enviarMensagemDiscord(`ei, <@&${cargo2Id}>, o fã da bel trabalhou mais um pouco...<:${emojicortes1}:${idcortes1}>\n\n<:${emojicortes2}:${idcortes2}> https://www.youtube.com/watch?v=${videoId} <:${emojicortes3}:${idcortes3}>`);

      }

      lastVideoIds.push(videoId);
      salvarUltimosVideos(lastVideoIds);
    }
  } else {
    console.log('Nenhum vídeo encontrado no canal do YouTube.');
  }
}

function enviarMensagemDiscord(mensagem) {
  const channel = client.channels.cache.find((ch) => ch.name === discordChannelName);

  if (channel) {
    channel.send(mensagem)
      .then(() => console.log('Mensagem enviada com sucesso!'))
      .catch((error) => console.error('Erro ao enviar mensagem:', error));
  } else {
    console.log('Canal não encontrado. Verifique o nome do canal do Discord.');
  }
}

client.on('ready', () => {
  console.log(`Bot está online como ${client.user.tag}`);
  setInterval(checkTwitchStatusAndNotify, 300000);
  setInterval(checkYouTubeVideosAndNotify, 1200000);
});

// Iniciar o bot do Discord
client.login(discordBotToken);