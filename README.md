# Tarjm

**Tarjm** is a command-line tool and Node.js module for translating text from one language to another using a translation server. It allows you to translate text directly from the command line or integrate translation functionality into your Node.js applications.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Command-Line Interface (CLI)](#command-line-interface-cli)
    - [Examples](#examples)
  - [Node.js Module](#nodejs-module)
    - [Examples](#examples-1)
- [Configuration](#configuration)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
- [License](#license)

## Features

- Translate text between multiple languages.
- Set a default target language.
- Read text to translate from a file.
- Use as a CLI tool or integrate into Node.js scripts.
- Customizable via a configuration file.

## Installation

### Globally (For CLI Usage)

```bash
npm install -g tarjm
```

### Locally (For Module Usage)

In your project directory:

```bash
npm install tarjm
```

## Usage

### Command-Line Interface (CLI)

After installing globally, you can use `tarjm` directly in your terminal.

#### Syntax

```bash
tarjm [options] [text_to_translate]
```

#### Options

- `-d, --default <language>`  
  Set the default target language for translation. This setting is saved in the config file (`~/.config/tarjm/config.json`). If no text or file is provided, the script will exit after setting the default language.

- `-l, --language <language>`  
  Specify the target language for this translation. This option overrides the default language set in the config.

- `-f, --file <path>`  
  Read the text to translate from the specified file.

- `-h, --help`  
  Display the help message.

#### Examples

- **Translate Text to Default Language**

  ```bash
  tarjm "Hello World"
  ```

  Translates "Hello World" to the default language (or English if not set).

- **Translate Text to Specified Language**

  ```bash
  tarjm -l es "Hello World"
  ```

  Translates "Hello World" to Spanish.

- **Set Default Language**

  ```bash
  tarjm -d fr
  ```

  Sets the default language to French.

- **Translate Text from a File**

  ```bash
  tarjm -f mytext.txt
  ```

  Translates the content of `mytext.txt` to the default language.

- **Display Help Message**

  ```bash
  tarjm -h
  ```

  Displays the help message.

#### Output

The translated text will be displayed in the terminal:

```plaintext
Translated Text:

Hola Mundo
```

### Node.js Module

You can also use `tarjm` within your Node.js applications by importing it as a module.

#### Importing

```javascript
import { tarjm } from 'tarjm';
```

#### Syntax

```javascript
tarjm(args = process.argv.slice(2))
```

- `args`: An array of arguments similar to command-line arguments.

#### Examples

- **Basic Translation**

  ```javascript
  import { tarjm } from 'tarjm';

  async function translateText() {
    try {
      const translatedText = await tarjm(['Hello World']);
      console.log('Translated Text:', translatedText);
    } catch (error) {
      console.error('Error during translation:', error.message);
    }
  }

  translateText();
  ```

- **Translate to Specified Language**

  ```javascript
  import { tarjm } from 'tarjm';

  async function translateToSpanish() {
    try {
      const translatedText = await tarjm(['-l', 'es', 'Good morning']);
      console.log('Translated Text:', translatedText);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  translateToSpanish();
  ```

- **Set Default Language in Script**

  ```javascript
  import { tarjm } from 'tarjm';

  async function setDefaultLanguage() {
    try {
      await tarjm(['-d', 'de']);
      console.log('Default language set to German.');
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  setDefaultLanguage();
  ```

- **Translate Text from a File**

  ```javascript
  import { tarjm } from 'tarjm';

  async function translateFromFile() {
    try {
      const translatedText = await tarjm(['-f', 'mytext.txt']);
      console.log('Translated Text:', translatedText);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  translateFromFile();
  ```

#### Handling Errors

When using as a module, ensure to handle errors appropriately using `try...catch` blocks, as shown in the examples.

## Configuration

The configuration file is located at `~/.config/tarjm/config.json`. It stores the default target language.

### Setting the Default Language

- **Via CLI**

  ```bash
  tarjm -d <language_code>
  ```

  Example:

  ```bash
  tarjm -d es
  ```

- **Programmatically**

  ```javascript
  import { tarjm } from 'tarjm';

  async function setDefaultLanguage() {
    await tarjm(['-d', 'es']);
  }

  setDefaultLanguage();
  ```

### Config File Structure

```json
{
  "defaultLanguage": "es"
}
```

## Dependencies

- [Node.js](https://nodejs.org/) v12 or higher
- [node-fetch](https://www.npmjs.com/package/node-fetch)
- [minimist](https://www.npmjs.com/package/minimist)
- [chalk](https://www.npmjs.com/package/chalk)

Ensure your environment has access to a translation server at `http://tarjm:5000/translate`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/yourusername/tarjm).

### Development Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/tarjm.git
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Link the Package Locally**

   ```bash
   npm link
   ```

4. **Test the CLI**

   ```bash
   tarjm -h
   ```

5. **Run Tests**

   (Add your testing commands here)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---