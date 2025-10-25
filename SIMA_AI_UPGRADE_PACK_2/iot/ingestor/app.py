import os, json, uuid
import psycopg
import paho.mqtt.client as mqtt

DB=os.getenv("DB_DSN","postgresql://postgres:postgres@db:5432/sima")
BROKER=os.getenv("MQTT_BROKER","mosquitto")
PORT=int(os.getenv("MQTT_PORT","8883"))
USER=os.getenv("MQTT_USER","sima_ingestor")
PASS=os.getenv("MQTT_PASS","changeme")
CA=os.getenv("MQTT_CA","/mosquitto/certs/ca.crt")
TOPIC=os.getenv("MQTT_TOPIC","sensors/#")

def db():
    return psycopg.connect(DB, autocommit=True)

def on_connect(client, userdata, flags, rc, properties=None):
    print("Connected:", rc)
    client.subscribe(TOPIC, qos=1)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        project_id = payload.get("project_id")
        sensor_type = payload.get("type")
        val = float(payload.get("val"))
        with db() as c:
            with c.cursor() as cur:
                cur.execute("INSERT INTO sensor_data(id,project_id,sensor_type,val) VALUES(%s,%s,%s,%s)", (str(uuid.uuid4()), project_id, sensor_type, val))
    except Exception as e:
        print("ingest-error", e)

client = mqtt.Client(client_id="sima-ingestor", protocol=mqtt.MQTTv5)
client.tls_set(ca_certs=CA)
client.username_pw_set(USER, PASS)
client.on_connect = on_connect
client.on_message = on_message
client.connect(BROKER, PORT, keepalive=60)
client.loop_forever()
