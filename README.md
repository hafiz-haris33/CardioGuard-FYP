# CardioGuard 🫀
**Precision Cardiac Intelligence & IoT-Based Health Monitoring System**

CardioGuard is an affordable, IoT-based wearable health monitoring system designed for heart patients, elderly individuals, and health-conscious users. It continuously tracks vital physiological signs, predicts heart-attack risks using Machine Learning, and automatically alerts emergency contacts during critical situations.

## 🚀 Key Features

* **Continuous Vitals Monitoring:** Real-time tracking of ECG, Heart Rate (HR), SpO2, and physical activity.
* **AI Risk Prediction:** Machine learning model that calculates a heart-attack risk score based on live and historical vitals.
* **Automated Emergency SOS:** Instantly dispatches SMS alerts with the user's live GPS location to a registered emergency contact when a critical threshold is crossed.
* **Live Mobile Dashboard:** A user-friendly React Native Android app for real-time visualization of health data.
* **Cloud Synchronization:** Secure storage of user profiles, device registry, and historical health logs.

## 🏗️ System Architecture

CardioGuard is built on a Layered Architecture to ensure independent operation and smooth integration:
1. **Sensing Layer (Hardware):** An ESP32 microcontroller paired with AD8232 (ECG), MAX30102 (PPG), and MPU6050 (IMU) sensors to collect raw physiological data.
2. **Application Layer (Mobile App):** A React Native app that connects via Bluetooth Low Energy (BLE) to render data, check for anomalies, and manage the user interface.
3. **Data & Intelligence Layer (Cloud/AI):** Firebase handles the database and authentication, while a RESTful API serves the Machine Learning risk prediction model.

## 🛠️ Tech Stack & Tools

* **Hardware & IoT:** ESP32 Mini D1, C/C++ (Firmware), Bluetooth Low Energy (BLE)
* **Sensors:** AD8232 (ECG), MAX30102 (SpO2/HR), MPU6050 (Motion/IMU)
* **Mobile Application:** React Native (Android 8.0+)
* **Backend & Cloud:** Firebase Realtime Database, Firebase Authentication
* **AI & Machine Learning:** Python, RESTful API integration

## ⚙️ Prerequisites & Setup

To run this project locally or set up the hardware, you will need:
* **Hardware:** Arduino IDE configured for ESP32 boards.
* **App Development:** Node.js, npm/yarn, and Android Studio for React Native environment.
* **Backend/AI:** Python environment for the ML API and a Firebase project setup.

*(Note: Detailed installation steps and codebase instructions are provided in their respective directories within this repository.)*

## 👥 Project Team

This system was developed as a Final Year Project at the **Institute of Information Technology, Quaid-i-Azam University, Islamabad**.

* **HARIS ATTIQUE** 
* **Syed Aon Ali**

## 📝 Documentation
For deeper technical details, please refer to the Software Requirements Specification (SRS), Software Design Document (SDD), and the Final Thesis Report included in the docs folder.