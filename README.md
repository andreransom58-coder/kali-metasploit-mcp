# Kali Metasploit MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for interacting with Metasploit Framework on Kali Linux and other security-focused distributions.

## ⚠️ Security Warning

**This tool is for authorized security testing only. Use responsibly and legally.**
- Only use on systems you own or have explicit written permission to test
- Unauthorized access to computer systems is illegal
- The authors are not responsible for misuse of this software

## Features

This MCP server provides the following tools:

- **Exploit Search**: Search for exploits in the Metasploit database
- **Auxiliary Module Search**: Search for auxiliary modules (scanners, fuzzers, etc.)
- **Exploit Information**: Get detailed information about specific exploits
- **Payload Listing**: List available payloads for exploits
- **Database Management**: 
  - Check database status
  - List workspaces
  - View hosts and services
- **Network Scanning**: Run nmap scans and automatically import results into Metasploit database

## Prerequisites

- **Kali Linux** (or any Linux distribution with Metasploit Framework)
- **Node.js 18+** (or Node.js 20+ recommended)
- **Metasploit Framework** installed and configured
- **nmap** (optional, for network scanning features)

### Installing Metasploit Framework

On Kali Linux:
```bash
sudo apt-get update
sudo apt-get install metasploit-framework
```

On other Debian-based systems:
```bash
curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb | sudo bash
```

### Installing nmap (for scanning features)

```bash
sudo apt-get install nmap
```

## Installation

1. Clone or download this repository:
```bash
git clone https://github.com/andreransom58-coder/kali-metasploit-mcp.git
cd kali-metasploit-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Standalone Testing

Run the server directly:
```bash
npm start
```

Or in development mode:
```bash
npm run dev
```

### Integration with MCP Clients

#### Claude Desktop

Add to your Claude Desktop configuration file (located at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "kali-metasploit": {
      "command": "node",
      "args": ["/absolute/path/to/kali-metasploit-mcp/dist/index.js"]
    }
  }
}
```

#### Cursor IDE

Add to your Cursor settings (`.cursor-settings` or workspace settings):

```json
{
  "mcp": {
    "servers": {
      "kali-metasploit": {
        "command": "node",
        "args": ["/absolute/path/to/kali-metasploit-mcp/dist/index.js"]
      }
    }
  }
}
```

## Available Tools

### `search_exploits`
Search for exploits in Metasploit database.

**Parameters:**
- `query` (required): Search query (e.g., "windows smb", "apache", "CVE-2021-44228")
- `platform` (optional): Filter by platform (windows, linux, etc.)

**Example:**
```
search_exploits({
  query: "windows smb",
  platform: "windows"
})
```

### `search_auxiliary`
Search for auxiliary modules.

**Parameters:**
- `query` (required): Search query
- `type` (optional): Filter by type (scanner, admin, dos, fuzzers, gather)

### `get_exploit_info`
Get detailed information about a specific exploit.

**Parameters:**
- `exploitPath` (required): Full exploit path (e.g., "exploit/windows/smb/ms17_010_eternalblue")

### `get_payloads`
List available payloads for an exploit.

**Parameters:**
- `exploitPath` (required): Full exploit path

### `db_status`
Check Metasploit database status.

### `db_workspaces`
List all Metasploit workspaces.

### `db_hosts`
List all hosts in the current workspace.

**Parameters:**
- `workspace` (optional): Workspace name to query

### `db_services`
List all services in the current workspace.

**Parameters:**
- `host` (optional): Filter by host IP address

### `nmap_scan`
Run an nmap scan and import results into Metasploit database.

**Parameters:**
- `target` (required): Target IP address or CIDR range
- `ports` (optional): Port range or specific ports (e.g., "80,443" or "1-1000")
- `scanType` (optional): Type of scan (quick, stealth, full, udp)

**Example:**
```
nmap_scan({
  target: "192.168.1.0/24",
  ports: "80,443,8080",
  scanType: "stealth"
})
```

## Development

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run watch
```

### Development Mode
```bash
npm run dev
```

## Troubleshooting

### Metasploit not found
If you get an error that `msfconsole` is not found:
1. Ensure Metasploit Framework is installed
2. Check that `msfconsole` is in your PATH
3. Try running `which msfconsole` (or `where msfconsole` on Windows) to verify

### Database not initialized
If database operations fail:
1. Initialize the database: `msfdb init`
2. Start the database: `msfdb start`
3. Verify: `msfconsole -q -x "db_status; exit"`

### Permission errors
Some operations may require root privileges:
- Network scanning may require elevated privileges
- Ensure proper permissions for database access

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This software is provided for educational and authorized testing purposes only. The authors and contributors are not responsible for any misuse or damage caused by this software. Always ensure you have proper authorization before testing any systems.

## Acknowledgments

- [Metasploit Framework](https://www.metasploit.com/) by Rapid7
- [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic
- Kali Linux community
