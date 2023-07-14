import { MAX_FILE_SIZE } from "$lib/const";
import { $uploads, files, hashes } from "$lib/db";
import { json, type RequestHandler } from "@sveltejs/kit";
import { createSHA256 } from 'hash-wasm';
import fs from 'node:fs/promises';

async function calculateSHA256(file: File) {
    const hasher = await createSHA256()

    const hasherStream = new WritableStream<Uint8Array>({
        start: () => {
            hasher.init()
            // you can set UI state here also
        },
        write: chunk => {
            hasher.update(chunk)
            // you can set UI state here also
        },
        close: () => {
            // you can set UI state here also
        },
    })

    await file.stream().pipeTo(hasherStream)

    return hasher.digest('hex')
}

function randomString(length: number, current?: string): string {
    current = current ? current : '';
    return length ? randomString(--length, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 60)) + current) : current;
}


export const POST: RequestHandler = async ({ request }) => {

    let form: { file: File };

    try {

        form = Object.fromEntries(await request.formData()) as { file: File };

    } catch (e) {
        return json({
            error: true,
            message: 'Not valid input'
        }, {
            status: 400
        })
    }

    if (!form || !form.file) {
        return json({
            error: true,
            message: 'Not valid input'
        }, {
            status: 400
        })
    }

    console.log("---FILE UPLOAD---")

    if (form.file.size > MAX_FILE_SIZE) {
        return json({
            error: true,
            message: 'Max file size reached'
        }, {
            status: 400
        })
    }

    const hash = await calculateSHA256(form.file);
    console.log("hash?", hash)

    const $file = $uploads.openFile(hash, { autoCreate: false });

    files.create();

    // someone already uploaded file
    if ($file.exists) {
        console.log("hash already exists")
        // Just store new file data
        let doc = await files.insert({
            id: randomString(10),
            hash: hash,
            fileName: form.file.name,
            type: form.file.type,
            size: form.file.size,
        })

        // update time for file
        await hashes.updateFirst({
            hash: hash
        }, {
            createdAt: new Date()
        })

        return json({
            error: false,
            message: 'Found',
            data: {
                id: doc.id,
            }
        })
    }

    $file.create();
    const arrayBuffer = await form.file.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile($file.absolutePath, buffer);

    let doc = await files.insert({
        id: randomString(10),
        hash: hash,
        fileName: form.file.name,
        type: form.file.type,
        size: form.file.size,
    })

    let hashDoc = await hashes.insert({
        hash: hash,
        createdAt: Date.now()
    })

    console.log("doc?", doc);
    console.log("hashDoc?", hashDoc);
    console.log("-----")

    return json({
        error: false,
        message: 'Uploaded',
        data: {
            id: doc.id
        }
    });
};