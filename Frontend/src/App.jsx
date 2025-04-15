import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [text, setText] = useState("");
  const [editableText, setEditableText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError("");
      setText("");
      setEditableText("");
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await sendAudioToServer(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (err) {
      console.error("Recording error:", err);
      setError("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const response = await fetch("http://localhost:8000/api/transcribe/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Server error");
      }

      const data = await response.json();
      setText(data.text);
      setEditableText(data.text);
      
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message);
    }
  };

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleEditSave = () => {
    setText(editableText);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditableText(text);
    setIsEditing(false);
  };

  const handleTextChange = (e) => {
    setEditableText(e.target.value);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app-container">
      <div className="centered-content">
        <h1>Voice Transcription</h1>
        
        <div className="control-panel">
          {!isRecording ? (
            <button 
              className="primary-button"
              onClick={startRecording}
            >
              Start Recording
            </button>
          ) : (
            <div className="recording-controls">
              <button 
                className="stop-button"
                onClick={stopRecording}
              >
                Stop Recording
              </button>
            </div>
          )}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="transcription-panel">
          <h2>Transcription Result</h2>
          
          {isEditing ? (
            <div className="edit-container">
              <textarea
                className="text-edit"
                value={editableText}
                onChange={handleTextChange}
                autoFocus
              />
              <div className="edit-actions">
                <button 
                  className="save-button"
                  onClick={handleEditSave}
                >
                  Save
                </button>
                <button 
                  className="cancel-button"
                  onClick={handleEditCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="result-container">
              {text ? (
                <>
                  <div className="transcription-text">{text}</div>
                  <button 
                    className="edit-button"
                    onClick={handleEditStart}
                  >
                    Edit Text
                  </button>
                </>
              ) : (
                <div className="empty-state">
                  {isRecording ? "Speak now..." : "Transcription will appear here"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;