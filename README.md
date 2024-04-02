1. Add .env variables specifying your IPFS pinning server.
2. Make a new folder in `editions/`.
3. Inside this new folder, an `svgs/` folder. Stick all .svg files that make up the drop inside.
4. Run `node generate.js editions/<folder>`, replacing `<folder>` with the name of the folder you created in step 1.

The hashes.txt file in your edition folder should now contain all IPFS hashes, and the encoded-hashes.txt file should contain all of the encoded IPFShashes in the same order as the .svgs are listed in the svgs folder.
