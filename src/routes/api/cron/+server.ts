import { json, type RequestHandler } from "@sveltejs/kit";
import { files, hashes, $uploads } from '$lib/db';

export const GET: RequestHandler = async ({ request }) => {

    const allHashes = await hashes.getAll();

    const LifeSpan = 1000 * 60 * 60 * 12 // 12 Hours
    // const LifeSpan = 1000 * 60 * 60 // 1 Hour
    // const LifeSpan = 1000 * 60 // 1 Minute
    // const LifeSpan = 1000 * 10 // 10 Seconds

    console.log("---EXISTENCE CHECK---")

    let deletedHashes: {
        hash: string,
        createdAt: number,
        files?: {
            id: string,
            fileName: string,
            type: string,
            size: number
        }[]
    }[] = []

    for (const hashDoc of allHashes) {
        let { hash, createdAt: createdAtTimestamp } = hashDoc;
        console.log("checking for:", hash);

        let createdAt = new Date(createdAtTimestamp).getTime();

        const expiresAt = createdAt + (LifeSpan);

        if (Date.now() >= expiresAt) {
            console.log("deleting:", hash);
            // Delete hash

            let deletedFilesDoc = await files.deleteMany({
                hash
            });

            await hashes.deleteFirst({
                hash
            })

            let $f = $uploads.openFile(hash, { autoCreate: false });

            if ($f.exists) {
                await $f.delete()
            }

            deletedHashes.push({
                hash,
                createdAt,
                files: deletedFilesDoc
            })
        }
    }

    console.log("-----")
    return json(deletedHashes);
};