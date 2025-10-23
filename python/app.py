import cv2
import cvlib as cv
from cvlib.object_detection import draw_bbox
import paho.mqtt.client as mqtt
import json
import time
import ssl
import numpy as np
from dotenv import load_dotenv
import os
import threading

# ---------- Load Environment Variables ----------
load_dotenv()

MQTT_BROKER = os.getenv("MQTT_BROKER")
MQTT_PORT = int(os.getenv("MQTT_PORT"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")
TOPIC_AI = os.getenv("TOPIC_AI", "smartclassroom/ai")
TOPIC_SENSORS = os.getenv("TOPIC_SENSORS", "smartclassroom/sensors")

# Your phone camera IP stream (e.g. http://192.168.x.x:8080/video)
IP_CAMERA_URL = os.getenv("IP_CAMERA_URL")

# ---------- MQTT Setup ----------
client = mqtt.Client(client_id="PythonAI-Render", protocol=mqtt.MQTTv311)
client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
client.tls_set(cert_reqs=ssl.CERT_NONE)
client.tls_insecure_set(True)

try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    print(f"[INFO] Connected to MQTT broker: {MQTT_BROKER}:{MQTT_PORT}")
except Exception as e:
    print(f"[ERROR] MQTT connection failed: {e}")
    exit()


# ---------- YOLO Detection ----------
def detect_and_publish(frame):
    """Perform YOLO detection and publish MQTT data."""
    bbox, labels, conf = cv.detect_common_objects(frame, confidence=0.5, model='yolov4-tiny')
    humans = labels.count('person')
    occupancy = humans > 0

    print(f"[INFO] {time.strftime('%H:%M:%S')} - Humans: {humans} | Occupancy: {occupancy}")

    ai_payload = {
        "occupancy": occupancy,
        "humans_detected": humans,
        "fan_opt": occupancy,
        "light_opt": occupancy,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    client.publish(TOPIC_AI, json.dumps(ai_payload), qos=0)

    sensor_payload = {
        "motion": int(occupancy),
        "temperature": round(np.random.uniform(24, 32), 1),
        "light": np.random.randint(1000, 3000),
        "fanState": occupancy,
        "lightState": occupancy,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    client.publish(TOPIC_SENSORS, json.dumps(sensor_payload), qos=0)

    print(f"[MQTT] Published AI & Sensor data at {time.strftime('%H:%M:%S')}")


# ---------- Real-Time Stream ----------
def process_stream():
    print(f"[INFO] Starting stream from: {IP_CAMERA_URL}")
    video = cv2.VideoCapture(IP_CAMERA_URL, cv2.CAP_FFMPEG)

    # Reduce buffering & latency
    video.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    if not video.isOpened():
        print("[ERROR] Cannot open video stream. Check your IP or app.")
        return

    last_time = 0
    while True:
        ret, frame = video.read()
        if not ret:
            print("[WARN] Failed to capture frame. Retrying...")
            time.sleep(1)
            continue

        # Fix mirroring issue
        frame = cv2.flip(frame, 1)
        
        # Process every ~0.5 second (2 FPS effective)
        now = time.time()
        if now - last_time >= 0.5:
            threading.Thread(target=detect_and_publish, args=(frame,), daemon=True).start()
            last_time = now


# ---------- Start ----------
if __name__ == "__main__":
    print("[INFO] Starting Smart Classroom AI (Low-Latency Mode)...")

    stream_thread = threading.Thread(target=process_stream, daemon=True)
    stream_thread.start()

    # Keep alive
    while True:
        time.sleep(1)
