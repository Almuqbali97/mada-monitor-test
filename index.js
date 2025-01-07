import express from "express";
import { exec } from "child_process";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const thingsboardUrl =
  "https://thingsboard.example.com/api/v1/g3xib6DDxR2agTN6TYua/telemetry";

app.get("/send-telemetry", async (req, res) => {
  //   const telemetryData = "";

  try {
    const cpuLoad = await getZabbixData(
      "zabbix_get -s 127.0.0.1 -p 10050 -k proc.cpu.util"
    );
    const response = await fetch(thingsboardUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cpuLoad: cpuLoad }),
    });

    if (response.ok) {
      res.status(response.status).json({ message: "Successful" });
    } else {
      console.error("Failed to send telemetry:", response.statusText);
      res.status(response.status).json({ error: "Failed to send telemetry" });
    }
  } catch (error) {
    console.error("Error sending telemetry:", error.message);
    res.status(500).json({ error: "Failed to send telemetry" });
  }
});

// Function to get data from Zabbix agent
function getZabbixData(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(stderr);
      }
      resolve(stdout.trim());
    });
  });
}

app.listen(port, () => {
  console.log("app is running on port: " + port);
});
