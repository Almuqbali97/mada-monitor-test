import express from "express";
import { exec } from "child_process";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const thingsboardUrl =
  "http://demo.thingsboard.io/api/v1/g3xib6DDxR2agTN6TYua/telemetry";

app.get("/send-telemetry", async (req, res) => {
  //   const telemetryData = "";

  try {
    const cpuLoad = await getZabbixData(
      "zabbix_get -s 127.0.0.1 -p 10050 -k proc.cpu.util"
    );
    const memory = await getZabbixData(
      "zabbix_get -s 127.0.0.1 -p 10050 -k vm.memory.size[pused]" // Memory usage in percentage
    );
    const storage = await getZabbixData(
      "zabbix_get -s 127.0.0.1 -p 10050 -k vfs.fs.size[/,pused]" // Storage usage of root filesystem in percentage
    );
    const sqlService = await getZabbixData(
      "zabbix_get -s 127.0.0.1 -p 10050 -k proc.cpu.util[,mysql]"
    );
    const zabbixServer = await getZabbixData(
      "zabbix_get -s 127.0.0.1 -p 10050 -k proc.cpu.util[,zabbix]"
    );
    console.log(cpuLoad);
    const response = await fetch(thingsboardUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cpuLoad: cpuLoad,
        memory: memory,
        storage: storage,
        SQL_service: sqlService,
        zabbix: zabbixServer,
      }),
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

// Function to send telemetry
async function sendTelemetry() {
  try {
    const cpuLoad = await getZabbixData(
      "zabbix_get -s 127.0.0.1 -p 10050 -k proc.cpu.util"
    );
    const memory = await getZabbixData(
      "zabbix_get -s 127.0.0.1 -p 10050 -k vm.memory.size[pused]" // Memory usage in percentage
    );
    const storage = await getZabbixData(
      "zabbix_get -s 127.0.0.1 -p 10050 -k vfs.fs.size[/,pused]" // Storage usage of root filesystem in percentage
    );
    const sqlService = await getZabbixData(
      "zabbix_get -s 127.0.0.1 -p 10050 -k proc.cpu.util[,mysql]"
    );
    const zabbixServer = await getZabbixData(
      "zabbix_get -s 127.0.0.1 -p 10050 -k proc.cpu.util[,zabbix]"
    );

    const telemetryData = {
      cpuLoad: cpuLoad,
      memory: memory,
      storage: storage,
      SQL_Service: sqlService,
      zabbix_Service: zabbixServer,
    };

    const response = await fetch(thingsboardUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(telemetryData),
    });

    if (response.ok) {
      console.log("Telemetry sent successfully:", telemetryData);
    } else {
      console.error("Failed to send telemetry:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending telemetry:", error.message);
  }
}

// Trigger telemetry every 3 seconds
setInterval(sendTelemetry, 3000);

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
