# Requirements Document

## Introduction

The Kali Web Terminal is a massively expanded in-browser simulation of the Kali Linux operating system for the CyberForge Academy platform. It provides learners with a realistic, fully client-side terminal experience including a complete virtual filesystem, 100+ bash commands, a comprehensive hacking tool suite with real-time streaming output, Metasploit Framework integration with a full interactive sub-shell, pipe and environment variable support, and a Kali-accurate boot sequence. All execution runs entirely in vanilla JavaScript within the browser; no real OS commands are executed and no filesystem changes are persisted outside the in-memory VFS.

---

## Glossary

- **Terminal**: The in-browser terminal UI component rendered by `renderTerminalPage` and driven by `initTerminal`.
- **VFS (Virtual Filesystem)**: The in-memory object `termState.vfs` that maps absolute path strings to `VFSNode` objects, replicating the Kali Linux directory tree.
- **VFSNode**: An object describing a filesystem entry with type `'dir'`, `'file'`, or `'link'`, plus associated metadata (content, permissions, owner, size, target).
- **Dispatcher**: The `execTermCmd(cmdStr)` function that is the single entry point for all user input processing.
- **Streaming Engine**: The `streamLines` / `streamChunks` / `streamProgressBar` functions that produce real-time animated output in the terminal DOM.
- **commandRegistry**: A `Map<string, CommandHandler>` providing O(1) lookup for all supported bash commands.
- **toolTemplates**: A `Map<string, ToolTemplateFactory>` providing streaming output templates for each hacking tool.
- **MSF_Shell**: The Metasploit Framework interactive sub-shell entered via `msfconsole`, handled by `handleMsfCmd`.
- **Meterpreter_Shell**: The post-exploitation sub-shell entered after a successful `run`/`exploit` in MSF_Shell, handled by `handleMeterpreterCmd`.
- **Python_Shell**: The interactive Python 3 REPL mode entered via `python3` with no arguments, tracked by `termState.pythonMode`.
- **Pipe_Engine**: The `executePipeline(segments, onComplete)` function that chains command segments by passing each segment's stdout as the next segment's stdin.
- **Autocomplete_Engine**: The `autocomplete(partial)` function that provides Tab-key completion for commands and VFS paths.
- **escapeHtml**: A function that converts `<`, `>`, `&`, `"`, and `'` to their HTML entity equivalents before insertion into `innerHTML`.
- **termState**: The central state singleton holding `cwd`, `mode`, `vfs`, `env`, `aliases`, `jobs`, `history`, `isExecuting`, and all other runtime state.
- **StreamChunk**: An object `{ html: string, delay: number, replacePrev?: boolean }` used by `streamChunks` for variable-delay output.

---

## Requirements

### Requirement 1: Virtual Filesystem

**User Story:** As a cybersecurity student, I want a realistic Kali Linux virtual filesystem, so that I can navigate directories, read and write files, and practice file-system commands as I would on a real Kali machine.

#### Acceptance Criteria

1. THE VFS SHALL be pre-populated at `termState` initialisation with the full Kali Linux directory tree including `/bin`, `/sbin`, `/etc`, `/home/kali`, `/opt`, `/root`, `/tmp`, `/usr`, `/var`, `/proc`, and `/dev`.
2. THE VFS SHALL include pre-populated files at `/etc/passwd`, `/etc/shadow`, `/etc/hosts`, `/etc/os-release`, `/etc/crontab`, `/home/kali/.bashrc`, `/home/kali/.bash_history`, `/root/root.txt`, `/var/log/syslog`, `/var/log/auth.log`, and `/usr/share/wordlists/rockyou.txt`.
3. WHEN `vfsWrite(path, content)` is called for any path `path` and string `content`, THE VFS SHALL store `content` such that a subsequent `vfsCat(path)` call returns a string equal to `content`.
4. WHEN `vfsMkdirP(path)` is called for any path string `path`, THE VFS SHALL create a node at `path` with `type === 'dir'`, creating all intermediate directories as needed.
5. WHEN the user executes `cd <path>` where `<path>` resolves to a directory in the VFS, THE Terminal SHALL update `termState.cwd` to the resolved absolute path.
6. WHEN the user executes `cd <path>` where `<path>` does not exist in the VFS, THE Terminal SHALL output `bash: cd: <path>: No such file or directory` and leave `termState.cwd` unchanged.
7. WHEN the user executes `cd <path>` where `<path>` resolves to a file (not a directory), THE Terminal SHALL output `bash: cd: <path>: Not a directory` and leave `termState.cwd` unchanged.
8. WHEN `vfsCp(src, dest)` is called, THE VFS SHALL create a new node at `dest` whose content is identical to the node at `src`, leaving the original `src` node unchanged.
9. WHEN `vfsMv(src, dest)` is called, THE VFS SHALL create a new node at `dest` with the original content of `src` and remove the `src` node from the VFS.
10. THE `resolvePath` function SHALL be idempotent: for any path string `p`, `resolvePath(resolvePath(p))` SHALL equal `resolvePath(p)`.
11. THE `resolvePath` function SHALL expand `~` to `/home/kali`, resolve `..` segments, and resolve relative paths against `termState.cwd`.

---

### Requirement 2: Bash Command Set

**User Story:** As a cybersecurity student, I want access to 100+ bash commands with accurate behavior, so that I can practice real Linux workflows without leaving the browser.

#### Acceptance Criteria

1. THE commandRegistry SHALL contain handlers for all commands listed in the design's Complete Command Set Reference table, covering file operations (`ls`, `cp`, `mv`, `rm`, `mkdir`, `touch`, `ln`, `find`, `file`, `stat`, `tree`, `du`, `df`, `chmod`, `chown`), text processing (`cat`, `head`, `tail`, `grep`, `cut`, `awk`, `sed`, `sort`, `uniq`, `wc`, `strings`, `xxd`), network commands (`ping`, `curl`, `wget`, `netstat`, `ss`, `traceroute`, `host`, `dig`, `whois`), process and system commands (`ps`, `top`, `kill`, `jobs`, `bg`, `fg`, `date`, `uptime`, `free`, `lscpu`, `env`, `export`, `alias`, `history`, `sudo`, `su`), archive commands (`tar`, `zip`, `unzip`, `gzip`), and scripting commands (`python3`, `bash`, `sh`).
2. WHEN the user executes any command in the commandRegistry, THE Dispatcher SHALL route the command to the registered handler without throwing an unhandled exception.
3. WHEN the user types a command not present in the commandRegistry, THE Terminal SHALL output `bash: <cmd>: command not found` and suggest `apt install <cmd>` where applicable.
4. WHEN the user executes `ls -la <path>` for any valid VFS directory `<path>`, THE Terminal SHALL output a listing showing each child entry with permissions, owner, size, and name.
5. WHEN the user executes `cat <path>` for any existing VFS file `<path>`, THE Terminal SHALL output the file's content with `escapeHtml` applied before DOM insertion.
6. WHEN the user executes `grep <pattern> <file>` for an existing VFS file, THE Terminal SHALL output only the lines of the file's content that contain `<pattern>`.
7. WHEN the user executes `chmod <mode> <path>` for any existing VFS node, THE VFS SHALL update the permissions field of that node.
8. WHEN the user accesses `/etc/shadow` without a `sudo` prefix, THE Terminal SHALL output `cat: /etc/shadow: Permission denied`.

---

### Requirement 3: Hacking Tool Suite

**User Story:** As a cybersecurity student, I want to run hacking tools like nmap, gobuster, hydra, and hashcat with realistic streaming output, so that I can practice penetration testing workflows in a safe simulation.

#### Acceptance Criteria

1. THE toolTemplates registry SHALL contain output factories for all tools listed in the design's Hacking Tools section: `nmap`, `masscan`, `amass`, `sublist3r`, `theHarvester`, `shodan`, `gobuster`, `dirb`, `dirsearch`, `wfuzz`, `ffuf`, `nikto`, `whatweb`, `wafw00f`, `searchsploit`, `hydra`, `hashcat`, `john`, `crunch`, `airmon-ng`, `airodump-ng`, `aireplay-ng`, `aircrack-ng`, `binwalk`, `foremost`, `exiftool`, `nc`, `socat`, `tcpdump`, `wireshark`, `strace`, `ltrace`, `sherlock`, and `recon-ng`.
2. WHEN the user invokes any hacking tool, THE Streaming Engine SHALL produce at least one `StreamChunk` of output for that invocation.
3. WHEN the user runs `nmap <target>`, THE Terminal SHALL stream port discovery lines followed by a formatted port table ending with a `Nmap done` summary line.
4. WHEN the user runs `nmap -sV <target>`, THE Terminal SHALL include service version scan lines in the output in addition to the default port table.
5. WHEN the user runs `nmap -A <target>`, THE Terminal SHALL include service scan, NSE script execution, and OS detection lines in the output.
6. WHEN the user runs `gobuster dir -u <url> -w <wordlist>`, THE Terminal SHALL stream progressive directory scan lines with discovered paths highlighted.
7. WHEN the user runs `hydra -l <user> -P <wordlist> <target> <service>`, THE Terminal SHALL stream attempt-count lines and output the found credential upon completion.
8. WHEN the user runs `hashcat -m <mode> <hash> <wordlist>`, THE Terminal SHALL output mode-specific header lines and stream a cracked result line.
9. WHEN the user runs `john <hashfile>`, THE Terminal SHALL auto-detect hash type and stream cracking progress lines.
10. WHEN the user runs `airmon-ng start <interface>`, THE Terminal SHALL output a monitor-mode enabled confirmation including a chipset table.
11. WHEN the user runs `airodump-ng <interface>`, THE Terminal SHALL stream a live AP and client table with simulated signal strength values.

---

### Requirement 4: Package and Repository Installation

**User Story:** As a cybersecurity student, I want to simulate `apt install` and `git clone` with realistic progress animations, so that I can practice tool installation workflows as they appear on a real Kali system.

#### Acceptance Criteria

1. WHEN the user executes `apt install <pkg>` for any package name `<pkg>`, THE Streaming Engine SHALL stream installation phases including "Reading package lists", "Building dependency tree", "Reading state information", an animated download progress bar from 0% to 100% in increments, an unpacking line, a setup line, and a success confirmation line.
2. WHEN the `apt install <pkg>` stream's `onComplete` callback fires, THE Terminal SHALL add `<pkg>` (lowercased) to `termState.installedTools` such that `termState.installedTools.has(pkg.toLowerCase()) === true`.
3. THE `termState.installedTools` set SHALL only grow via `apt install` or `git clone` completions and SHALL never shrink except on an explicit `resetVFS()` call.
4. WHEN the user executes `git clone <url>` for any URL `<url>`, THE Streaming Engine SHALL stream phases including object enumeration, counting, compression, an animated "Receiving objects" progress bar from 0% to 100% in 5% increments, a delta resolution line, and a success confirmation line.
5. WHEN the `git clone <url>` stream's `onComplete` callback fires, THE VFS SHALL contain a directory node at `resolvePath(repoName)` where `repoName` is extracted from `<url>`, with `type === 'dir'`.
6. WHEN the user executes `apt update`, THE Terminal SHALL stream a repository refresh simulation including fetch lines per repository source and a "packages can be upgraded" summary line.

---

### Requirement 5: Pipeline, Autocomplete, and Environment

**User Story:** As a cybersecurity student, I want pipe chains, tab completion, and environment variable expansion to work like a real bash shell, so that I can practice chained commands and shell scripting techniques.

#### Acceptance Criteria

1. WHEN the user enters a command string containing one or more `|` characters, THE Dispatcher SHALL split the string into pipeline segments and invoke `executePipeline`.
2. WHEN `executePipeline` processes a pipeline of N segments, THE Pipe_Engine SHALL pass the stdout string produced by segment `i` as the stdin parameter to segment `i+1` for all `i` from 0 to N-2.
3. WHEN `executePipeline` processes a pipeline of N segments, THE Terminal SHALL append to the DOM only the output of segment N-1 (the final segment), not the intermediate stdout strings.
4. WHEN the user presses the Tab key with a partial command prefix, THE Autocomplete_Engine SHALL complete the prefix to the longest unambiguous matching command in the commandRegistry.
5. WHEN the user presses the Tab key with a partial filesystem path, THE Autocomplete_Engine SHALL complete the path to the longest unambiguous matching entry in the VFS under the current directory or given prefix.
6. WHEN the user presses the Tab key, THE Autocomplete_Engine SHALL NOT mutate `termState.vfs`, `termState.mode`, `termState.env`, or `termState.history`.
7. WHEN `expandEnv(cmdStr)` is called with any string `cmdStr`, THE Terminal SHALL return a string with all `$VAR` and `${VAR}` references replaced by their values from `termState.env`.
8. WHEN `expandEnv(cmdStr)` encounters a variable name not present in `termState.env`, THE Terminal SHALL replace that reference with the empty string `''` and SHALL NOT throw an exception.
9. WHEN `expandEnv(cmdStr)` is called with any string input including the empty string, strings with no variables, or strings containing only `$` characters, THE Terminal SHALL return a string (never `undefined` or `null`).
10. WHEN the user executes `export FOO=bar`, THE Terminal SHALL add `FOO` with value `bar` to `termState.env` and add `FOO` to `termState.exports`.
11. WHEN the user executes `alias ll='ls -la'`, THE Terminal SHALL store the alias in `termState.aliases` and resolve it on subsequent command dispatch.

---

### Requirement 6: Boot Sequence and OS Environment

**User Story:** As a cybersecurity student, I want an authentic Kali Linux boot sequence, neofetch output, and shell prompt, so that the terminal feels like a real Kali OS session.

#### Acceptance Criteria

1. WHEN the Terminal initialises for the first time, THE Boot Sequence SHALL stream an ASCII Kali dragon banner, systemd-style `[ OK ]` service start lines for D-Bus, Network Manager, OpenSSH, and Apache2, a multi-user target reached line, a `kali login:` prompt line, a kernel version line, a last-login line, and an MOTD block.
2. WHEN `showBootSequence(onDone)` completes streaming all boot lines, THE Boot Sequence SHALL invoke `onDone` exactly once, regardless of how many lines are in the boot sequence array.
3. WHEN the user executes `neofetch`, THE Terminal SHALL output a block containing the fields `OS`, `Kernel`, `Uptime`, `Shell`, `CPU`, and `Memory` with values consistent with the Kali environment defined in `termState.env`.
4. THE Terminal prompt SHALL be rendered in the format `┌──(kali㉿cyberforge)-[<dir>]\n└─$ ` where `<dir>` is `~` when `termState.cwd === '/home/kali'` and the absolute path otherwise.
5. THE Terminal SHALL initialise `termState.env` with at minimum the variables `USER`, `HOME`, `SHELL`, `PATH`, `PWD`, `HOSTNAME`, and `TERM` populated with Kali-accurate values.
6. WHEN the user executes `date`, THE Terminal SHALL output the current system date and time in a format consistent with the Unix `date` command output.
7. WHEN the user executes `history`, THE Terminal SHALL output the numbered list of all commands in `termState.history` in order from oldest to newest.

---

### Requirement 7: Metasploit Framework Sub-Shell

**User Story:** As a cybersecurity student, I want a full interactive Metasploit Framework sub-shell with search, use, set, and run commands, so that I can practice exploitation workflows including gaining a meterpreter session.

#### Acceptance Criteria

1. WHEN the user executes `msfconsole` from bash mode, THE MSF_Shell SHALL stream a Metasploit ASCII banner with version and module count, and THE Terminal SHALL set `termState.mode` to `'msfconsole'`.
2. WHEN the user types `search <keyword>` in msfconsole mode, THE MSF_Shell SHALL output a formatted table of modules from `msfModules` whose `path` or `desc` contains `<keyword>` (case-insensitive).
3. WHEN the user types `use <module_path>` in msfconsole mode, THE MSF_Shell SHALL set `termState.msfModule` to `<module_path>` and update the prompt to reflect the active module.
4. WHEN the user types `show options` in msfconsole mode with an active module, THE MSF_Shell SHALL output a table of the current `termState.msfOptions` key-value pairs.
5. WHEN the user types `set <KEY> <value>` in msfconsole mode, THE MSF_Shell SHALL update `termState.msfOptions[KEY]` to `<value>`.
6. WHEN the user types `run` or `exploit` in msfconsole mode with a module selected and `RHOSTS` set, THE MSF_Shell SHALL stream exploit attempt lines and then set `termState.mode` to `'meterpreter'`, outputting a meterpreter session-opened banner.
7. WHEN the user is in meterpreter mode, THE Meterpreter_Shell SHALL handle commands including `sysinfo`, `getuid`, `getpid`, `ls`, `pwd`, `download`, `upload`, `shell`, `hashdump`, `getsystem`, `ps`, `migrate`, `keyscan_start`, `keyscan_dump`, and `exit`.
8. WHEN the user types `exit` in meterpreter mode, THE Terminal SHALL set `termState.mode` to `'msfconsole'` and display the msfconsole prompt.
9. WHEN the user types `exit` in msfconsole mode, THE Terminal SHALL set `termState.mode` to `'bash'` and restore the bash prompt.
10. WHEN the user types `search <keyword>` in msfconsole mode, THE MSF_Shell SHALL return results that contain `<keyword>` in their `path` or `desc` fields and SHALL NOT return modules that do not match.

---

### Requirement 8: XSS Safety

**User Story:** As a platform security engineer, I want all user-supplied input to be HTML-escaped before DOM insertion, so that the terminal cannot be used as an XSS vector against other users or the platform itself.

#### Acceptance Criteria

1. WHEN `escapeHtml(s)` is called with any string `s`, THE Terminal SHALL return a string that contains no unescaped occurrences of `<`, `>`, or `&`.
2. WHEN any user-typed command string is inserted into the terminal DOM history, THE Terminal SHALL pass the command string through `escapeHtml` before setting `innerHTML`.
3. WHEN `cat <file>` renders file content to the DOM, THE Terminal SHALL pass the file content through `escapeHtml` before setting `innerHTML`.
4. WHEN any hacking tool template renders user-supplied arguments (such as target IP or URL) into output HTML, THE Terminal SHALL pass those argument strings through `escapeHtml` before building the HTML string.
5. WHEN the user-supplied command contains characters including `<`, `>`, `&`, `"`, and `'`, THE Terminal SHALL render those characters as visible text in the terminal output rather than interpreting them as HTML.

---

### Requirement 9: Streaming Completeness and Terminal Liveness

**User Story:** As a cybersecurity student, I want the terminal to always return to an interactive state after any command completes, so that I am never left with a permanently locked or unresponsive terminal.

#### Acceptance Criteria

1. WHEN `streamLines(cmd, lines, delay, onComplete)` is called with any array `lines` (including an empty array), THE Streaming Engine SHALL eventually invoke `onComplete` (if provided) and SHALL set `termState.isExecuting` to `false`.
2. WHEN `streamChunks(cmd, chunks, onComplete)` is called with any array `chunks` (including an empty array), THE Streaming Engine SHALL eventually invoke `onComplete` (if provided) and SHALL set `termState.isExecuting` to `false`.
3. WHEN any command handler completes its execution (streaming or synchronous), THE Terminal SHALL set `termState.isExecuting` to `false` and re-enable user input.
4. WHEN `termState.isExecuting` is `true` and the user submits a new command, THE Dispatcher SHALL silently discard the new command without crashing or permanently blocking subsequent input.
5. WHEN `streamProgressBar(cmd, label, steps, onComplete)` completes all steps, THE Streaming Engine SHALL invoke `onComplete` (if provided) and set `termState.isExecuting` to `false`.

---

### Requirement 10: Mode Transitions

**User Story:** As a cybersecurity student, I want to be able to enter and exit all terminal modes (bash, msfconsole, meterpreter, python3) reliably, so that I can move between different simulation environments without getting stuck.

#### Acceptance Criteria

1. THE `termState.mode` field SHALL at all times hold exactly one of the values `'bash'`, `'msfconsole'`, `'meterpreter'`, or `'python3'`. No command handler SHALL leave `termState.mode` in any other value.
2. WHEN the user executes `msfconsole` from `'bash'` mode, THE Terminal SHALL transition `termState.mode` to `'msfconsole'`.
3. WHEN `run`/`exploit` succeeds in `'msfconsole'` mode, THE Terminal SHALL transition `termState.mode` to `'meterpreter'`.
4. WHEN the user executes `python3` with no arguments from `'bash'` mode, THE Terminal SHALL transition `termState.mode` to `'python3'` and display a Python 3 REPL banner.
5. WHEN the user types `exit` or `quit` in `'python3'` mode, THE Terminal SHALL transition `termState.mode` to `'bash'`.
6. WHEN the user types `exit` in `'meterpreter'` mode, THE Terminal SHALL transition `termState.mode` to `'msfconsole'`.
7. WHEN the user types `exit` in `'msfconsole'` mode, THE Terminal SHALL transition `termState.mode` to `'bash'`.
8. WHEN the user types `exit` in `'bash'` mode, THE Terminal SHALL display a logout message and SHALL NOT change `termState.mode` to any value outside the valid set.
9. FOR ALL valid `termState.mode` values, there SHALL exist at least one command that transitions `termState.mode` back to `'bash'` mode (directly or via intermediate steps), ensuring all modes are reversible to the base bash mode.

---

### Requirement 11: Python 3 REPL

**User Story:** As a cybersecurity student, I want an interactive Python 3 REPL inside the terminal, so that I can write and execute Python scripts for scripting and exploit development practice.

#### Acceptance Criteria

1. WHEN the user executes `python3` with no arguments, THE Python_Shell SHALL display the Python 3 version banner and enter interactive REPL mode setting `termState.pythonMode` to `true`.
2. WHEN the user executes `python3 -c "<expression>"`, THE Terminal SHALL evaluate simple Python expressions (arithmetic, `print()` calls) and output the result without entering interactive mode.
3. WHEN the user executes `python3 <script.py>` where `<script.py>` exists in the VFS, THE Terminal SHALL execute the file content as Python code and output the result.
4. WHEN in Python REPL mode and the user enters a line beginning with `print(`, THE Python_Shell SHALL evaluate the expression and stream the printed output.
5. WHEN the user types `exit()` or `quit()` in Python REPL mode, THE Python_Shell SHALL exit REPL mode, set `termState.pythonMode` to `false`, and transition `termState.mode` to `'bash'`.

---

### Requirement 12: Background Jobs

**User Story:** As a cybersecurity student, I want to run commands in the background using `&` and manage jobs with `jobs`, `bg`, and `fg`, so that I can practice multi-process shell workflows.

#### Acceptance Criteria

1. WHEN the user appends `&` to a command, THE Dispatcher SHALL register the command in `termState.jobs` with a unique job ID and status `'running'`, and SHALL NOT block user input while the job executes.
2. WHEN the user executes `jobs`, THE Terminal SHALL output a table listing all current entries in `termState.jobs` with their ID, status, and command string.
3. WHEN the user executes `kill <jobId>`, THE Terminal SHALL update the corresponding job's status to `'done'` and remove it from the active jobs list.
4. WHEN the user executes `bg <jobId>`, THE Terminal SHALL resume a stopped job and update its status to `'running'`.
5. WHEN the user executes `fg <jobId>`, THE Terminal SHALL bring the job to the foreground and update its status accordingly.

---

### Requirement 13: Server-Side Command Fallback

**User Story:** As a platform developer, I want the server-side `simulateTerminal()` function to mirror the expanded command set, so that any server-side rendering path produces consistent output with the client-side simulation.

#### Acceptance Criteria

1. THE server-side `simulateTerminal()` function in `server/index.js` SHALL handle the same core command set as the client-side commandRegistry, including all file operation, network, and system commands.
2. WHEN the server-side `simulateTerminal()` receives an unrecognised command, THE server function SHALL return a `bash: <cmd>: command not found` response consistent with the client-side error format.
3. THE server-side responses SHALL apply the same `escapeHtml` sanitisation to user-supplied command arguments before including them in response strings.
