from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import speech_recognition as sr
from pydub import AudioSegment
import io
import tempfile
import os

app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Для разработки можно разрешить все, потом заменить на конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        # Проверка типа файла
        if not file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="Неверный формат файла. Ожидается аудио.")
        
        # Чтение файла
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Пустой файл")
        
        # Создание временного файла для обработки
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        
        try:
            # Конвертация аудио
            audio = AudioSegment.from_file(tmp_path)
            audio = audio.set_frame_rate(16000).set_channels(1)
            
            # Экспорт в WAV
            wav_io = io.BytesIO()
            audio.export(wav_io, format="wav")
            wav_io.seek(0)
            
            # Распознавание речи
            r = sr.Recognizer()
            with sr.AudioFile(wav_io) as source:
                audio_data = r.record(source)
                text = r.recognize_google(audio_data, language='ru-RU')
            
            return {"text": text}
        
        finally:
            # Удаление временного файла
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except sr.UnknownValueError:
        raise HTTPException(status_code=400, detail="Не удалось распознать речь")
    except sr.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сервиса распознавания: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки аудио: {str(e)}")
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)