flag = false;
filename = "";
tabhref = "";
openedtabs = {};
downloadPlaylistTabScript = `
/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/** Pause the program for a certain amount of time **/
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function emulateHumanBehavior(target) {
     const durationMs = (target.srcElement.duration * 1000);
     const sleepTime = getRandomInt(durationMs / 4, (durationMs / 4) * 3);
     console.log('Duration time in Ms:', durationMs);
     console.log('sleep Time: ', sleepTime);
     console.time();
     await sleep(sleepTime);
     console.timeEnd();
}
async function uncollapseSection(section) {
    if (!section.classList.contains('open')) {
        section.firstChild.focus();
        section.firstChild.click();
    }
    await sleep(1500);
}
function downloadVideo (cb) {
    let link = $("#vjs_video_3_html5_api").attr("src");

    let coursename = $('#course-title-link').text();
    coursename = coursename.replace(/[\\/:?><\\W]/g, "");

    let selectedVideo = $('li.selected');
    let sectionHeader =  selectedVideo.parents('ul').eq(0).prev('header');
    let sectionIndex = sectionHeader.parents('section.module').eq(0).index();
    let sectionHeaderText = sectionHeader.find('h2').text();

    let folder = sectionIndex + "_" + sectionHeaderText;
    folder = folder.replace(/\\s/g, "_");
    folder = folder.replace(/[\\/:?><\\W]/g, "");

    let videoIndex = selectedVideo.prevAll().length;
    let videoName = selectedVideo.find('h3').text();

    let filename = videoIndex + "_" + videoName;
    filename = filename.replace(/\\s/g, "_");
    filename = filename.replace(/[\\/:?><\\W]/g, "");
    console.log('get video from', link);
    chrome.runtime.sendMessage({
        greeting: "download",
        link: link,
        filename: "Pluralsight/" + coursename + "/" + folder + "/" + filename + '.mp4'
    }, function (response) {
        console.log(response.farewell);
        cb(response);
    });
}
function getFirstSectionVideo(section) {
    return $(section).find('li')[0];
}
async function downloadPlaylist () {
    await sleep(1500);
    let videoPlayer = jQuery.find('video')[0];
    let section = jQuery.find('section.module')[0];
    await uncollapseSection(section);
    let sectionVideo = getFirstSectionVideo(section);
    // Trigger download when video player is ready
    videoPlayer.addEventListener('loadeddata', async function downloadVideoPlayerContent(target) {
      console.log('Emulate human behavior');
      await emulateHumanBehavior(target);
      console.log('Player is ready with new dataloaded, download video');
      const videoError = $('#loading-reload');
      if (videoError.length > 0) {
          console.log('Error occured while loading video, try to reload it');
          sectionVideo.focus();
          sectionVideo.click();
      } else {
      console.log('Launch video download');
      downloadVideo(async () => {
          await sleep(1000);
          if (sectionVideo.nextSibling) {
              console.log('Next video');
              sectionVideo = sectionVideo.nextSibling;
              sectionVideo.focus();
              sectionVideo.click();
          }
          else if (section.nextSibling) {
              console.log('Next section');
              section = section.nextSibling;
              await uncollapseSection(section);
              sectionVideo = getFirstSectionVideo(section);
              sectionVideo.focus();
              sectionVideo.click();
          }
          else {
              chrome.runtime.sendMessage({
                greeting: "playlistDownloaded",
               });
              window.close();
          }
      });
      }
    });
    sectionVideo.focus();
    sectionVideo.click();
}
console.log('Run the script in the new tab');
async function run() {
    await sleep(4000);
    document.body.scrollTo(0, document.body.scrollHeight);
    await sleep(4000);
    document.body.scrollTo(0, 0);
    downloadPlaylist();
}
run();
`;

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        let coursename = "";
        console.log('onMessage received', request, sender);
        if (request.greeting === "download") {
            filename = request.filename;
            flag = true;
            try {
                chrome.downloads.download({
                    url: request.link,
                });
                sendResponse({
                    farewell: 'File: ' + filename + ' downloaded'
                });
            } catch (err) {
                alert("Error: " + err.message);
            }
        }
        if (request.greeting === "downloadPlaylist") {
            console.log('downloadPlaylist', request);
            chrome.tabs.create({ url: request.url }, (tab) => {
                console.log('new tab created', tab);
                coursename = new URL(tab.url).searchParams.get('course');
                openedtabs[coursename] = { url: coursename, executed: false, finished: false, callback: sendResponse };
                console.log('openedtabs', openedtabs);
            });
        }
        if (request.greeting === "playlistDownloaded") {
            console.log('background');
            console.log('openedtabs', openedtabs);
            coursename = new URL(sender.tab.url).searchParams.get('course');
            openedtabs[coursename].finished = true;
        }
    });

chrome.extension.onConnect.addListener(function (port) {
   console.log('Connected...');
   port.onMessage.addListener(function(msg) {
       console.log('port receive msg', msg);
       if (msg.request === 'getPlaylistDownloadStatus') {
           const tabstatus = openedtabs[msg.coursename];
           if (tabstatus) {
               port.postMessage({ type: 'tabstatus', status: tabstatus });
           }
      }
   });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const coursename = new URL(tab.url).searchParams.get('course');
    if (openedtabs[coursename] && openedtabs[coursename].executed === false && changeInfo.status === 'complete') {
        console.log('new tab complete loaded');
        chrome.tabs.executeScript(tabId, { code: downloadPlaylistTabScript, runAt: 'document_end'}, null);
        openedtabs[coursename].executed = true;
    }
});

chrome.downloads.onDeterminingFilename.addListener(function (item, suggest) {
    if (flag) {
        flag = false;
        suggest({
            filename: filename
        });
    }
});
