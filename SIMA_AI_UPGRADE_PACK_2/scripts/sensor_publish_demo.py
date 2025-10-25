import ssl, json, time, os, sys
import paho.mqtt.client as mqtt

HOST=os.getenv("MQTT_HOST","localhost")
PORT=int(os.getenv("MQTT_PORT","8883"))
USER=os.getenv("MQTT_USER","sima_device")
PASS=os.getenv("MQTT_PASS","changeme")
CA=os.getenv("MQTT_CA","mosquitto/certs/ca.crt")

pid = sys.argv[1] if len(sys.argv)>1 else "demo-project"
cli = mqtt.Client(client_id="sensor-demo", protocol=mqtt.MQTTv5)
cli.tls_set(ca_certs=CA)
cli.username_pw_set(USER, PASS)
cli.connect(HOST, PORT, 60)
for i in range(10):
    payload = {"project_id": pid, "type":"temperature", "val": 24.5 + i*0.1}
    cli.publish(f"sensors/{pid}/temperature", json.dumps(payload), qos=1, retain=False)
    time.sleep(0.5)
print("sent 10 messages")
