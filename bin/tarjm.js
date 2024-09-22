#!/usr/bin/env node

import fetch from 'node-fetch';
import minimist from 'minimist';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

export default async function tarjm() {
    // Parse command-line arguments
    const args = minimist(process.argv.slice(2));
    const setDefaultLanguage = args.d || args.default;
    const specifiedLanguage = args.l || args.language;
    const filePath = args.f || args.file;

    // Get the text to translate from the remaining arguments
    let textToTranslate = args._.join(' ');

    // Paths
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.config', 'transl');
    const configFile = path.join(configDir, 'config.json');

    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    // Function to read config
    function readConfig() {
        if (fs.existsSync(configFile)) {
            try {
                const data = fs.readFileSync(configFile, 'utf-8');
                return JSON.parse(data);
            } catch (error) {
                console.error(chalk.red('Error reading config file:'), error.message);
                return {};
            }
        } else {
            return {};
        }
    }

    // Function to write config
    function writeConfig(config) {
        try {
            fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
        } catch (error) {
            console.error(chalk.red('Error writing config file:'), error.message);
        }
    }

    if (setDefaultLanguage) {
        // Set default language
        const config = readConfig();
        config.defaultLanguage = setDefaultLanguage;
        writeConfig(config);
        console.log(chalk.green(`Default language set to: ${setDefaultLanguage}`));
        // If there's no text to translate and no file, exit after setting the default
        if (!textToTranslate && !filePath) {
            process.exit(0);
        }
    }

    // Determine the target language
    let targetLanguage = 'en'; // Default to English

    if (specifiedLanguage) {
        targetLanguage = specifiedLanguage;
    } else {
        // Check if a default language is set in config
        const config = readConfig();
        if (config.defaultLanguage) {
            targetLanguage = config.defaultLanguage;
        }
    }

    // Read text from file if filePath is provided
    if (filePath) {
        try {
            textToTranslate = fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            console.error(chalk.red('Error reading file:'), error.message);
            process.exit(1);
        }
    }

    if (!textToTranslate) {
        console.error(chalk.red('Please provide text to translate.'));
        process.exit(1);
    }

    try {
        const res = await fetch('http://transl:5000/translate', {
            method: 'POST',
            body: JSON.stringify({
                q: textToTranslate,
                source: 'auto',
                target: targetLanguage,
                format: 'text',
                alternatives: 3,
                api_key: ''
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            throw new Error(`Server responded with status ${res.status}`);
        }

        const data = await res.json();

        // Check if the translation was successful
        if (data && data.translatedText) {
            console.log(chalk.cyan('Translated Text:\n'));
            console.log(chalk.bold(data.translatedText));
        } else {
            console.error(chalk.red('Translation failed:'), data);
        }
    } catch (error) {
        console.error(chalk.red('Error:'), error.message);
    }
}

// Ensure the script runs when executed directly
const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] === scriptPath) {
    tarjm();
}
