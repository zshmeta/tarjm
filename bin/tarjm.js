#!/usr/bin/env node

// Import necessary modules
import fs from 'fs'; // File system operations
import os from 'os'; // Operating system utilities
import path from 'path'; // Path utilities
import { fileURLToPath } from 'url'; // Convert file URLs to file paths
import minimist from 'minimist'; // Command-line arguments parser
import chalk from 'chalk'; // Terminal string styling
import fetch from 'node-fetch'; // HTTP request library (for Node.js < v17)

// Helper variables to get the current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Checks if the script is being run directly from the command line.
 * This helps in determining whether to exit the process or throw errors.
 *
 * @returns {boolean} True if the script is the main module, false otherwise.
 */
function isMainModule() {
  // Resolve both paths to ensure accurate comparison
  const scriptPath = path.resolve(__filename);
  const processPath = path.resolve(process.argv[1]);
  return scriptPath === processPath;
}

/**
 * The main function that handles translation logic.
 *
 * @param {Array} args - Command-line arguments (excluding 'node' and script name).
 */
export async function tarjm(args = process.argv.slice(2)) {
  try {
    // Parse command-line arguments using minimist
    const parsedArgs = minimist(args);
    const setDefaultLanguage = parsedArgs.d || parsedArgs.default;
    const specifiedLanguage = parsedArgs.l || parsedArgs.language;
    const filePath = parsedArgs.f || parsedArgs.file;
    const showHelp = parsedArgs.h || parsedArgs.help;

    // Show help message if '-h' or '--help' flag is present
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
      if (!isMainModule()) return; // Do not exit the process if imported as a module
      process.exit(0); // Exit the process if run directly
    }

    // Concatenate remaining arguments as the text to translate
    let textToTranslate = parsedArgs._.join(' ');

    // Paths for configuration files
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.config', 'tarjm');
    const configFile = path.join(configDir, 'config.json');

    // Ensure the configuration directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    /**
     * Reads the configuration from the config file.
     *
     * @returns {Object} The configuration object.
     */
    function readConfig() {
      if (fs.existsSync(configFile)) {
        try {
          const data = fs.readFileSync(configFile, 'utf-8');
          return JSON.parse(data);
        } catch (error) {
          console.error(chalk.red('Error reading config file:'), error.message);
          return {};
        }
      }
      return {};
    }

    /**
     * Writes the configuration to the config file.
     *
     * @param {Object} config - The configuration object to write.
     */
    function writeConfig(config) {
      try {
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
      } catch (error) {
        console.error(chalk.red('Error writing config file:'), error.message);
      }
    }

    // Handle setting the default language
    if (setDefaultLanguage) {
      const config = readConfig();
      config.defaultLanguage = setDefaultLanguage;
      writeConfig(config);
      console.log(chalk.green(`Default language set to: ${setDefaultLanguage}`));

      // Exit if no text or file is provided after setting default language
      if (!textToTranslate && !filePath) {
        if (!isMainModule()) return;
        process.exit(0);
      }
    }

    // Determine the target language for translation
    let targetLanguage = 'en'; // Default to English if not specified

    if (specifiedLanguage) {
      targetLanguage = specifiedLanguage;
    } else {
      const config = readConfig();
      if (config.defaultLanguage) {
        targetLanguage = config.defaultLanguage;
      }
    }

    // Read text from file if '--file' or '-f' option is used
    if (filePath) {
      try {
        if (!fs.existsSync(filePath)) {
          console.error(chalk.red(`File not found: ${filePath}`));
          if (!isMainModule()) throw new Error(`File not found: ${filePath}`);
          process.exit(1);
        }
        textToTranslate = fs.readFileSync(filePath, 'utf-8');
      } catch (error) {
        console.error(chalk.red('Error reading file:'), error.message);
        if (!isMainModule()) throw error;
        process.exit(1);
      }
    }

    // Check if text to translate is provided
    if (!textToTranslate.trim()) {
      console.error(chalk.red('Please provide text to translate.'));
      if (!isMainModule()) throw new Error('No text provided.');
      process.exit(1);
    }

    // Prepare the request payload for the translation API
    const requestBody = {
      q: textToTranslate,
      source: 'auto',
      target: targetLanguage,
      format: 'text',
      alternatives: 3,
      api_key: '' // Include API key if required by your server
    };

    // Perform the translation request
    try {
      const response = await fetch('http://tarjm:5000/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      // Handle non-OK HTTP responses
      if (!response.ok) {
        console.error(
          chalk.red(`Translation server responded with status ${response.status}: ${response.statusText}`)
        );
        if (!isMainModule()) throw new Error(`Server error: ${response.status}`);
        process.exit(1);
      }

      const data = await response.json();

      // Check if translation was successful
      if (data && data.translatedText) {
        console.log(chalk.cyan('Translated Text:\n'));
        console.log(chalk.bold(data.translatedText));
        return data.translatedText; // Return the translated text when used as a module
      } else {
        console.error(chalk.red('Translation failed. Response data:'), data);
        if (!isMainModule()) throw new Error('Translation failed.');
        process.exit(1);
      }
    } catch (error) {
      // Handle network or parsing errors
      console.error(chalk.red('Error during translation request:'), error.message);
      if (!isMainModule()) throw error;
      process.exit(1);
    }
  } catch (error) {
    // Catch any unexpected errors
    console.error(chalk.red('An unexpected error occurred:'), error.message);
    if (!isMainModule()) throw error;
    process.exit(1);
  }
}

// Execute the main function if the script is run directly
if (isMainModule()) {
  tarjm();
}
