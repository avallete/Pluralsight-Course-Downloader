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
    coursename = coursename.replace(/[\/:?><\W]/g, "");

    let selectedVideo = $('li.selected');
    let sectionHeader =  selectedVideo.parents('ul').eq(0).prev('header');
    let sectionIndex = sectionHeader.parents('section.module').eq(0).index();
    let sectionHeaderText = sectionHeader.find('h2').text();

    let folder = `${sectionIndex}_${sectionHeaderText}`;
    folder = folder.replace(/\s/g, "_");
    folder = folder.replace(/[\/:?><\W]/g, "");

    let videoIndex = selectedVideo.prevAll().length;
    let videoName = selectedVideo.find('h3').text();

    let filename = `${videoIndex}_${videoName}`;
    filename = filename.replace(/\s/g, "_");
    filename = filename.replace(/[\/:?><\W]/g, "");
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
    let videoPlayer = jQuery.find('video')[0];
    let section = jQuery.find('section.module')[0];
    uncollapseSection(section);
    let sectionVideo = getFirstSectionVideo(section);
    // Trigger download when video player is ready
    videoPlayer.addEventListener('loadeddata', async function downloadVideoPlayerContent(target) {
        console.log('Emulate human behavior');
        await emulateHumanBehavior(target);
        console.log('Player is ready with new dataloaded, download video');
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
                window.alert('No more videos to load');
            }
        });
    });
    sectionVideo.focus();
    sectionVideo.click();
}

$(document).on('ready', downloadPlaylist());
