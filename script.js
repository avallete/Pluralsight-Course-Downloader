function PluralSightDownloader() {
    function sleep(milliseconds) {
      let start = new Date().getTime();
      for (let i = 0; i < 1e7; i++) {
          if ((new Date().getTime() - start) > milliseconds){
              break;
          }
      }
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
    function uncollapseSection(section) {
        if (!section.classList.contains('open')) {
            section.firstChild.focus();
            section.firstChild.click();
        }
        sleep(500);
    }
    function getFirstSectionVideo(section) {
        return $(section).find('li')[0];
    }
    function downloadPlaylist () {
        let videoPlayer = jQuery.find('video')[0];
        let section = jQuery.find('section.module')[0];
        uncollapseSection(section);
        let sectionVideo = getFirstSectionVideo(section);
        // Trigger download when video player is ready
        videoPlayer.addEventListener('loadeddata', function downloadVideoPlayerContent() {
          sleep(5000);
          console.log('Player is ready with new dataloaded, download video');
          console.log('Launch video download');
          downloadVideo(() => {
              if (sectionVideo.nextSibling) {
                  console.log('Next video');
                  sectionVideo = sectionVideo.nextSibling;
                  sectionVideo.focus();
                  sectionVideo.click();
              }
              else if (section.nextSibling) {
                  console.log('Next section');
                  section = section.nextSibling;
                  uncollapseSection(section);
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
    function handleKeyPress(e) {
      console.log('handlePresskey');
      if (e.key === "a") {
          console.log('Download playlist');
          downloadPlaylist();
      }
      if (e.key === "s") {
          console.log('Download video');
          downloadVideo(() => console.log('Video downloaded successfully'));
      }
    }
    $(document).keydown(handleKeyPress);
}

$(document).on('ready', PluralSightDownloader());
