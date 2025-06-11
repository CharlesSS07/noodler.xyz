#!/usr/bin/env node

import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';

const execAsync = promisify(exec);

// ANSI color codes
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

async function readFirebaseConfig() {
    try {
        const firebaseJson = JSON.parse(fs.readFileSync('./firebase.json', 'utf8'));
        return firebaseJson.emulators || {};
    } catch (error) {
        console.error(colorize('❌ Error reading firebase.json:', 'red'), error.message);
        process.exit(1);
    }
}

async function checkPort(port) {
    try {
        const { stdout } = await execAsync(`lsof -i :${port}`);
        if (stdout.trim()) {
            const lines = stdout.trim().split('\n');
            const headerLine = lines[0];
            const processLines = lines.slice(1);
            
            return processLines.map(line => {
                const parts = line.trim().split(/\s+/);
                return {
                    command: parts[0],
                    pid: parts[1],
                    user: parts[2],
                    port: port,
                    rawLine: line
                };
            });
        }
        return [];
    } catch (error) {
        // Port is free (lsof returns non-zero exit code when no processes found)
        return [];
    }
}

async function killProcess(pid) {
    try {
        await execAsync(`kill -9 ${pid}`);
        return true;
    } catch (error) {
        return false;
    }
}

function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function askQuestion(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function main() {
    console.log(colorize('🔍 Firebase Emulator Port Killer', 'bold'));
    console.log(colorize('=====================================', 'cyan'));
    console.log();

    // Read Firebase configuration
    const emulators = await readFirebaseConfig();
    const ports = [];
    
    // Extract ports from emulator config
    Object.entries(emulators).forEach(([service, config]) => {
        if (config.port) {
            ports.push({
                service,
                port: config.port
            });
        }
    });

    if (ports.length === 0) {
        console.log(colorize('ℹ️ No emulator ports found in firebase.json', 'yellow'));
        process.exit(0);
    }

    console.log(colorize('📋 Checking configured emulator ports:', 'blue'));
    ports.forEach(({ service, port }) => {
        console.log(`  ${colorize(service, 'cyan')}: ${colorize(port, 'white')}`);
    });
    console.log();

    // Check each port for running processes
    const runningProcesses = [];
    
    for (const { service, port } of ports) {
        console.log(colorize(`🔍 Checking port ${port} (${service})...`, 'yellow'));
        const processes = await checkPort(port);
        
        if (processes.length > 0) {
            console.log(colorize(`  ⚠️  Found ${processes.length} process(es):`, 'red'));
            processes.forEach(process => {
                console.log(`    ${colorize(process.command, 'magenta')} (PID: ${colorize(process.pid, 'white')}) - User: ${colorize(process.user, 'cyan')}`);
                runningProcesses.push({ ...process, service });
            });
        } else {
            console.log(colorize(`  ✅ Port ${port} is free`, 'green'));
        }
    }

    if (runningProcesses.length === 0) {
        console.log();
        console.log(colorize('🎉 All Firebase emulator ports are free!', 'green'));
        process.exit(0);
    }

    console.log();
    console.log(colorize('🎯 Found processes using Firebase emulator ports:', 'red'));
    console.log();

    // Group processes by PID to avoid killing the same process multiple times
    const uniqueProcesses = runningProcesses.reduce((acc, process) => {
        if (!acc.find(p => p.pid === process.pid)) {
            acc.push(process);
        }
        return acc;
    }, []);

    const rl = createReadlineInterface();

    try {
        // Ask about killing all processes at once
        if (uniqueProcesses.length > 1) {
            console.log(colorize('Options:', 'cyan'));
            console.log('1. Kill all processes at once');
            console.log('2. Choose individual processes to kill');
            console.log('3. Exit without killing anything');
            console.log();

            const choice = await askQuestion(rl, colorize('Choose an option (1-3): ', 'yellow'));

            if (choice === '1') {
                console.log();
                console.log(colorize('💀 Killing all processes...', 'red'));
                
                let killedCount = 0;
                for (const process of uniqueProcesses) {
                    const success = await killProcess(process.pid);
                    if (success) {
                        console.log(colorize(`  ✅ Killed ${process.command} (PID: ${process.pid})`, 'green'));
                        killedCount++;
                    } else {
                        console.log(colorize(`  ❌ Failed to kill ${process.command} (PID: ${process.pid})`, 'red'));
                    }
                }
                
                console.log();
                console.log(colorize(`🎯 Killed ${killedCount} out of ${uniqueProcesses.length} processes`, killedCount === uniqueProcesses.length ? 'green' : 'yellow'));
                rl.close();
                return;
            } else if (choice === '3') {
                console.log(colorize('👋 Exiting without killing any processes', 'cyan'));
                rl.close();
                return;
            }
        }

        // Individual process selection
        console.log();
        for (let i = 0; i < uniqueProcesses.length; i++) {
            const process = uniqueProcesses[i];
            const relatedServices = runningProcesses
                .filter(p => p.pid === process.pid)
                .map(p => p.service)
                .join(', ');

            console.log(colorize(`Process ${i + 1}/${uniqueProcesses.length}:`, 'cyan'));
            console.log(`  Command: ${colorize(process.command, 'magenta')}`);
            console.log(`  PID: ${colorize(process.pid, 'white')}`);
            console.log(`  User: ${colorize(process.user, 'cyan')}`);
            console.log(`  Blocking services: ${colorize(relatedServices, 'yellow')}`);
            console.log(`  Port(s): ${colorize(runningProcesses.filter(p => p.pid === process.pid).map(p => p.port).join(', '), 'white')}`);
            
            const answer = await askQuestion(rl, colorize('Kill this process? (y/N): ', 'yellow'));
            
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                const success = await killProcess(process.pid);
                if (success) {
                    console.log(colorize(`  ✅ Successfully killed process ${process.pid}`, 'green'));
                } else {
                    console.log(colorize(`  ❌ Failed to kill process ${process.pid}`, 'red'));
                }
            } else {
                console.log(colorize(`  ⏭️  Skipped process ${process.pid}`, 'cyan'));
            }
            console.log();
        }

    } finally {
        rl.close();
    }

    console.log(colorize('✨ Done! You can now start Firebase emulators with:', 'green'));
    console.log(colorize('   yarn run emulators', 'white'));
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log();
    console.log(colorize('👋 Interrupted by user', 'yellow'));
    process.exit(0);
});

main().catch(error => {
    console.error(colorize('❌ Unexpected error:', 'red'), error);
    process.exit(1);
});