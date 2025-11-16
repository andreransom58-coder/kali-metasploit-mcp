#!/usr/bin/env node

/**
 * Kali Metasploit MCP Server
 * 
 * MCP (Model Context Protocol) server for interacting with Metasploit Framework
 * on Kali Linux. Provides tools for searching exploits, managing database,
 * running scans, and more.
 * 
 * ⚠️ WARNING: This tool is for authorized security testing only.
 * Use responsibly and legally.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Metasploit command execution helper
async function executeMsfCommand(commands: string[]): Promise<string> {
  const commandString = commands.join("; ");
  const fullCommand = `msfconsole -q -x "${commandString}; exit"`;
  
  try {
    const { stdout, stderr } = await execAsync(fullCommand, {
      timeout: 60000, // 60 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    return stdout || stderr;
  } catch (error: any) {
    throw new Error(error.message || "Command execution failed");
  }
}

// Check if msfconsole is available
async function checkMsfAvailable(): Promise<boolean> {
  try {
    if (process.platform === "win32") {
      await execAsync("where msfconsole");
    } else {
      await execAsync("which msfconsole");
    }
    return true;
  } catch {
    return false;
  }
}

// Check if nmap is available
async function checkNmapAvailable(): Promise<boolean> {
  try {
    if (process.platform === "win32") {
      await execAsync("where nmap");
    } else {
      await execAsync("which nmap");
    }
    return true;
  } catch {
    return false;
  }
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: "search_exploits",
    description: "Search for exploits in Metasploit database",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (e.g., 'windows smb', 'apache', 'CVE-2021-44228')",
        },
        platform: {
          type: "string",
          description: "Optional: Filter by platform (windows, linux, etc.)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_auxiliary",
    description: "Search for auxiliary modules in Metasploit",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for auxiliary modules",
        },
        type: {
          type: "string",
          enum: ["scanner", "admin", "dos", "fuzzers", "gather"],
          description: "Optional: Filter by auxiliary type",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_exploit_info",
    description: "Get detailed information about a specific exploit",
    inputSchema: {
      type: "object",
      properties: {
        exploitPath: {
          type: "string",
          description: "Full exploit path (e.g., 'exploit/windows/smb/ms17_010_eternalblue')",
        },
      },
      required: ["exploitPath"],
    },
  },
  {
    name: "get_payloads",
    description: "List available payloads for a specific exploit",
    inputSchema: {
      type: "object",
      properties: {
        exploitPath: {
          type: "string",
          description: "Full exploit path",
        },
      },
      required: ["exploitPath"],
    },
  },
  {
    name: "db_status",
    description: "Check Metasploit database status",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "db_workspaces",
    description: "List all Metasploit workspaces",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "db_hosts",
    description: "List all hosts in the current workspace",
    inputSchema: {
      type: "object",
      properties: {
        workspace: {
          type: "string",
          description: "Optional: workspace name to query",
        },
      },
    },
  },
  {
    name: "db_services",
    description: "List all services in the current workspace",
    inputSchema: {
      type: "object",
      properties: {
        host: {
          type: "string",
          description: "Optional: filter by host IP address",
        },
      },
    },
  },
  {
    name: "nmap_scan",
    description: "Run an nmap scan and import results into Metasploit database",
    inputSchema: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description: "Target IP address or CIDR range",
        },
        ports: {
          type: "string",
          description: "Optional: port range or specific ports (e.g., '80,443' or '1-1000')",
        },
        scanType: {
          type: "string",
          enum: ["quick", "stealth", "full", "udp"],
          description: "Optional: type of scan to perform",
          default: "quick",
        },
      },
      required: ["target"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "kali-metasploit-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool list requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    // Check if Metasploit is available
    const msfAvailable = await checkMsfAvailable();
    if (!msfAvailable) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Metasploit (msfconsole) not found. Please install Metasploit Framework.",
              hint: process.platform === "win32" 
                ? "Install Metasploit Framework from Rapid7"
                : "Install with: sudo apt-get install metasploit-framework",
            }),
          },
        ],
      };
    }

    switch (name) {
      case "search_exploits": {
        const { query, platform } = args as { query: string; platform?: string };
        const commands = platform 
          ? [`search platform:${platform} ${query}`]
          : [`search ${query}`];

        try {
          const results = await executeMsfCommand(commands);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    query,
                    platform: platform || null,
                    results,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }),
              },
            ],
          };
        }
      }

      case "search_auxiliary": {
        const { query, type } = args as { query: string; type?: string };
        const searchQuery = type 
          ? `search type:auxiliary ${type} ${query}`
          : `search type:auxiliary ${query}`;

        try {
          const results = await executeMsfCommand([searchQuery]);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    query,
                    type: type || null,
                    results,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }),
              },
            ],
          };
        }
      }

      case "get_exploit_info": {
        const { exploitPath } = args as { exploitPath: string };

        try {
          const info = await executeMsfCommand([`info ${exploitPath}`]);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    exploitPath,
                    info,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }),
              },
            ],
          };
        }
      }

      case "get_payloads": {
        const { exploitPath } = args as { exploitPath: string };

        try {
          const payloads = await executeMsfCommand([
            `use ${exploitPath}`,
            `show payloads`,
          ]);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    exploitPath,
                    payloads,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }),
              },
            ],
          };
        }
      }

      case "db_status": {
        try {
          const status = await executeMsfCommand([`db_status`]);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    status,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }),
              },
            ],
          };
        }
      }

      case "db_workspaces": {
        try {
          const workspaces = await executeMsfCommand([`workspace`]);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    workspaces,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }),
              },
            ],
          };
        }
      }

      case "db_hosts": {
        const { workspace } = args as { workspace?: string };
        const commands = workspace 
          ? [`workspace ${workspace}`, `hosts`]
          : [`hosts`];

        try {
          const hosts = await executeMsfCommand(commands);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    workspace: workspace || "default",
                    hosts,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }),
              },
            ],
          };
        }
      }

      case "db_services": {
        const { host } = args as { host?: string };
        const commands = host 
          ? [`services -R ${host}`]
          : [`services`];

        try {
          const services = await executeMsfCommand(commands);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    host: host || "all",
                    services,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }),
              },
            ],
          };
        }
      }

      case "nmap_scan": {
        const { target, ports, scanType } = args as {
          target: string;
          ports?: string;
          scanType?: string;
        };

        const nmapAvailable = await checkNmapAvailable();
        if (!nmapAvailable) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: "nmap not found. Please install nmap.",
                  hint: process.platform === "win32"
                    ? "Download nmap from https://nmap.org/"
                    : "Install with: sudo apt-get install nmap",
                }),
              },
            ],
          };
        }

        let nmapArgs: string[] = [];

        switch (scanType) {
          case "quick":
            nmapArgs.push("-F");
            break;
          case "stealth":
            nmapArgs.push("-sS");
            break;
          case "full":
            nmapArgs.push("-sV", "-sC");
            break;
          case "udp":
            nmapArgs.push("-sU");
            break;
        }

        if (ports) {
          nmapArgs.push("-p", ports);
        }

        nmapArgs.push(target);

        // Run nmap through msfconsole to automatically import results
        const dbNmapCommand = `db_nmap ${nmapArgs.join(" ")}`;

        try {
          const results = await executeMsfCommand([dbNmapCommand]);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    target,
                    ports: ports || "default",
                    scanType: scanType || "quick",
                    results,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }),
              },
            ],
          };
        }
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Unknown tool: ${name}`,
              }),
            },
          ],
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          }),
        },
      ],
    };
  }
});

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Kali Metasploit MCP Server running on stdio");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

