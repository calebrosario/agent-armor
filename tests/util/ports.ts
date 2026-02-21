// Port Allocation Utility for Testing
// Provides dynamic port allocation to prevent EADDRINUSE errors in tests

import net from "net";

/**
 * Get an available port starting from a base port
 * @param startPort - Port to start checking from (default: 3000)
 * @returns Available port number
 */
export async function getAvailablePort(
  startPort: number = 3000,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        server.close();
        resolve(getAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });

    server.once("listening", () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });

    server.listen(startPort);
  });
}

/**
 * Get multiple available ports
 * @param count - Number of ports to allocate
 * @param startPort - Port to start checking from (default: 3000)
 * @returns Array of available ports
 */
export async function getAvailablePorts(
  count: number,
  startPort: number = 3000,
): Promise<number[]> {
  const ports: number[] = [];

  for (let i = 0; i < count; i++) {
    const port = await getAvailablePort(startPort + i);
    ports.push(port);
  }

  return ports;
}
