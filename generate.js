require('dotenv').config(); // This line loads the environment variables from the .env file

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { keccak256 } = require('js-sha3');
const BASE = require('base-x');
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const base58 = BASE(BASE58);
const util = require('util');
const execPromise = util.promisify(exec);

const baseFolder = process.argv[2]; // Base folder path from command line argument
const svgFolder = path.join(baseFolder, 'svgs');
const hashesFilePath = path.join(baseFolder, 'hashes.txt');
const encodedHashesFilePath = path.join(baseFolder, 'encoded-hashes.txt');
const keccakHashesFilePath = path.join(baseFolder, 'keccak-hashes.txt'); // Path for Keccak hashes file

function encodeIpfsUri(cid) {
    return '0x' + Buffer.from(base58.decode(cid).slice(2)).toString('hex');
}

async function clearOrCreateFile(file) {
    // Clears the file if it exists or creates it if it doesn't
    await fs.writeFile(file, '');
}

if (!baseFolder) {
    console.error('Error: No base folder path provided. Please provide the path as a command line argument.');
    process.exit(1);
}

async function uploadFiles(files) {
    for (const file of files) { 
        if (path.extname(file) !== '.svg') continue;
        const filePath = path.join(svgFolder, file);
        console.log(`Uploading ${filePath}...`);
        const curlCommand = `curl -X POST -F file=@${filePath} ` +
                            `-u "${process.env.IPFS_KEY}:${process.env.IPFS_SECRET}" ` +
                            `"https://ipfs.infura.io:5001/api/v0/add"`;

        try {
            const { stdout } = await execPromise(curlCommand);
            const response = JSON.parse(stdout);
            if (response.Hash) {
                await fs.appendFile(hashesFilePath, response.Hash + '\n');
                console.log(`Hash for ${file} written to file: ${response.Hash}`);
                // Write the encoded hash to file
                const encodedHash = encodeIpfsUri(response.Hash);
                await fs.appendFile(encodedHashesFilePath, encodedHash + '\n');
                console.log(`Encoded hash ${encodedHash} written to ${encodedHashesFilePath}`);
                const content = await fs.readFile(filePath);
                const keccakHash = keccak256(content);
                await fs.appendFile(keccakHashesFilePath, keccakHash + '\n');
                console.log(`Keccak hash for ${file} written to file: ${keccakHash}`);
            } else {
                console.log(`No Hash found in response for ${file}`);
            }
        } catch (error) {
          console.error(`Error uploading ${file}:`, error);
        }
    }
}

async function main() {
    if (!baseFolder) {
        console.error('Error: No base folder path provided. Please provide the path as a command line argument.');
        process.exit(1);
    }

    try {
        // Clear or create the files at the start
        await clearOrCreateFile(hashesFilePath);
        await clearOrCreateFile(encodedHashesFilePath);
        await clearOrCreateFile(keccakHashesFilePath); 

        const files = await fs.readdir(svgFolder);
        await uploadFiles(files);
    } catch (err) {
        console.error('Error reading the assets directory or processing files:', err);
    }
}

main();


