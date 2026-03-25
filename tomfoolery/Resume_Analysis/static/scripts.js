let recording = false;

const questions = [
    "Tell me about yourself.",
    "Why this company?",
    "Why do you think you will be a good fit?",
    "What are your biggest strengths and weaknesses?",
];

document.getElementById('getQuestionButton').addEventListener('click', function() {
    const question = questions[Math.floor(Math.random() * questions.length)];
    document.getElementById('question').innerText = question;
    document.getElementById('answer').value = ''; // Clear previous answer
});

document.getElementById('startRecordButton').addEventListener('click', function() {
    $.ajax({
        type: 'POST',
        url: '/start_recording',
        success: function(response) {
            console.log(response.message);
            recording = true;
            document.getElementById('startRecordButton').style.display = 'none';
            document.getElementById('stopRecordButton').style.display = 'inline';
        }
    });
});

document.getElementById('stopRecordButton').addEventListener('click', function() {
    $.ajax({
        type: 'POST',
        url: '/save_audio',
        success: function(response) {
            console.log(response.message);
            recording = false;
            document.getElementById('stopRecordButton').style.display = 'none';
            document.getElementById('startRecordButton').style.display = 'inline';
        },
        error: function(xhr) {
            console.error(xhr.responseJSON.message);
        }
    });
});

document.getElementById('playbackButton').addEventListener('click', function() {
    const audio = new Audio('/playback');
    audio.play();
});

document.getElementById('submitButton').addEventListener('click', function() {
    const answer = document.getElementById('answer').value.trim();
    if (answer.length === 0) {
        alert("Please provide an answer before submitting.");
        return;
    }
    document.getElementById('feedback').innerText = 'Your answer has been submitted.';
});

// SocketIO setup for real-time transcription updates
const socket = io();
socket.on('transcription', function(data) {
    const answerBox = document.getElementById('answer');
    answerBox.value += data.text + ' ';  // Append transcribed text to answer box
});

