import cv2
import cvlib as cv
from cvlib.object_detection import draw_bbox
import paho.mqtt.client as mqtt
import json
import time
import ssl
import numpy as np
import gradio as gr
from dotenv import load_dotenv
import os

# ---------- Load Environment Variables ----------
load_dotenv()

MQTT_BROKER = os.getenv("MQTT_BROKER")
MQTT_PORT = int(os.getenv("MQTT_PORT"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")
TOPIC_AI = os.getenv("TOPIC_AI")
TOPIC_SENSORS = os.getenv("TOPIC_SENSORS")

# ---------- MQTT Setup ----------
client = mqtt.Client(client_id="PythonAI-HF", protocol=mqtt.MQTTv311)
client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
client.tls_set(cert_reqs=ssl.CERT_NONE)
client.tls_insecure_set(True)

try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    print("[INFO] Connected to HiveMQ Cloud broker successfully")
except Exception as e:
    print("[ERROR] MQTT connection failed:", e)
    exit()

# ---------- YOLO Processing ----------
def detect_and_publish(frame):
    # Convert from PIL Image (Gradio) to OpenCV format
    frame = cv2.cvtColor(np.array(frame), cv2.COLOR_RGB2BGR)

    # Run YOLO (tiny model)
    bbox, labels, conf = cv.detect_common_objects(frame, confidence=0.5, model='yolov4-tiny')
    humans = labels.count('person')
    occupancy = humans > 0

    # AI payload
    ai_payload = {
        "occupancy": occupancy,
        "humans_detected": humans,
        "fan_opt": occupancy,
        "light_opt": occupancy,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    client.publish(TOPIC_AI, json.dumps(ai_payload))

    # Sensor payload (simulated)
    sensor_payload = {
        "motion": 1 if occupancy else 0,
        "temperature": round(np.random.uniform(24, 32), 1),
        "light": np.random.randint(1000, 3000),
        "fanState": occupancy,
        "lightState": occupancy,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    client.publish(TOPIC_SENSORS, json.dumps(sensor_payload))

    # Draw bounding boxes
    out_frame = draw_bbox(frame, bbox, labels, conf)
    return cv2.cvtColor(out_frame, cv2.COLOR_BGR2RGB)

# ---------- Gradio Interface ----------
demo = gr.Interface(
    fn=detect_and_publish,
    inputs=gr.Image(source="webcam", streaming=True),
    outputs=gr.Image(),
    title="Smart Classroom Occupancy Detection (YOLO + MQTT)",
    description="Detects human presence via webcam using YOLO and publishes to HiveMQ Cloud."
)

demo.launch()
