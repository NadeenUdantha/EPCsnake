#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoMqttClient.h>

WiFiClient wifiClient;
MqttClient mqttClient(wifiClient);

const int trigPinA = 5;
const int echoPinA = 26;
const int trigPinB = 23;
const int echoPinB = 18;

const int ledAL = 19;
const int ledAM = 21;
const int ledAR = 22;

const int ledBL = 33;
const int ledBM = 25;
const int ledBR = 27;

const int buzzerPin = 14;

#define SOUND_SPEED 0.034
#define CM_TO_INCH 0.393701

// Replace with your network credentials
const char *ssid = "AO3";
const char *password = "12345678";

// Create AsyncWebServer object on port 80
AsyncWebServer server(80);

// Create a WebSocket object
AsyncWebSocket ws("/ws");

// Timer variables
unsigned long lastTime = 0;
unsigned long timerDelay = 0;

//unsigned long buzzer = 0;

float getSensorReading(int trigPin, int echoPin) {
  // Clears the trigPin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  // Sets the trigPin on HIGH state for 10 micro seconds
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Reads the echoPin, returns the sound wave travel time in microseconds
  long duration = pulseIn(echoPin, HIGH);

  // Calculate the distance
  float distanceCm = duration * SOUND_SPEED / 2;

  return distanceCm;
}

void updateLEDs(float x, int L, int M, int R) {
  int Lv = x > 5 && x < 10;
  int Rv = x > 20 && x < 28;
  digitalWrite(L, Lv);
  digitalWrite(M, !(Lv || Rv));
  digitalWrite(R, Rv);
}

// Get Sensor Readings and return JSON object
String getSensorReadings() {
  float a = getSensorReading(trigPinA, echoPinA);
  float b = getSensorReading(trigPinB, echoPinB);
  updateLEDs(a, ledAL, ledAM, ledAR);
  updateLEDs(b, ledBL, ledBM, ledBR);
  return String(a) + "," + String(b);
}

// Initialize WiFi
void initWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi ..");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(1000);
  }
  Serial.println(WiFi.localIP());
}

void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo *)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    String message = (char *)data;
    Serial.println(message);
    //buzzer = millis() + 2000;
    digitalWrite(buzzerPin, 1);

    mqttClient.beginMessage("snake/highscore", true);
    mqttClient.print(message);
    mqttClient.endMessage();
  }
}

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
  switch (type) {
    case WS_EVT_CONNECT:
      Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
      break;
    case WS_EVT_DISCONNECT:
      Serial.printf("WebSocket client #%u disconnected\n", client->id());
      break;
    case WS_EVT_DATA:
      handleWebSocketMessage(arg, data, len);
      break;
    case WS_EVT_PONG:
    case WS_EVT_ERROR:
      break;
  }
}

void initWebSocket() {
  ws.onEvent(onEvent);
  server.addHandler(&ws);
}

void setup() {
  Serial.begin(115200);
  initWiFi();
  initWebSocket();

  pinMode(trigPinA, OUTPUT);  // Sets the trigPin as an Output
  pinMode(echoPinA, INPUT);   // Sets the echoPin as an Input
  pinMode(trigPinB, OUTPUT);  // Sets the trigPin as an Output
  pinMode(echoPinB, INPUT);   // Sets the echoPin as an Input

  mqttClient.setUsernamePassword("epcGroup8", "EPCsnake@123");
  if (!mqttClient.connect("0389f361cc4b4d3fb47160ad8f1b5353.s1.eu.hivemq.cloud", 1883)) {
    Serial.print("MQTT connection failed! Error code = ");
    Serial.println(mqttClient.connectError());
  }

  pinMode(ledAL, OUTPUT);
  pinMode(ledAM, OUTPUT);
  pinMode(ledAR, OUTPUT);
  pinMode(ledBL, OUTPUT);
  pinMode(ledBM, OUTPUT);
  pinMode(ledBR, OUTPUT);

  // Start server
  server.begin();
}

void loop() {
  mqttClient.poll();
  if ((millis() - lastTime) > timerDelay) {
    String sensorReadings = getSensorReadings();
    Serial.println(sensorReadings);
    ws.textAll(sensorReadings);
    lastTime = millis();
  }
  //if (buzzer < millis())digitalWrite(buzzerPin, 0);
  ws.cleanupClients();
}