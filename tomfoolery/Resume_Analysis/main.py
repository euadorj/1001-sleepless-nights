from flask import Flask, render_template, jsonify, send_from_directory
import wave
import threading
import sounddevice as sd
import numpy as np
import os
import speech_recognition as sr
from flask_socketio import SocketIO

app = Flask(__name__)
socketio = SocketIO(app)

# Global variables
audio_frames = None
sample_rate = 44100
duration = 60  # Duration of recording in seconds

@app.route('/')
def index():
    return render_template('main.html')

@app.route('/start_recording', methods=['POST'])
def start_recording():
    global audio_frames
    audio_frames = []  # Initialize the audio_frames 
    
    def record():
        global audio_frames
        audio_frames = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='int16')
        sd.wait()  # Wait until the recording is finished
    
    recording_thread = threading.Thread(target=record)
    recording_thread.start()
    return jsonify({'message': 'Recording started.'})

def recognize_audio():
    global audio_frames
    recognizer = sr.Recognizer()

    # Get the recorded audio and recognize it
    if audio_frames is not None:
        audio_data = np.array(audio_frames)
        audio_data = sr.AudioData(audio_data.tobytes(), sample_rate, 2)  # Convert to AudioData format

        try:
            text = recognizer.recognize_google(audio_data)  # Using Google Web Speech API
            socketio.emit('transcription', {'text': text})  # Emit the transcription to the front end
        except sr.UnknownValueError:
            print("Could not understand the audio")
        except sr.RequestError as e:
            print(f"Could not request results from Google Speech Recognition service; {e}")

@app.route('/save_audio', methods=['POST'])
def save_audio():
    global audio_frames

    if audio_frames is None:
        return jsonify({'message': 'No audio recorded.'}), 400

    audio_path = 'recorded_audio.wav'
    
    # Save the recording as a WAV file
    with wave.open(audio_path, 'wb') as wf:
        wf.setnchannels(1)  # Mono
        wf.setsampwidth(2)  # 16-bit PCM
        wf.setframerate(sample_rate)
        wf.writeframes(audio_frames.tobytes())
        
    # Start transcription in a separate thread
    threading.Thread(target=recognize_audio).start()

    return jsonify({'message': 'Audio saved successfully.'})

@app.route('/playback', methods=['GET'])
def playback():
    return send_from_directory('.', 'recorded_audio.wav')

if __name__ == '__main__':
    socketio.run(app, debug=True)
