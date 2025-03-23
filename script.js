const socket = io();
let peerConnection;

const createPeerConnection = () => {
    peerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    });

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', event.candidate, currentRoom);
        }
    };
};

let currentRoom;

document.getElementById('shareScreen').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                width: 1920,
                height: 1080,
                frameRate: 60
            }
        });
        const video = document.getElementById('screenVideo');
        video.srcObject = stream;
        video.classList.remove('hidden');
        videoContainer.classList.remove('hidden'); 
        
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        currentRoom = code;
        document.getElementById('shareCode').textContent = code;
        document.getElementById('codeDisplay').classList.remove('hidden');

        socket.emit('create-room', code);
        createPeerConnection();
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        socket.on('viewer-joined', async () => {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit('offer', offer, currentRoom);
        });

        socket.on('answer', async (answer) => {
            await peerConnection.setRemoteDescription(answer);
        });

        socket.on('ice-candidate', async (candidate) => {
            await peerConnection.addIceCandidate(candidate);
        });
        
    } catch (err) {
        console.error("Error: " + err);
    }
});

document.getElementById('watchScreen').addEventListener('click', () => {
    document.getElementById('codeInput').classList.remove('hidden');
    videoContainer.classList.add('hidden');
    screenVideo.classList.add('hidden');
});

document.getElementById('connectButton').addEventListener('click', async () => {
    const code = document.getElementById('watchCode').value;
    if (!code) {
        alert('Add meg a megosztókódot');
        return;
    }
    
    currentRoom = code;
    socket.emit('join-room', code);
    createPeerConnection();
    videoContainer.classList.remove('hidden'); 

    peerConnection.ontrack = (event) => {
        const video = document.getElementById('screenVideo');
        video.srcObject = event.streams[0];
        video.classList.remove('hidden');
        fullscreenButton.classList.remove('hidden');
    };

    socket.on('offer', async (offer) => {
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', answer, currentRoom);
    });

    socket.on('ice-candidate', async (candidate) => {
        await peerConnection.addIceCandidate(candidate);
    });
});

socket.on('connect_error', (error) => {
    console.error('Csatlakozás hiba:', error);
    alert('Sikertelen kapcsolódás a szerverre, vedd fel a kapcsolatot a fejlesztővel.');
});

const fullscreenButton = document.getElementById('fullscreenButton');
const videoContainer = document.getElementById('videoContainer');
const screenVideo = document.getElementById('screenVideo');

fullscreenButton.addEventListener('click', () => {
    if (screenVideo.requestFullscreen) {
        screenVideo.requestFullscreen();
    } else if (screenVideo.webkitRequestFullscreen) {
        screenVideo.webkitRequestFullscreen();
    } else if (screenVideo.msRequestFullscreen) {
        screenVideo.msRequestFullscreen();
    }
});