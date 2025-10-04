# ISS Sensory Lab: Cupola, NBL & EVA Game

This project is an interactive web-based simulator designed to immerse users in three critical environments of astronaut life: **Earth observation from the International Space Station (ISS) Cupola**, **spacewalk training in the Neutral Buoyancy Laboratory (NBL)**, and a simulated mission with the **Space EVA Game**.

It was initially developed as part of the **2025 NASA Space Apps Challenge**.

---

## 🚀 Key Features

### 1. Neutral Buoyancy Laboratory (NBL) Simulation
Simulates the core engineering challenge of an **EVA (Extravehicular Activity) training session**. The astronaut must achieve **Neutral Buoyancy (net force of 0)** by perfectly balancing all downward forces (Weight + Ballast) with the upward force (Lift).

- **Accurate Physics Model:** Incorporates the user's **Baseline Mass (Weight)**, showing how manual adjustments to **Ballast** and **Lift** affect overall balance.
- **Dynamic Movement:** Astronaut figure automatically sinks or rises in real-time, with speed proportional to the **weight imbalance (Total Net Buoyancy)**.
- **Neutral State Animation:** When balance is achieved (within 0.5kg of net zero), continuous rise/fall stops, and a subtle floating/bobbing animation simulates weightlessness.
- **Training Intro:** Functional slideshow provides a guided introduction to the NBL, its purpose, and real-world NASA use.

### 2. Space EVA Game
An interactive game simulating a **spacewalk to the ISS**.

- **Objective:** Maneuver an astronaut through a field of orbital debris to dock with the ISS, within a 20-second oxygen limit.
- **Dynamic Obstacles:** Obstacles move at high, varying speeds, challenging player reflexes and control.
- **Immersive Interface:** Oxygen meter and low-oxygen countdown warnings are displayed directly within the glowing game frame.
- **Visual Feedback:** Real-time display for **LIFT THRUSTERS ACTIVATED** and **BALLAST THRUSTERS ACTIVATED** gives immediate control feedback.

### 3. Cupola Observation Module
- **Earth Monitoring:** View live feeds or select high-definition mock-up images of Earth locations (e.g., rainforests, glaciers).  
- **Astronaut Customization:** Set **Observer Identifier**, **Baseline Mass**, and customize the astronaut model (suit color, skin tone).  
- **Scientific Telemetry:** Brief explanations of the scientific benefits of observing each region from orbit.

---

## 🛠️ Technology Stack
- **HTML5 / CSS3:** Core structure and styling.  
- **Tailwind CSS:** Aesthetic styling and responsive layout.  
- **JavaScript (ES6+):** Simulation logic, UI interactivity, dynamic rendering, physics calculations, and animation loop.  
- **Canvas Confetti:** Visual confirmation upon successful EVA completion.

---

## 💻 Setup and Usage
The project is a single, self-contained HTML file, making setup simple.

### Clone the Repository
```bash
git clone [repository-url]
```

### Run the Application

Navigate to the project folder and simply open the **`SPACELAB.html`** file in your web browser. No local server or build tools are required.

### NBL Simulation Controls

To achieve **Neutral Buoyancy (0 KG NET)**, you must balance the equation:

$$
\text{Lift} = \text{Weight} + \text{Ballast}
$$

| Control | Range | Effect |
| :----- | :----- | :----- |
| **Baseline Mass (Weight)** | 40 kg - 150 kg | Initial, fixed downward force from the user. |
| **Ballast (Addition)** | 0 kg - 100 kg | Variable downward force to adjust sinking. |
| **Lift (Comp.)** | 0 kg - 100 kg | Variable upward force to adjust floating. |

---

## 🧑‍🚀 Creator

* **Jeeval Jolly Jacob**
