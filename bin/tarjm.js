#!/usr/bin/env node

import fetch from 'node-fetch';
import minimist from 'minimist';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

export async function tarjm(args = process.argv.slice(2)) {
    // Parse command-line arguments
    args = minimist(args);
    const setDefaultLanguage = args.d || args.default;
    const specifiedLanguage = args.l || args.language;
    const filePath = args.f || args.file;
    const showHelp = args.h || args.help;

    // Show help message
    if (showHelp) {
        console.log(chalk.green(`
Usage:
  tarjm [options] [text_to_translate]

Options:
  -d, --default <language>   Set the default target language for translation.
                             This setting will be saved in the config file (~/.config/tarjm/config.json).
                             If no text or file is provided, the script will exit after setting the default language.

  -l, --language <language>  Specify the target language for this translation.
                             This option overrides the default language set in the config.

  -f, --file <path>          Read the text to translate from the specified file.

  -h, --help                 Display this help message.

Examples:
  tarjm "Hello World"
      Translates "Hello World" to the default language (or English if not set).

  tarjm -l es "Hello World"
      Translates "Hello World" to Spanish.

  tarjm -f mytext.txt
      Translates the content of 'mytext.txt' to the default language.

  tarjm -d fr
      Sets the default language to French.

  tarjm -h
      Displays this help message.

Description:
  tarjm is a command-line tool for translating text using a translation server.
  It allows you to translate text provided directly in the command line or from a file.
  You can set a default target language or specify one per translation.
`));
        if (require.main !== module) return; // Exit if imported as a module
        process.exit(0);
    }

    // Get the text to translate from the remaining arguments
    let textToTranslate = args._.join(' ');

    // Paths
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.config', 'tarjm');
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
            if (require.main !== module) return;
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
            if (require.main !== module) throw error;
            process.exit(1);
        }
    }

    if (!textToTranslate) {
        console.error(chalk.red('Please provide text to translate.'));
        if (require.main !== module) throw new Error('No text provided.');
        process.exit(1);
    }

    try {
        const res = await fetch('http://tarjm:5000/translate', {
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
            return data.translatedText; // Return the translated text when used as a module
        } else {
            console.error(chalk.red('Translation failed:'), data);
            if (require.main !== module) throw new Error('Translation failed.');
        }
    } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        if (require.main !== module) throw error;
    }
}

// Ensure the script runs when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    tarjm();
}
