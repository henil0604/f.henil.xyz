import { hashes, files, $uploads } from "$lib/db";
import { json, type RequestHandler } from "@sveltejs/kit";
import fs from 'node:fs/promises';

export const GET: RequestHandler = async ({ request, params }) => {

    const id = params.id!;

    console.log("---GET FILE---")

    console.log("id?", id);

    const doc = await files.getFirst({
        id
    })

    console.log("doc?", doc);

    if (!doc) {
        return json({
            error: true,
            message: 'File not found'
        }, {
            status: 404
        })
    }

    const hashDoc = await hashes.getFirst({
        hash: doc.hash
    })

    console.log("hashDoc?", hashDoc);

    if (!hashDoc) {
        return json({
            error: true,
            message: 'File not found'
        }, {
            status: 404
        })
    }

    const $file = $uploads.openFile(doc.hash, { autoCreate: false });

    if (!$file.exists) {
        return json({
            error: true,
            message: 'File not found'
        }, {
            status: 404
        })
    }

    const buffer = await fs.readFile($file.absolutePath);

    console.log("-----");

    return new Response(
        buffer,
        {
            status: 200,
            headers: {
                'Content-Type': doc.type ?? 'application/octet-stream',
                'Content-Disposition':
                    // Use filename* instead of filename to support non-ASCII characters
                    `attachment; filename*=UTF-8''${encodeURIComponent(doc.fileName ?? doc.hash)}`,
            },
        }
    );
};