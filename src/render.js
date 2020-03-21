const videoElement = document.querySelector('video');
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');
const videoSelectButton = document.getElementById('videoSelectButton');
const { desktopCapturer, remote } = require('electron');
const { Menu, dialog } = remote;
const { writeFile } = require('fs');


videoSelectButton.onclick = getVideoSources;
startButton.onclick = e => {
    mediaRecorder.start();
    startButton.classList.add('is-danger');
    startButton.innerText = 'Recording';
};

stopButton.onclick = e => {
    mediaRecorder.stop();
    startButton.classList.remove('is-danger');
    startButton.innerText = 'Start';
};
// Get the available video sources
async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );

    videoOptionsMenu.popup();
}

let mediaRecorder; // Media recorder instance to capture videos
const recordedChunks = [];
// Change the videosource window to record
async function selectSource(source) {
    videoSelectButton.innerText = source.name;
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    //Create a stream
    const stream = await navigator.mediaDevices
        .getUserMedia(constraints);

    videoElement.srcObject = stream;
    videoElement.play();

    //Create media recorder
    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    //Register event handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handlestop;

}

function handleDataAvailable(e) {
    console.log('video data available');
    recordedChunks.push(e.data);
}

async function handlestop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save Video',
        defaultPath: `video-${Date.now()}.webm`
    });

    writeFile(filePath, buffer, () => console.log(`Video Saved Successfully`));
}